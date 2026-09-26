#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_FILES = [
    ROOT / 'state.json',
    ROOT / 'projects.json',
    ROOT / '.github' / 'labels.json',
    ROOT / '.github' / 'milestones.json',
    ROOT / 'schema' / 'state.schema.json',
    ROOT / 'api' / 'index.json',
    ROOT / 'reviewer-roles.json',
    ROOT / 'schema' / 'review-request.schema.json',
]
TASK_STATES = {'READY','CLAIMED','RUNNING','BLOCKED','DONE','FAILED','NO_PROGRESS','CANCELLED'}
SECRET_PATTERNS = [
    re.compile(r'ghp_[A-Za-z0-9]{20,}'),
    re.compile(r'github_pat_[A-Za-z0-9_]{20,}'),
    re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    re.compile(r'AKIA[0-9A-Z]{16}'),
]
errors=[]

def load(path):
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except Exception as exc:
        errors.append(f'{path.relative_to(ROOT)}: invalid JSON: {exc}')
        return {}

for path in JSON_FILES:
    if not path.exists():
        errors.append(f'missing required file: {path.relative_to(ROOT)}')

state=load(ROOT/'state.json')
projects_doc=load(ROOT/'projects.json')
load(ROOT/'.github'/'labels.json')
load(ROOT/'.github'/'milestones.json')
load(ROOT/'schema'/'state.schema.json')
load(ROOT/'api'/'index.json')
reviewer_roles=load(ROOT/'reviewer-roles.json')
load(ROOT/'schema'/'review-request.schema.json')

projects=projects_doc.get('projects',[])
ids=[p.get('id') for p in projects]
if any(not x for x in ids):
    errors.append('projects.json contains a project without id')
if len(ids)!=len(set(ids)):
    errors.append('projects.json contains duplicate project IDs')
known=set(ids)

role_ids=[r.get('id') for r in reviewer_roles.get('roles',[])]
if any(not x for x in role_ids):
    errors.append('reviewer-roles.json contains a role without id')
if len(role_ids)!=len(set(role_ids)):
    errors.append('reviewer-roles.json contains duplicate role IDs')
source_revision=reviewer_roles.get('source',{}).get('revision','')
if not re.fullmatch(r'[0-9a-f]{40}', source_revision):
    errors.append('reviewer-roles.json source revision must be a full lowercase commit SHA')
for role in reviewer_roles.get('roles',[]):
    if not role.get('source_path'):
        errors.append(f"reviewer role {role.get('id')}: missing source_path")

state_ids=[p.get('id') for p in state.get('projects',[])]
if set(state_ids) != known:
    errors.append('state.json project set differs from projects.json')

task_ids=[]
for task in state.get('tasks',[]):
    tid=task.get('id')
    task_ids.append(tid)
    if task.get('project_id') not in known:
        errors.append(f"task {tid}: unknown project_id {task.get('project_id')}")
    if task.get('state') not in TASK_STATES:
        errors.append(f"task {tid}: invalid state {task.get('state')}")
if len(task_ids)!=len(set(task_ids)):
    errors.append('state.json contains duplicate task IDs')

for blocker in state.get('blockers',[]):
    pid=blocker.get('project_id')
    if pid and pid not in known:
        errors.append(f"blocker {blocker.get('id')}: unknown project_id {pid}")

for path in ROOT.rglob('*'):
    if not path.is_file() or '.git' in path.parts:
        continue
    if path.stat().st_size > 2000000:
        continue
    try:
        text=path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        continue
    for pattern in SECRET_PATTERNS:
        if pattern.search(text):
            errors.append(f'{path.relative_to(ROOT)}: looks like a credential/private key')

required=[
    ROOT/'index.html', ROOT/'assets'/'app.js', ROOT/'assets'/'style.css',
    ROOT/'AGENTS.md', ROOT/'.github'/'ISSUE_TEMPLATE'/'task.yml',
    ROOT/'.github'/'ISSUE_TEMPLATE'/'blocker.yml',
    ROOT/'.github'/'ISSUE_TEMPLATE'/'review-request.yml',
    ROOT/'docs'/'REVIEW-REQUESTS.md', ROOT/'reviewer-roles.json',
    ROOT/'schema'/'review-request.schema.json',
]
for path in required:
    if not path.exists():
        errors.append(f'missing required collaboration file: {path.relative_to(ROOT)}')

if errors:
    print('TRACKER VALIDATION FAILED', file=sys.stderr)
    for e in errors:
        print(f'- {e}', file=sys.stderr)
    raise SystemExit(1)

print(f'tracker validation passed: {len(projects)} projects, {len(task_ids)} snapshot tasks')
