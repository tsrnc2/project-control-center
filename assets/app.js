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
  let promptCatalog = null;
  let lastFetch = 0;

  const $ = (id) => document.getElementById(id);
  const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const badge = (s) => `<span class="badge ${esc(String(s).toUpperCase())}">${esc(s)}</span>`;
  const when = (s) => s ? new Date(s).toLocaleString() : '—';
  const multiline = (v='') => esc(v).replace(/\n/g,'<br>');
  const labels = issue => new Set((issue.labels||[]).map(x => typeof x === 'string' ? x : x.name));
  const labelValue = (set,prefix) => [...set].find(x => x.startsWith(prefix))?.slice(prefix.length) || '';

  function field(body,label){
    const text = body || '';
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
    const state=(labelValue(ls,'state:')||'ready').replace(/-/g,'_').toUpperCase();
    const projectId=labelValue(ls,'project:') || field(issue.body,'Project ID');
    const priority=(labelValue(ls,'priority:') || field(issue.body,'Priority') || 'P2').toUpperCase();
    const taskId=field(issue.body,'Task ID') || `issue-${issue.number}`;
    return {
      id:taskId, project_id:projectId, title:(issue.title||'').replace(/^\[TASK\]\s*/i,''),
      state, priority, issue_number:issue.number, issue_url:issue.html_url,
      updated_at:issue.updated_at, created_at:issue.created_at,
      next_action:field(issue.body,'Next action') || '', source:'issue'
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

  async function getJson(url){
    const r=await fetch(url,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
    if(!r.ok) throw new Error(`${r.status} from ${url}`);
    return r.json();
  }

  function renderPrompts() {
    const host = $('prompts');
    if (!host) return;
    const source = promptCatalog?.source || {};
    const sourceLabel = $('prompt-source');
    if (sourceLabel) {
      sourceLabel.textContent = source.revision
        ? `Pinned KITT revision ${String(source.revision).slice(0,12)}`
        : 'Pinned canonical source';
    }
    const items = promptCatalog?.prompts || [];
    host.innerHTML = items.map(p => `
      <article class="card prompt-card">
        <div class="row-head">
          <h3>${esc(p.name)}</h3>
          <span class="badge">${esc(p.format || 'Text')}</span>
        </div>
        <p>${esc(p.purpose || '')}</p>
        <p class="small muted">${esc(p.status || '')} · <code>${esc(p.file || '')}</code></p>
        <div class="card-actions">
          <a class="button primary" href="${esc(p.download_url || '#')}" download>Download</a>
          <a class="button" href="${esc(p.source_url || '#')}" target="_blank" rel="noopener">View source</a>
        </div>
      </article>`).join('') || '<p class="muted">No public prompts are currently published.</p>';
  }

  async function fetchPrompts() {
    try {
      promptCatalog = await getJson('./prompts.json?t=' + Date.now());
      renderPrompts();
    } catch (e) {
      const host = $('prompts');
      if (host) host.innerHTML = '<p class="error">Prompt catalog unavailable: ' + esc(e.message) + '</p>';
    }
  }

  async function fetchState(force=false) {
    if (!force && Date.now() - lastFetch < 30000) return;
    lastFetch = Date.now();
    $('error').hidden = true;
    const errors=[];
    try {
      try { snapshot = await getJson(rawLiveState+`?t=${Date.now()}`); }
      catch(e1) {
        try { snapshot = await getJson(rawMainState+`?t=${Date.now()}`); }
        catch(e2) { snapshot = await getJson('./state.json?'+Date.now()); }
      }
    } catch(e){ errors.push('state: '+e.message); }

    try {
      githubIssues=(await getJson(issuesApi)).filter(x=>!x.pull_request);
    } catch(e){ errors.push('issues: '+e.message); }

    if(snapshot){
      render();
      const stamp=snapshot.tracker?.generated_at;
      $('freshness').textContent = `Snapshot ${when(stamp)} · live issues refreshed ${new Date().toLocaleTimeString()}`;
    }
    if(errors.length){
      $('error').hidden=false;
      $('error').textContent='Partial live-data fallback: '+errors.join(' · ');
    }
  }

  function mergedTasks(){
    const byId=new Map();
    for(const t of (snapshot?.tasks||[])) byId.set(t.id,{...t});
    for(const issue of githubIssues){
      const t=issueTask(issue); if(!t) continue;
      const old=byId.get(t.id)||{};
      byId.set(t.id,{...old,...t,lease:old.lease,claimed_by:old.claimed_by,claim_expires_at:old.claim_expires_at});
    }
    return [...byId.values()];
  }

  function mergedBlockers(){
    const byKey=new Map();
    for(const b of (snapshot?.blockers||[])) byKey.set(b.id||`${b.project_id}:${b.task_id}`,{...b});
    for(const issue of githubIssues){
      const b=issueBlocker(issue); if(!b) continue;
      const k=b.id||`${b.project_id}:${b.task_id}`;
      byKey.set(k,{...(byKey.get(k)||{}),...b});
    }
    return [...byKey.values()];
  }

  function mergedReviews(){
    const byId=new Map();
    for(const r of (snapshot?.reviews||[])) byId.set(r.id,{...r});
    for(const issue of githubIssues){
      const r=issueReview(issue); if(!r) continue;
      const old=byId.get(r.id)||{};
      byId.set(r.id,{...old,...r});
    }
    return [...byId.values()];
  }

  function render() {
    const projects = snapshot?.projects || [];
    const tasks = mergedTasks();
    const blockers = mergedBlockers().filter(b => b.state !== 'RESOLVED');
    const reviews = mergedReviews().filter(r => r.state !== 'COMPLETED');
    const active = tasks.filter(t => ['CLAIMED','RUNNING'].includes(t.state));
    const agents = new Set(active.map(t => t.lease?.agent_id || t.claimed_by).filter(Boolean));

    $('metric-projects').textContent = projects.length;
    $('metric-running').textContent = active.length;
    $('metric-blockers').textContent = blockers.length;
    $('metric-reviews').textContent = reviews.length;
    $('metric-agents').textContent = agents.size;

    fillSelect('project-filter', [...new Set(projects.map(p => p.lifecycle))].sort());
    fillSelect('task-filter', [...new Set(tasks.map(t => t.state))].sort());

    const q = $('search').value.trim().toLowerCase();
    const pf = $('project-filter').value;
    const tf = $('task-filter').value;
    const match = obj => !q || JSON.stringify(obj).toLowerCase().includes(q);

    const taskCounts = new Map(), blockerCounts = new Map(), reviewCounts = new Map();
    tasks.forEach(t => taskCounts.set(t.project_id,(taskCounts.get(t.project_id)||0)+1));
    blockers.forEach(b => blockerCounts.set(b.project_id,(blockerCounts.get(b.project_id)||0)+1));
    reviews.forEach(r => reviewCounts.set(r.project_id,(reviewCounts.get(r.project_id)||0)+1));

    $('projects').innerHTML = projects.filter(p => (!pf || p.lifecycle===pf) && match(p)).map(p => `
      <article class="card">
        <div class="row-head"><h3>${esc(p.name)}</h3>${badge(p.lifecycle)}</div>
        <div class="meta small">
          <span>${taskCounts.get(p.id)||0} tasks</span><span>·</span><span>${blockerCounts.get(p.id)||0} blockers</span><span>·</span><span>${reviewCounts.get(p.id)||0} reviews</span>
          ${p.parent_project_id ? `<span>· child of ${esc(p.parent_project_id)}</span>` : ''}
        </div>
      </article>`).join('') || '<p class="muted">No matching projects.</p>';

    $('tasks').innerHTML = tasks.filter(t => (!tf || t.state===tf) && match(t)).map(t => `
      <article class="row">
        <div class="row-head">
          <div>
            <h3>${t.issue_url ? `<a class="issue-link" href="${esc(t.issue_url)}">${esc(t.title)}</a>` : esc(t.title)}</h3>
            <div class="meta">${badge(t.state)} ${badge(t.priority||'P2')} <span class="small">${esc(t.project_id||'unmapped')}</span></div>
          </div>
          <span class="small muted">${when(t.updated_at)}</span>
        </div>
        <p class="small">Owner: <strong>${esc(t.claimed_by || 'unclaimed')}</strong>${t.lease ? ` · Lock: ${esc(t.lease.state)} by ${esc(t.lease.agent_id||'—')} until ${when(t.lease.expires_at)}` : ''}</p>
        ${t.next_action ? `<p class="small"><strong>Next:</strong> ${esc(t.next_action)}</p>` : ''}
      </article>`).join('') || '<p class="muted">No matching tasks.</p>';

    $('blockers').innerHTML = blockers.filter(match).map(b => `
      <article class="row">
        <div class="row-head"><h3>${b.issue_url ? `<a class="issue-link" href="${esc(b.issue_url)}">${esc(b.summary||b.id)}</a>` : esc(b.summary||b.id)}</h3>${badge(b.severity||'MEDIUM')}</div>
        <p class="small">${esc(b.project_id||'unmapped')} · task ${esc(b.task_id||'—')}</p>
        <p>${esc(b.required_next_action||'')}</p>
      </article>`).join('') || '<p class="muted">No open blockers.</p>';

    $('reviews').innerHTML = reviews.filter(match).map(r => `
      <article class="row">
        <div class="row-head">
          <div>
            <h3>${r.issue_url ? `<a class="issue-link" href="${esc(r.issue_url)}">${esc(r.title||r.id)}</a>` : esc(r.title||r.id)}</h3>
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
      </article>`).join('') || '<p class="muted">No open review requests.</p>';

    $('activity').innerHTML = (snapshot?.activity||[]).slice().reverse().filter(match).slice(0,50).map(e => `
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

  document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===btn));
    document.querySelectorAll('.panel').forEach(x=>x.classList.toggle('active',x.id===btn.dataset.panel));
  }));
  ['search','project-filter','task-filter'].forEach(id=>$(id).addEventListener('input',()=>snapshot&&render()));
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

  fetchState(true);
  fetchPrompts();
  setInterval(()=>fetchState(false),refreshMs);
})();