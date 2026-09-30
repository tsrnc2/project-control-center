'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../assets/dashboard-model.js');
const at = '2026-09-28T00:00:00Z', now = Date.parse(at);
const earlier = '2026-09-27T23:00:00Z', later = '2026-09-28T01:00:00Z';
const task = {id:'A',project_id:'kitt',state:'RUNNING',claimed_by:'worker',claim_expires_at:later,
  lease:{state:'ACTIVE',agent_id:'worker',expires_at:later}};
const estimate = {earliest_finish_at:later,latest_finish_at:'2026-09-28T02:00:00Z',estimated_at:earlier,estimated_by:'worker',basis:'Measured remaining bounded work'};

test('offset-qualified timestamps represent the same instant', () => assert.equal(m.timestamp(at),m.timestamp('2026-09-27T17:00:00-07:00')));
for (const [name,value] of Object.entries({missing:null,dateOnly:'2026-09-28',noZone:'2026-09-28T00:00:00',badDay:'2026-02-30T00:00:00Z',nonLeap:'2025-02-29T00:00:00Z',badMonth:'2026-13-01T00:00:00Z',badHour:'2026-09-28T24:00:00Z',badZone:'2026-09-28T00:00:00+99:00',object:{},number:now})) {
  test(`reject invalid timestamp: ${name}`, () => assert.equal(m.timestamp(value),null));
}
test('leap date accepted', () => assert.notEqual(m.timestamp('2024-02-29T00:00:00Z'),null));
test('unknown and invalid times remain explicit', () => {assert.equal(m.when(null),'Unknown'); assert.equal(m.when('junk'),'Invalid timestamp');});
test('LA timezone and UTC are explicit', () => {assert.match(m.when(at),/Sep 27, 2026.*PDT/);assert.match(m.when(at,'UTC'),/Sep 28, 2026.*UTC/);});
test('DST elapsed time is wall-clock time, not local-clock subtraction', () => assert.equal(m.elapsed('2026-11-01T01:30:00-07:00','2026-11-01T01:30:00-08:00'),'1h 0m'));
test('missing and reversed elapsed intervals are unknown', () => {assert.equal(m.elapsed(null,at),'Unknown');assert.equal(m.elapsed(later,at),'Unknown');});
test('freshness rejects stale, invalid and future stamps', () => {assert.equal(m.isFresh(at,now),true);for(const v of [earlier,later,'bad',null])assert.equal(m.isFresh(v,now),false);});
test('safe HTTPS links only and no embedded credentials', () => {assert.equal(m.safeUrl('https://github.com/o/r'),'https://github.com/o/r');for(const v of ['javascript:alert(1)','data:text/html,test','http://example.com','//evil.test','https://a:b@example.com','https://',null])assert.equal(m.safeUrl(v),'');});
test('composite identities prevent cross-project task collision', () => assert.equal(m.mergeRecords([{id:'A',project_id:'one'}],[{id:'A',project_id:'two'}]).length,2));
test('older issue does not overwrite newer state', () => assert.equal(m.mergeRecords([{id:'A',project_id:'one',state:'DONE',updated_at:at}],[{id:'A',project_id:'one',state:'READY',updated_at:earlier}])[0].state,'DONE'));
test('new issue metadata cannot replace snapshot ownership', () => {const result=m.mergeRecords([{...task,updated_at:earlier}],[{...task,state:'BLOCKED',claimed_by:'other',lease:null,updated_at:at}],true)[0];assert.equal(result.state,'BLOCKED');assert.equal(result.claimed_by,'worker');assert.equal(result.lease.agent_id,'worker');});
test('unknown incoming date cannot regress known state', () => assert.equal(m.mergeRecords([{...task,updated_at:at}],[{...task,state:'READY',updated_at:'bad'}])[0].state,'RUNNING'));
test('fresh matching unexpired lock is evidence, not proof of progress', () => {assert.equal(m.execution(task,now,true).current,true);assert.match(m.execution(task,now,true).label,/not proof of progress/);});
test('stale source cannot assert current execution', () => assert.equal(m.execution(task,now,false).current,false));
test('expired claim cannot assert current execution', () => assert.match(m.execution({...task,claim_expires_at:earlier},now,true).label,/claim expired/));
test('missing lock cannot assert current execution', () => assert.equal(m.execution({...task,lease:null},now,true).current,false));
test('expired lock cannot assert current execution', () => assert.match(m.execution({...task,lease:{...task.lease,expires_at:at}},now,true).label,/lock expired/));
test('conflicting owner cannot assert current execution', () => assert.equal(m.execution({...task,claimed_by:'other'},now,true).current,false));
test('released lock cannot assert current execution', () => assert.equal(m.execution({...task,lease:{...task.lease,state:'RELEASED'}},now,true).current,false));
test('DONE task does not count as executing even with an unexpired lock', () => assert.equal(m.execution({...task,state:'DONE'},now,true).current,false));
test('claim, lock and deadline never become ETA', () => assert.equal(m.forecast({...task,deadline_at:later},now).label,'Not estimated'));
test('forecast requires provenance', () => assert.equal(m.forecast({...task,estimate:{...estimate,basis:''}},now).label,'Not estimated'));
test('forecast requires ordered bounds', () => assert.equal(m.forecast({...task,estimate:{...estimate,earliest_finish_at:'2026-09-28T03:00:00Z'}},now).label,'Not estimated'));
test('future authored estimate rejected', () => assert.equal(m.forecast({...task,estimate:{...estimate,estimated_at:later}},now).label,'Not estimated'));
test('documented forecast window displayed', () => assert.equal(m.forecast({...task,estimate},now).label,'Estimated window'));
test('dependencies keep forecast conditional', () => assert.equal(m.forecast({...task,estimate:{...estimate,depends_on:['B']}},now).label,'Conditional on dependency'));
test('new blocker requires reassessment', () => assert.equal(m.forecast({...task,state:'BLOCKED',updated_at:at,estimate},now).label,'Awaiting reassessment'));
test('expired forecast stays stale instead of moving forward', () => assert.equal(m.forecast({...task,estimate:{...estimate,valid_until:earlier}},now).label,'Estimate stale'));
test('invalid validity timestamp does not produce an ETA', () => assert.equal(m.forecast({...task,estimate:{...estimate,valid_until:'junk'}},now).label,'Not estimated'));
test('completed time is actual, not previous forecast', () => {const result=m.forecast({...task,state:'DONE',completed_at:at,estimate},now);assert.equal(result.label,'Completed');assert.equal(result.detail,m.when(at));});
test('completed without actual time remains unknown', () => assert.match(m.forecast({...task,state:'DONE'},now).detail,/unknown/));
test('cancelled task has no completion forecast', () => assert.equal(m.forecast({...task,state:'CANCELLED',estimate},now).label,'Not applicable'));
test('deadline overdue only on nonterminal tasks', () => {assert.equal(m.overdue({...task,deadline_at:earlier},now),true);assert.equal(m.overdue({...task,state:'DONE',deadline_at:earlier},now),false);});
test('attention never changes raw recorded state', () => {const copy=structuredClone(task);assert.equal(m.needsAttention(copy,now,false),true);assert.deepEqual(copy,task);});
test('attention sorts ahead of READY and completed work', () => {const data=[{...task,state:'DONE'},{...task,state:'READY'},{...task,state:'BLOCKED'}];data.sort((a,b)=>m.compareTasks(a,b,now,true));assert.deepEqual(data.map(t=>t.state),['BLOCKED','READY','DONE']);});

test('future actual completion is not presented as a valid time', () => assert.match(m.forecast({...task,state:'DONE',completed_at:later},now).detail,/invalid/));
test('completion before start is not a valid actual', () => assert.match(m.forecast({...task,state:'DONE',started_at:at,completed_at:earlier},now).detail,/invalid/));
test('explicit unknown forecast status is preserved', () => assert.equal(m.forecast({...task,estimate:{...estimate,status:'not_estimated'}},now).label,'Not estimated'));
