#!/usr/bin/env python3
"""Offline browser fixtures; no live/private repository data or write requests.
Run: python tests/browser_smoke.py [output-directory]
Requires Playwright and Chromium (CHROMIUM_BIN or a Playwright-installed browser).
"""
import json
import os
from pathlib import Path
import shutil
import sys
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'test-output'
OUT.mkdir(parents=True, exist_ok=True)
BASE = datetime(2026, 9, 28, 0, 0, tzinfo=timezone.utc)
def stamp(minutes=0):
    return (BASE + timedelta(minutes=minutes)).isoformat().replace('+00:00', 'Z')

snapshot = {
    'tracker': {'generated_at': stamp()},
    'projects': [
        {'id':'kitt','name':'KITT','lifecycle':'ACTIVE'},
        {'id':'llm-reasoning-project','name':'LLM Reasoning Project','lifecycle':'ACTIVE'},
        {'id':'empty-project','name':'Project with no loaded tasks','lifecycle':'TRACKED'}],
    'tasks': [
        {'id':'current','project_id':'kitt','title':'Current execution with a recorded forecast','state':'RUNNING','priority':'P1',
         'claimed_by':'fixture-worker','claim_expires_at':stamp(120),'started_at':stamp(-90),'last_progress_at':stamp(-5),'updated_at':stamp(-1),
         'lease':{'state':'ACTIVE','agent_id':'fixture-worker','expires_at':stamp(30),'heartbeat_at':stamp(-2)},
         'estimate':{'earliest_finish_at':stamp(60),'latest_finish_at':stamp(120),'estimated_at':stamp(-20),'estimated_by':'fixture-estimator','basis':'Synthetic test evidence, not a real forecast','assumptions':['Fixture only']},
         'next_action':'Validate the bounded candidate, then obtain independent review.'},
        {'id':'expired','project_id':'kitt','title':'Expired execution evidence','state':'CLAIMED','priority':'P1','claimed_by':'fixture-worker-2',
         'claim_expires_at':stamp(-1),'updated_at':stamp(-2),'started_at':stamp(-120),'deadline_at':stamp(-30),
         'lease':{'state':'ACTIVE','agent_id':'fixture-worker-2','expires_at':stamp(-1)},'next_action':'Reconcile execution ownership without assuming work finished.'},
        {'id':'review','project_id':'kitt','title':'Awaiting independent review','state':'BLOCKED','priority':'P1','updated_at':stamp(-10),'next_action':'An eligible independent reviewer must inspect the exact candidate.'},
        {'id':'current','project_id':'llm-reasoning-project','title':'Same task ID in a different project','state':'READY','priority':'P2','updated_at':stamp(-30)},
        {'id':'done','project_id':'kitt','title':'Completed task with unknown completion time','state':'DONE','updated_at':stamp(-40)},
        {'id':'bad','project_id':'kitt','title':'Unsafe <img src=x onerror="window.__xss=1"> text','state':'READY','started_at':'2026-02-30T00:00:00Z','updated_at':stamp(-50),'issue_url':'javascript:window.__xss=2'}],
    'blockers':[{'id':'B1','project_id':'kitt','task_id':'expired','state':'OPEN','severity':'HIGH','summary':'Ownership needs reconciliation','opened_at':stamp(-90),'updated_at':stamp(-10),'required_next_action':'Read current evidence before any takeover.','resolver':'fixture-coordinator'}],
    'activity':[{'at':stamp(-30),'project_id':'kitt','type':'FIXTURE','summary':'Synthetic coordination event — not live activity'}]
}
issues = [
    {'number':1,'title':'[TASK] Older Issue must not regress current state','state':'open','updated_at':stamp(-180),'created_at':stamp(-200),'labels':[{'name':'type:task'},{'name':'state:ready'},{'name':'project:kitt'}],
     'body':'### Task ID\ncurrent\n\n### Owner\nwrong-owner','html_url':'https://github.com/tsrnc2/project-control-center/issues/1'},
    {'number':2,'title':'[REVIEW] Fixture independent review request','state':'open','updated_at':stamp(-30),'labels':[],
     'body':'### Project ID\nkitt\n\n### Parent task ID\nreview\n\n### Primary reviewer role\nsecurity-reviewer\n\n### Reviewer independence\nRequired',
     'html_url':'https://github.com/tsrnc2/project-control-center/issues/2'},
    {'number':3,'title':'[TASK] Closed issue is not READY','state':'closed','state_reason':'completed','updated_at':stamp(-10),'labels':[{'name':'state:ready'}],
     'body':'### Project ID\nkitt\n\n### Task ID\nclosed-issue','html_url':'https://github.com/tsrnc2/project-control-center/issues/3'}]

mode = {'snapshot':'live','issues':'ok'}
requests, errors, checks = [], [], []
def check(name, condition):
    assert condition, name
    checks.append(name)

