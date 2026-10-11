"""Offline security-boundary regressions. Synthetic credentials; no DuckDNS calls."""
from pathlib import Path
import json, os, shutil, subprocess, tempfile, unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'deploy/project-control-center-duckdns-update.sh'
SYNTHETIC = 'OFFLINE_SYNTHETIC_TOKEN_012345'

class DuckDNSBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='pcc-dns-test-')
        self.work = Path(self.tmp.name)
        self.creds = self.work/'creds'; self.creds.mkdir()
        self.token = self.creds/'duckdns_token'; self.token.write_text(SYNTHETIC+'\n')
        self.record = self.work/'record.json'
        mock = self.work/'curl'
        mock.write_text("""#!/usr/bin/env python3
import json,os,sys
from pathlib import Path
body=sys.stdin.read()
Path(os.environ['PCC_TEST_RECORD']).write_text(json.dumps({'argv':sys.argv[1:],'stdin_matches':body==os.environ['PCC_TEST_EXPECTED'],'secret_in_environment':body in os.environ.values() if body else False}))
print(os.environ.get('PCC_TEST_RESPONSE','OK'))
sys.exit(int(os.environ.get('PCC_TEST_CURL_EXIT','0')))
""")
        mock.chmod(0o700)
        self.env = os.environ.copy()
        self.env.update(PATH=str(self.work)+os.pathsep+self.env['PATH'], CREDENTIALS_DIRECTORY=str(self.creds), PCC_DUCKDNS_IPV4='198.51.100.7', PCC_TEST_RECORD=str(self.record), PCC_TEST_EXPECTED=SYNTHETIC)
        # Expected marker must not be in the child environment when proving isolation.
        # Mock gets a digest-only expectation instead of the credential itself.
        text = mock.read_text().replace("body==os.environ['PCC_TEST_EXPECTED']", "__import__('hashlib').sha256(body.encode()).hexdigest()==os.environ['PCC_TEST_EXPECTED_HASH']")
        mock.write_text(text)
        self.env.pop('PCC_TEST_EXPECTED')
        self.env['PCC_TEST_EXPECTED_HASH'] = __import__('hashlib').sha256(SYNTHETIC.encode()).hexdigest()
    def tearDown(self):
        self.tmp.cleanup()
    def run_script(self, domain='projectcontrolcenter', trace=False):
        self.record.unlink(missing_ok=True)
        cmd = ['bash'] + (['-ax'] if trace else []) + [str(SCRIPT),domain]
        p = subprocess.run(cmd,env=self.env,capture_output=True,text=True,timeout=5)
        record = json.loads(self.record.read_text()) if self.record.exists() else None
        self.assertNotIn(SYNTHETIC,p.stdout+p.stderr)
        return p,record
    def assert_no_call(self):
        p,r=self.run_script()
        self.assertNotEqual(0,p.returncode); self.assertIsNone(r)
    def test_success_uses_stdin_without_secret_arguments_or_environment(self):
        p,r=self.run_script()
        self.assertEqual(0,p.returncode); self.assertTrue(r['stdin_matches'])
        self.assertFalse(r['secret_in_environment'])
        self.assertNotIn(SYNTHETIC,' '.join(r['argv']))
        self.assertIn('token@-',r['argv']); self.assertIn('ip=198.51.100.7',r['argv'])
        self.assertEqual('--disable',r['argv'][0])
    def test_missing_approved_address_fails_before_curl(self):
        self.env.pop('PCC_DUCKDNS_IPV4'); self.assert_no_call()
    def test_malformed_addresses_fail_before_curl(self):
        for ip in ['','hostname','::1','1.2.3','1.2.3.4.5','256.2.3.4','01.2.3.4','1.2.3.-4',' 1.2.3.4','1.2.3.4\n','1.2.3.4;false','1.2.3.4/24']:
            with self.subTest(ip=ip):
                self.env['PCC_DUCKDNS_IPV4']=ip; self.assert_no_call()
    def test_ipv4_octet_boundaries_are_preserved(self):
        for ip in ['198.51.100.0','198.51.100.255']:
            with self.subTest(ip=ip):
                self.env['PCC_DUCKDNS_IPV4']=ip;p,r=self.run_script()
                self.assertEqual(0,p.returncode);self.assertIn('ip='+ip,r['argv']);self.assertNotIn('ip=',r['argv'])
    def test_wrong_domain_fails_before_curl(self):
        p,r=self.run_script('other');self.assertEqual(64,p.returncode);self.assertIsNone(r)
    def test_missing_credentials_directory_fails_before_curl(self):
        self.env.pop('CREDENTIALS_DIRECTORY'); self.assert_no_call()
    def test_missing_credential_fails_before_curl(self):
        self.token.unlink();self.assert_no_call()
    def test_invalid_credentials_fail_before_curl(self):
        for value in ['', 'contains space', 'multi\nline', 'quote"', 'x'*257]:
            with self.subTest(length=len(value)):
                self.token.write_text(value);self.assert_no_call()
    def test_crlf_credential_is_normalized_without_exposure(self):
        self.token.write_bytes((SYNTHETIC+'\r\n').encode());p,r=self.run_script()
        self.assertEqual(0,p.returncode);self.assertTrue(r['stdin_matches'])
    def test_provider_ko_is_failure(self):
        self.env['PCC_TEST_RESPONSE']='KO';p,r=self.run_script()
        self.assertEqual(1,p.returncode);self.assertTrue(r['stdin_matches'])
    def test_curl_transport_failure_is_failure(self):
        self.env['PCC_TEST_CURL_EXIT']='22';p,r=self.run_script()
        self.assertEqual(22,p.returncode);self.assertTrue(r['stdin_matches'])
    def test_network_and_unit_budgets_are_explicit(self):
        p,r=self.run_script();self.assertEqual(0,p.returncode)
        a=r['argv'];self.assertEqual('10',a[a.index('--connect-timeout')+1]);self.assertEqual('30',a[a.index('--max-time')+1])
        self.assertIn('TimeoutStartSec=45s',(ROOT/'deploy/project-control-center-duckdns.service').read_text())
    def test_inherited_tracing_and_export_all_do_not_expose_secret(self):
        p,r=self.run_script(trace=True);self.assertEqual(0,p.returncode);self.assertFalse(r['secret_in_environment'])
    def test_inherited_exported_token_is_not_propagated(self):
        self.env['token']=SYNTHETIC;p,r=self.run_script();self.assertEqual(0,p.returncode);self.assertFalse(r['secret_in_environment'])
    def test_unit_requires_separate_approved_host_config(self):
        text=(ROOT/'deploy/project-control-center-duckdns.service').read_text()
        self.assertIn('EnvironmentFile=/etc/project-control-center/duckdns-host.env',text)
        self.assertIn('LoadCredential=duckdns_token:',text)
        self.assertNotIn(SYNTHETIC,text)
    def test_programme_and_page_pin_same23_item_source(self):
        pin='/blob/48e86826275922f9707389acda66b571391140e4/control-plane/assignments/project-control-center.json'
        self.assertIn(pin,(ROOT/'docs/WEBSITE-PRODUCTION-PROGRAM.md').read_text())
        self.assertIn(pin,(ROOT/'website.html').read_text())

    def test_real_curl_stdin_transport_on_loopback_only(self):
        # Exercise actual curl's token@- behavior, not the mock's interpretation.
        from http.server import BaseHTTPRequestHandler, HTTPServer
        from threading import Thread
        from urllib.parse import urlsplit, parse_qs
        seen=[]
        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                seen.append(parse_qs(urlsplit(self.path).query))
                self.send_response(200);self.end_headers();self.wfile.write(b'OK')
            def log_message(self,*args):
                pass
        server=HTTPServer(('127.0.0.1',0),Handler)
        thread=Thread(target=server.serve_forever,daemon=True);thread.start()
        try:
            # Loopback is intentionally HTTP for this transport-only test.
            # The production template still enforces HTTPS to DuckDNS.
            p=subprocess.run(['/usr/bin/curl','--disable','--fail','--silent','--show-error','--noproxy','*','--connect-timeout','2','--max-time','4','--get','--data-urlencode','domains=projectcontrolcenter','--data-urlencode','token@-','--data-urlencode','ip=198.51.100.7',f'http://127.0.0.1:{server.server_port}/update'],input=SYNTHETIC,capture_output=True,text=True,timeout=5)
            self.assertEqual(0,p.returncode,p.stderr);self.assertEqual('OK',p.stdout)
            self.assertEqual([SYNTHETIC],seen[0]['token'])
            self.assertEqual(['198.51.100.7'],seen[0]['ip'])
            self.assertNotIn(SYNTHETIC,p.stdout+p.stderr)
        finally:
            server.shutdown();thread.join(timeout=2);server.server_close()

if __name__=='__main__': unittest.main(verbosity=2)
