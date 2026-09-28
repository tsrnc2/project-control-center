(() => {
  const repo = document.querySelector('meta[name="tracker-repo"]').content;
  const liveBranch = document.querySelector('meta[name="tracker-live-branch"]').content || 'live';
  const rawLiveState = `https://raw.githubusercontent.com/${repo}/${liveBranch}/state.json`;
  const rawMainState = `https://raw.githubusercontent.com/${repo}/main/state.json`;
  const rawProjects = `https://raw.githubusercontent.com/${repo}/main/projects.json`;
  const issuesApi = `https://api.github.com/repos/${repo}/issues?state=all&per_page=100&sort=updated&direction=desc`;
  const refreshMs = 120000;
  let snapshot = null;
  let githubIssues = [];
  let lastFetch = 0;
  let inFlight = false;
  let snapshotRead = {at: null, source: 'Unavailable', live: false, error: ''};
  let issuesRead = {at: null, limited: false, error: ''};
  const model = window.DashboardModel;

  const $ = (id) => document.getElementById(id);
  const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const badge = (s) => `<span class="badge ${esc(String(s).toUpperCase())}">${esc(s)}</span>`;
  const when = s => model.when(s, $('timezone').value);
  const titleLink = (url, title) => model.safeUrl(url)
    ? `<a class="issue-link" href="${esc(model.safeUrl(url))}">${esc(title)}</a>` : esc(title);
  const multiline = (v='') => esc(v).replace(/\n/g,'<br>');
  const labels = issue => new Set((Array.isArray(issue.labels) ? issue.labels : []).map(x => typeof x === 'string' ? x : x?.name).filter(x => typeof x === 'string'));
  const labelValue = (set,prefix) => [...set].find(x => x.startsWith(prefix))?.slice(prefix.length) || '';

  function field(body,label){
    const text = typeof body === 'string' ? body : '';
    const safe = label.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
    const m = text.match(new RegExp(`###\\s+${safe}\\s*\\n+([\\s\\S]*?)(?=\\n###\\s+|$)`,'i'));
    if(!m) return '';
    const v=m[1].trim();
    return /^_No response_$/i.test(v) ? '' : v;
  }

  function issueTask(issue){
    if(issue.pull_request) return null;
    const ls=labels(issue);
    if(!ls.has('type:task') && !/^\[TASK\]/i.test(issue.title||'')) return null;
    const state=issue.state==='closed' ? (issue.state_reason==='completed' ? 'DONE' : 'CLOSED') : (labelValue(ls,'state:')||'ready').replace(/-/g,'_').toUpperCase();
    const projectId=labelValue(ls,'project:') || field(issue.body,'Project ID');
    const priority=(labelValue(ls,'priority:') || field(issue.body,'Priority') || 'P2').toUpperCase();
    const taskId=field(issue.body,'Task ID') || `issue-${issue.number}`;
    return {
      id:taskId, project_id:projectId, title:(issue.title||'').replace(/^\[TASK\]\s*/i,''),
      state, priority, issue_number:issue.number, issue_url:issue.html_url,
      updated_at:issue.updated_at, created_at:issue.created_at,
      next_action:field(issue.body,'Next action') || '', claimed_by:field(issue.body,'Owner') || null, source:'issue'
    };
  }

  function issueBlocker(issue){
    if(issue.pull_request) return null;
    const ls=labels(issue);
    if(!ls.has('type:blocker') && !/^\[BLOCKER\]/i.test(issue.title||'')) return null;
    return {
      id:field(issue.body,'Blocker ID') || `issue-${issue.number}`,
      project_id:labelValue(ls,'project:') || field(issue.body,'Project ID'),
      task_id:field(issue.body,'Task ID'),
      state:issue.state==='closed'?'RESOLVED':'OPEN',
      severity:(labelValue(ls,'severity:') || field(issue.body,'Severity') || 'MEDIUM').toUpperCase(),
      summary:(issue.title||'').replace(/^\[BLOCKER\]\s*/i,''),
      required_next_action:field(issue.body,'Required next action') || '',
      issue_number:issue.number, issue_url:issue.html_url, updated_at:issue.updated_at
    };
  }

  function issueReview(issue){
    if(issue.pull_request) return null;
    const ls=labels(issue);
    if(!ls.has('type:review-request') && !/^\[REVIEW\]/i.test(issue.title||'')) return null;
    const labelState=labelValue(ls,'review:');
    const state=issue.state==='closed' || labelState==='completed'
      ? 'COMPLETED'
      : (labelState==='claimed' ? 'CLAIMED' : 'REQUESTED');
    return {
      id:field(issue.body,'Review request ID') || `review-issue-${issue.number}`,
      project_id:labelValue(ls,'project:') || field(issue.body,'Project ID'),
      task_id:field(issue.body,'Parent task ID'),
      title:(issue.title||'').replace(/^\[REVIEW\]\s*/i,''),
      state,
      requester:field(issue.body,'Requesting agent'),
      preferred_reviewer:field(issue.body,'Preferred reviewer agent'),
      role:field(issue.body,'Primary reviewer role'),
      additional_roles:field(issue.body,'Additional reviewer roles'),
      source_repo:field(issue.body,'Source repository'),
      source_ref:field(issue.body,'Source ref / immutable revision'),
      files:field(issue.body,'Files / artifacts to review'),
      areas:field(issue.body,'Specific areas needing attention'),
      objective:field(issue.body,'Review objective / questions'),
      checks:field(issue.body,'Requested checks'),
      independence:field(issue.body,'Reviewer independence'),
      evidence:field(issue.body,'Evidence and context references'),
      exclusions:field(issue.body,'Explicit exclusions / non-goals'),
      required_output:field(issue.body,'Required review output'),
      completion:field(issue.body,'Completion criteria'),
      issue_number:issue.number,
      issue_url:issue.html_url,
      updated_at:issue.updated_at,
      created_at:issue.created_at
    };
  }

  async function getJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, {cache:'no-store', credentials:'omit', signal:controller.signal,
        headers:{Accept:'application/vnd.github+json'}});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return {data:await response.json(), next: /rel="next"/.test(response.headers.get('Link') || '')};
    } finally { clearTimeout(timer); }
  }

  function validateSnapshot(data) {
    const record = x => x && typeof x === 'object' && !Array.isArray(x);
    if (!record(data) || !record(data.tracker) || !Array.isArray(data.projects) || !Array.isArray(data.tasks)) throw new Error('Invalid snapshot shape');
    for (const name of ['projects','tasks','blockers','reviews','activity']) {
      if (data[name] !== undefined && (!Array.isArray(data[name]) || !data[name].every(record))) throw new Error(`Invalid ${name} collection`);
    }
    if (![...data.projects,...data.tasks].every(x => typeof x.id === 'string' && x.id.trim())) throw new Error('Missing record identity');
    return data;
  }

  async function loadSnapshot() {
    const sources = [[rawLiveState,'live branch',true],[rawMainState,'main fallback',false],['./state.json','bundled fallback',false]];
    for (const [url, source, live] of sources) {
      try {
        const result = await getJson(url + `?t=${Date.now()}`);
        return {data:validateSnapshot(result.data), source, live};
      } catch (_) { /* Try the documented public fallback; never change a retained timestamp. */ }
    }
    throw new Error('All snapshot sources failed or returned invalid data');
  }

  async function loadIssues() {
    const items = [];
    for (let page=1; page<=3; page++) {
      const {data,next} = await getJson(issuesApi + `&page=${page}`);
      if (!Array.isArray(data) || !data.every(x => x && typeof x.title === 'string')) throw new Error('Invalid Issues response');
      items.push(...data.filter(x => !x.pull_request));
      if (!next) return {items, limited:false};
    }
    return {items, limited:true};
  }

  async function fetchState(force=false) {
    if (inFlight || (!force && Date.now()-lastFetch < 30000)) return;
    inFlight = true;
    lastFetch = Date.now();
    $('refresh').disabled = true;
    $('refresh').textContent = 'Refreshing…';
    try {
      const [stateResult, issueResult] = await Promise.allSettled([loadSnapshot(),loadIssues()]);
      if (stateResult.status === 'fulfilled') {
        snapshot = stateResult.value.data;
        snapshotRead = {at:new Date().toISOString(), source:stateResult.value.source, live:stateResult.value.live, error:''};
      } else snapshotRead.error = 'Snapshot read failed; retained data is not current.';
      if (issueResult.status === 'fulfilled') {
        githubIssues = issueResult.value.items;
        issuesRead = {at:new Date().toISOString(), limited:issueResult.value.limited, error:''};
      } else issuesRead.error = 'Issues read failed; last successful read is unchanged.';
      render();
    } finally {
      inFlight = false;
      $('refresh').disabled = false;
      $('refresh').textContent = 'Refresh data';
    }
  }

  function mergedTasks() {
    return model.mergeRecords(snapshot?.tasks || [], githubIssues.map(issueTask).filter(Boolean), true);
  }
  function mergedBlockers() {
    return model.mergeRecords(snapshot?.blockers || [], githubIssues.map(issueBlocker).filter(Boolean));
  }
  function mergedReviews() {
    return model.mergeRecords(snapshot?.reviews || [], githubIssues.map(issueReview).filter(Boolean));
  }

  function sourceIsFresh(now) {
    return snapshotRead.live && !snapshotRead.error && model.isFresh(snapshotRead.at,now) && model.isFresh(snapshot?.tracker?.generated_at,now);
  }

  function renderHealth(now) {
    const warnings = [snapshotRead.error, issuesRead.error].filter(Boolean);
    if (snapshot && !snapshotRead.live) warnings.push('Fallback snapshot: live state unavailable.');
    if (snapshot && !model.isFresh(snapshot.tracker.generated_at,now)) warnings.push('Snapshot timestamp is stale, missing, invalid, or future-dated.');
    if (snapshotRead.at && !model.isFresh(snapshotRead.at,now)) warnings.push('Snapshot read is stale.');
    if (issuesRead.at && !model.isFresh(issuesRead.at,now)) warnings.push('Issues read is stale.');
    if (issuesRead.limited) warnings.push('Issues coverage limited to the latest 300 entries; older records may be missing.');
    if (!snapshot) warnings.push('Project registry and machine state unavailable.');
    $('freshness').textContent = `Snapshot recorded: ${when(snapshot?.tracker?.generated_at)}`;
    $('source-status').textContent = `Source: ${snapshotRead.source} · Snapshot last read: ${when(snapshotRead.at)} · Issues last successful read: ${when(issuesRead.at)}. Freshness threshold: 15 minutes. Counts describe loaded records, not the entire portfolio or verified work.`;
    $('source-summary').textContent = warnings.length ? 'Public data: partial, stale, or unavailable — inspect sources' : 'Public data: current snapshot and Issue reads — inspect sources';
    $('error').hidden = warnings.length === 0;
    $('error').textContent = warnings.join(' ');
  }

  function taskCard(task, now, fresh, blockers) {
    const timing = model.forecast(task,now,$('timezone').value);
    const lock = model.execution(task,now,fresh);
    const end = model.terminal.has(task.state) ? task.completed_at : snapshot?.tracker?.generated_at;
    const related = blockers.filter(b => b.project_id===task.project_id && b.task_id===task.id);
    const pair = (label,value) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
    const estimate = task.estimate && typeof task.estimate==='object' ? task.estimate : {};
    return `<article class="row task-card">
      <div class="row-head"><div><h3>${titleLink(task.issue_url,task.title || task.id)}</h3>
      <div class="meta"><span>Recorded:</span>${badge(task.state)}${badge(task.priority || 'P2')}<span class="small">${esc(task.project_id || 'unmapped')} · ${esc(task.id)}</span></div></div></div>
      <p class="small">Owner: <strong>${esc(task.claimed_by || 'Unassigned')}</strong></p>
      ${['CLAIMED','RUNNING'].includes(task.state) ? `<p class="execution ${lock.current ? 'current' : 'warning'}">${esc(lock.label)}</p>` : ''}
      <dl class="task-timing">
        ${pair('Started',when(task.started_at))}
        ${pair('Last recorded progress',when(task.last_progress_at))}
        ${pair('Elapsed at snapshot · not effort',model.elapsed(task.started_at,end))}
        ${pair('ETA',timing.label + ' — ' + timing.detail)}
        ${pair(model.overdue(task,now) ? 'Deadline · overdue' : 'Deadline',when(task.deadline_at))}
        ${pair('Record updated',when(task.updated_at))}
      </dl>
      ${related.length ? `<p class="small"><strong>Blockers:</strong> ${related.map(b => titleLink(b.issue_url,b.summary || b.id)).join(' · ')}</p>` : task.state==='BLOCKED' ? '<p class="warning small">No matching blocker in loaded data; coverage or record needs reconciliation.</p>' : ''}
      <p class="next-action"><strong>Next:</strong> ${esc(task.next_action || 'Not recorded')}</p>
      <details data-task-key="${esc(model.key(task))}"><summary>Timing and forecast evidence</summary>
        <dl class="task-timing">
          ${pair('Created',when(task.created_at))}${pair('Planned start',when(task.planned_start_at))}
          ${pair('Next scheduled run · not ETA',when(task.scheduled_next_run_at))}${pair('Completed',when(task.completed_at))}
          ${pair('Claim expiry · not ETA',when(task.claim_expires_at))}${pair('Lock expiry · not ETA',when(task.lease?.expires_at))}
          ${pair('Last heartbeat · not progress',when(task.lease?.heartbeat_at))}${pair('Snapshot (UTC)',model.when(snapshot?.tracker?.generated_at,'UTC'))}
          ${pair('Estimated by',estimate.estimated_by || 'Not recorded')}${pair('Estimated at',when(estimate.estimated_at))}
          ${pair('Forecast basis',estimate.basis || 'Not recorded')}${pair('Assumptions',Array.isArray(estimate.assumptions) ? estimate.assumptions.join('; ') : estimate.assumptions || 'Not recorded')}
          ${pair('Dependencies',Array.isArray(estimate.depends_on) ? estimate.depends_on.join(', ') : 'Not recorded')}
        </dl>
        <p class="small muted">Wall-clock elapsed time is bounded by the snapshot, not active effort. DONE does not prove merge or deployment. No forecast is derived from a claim, lock, deadline, or heartbeat.</p>
      </details>
    </article>`;
  }

  function render() {
    const projects = snapshot?.projects || [];
    const tasks = mergedTasks();
    const blockers = mergedBlockers().filter(b => b.state !== 'RESOLVED');
    const reviews = mergedReviews().filter(r => r.state !== 'COMPLETED');
    const now = Date.now(), fresh = sourceIsFresh(now);
    const openDetails = new Set([...document.querySelectorAll('details[open]')].map(x => x.dataset.taskKey));
    const active = tasks.filter(t => model.execution(t,now,fresh).current);
    renderHealth(now);
    const agents = new Set(active.map(t => t.lease?.agent_id || t.claimed_by).filter(Boolean));

    $('metric-projects').textContent = snapshot ? projects.length : '—';
    $('metric-running').textContent = fresh ? active.length : '—';
    $('metric-blockers').textContent = snapshot || issuesRead.at ? blockers.length : '—';
    $('metric-reviews').textContent = snapshot || issuesRead.at ? reviews.length : '—';
    $('metric-agents').textContent = fresh ? agents.size : '—';
    $('metric-attention').textContent = snapshot || issuesRead.at ? tasks.filter(t => model.needsAttention(t,now,fresh)).length : '—';
    fillSelect('scope-filter', [...new Set([...projects.map(p => p.id),...tasks.map(t => t.project_id)].filter(Boolean))].sort());

    fillSelect('project-filter', [...new Set(projects.map(p => p.lifecycle))].sort());
    fillSelect('task-filter', [...new Set(tasks.map(t => t.state))].sort());

    const q = $('search').value.trim().toLowerCase();
    const pf = $('project-filter').value;
    const tf = $('task-filter').value;
    const scope = $('scope-filter').value;
    const matchesProject = id => (!scope || id===scope) && (!pf || projects.some(p => p.id===id && p.lifecycle===pf));
    const match = obj => matchesProject(obj.project_id || obj.id) && (!q || JSON.stringify(obj).toLowerCase().includes(q));

    const taskCounts = new Map(), blockerCounts = new Map(), reviewCounts = new Map();
    tasks.forEach(t => taskCounts.set(t.project_id,(taskCounts.get(t.project_id)||0)+1));
    blockers.forEach(b => blockerCounts.set(b.project_id,(blockerCounts.get(b.project_id)||0)+1));
    reviews.forEach(r => reviewCounts.set(r.project_id,(reviewCounts.get(r.project_id)||0)+1));

    $('projects').innerHTML = projects.filter(match).map(p => `
      <article class="card">
        <div class="row-head"><h3>${esc(p.name)}</h3>${badge(p.lifecycle)}</div>
        <div class="meta small">
          <span>${taskCounts.get(p.id)||0} tasks</span><span>·</span><span>${blockerCounts.get(p.id)||0} blockers</span><span>·</span><span>${reviewCounts.get(p.id)||0} reviews</span>
          ${p.parent_project_id ? `<span>· child of ${esc(p.parent_project_id)}</span>` : ''}
        </div>
        <p class="small muted">${taskCounts.get(p.id) ? `${tasks.filter(t => t.project_id===p.id && ['DONE','COMPLETED'].includes(t.state)).length} of ${taskCounts.get(p.id)} loaded tasks done — not project completion.` : 'No loaded tasks — coverage unknown.'}</p>
        <button type="button" data-project="${esc(p.id)}">View project tasks</button>
      </article>`).join('') || '<p class="muted">No matching projects in loaded data.</p>';

    $('tasks').innerHTML = tasks.filter(t => (!tf || t.state===tf) && match(t) &&
      (!$('attention-only').checked || model.needsAttention(t,now,fresh)))
      .sort((a,b) => model.compareTasks(a,b,now,fresh)).map(t => taskCard(t,now,fresh,blockers)).join('') ||
      '<p class="muted">No matching tasks in loaded data.</p>';
    document.querySelectorAll('details[data-task-key]').forEach(x => { x.open = openDetails.has(x.dataset.taskKey); });

    $('blockers').innerHTML = blockers.filter(match).map(b => `
      <article class="row">
        <div class="row-head"><h3>${titleLink(b.issue_url,b.summary||b.id)}</h3>${badge(b.severity||'MEDIUM')}</div>
        <p class="small">${esc(b.project_id||'unmapped')} · task ${esc(b.task_id||'—')}</p>
        <p>${esc(b.required_next_action||'Next action not recorded')}</p>
        <p class="small">Opened: ${when(b.opened_at)} · Updated: ${when(b.updated_at)} · Resolver: ${esc(b.resolver || 'Unassigned')}</p>
      </article>`).join('') || '<p class="muted">No open blockers in loaded data.</p>';

    $('reviews').innerHTML = reviews.filter(match).map(r => `
      <article class="row">
        <div class="row-head">
          <div>
            <h3>${titleLink(r.issue_url,r.title||r.id)}</h3>
            <div class="meta">${badge(r.state)} <span class="small">${esc(r.project_id||'unmapped')} · task ${esc(r.task_id||'—')}</span></div>
          </div>
          <span class="small muted">${when(r.updated_at)}</span>
        </div>
        <p class="small"><strong>Requester:</strong> ${esc(r.requester||'—')} · <strong>Preferred reviewer:</strong> ${esc(r.preferred_reviewer||'any eligible agent')}</p>
        <p class="small"><strong>Role:</strong> ${esc(r.role||'—')}${r.additional_roles ? ` · supporting: ${esc(r.additional_roles).replace(/\n/g,', ')}` : ''}</p>
        <p class="small"><strong>Source:</strong> ${esc(r.source_repo||'—')}@${esc(r.source_ref||'—')} · <strong>Independence:</strong> ${esc(r.independence||'—')}</p>
        ${r.files ? `<p class="small"><strong>Files/artifacts:</strong><br>${multiline(r.files)}</p>` : ''}
        ${r.areas ? `<p class="small"><strong>Attention areas:</strong><br>${multiline(r.areas)}</p>` : ''}
        ${r.objective ? `<p class="small"><strong>Questions:</strong><br>${multiline(r.objective)}</p>` : ''}
        ${r.required_output ? `<p class="small"><strong>Output:</strong> ${esc(r.required_output)}</p>` : ''}
      </article>`).join('') || '<p class="muted">No open review requests in loaded data.</p>';

    $('activity').innerHTML = (snapshot?.activity||[]).slice().sort((a,b) => (model.timestamp(b.at) ?? -Infinity) - (model.timestamp(a.at) ?? -Infinity)).filter(match).slice(0,50).map(e => `
      <article class="row">
        <div class="row-head"><strong>${esc(e.type||'EVENT')}</strong><span class="small muted">${when(e.at)}</span></div>
        <p>${esc(e.summary||'')}</p>
        <p class="small">${esc(e.project_id||'')}${e.task_id ? ' · '+esc(e.task_id) : ''}</p>
      </article>`).join('') || '<p class="muted">No activity recorded.</p>';
  }

  function fillSelect(id, values) {
    const el=$(id), current=el.value;
    const old=[...el.options].slice(1).map(o=>o.value).join('|'), next=values.join('|');
    if(old!==next) el.innerHTML='<option value="">All</option>'+values.map(v=>`<option>${esc(v)}</option>`).join('');
    if([...el.options].some(o=>o.value===current)) el.value=current;
  }

  function activatePanel(panel) {
    document.querySelectorAll('.tab').forEach(x => { x.classList.toggle('active',x.dataset.panel===panel); x.setAttribute('aria-pressed',String(x.dataset.panel===panel)); });
    document.querySelectorAll('.panel').forEach(x => x.classList.toggle('active',x.id===panel));
  }
  $('projects').addEventListener('click',event => {
    const button = event.target.closest('button[data-project]');
    if (!button) return;
    $('scope-filter').value = button.dataset.project;
    $('search').value = '';
    $('task-filter').value = '';
    $('attention-only').checked = false;
    render();
    activatePanel('tasks-panel');
    document.querySelector('[data-panel="tasks-panel"]').focus();
  });
  document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
    activatePanel(btn.dataset.panel);
  }));
  ['search','project-filter','task-filter','scope-filter','timezone','attention-only'].forEach(id=>$(id).addEventListener('input',()=>render()));
  $('refresh').addEventListener('click',()=>fetchState(true));

  const repoUrl=`https://github.com/${repo}`;
  $('repo-link').href=repoUrl;
  $('issues-link').href=repoUrl+'/issues';
  $('prs-link').href=repoUrl+'/pulls';
  $('actions-link').href=repoUrl+'/actions';
  $('releases-link').href=repoUrl+'/releases';
  $('discussions-link').href=repoUrl+'/discussions';
  $('discussion-card-link').href=repoUrl+'/discussions';
  $('new-task').href=repoUrl+'/issues/new?template=task.yml';
  $('new-blocker').href=repoUrl+'/issues/new?template=blocker.yml';
  $('new-review').href=repoUrl+'/issues/new?template=review-request.yml';
  $('new-project').href=repoUrl+'/issues/new?template=project-intake.yml';
  $('state-link').href=rawLiveState;
  $('projects-link').href=rawProjects;
  $('issues-api-link').href=issuesApi;

  $('filter-options').open = window.matchMedia('(min-width: 851px)').matches;
  activatePanel('projects-panel');
  fetchState(true);
  setInterval(()=>fetchState(false),refreshMs);
  setInterval(() => { if (!inFlight) render(); },30000);
})();