with sync_playwright() as pw:
    executable = os.environ.get('CHROMIUM_BIN') or shutil.which('chromium')
    browser = pw.chromium.launch(headless=True, **({'executable_path':executable} if executable else {}), args=['--no-sandbox'])
    context = browser.new_context(viewport={'width':1365,'height':1000})
    freeze_script = f'''window.__now={int(BASE.timestamp()*1000)};
      const RealDate=Date; window.Date=class extends RealDate {{constructor(...args){{super(...(args.length?args:[window.__now]));}} static now(){{return window.__now;}}}};'''
    def route_handler(route):
        u = urlparse(route.request.url)
        requests.append((route.request.method, u.netloc, u.path))
        if u.hostname in ['raw.githubusercontent.com','pcc-fixture.invalid'] and u.path.endswith('/state.json'):
            live = '/live/' in u.path
            if mode['snapshot']=='fail' or (mode['snapshot']=='fallback' and live):
                route.fulfill(status=503, headers={'Access-Control-Allow-Origin':'*'}, body='unavailable'); return
            data = {'projects':'malformed'} if mode['snapshot']=='malformed' else snapshot
            route.fulfill(status=200,content_type='application/json',headers={'Access-Control-Allow-Origin':'*'},body=json.dumps(data)); return
        if u.hostname == 'api.github.com' and u.path.endswith('/issues'):
            if mode['issues']=='fail': route.fulfill(status=503,headers={'Access-Control-Allow-Origin':'*'},body='unavailable'); return
            headers = {'Link':'<https://api.github.com/repos/tsrnc2/project-control-center/issues?page=999>; rel="next"'} if mode['issues']=='limited' else {}
            headers.update({'Access-Control-Allow-Origin':'*','Access-Control-Expose-Headers':'Link'})
            route.fulfill(status=200,content_type='application/json',headers=headers,body=json.dumps([] if mode['issues']=='limited' else issues)); return
        route.abort()
    context.route('**/*', route_handler)
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    def settled(p=page):
        p.wait_for_function("!document.getElementById('refresh').disabled && document.getElementById('source-status').textContent.includes('Issues last successful read:')")
    def refresh():
        page.locator('#refresh').click(); settled()
    def tasks():
        page.locator('[data-panel="tasks-panel"]').click()
    def bootstrap(p):
        # In-memory document rendering respects the environment's network policy.
        # These are offline app fixtures, not HTTP-navigation/deployment tests.
        html = (ROOT/'index.html').read_text()
        assert html.index('dashboard-model.js') < html.index('assets/app.js')
        html = html.replace('<head>', '<head><base href="https://pcc-fixture.invalid/">')
        html = html.replace('<link rel="stylesheet" href="./assets/style.css">','')
        for asset in ['dashboard-model.js','app.js']:
            html = html.replace(f'<script src="./assets/{asset}" defer></script>','')
        p.set_content(html)
        p.evaluate("() => { " + freeze_script + " }")
        p.add_style_tag(path=str(ROOT/'assets/style.css'))
        p.add_script_tag(path=str(ROOT/'assets/dashboard-model.js'))
        p.add_script_tag(path=str(ROOT/'assets/app.js'))
    bootstrap(page); settled()
    check('fresh lock count excludes expired claims',page.locator('#metric-running').inner_text()=='1')
    check('empty project does not look complete','coverage unknown' in page.locator('#projects').inner_text())
    tasks()
    check('composite task identity survives merge',page.locator('.task-card').count()==7)
    check('older issue cannot regress current RUNNING task','Current execution with a recorded forecast' in page.locator('#tasks').inner_text())
    check('unknown ETA is explicit','Not estimated' in page.locator('#tasks').inner_text())
    check('valid forecast window shown','Estimated window' in page.locator('#tasks').inner_text())
    check('expired claim warning shown','claim expired' in page.locator('#tasks').inner_text())
    check('missing blocker is coverage warning','No matching blocker in loaded data' in page.locator('#tasks').inner_text())
    check('invalid timestamp is not a real date','Invalid timestamp' in page.locator('#tasks').inner_text())
    check('unsafe text creates no image',page.locator('#tasks img').count()==0 and page.evaluate('window.__xss') is None)
    check('unsafe href suppressed',page.locator('a[href^="javascript:"]').count()==0)
    page.locator('#scope-filter').select_option('llm-reasoning-project')
    check('project filter narrows tasks',page.locator('.task-card').count()==1)
    page.locator('[data-panel="blockers-panel"]').click()
    check('project filter narrows blockers',page.locator('#blockers .row').count()==0)
    page.locator('[data-panel="reviews-panel"]').click()
    check('project filter narrows reviews',page.locator('#reviews .row').count()==0)
    page.locator('#scope-filter').select_option('kitt'); tasks()
    page.locator('#task-filter').select_option('RUNNING')
    check('task and project filters compose',page.locator('.task-card').count()==1)
    page.locator('#search').fill('fixture-worker')
    check('search and filters compose',page.locator('.task-card').count()==1)
    page.locator('#search').fill(''); page.locator('#task-filter').select_option('')
    page.locator('#attention-only').check()
    check('attention filter includes blocked and expired tasks',page.locator('.task-card').count()==2)
    page.locator('#attention-only').uncheck()
    page.locator('#timezone').select_option('UTC')
    check('timezone selection changes visible dates','UTC' in page.locator('#tasks').inner_text())
    page.locator('#timezone').select_option('America/Los_Angeles')
    page.locator('details[data-task-key]').first.locator('summary').click()
    page.evaluate('window.__now += 60000'); refresh()
    check('refresh preserves open details',page.locator('details[data-task-key][open]').count()==1)
    before = page.locator('#source-status').text_content().split('Issues last successful read: ')[1].split('. Freshness')[0]
    mode['issues']='fail'; page.evaluate('window.__now += 60000'); refresh()
    after = page.locator('#source-status').text_content().split('Issues last successful read: ')[1].split('. Freshness')[0]
    check('failed Issues refresh preserves successful timestamp',before==after)
    check('failed Issues refresh shows error','Issues read failed' in page.locator('#error').inner_text())
    check('failed Issues refresh retains review data',page.locator('#reviews .row').count()==1)
    mode['issues']='ok'; mode['snapshot']='fallback'; refresh()
    check('fallback clearly disclosed','Fallback snapshot' in page.locator('#error').inner_text())
    check('fallback cannot claim current execution',page.locator('#metric-running').inner_text()=='—')
    old = page.locator('#freshness').inner_text(); mode['snapshot']='fail'; refresh()
    check('failed snapshot retains original record time',page.locator('#freshness').inner_text()==old)
    check('failed snapshot disclosed','Snapshot read failed' in page.locator('#error').inner_text())
    mode['snapshot']='malformed'; refresh()
    check('malformed snapshots rejected without crashing','Snapshot read failed' in page.locator('#error').inner_text())
    mode['snapshot']='live'; mode['issues']='limited'; count_before=len(requests); refresh()
    check('bounded pagination discloses incomplete coverage','latest 300 entries' in page.locator('#error').inner_text())
    check('pagination capped at three Issue requests',sum(1 for _,host,path in requests[count_before:] if host=='api.github.com' and path.endswith('/issues'))==3)
    mode['issues']='ok'; page.evaluate(f'window.__now={int(BASE.timestamp()*1000)+16*60000}'); refresh()
    check('old snapshot cannot look fresh after successful retrieval','stale' in page.locator('#error').inner_text() and page.locator('#metric-running').inner_text()=='—')
    page.evaluate(f'window.__now={int(BASE.timestamp()*1000)}'); refresh()
    page.locator('#scope-filter').select_option(''); page.locator('[data-panel="projects-panel"]').click()
    page.locator('button[data-project="kitt"]').click()
    check('project drilldown selects the task view',page.locator('#tasks-panel').is_visible() and page.locator('#scope-filter').input_value()=='kitt')
    page.evaluate("document.querySelector('.eyebrow').textContent='TEST FIXTURE — NOT LIVE DATA'")
    page.screenshot(path=str(OUT/'desktop-preview.png'),full_page=True)
    for width in [390,320]:
        page.set_viewport_size({'width':width,'height':844})
        page.locator('#filter-options').evaluate('(el) => { el.open=false; }')
        for panel in ['projects','tasks','blockers','reviews','activity','github','robots']:
            page.locator(f'[data-panel="{panel}-panel"]').click()
            check(f'{width}px {panel} has no page overflow',page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'))
        tasks()
        if width==390: page.screenshot(path=str(OUT/'mobile-preview.png'),full_page=True)
    page.locator('#refresh').focus()
    check('keyboard focus remains visible/usable',page.evaluate('document.activeElement.id')=='refresh')
    # Complete outage on first load must not render zeros as proof of health.
    mode['snapshot']='fail'; mode['issues']='fail'
    empty = context.new_page(); empty.on('pageerror',lambda e:errors.append(str(e)))
    bootstrap(empty); settled(empty)
    check('total outage keeps unknown project/lock counts',empty.locator('#metric-projects').inner_text()=='—' and empty.locator('#metric-running').inner_text()=='—')
    check('total outage clearly says unavailable','unavailable' in empty.locator('#error').inner_text())
    check('all browser requests are reads',all(method=='GET' for method,_,_ in requests))
    check('no JavaScript runtime errors',not errors)
    browser.close()
result={'checks_passed':len(checks),'checks':checks,'runtime_errors':errors,'fixture_notice':'Synthetic data only; not evidence of live deployment, private integration, or independent review.'}
(OUT/'browser-results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
