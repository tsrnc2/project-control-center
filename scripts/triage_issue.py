#!/usr/bin/env python3
import json
import os
import re
import urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
event=json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text())
issue=event['issue']
repo=os.environ['GITHUB_REPOSITORY']
token=os.environ['GITHUB_TOKEN']
base=f'https://api.github.com/repos/{repo}'

def api(method,path,payload=None):
    data=None if payload is None else json.dumps(payload).encode()
    req=urllib.request.Request(base+path,data=data,method=method)
    req.add_header('Accept','application/vnd.github+json')
    req.add_header('Authorization',f'Bearer {token}')
    req.add_header('X-GitHub-Api-Version','2022-11-28')
    if data is not None:
        req.add_header('Content-Type','application/json')
    with urllib.request.urlopen(req) as r:
        raw=r.read()
        return json.loads(raw) if raw else None

def field(label):
    body=issue.get('body') or ''
    m=re.search(r'^###\s+'+re.escape(label)+r'\s*$\n+([\s\S]*?)(?=^###\s+|\Z)',body,re.M|re.I)
    if not m:
        return ''
    value=m.group(1).strip()
    return '' if value.lower()=='_no response_' else value

labels=[x['name'] for x in issue.get('labels',[])]
title=issue.get('title','')
project=field('Project ID').strip().lower()
priority=field('Priority').strip().lower()
severity=field('Severity').strip().lower()

def ensure(label):
    if label and label not in labels:
        labels.append(label)

if 'type:task' in labels or title.upper().startswith('[TASK]'):
    ensure('type:task')
    if not any(x.startswith('state:') for x in labels):
        ensure('state:ready')
    if priority in {'p0','p1','p2','p3'}:
        labels[:]=[x for x in labels if not x.startswith('priority:')]
        ensure('priority:'+priority)

if 'type:blocker' in labels or title.upper().startswith('[BLOCKER]'):
    ensure('type:blocker')
    labels[:]=[x for x in labels if not x.startswith('state:')]
    ensure('state:blocked')
    if severity in {'critical','high','medium','low'}:
        labels[:]=[x for x in labels if not x.startswith('severity:')]
        ensure('severity:'+severity)

known={p['id']:p for p in json.loads((ROOT/'projects.json').read_text())['projects']}
milestone=None
if project in known:
    labels[:]=[x for x in labels if not x.startswith('project:')]
    ensure('project:'+project)
    wanted='Project: '+project
    for ms in api('GET','/milestones?state=all&per_page=100'):
        if ms['title']==wanted:
            milestone=ms['number']
            break

payload={'labels':labels}
if milestone is not None:
    payload['milestone']=milestone
api('PATCH',f"/issues/{issue['number']}",payload)
print('triaged issue',issue['number'],labels,'milestone',milestone)
