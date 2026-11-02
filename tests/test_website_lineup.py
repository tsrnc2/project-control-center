"""Offline checks for the bounded planning page; not production acceptance."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import unittest

ROOT = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.elements = []
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))

class WebsiteLineupTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = (ROOT/'website.html').read_text()
        cls.page = Page(cls.source)
    def test_unique_ids(self):
        ids = [a['id'] for _, a in self.page.elements if 'id' in a]
        self.assertEqual(len(ids), len(set(ids)))
    def test_complete_tiered_lineup(self):
        tasks = [a for t,a in self.page.elements if t=='details']
        self.assertEqual([f'PCC-WEB-{i:03d}' for i in range(1,24)], [a['id'] for a in tasks])
        self.assertEqual(['T7','T7','T6','T7','T7','T6','T6','T6','T7','T7','T6','T6','T6','T6','T7','T6','T6','T6','T7','T6','T5','T7','T6'], [a['data-worker-tier'] for a in tasks])
        self.assertTrue(all(a['data-reviewer-tier']=='T7' for a in tasks))
    def test_explicit_non_live_status(self):
        for text in ['NOT production ready','pinned planning summary','does not refresh task or lease state','Owner: unassigned. ETA: not estimated.']:
            self.assertIn(text, self.source)
    def test_no_script_form_or_embedded_credentials(self):
        self.assertFalse(any(t in {'script','form','input','iframe','object','embed'} for t,_ in self.page.elements))
        self.assertFalse(any(k.lower().startswith('on') for _,a in self.page.elements for k in a))
        for marker in ('ghp_', 'github_pat_', 'localStorage', 'Authorization:'):
            self.assertNotIn(marker,self.source)
    def test_safe_links_and_local_anchors(self):
        ids = {a['id'] for _,a in self.page.elements if 'id' in a}
        for _,a in self.page.elements:
            for key in ('href','src'):
                if key not in a: continue
                value = a[key]
                self.assertIn(urlsplit(value).scheme, ('','https'))
                self.assertNotIn('token=',value)
                if value.startswith('#'): self.assertIn(value[1:], ids)
    def test_pinned_provenance_and_reuse(self):
        self.assertIn('/blob/48e86826275922f9707389acda66b571391140e4/control-plane/assignments/project-control-center.json', self.source)
        self.assertIn('Existing dashboard PR 14',self.source)
        self.assertIn('LRP PR 111 and KITT PR 10',self.source)
        self.assertIn('Resolve the existing KITT keyword-index work',self.source)
    def test_duckdns_is_proposed_not_claimed(self):
        self.assertIn('projectcontrolcenter.duckdns.org', self.source)
        self.assertIn('Registration is not claimed', self.source)
        self.assertIn('Blocked: provider auth + approved host', self.source)
        self.assertNotIn('duckdns.org/update?domains=', self.source)

    def test_index_navigation_preserves_existing_panels(self):
        page = Page((ROOT/'index.html').read_text())
        links = [a for t,a in page.elements if t=='a' and a.get('id')=='website-lineup']
        self.assertEqual(1,len(links))
        self.assertEqual('./website.html',links[0]['href'])
        ids = {a.get('id') for _,a in page.elements}
        self.assertTrue({name+'-panel' for name in ('projects','tasks','blockers','reviews','activity','github','robots')}.issubset(ids))
    def test_accessible_primitives(self):
        self.assertTrue(any(t=='html' and a.get('lang')=='en' for t,a in self.page.elements))
        self.assertTrue(any(t=='a' and a.get('class')=='skip' for t,a in self.page.elements))
        self.assertEqual(23,sum(t=='summary' for t,_ in self.page.elements))
        self.assertEqual(1,sum(t=='h1' for t,_ in self.page.elements))
        self.assertIn(':focus-visible',(ROOT/'assets/website.css').read_text())

if __name__ == '__main__': unittest.main(verbosity=2)
