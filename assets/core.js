/* iQMS v2 — core: state, derived data, shared components, router. */
(() => {
  'use strict';
  const SEED = window.QMS_DATA;
  const STORE_KEY = 'iqms.v2.data';
  const UI_KEY = 'iqms.v2.ui';
  const clone = v => JSON.parse(JSON.stringify(v));

  const Q = window.Q = { views: {}, actions: {}, tables: {} };

  /* ---------------- State (browser-local; sample data) ---------------- */
  function loadData() {
    try { const s = JSON.parse(localStorage.getItem(STORE_KEY)); if (s && s.v === 3 && s.data) return s.data; } catch (_) { /* storage unavailable */ }
    return clone(SEED);
  }
  Q.S = loadData();
  Q.save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify({ v: 3, data: Q.S })); } catch (_) { /* ignore */ } };
  Q.resetData = () => { Q.S = clone(SEED); try { localStorage.removeItem(STORE_KEY); } catch (_) { /* ignore */ } };
  Q.UI = (() => { try { return JSON.parse(localStorage.getItem(UI_KEY)) || {}; } catch (_) { return {}; } })();
  Q.saveUI = () => { try { localStorage.setItem(UI_KEY, JSON.stringify(Q.UI)); } catch (_) { /* ignore */ } };

  /* ---------------- Helpers ---------------- */
  const esc = Q.esc = (v = '') => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  Q.icon = (name, cls = '') => `<i data-lucide="${name}"${cls ? ` class="${cls}"` : ''}></i>`;
  Q.refreshIcons = () => { if (window.lucide) window.lucide.createIcons(); };
  Q.today = () => Q.S.organization.today;
  Q.me = () => Q.S.currentUser;
  Q.person = id => Q.S.people[id] || { name: id || '—', title: '', dept: '' };
  Q.pname = id => id ? Q.person(id).name : '—';
  Q.initials = id => Q.pname(id).split(' ').map(s => s[0]).slice(0, 2).join('');
  Q.who = id => id === Q.me() ? `${esc(Q.pname(id))} <span class="muted">(you)</span>` : esc(Q.pname(id));
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  Q.fmt = d => { if (!d) return '—'; const [y, m, day] = d.slice(0, 10).split('-'); return `${Number(day)} ${MONTHS[Number(m) - 1]} ${y}`; };
  Q.days = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
  Q.addDays = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  Q.addYears = (d, n) => `${Number(d.slice(0, 4)) + n}${d.slice(4)}`;
  Q.uid = p => `${p}-${Date.now().toString(36).slice(-5).toUpperCase()}`;

  /* ---------------- Processes ---------------- */
  Q.proc = id => Q.S.processes.find(p => p.process_id === id);
  Q.byOrder = (a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name);
  Q.topProcesses = (includeArchived = false) => Q.S.processes.filter(p => !p.parent_process_id && (includeArchived || p.status === 'active')).sort(Q.byOrder);
  Q.children = (id, includeArchived = false) => Q.S.processes.filter(p => p.parent_process_id === id && (includeArchived || p.status === 'active')).sort(Q.byOrder);
  Q.rootId = id => { const p = Q.proc(id); return p && p.parent_process_id ? Q.rootId(p.parent_process_id) : id; };
  Q.inProc = (recordPid, pid) => { if (!pid || pid === 'all') return true; let cur = Q.proc(recordPid); while (cur) { if (cur.process_id === pid) return true; cur = Q.proc(cur.parent_process_id); } return false; };
  Q.plabel = id => { const p = Q.proc(id); return p ? `${p.process_code} ${p.name}` : '—'; };
  Q.pcell = id => { const p = Q.proc(id); if (!p) return '—'; return `<a class="proc" href="#/process/${p.process_id}" title="${esc(p.process_code + ' ' + p.name)}"><b>${esc(p.process_code)}</b>${esc(p.name)}</a>`; };
  Q.processOptions = (selected = 'all', { all = 'All processes', withChildren = true } = {}) => {
    let html = all ? `<option value="all">${esc(all)}</option>` : '';
    Q.topProcesses().forEach(p => {
      html += `<option value="${p.process_id}"${p.process_id === selected ? ' selected' : ''}>${esc(p.process_code + ' ' + p.name)}</option>`;
      if (withChildren) Q.children(p.process_id).forEach(c => { html += `<option value="${c.process_id}"${c.process_id === selected ? ' selected' : ''}>&nbsp;&nbsp;&nbsp;${esc(c.process_code + ' ' + c.name)}</option>`; });
    });
    return html;
  };
  Q.peopleOptions = (selected, filter = () => true) => Object.entries(Q.S.people).filter(([id]) => filter(id)).map(([id, p]) => `<option value="${id}"${id === selected ? ' selected' : ''}>${esc(p.name)} — ${esc(p.title)}</option>`).join('');

  /* ---------------- Documents & workflows ---------------- */
  Q.doc = id => Q.S.documents.find(d => d.id === id);
  Q.wf = id => Q.S.workflows.find(w => w.id === id);
  Q.wfForDoc = docId => Q.S.workflows.find(w => w.doc === docId);
  Q.docOverdue = d => !!(d.nextReview && d.nextReview < Q.today() && d.rev && !['Obsolete', 'Superseded'].includes(d.status));
  Q.docDueSoon = d => !!(d.nextReview && !Q.docOverdue(d) && Q.days(Q.today(), d.nextReview) <= 30);
  Q.docIso = d => d.iso || Q.S.iso.filter(r => r.controls.includes(d.id)).map(r => r.clause);
  Q.nextRev = r => String((parseInt(r || '-1', 10) || 0) + (r ? 1 : 0)).padStart(2, '0');
  Q.wfAssignees = w => {
    if (!w) return [];
    if (w.changesRequested) return [w.startedBy];
    if (w.stage === 'review') return w.reviewers.filter(r => r.state === 'Pending').map(r => r.who);
    if (w.stage === 'approval') return w.approvers.filter(r => r.state === 'Pending').map(r => r.who);
    if (w.stage === 'publication') return [w.publisher];
    return [];
  };
  Q.wfStatus = w => w.changesRequested ? 'Changes Requested' : w.stage === 'review' ? 'In Review' : w.stage === 'approval' ? 'Approval in Progress' : 'Approved';
  Q.wfStageLabel = w => w.changesRequested ? 'Review — changes requested' : { review: 'Review', approval: 'Approval', publication: 'Publication' }[w.stage];
  Q.assignedToMe = w => Q.wfAssignees(w).includes(Q.me()) && !w.changesRequested;
  Q.myWorkflows = () => Q.S.workflows.filter(Q.assignedToMe);

  const DOC_STATUS = { 'Published': 'success', 'Draft': 'neutral', 'In Review': 'info', 'Changes Requested': 'orange', 'Approval in Progress': 'warning', 'Approved': 'success outline', 'Superseded': 'muted', 'Obsolete': 'muted' };
  Q.st = (text, kind) => `<span class="st ${kind || DOC_STATUS[text] || 'neutral'}">${esc(text)}</span>`;
  Q.docStatus = d => {
    const base = Q.st(d.status);
    return base;
  };
  Q.reviewDate = (date, isOverdue, soon) => {
    if (!date) return '<span class="muted">—</span>';
    if (isOverdue) return `<span class="date-overdue" title="Review overdue">${Q.icon('triangle-alert')} ${Q.fmt(date)}<span class="sr-only"> (overdue)</span></span>`;
    if (soon) return `<span class="date-soon" title="Due within 30 days">${Q.fmt(date)}</span>`;
    return Q.fmt(date);
  };
  Q.dueDate = (date, closed = false) => {
    if (!date) return '—';
    if (!closed && date < Q.today()) return `<span class="date-overdue" title="Overdue">${Q.icon('triangle-alert')} ${Q.fmt(date)}<span class="sr-only"> (overdue)</span></span>`;
    if (!closed && Q.days(Q.today(), date) <= 7) return `<span class="date-soon">${Q.fmt(date)}</span>`;
    return Q.fmt(date);
  };

  /* ---------------- Risks, KPIs, evidence, actions ---------------- */
  Q.riskScore = r => r.likelihood * r.impact;
  Q.riskLevel = r => { const s = Q.riskScore(r); return s >= 15 ? 'High' : s >= 8 ? 'Medium' : 'Low'; };
  Q.riskOpen = r => !['Closed'].includes(r.status);
  Q.kpiOk = k => k.dir === '≥' ? k.actual >= k.target : k.dir === '≤' ? k.actual <= k.target : k.actual === k.target;
  Q.kpiFmt = (v, k) => `${v}${k.unit}`;
  Q.evGap = e => e.status === 'Missing' || e.status === 'Link unavailable';
  Q.actionClosed = a => a.stage === 'Closed';
  Q.actionOverdue = a => !Q.actionClosed(a) && a.due < Q.today();

  /* ---------------- ISO readiness (documented formula) ---------------- */
  Q.ISO_POINTS = { 'Complete': 1, 'Partially Complete': 0.5, 'At Risk': 0, 'Missing': 0 };
  Q.ISO_KIND = { 'Complete': 'success', 'Partially Complete': 'warning', 'At Risk': 'orange', 'Missing': 'danger', 'Not Applicable': 'muted' };
  Q.isoScore = reqs => {
    const c = { 'Complete': 0, 'Partially Complete': 0, 'At Risk': 0, 'Missing': 0, 'Not Applicable': 0 };
    reqs.forEach(r => { c[r.status]++; });
    const applicable = reqs.length - c['Not Applicable'];
    const points = c['Complete'] + c['Partially Complete'] * 0.5;
    return { counts: c, applicable, points, pct: applicable ? Math.round(points / applicable * 100) : null, total: reqs.length };
  };
  Q.isoForProcess = pid => Q.S.iso.filter(r => r.processes.some(p => Q.inProc(p, pid) || Q.inProc(pid, p)));

  /* ---------------- Process statistics ---------------- */
  Q.stats = pid => {
    const inP = x => Q.inProc(x, pid);
    const docs = Q.S.documents.filter(d => inP(d.process));
    const risks = Q.S.risks.filter(r => inP(r.process) && Q.riskOpen(r));
    const kpis = Q.S.kpis.filter(k => inP(k.process));
    const ev = Q.S.evidence.filter(e => inP(e.process));
    const findings = Q.S.findings.filter(f => inP(f.process) && f.status !== 'Closed');
    const actions = Q.S.actions.filter(a => inP(a.process) && !Q.actionClosed(a));
    const iso = Q.isoScore(Q.isoForProcess(pid));
    const s = {
      docs: docs.length, docsOverdue: docs.filter(Q.docOverdue).length, docsInWorkflow: docs.filter(d => Q.wfForDoc(d.id)).length,
      highRisks: risks.filter(r => r.kind === 'Risk' && Q.riskLevel(r) === 'High').length, openRisks: risks.length,
      kpis: kpis.length, kpisBelow: kpis.filter(k => !Q.kpiOk(k)).length,
      evidence: ev.length, evGaps: ev.filter(Q.evGap).length,
      findings: findings.length, majorFindings: findings.filter(f => f.type.startsWith('Major')).length,
      actions: actions.length, actionsOverdue: actions.filter(Q.actionOverdue).length,
      iso, isoGaps: iso.counts['Missing'] + iso.counts['At Risk']
    };
    const score = s.docsOverdue + s.highRisks + s.kpisBelow + s.evGaps + s.actionsOverdue * 2 + s.majorFindings * 2;
    s.health = score >= 5 || s.majorFindings ? 'risk' : score >= 1 ? 'attn' : 'ok';
    return s;
  };
  Q.health = h => ({
    ok: `<span class="health ok">${Q.icon('circle-check')}On track</span>`,
    attn: `<span class="health attn">${Q.icon('circle-dot')}Needs attention</span>`,
    risk: `<span class="health risk">${Q.icon('triangle-alert')}At risk</span>`
  })[h];
  Q.miniProgress = pct => pct == null ? '<span class="muted">—</span>' : `<span class="mini-progress"><span class="track"><span class="fill" style="width:${pct}%"></span></span>${pct}%</span>`;
  Q.num = (n, cls = 'attn') => n ? `<span class="${cls}">${n}</span>` : '<span class="zero">—</span>';

  /* ---------------- Page chrome ---------------- */
  Q.crumbs = items => `<nav class="crumbs" aria-label="Breadcrumb">${items.map((c, i) => i < items.length - 1 ? `<a href="${c[1]}">${esc(c[0])}</a>${Q.icon('chevron-right')}` : `<span aria-current="page">${esc(c[0])}</span>`).join('')}</nav>`;
  Q.pageHead = ({ title, sub = '', actions = '', crumbs = null, pre = '', meta = '' }) =>
    `${crumbs ? Q.crumbs(crumbs) : ''}<div class="page-head"><div>${pre}<h1 tabindex="-1">${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}${meta}</div>${actions ? `<div class="actions">${actions}</div>` : ''}</div>`;
  Q.seg = (name, items, current) => `<div class="seg" role="group" aria-label="${esc(name)}">${items.map(([v, l, n]) => `<button type="button" data-seg="${v}" aria-pressed="${v === current}">${esc(l)}${n != null ? `<span class="n">${n}</span>` : ''}</button>`).join('')}</div>`;
  Q.sparkline = (vals, ok) => {
    const w = 84, h = 24, min = Math.min(...vals), max = Math.max(...vals), rng = max - min || 1;
    const pts = vals.map((v, i) => [2 + i * (w - 4) / (vals.length - 1), h - 3 - (v - min) / rng * (h - 6)]);
    const last = pts[pts.length - 1];
    return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline fill="none" stroke="#9AA5A0" stroke-width="1.5" points="${pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ')}"/><circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.8" fill="${ok ? 'var(--success)' : 'var(--danger)'}"/></svg>`;
  };

  /* ---------------- Toast ---------------- */
  Q.toast = (title, msg = '') => {
    const host = document.getElementById('toastHost');
    const el = document.createElement('div');
    el.className = 'toast'; el.setAttribute('role', 'status');
    el.innerHTML = `${Q.icon('circle-check')}<div><b>${esc(title)}</b>${esc(msg)}</div>`;
    host.append(el); Q.refreshIcons();
    setTimeout(() => el.remove(), 4200);
  };

  /* ---------------- Modals (stackable, focus-trapped) ---------------- */
  const stack = [];
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  Q.openModal = ({ size = 'm', title, sub = '', body, foot = '', headActions = '', onMount, label }) => {
    const root = document.createElement('div');
    root.className = 'modal-root';
    const id = 'm' + Math.random().toString(36).slice(2, 8);
    root.innerHTML = `<div class="modal ${size}" role="dialog" aria-modal="true" aria-labelledby="${id}">
      <div class="modal-head"><div style="min-width:0"><h2 id="${id}">${title}</h2>${sub ? `<div class="sub">${sub}</div>` : ''}</div>
      <div class="actions">${headActions}<button class="icon-btn" type="button" data-close aria-label="Close${label ? ' ' + esc(label) : ''}">${Q.icon('x')}</button></div></div>
      ${body}${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div>`;
    const prev = document.activeElement;
    document.getElementById('modalHost').append(root);
    document.querySelector('.main').inert = true; document.getElementById('sidebar').inert = true;
    stack.forEach(m => { m.root.inert = true; });
    const entry = { root, prev };
    stack.push(entry);
    root.addEventListener('mousedown', e => { if (e.target === root) Q.closeModal(); });
    root.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => Q.closeModal()));
    Q.refreshIcons();
    if (onMount) onMount(root.querySelector('.modal'));
    const first = root.querySelector('[autofocus]') || root.querySelector('.modal-body ' + FOCUSABLE) || root.querySelector(FOCUSABLE);
    first && first.focus();
    return root.querySelector('.modal');
  };
  Q.closeModal = () => {
    const entry = stack.pop(); if (!entry) return;
    entry.root.remove();
    if (stack.length) stack[stack.length - 1].root.inert = false;
    else { document.querySelector('.main').inert = false; document.getElementById('sidebar').inert = false; }
    if (entry.prev && document.contains(entry.prev)) entry.prev.focus();
  };
  Q.closeAllModals = () => { while (stack.length) Q.closeModal(); };
  Q.modalOpen = () => stack.length > 0;
  document.addEventListener('keydown', e => {
    if (!stack.length) return;
    const top = stack[stack.length - 1].root;
    if (e.key === 'Escape') { e.preventDefault(); Q.closeModal(); return; }
    if (e.key === 'Tab') {
      const f = [...top.querySelectorAll(FOCUSABLE)].filter(el => el.getClientRects().length);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { f[f.length - 1].focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { f[0].focus(); e.preventDefault(); }
    }
  });
  Q.confirm = ({ title, body, confirm = 'Confirm', danger = false, onConfirm }) => {
    const m = Q.openModal({ size: 's', title, body: `<div class="modal-body">${body}</div>`,
      foot: `<button class="btn" type="button" data-close>Cancel</button><button class="btn ${danger ? 'danger-solid' : 'primary'}" type="button" data-ok>${esc(confirm)}</button>` });
    m.querySelector('[data-ok]').addEventListener('click', () => { Q.closeModal(); onConfirm(); });
  };
  Q.formValues = form => Object.fromEntries(new FormData(form).entries());
  Q.validate = form => {
    let ok = true;
    form.querySelectorAll('[required]').forEach(el => {
      const bad = !String(el.value || '').trim();
      el.setAttribute('aria-invalid', bad ? 'true' : 'false');
      el.style.borderColor = bad ? 'var(--danger)' : '';
      if (bad && ok) { el.focus(); ok = false; }
    });
    return ok;
  };

  /* ---------------- Menus (kebab / add) ---------------- */
  Q.closeMenus = except => document.querySelectorAll('.menu').forEach(m => { if (m !== except) { m.hidden = true; m.previousElementSibling?.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-menu-toggle]');
    if (t) { const m = t.nextElementSibling; const open = m.hidden; Q.closeMenus(m); m.hidden = !open; t.setAttribute('aria-expanded', String(open)); if (open) m.querySelector('button:not([disabled])')?.focus(); e.stopPropagation(); return; }
    if (!e.target.closest('.menu')) Q.closeMenus();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !stack.length) { const open = [...document.querySelectorAll('.menu')].find(m => !m.hidden); if (open) { Q.closeMenus(); open.previousElementSibling?.focus(); } } });
  Q.menu = (label, items, { icon = 'ellipsis', text = '', cls = 'btn sm', align = '' } = {}) =>
    `<div class="menu-wrap"><button class="${cls}" type="button" data-menu-toggle aria-haspopup="true" aria-expanded="false" aria-label="${esc(label)}">${icon ? Q.icon(icon) : ''}${text ? esc(text) : ''}</button><div class="menu" role="menu" hidden style="${align}">${items.map(it => it === '-' ? '<hr>' : it.note ? `<p class="menu-note">${it.note}</p>` : `<button type="button" role="menuitem" ${it.disabled ? 'disabled' : ''} class="${it.cls || ''}" ${Object.entries(it.data || {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')}${it.title ? ` title="${esc(it.title)}"` : ''}>${it.icon ? Q.icon(it.icon) : ''}${esc(it.label)}</button>`).join('')}</div></div>`;

  /* ---------------- Global delegated actions ---------------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const fn = Q.actions[el.dataset.action];
    if (fn) { e.preventDefault(); Q.closeMenus(); fn(el.dataset, el, e); }
  });
  Q.actions.toast = d => Q.toast(d.title || 'Not in this mock', d.msg || '');

  /* ---------------- Table engine ----------------
   * Row click never opens anything. Selectable tables toggle selection;
   * opening is always an explicit button.                                    */
  Q.table = cfg => {
    // Filter state survives re-renders within the session; URL-provided filters win.
    const prev = Q.tables[cfg.id];
    const fresh = cfg.initialFilters || cfg.initialSeg;
    const t = Q.tables[cfg.id] = prev && !fresh ? Object.assign(prev, { cfg }) : { q: '', filters: {}, sort: null, seg: cfg.segDefault || 'all', cfg };
    if (cfg.initialFilters) Object.assign(t.filters, cfg.initialFilters);
    if (cfg.initialSeg) t.seg = cfg.initialSeg;
    t.selected = new Set();
    return `<div class="table-wrap" id="tw-${cfg.id}">${cfg.tools ? `<div class="table-tools">${cfg.tools}</div>` : ''}<div id="tb-${cfg.id}"></div></div>`;
  };
  Q.tableRows = id => {
    const t = Q.tables[id], c = t.cfg;
    let rows = c.rows();
    if (t.q && c.search) { const q = t.q.toLowerCase(); rows = rows.filter(r => c.search(r).toLowerCase().includes(q)); }
    Object.entries(t.filters).forEach(([k, v]) => { if (v && v !== 'all' && c.filters?.[k]) rows = rows.filter(r => c.filters[k](r, v)); });
    if (c.segs && t.seg && t.seg !== 'all') rows = rows.filter(r => c.segs[t.seg](r));
    if (t.sort) { const col = c.columns.find(x => x.key === t.sort.key); if (col?.sort) rows = [...rows].sort((a, b) => { const x = col.sort(a), y = col.sort(b); return (x > y ? 1 : x < y ? -1 : 0) * t.sort.dir; }); }
    return rows;
  };
  Q.renderTable = id => {
    const t = Q.tables[id], c = t.cfg, host = document.getElementById('tb-' + id);
    if (!host) return;
    const rows = Q.tableRows(id);
    const key = c.key || (r => r.id);
    [...t.selected].forEach(k => { if (!rows.some(r => key(r) === k)) t.selected.delete(k); });
    const head = `${c.selectable ? `<th class="c-check"><input class="row-check" type="checkbox" data-check-all aria-label="Select all rows" ${rows.length && rows.every(r => t.selected.has(key(r))) ? 'checked' : ''}></th>` : ''}${c.columns.map(col => {
      const sorted = t.sort?.key === col.key;
      const aria = col.sort ? ` aria-sort="${sorted ? (t.sort.dir > 0 ? 'ascending' : 'descending') : 'none'}"` : '';
      return `<th class="${col.cls || ''}${col.sort ? ' sortable' : ''}"${aria}${col.width || col.min ? ` style="${col.width ? 'width:' + col.width + ';' : ''}${col.min ? 'min-width:' + col.min : ''}"` : ''} scope="col">${col.sort ? `<button type="button" class="link-btn" style="color:inherit;font-weight:600" data-sort="${col.key}">${esc(col.label)}<span class="sort">${sorted ? Q.icon(t.sort.dir > 0 ? 'arrow-up' : 'arrow-down') : ''}</span></button>` : esc(col.label)}</th>`;
    }).join('')}`;
    const body = rows.map(r => {
      const k = key(r), sel = t.selected.has(k);
      return `<tr class="${c.selectable ? 'selectable' : ''}${sel ? ' selected' : ''}${c.rowClass ? ' ' + c.rowClass(r) : ''}" data-key="${esc(k)}"${c.selectable ? ` aria-selected="${sel}"` : ''}>${c.selectable ? `<td class="c-check"><input class="row-check" type="checkbox" ${sel ? 'checked' : ''} aria-label="Select ${esc(c.rowLabel ? c.rowLabel(r) : k)}"></td>` : ''}${c.columns.map(col => `<td class="${col.cls || ''}">${col.render(r)}</td>`).join('')}</tr>`;
    }).join('');
    const empty = typeof c.empty === 'function' ? c.empty(t) : c.empty;
    const selBar = c.selectable && t.selected.size && c.selectionBar ? `<div class="selection-bar" role="region" aria-label="Selection actions"><b>${t.selected.size} selected</b>${c.selectionBar([...t.selected])}<button class="btn sm ghost" type="button" data-clear-sel style="margin-left:auto">Clear selection</button></div>` : '';
    host.innerHTML = rows.length
      ? `<div class="table-scroll"><table class="dt${c.tight ? ' tight' : ''}"><caption class="sr-only">${esc(c.caption || c.id)}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>${selBar}${c.foot === false ? '' : `<div class="table-foot"><span>${rows.length} of ${c.rows().length} ${esc(c.noun || 'records')}</span>${c.footExtra ? c.footExtra() : ''}</div>`}`
      : `<div class="empty">${empty || '<h3>No matching records</h3><p>Try clearing a filter.</p>'}</div>`;
    Q.refreshIcons();
    if (c.after) c.after(host);
  };
  Q.initTable = id => {
    const t = Q.tables[id], c = t.cfg, wrap = document.getElementById('tw-' + id);
    if (!wrap) return;
    const key = c.key || (r => r.id);
    wrap.querySelectorAll('[data-filter]').forEach(el => {
      const k = el.dataset.filter;
      if (t.filters[k]) el.value = t.filters[k];
      el.addEventListener('change', () => { t.filters[k] = el.value; Q.renderTable(id); });
    });
    const s = wrap.querySelector('[data-search]');
    if (s) { s.value = t.q || ''; s.addEventListener('input', () => { t.q = s.value; Q.renderTable(id); }); }
    wrap.querySelectorAll('[data-seg]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.seg === t.seg)));
    wrap.querySelectorAll('[data-seg]').forEach(b => b.addEventListener('click', () => {
      t.seg = b.dataset.seg; wrap.querySelectorAll('[data-seg]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); Q.renderTable(id);
    }));
    wrap.addEventListener('click', e => {
      const sortBtn = e.target.closest('[data-sort]');
      if (sortBtn) { const k = sortBtn.dataset.sort; t.sort = t.sort?.key === k ? (t.sort.dir > 0 ? { key: k, dir: -1 } : null) : { key: k, dir: 1 }; Q.renderTable(id); wrap.querySelector(`[data-sort="${k}"]`)?.focus(); return; }
      if (e.target.closest('[data-clear-sel]')) { t.selected.clear(); Q.renderTable(id); return; }
      if (!c.selectable) return;
      if (e.target.matches('[data-check-all]')) { const rows = Q.tableRows(id); const all = rows.every(r => t.selected.has(key(r))); rows.forEach(r => all ? t.selected.delete(key(r)) : t.selected.add(key(r))); Q.renderTable(id); return; }
      const tr = e.target.closest('tbody tr');
      if (!tr) return;
      if (e.target.closest('button, a, select, .menu-wrap, input:not(.row-check)')) return;
      const k = tr.dataset.key;
      // Checkbox or Ctrl/Cmd-click toggles multi-selection; a plain row click selects just that row.
      if (e.target.matches('.row-check') || e.ctrlKey || e.metaKey) t.selected.has(k) ? t.selected.delete(k) : t.selected.add(k);
      else if (t.selected.size === 1 && t.selected.has(k)) t.selected.clear();
      else { t.selected.clear(); t.selected.add(k); }
      Q.renderTable(id);
      document.querySelector(`#tb-${id} tr[data-key="${CSS.escape(k)}"] .row-check`)?.focus();
    });
    Q.renderTable(id);
  };

  /* ---------------- Router ---------------- */
  Q.route = () => {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    return { parts: path.split('/').filter(Boolean), q: Object.fromEntries(new URLSearchParams(qs || '')) };
  };
  Q.go = hash => { if (location.hash === hash) Q.render(); else location.hash = hash; };
  let lastPath = null;
  Q.render = (opts = {}) => {
    const { parts, q } = Q.route();
    const name = parts[0] || 'overview';
    const view = Q.views[name] || Q.views.overview;
    Q.closeMenus();
    if (!opts.keepModals) Q.closeAllModals();
    const out = view(parts.slice(1), q) || {};
    const main = document.getElementById('main');
    main.innerHTML = out.html || '';
    main.className = out.full ? 'full' : 'page';
    document.title = `${out.title || 'iQMS'} · iQMS`;
    Q.refreshIcons();
    if (out.after) out.after(main);
    main.querySelectorAll('[id^="tw-"]').forEach(w => Q.initTable(w.id.slice(3)));
    Q.syncSidebar?.(out.nav || name, parts);
    const path = parts.slice(0, 2).join('/');
    if (lastPath !== null && path !== lastPath && !opts.noFocus) { window.scrollTo(0, 0); main.querySelector('h1')?.focus({ preventScroll: true }); }
    lastPath = path;
    if (q.focus) setTimeout(() => {
      const row = main.querySelector(`tr[data-key="${CSS.escape(q.focus)}"]`);
      if (row) { row.classList.add('flash'); row.scrollIntoView({ block: 'center' }); }
    }, 30);
  };
  window.addEventListener('hashchange', () => Q.render());
})();