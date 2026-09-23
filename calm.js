/* Calm workspace interactions. The existing document and workflow model stays in app.js. */
(() => {
  const nav = document.querySelector('.sideNav');
  const main = document.querySelector('.mainArea');
  const openNav = document.getElementById('openNavigation');
  const closeNav = document.getElementById('closeNavigation');
  const backdrop = document.createElement('div');
  backdrop.className = 'navigationBackdrop';
  backdrop.hidden = true;
  document.body.append(backdrop);
  function setNavigation(open) {
    document.body.classList.toggle('mobileNavOpen', open);
    openNav.setAttribute('aria-expanded', String(open));
    main.inert = open;
    backdrop.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      nav.setAttribute('role', 'dialog');
      nav.setAttribute('aria-modal', 'true');
      closeNav.focus();
    } else {
      nav.removeAttribute('role');
      nav.removeAttribute('aria-modal');
    }
  }
  openNav.addEventListener('click', () => setNavigation(true));
  closeNav.addEventListener('click', () => { setNavigation(false); openNav.focus(); });
  backdrop.addEventListener('click', () => { setNavigation(false); openNav.focus(); });
  matchMedia('(min-width: 781px)').addEventListener('change', e => { if (e.matches) setNavigation(false); });
  document.addEventListener('keydown', e => {
    if (!document.body.classList.contains('mobileNavOpen')) return;
    if (e.key === 'Escape') { setNavigation(false); openNav.focus(); e.preventDefault(); }
    if (e.key === 'Tab') {
      const buttons = [...nav.querySelectorAll('button, summary')].filter(b => b.getClientRects().length);
      const first = buttons[0], last = buttons.at(-1);
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  });

  let restoringHistory = false;
  function synchronizeView(id, moveFocus = true) {
    setNavigation(false);
    document.querySelectorAll('.navItem[data-view]').forEach(item => {
      item.classList.toggle('active', item.dataset.view === id);
      if (item.dataset.view === id) {
        item.setAttribute('aria-current', 'page');
        const group = item.closest('details');
        if (group) group.open = true;
      } else item.removeAttribute('aria-current');
    });
    if (!restoringHistory && location.hash !== '#/' + id) history.pushState(null, '', '#/' + id);
    document.title = (viewLabels[id] || 'Workspace') + ' · iQMS';
    if (moveFocus) {
      const title = document.querySelector('.view.active h1');
      if (title && document.activeElement !== document.body) { title.tabIndex = -1; title.focus({ preventScroll: true }); }
    }
  }
  document.addEventListener('qms:viewchange', e => synchronizeView(e.detail.id));
  function restoreView() {
    const id = location.hash.replace(/^#\/?/, '');
    const target = document.getElementById(id);
    restoringHistory = true;
    if (target?.classList.contains('view')) showView(id);
    else showView('dashboard');
    restoringHistory = false;
  }
  window.addEventListener('popstate', restoreView);
  if (location.hash && document.getElementById(location.hash.replace(/^#\/?/, ''))?.classList.contains('view')) restoreView();
  else { history.replaceState(null, '', '#/dashboard'); synchronizeView('dashboard', false); }

  /* Search all sample controlled documents, with keyboard-reachable results. */
  const search = document.getElementById('globalSearch');
  const results = document.getElementById('searchResults');
  const searchBox = document.getElementById('headerSearch');
  const catalog = Object.entries(spaceDefinitions).flatMap(([space, data]) => data.docs.map(doc => ({ ...doc, space, spaceName: data.name })));
  function closeSearch() { results.hidden = true; }
  function renderSearch() {
    const query = search.value.trim().toLowerCase();
    results.replaceChildren();
    if (!query) { closeSearch(); return; }
    const matches = catalog.filter(doc => [doc.code, doc.title, doc.owner, doc.spaceName].join(' ').toLowerCase().includes(query)).slice(0, 8);
    if (!matches.length) {
      const message = document.createElement('p');
      message.textContent = 'No matching documents. Try a title, document ID or owner.';
      message.setAttribute('role', 'status');
      results.append(message);
    }
    matches.forEach(doc => {
      const button = document.createElement('button');
      button.innerHTML = '<i data-lucide="file-text"></i><span><b>' + escapeHtml(doc.title) + '</b><small>' + escapeHtml(doc.code + ' · ' + doc.spaceName) + '</small></span>';
      button.addEventListener('click', () => {
        closeSearch(); search.value = ''; searchBox.classList.remove('open');
        openControlledDocument(doc.space, doc.code);
      });
      results.append(button);
    });
    results.hidden = false;
    refreshIcons();
  }
  search.addEventListener('input', renderSearch);
  search.addEventListener('focus', renderSearch);
  searchBox.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSearch(); searchBox.classList.remove('open'); document.getElementById('searchToggle').focus(); }
    if (e.key === 'ArrowDown' && !results.hidden) {
      e.preventDefault(); const buttons = [...results.querySelectorAll('button')];
      buttons[(buttons.indexOf(document.activeElement) + 1) % buttons.length]?.focus();
    }
    if (e.key === 'ArrowUp' && !results.hidden) {
      e.preventDefault(); const buttons = [...results.querySelectorAll('button')];
      const index = buttons.indexOf(document.activeElement);
      if (index <= 0) search.focus(); else buttons[index - 1].focus();
    }
    if (e.key === 'Enter' && document.activeElement === search && !results.hidden) results.querySelector('button')?.click();
  });
  document.addEventListener('pointerdown', e => { if (!searchBox.contains(e.target)) { closeSearch(); searchBox.classList.remove('open'); } });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchBox.classList.add('open'); search.focus(); }
  });

  window.clearDocumentFilters = () => {
    document.getElementById('controlledSearch').value = '';
    document.getElementById('controlledTypeFilter').value = 'all';
    document.getElementById('controlledSpaceFilter').value = 'all';
    document.querySelector('[data-controlled-status="all"]').click();
  };
  function updateResults() {
    const count = [...document.querySelectorAll('.controlledLibraryRow')].filter(row => row.style.display !== 'none').length;
    document.getElementById('documentEmpty').hidden = count !== 0;
    document.getElementById('documentResultCount').textContent = count + ' sample document' + (count === 1 ? '' : 's') + ' · 1,428 in the workspace';
    document.querySelectorAll('#controlledStatusTabs button').forEach(button => button.setAttribute('aria-pressed', String(button.classList.contains('active'))));
  }
  document.addEventListener('qms:documentsfiltered', updateResults);
  updateResults();

  /* Sort the visible priority queue so an approval due today comes first. */
  const work = document.getElementById('overviewWorkList');
  function prioritizeWork() {
    const rank = row => row.querySelector('.tag.danger') ? 0 : row.querySelector('.tag.warning') ? 1 : 2;
    [...work.children].sort((a, b) => rank(a) - rank(b)).forEach(row => work.append(row));
  }
  prioritizeWork();
  const originalRefreshDashboard = refreshRevisionDashboard;
  window.refreshRevisionDashboard = function () { originalRefreshDashboard(); prioritizeWork(); };

  /* Existing controls keep their visible text while gaining explicit accessible names. */
  document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]),textarea,select').forEach(control => {
    if (control.labels?.length || control.hasAttribute('aria-label')) return;
    const label = control.closest('.formField, .field')?.querySelector('label')?.textContent.trim();
    const name = label || control.getAttribute('placeholder') || control.querySelector('option')?.textContent || control.name || control.id.replace(/([a-z])([A-Z])/g, '$1 $2');
    if (name) control.setAttribute('aria-label', name);
  });
  document.querySelectorAll('button[title]').forEach(button => { if (!button.textContent.trim()) button.setAttribute('aria-label', button.title); });
  document.querySelector('.dateInput')?.setAttribute('aria-label', 'Audit event date');
  document.querySelectorAll('.tableSurface,.findingBody,.complianceAssessmentMeta').forEach(region => {
    region.tabIndex = 0;
    region.setAttribute('role', 'region');
    region.setAttribute('aria-label', region.classList.contains('tableSurface') ? 'Audit events table' : region.classList.contains('findingBody') ? 'Finding details' : 'Assessment details');
  });
  document.querySelectorAll('.spaceAdminRow .iconButton').forEach(button => button.setAttribute('aria-label', 'Space options'));
  document.querySelectorAll('.accessUserRow').forEach(row => {
    const name = row.querySelector('.userIdentity b')?.textContent || 'User';
    row.querySelector('.rowMenu')?.setAttribute('aria-label', 'Options for ' + name);
    row.querySelectorAll('.permissionCheck input').forEach((input, i) => input.setAttribute('aria-label', name + ': ' + ['View', 'Create and edit', 'Review', 'Approve', 'Document control', 'Administration'][i]));
  });
  /* Keep keyboard focus inside open dialogs, including a second dialog over a document. */
  const dialogRoots = [...document.querySelectorAll('.modal'), document.getElementById('repositoryDocument'), document.getElementById('complianceDrawerBackdrop')].filter(Boolean);
  let activeDialog = null;
  let dialogOpener = null;
  let inertSiblings = [];
  const visible = element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden';
  const focusables = root => [...root.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"]')].filter(visible);
  function refreshDialogBoundary() {
    const next = [...dialogRoots].reverse().find(root => root.id === 'repositoryDocument' ? root.style.display !== 'none' : root.classList.contains('show'));
    // Smaller modal forms sit above the document viewer and the findings drawer.
    const modal = dialogRoots.filter(root => root.classList.contains('modal') && root.classList.contains('show')).at(-1);
    const target = modal || next || null;
    if (target === activeDialog) return;
    inertSiblings.forEach(element => { element.inert = false; });
    inertSiblings = [];
    const previous = activeDialog;
    activeDialog = target;
    if (!target) {
      if (previous && dialogOpener?.isConnected && visible(dialogOpener)) dialogOpener.focus({ preventScroll: true });
      dialogOpener = null;
      return;
    }
    if (!previous) dialogOpener = document.activeElement;
    const box = target.querySelector('.modalBox,.documentModalShell,.complianceDrawer') || target;
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    if (!box.hasAttribute('aria-labelledby') && !box.hasAttribute('aria-label')) box.setAttribute('aria-label', box.querySelector('h1,h2,h3')?.textContent || 'Details');
    let level = target;
    while (level.parentElement && level.parentElement !== document.body) {
      [...level.parentElement.children].filter(sibling => sibling !== level && !sibling.inert && !['SCRIPT','STYLE'].includes(sibling.tagName)).forEach(sibling => { sibling.inert = true; inertSiblings.push(sibling); });
      level = level.parentElement;
    }
    if (level.parentElement === document.body) [...document.body.children].filter(sibling => sibling !== level && !sibling.inert && !['SCRIPT','STYLE'].includes(sibling.tagName)).forEach(sibling => { sibling.inert = true; inertSiblings.push(sibling); });
    if (!target.contains(document.activeElement)) focusables(target)[0]?.focus({ preventScroll: true });
  }
  const dialogObserver = new MutationObserver(refreshDialogBoundary);
  dialogRoots.forEach(root => dialogObserver.observe(root, { attributes: true, attributeFilter: ['class','style'] }));
  document.addEventListener('keydown', event => {
    if (!activeDialog) return;
    if (event.key === 'Escape') {
      if (activeDialog.id === 'complianceDrawerBackdrop') closeComplianceFinding();
      else if (activeDialog.classList.contains('modal')) activeDialog.querySelector('button[onclick^="close"]')?.click();
    }
    if (event.key !== 'Tab') return;
    const elements = focusables(activeDialog);
    const first = elements[0], last = elements.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  const toastHost = document.querySelector('.toast');
  if (toastHost) { toastHost.setAttribute('role', 'status'); toastHost.setAttribute('aria-live', 'polite'); }
  refreshIcons();
})();
