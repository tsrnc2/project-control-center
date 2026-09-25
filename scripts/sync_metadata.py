#!/usr/bin/env python3
import json
import os
import urllib.parse
import urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
TOKEN=os.environ['GITHUB_TOKEN']
REPO=os.environ['GITHUB_REPOSITORY']
BASE=f'https://api.github.com/repos/{REPO}'

def api(method,path,payload=None):
    data=None if payload is None else json.dumps(payload).encode()
    req=urllib.request.Request(BASE+path,data=data,method=method)
    req.add_header('Accept','application/vnd.github+json')
    req.add_header('Authorization',f'Bearer {TOKEN}')
    req.add_header('X-GitHub-Api-Version','2022-11-28')
    if data is not None:
        req.add_header('Content-Type','application/json')
    with urllib.request.urlopen(req) as r:
        raw=r.read()
        return json.loads(raw) if raw else None

labels=json.loads((ROOT/'.github'/'labels.json').read_text())['labels']
existing={x['name']:x for x in api('GET','/labels?per_page=100')}
for label in labels:
    name=label['name']
    if name in existing:
        body={'new_name':name,'color':label['color'],'description':label.get('description','')}
        api('PATCH','/labels/'+urllib.parse.quote(name,safe=''),body)
        print('updated label',name)
    else:
        body={'name':name,'color':label['color'],'description':label.get('description','')}
        api('POST','/labels',body)
        print('created label',name)

milestones=json.loads((ROOT/'.github'/'milestones.json').read_text())['milestones']
existing_ms={x['title']:x for x in api('GET','/milestones?state=all&per_page=100')}
for ms in milestones:
    payload={'title':ms['title'],'description':ms.get('description',''),'state':ms.get('state','open')}
    old=existing_ms.get(ms['title'])
    if old:
        api('PATCH',f"/milestones/{old['number']}",payload)
        print('updated milestone',ms['title'])
    else:
        api('POST','/milestones',payload)
        print('created milestone',ms['title'])
