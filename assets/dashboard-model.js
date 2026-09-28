/* Read-only presentation rules. No writes, claims, forecasts, or authority changes. */
(function (root) {
  'use strict';
  const terminal = new Set(['DONE', 'COMPLETED', 'CANCELLED', 'CLOSED']);
  const activeStates = new Set(['CLAIMED', 'RUNNING']);
  const freshnessMs = 15 * 60 * 1000;

  function timestamp(value) {
    if (typeof value !== 'string') return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
    if (!m) return null;
    const [year, month, day, hour, minute, second] = m.slice(1, 7).map(Number);
    if (year < 1000 || month < 1 || month > 12 || day < 1 ||
        day > new Date(Date.UTC(year, month, 0)).getUTCDate() ||
        hour > 23 || minute > 59 || second > 59) return null;
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : null;
  }

  function when(value, zone = 'America/Los_Angeles') {
    if (value == null || value === '') return 'Unknown';
    const ms = timestamp(value);
    if (ms === null) return 'Invalid timestamp';
    return new Intl.DateTimeFormat('en-US', {
      timeZone: zone === 'UTC' ? 'UTC' : 'America/Los_Angeles',
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    }).format(ms);
  }

  function elapsed(start, end) {
    const a = timestamp(start), b = timestamp(end);
    if (a === null || b === null || b < a) return 'Unknown';
    const minutes = Math.floor((b - a) / 60000);
    if (minutes < 1) return 'Less than 1m';
    const days = Math.floor(minutes / 1440), hours = Math.floor(minutes / 60) % 24;
    return [days ? `${days}d` : '', hours ? `${hours}h` : '', `${minutes % 60}m`].filter(Boolean).join(' ');
  }

  function safeUrl(value) {
    if (typeof value !== 'string' || !/^https:\/\//i.test(value)) return '';
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
    } catch (_) { return ''; }
  }

  const key = record => JSON.stringify([record.project_id || '', record.id || record.task_id || '']);

  function mergeRecords(records, updates, preserveOwnership = false) {
    const items = new Map(records.map(r => [key(r), {...r}]));
    for (const newer of updates) {
      const old = items.get(key(newer));
      if (!old) { items.set(key(newer), {...newer}); continue; }
      const a = timestamp(old.updated_at), b = timestamp(newer.updated_at);
      // Unknown or older Issue dates cannot overwrite a known machine revision.
      const incomingWins = b !== null && (a === null || b >= a);
      const merged = incomingWins ? {...old, ...newer} : {...newer, ...old};
      if (preserveOwnership) {
        for (const name of ['lease', 'claimed_by', 'claim_expires_at']) merged[name] = old[name];
      }
      items.set(key(newer), merged);
    }
    return [...items.values()];
  }

  function isFresh(value, now = Date.now()) {
    const ms = timestamp(value);
    return ms !== null && ms <= now && now - ms <= freshnessMs;
  }

  function execution(task, now = Date.now(), sourceFresh = false) {
    if (!activeStates.has(task.state)) return {current: false, label: 'No execution asserted'};
    const unknown = reason => ({current: false, label: `Execution unverified — ${reason}`});
    if (!sourceFresh) return unknown('source stale or unavailable');
    if (task.claim_expires_at != null) {
      const expiry = timestamp(task.claim_expires_at);
      if (expiry === null) return unknown('invalid claim expiry');
      if (expiry <= now) return unknown('claim expired');
    }
    const lease = task.lease;
    if (!lease) return unknown('no lock evidence');
    if (!['ACTIVE', 'HELD', 'ACQUIRED', 'RUNNING'].includes(String(lease.state || '').toUpperCase())) return unknown('lock state not active');
    const expiry = timestamp(lease.expires_at);
    if (expiry === null) return unknown('invalid lock expiry');
    if (expiry <= now) return unknown('lock expired');
    if (!lease.agent_id || (task.claimed_by && task.claimed_by !== lease.agent_id)) return unknown('owner missing or conflicting');
    return {current: true, label: 'Current lock evidence — not proof of progress'};
  }

  function forecast(task, now = Date.now(), zone = 'America/Los_Angeles') {
    if (['DONE', 'COMPLETED'].includes(task.state)) {
      const actual = timestamp(task.completed_at), start = timestamp(task.started_at);
      const detail = actual === null ? 'Actual completion time unknown' :
        actual > now || (start !== null && actual < start) ? 'Actual completion chronology invalid' : when(task.completed_at, zone);
      return {label: 'Completed', detail};
    }
    if (terminal.has(task.state)) return {label: 'Not applicable', detail: 'Task is closed or cancelled'};
    const e = task.estimate;
    const unknown = detail => ({label: 'Not estimated', detail});
    if (!e || typeof e !== 'object') return unknown('No recorded completion forecast');
    const status = String(e.status || '').toLowerCase();
    if (status && !['estimated','estimated_window','conditional','conditional_on_dependency','invalidated','awaiting_reassessment','stale'].includes(status)) {
      return unknown('Forecast status does not assert an estimate');
    }
    const first = timestamp(e.earliest_finish_at), last = timestamp(e.latest_finish_at), made = timestamp(e.estimated_at);
    if (first === null || last === null || made === null || first > last || made > first || made > now ||
        typeof e.estimated_by !== 'string' || !e.estimated_by.trim() || typeof e.basis !== 'string' || !e.basis.trim()) {
      return unknown('Forecast evidence incomplete or invalid');
    }
    const window = `${when(e.earliest_finish_at, zone)} – ${when(e.latest_finish_at, zone)}`;
    if (e.invalidated_reason || ['invalidated', 'awaiting_reassessment', 'stale'].includes(String(e.status || '').toLowerCase()) ||
        (task.state === 'BLOCKED' && (timestamp(task.updated_at) === null || timestamp(task.updated_at) > made))) {
      return {label: 'Awaiting reassessment', detail: e.invalidated_reason || 'Blocker or estimate state requires reassessment'};
    }
    if (e.valid_until != null && timestamp(e.valid_until) === null) return unknown('Invalid forecast validity timestamp');
    if (last < now || (e.valid_until != null && timestamp(e.valid_until) <= now)) return {label: 'Estimate stale', detail: window};
    const conditional = task.state === 'BLOCKED' || (Array.isArray(e.depends_on) && e.depends_on.length > 0);
    return {label: conditional ? 'Conditional on dependency' : 'Estimated window', detail: window};
  }

  function overdue(task, now = Date.now()) {
    const deadline = timestamp(task.deadline_at);
    return !terminal.has(task.state) && deadline !== null && deadline < now;
  }

  function needsAttention(task, now, sourceFresh) {
    return ['BLOCKED', 'NO_PROGRESS', 'FAILED'].includes(task.state) || overdue(task, now) ||
      (activeStates.has(task.state) && !execution(task, now, sourceFresh).current) ||
      ['Estimate stale', 'Awaiting reassessment'].includes(forecast(task, now).label);
  }

  function compareTasks(a, b, now, sourceFresh) {
    const rank = t => needsAttention(t, now, sourceFresh) ? 0 : activeStates.has(t.state) ? 1 : t.state === 'READY' ? 2 : terminal.has(t.state) ? 4 : 3;
    const priority = t => /^P[0-9]$/.test(t.priority || '') ? Number(t.priority[1]) : 99;
    return rank(a) - rank(b) || priority(a) - priority(b) ||
      (timestamp(b.last_progress_at) ?? timestamp(b.updated_at) ?? -Infinity) - (timestamp(a.last_progress_at) ?? timestamp(a.updated_at) ?? -Infinity) ||
      key(a).localeCompare(key(b));
  }

  const api = {timestamp, when, elapsed, safeUrl, key, mergeRecords, isFresh, execution, forecast, overdue, needsAttention, compareTasks, terminal, freshnessMs};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DashboardModel = Object.freeze(api);
})(typeof globalThis !== 'undefined' ? globalThis : this);
