/* iQMS v2 — shell: sidebar navigation (generated from the process structure) and global search. */
(() => {
  'use strict';
  const { esc, icon } = Q;
  const sb = document.getElementById('sidebar');
  const nav = document.getElementById('sbNav');
  const foot = document.getElementById('sbFoot');
  const pin = document.getElementById('sbPin');
  const desktop = () => matchMedia('(min-width: 1024px)').matches;
  Q.UI.groups = Q.UI.groups || {};
  let procFilter = '';

  /* ---------- Sidebar ---------- */
  const item = (href, key, iconName, label, extra = '') =>
    `<a class="sb-item" href="${href}" data-nav="${key}" title="${esc(label)}">${icon(iconName)}<span class="lbl">${esc(label)}</span>${extra}</a>`;
  const group = (id, label, body, tools = '') => {
    const collapsed = !!Q.UI.groups[id];
    return `<div class="sb-group" data-group="${id}" data-collapsed="${collapsed}"><button class="sb-group-head" type="button" aria-expanded="${!collapsed}" data-toggle-group="${id}">${esc(label)}${icon('chevron-down')}</button><div class="sb-items">${tools}${body}</div></div>`;
  };

  Q.renderSidebar = () => {
    const S = Q.S;
    document.getElementById('orgName').textContent = S.organization.name;
    document.getElementById('orgMeta').textContent = S.organization.industry;
    document.getElementById('orgMark').textContent = S.organization.initials;
    const me = Q.person(Q.me());
    document.getElementById('meName').textContent = me.name;
    document.getElementById('meTitle').textContent = me.title;
    document.getElementById('meAvatar').textContent = Q.initials(Q.me());

    const top = Q.topProcesses();
    const f = procFilter.trim().toLowerCase();
    const shown = top.filter(p => !f || `${p.process_code} ${p.name}`.toLowerCase().includes(f));
    const procItems = shown.map(p => `<a class="sb-item" href="#/process/${p.process_id}" data-nav="process:${p.process_id}" title="${esc(p.process_code + ' ' + p.name)}"><span class="sb-code">${esc(p.process_code)}</span><span class="lbl">${esc(p.name)}</span></a>`).join('')
      || `<p class="sb-empty">No process matches “${esc(procFilter)}”.</p>`;
    const filter = top.length > 8 ? `<label class="sb-filter">${icon('filter')}<span class="sr-only">Filter processes</span><input id="sbProcFilter" type="search" placeholder="Filter ${top.length} processes" value="${esc(procFilter)}"></label>` : '';
    const mine = Q.myWorkflows().length;

    nav.innerHTML =
      item('#/overview', 'overview', 'layout-dashboard', 'Overview') +
      group('processes', 'Processes', procItems, filter) +
      group('cross', 'Across all processes',
        item('#/documents', 'documents', 'files', 'Documents') +
        item('#/review', 'review', 'file-check', 'Documents in Review', mine ? `<span class="count" title="${mine} awaiting your action">${mine}</span>` : '') +
        item('#/risks', 'risks', 'shield-alert', 'Risks & Opportunities') +
        item('#/kpis', 'kpis', 'target', 'Objectives & KPIs') +
        item('#/evidence', 'evidence', 'paperclip', 'Evidence') +
        item('#/audit', 'audit', 'search-check', 'Audits & Corrective Actions')) +
      group('gov', 'Governance',
        item('#/iso', 'iso', 'badge-check', 'ISO 9001 Readiness') +
        item('#/reports', 'reports', 'chart-no-axes-combined', 'Reports'));
    foot.innerHTML = item('#/settings', 'settings', 'settings', 'Settings');
    Q.refreshIcons();
    const input = document.getElementById('sbProcFilter');
    if (input) input.addEventListener('input', () => { procFilter = input.value; const pos = input.selectionStart; Q.renderSidebar(); Q.syncSidebar(); const again = document.getElementById('sbProcFilter'); again.focus(); again.setSelectionRange(pos, pos); });
    Q.syncSidebar();
  };

  let current = { name: 'overview', parts: [] };
  Q.syncSidebar = (name, parts) => {
    if (name) current = { name, parts: parts || [] };
    let key = current.name;
    if (current.name === 'process' && current.parts[1]) key = 'process:' + Q.rootId(current.parts[1]);
    if (current.name === 'review') key = 'review';
    sb.querySelectorAll('[data-nav]').forEach(a => {
      const on = a.dataset.nav === key;
      a.classList.toggle('active', on);
      on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });
  };

  nav.addEventListener('click', e => {
    const t = e.target.closest('[data-toggle-group]');
    if (t) {
      const id = t.dataset.toggleGroup; Q.UI.groups[id] = !Q.UI.groups[id]; Q.saveUI();
      const g = t.closest('.sb-group'); g.dataset.collapsed = String(!!Q.UI.groups[id]); t.setAttribute('aria-expanded', String(!Q.UI.groups[id]));
    }
  });
  sb.addEventListener('click', e => { if (e.target.closest('a.sb-item') && !desktop()) setDrawer(false); });

  /* Hover-expand + pin (desktop). */
  const setExpanded = on => sb.classList.toggle('expanded', on || document.body.classList.contains('sb-pinned') || !desktop());
  const setPinned = on => {
    document.body.classList.toggle('sb-pinned', on);
    pin.setAttribute('aria-pressed', String(on));
    const label = on ? 'Unpin sidebar' : 'Pin sidebar';
    pin.setAttribute('aria-label', label); pin.title = label;
    pin.innerHTML = icon(on ? 'pin-off' : 'pin'); Q.refreshIcons();
    sb.classList.toggle('pinned', on);
    setExpanded(on || sb.matches(':hover'));
    Q.UI.pinned = on; Q.saveUI();
  };
  pin.addEventListener('click', () => setPinned(!document.body.classList.contains('sb-pinned')));
  let leaveTimer;
  sb.addEventListener('mouseover', () => { clearTimeout(leaveTimer); if (desktop() && !sb.classList.contains('expanded')) setExpanded(true); });
  sb.addEventListener('mouseleave', () => { leaveTimer = setTimeout(() => { if (!sb.contains(document.activeElement) || document.activeElement === document.body) setExpanded(false); }, 120); });
  sb.addEventListener('focusin', () => setExpanded(true));
  sb.addEventListener('focusout', () => requestAnimationFrame(() => { if (!sb.contains(document.activeElement) && !sb.matches(':hover')) setExpanded(false); }));

  /* Drawer (< 1024 px). */
  const menuBtn = document.getElementById('menuBtn');
  let backdrop = null;
  function setDrawer(open) {
    document.body.classList.toggle('nav-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) { backdrop = document.createElement('div'); backdrop.className = 'nav-backdrop'; backdrop.addEventListener('click', () => setDrawer(false)); document.body.append(backdrop); sb.querySelector('a.sb-item')?.focus(); }
    else { backdrop?.remove(); backdrop = null; }
  }
  menuBtn.addEventListener('click', () => setDrawer(!document.body.classList.contains('nav-open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { setDrawer(false); menuBtn.focus(); } });
  matchMedia('(min-width: 1024px)').addEventListener('change', () => { setDrawer(false); setPinned(!!Q.UI.pinned); setExpanded(false); });

  /* ---------- Global search (all record types) ---------- */
  const input = document.getElementById('searchInput');
  const box = document.getElementById('searchResults');
  const index = () => {
    const S = Q.S, out = [];
    Q.S.processes.filter(p => p.status === 'active').forEach(p => out.push({ g: 'Processes', icon: 'workflow', t: `${p.process_code} ${p.name}`, m: `Owner: ${Q.pname(p.owner)}`, go: () => Q.go(`#/process/${p.process_id}`), s: `${p.process_code} ${p.name} ${p.purpose}` }));
    S.documents.forEach(d => out.push({ g: 'Documents', icon: 'file-text', t: d.title, m: `${d.id} · Rev ${d.rev || d.workingRev} · ${Q.plabel(d.process)}`, go: () => Q.openDocument(d.id), s: `${d.id} ${d.title} ${d.type}` }));
    S.risks.forEach(r => out.push({ g: 'Risks & Opportunities', icon: 'shield-alert', t: r.title, m: `${r.id} · ${r.kind} · ${Q.plabel(r.process)}`, go: () => Q.go(`#/risks?focus=${r.id}`), s: `${r.id} ${r.title} ${r.treatment}` }));
    S.kpis.forEach(k => out.push({ g: 'KPIs', icon: 'target', t: k.name, m: `${Q.plabel(k.process)} · actual ${Q.kpiFmt(k.actual, k)} vs target ${k.dir} ${Q.kpiFmt(k.target, k)}`, go: () => Q.go(`#/kpis?focus=${k.id}`), s: `${k.name} ${k.objective}` }));
    S.evidence.forEach(e => out.push({ g: 'Evidence', icon: 'paperclip', t: e.name, m: `${e.source.system} · ${e.status} · ${Q.plabel(e.process)}`, go: () => Q.go(`#/evidence?focus=${e.id}`), s: `${e.id} ${e.name} ${e.control} ${e.source.record}` }));
    S.findings.forEach(f => out.push({ g: 'Audit findings & actions', icon: 'search-check', t: f.title, m: `${f.id} · ${f.type} · ${Q.plabel(f.process)}`, go: () => Q.go(`#/audit/findings?focus=${f.id}`), s: `${f.id} ${f.title}` }));
    S.actions.forEach(a => out.push({ g: 'Audit findings & actions', icon: 'list-checks', t: a.title, m: `${a.id} · Corrective action · ${a.status}`, go: () => Q.go(`#/audit/actions?focus=${a.id}`), s: `${a.id} ${a.title} ${a.rootCause}` }));
    return out;
  };
  let results = [];
  const close = () => { box.hidden = true; input.setAttribute('aria-expanded', 'false'); };
  const renderSearch = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { close(); return; }
    results = index().filter(r => r.s.toLowerCase().includes(q) || r.t.toLowerCase().includes(q));
    const groups = {};
    results.forEach(r => { (groups[r.g] = groups[r.g] || []).push(r); });
    let i = 0;
    box.innerHTML = results.length ? Object.entries(groups).map(([g, list]) => `<h4>${esc(g)} <span class="muted">${list.length}</span></h4>` + list.slice(0, 5).map(r => `<button type="button" role="option" data-i="${results.indexOf(r)}" id="sr-${i++}">${icon(r.icon)}<span><span class="r-title">${esc(r.t)}</span><br><span class="r-meta">${esc(r.m)}</span></span></button>`).join('')).join('')
      : `<p class="none">No results for “${esc(input.value)}”. Search covers processes, documents, risks, KPIs, evidence, findings and corrective actions.</p>`;
    box.hidden = false; input.setAttribute('aria-expanded', 'true'); Q.refreshIcons();
  };
  input.addEventListener('input', renderSearch);
  input.addEventListener('focus', () => input.value && renderSearch());
  box.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { const r = results[b.dataset.i]; close(); input.value = ''; r.go(); } });
  document.getElementById('search').addEventListener('keydown', e => {
    const opts = [...box.querySelectorAll('[data-i]')];
    const idx = opts.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' && !box.hidden) { e.preventDefault(); (opts[idx + 1] || opts[0])?.focus(); }
    else if (e.key === 'ArrowUp' && !box.hidden) { e.preventDefault(); idx <= 0 ? input.focus() : opts[idx - 1].focus(); }
    else if (e.key === 'Enter' && document.activeElement === input) { opts[0]?.click(); }
    else if (e.key === 'Escape') { close(); input.focus(); }
  });
  document.addEventListener('mousedown', e => { if (!e.target.closest('#search')) close(); });
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.focus(); input.select(); } });

  /* ---------- Boot ---------- */
  Q.boot = () => {
    Q.renderSidebar();
    setPinned(!!Q.UI.pinned && desktop());
    setExpanded(false);
    if (!location.hash) history.replaceState(null, '', '#/overview');
    Q.render();
  };
})();