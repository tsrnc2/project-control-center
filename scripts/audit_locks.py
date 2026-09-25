#!/usr/bin/env python3
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

root=Path(sys.argv[1] if len(sys.argv)>1 else 'locks')
now=datetime.now(timezone.utc)
expired=[]

if root.exists():
    for path in sorted(root.glob('*.json')):
        try:
            data=json.loads(path.read_text())
            expiry=datetime.fromisoformat(data['expires_at'].replace('Z','+00:00'))
            if expiry < now:
                expired.append((path.name,data,expiry))
        except Exception:
            expired.append((path.name,{'agent_id':'unknown','task_id':'unknown'},None))

if not expired:
    print('No expired execution locks.')
    raise SystemExit(0)

print('# Expired execution locks')
print()
for name,data,expiry in expired:
    when=expiry.isoformat() if expiry else 'invalid/unreadable'
    print(f"- **{name}** — task `{data.get('task_id','unknown')}`, agent `{data.get('agent_id','unknown')}`, expires `{when}`")
print()
print('Verify current live state before any takeover. Do not delete or replace a lock merely because this audit found it expired.')
raise SystemExit(2)
