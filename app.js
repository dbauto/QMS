function refreshIcons(){
  if(window.lucide) window.lucide.createIcons();
}
const navItems=[...document.querySelectorAll('.navItem[data-view]')];

/* Hover-expand navigation with a persistent pin state on desktop. */
const sideNav=document.querySelector('.sideNav');
const sidebarPin=document.getElementById('sidebarPin');
const desktopNavigation=()=>window.matchMedia('(min-width: 781px)').matches;

function renderSidebarPin(){
  const pinned=document.body.classList.contains('navPinned');
  if(sidebarPin){
    sidebarPin.innerHTML=pinned?'<i data-lucide="pin-off"></i>':'<i data-lucide="pin"></i>';
    sidebarPin.title=pinned?'Unpin sidebar':'Pin sidebar';
    sidebarPin.setAttribute('aria-label',sidebarPin.title);
    sidebarPin.setAttribute('aria-pressed',pinned?'true':'false');
  }
  refreshIcons();
}

function setSidebarPinned(pinned){
  if(!desktopNavigation()) return;
  savedPinned=pinned;
  document.body.classList.toggle('navPinned',pinned);
  document.body.classList.toggle('navExpanded',pinned||Boolean(sideNav?.matches(':hover'))||Boolean(sideNav?.contains(document.activeElement)));
  try{
    localStorage.setItem('nexus.navPinned',pinned?'1':'0');
    localStorage.removeItem('nexus.navExpanded');
  }catch(e){}
  renderSidebarPin();
}

function setSidebarHover(expanded){
  if(!desktopNavigation()||document.body.classList.contains('navPinned')) return;
  document.body.classList.toggle('navExpanded',expanded);
  renderSidebarPin();
}

let savedPinned=false;
try{
  const storedPin=localStorage.getItem('nexus.navPinned');
  savedPinned=storedPin==='1'||(storedPin===null&&localStorage.getItem('nexus.navExpanded')==='1');
  localStorage.removeItem('nexus.navExpanded');
  localStorage.removeItem('nexus.navHidden');
}catch(e){}
document.body.classList.remove('navHidden');
if(desktopNavigation()) setSidebarPinned(savedPinned);
sideNav?.addEventListener('mouseenter',()=>setSidebarHover(true));
sideNav?.addEventListener('mouseleave',()=>setSidebarHover(false));
sideNav?.addEventListener('focusin',()=>setSidebarHover(true));
sideNav?.addEventListener('focusout',()=>{
  requestAnimationFrame(()=>{
    if(sideNav&&!sideNav.contains(document.activeElement)&&!sideNav.matches(':hover')) setSidebarHover(false);
  });
});
window.setSidebarPinned=setSidebarPinned;
window.toggleSidebarPin=event=>{
  event.stopPropagation();
  setSidebarPinned(!document.body.classList.contains('navPinned'));
};
window.matchMedia('(min-width: 781px)').addEventListener('change',event=>{
  if(event.matches) setSidebarPinned(savedPinned||document.body.classList.contains('navPinned'));
  else document.body.classList.remove('navExpanded','navPinned');
});

function wirePanel(workspaceSelector,hideId,showId,className='inspectorHidden'){
  const workspace=document.querySelector(workspaceSelector);
  const hide=document.getElementById(hideId);
  const show=document.getElementById(showId);
  if(!workspace) return;
  hide?.addEventListener('click',()=>workspace.classList.add(className));
  show?.addEventListener('click',()=>workspace.classList.remove(className));
}
wirePanel('.documentWorkspace','hideStructurePane','showStructurePane','structureHidden');
wirePanel('.documentWorkspace','hideDocumentInspector','showDocumentInspector','inspectorHidden');
wirePanel('.resourceWorkspace','hideResourceInspector','showResourceInspector','inspectorHidden');
wirePanel('.typeWorkspace','hideTypeInspector','showTypeInspector','inspectorHidden');

document.querySelectorAll('.navItem').forEach(item=>{
  const label=[...item.querySelectorAll('span')].find(el=>!el.classList.contains('navIcon')&&!el.classList.contains('navMeta')&&!el.classList.contains('navBadge'));
  if(label && !item.title) item.title=label.textContent.trim();
});
const workspaceSwitch=document.querySelector('.workspaceSwitch');
if(workspaceSwitch) workspaceSwitch.title='ABC Manufacturing';

document.addEventListener('keydown',e=>{
  if(e.altKey&&e.key==='\\'){
    e.preventDefault();
    setSidebarPinned(!document.body.classList.contains('navPinned'));
  }
});


const accessUsers={
  maria:{name:'Maria Santos',subtitle:'Quality Manager · Quality',roles:['Approver','Document Owner']},
  ana:{name:'Ana Reyes',subtitle:'Employee · Quality',roles:['Reviewer','Document Owner']},
  oscar:{name:'Oscar Flores',subtitle:'Department Manager · Operations',roles:['Reviewer','Document Owner']},
  lea:{name:'Lea Garcia',subtitle:'Department Manager · Recruitment',roles:['Approver','Document Owner']},
  mika:{name:'Mika Torres',subtitle:'Employee · Quality',roles:['Document Controller']},
  aaron:{name:'Aaron Lim',subtitle:'System Administrator · IT',roles:['System Admin']}
};
let activeAccessUser='maria';
let editingRoleUser=null;

function roleClass(role){
  if(role==='Approver') return 'approve';
  if(role==='Reviewer') return 'review';
  if(role==='Document Controller') return 'control';
  if(role==='System Admin') return 'admin';
  if(role==='Auditor') return 'audit';
  return '';
}
function rolePillHtml(role){
  return '<span class="rolePill '+roleClass(role)+'">'+escapeHtml(role)+'</span>';
}
function getAccessRow(userId){
  return document.querySelector('.accessUserRow[data-user-id="'+userId+'"]');
}
function getEffectiveRights(row){
  if(!row) return [];
  const labels=['View','Create/Edit','Review','Approve','Document Control','Admin'];
  return [...row.querySelectorAll('.permissionCheck input')].map((input,i)=>input.checked?labels[i]:null).filter(Boolean);
}
function selectAccessUser(userId,row){
  activeAccessUser=userId;
  document.querySelectorAll('.accessUserRow').forEach(x=>x.classList.toggle('selected',x===row));
  const user=accessUsers[userId];
  if(!user) return;
  const type=row?.querySelector('.userTypeSelect')?.value||user.subtitle.split(' · ')[0];
  const dept=row?.dataset.dept||'';
  const scope=row?.querySelector('.scopeSelect')?.value||'Assigned';
  const roles=user.roles||[];
  document.getElementById('accessDetailName').textContent=user.name;
  document.getElementById('accessDetailSubtitle').textContent=type+' · '+dept;
  document.getElementById('accessDetailRoles').innerHTML=roles.map(rolePillHtml).join('');
  document.getElementById('accessDetailScope').textContent=scope;
  const rights=getEffectiveRights(row);
  document.getElementById('accessDetailRights').textContent=rights.length?rights.join(' · '):'No direct permissions';
  refreshIcons();
}
function openRoleEditor(userId){
  editingRoleUser=userId;
  const user=accessUsers[userId];
  if(!user) return;
  document.getElementById('roleEditorTitle').textContent='Edit roles · '+user.name;
  document.querySelectorAll('#roleEditorModal .roleOptionList input').forEach(input=>input.checked=(user.roles||[]).includes(input.value));
  document.getElementById('roleEditorModal')?.classList.add('show');
  refreshIcons();
}
function closeRoleEditor(){
  document.getElementById('roleEditorModal')?.classList.remove('show');
  editingRoleUser=null;
}
function saveRoleEditor(){
  if(!editingRoleUser) return;
  const user=accessUsers[editingRoleUser];
  user.roles=[...document.querySelectorAll('#roleEditorModal .roleOptionList input:checked')].map(x=>x.value);
  const row=getAccessRow(editingRoleUser);
  const cell=row?.querySelector('.roleCell');
  if(cell){
    cell.innerHTML=user.roles.map(rolePillHtml).join('')+'<i data-lucide="pencil"></i>';
  }
  closeRoleEditor();
  selectAccessUser(editingRoleUser||activeAccessUser,row);
  toast('QMS roles updated',user.name+' now has '+(user.roles.length?user.roles.join(', '):'no assigned QMS duties')+'.');
}
function applyUserAccessFilters(){
  const q=(document.getElementById('userAccessSearch')?.value||'').trim().toLowerCase();
  const dept=document.getElementById('userDepartmentFilter')?.value||'all';
  const status=document.getElementById('userStatusFilter')?.value||'all';
  document.querySelectorAll('.accessUserRow').forEach(row=>{
    const show=(!q||row.textContent.toLowerCase().includes(q))&&(dept==='all'||row.dataset.dept===dept)&&(status==='all'||row.dataset.status===status);
    row.style.display=show?'grid':'none';
  });
}
document.getElementById('userAccessSearch')?.addEventListener('input',applyUserAccessFilters);
document.getElementById('userDepartmentFilter')?.addEventListener('change',applyUserAccessFilters);
document.getElementById('userStatusFilter')?.addEventListener('change',applyUserAccessFilters);
document.querySelectorAll('.accessUserRow input[type="checkbox"],.accessUserRow select').forEach(control=>control.addEventListener('change',()=>{
  const row=control.closest('.accessUserRow');
  if(row?.dataset.userId===activeAccessUser) selectAccessUser(activeAccessUser,row);
}));
document.getElementById('saveAccessChanges')?.addEventListener('click',()=>toast('Access changes saved','User permissions, scope and QMS duties were saved for this prototype.'));
document.getElementById('inviteUserBtn')?.addEventListener('click',()=>toast('Invite user','User invitation setup will collect email, user type, QMS roles and initial access scope.'));
document.getElementById('accessProfilesBtn')?.addEventListener('click',()=>toast('Access profiles','Profiles can provide safe defaults, while individual permissions and scopes remain configurable.'));

let activeSettingsTab='profile';

function openSettingsTab(tab='profile'){
  showView('settings');
  activeSettingsTab=tab;
  document.querySelectorAll('[data-settings-tab]').forEach(button=>button.classList.toggle('active',button.dataset.settingsTab===tab));
  document.querySelectorAll('[data-settings-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.settingsPanel===tab));
  if(breadcrumbCurrent) breadcrumbCurrent.textContent=tab==='profile'?'Settings / My profile':tab==='company'?'Settings / Company profile':tab==='qms'?'Settings / QMS defaults':'Settings / Security & notifications';
  refreshIcons();
}

document.querySelectorAll('[data-settings-tab]').forEach(button=>button.addEventListener('click',()=>openSettingsTab(button.dataset.settingsTab)));

document.querySelectorAll('#settings .toggle').forEach(toggle=>toggle.addEventListener('click',()=>{
  toggle.classList.toggle('on');
}));

function initialsFromName(name){
  return String(name||'').trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'U';
}

function saveSettingsProfile(){
  const name=document.getElementById('profileFullName')?.value.trim()||'Maria Santos';
  const title=document.getElementById('profileJobTitle')?.value.trim()||'Quality Manager';
  const initials=initialsFromName(name);
  const headerName=document.getElementById('headerProfileName');
  const headerTitle=document.getElementById('headerProfileTitle');
  const headerAvatar=document.getElementById('headerProfileAvatar');
  const settingsAvatar=document.getElementById('settingsProfileAvatar');
  if(headerName) headerName.textContent=name;
  if(headerTitle) headerTitle.textContent=title;
  if(headerAvatar) headerAvatar.textContent=initials;
  if(settingsAvatar) settingsAvatar.textContent=initials;
  try{
    localStorage.setItem('iqms.profile',JSON.stringify({
      name,title,
      department:document.getElementById('profileDepartment')?.value,
      email:document.getElementById('profileEmail')?.value,
      phone:document.getElementById('profilePhone')?.value,
      timezone:document.getElementById('profileTimezone')?.value,
      language:document.getElementById('profileLanguage')?.value
    }));
  }catch(e){}
}

function saveSettingsCompany(){
  const name=document.getElementById('companyDisplayName')?.value.trim()||'ABC Manufacturing';
  const workspace=document.getElementById('companyWorkspaceName')?.value.trim()||'Production workspace';
  const initials=initialsFromName(name);
  const companyName=document.getElementById('workspaceCompanyName');
  const workspaceName=document.getElementById('workspaceDisplayName');
  const avatar=document.getElementById('workspaceAvatar');
  const logo=document.getElementById('companyLogoPreview');
  if(companyName) companyName.textContent=name;
  if(workspaceName) workspaceName.textContent=workspace;
  if(avatar) avatar.textContent=initials;
  if(logo) logo.textContent=initials;
  const ws=document.querySelector('.workspaceSwitch');
  if(ws) ws.title=name;
  try{
    localStorage.setItem('iqms.company',JSON.stringify({
      name,
      legalName:document.getElementById('companyLegalName')?.value,
      workspace,
      code:document.getElementById('companyCode')?.value,
      industry:document.getElementById('companyIndustry')?.value,
      website:document.getElementById('companyWebsite')?.value,
      qmsContact:document.getElementById('companyQmsContact')?.value,
      timezone:document.getElementById('companyTimezone')?.value,
      address:document.getElementById('companyAddress')?.value
    }));
  }catch(e){}
}

document.getElementById('saveSettingsBtn')?.addEventListener('click',()=>{
  saveSettingsProfile();
  saveSettingsCompany();
  toast('Settings saved','Profile, company and QMS settings were saved for this prototype.');
});
document.getElementById('changeProfilePhotoBtn')?.addEventListener('click',()=>toast('Profile photo','Photo upload can be connected to the user identity service in production.'));
document.getElementById('removeProfilePhotoBtn')?.addEventListener('click',()=>toast('Profile photo removed','The profile will use your initials.'));
document.getElementById('uploadCompanyLogoBtn')?.addEventListener('click',()=>toast('Company logo','Logo upload can be connected to organization storage in production.'));
document.getElementById('removeCompanyLogoBtn')?.addEventListener('click',()=>toast('Company logo removed','The workspace will use company initials.'));

let revisionRequestMode='request';
let openRevisions={};
let revisionRequests={};
try{openRevisions=JSON.parse(localStorage.getItem('iqms.openRevisions')||'{}')||{}}catch(e){openRevisions={}}
try{revisionRequests=JSON.parse(localStorage.getItem('iqms.revisionRequests')||'{}')||{}}catch(e){revisionRequests={}}

if(!Object.keys(openRevisions).length){
  openRevisions['QMS-PRO-REC-001']={
    code:'QMS-PRO-REC-001',
    title:'Recruitment Procedure',
    currentRev:'03',
    rev:'Rev 04',
    revRaw:'04',
    pic:'Ana Reyes',
    due:'2026-09-29',
    reason:'Update candidate screening criteria and interview evidence requirements.',
    reference:'Management review action MR-2026-17',
    initiatedBy:'Ana Reyes',
    mode:'start',
    stage:'Draft preparation',
    downloaded:true,
    createdAt:'2026-09-22T09:18:00+08:00',
    downloadedAt:'2026-09-22T09:26:00+08:00',
    space:'Recruitment'
  };
  try{localStorage.setItem('iqms.openRevisions',JSON.stringify(openRevisions))}catch(e){}
}
if(!Object.keys(revisionRequests).length && !openRevisions['SOP-QA-014']){
  revisionRequests['SOP-QA-014']={
    code:'SOP-QA-014',
    title:'Control of Nonconforming Outputs',
    pic:'Ana Reyes',
    due:'2026-09-30',
    reason:'Clarify segregation and disposition steps for nonconforming outputs.',
    reference:'Internal audit follow-up IA-QA-2026-007',
    requestor:'Maria Santos',
    requestedAt:'2026-09-22T10:05:00+08:00',
    space:'Quality Management',
    stage:'Awaiting PIC to start revision'
  };
  try{localStorage.setItem('iqms.revisionRequests',JSON.stringify(revisionRequests))}catch(e){}
}

function activeControlledDoc(){
  return activeTraceabilityDoc||null;
}
function nextRevisionNumber(rev){
  const raw=String(rev||'').trim();
  if(/^\d+$/.test(raw)) return String(Number(raw)+1).padStart(raw.length,'0');
  const m=raw.match(/^(\d+)[.](\d+)$/);
  if(m) return m[1]+'.'+(Number(m[2])+1);
  return 'NEXT';
}
function revisionEditableExtension(doc){
  const type=String(doc?.type||'').toLowerCase();
  if(type.includes('form')||type.includes('spreadsheet')||type.includes('register')) return 'xlsx';
  if(type.includes('presentation')||type.includes('ppt')) return 'pptx';
  if(type.includes('external')) return 'docx';
  return 'docx';
}
function documentClassification(doc){
  if(doc?.classification) return doc.classification;
  const code=String(doc?.code||'');
  if(['SOP-QA-009'].includes(code)) return 'Confidential';
  if(['EXT-STD-002'].includes(code)) return 'Restricted';
  return 'Internal';
}
function classificationClass(level){
  return String(level||'Internal').toLowerCase().replace(/\s+/g,'-');
}
function classificationIcon(level){
  return level==='Public'?'globe-2':level==='Internal'?'building-2':level==='Confidential'?'shield-lock':'lock-keyhole';
}
function renderClassificationPill(doc){
  const level=documentClassification(doc);
  return '<span class="classificationPill '+classificationClass(level)+'"><i data-lucide="'+classificationIcon(level)+'"></i>'+escapeHtml(level)+'</span>';
}
function currentProfileEmail(){
  return document.getElementById('profileEmail')?.value||'maria.santos@abc.com';
}
let pendingClassificationDownload=null;
function downloadControlledPdf(){
  const doc=activeControlledDoc();
  if(!doc) return;
  const level=documentClassification(doc);
  if(level==='Public'||level==='Internal'){
    toast('Controlled PDF prepared',
      doc.code+' '+('Rev '+doc.rev)+' is downloaded as a non-editable PDF. The editable source is available only through an authorized revision workflow.');
    return;
  }
  pendingClassificationDownload={doc,level};
  const title=document.getElementById('classificationDownloadTitle');
  const subtitle=document.getElementById('classificationDownloadSubtitle');
  const levelEl=document.getElementById('classificationDownloadLevel');
  const policy=document.getElementById('classificationDownloadPolicy');
  const hero=document.getElementById('classificationDownloadHero');
  const icon=document.getElementById('classificationDownloadIcon');
  const rules=document.getElementById('classificationRules');
  const action=document.getElementById('classificationDownloadAction');
  const eyebrow=document.getElementById('classificationDownloadEyebrow');

  if(levelEl) levelEl.textContent=level;
  if(hero) hero.className='classificationDownloadHero '+classificationClass(level);
  if(icon) icon.innerHTML='<i data-lucide="'+classificationIcon(level)+'"></i>';

  if(level==='Confidential'){
    if(eyebrow) eyebrow.textContent='CONFIDENTIAL DOWNLOAD';
    if(title) title.textContent='Protected PDF download';
    if(subtitle) subtitle.textContent='Confidential controlled copies receive additional protection outside the normal Internal download flow.';
    if(policy) policy.textContent='Encrypted PDF · one-time password sent separately · personalized watermark · audited download.';
    if(rules) rules.innerHTML=
      '<div><i data-lucide="shield-lock"></i><span><b>Encrypted controlled PDF</b><small>The PDF is protected for the authorized recipient.</small></span></div>'+
      '<div><i data-lucide="mail"></i><span><b>Password sent separately</b><small>The password is sent to '+escapeHtml(currentProfileEmail())+' and is not displayed in the workspace.</small></span></div>'+
      '<div><i data-lucide="stamp"></i><span><b>Personalized watermark</b><small>User identity, timestamp and document ID are included on the downloaded copy.</small></span></div>'+
      '<div><i data-lucide="scroll-text"></i><span><b>Access is audited</b><small>View and download events are written to the audit trail.</small></span></div>';
    if(action){
      action.disabled=false;
      action.innerHTML='<i data-lucide="mail"></i>Send password & download PDF';
      action.dataset.mode='confidential';
    }
  }else{
    if(eyebrow) eyebrow.textContent='RESTRICTED INFORMATION';
    if(title) title.textContent='Local download is disabled by default';
    if(subtitle) subtitle.textContent='Restricted is the iQMS level for highly confidential information.';
    if(policy) policy.textContent='Named-user access · MFA re-authentication · secure viewer · no ordinary download, print or external share.';
    if(rules) rules.innerHTML=
      '<div><i data-lucide="user-check"></i><span><b>Explicit named access</b><small>Broad department membership alone is not enough; the user must be explicitly authorized.</small></span></div>'+
      '<div><i data-lucide="key-round"></i><span><b>MFA / re-authentication</b><small>Re-authenticate before opening Restricted content.</small></span></div>'+
      '<div><i data-lucide="eye"></i><span><b>Secure viewer by default</b><small>Normal PDF download, print and external sharing are disabled.</small></span></div>'+
      '<div><i data-lucide="file-check-2"></i><span><b>Exceptional export requires approval</b><small>If a local copy is truly required, request a time-bound export approval from Document Control or the information owner.</small></span></div>';
    if(action){
      action.disabled=false;
      action.innerHTML='<i data-lucide="send"></i>Request exceptional export';
      action.dataset.mode='restricted';
    }
  }
  document.getElementById('classificationDownloadModal')?.classList.add('show');
  refreshIcons();
}
function closeClassificationDownload(){
  document.getElementById('classificationDownloadModal')?.classList.remove('show');
  pendingClassificationDownload=null;
}
function confirmClassificationDownload(){
  if(!pendingClassificationDownload) return;
  const {doc,level}=pendingClassificationDownload;
  const action=document.getElementById('classificationDownloadAction');
  const mode=action?.dataset.mode;
  closeClassificationDownload();
  if(mode==='restricted'||level==='Restricted'){
    toast('Export approval requested',
      doc.code+' remains view-only. Document Control / the information owner must approve an exceptional local export.');
  }else{
    toast('Protected PDF prepared',
      'A one-time password was sent to '+currentProfileEmail()+'. The Confidential PDF is watermarked and the download was recorded in the audit trail.');
  }
}
function profileEmailForPic(pic){
  const map={
    'Maria Santos':'maria.santos@abc.com',
    'Ana Reyes':'ana.reyes@abc.com',
    'Oscar Flores':'oscar.flores@abc.com',
    'Lea Garcia':'lea.garcia@abc.com',
    'Mika Torres':'mika.torres@abc.com'
  };
  return map[pic]||'user@abc.com';
}
function persistOpenRevisions(){
  try{localStorage.setItem('iqms.openRevisions',JSON.stringify(openRevisions))}catch(e){}
}
function persistRevisionRequests(){
  try{localStorage.setItem('iqms.revisionRequests',JSON.stringify(revisionRequests))}catch(e){}
}
function revisionStateBadge(code){
  if(openRevisions[code]) return '<em class="revisionOpenInline">'+escapeHtml(openRevisions[code].rev)+' open</em>';
  if(revisionRequests[code]) return '<em class="revisionRequestInline">Revision requested</em>';
  return '';
}
function openRevisionRequest(mode='request'){
  const doc=activeControlledDoc();
  if(!doc) return;

  const existingOpen=openRevisions[doc.code];
  const existingRequest=revisionRequests[doc.code];

  if(existingOpen){
    toast('Revision already open',existingOpen.rev+' is already being prepared by '+existingOpen.pic+'.');
    setDocumentDetailTab('revision');
    refreshOpenRevisionIndicators(doc);
    return;
  }
  if(mode==='request' && existingRequest){
    toast('Revision request already pending','The request is assigned to '+existingRequest.pic+'. The PIC must start the revision before a working copy is created.');
    refreshOpenRevisionIndicators(doc);
    return;
  }

  revisionRequestMode=mode;
  const start=mode==='start';
  const nextRev=nextRevisionNumber(doc.rev);
  const requestorField=document.getElementById('revisionRequestorField');
  const requestorInput=document.getElementById('revisionRequestor');
  if(requestorField) requestorField.style.display=start?'none':'block';
  if(requestorInput) requestorInput.value='Maria Santos';

  document.getElementById('revisionModeEyebrow').textContent=start?'START REVISION':'REVISION REQUEST';
  document.getElementById('revisionModalTitle').textContent=start?'Start '+('Rev '+nextRev):'Request a document revision';
  document.getElementById('revisionModalSubtitle').textContent=start
    ? 'This immediately opens the next working revision and enables the secure editable working-copy flow.'
    : 'This creates a task for the PIC only. It does not create the next revision yet.';

  const outcome=document.getElementById('revisionModeOutcome');
  if(outcome) outcome.className='revisionModeOutcome '+(start?'start':'request');
  const outcomeIcon=document.getElementById('revisionOutcomeIcon');
  if(outcomeIcon) outcomeIcon.innerHTML=start?'<i data-lucide="git-branch-plus"></i>':'<i data-lucide="clipboard-list"></i>';
  document.getElementById('revisionOutcomeTitle').textContent=start
    ? 'This opens Rev '+nextRev+' now'
    : 'This creates a request only';
  document.getElementById('revisionOutcomeText').textContent=start
    ? 'iQMS creates Rev '+nextRev+' as a separate working revision, keeps Rev '+doc.rev+' effective, then offers the PIC the password-protected editable working copy.'
    : 'The PIC receives a task. No revision number is created and no editable working copy can be downloaded until the PIC starts the revision.';

  document.getElementById('revisionNotifyTitle').textContent=start
    ? 'Notify people that the revision is now open'
    : 'Notify people about the requested change';
  document.getElementById('revisionNotifyCopy').textContent=start
    ? 'The PIC, previous manager/owner, reviewer(s) and approver(s) are informed that a working revision has opened.'
    : 'The PIC receives the action task. Existing manager/owner, reviewer(s) and approver(s) can be informed that a change was requested.';
  document.getElementById('revisionRuleText').textContent=start
    ? 'The current effective revision is never overwritten. Rev '+nextRev+' is a separate working revision until review, approval and release.'
    : 'A revision request does not alter the effective document. The next revision is created only when an authorized PIC starts the revision.';

  document.getElementById('revisionSubmitBtn').innerHTML=start
    ? '<i data-lucide="git-branch-plus"></i>Open Rev '+nextRev
    : '<i data-lucide="send"></i>Send revision request';

  document.getElementById('revisionContextTitle').textContent=doc.title;
  document.getElementById('revisionContextCode').textContent=doc.code;
  document.getElementById('revisionContextRev').textContent='Rev '+doc.rev;
  document.getElementById('notifyDocumentOwner').textContent=doc.owner||'Document Owner';
  document.getElementById('notifyPreviousApprover').textContent=doc.approver||'Previous approver';

  document.getElementById('revisionRequestReason').value=existingRequest?.reason||'';
  document.getElementById('revisionReference').value=existingRequest?.reference||'';
  document.getElementById('revisionDueDate').value=existingRequest?.due||'2026-09-29';
  document.getElementById('revisionPic').value=existingRequest?.pic||(start?'Maria Santos':'Ana Reyes');

  document.getElementById('revisionRequestModal')?.classList.add('show');
  refreshIcons();
}
function closeRevisionRequest(){
  document.getElementById('revisionRequestModal')?.classList.remove('show');
}
function submitRevisionRequest(){
  const doc=activeControlledDoc();
  if(!doc) return;

  const reason=document.getElementById('revisionRequestReason')?.value.trim();
  if(!reason){
    document.getElementById('revisionRequestReason')?.focus();
    toast('Change request required','Describe what needs to be revised before continuing.');
    return;
  }

  const pic=document.getElementById('revisionPic')?.value||'Maria Santos';
  const due=document.getElementById('revisionDueDate')?.value||'';
  const reference=document.getElementById('revisionReference')?.value.trim()||'';

  if(revisionRequestMode==='request'){
    revisionRequests[doc.code]={
      code:doc.code,title:doc.title,pic,due,reason,reference,
      requestor:document.getElementById('revisionRequestor')?.value||'Maria Santos',requestedAt:new Date().toISOString(),
      space:activeSpace?.name||'',stage:'Awaiting PIC to start revision'
    };
    persistRevisionRequests();
    closeRevisionRequest();
    refreshOpenRevisionIndicators(doc);
    renderDocumentRevisionHistory(doc);
    refreshRevisionTasks();
    refreshRevisionDashboard();
    toast('Revision request sent',
      pic+' received a task for '+doc.code+'. No new revision number or editable working copy exists yet.');
    return;
  }

  const pending=revisionRequests[doc.code];
  const rev=nextRevisionNumber(doc.rev);
  openRevisions[doc.code]={
    code:doc.code,title:doc.title,currentRev:doc.rev,rev:'Rev '+rev,revRaw:rev,
    pic,due,reason,reference,
    initiatedBy:'Maria Santos',
    sourceRequest:pending?{requestor:pending.requestor,requestedAt:pending.requestedAt,reason:pending.reason}:null,
    mode:'start',stage:'Working copy required',downloaded:false,
    createdAt:new Date().toISOString(),space:activeSpace?.name||''
  };
  if(pending) delete revisionRequests[doc.code];
  persistOpenRevisions();
  persistRevisionRequests();
  closeRevisionRequest();
  refreshOpenRevisionIndicators(doc);
  renderDocumentRevisionHistory(doc);
  refreshRevisionTasks();
  refreshRevisionDashboard();
  toast('Revision opened',
    'Rev '+rev+' is now open for '+doc.code+'. Rev '+doc.rev+' remains effective until the new revision is approved and released.');
  openSecureRevisionDownload();
}
function renderDocumentRevisionHistory(doc=activeControlledDoc()){
  if(!doc||typeof doc!=='object') return;
  const revision=openRevisions[doc.code];
  const request=revisionRequests[doc.code];
  const current='Rev '+(doc.rev||'—');
  const set=(id,value)=>{const el=document.getElementById(id);if(el) el.textContent=value};

  set('docRevisionHistoryTitle',doc.title+' · revision history');
  set('revisionCurrentEffective',current);
  set('revisionCurrentEffectiveDate',(doc.effective&&doc.effective!=='—')?'Effective '+doc.effective:'Current effective revision');

  if(revision){
    set('revisionOpenState',revision.rev+' · '+(revision.downloaded?'Draft preparation':revision.stage));
    set('revisionOpenPicState','PIC: '+revision.pic);
  }else if(request){
    set('revisionOpenState','Revision requested · no revision number yet');
    set('revisionOpenPicState','Assigned PIC: '+request.pic+' · awaiting start');
  }else{
    set('revisionOpenState','No open revision');
    set('revisionOpenPicState','No working revision in progress');
  }

  set('docHistoryOpenRev',revision?revision.revRaw:'—');
  set('docHistoryOpenStage',revision?(revision.downloaded?'Draft preparation':revision.stage):'No open revision');
  set('docHistoryOpenReason',revision?revision.reason:'No working revision exists yet.');
  const row=document.getElementById('documentRevisionOpenRow');
  if(row) row.style.display=revision?'grid':'none';
}
function refreshOpenRevisionIndicators(doc=activeControlledDoc()){
  const openBanner=document.getElementById('openRevisionBanner');
  const requestBanner=document.getElementById('revisionRequestBanner');
  const revision=doc&&typeof doc==='object'?openRevisions[doc.code]:null;
  const request=doc&&typeof doc==='object'?revisionRequests[doc.code]:null;

  if(openBanner){
    openBanner.style.display=revision?'grid':'none';
    if(revision){
      document.getElementById('openRevisionNumber').textContent=revision.rev;
      document.getElementById('openRevisionPic').textContent=revision.pic;
      document.getElementById('openRevisionStage').textContent=revision.downloaded?'Working copy downloaded · Draft preparation':revision.stage;
      document.getElementById('openRevisionDue').textContent=revision.due||'Not set';
      document.getElementById('openRevisionReason').textContent=revision.reason;
    }
  }
  if(requestBanner){
    requestBanner.style.display=!revision&&request?'grid':'none';
    if(!revision&&request){
      document.getElementById('pendingRevisionRequestor').textContent=request.requestor||'—';
      document.getElementById('pendingRevisionPic').textContent=request.pic;
      document.getElementById('pendingRevisionDue').textContent=request.due||'Not set';
      document.getElementById('pendingRevisionReason').textContent=request.reason;
    }
  }

  document.querySelectorAll('#controlledLibraryRows .controlledLibraryRow').forEach(row=>{
    const code=row.querySelector('div>b')?.textContent.trim();
    const open=openRevisions[code];
    const pending=revisionRequests[code];
    let badge=row.querySelector('.revisionOpenInline,.revisionRequestInline');
    if((open||pending)&&!badge){
      badge=document.createElement('span');
      row.querySelector('div')?.appendChild(badge);
    }
    if(badge){
      badge.className=open?'revisionOpenInline':'revisionRequestInline';
      if(open){badge.textContent=open.rev+' open';badge.style.display='inline-flex'}
      else if(pending){badge.textContent='Revision requested';badge.style.display='inline-flex'}
      else badge.style.display='none';
    }
  });

  renderDmsDocuments();
  if(activeSpace) renderSpaceRows(activeSpace);
}
function openSecureRevisionDownload(){
  const doc=activeControlledDoc();
  if(!doc) return;
  const revision=openRevisions[doc.code];
  if(!revision){
    toast('Start a revision first','An editable working copy is only generated for an open revision.');
    return;
  }
  const ext=revisionEditableExtension(doc);
  const classification=documentClassification(doc);
  const filename=doc.code+'_'+revision.rev.replace(/\s+/g,'')+'_WORKING.'+ext;
  document.getElementById('secureDownloadFile').textContent=filename;
  document.getElementById('secureDownloadMeta').textContent='Editable '+ext.toUpperCase()+' · '+revision.rev+' working revision · '+classification;
  document.getElementById('securePasswordEmail').textContent=classification==='Restricted'
    ? 'Restricted source checkout requires MFA re-authentication and explicit approval before any local editable file is issued.'
    : 'A one-time file password will be sent to '+profileEmailForPic(revision.pic)+'. The password is not displayed on this page.';
  const secureAction=document.getElementById('secureRevisionAction');
  if(secureAction){
    if(classification==='Restricted'){
      secureAction.innerHTML='<i data-lucide="send"></i>Request restricted source checkout';
      secureAction.dataset.classification='Restricted';
    }else{
      secureAction.innerHTML='<i data-lucide="mail"></i>Send password & prepare download';
      secureAction.dataset.classification=classification;
    }
  }
  document.getElementById('historyNewRev').textContent=revision.revRaw;
  document.getElementById('historyNewReason').textContent=revision.reason;
  const placement=document.getElementById('revisionHistoryPlacement');
  if(ext==='xlsx') placement.textContent='For XLSX, iQMS inserts a protected “Revision History” worksheet near the front of the workbook because spreadsheets do not have document pages.';
  else if(ext==='pptx') placement.textContent='For PPTX, iQMS inserts the revision-history table as slide 2, immediately after the title slide.';
  else placement.textContent='For DOCX and page-based editable documents, iQMS inserts the revision-history table on page 2, immediately after the cover/title page.';
  document.getElementById('secureRevisionDownloadModal')?.classList.add('show');
  refreshIcons();
}
function closeSecureRevisionDownload(){
  document.getElementById('secureRevisionDownloadModal')?.classList.remove('show');
}
function confirmSecureRevisionDownload(){
  const doc=activeControlledDoc();
  if(!doc) return;
  const revision=openRevisions[doc.code];
  if(!revision) return;
  const classification=documentClassification(doc);

  if(classification==='Restricted'){
    closeSecureRevisionDownload();
    toast('Restricted source checkout requested',
      'No editable file was issued. MFA re-authentication and explicit approval from Document Control / the information owner are required before a local Restricted working copy can be generated.');
    return;
  }

  revision.downloaded=true;
  revision.stage='Draft preparation';
  revision.downloadedAt=new Date().toISOString();
  persistOpenRevisions();
  closeSecureRevisionDownload();
  refreshOpenRevisionIndicators(doc);
  renderDocumentRevisionHistory(doc);
  refreshRevisionTasks();
  refreshRevisionDashboard();
  toast('Secure working copy prepared','Password sent to '+profileEmailForPic(revision.pic)+'. The download event was added to the audit trail and dashboard activity.');
}
function refreshRevisionTasks(){
  const host=document.getElementById('revisionTaskQueue');
  if(!host) return;
  const revisions=Object.values(openRevisions);
  const requests=Object.values(revisionRequests);

  const requestRows=requests.map(r=>
    '<button class="approvalItem revisionRequestTaskItem" data-document-code="'+escapeHtml(r.code)+'" onclick="openTaskDocumentByCode(\''+escapeHtml(r.code)+'\',this)">'
    +'<div class="approvalTop"><span class="tag warning">Revision requested</span><small>Action for PIC</small></div>'
    +'<b>'+escapeHtml(r.code)+'</b><strong>'+escapeHtml(r.title)+'</strong>'
    +'<span>Requestor: '+escapeHtml(r.requestor||'—')+' · PIC: '+escapeHtml(r.pic)+' · No revision number yet · Due '+escapeHtml(r.due||'Not set')+'</span></button>'
  ).join('');

  const revisionRows=revisions.map(r=>
    '<button class="approvalItem revisionTaskItem" data-document-code="'+escapeHtml(r.code)+'" onclick="openTaskDocumentByCode(\''+escapeHtml(r.code)+'\',this)">'
    +'<div class="approvalTop"><span class="tag info">'+escapeHtml(r.downloaded?'In progress':'Revision open')+'</span><small>Working revision</small></div>'
    +'<b>'+escapeHtml(r.code)+' · '+escapeHtml(r.rev)+'</b><strong>'+escapeHtml(r.title)+'</strong>'
    +'<span>PIC: '+escapeHtml(r.pic)+' · Due '+escapeHtml(r.due||'Not set')+'</span></button>'
  ).join('');

  host.innerHTML=requestRows+revisionRows;
  const assigned=[...requests,...revisions].filter(r=>r.pic==='Maria Santos').length;
  const requested=requests.filter(r=>r.requestor==='Maria Santos'&&r.pic!=='Maria Santos').length;
  const a=document.getElementById('assignedTaskCount'); if(a) a.textContent=9+assigned;
  const q=document.getElementById('requestedTaskCount'); if(q) q.textContent=4+requested;
  const all=document.getElementById('allActiveTaskCount'); if(all) all.textContent=24+requests.length+revisions.length;
}
function findDocByCode(code){
  for(const [spaceId,space] of Object.entries(spaceDefinitions)){
    const doc=(space.docs||[]).find(d=>d.code===code);
    if(doc) return {spaceId,doc};
  }
  return null;
}
function openControlledDocumentByCode(code){
  const found=findDocByCode(code);
  if(found) openControlledDocument(found.spaceId,code);
}
function openTaskDocumentByCode(code,trigger=null){
  const found=findDocByCode(code);
  if(!found) return;
  activeSpace=spaceDefinitions[found.spaceId];
  activeRepositorySpaceId=found.spaceId;
  documentReturnContext='task';
  selectSpaceDocument(found.doc,trigger||document.activeElement);
}
function openSelectedTaskDocument(trigger){
  const code=trigger?.dataset.documentCode
    ||document.querySelector('#approvals .approvalItem.selected[data-document-code]')?.dataset.documentCode;
  if(code) openTaskDocumentByCode(code,trigger);
}
function refreshRevisionDashboard(){
  const work=document.getElementById('overviewWorkList');
  const activity=document.getElementById('overviewActivityList');
  if(work){
    work.querySelectorAll('.revisionDashboardRow,.revisionRequestDashboardRow').forEach(x=>x.remove());

    Object.values(openRevisions).slice(0,2).reverse().forEach(r=>{
      const row=document.createElement('button');
      row.className='overviewWorkRow revisionDashboardRow';
      row.onclick=()=>openControlledDocumentByCode(r.code);
      row.innerHTML='<span class="workType">Revision</span><div><b>'+escapeHtml(r.title)+'</b><small>'+escapeHtml(r.code)+' · '+escapeHtml(r.rev)+' · PIC '+escapeHtml(r.pic)+'</small></div><span class="tag info">'+(r.downloaded?'In progress':'Open')+'</span><i data-lucide="chevron-right"></i>';
      work.prepend(row);
    });

    Object.values(revisionRequests).slice(0,2).reverse().forEach(r=>{
      const row=document.createElement('button');
      row.className='overviewWorkRow revisionRequestDashboardRow';
      row.onclick=()=>openControlledDocumentByCode(r.code);
      row.innerHTML='<span class="workType">Change request</span><div><b>'+escapeHtml(r.title)+'</b><small>'+escapeHtml(r.code)+' · Assigned PIC '+escapeHtml(r.pic)+' · No revision number yet</small></div><span class="tag warning">Requested</span><i data-lucide="chevron-right"></i>';
      work.prepend(row);
    });
  }
  if(activity){
    activity.querySelectorAll('.revisionDownloadActivity').forEach(x=>x.remove());
    Object.values(openRevisions).filter(r=>r.downloaded).slice(-2).reverse().forEach(r=>{
      const row=document.createElement('div');
      row.className='revisionDownloadActivity';
      row.innerHTML='<span>Now</span><i class="activityIcon"><i data-lucide="file-down"></i></i><p><b>'+escapeHtml(r.code)+' '+escapeHtml(r.rev)+' working copy downloaded</b><small>Password-protected editable copy · '+escapeHtml(r.pic)+'</small></p><span class="tag info">Revision open</span>';
      activity.prepend(row);
    });
  }
  refreshIcons();
}

const viewLabels={
  dashboard:'Overview',
  repository:'Documents',
  records:'Records & evidence',
  approvals:'My tasks',
  audit:'Audit trail',
  relationships:'Traceability',
  structure:'Space administration',
  types:'Document types',
  compliance:'ISO readiness',
  ai:'QMS AI',
  users:'Users & access',
  settings:'Settings'
};
let activeTraceabilityDoc=null;

const traceabilityProfiles={
  'QMS-PRO-REC-001':{
    title:'Recruitment Procedure',code:'QMS-PRO-REC-001',rev:'Rev 03',status:'Effective',space:'Recruitment',owner:'Recruitment Manager',
    requirement:{code:'ISO 9001 · 8.1',detail:'Operational planning and control'},
    process:{name:'Recruitment',detail:'Process owner · Recruitment Manager'},
    related:[
      ['FORM-REC-006 · Candidate Evaluation Form','Controlled form · current effective revision'],
      ['SOP-REC-004 · Candidate Screening SOP','Supporting controlled information']
    ],
    evidence:[
      ['Candidate Screening Record','REC-SCR-2026-0918 · Retained evidence'],
      ['Candidate Interview Record','REC-INT-2026-442 · Retained evidence']
    ],
    risk:['Incomplete candidate documentation','Recruitment process risk · control linked'],
    audit:['Internal Audit 2026','IA-2026-004 · Verification evidence · closed'],
    mapEvidenceCode:'REC-SCR-2026-0918',mapEvidenceTitle:'Candidate Screening Record',mapAuditCode:'IA-2026-004',mapAuditTitle:'Internal Audit 2026'
  },
  'SOP-QA-014':{
    title:'Control of Nonconforming Outputs',code:'SOP-QA-014',rev:'Rev 06',status:'Effective',space:'Quality Management',owner:'Quality Manager',
    requirement:{code:'ISO 9001 · 8.7',detail:'Control of nonconforming outputs'},
    process:{name:'Nonconformance Control',detail:'Process owner · Quality Manager'},
    related:[
      ['WI-QA-003 · Inspection Work Instruction','Supporting controlled information'],
      ['FORM-QA-009 · Nonconformance Report','Controlled form · current effective revision']
    ],
    evidence:[
      ['Nonconformance Report','NCR-2026-118 · Retained evidence'],
      ['Disposition Record','NCR-DISP-2026-118 · Retained evidence']
    ],
    risk:['Uncontrolled nonconforming output','Quality risk · containment control linked'],
    audit:['Internal Quality Audit 2026','IA-QA-2026-007 · Verification evidence · closed'],
    mapEvidenceCode:'NCR-2026-118',mapEvidenceTitle:'Nonconformance Report',mapAuditCode:'IA-QA-2026-007',mapAuditTitle:'Internal Quality Audit 2026'
  },
  'WI-PROD-021':{
    title:'Final Inspection Work Instruction',code:'WI-PROD-021',rev:'Rev 03',status:'In approval',space:'Operations',owner:'Ana Reyes',
    requirement:{code:'ISO 9001 · 8.5',detail:'Production and service provision'},
    process:{name:'Final Inspection',detail:'Process owner · Operations Supervisor'},
    related:[
      ['FORM-PROD-017 · Shift Start Verification Record','Related controlled form'],
      ['EXT-STD-002 · Customer Quality Specification','Applicable external requirement']
    ],
    evidence:[
      ['Final Inspection Record','INSP-2026-4421 · Retained evidence'],
      ['Gauge Verification Record','GVR-2026-201 · Retained evidence']
    ],
    risk:['Product released without complete inspection','Operational risk · release control linked'],
    audit:['Process Audit · Final Inspection','PA-2026-021 · Verification evidence'],
    mapEvidenceCode:'INSP-2026-4421',mapEvidenceTitle:'Final Inspection Record',mapAuditCode:'PA-2026-021',mapAuditTitle:'Process Audit · Final Inspection'
  }
};

function traceItemHtml(title,detail){
  return '<button class="traceItem"><div><b>'+escapeHtml(title)+'</b><span>'+escapeHtml(detail||'')+'</span></div><i data-lucide="chevron-right"></i></button>';
}

function getTraceabilityProfile(doc){
  if(doc?.code && traceabilityProfiles[doc.code]) return traceabilityProfiles[doc.code];
  if(typeof doc==='string' && traceabilityProfiles[doc]) return traceabilityProfiles[doc];
  if(doc?.code){
    return {
      title:doc.title||doc.code,code:doc.code,rev:doc.rev==='—'?'Current':'Rev '+(doc.rev||'—'),status:doc.status||'Current',
      space:activeSpace?.name||'Primary space',owner:doc.owner||'Process owner',
      requirement:{code:'Applicable QMS requirements',detail:'Open the requirement links for this document'},
      process:{name:activeSpace?.name||'Applicable process',detail:'Process owner · '+(doc.owner||'Assigned owner')},
      related:[['Related controlled information','No specific sample link configured in this prototype']],
      evidence:[['Linked records & evidence','Open Records & evidence to see retained proof']],
      risk:['Linked process risks','Open the risk links for this controlled information'],
      audit:['Audit & verification history','Open Audit trail for verification history'],
      mapEvidenceCode:'Records / evidence',mapEvidenceTitle:'Linked retained proof',mapAuditCode:'Audit',mapAuditTitle:'Verification history'
    };
  }
  return traceabilityProfiles['QMS-PRO-REC-001'];
}

function renderTraceability(docOrCode){
  const p=getTraceabilityProfile(docOrCode);
  activeTraceabilityDoc=docOrCode && typeof docOrCode!=='string' ? docOrCode : activeTraceabilityDoc;

  const set=(id,value)=>{const el=document.getElementById(id);if(el) el.textContent=value};
  set('traceFocusTitle',p.title); set('traceFocusCode',p.code); set('traceFocusRev',p.rev); set('traceFocusStatus',p.status);
  set('traceFocusSpace',p.space); set('traceFocusOwner',p.owner);
  set('tracePathRequirement',p.requirement.code); set('tracePathProcess',p.process.name); set('tracePathDocument',p.title);
  set('tracePathEvidence',p.evidence[0]?.[0]||'Linked evidence'); set('tracePathAudit',p.audit[0]||'Verification history');

  const status=document.getElementById('traceFocusStatus');
  if(status){
    status.className='tag '+(p.status==='Effective'?'success':p.status==='In approval'?'info':'neutral');
  }

  const requirements=document.getElementById('traceRequirements');
  if(requirements) requirements.innerHTML=traceItemHtml(p.requirement.code,p.requirement.detail);
  const process=document.getElementById('traceProcess');
  if(process) process.innerHTML=traceItemHtml(p.process.name,p.process.detail);
  const related=document.getElementById('traceRelatedDocs');
  if(related) related.innerHTML=p.related.map(x=>traceItemHtml(x[0],x[1])).join('');
  const evidence=document.getElementById('traceEvidence');
  if(evidence) evidence.innerHTML=p.evidence.map(x=>traceItemHtml(x[0],x[1])).join('');
  const risks=document.getElementById('traceRisks');
  if(risks) risks.innerHTML=traceItemHtml(p.risk[0],p.risk[1]);
  const audits=document.getElementById('traceAudits');
  if(audits) audits.innerHTML=traceItemHtml(p.audit[0],p.audit[1]);

  set('traceMapRequirement',p.requirement.code); set('traceMapRequirementDetail',p.requirement.detail);
  set('traceMapProcess',p.process.name); set('traceMapProcessDetail',p.process.detail);
  set('traceMapDocumentCode',p.code); set('traceMapDocumentTitle',p.title+' · '+p.rev);
  set('traceMapEvidenceCode',p.mapEvidenceCode); set('traceMapEvidenceTitle',p.mapEvidenceTitle);
  set('traceMapAuditCode',p.mapAuditCode); set('traceMapAuditTitle',p.mapAuditTitle);
  set('traceMapRisk',p.risk[0]); set('traceMapRelated',p.related[0]?.[0]||'Related controlled information');

  const focus=document.getElementById('relationshipFocus');
  if(focus && [...focus.options].some(o=>o.value===p.code)) focus.value=p.code;
  refreshIcons();
}

function renderDocumentTraceability(docOrCode){
  const p=getTraceabilityProfile(docOrCode||activeTraceabilityDoc||'QMS-PRO-REC-001');
  const set=(id,value)=>{const el=document.getElementById(id);if(el) el.textContent=value};

  set('docTraceTitle',p.title);
  set('docTracePathRequirement',p.requirement.code);
  set('docTracePathProcess',p.process.name);
  set('docTracePathDocument',p.title);
  set('docTracePathEvidence',p.evidence[0]?.[0]||'Linked evidence');
  set('docTracePathAudit',p.audit[0]||'Verification history');

  const requirements=document.getElementById('docTraceRequirements');
  if(requirements) requirements.innerHTML=traceItemHtml(p.requirement.code,p.requirement.detail);
  const process=document.getElementById('docTraceProcess');
  if(process) process.innerHTML=traceItemHtml(p.process.name,p.process.detail);
  const related=document.getElementById('docTraceRelated');
  if(related) related.innerHTML=p.related.map(x=>traceItemHtml(x[0],x[1])).join('');
  const evidence=document.getElementById('docTraceEvidence');
  if(evidence) evidence.innerHTML=p.evidence.map(x=>traceItemHtml(x[0],x[1])).join('');
  const risks=document.getElementById('docTraceRisks');
  if(risks) risks.innerHTML=traceItemHtml(p.risk[0],p.risk[1]);
  const audits=document.getElementById('docTraceAudits');
  if(audits) audits.innerHTML=traceItemHtml(p.audit[0],p.audit[1]);

  set('docTraceMapRequirement',p.requirement.code);
  set('docTraceMapRequirementDetail',p.requirement.detail);
  set('docTraceMapProcess',p.process.name);
  set('docTraceMapProcessDetail',p.process.detail);
  set('docTraceMapDocumentCode',p.code);
  set('docTraceMapDocumentTitle',p.title+' · '+p.rev);
  set('docTraceMapEvidenceCode',p.mapEvidenceCode);
  set('docTraceMapEvidenceTitle',p.mapEvidenceTitle);
  set('docTraceMapAuditCode',p.mapAuditCode);
  set('docTraceMapAuditTitle',p.mapAuditTitle);
  refreshIcons();
}

function setDocumentDetailTab(tab='document'){
  document.querySelectorAll('#documentDetailTabs [data-doc-tab]').forEach(button=>{
    button.classList.toggle('active',button.dataset.docTab===tab);
  });
  document.querySelectorAll('#repositoryDocument [data-doc-panel]').forEach(panel=>{
    panel.classList.toggle('active',panel.dataset.docPanel===tab);
  });
  if(tab==='revision'){
    renderDocumentRevisionHistory(activeTraceabilityDoc||'QMS-PRO-REC-001');
  }
  if(tab==='traceability'){
    renderDocumentTraceability(activeTraceabilityDoc||'QMS-PRO-REC-001');
    const map=document.getElementById('documentTraceabilityMap');
    const summary=document.getElementById('documentTraceabilitySummary');
    if(map) map.style.display='none';
    if(summary) summary.style.display='grid';
    const toggle=document.getElementById('docTraceMapToggle');
    if(toggle) toggle.innerHTML='<i data-lucide="network"></i>Open visual map';
  }
  document.querySelector('#repositoryDocument [data-doc-panel].active')?.scrollTo({top:0,behavior:'smooth'});
  refreshIcons();
}

function openTraceabilityForDocument(){
  setDocumentDetailTab('traceability');
}

document.getElementById('documentDetailTabs')?.addEventListener('click',e=>{
  const button=e.target.closest('button[data-doc-tab]');
  if(!button) return;
  e.preventDefault();
  setDocumentDetailTab(button.dataset.docTab);
});

function toggleDocumentTraceabilityMap(force){
  const summary=document.getElementById('documentTraceabilitySummary');
  const map=document.getElementById('documentTraceabilityMap');
  const button=document.getElementById('docTraceMapToggle');
  if(!summary||!map) return;
  const open=typeof force==='boolean'?force:map.style.display==='none';
  summary.style.display=open?'none':'grid';
  map.style.display=open?'block':'none';
  if(button) button.innerHTML=open?'<i data-lucide="rows-3"></i>Simple traceability':'<i data-lucide="network"></i>Open visual map';
  refreshIcons();
}

function toggleTraceabilityMap(force){
  const summary=document.getElementById('traceabilitySummary');
  const panel=document.getElementById('traceabilityMapPanel');
  const button=document.getElementById('traceMapToggle');
  if(!summary||!panel) return;
  const open=typeof force==='boolean'?force:panel.style.display==='none';
  summary.style.display=open?'none':'grid';
  panel.style.display=open?'block':'none';
  if(button) button.innerHTML=open?'<i data-lucide="rows-3"></i>Simple traceability':'<i data-lucide="network"></i>Open visual map';
  refreshIcons();
}

document.getElementById('relationshipFocus')?.addEventListener('change',e=>renderTraceability(e.target.value));
document.getElementById('relationshipSearch')?.addEventListener('input',e=>{
  const q=e.target.value.trim().toLowerCase();
  const focus=document.getElementById('relationshipFocus');
  if(!focus||!q) return;
  const option=[...focus.options].find(o=>o.textContent.toLowerCase().includes(q)||o.value.toLowerCase().includes(q));
  if(option){focus.value=option.value;renderTraceability(option.value)}
});

const breadcrumbCurrent=document.getElementById('breadcrumbCurrent');

document.querySelectorAll('#overviewPanelTabs [data-overview-tab]').forEach(button=>button.addEventListener('click',()=>{
  const tab=button.dataset.overviewTab;
  document.querySelectorAll('#overviewPanelTabs [data-overview-tab]').forEach(x=>x.classList.toggle('active',x===button));
  document.querySelectorAll('[data-overview-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.overviewPanel===tab));
  refreshIcons();
}));

function showView(id){
  if(id!=='repository'){
    const documentModal=document.getElementById('repositoryDocument');
    if(documentModal) documentModal.style.display='none';
    document.body.classList.remove('document-modal-open');
  }
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  const target=document.getElementById(id);
  if(target) target.classList.add('active');
  navItems.forEach(item=>item.classList.toggle('active',item.dataset.view===id));
  if(id==='repository') resetControlledInformation();
  if(breadcrumbCurrent && id!=='repository') breadcrumbCurrent.textContent=viewLabels[id]||'Workspace';
  window.scrollTo({top:0,behavior:'instant'});
  document.dispatchEvent(new CustomEvent('qms:viewchange',{detail:{id}}));
}
navItems.forEach(item=>item.addEventListener('click',()=>showView(item.dataset.view)));

const complianceFindings={
  audit:{
    severity:'critical',severityLabel:'High risk',title:'Internal audit overdue',clause:'ISO 9001:2026 · Clause 9.2',assessment:'Likely gap',confidence:'96%',status:'Open',
    reason:'The planned internal audit is 32 days overdue and no current approved audit report was found for this review period.',
    evidence:[['calendar-clock','Audit schedule','IA-SCH-2026 · Planned date passed','Overdue'],['file-search','Internal audit repository','No approved 2026 report found','Missing'],['history','Previous audit','IA-2025-006 · Outside current period','Outdated']],
    recommendation:'Schedule the internal audit, assign the lead auditor and attach the approved report and resulting findings.',documented:'Procedure and schedule exist',implemented:'Current report missing',effective:'Cannot verify'
  },
  capa:{
    severity:'critical',severityLabel:'High risk',title:'Corrective actions past target date',clause:'ISO 9001:2026 · Clause 10.2',assessment:'Probable nonconformity',confidence:'94%',status:'Open',
    reason:'Three corrective actions remain open beyond their approved target dates. Two do not contain effectiveness verification.',
    evidence:[['list-checks','CAPA register','3 actions overdue; oldest by 41 days','Overdue'],['user-round-check','Action ownership','Owners assigned to all 3 actions','Present'],['scan-search','Effectiveness checks','Missing for CAPA-2026-031 and 034','Missing']],
    recommendation:'Escalate the overdue actions, confirm revised dates and require effectiveness evidence before closure.',documented:'CAPA procedure exists',implemented:'3 actions overdue',effective:'2 checks missing'
  },
  training:{
    severity:'warning',severityLabel:'Medium risk',title:'Competency evidence missing',clause:'ISO 9001:2026 · Clause 7.2',assessment:'Evidence gap',confidence:'91%',status:'Open',
    reason:'Seven employees are assigned to controlled production activities without a current linked training or competency record.',
    evidence:[['users','Role assignments','7 affected employees identified','Checked'],['graduation-cap','Training matrix','Training marked complete for 5 employees','Partial'],['paperclip','Competency records','No current attachment for 7 employees','Missing']],
    recommendation:'Collect or complete competency records for the affected employees and link them to the applicable work instructions.',documented:'Training process exists',implemented:'Records incomplete',effective:'Partially verifiable'
  },
  supplier:{
    severity:'warning',severityLabel:'Medium risk',title:'Supplier evaluation approaching due date',clause:'ISO 9001:2026 · Clause 8.4',assessment:'Emerging risk',confidence:'89%',status:'Due in 14 days',
    reason:'The annual evaluation for a critical raw-material supplier is due in 14 days and supporting delivery-performance data is incomplete.',
    evidence:[['handshake','Approved supplier list','Supplier remains approved','Current'],['calendar-days','Evaluation schedule','Annual review due in 14 days','Due soon'],['chart-no-axes-combined','Performance evidence','August delivery data not linked','Partial']],
    recommendation:'Complete the missing delivery-performance record and assign the supplier evaluation before the due date.',documented:'Supplier control exists',implemented:'Review scheduled',effective:'Data incomplete'
  },
  objective:{
    severity:'warning',severityLabel:'Advisory',title:'Quality objective trending below target',clause:'ISO 9001:2026 · Clause 6.2',assessment:'Improvement opportunity',confidence:'86%',status:'Monitor',
    reason:'On-time release performance has remained below its 96% target for three consecutive months, although the decline is not yet linked to a corrective action.',
    evidence:[['target','Quality objective','On-time release target: 96%','Current'],['chart-no-axes-combined','KPI results','93.4%, 92.8% and 92.1%','Below target'],['circle-dot-dashed','Improvement register','No linked action found','Missing']],
    recommendation:'Review the trend with the process owner and open an improvement action if the cause is confirmed.',documented:'Objective defined',implemented:'Results measured',effective:'Target not achieved'
  },
  planning:{
    severity:'warning',severityLabel:'Medium risk',title:'Risk register is incomplete',clause:'ISO 9001:2026 · Clause 6.1',assessment:'Coverage gap',confidence:'88%',status:'Open',
    reason:'Two operational processes have approved procedures but do not have a current risk and opportunity assessment linked in the register.',
    evidence:[['workflow','Process register','18 active processes reviewed','Checked'],['shield-alert','Risk register','16 of 18 processes mapped','Partial'],['link-2-off','Unlinked processes','Recruitment and final packaging','Missing']],
    recommendation:'Complete the risk assessments for the two unmapped processes and link their controls and owners.',documented:'Risk method defined',implemented:'16 of 18 mapped',effective:'Partially verifiable'
  },
  context:{
    severity:'good',severityLabel:'On track',title:'Organizational context is well supported',clause:'ISO 9001:2026 · Clause 4',assessment:'Supported',confidence:'93%',status:'Monitor',
    reason:'Context, scope and interested-party records are current. One customer requirement link is due for confirmation.',
    evidence:[['building-2','Context register','Approved and reviewed this quarter','Current'],['users-round','Interested parties','Requirements mapped to owners','Current'],['link','Customer requirement','One link awaits confirmation','Review']],
    recommendation:'Confirm the pending customer requirement link during the next context review.',documented:'Current and approved',implemented:'Evidence present',effective:'Supported'
  },
  leadership:{
    severity:'good',severityLabel:'On track',title:'Leadership controls are supported',clause:'ISO 9001:2026 · Clause 5',assessment:'Supported with minor action',confidence:'92%',status:'Monitor',
    reason:'Leadership responsibilities and management-review evidence are current. One revised quality policy is awaiting final approval.',
    evidence:[['landmark','Quality policy','Rev 05 effective; Rev 06 pending','Controlled'],['user-round-check','Roles and authority','Assigned and acknowledged','Current'],['presentation','Management review','Current approved minutes linked','Present']],
    recommendation:'Complete final approval of the revised quality policy before its planned effective date.',documented:'Controls current',implemented:'Evidence present',effective:'Supported'
  }
};

function filterCompliance(status='all',trigger){
  const rows=[...document.querySelectorAll('#clauseRows .clauseRow')];
  rows.forEach(row=>row.hidden=status!=='all'&&row.dataset.risk!==status);
  const visible=rows.some(row=>!row.hidden);
  document.getElementById('complianceEmpty')?.classList.toggle('show',!visible);
  document.querySelectorAll('#complianceFilters [data-compliance-filter]').forEach(button=>button.classList.toggle('active',button.dataset.complianceFilter===status));
  document.querySelectorAll('.attentionList [data-risk]').forEach(item=>item.hidden=status!=='all'&&status!=='good'&&item.dataset.risk!==status);
  if(trigger?.dataset?.complianceFilter) trigger.classList.add('active');
}

function openComplianceFinding(key){
  const finding=complianceFindings[key]||complianceFindings.audit;
  const set=(id,value)=>{const el=document.getElementById(id);if(el) el.textContent=value};
  set('findingTitle',finding.title);set('findingClause',finding.clause);set('findingAssessment',finding.assessment);set('findingConfidence',finding.confidence);set('findingStatus',finding.status);set('findingReason',finding.reason);set('findingRecommendation',finding.recommendation);set('findingDocumented',finding.documented);set('findingImplemented',finding.implemented);set('findingEffective',finding.effective);
  const severity=document.getElementById('findingSeverity');
  if(severity){severity.className='findingSeverity '+finding.severity;severity.innerHTML='<i></i>'+escapeHtml(finding.severityLabel)}
  const evidence=document.getElementById('findingEvidence');
  if(evidence) evidence.innerHTML=finding.evidence.map(item=>'<div><span><i data-lucide="'+escapeHtml(item[0])+'"></i></span><p><b>'+escapeHtml(item[1])+'</b><small>'+escapeHtml(item[2])+'</small></p><em>'+escapeHtml(item[3])+'</em></div>').join('');
  document.getElementById('complianceDrawerBackdrop')?.classList.add('show');
  document.body.style.overflow='hidden';
  refreshIcons();
}

function closeComplianceFinding(event){
  if(event&&event.target?.id!=='complianceDrawerBackdrop') return;
  document.getElementById('complianceDrawerBackdrop')?.classList.remove('show');
  document.body.style.overflow='';
}

function generateCompliancePlan(){
  const panel=document.getElementById('generatedCompliancePlan');
  panel?.classList.add('show');
  panel?.scrollIntoView({behavior:'smooth',block:'center'});
  refreshIcons();
}

function approveCompliancePlan(button){
  if(button){button.innerHTML='<i data-lucide="check"></i>Ready for review';button.disabled=true}
  toast('Action plan prepared','Five draft actions are ready for owner, due-date and approval review. Nothing has been assigned yet.');
  refreshIcons();
}

function createFindingAction(button){
  if(button){button.innerHTML='<i data-lucide="check"></i>Draft action created';button.disabled=true}
  toast('Draft corrective action created','Review the owner, target date and evidence requirements before submitting.');
  refreshIcons();
}

function runComplianceAssessment(button){
  if(!button||button.disabled) return;
  const original=button.innerHTML;
  button.disabled=true;button.innerHTML='<i data-lucide="loader-circle" class="spin"></i>Assessing evidence...';refreshIcons();
  setTimeout(()=>{button.disabled=false;button.innerHTML='<i data-lucide="check"></i>Assessment current';toast('Assessment refreshed','1,428 documents and 8,942 evidence records were checked. No score changes were found.');refreshIcons();setTimeout(()=>{button.innerHTML=original;refreshIcons()},2200)},1100);
}

const headerSearch=document.getElementById('headerSearch');
const searchToggle=document.getElementById('searchToggle');
searchToggle?.addEventListener('click',()=>{
  const isOpen=headerSearch?.classList.toggle('open');
  if(isOpen) setTimeout(()=>document.getElementById('globalSearch')?.focus(),80);
});
document.addEventListener('click',e=>{
  if(headerSearch && !headerSearch.contains(e.target) && document.getElementById('globalSearch')?.value===''){
    headerSearch.classList.remove('open');
  }
});

function toast(title,message){
  document.querySelector('.toast')?.remove();
  const el=document.createElement('div');
  el.className='toast';
  el.innerHTML='<b>'+title+'</b><span>'+message+'</span>';
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('show'));
  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),220)},3600);
}

document.querySelectorAll('[data-toast-title]').forEach(button=>{
  button.addEventListener('click',()=>toast(button.dataset.toastTitle,button.dataset.toastMessage||'Action recorded in this prototype.'));
});



function openMasterLibrary(kind){
  if(kind==='controlled'){
    showView('repository');
    setRepositoryPanel('all');
    setTimeout(()=>document.getElementById('controlledMasterPanel')?.scrollIntoView({behavior:'smooth',block:'start'}),120);
  }else if(kind==='record'){
    showView('records');
  }
}
let controlledStatusFilter='all';

function setRepositoryPanel(panel='spaces'){
  document.querySelectorAll('#repositoryBrowseTabs [data-repository-tab]').forEach(button=>{
    button.classList.toggle('active',button.dataset.repositoryTab===panel);
  });
  document.querySelectorAll('#repositoryHub [data-repository-panel]').forEach(section=>{
    section.classList.toggle('active',section.dataset.repositoryPanel===panel);
  });
  refreshIcons();
}

document.querySelectorAll('#repositoryBrowseTabs [data-repository-tab]').forEach(button=>{
  button.addEventListener('click',()=>setRepositoryPanel(button.dataset.repositoryTab));
});

let activeRepositorySpaceId='quality';
let dmsDocumentTypeFilter='all';
let documentReturnContext='hub';
let documentModalReturnFocus=null;

// The viewer is shared by Documents and My tasks. Keeping it outside either
// route lets task reviews open in place instead of navigating to Documents.
const sharedDocumentViewer=document.getElementById('repositoryDocument');
document.querySelector('.mainArea')?.append(sharedDocumentViewer);

function spaceIconName(spaceId){
  return {
    management:'landmark',quality:'shield-check',recruitment:'user-round-search',operations:'workflow',
    engineering:'drafting-compass',purchasing:'handshake',hr:'users',external:'book-open-check'
  }[spaceId]||'folder-kanban';
}
function spaceToneClass(spaceId){
  return {
    management:'toneIndigo',quality:'toneBlue',recruitment:'toneTeal',operations:'toneTeal',
    engineering:'toneViolet',purchasing:'toneAmber',hr:'toneRose',external:'toneSlate'
  }[spaceId]||'toneSlate';
}
function spacePurpose(spaceId,space){
  return {
    management:'Quality policy, objectives and system-level governance documents.',
    quality:'Policies, procedures, audits, NCR controls and quality-system documents.',
    recruitment:'Recruitment procedures, screening controls, interview guidance and controlled forms.',
    operations:'Production procedures, work instructions and shop-floor forms.',
    engineering:'Specifications, drawings, technical standards and engineering changes.',
    purchasing:'Supplier controls, approved-source documents and purchasing requirements.',
    hr:'Training procedures, role requirements and competency controls.',
    external:'Standards, regulations and customer-controlled specifications.'
  }[spaceId]||space?.purpose||'Controlled information for this QMS area.';
}
function dmsCounts(spaceId,space){
  const presets={
    management:[66,61,5],quality:[486,472,7],recruitment:[118,112,6],operations:[368,344,4],
    engineering:[271,258,12],purchasing:[144,133,11],hr:[93,87,6],external:[203,194,9]
  };
  return presets[spaceId]||[space?.count||0,space?.count||0,0];
}
function renderDmsSpace(spaceId){
  const space=spaceDefinitions[spaceId];
  if(!space) return;
  activeRepositorySpaceId=spaceId;
  activeSpace=space;
  document.querySelectorAll('#dmsSpaceTabs [data-dms-space]').forEach(button=>button.classList.toggle('active',button.dataset.dmsSpace===spaceId));

  const title=document.getElementById('dmsSpaceTitle');
  const purpose=document.getElementById('dmsSpacePurpose');
  const icon=document.getElementById('dmsSpaceHeroIcon');
  if(title) title.textContent=space.name;
  if(purpose) purpose.textContent=spacePurpose(spaceId,space);
  if(icon){
    icon.className='dmsSpaceHeroIcon '+spaceToneClass(spaceId);
    icon.innerHTML='<i data-lucide="'+spaceIconName(spaceId)+'"></i>';
  }
  const counts=dmsCounts(spaceId,space);
  const set=(id,value)=>{const el=document.getElementById(id);if(el) el.textContent=value};
  set('dmsSpaceCount',counts[0]); set('dmsSpaceEffective',counts[1]); set('dmsSpaceAttention',counts[2]); set('dmsDocTabCount',counts[0]);
  document.querySelectorAll('.dmsContextSpaceName').forEach(el=>el.textContent=space.name);
  renderDmsDocuments();
  refreshIcons();
}
function renderDmsDocuments(){
  const space=spaceDefinitions[activeRepositorySpaceId];
  const host=document.getElementById('dmsDocumentRows');
  if(!space||!host) return;
  const q=(document.getElementById('dmsDocumentSearch')?.value||'').trim().toLowerCase();
  const docs=(space.docs||[]).filter(doc=>{
    const matchesSearch=!q||(doc.code+' '+doc.title+' '+doc.owner+' '+doc.type).toLowerCase().includes(q);
    const type=(doc.type||'').toLowerCase();
    const matchesType=dmsDocumentTypeFilter==='all'||type.includes(dmsDocumentTypeFilter);
    return matchesSearch&&matchesType;
  });
  host.innerHTML=docs.map(doc=>{
    const statusClass=doc.kind||'neutral';
    const type=(doc.type||'Controlled document').split(' · ')[0];
    return '<button class="dmsDocumentRow" data-code="'+escapeHtml(doc.code)+'">'
      +'<div><b>'+escapeHtml(doc.code)+'</b><strong>'+escapeHtml(doc.title)+'</strong><small>'+escapeHtml(space.name)+'</small>'+(revisionStateBadge(doc.code)||'')+'</div>'
      +'<span class="dmsTypeCell">'+escapeHtml(type)+'</span>'
      +'<span class="dmsRevisionCell"><small>Rev</small><b>'+escapeHtml(doc.rev||'—')+'</b></span>'
      +'<span class="dmsOwnerCell">'+escapeHtml(doc.owner||'—')+'</span>'
      +'<span class="tag '+statusClass+' dmsStatusCell">'+escapeHtml(doc.status||'—')+'</span>'
      +'<span class="dmsReviewCell">'+escapeHtml(doc.review||'—')+'</span><i data-lucide="chevron-right"></i></button>';
  }).join('');
  const empty=document.getElementById('dmsDocumentEmpty');
  if(empty) empty.style.display=docs.length?'none':'grid';
  refreshIcons();
}
function openDocumentFromWorkspace(spaceId,documentCode,trigger=null){
  const space=spaceDefinitions[spaceId];
  if(!space) return;
  const doc=space.docs?.find(x=>x.code===documentCode);
  if(!doc) return;
  activeSpace=space;
  activeRepositorySpaceId=spaceId;
  documentReturnContext='hub';
  selectSpaceDocument(doc,trigger);
}
document.getElementById('dmsSpaceTabs')?.addEventListener('click',e=>{
  const button=e.target.closest('[data-dms-space]');
  if(button) renderDmsSpace(button.dataset.dmsSpace);
});
document.getElementById('dmsSpaceSearch')?.addEventListener('input',e=>{
  const q=e.target.value.trim().toLowerCase();
  document.querySelectorAll('#dmsSpaceTabs [data-dms-space]').forEach(button=>{
    button.style.display=!q||button.textContent.toLowerCase().includes(q)?'grid':'none';
  });
});
document.getElementById('dmsDocumentSearch')?.addEventListener('input',renderDmsDocuments);
document.querySelectorAll('#dmsDocumentTypeTabs [data-doc-type]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('#dmsDocumentTypeTabs [data-doc-type]').forEach(x=>x.classList.remove('active'));
  button.classList.add('active');
  dmsDocumentTypeFilter=button.dataset.docType||'all';
  renderDmsDocuments();
}));
document.getElementById('dmsDocumentRows')?.addEventListener('click',e=>{
  const row=e.target.closest('.dmsDocumentRow[data-code]');
  if(row) openDocumentFromWorkspace(activeRepositorySpaceId,row.dataset.code,row);
});
document.getElementById('repositoryDocument')?.addEventListener('click',e=>{
  if(e.target.id==='repositoryDocument') closeDocumentDetail();
});
document.addEventListener('keydown',e=>{
  const modal=document.getElementById('repositoryDocument');
  if(e.key==='Escape'&&modal?.style.display!=='none'&&!document.querySelector('.modal.show,.complianceDrawerBackdrop.show')) closeDocumentDetail();
});
document.querySelectorAll('#dmsContextTabs [data-dms-context]').forEach(button=>button.addEventListener('click',()=>{
  const tab=button.dataset.dmsContext;
  document.querySelectorAll('#dmsContextTabs [data-dms-context]').forEach(x=>x.classList.toggle('active',x===button));
  document.querySelectorAll('[data-dms-context-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.dmsContextPanel===tab));
  refreshIcons();
}));

function applyControlledLibraryFilters(){
  const q=(document.getElementById('controlledSearch')?.value||'').trim().toLowerCase();
  const type=document.getElementById('controlledTypeFilter')?.value||'all';
  const space=document.getElementById('controlledSpaceFilter')?.value||'all';
  document.querySelectorAll('#controlledLibraryRows .controlledLibraryRow').forEach(row=>{
    const matchesSearch=!q||row.textContent.toLowerCase().includes(q);
    const matchesType=type==='all'||row.dataset.type===type;
    const matchesSpace=space==='all'||row.dataset.space===space;
    const matchesStatus=controlledStatusFilter==='all'||row.dataset.status===controlledStatusFilter;
    row.style.display=matchesSearch&&matchesType&&matchesSpace&&matchesStatus?'grid':'none';
  });
  document.dispatchEvent(new Event('qms:documentsfiltered'));
}
document.getElementById('controlledSearch')?.addEventListener('input',applyControlledLibraryFilters);
document.getElementById('controlledTypeFilter')?.addEventListener('change',applyControlledLibraryFilters);
document.getElementById('controlledSpaceFilter')?.addEventListener('change',applyControlledLibraryFilters);
document.querySelectorAll('#controlledStatusTabs button').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('#controlledStatusTabs button').forEach(x=>x.classList.remove('active'));
  button.classList.add('active');
  controlledStatusFilter=button.dataset.controlledStatus||'all';
  applyControlledLibraryFilters();
}));

/* QMS document spaces */
const spaceDefinitions={
  recruitment:{
    name:'Recruitment',path:'Recruitment / Controlled Information',count:118,
    docs:[
      {code:'QMS-PRO-REC-001',title:'Recruitment Procedure',type:'Procedure · Recruitment',rev:'03',classification:'Internal',owner:'Recruitment Manager',status:'Effective',kind:'success',review:'01 Sep 2027',approver:'Quality Manager',effective:'01 Sep 2026',purpose:'Defines recruitment planning, candidate screening, interview, selection and retained recruitment-record controls.'},
      {code:'SOP-REC-004',title:'Candidate Screening SOP',type:'SOP · Recruitment',rev:'04',owner:'Recruitment Manager',status:'Effective',kind:'success',review:'15 Aug 2027',approver:'Quality Manager',effective:'15 Aug 2026',purpose:'Defines the controlled screening workflow, decision criteria and evidence required before candidate endorsement.'},
      {code:'FORM-REC-006',title:'Candidate Evaluation Form',type:'Form · Recruitment',rev:'02',owner:'Recruitment',status:'Effective',kind:'success',review:'10 Jul 2027',approver:'Recruitment Manager',effective:'10 Jul 2026',purpose:'Controlled master used to record candidate evaluation and interview outcomes.'}
    ]
  },
  quality:{
    name:'Quality Management',path:'Quality / Procedures',count:486,
    docs:[
      {code:'SOP-QA-014',title:'Control of Nonconforming Outputs',type:'SOP · Quality',rev:'06',classification:'Internal',owner:'M. Santos',status:'Effective',kind:'success',review:'15 Sep 2027',approver:'Quality Manager',effective:'15 Sep 2026',purpose:'Defines controls for identifying, segregating, reviewing and dispositioning nonconforming outputs.'},
      {code:'SOP-QA-005',title:'Internal Audit Procedure',type:'SOP · Quality',rev:'04',owner:'A. Reyes',status:'Review due',kind:'warning',review:'03 Oct 2026',approver:'Quality Manager',effective:'03 Oct 2025',purpose:'Defines planning, execution, reporting and follow-up requirements for the internal audit program.'},
      {code:'SOP-QA-001',title:'Document Control Procedure',type:'SOP · Quality',rev:'05',owner:'M. Santos',status:'Effective',kind:'success',review:'20 Sep 2027',approver:'Quality Manager',effective:'20 Sep 2026',purpose:'Defines document creation, review, approval, release, revision, distribution and obsolete-document controls.'},
      {code:'SOP-QA-020',title:'Corrective Action Procedure',type:'SOP · Quality',rev:'03',owner:'J. Dela Cruz',status:'Draft',kind:'neutral',review:'—',approver:'Quality Manager',effective:'Not effective',purpose:'Defines investigation, root-cause analysis, corrective action, verification and closure requirements.'}
    ]
  },
  operations:{
    name:'Operations',path:'Operations / Controlled Documents',count:368,
    docs:[
      {code:'WI-PROD-021',title:'Final Inspection Work Instruction',type:'Work Instruction · Operations',rev:'03',owner:'A. Reyes',status:'In approval',kind:'info',review:'—',approver:'Quality Manager',effective:'Not effective',purpose:'Defines final inspection activities, acceptance criteria and required inspection records.'},
      {code:'SOP-PROD-009',title:'Production Line Release Procedure',type:'SOP · Operations',rev:'05',owner:'R. Flores',status:'Effective',kind:'success',review:'08 May 2027',approver:'Operations Manager',effective:'08 May 2026',purpose:'Defines authorization and release controls before production lines enter active operation.'},
      {code:'FORM-PROD-017',title:'Shift Start Verification Record',type:'Form · Operations',rev:'02',owner:'Production Control',status:'Effective',kind:'success',review:'21 Jun 2027',approver:'Operations Manager',effective:'21 Jun 2026',purpose:'Controlled master used to record shift-start equipment, material and process verification.'}
    ]
  },
  engineering:{
    name:'Engineering',path:'Engineering / Controlled Documents',count:271,
    docs:[
      {code:'SPEC-ENG-042',title:'Assembly Torque Specification',type:'Specification · Engineering',rev:'08',owner:'P. Lim',status:'Effective',kind:'success',review:'12 Feb 2027',approver:'Engineering Manager',effective:'12 Feb 2026',purpose:'Defines approved torque requirements and verification criteria for controlled assembly operations.'},
      {code:'ECN-2026-118',title:'Gauge Fixture Design Change',type:'Engineering Change · Engineering',rev:'01',owner:'K. Tan',status:'In review',kind:'info',review:'—',approver:'Engineering Manager',effective:'Not effective',purpose:'Records the proposed controlled change to the production gauge fixture design.'},
      {code:'DWG-ENG-114',title:'Inspection Fixture Drawing',type:'Drawing · Engineering',rev:'C',owner:'Design Engineering',status:'Effective',kind:'success',review:'04 Apr 2027',approver:'Engineering Manager',effective:'04 Apr 2026',purpose:'Controlled engineering drawing for the inspection fixture used in final verification.'}
    ]
  },
  purchasing:{
    name:'Purchasing & Supplier Quality',path:'Purchasing / Supplier Quality',count:144,
    docs:[
      {code:'SOP-PUR-012',title:'Supplier Control Procedure',type:'SOP · Purchasing',rev:'05',owner:'J. Cruz',status:'Review due',kind:'warning',review:'28 Sep 2026',approver:'Quality Manager',effective:'28 Sep 2025',purpose:'Defines supplier qualification, monitoring, evaluation and approved-source controls.'},
      {code:'SUP-EVAL-2026-031',title:'Supplier Evaluation — Alpha Metals',type:'Quality Record · Purchasing',rev:'—',owner:'Purchasing',status:'Current',kind:'success',review:'02 Sep 2027',approver:'Purchasing Manager',effective:'02 Sep 2026',purpose:'Retained supplier-performance evaluation record for Alpha Metals.'},
      {code:'FORM-PUR-006',title:'Supplier Corrective Action Request',type:'Form · Purchasing',rev:'04',owner:'Supplier Quality',status:'Effective',kind:'success',review:'14 Mar 2027',approver:'Quality Manager',effective:'14 Mar 2026',purpose:'Controlled master used to request and track supplier corrective actions.'}
    ]
  },
  hr:{
    name:'People & Competence',path:'Human Resources / Competence',count:93,
    docs:[
      {code:'SOP-HR-003',title:'Training and Competence Management',type:'SOP · Human Resources',rev:'04',owner:'HR',status:'Review due',kind:'warning',review:'10 Oct 2026',approver:'HR Manager',effective:'10 Oct 2025',purpose:'Defines competence requirements, training assignment, completion and effectiveness review.'},
      {code:'FORM-HR-011',title:'Training Effectiveness Assessment',type:'Form · Human Resources',rev:'02',owner:'HR',status:'Effective',kind:'success',review:'17 Jul 2027',approver:'HR Manager',effective:'17 Jul 2026',purpose:'Controlled form used to assess the effectiveness of completed training.'}
    ]
  },
  external:{
    name:'External Standards & Customer Requirements',path:'External Documents / Standards',count:203,
    docs:[
      {code:'EXT-STD-002',title:'Customer Quality Specification',type:'External Document · Quality',rev:'2026.2',owner:'Document Control',status:'Current',kind:'success',review:'01 Feb 2027',approver:'Document Control',effective:'05 Sep 2026',purpose:'Externally controlled customer specification tracked for source, revision and applicability.'},
      {code:'ISO-9001',title:'ISO 9001 Quality Management Systems',type:'External Standard',rev:'Current',owner:'Document Control',status:'Tracked',kind:'info',review:'15 Jan 2027',approver:'Document Control',effective:'Source controlled',purpose:'External reference standard maintained with currency tracking and linked internal controls.'}
    ]
  },
  records:{
    name:'Records & Evidence',path:'Records & Evidence',count:161,
    docs:[
      {code:'IA-2026-004',title:'Internal Audit — Production Line 2',type:'Audit Record · Quality',rev:'—',owner:'Quality',status:'Closed',kind:'success',review:'Retained',approver:'Quality Manager',effective:'12 Sep 2026',purpose:'Retained audit record containing findings, evidence and closure traceability.'},
      {code:'CAL-CERT-2026-0084',title:'Calibration Certificate — DMM-14',type:'Certificate · Metrology',rev:'—',owner:'Metrology',status:'Current',kind:'success',review:'18 Sep 2027',approver:'Metrology',effective:'18 Sep 2026',purpose:'Calibration evidence linked to equipment, audit and maintenance records.'}
    ]
  },
  management:{
    name:'Management System',path:'Management / System Documents',count:66,
    docs:[
      {code:'POL-001',title:'Quality Policy',type:'Policy · Management',rev:'05',owner:'Executive Management',status:'Effective',kind:'success',review:'01 Jan 2028',approver:'Managing Director',effective:'01 Jan 2026',purpose:'Defines the organization-wide commitment and direction for the quality management system.'},
      {code:'MR-2026-Q3',title:'Management Review — Q3 2026',type:'Management Record',rev:'—',owner:'Quality Manager',status:'Current',kind:'success',review:'Retained',approver:'Managing Director',effective:'15 Sep 2026',purpose:'Retained management-review inputs, decisions, actions and follow-up evidence.'}
    ]
  }
};

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}

function renderSpaceRows(space){
  const host=document.getElementById('spaceDocumentRows');
  const empty=document.getElementById('spaceEmptyState');
  if(!host||!empty) return;
  const docs=space.docs||[];
  host.innerHTML=docs.map((d,i)=>{
    const typeName=(d.type||'Controlled document').split(' · ')[0];
    return `
      <button class="spaceDocumentItem" data-space-doc-index="${i}">
        <span class="docMain"><b>${escapeHtml(d.code)}</b><strong>${escapeHtml(d.title)}</strong><small>${escapeHtml(d.type||'Controlled document')}</small>${revisionStateBadge(d.code)||''}</span>
        <span class="dmsTypeCell">${escapeHtml(typeName)}</span>
        <span class="dmsRevisionCell"><small>Rev</small><b>${escapeHtml(d.rev||'—')}</b></span>
        <span class="dmsOwnerCell">${escapeHtml(d.owner||'—')}</span>
        <span class="tag ${escapeHtml(d.kind)} dmsStatusCell">${escapeHtml(d.status)}</span>
        <span class="dmsReviewCell">${d.review==='—'?'—':escapeHtml(d.review||'—')}</span>
        <span class="rowChevron"><i data-lucide="chevron-right"></i></span>
      </button>`;
  }).join('');
  host.style.display=docs.length?'block':'none';
  empty.style.display=docs.length?'none':'block';
  const count=document.getElementById('spaceSummaryAll');
  if(count) count.textContent=space.count||docs.length;
  refreshIcons();
}

function selectSpaceDocument(doc,row){
  const isTaskContext=documentReturnContext==='task';
  documentModalReturnFocus=row||document.activeElement;
  activeTraceabilityDoc=doc;
  renderDocumentTraceability(doc);
  setDocumentDetailTab('document');
  document.querySelectorAll('#repositorySpace .spaceDocumentItem').forEach(x=>x.classList.remove('selected'));
  row?.classList.add('selected');
  const docView=document.getElementById('repositoryDocument');
  if(docView){
    docView.dataset.context=isTaskContext?'task':'documents';
    docView.style.display='block';
  }
  document.body.classList.add('document-modal-open');

  const title=document.getElementById('docTitle');
  if(!title) return;

  const normalizedRev=doc.rev==='—'?'Record':('Rev '+doc.rev);
  const isWorkflow=['In approval','In review','Draft','Review due'].includes(doc.status);

  title.textContent=doc.title;
  document.getElementById('docCode').textContent=doc.code;
  const codeHeader=document.getElementById('docCodeHeader');
  const contextBreadcrumb=document.getElementById('docContextBreadcrumb');
  const spaceBreadcrumb=document.getElementById('docSpaceBreadcrumb');
  if(codeHeader) codeHeader.textContent=doc.code;
  if(contextBreadcrumb) contextBreadcrumb.textContent=isTaskContext?'My tasks':'Controlled information';
  if(spaceBreadcrumb) spaceBreadcrumb.textContent=activeSpace?.name||'Primary space';
  if(breadcrumbCurrent) breadcrumbCurrent.textContent=isTaskContext
    ? 'My tasks / '+doc.code
    : 'Controlled information / '+(activeSpace?.name||'Space')+' / '+doc.code;
  document.getElementById('docRev').textContent=normalizedRev;
  setTag(document.getElementById('docStatus'),doc.status,doc.kind);
  document.getElementById('docOwner').textContent=doc.owner;
  document.getElementById('docApprover').textContent=doc.approver||'—';
  document.getElementById('docEffective').textContent=doc.effective||'—';
  document.getElementById('docReview').textContent=doc.review||'—';

  const viewerFileName=document.getElementById('viewerFileName');
  const viewerFileMeta=document.getElementById('viewerFileMeta');
  if(viewerFileName) viewerFileName.textContent=(doc.code||'document')+'.pdf';
  if(viewerFileMeta) viewerFileMeta.textContent=(doc.type||'Controlled document')+' · '+normalizedRev;

  document.getElementById('previewDocCode').textContent=doc.code;
  document.getElementById('previewDocTitle').textContent=doc.title;
  document.getElementById('previewDocRev').textContent=doc.rev;
  document.getElementById('previewDocStatus').textContent=doc.status;
  document.getElementById('previewEffective').textContent=doc.effective||'—';
  document.getElementById('previewPurpose').textContent=doc.purpose||'No purpose statement has been added yet.';
  document.getElementById('previewOwner').textContent=doc.owner||'—';
  document.getElementById('previewApprover').textContent=doc.approver||'—';
  document.getElementById('previewFooterCode').textContent=doc.code+' · '+normalizedRev;
  document.getElementById('previewDocType').textContent=(doc.type||'CONTROLLED DOCUMENT').toUpperCase();

  document.getElementById('detailDocType').textContent=doc.type||'Controlled document';
  const classificationHost=document.getElementById('docClassification');
  if(classificationHost) classificationHost.innerHTML=renderClassificationPill(doc);
  document.getElementById('detailResourceId').textContent='RES-'+String(doc.code||'DOC').replace(/[^A-Z0-9]/gi,'').slice(0,12).toUpperCase();
  document.getElementById('changeReasonRev').textContent=doc.rev==='—'?'—':doc.rev;
  document.getElementById('changeReasonText').textContent=doc.status==='Draft'
    ? 'Draft revision is being prepared and has not yet been released.'
    : doc.status==='In approval'
      ? 'Revision submitted for controlled approval. Release is blocked until the route is completed.'
      : 'Controlled revision retained with its documented change reason and approval history.';

  const decision=document.getElementById('approvalDecision');
  if(decision) decision.style.display=doc.status==='In approval'?'block':'none';

  const workflow=document.querySelector('#repositoryDocument .reviewWorkflow');
  if(workflow){
    workflow.innerHTML=isWorkflow && doc.status!=='Effective'
      ? '<div class="done"><i data-lucide="check"></i><span><b>Author</b><small>Completed</small></span></div><div class="done"><i data-lucide="check"></i><span><b>Department review</b><small>Completed</small></span></div><div class="active"><i data-lucide="clock-3"></i><span><b>Final approval</b><small>Waiting for decision</small></span></div><div><i data-lucide="circle"></i><span><b>Release</b><small>Blocked</small></span></div>'
      : '<div class="done"><i data-lucide="check"></i><span><b>Author</b><small>Completed</small></span></div><div class="done"><i data-lucide="check"></i><span><b>Department review</b><small>Completed</small></span></div><div class="done"><i data-lucide="check"></i><span><b>Final approval</b><small>Completed</small></span></div><div class="done"><i data-lucide="check"></i><span><b>Released</b><small>'+escapeHtml(doc.status)+'</small></span></div>';
  }

  refreshOpenRevisionIndicators(doc);
  renderDocumentRevisionHistory(doc);
  document.querySelector('.documentStage')?.scrollTo({top:0,behavior:'smooth'});
  refreshIcons();
  requestAnimationFrame(()=>document.querySelector('#repositoryDocument .documentModalClose')?.focus());
}

function prototypeDecision(result){
  const comment=document.getElementById('approvalDecisionComment')?.value.trim();
  toast('Revision '+result.toLowerCase(),comment||('The '+result.toLowerCase()+' decision was recorded in the prototype audit trail.'));
}

let activeSpace=null;

function resetControlledInformation(){
  const hub=document.getElementById('repositoryHub');
  const space=document.getElementById('repositorySpace');
  const doc=document.getElementById('repositoryDocument');
  if(hub) hub.style.display='block';
  if(space) space.style.display='none';
  if(doc) doc.style.display='none';
  document.body.classList.remove('document-modal-open');
  activeSpace=spaceDefinitions[activeRepositorySpaceId]||spaceDefinitions.quality;
  setRepositoryPanel('all');
  renderDmsSpace(activeRepositorySpaceId||'quality');
  if(breadcrumbCurrent) breadcrumbCurrent.textContent='Controlled information';
}

function openDocumentSpace(spaceId,override=null){
  documentReturnContext='space';
  const base=override||spaceDefinitions[spaceId];
  if(!base) return;
  if(!document.getElementById('repository')?.classList.contains('active')) showView('repository');
  activeSpace=base;
  const hub=document.getElementById('repositoryHub');
  const space=document.getElementById('repositorySpace');
  const doc=document.getElementById('repositoryDocument');
  if(hub) hub.style.display='none';
  if(doc) doc.style.display='none';
  if(space) space.style.display='block';
  document.getElementById('spaceDetailName').textContent=base.name;
  const listTitle=document.getElementById('spaceListTitle');
  if(listTitle) listTitle.textContent=base.name;
  document.getElementById('spaceDetailCount').textContent=base.count||0;
  document.getElementById('spaceDetailPath').textContent=base.path||base.name;
  renderSpaceRows(base);
  if(breadcrumbCurrent) breadcrumbCurrent.textContent='Controlled information / '+base.name;
  window.scrollTo({top:0,behavior:'smooth'});
}

function openControlledDocument(spaceId,documentCode){
  if(!document.getElementById('repository')?.classList.contains('active')) showView('repository');
  openDocumentFromWorkspace(spaceId,documentCode);
}

function closeDocumentDetail(){
  const hub=document.getElementById('repositoryHub');
  const space=document.getElementById('repositorySpace');
  const doc=document.getElementById('repositoryDocument');
  if(doc) doc.style.display='none';
  document.body.classList.remove('document-modal-open');
  if(documentReturnContext==='task'){
    if(breadcrumbCurrent) breadcrumbCurrent.textContent='My tasks';
  }else if(documentReturnContext==='hub'){
    if(space) space.style.display='none';
    if(hub) hub.style.display='block';
    if(breadcrumbCurrent) breadcrumbCurrent.textContent='Controlled information';
  }else{
    if(hub) hub.style.display='none';
    if(space) space.style.display='block';
    if(breadcrumbCurrent) breadcrumbCurrent.textContent='Controlled information / '+(activeSpace?.name||'Space');
  }
  const returnFocus=documentModalReturnFocus;
  documentModalReturnFocus=null;
  documentReturnContext='hub';
  // Restore after the dialog boundary releases inert siblings, without a delayed
  // timer that can steal focus from the user's next search or keyboard action.
  queueMicrotask(()=>{
    if(returnFocus?.isConnected && returnFocus.getClientRects().length) returnFocus.focus?.({preventScroll:true});
  });
}

function closeDocumentSpace(){
  const hub=document.getElementById('repositoryHub');
  const space=document.getElementById('repositorySpace');
  const doc=document.getElementById('repositoryDocument');
  if(hub) hub.style.display='block';
  if(space) space.style.display='none';
  if(doc) doc.style.display='none';
  activeSpace=null;
  setRepositoryPanel('spaces');
  if(breadcrumbCurrent) breadcrumbCurrent.textContent='Controlled information';
  window.scrollTo({top:0,behavior:'smooth'});
}

const spacesHost=document.getElementById('documentSpaces');
document.getElementById('repositoryHub')?.addEventListener('click',e=>{
  const card=e.target.closest('.spaceCard[data-space-id]');
  if(!card) return;
  openDocumentSpace(card.dataset.spaceId);
});

document.getElementById('spaceDocumentRows')?.addEventListener('click',e=>{
  const row=e.target.closest('.spaceDocumentItem[data-space-doc-index]');
  if(!row||!activeSpace) return;
  const doc=activeSpace.docs?.[Number(row.dataset.spaceDocIndex)];
  if(doc){documentReturnContext='space';selectSpaceDocument(doc,row);}
});


const spaceDocSearch=document.getElementById('spaceDocSearch');
spaceDocSearch?.addEventListener('input',()=>{
  const q=spaceDocSearch.value.trim().toLowerCase();
  document.querySelectorAll('#spaceDocumentRows .spaceDocumentItem').forEach(row=>{
    row.style.display=!q||row.textContent.toLowerCase().includes(q)?'grid':'none';
  });
});

document.querySelectorAll('.libraryFilterTabs button').forEach(tab=>{
  tab.addEventListener('click',()=>{
    tab.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
    tab.classList.add('active');
    const label=tab.textContent.trim();
    document.querySelectorAll('#spaceDocumentRows .spaceDocumentItem').forEach(row=>{
      const text=row.textContent;
      let show=true;
      if(label==='Effective') show=text.includes('Effective')||text.includes('Current');
      if(label==='In workflow') show=text.includes('In approval')||text.includes('Draft')||text.includes('In review');
      if(label==='Due') show=text.includes('Review due');
      row.style.display=show?'grid':'none';
    });
  });
});

document.querySelectorAll('.spaceTabs button').forEach(tab=>{
  tab.addEventListener('click',()=>{
    const name=tab.dataset.spaceTab;
    if(name==='documents'){
      document.querySelectorAll('.spaceTabs button').forEach(x=>x.classList.remove('active'));
      tab.classList.add('active');
      return;
    }
    toast('Space '+tab.textContent.trim(), 'This prototype keeps the document review workspace visible. The '+name+' workspace will use the same space context.');
  });
});

function openSpaceModal(){
  const modal=document.getElementById('spaceModal');
  if(!modal) return;
  modal.classList.add('show');
  setTimeout(()=>document.getElementById('newSpaceName')?.focus(),60);
  refreshIcons();
}
function closeSpaceModal(){document.getElementById('spaceModal')?.classList.remove('show')}

function loadCustomSpaces(){
  try{return JSON.parse(localStorage.getItem('nexus.customSpaces')||'[]')}catch(e){return[]}
}
function saveCustomSpaces(spaces){
  try{localStorage.setItem('nexus.customSpaces',JSON.stringify(spaces))}catch(e){}
}
function renderCustomSpaceCard(space){
  if(!spacesHost||document.querySelector('[data-space-id="'+space.id+'"]')) return;
  const createCard=spacesHost.querySelector('.createSpaceCard');
  const card=document.createElement('button');
  card.className='spaceCard customSpaceCard';
  card.dataset.spaceId=space.id;
  card.innerHTML=`
    <span class="spaceIcon toneSlate"><i data-lucide="folder-kanban"></i></span>
    <span class="spaceArrow"><i data-lucide="arrow-up-right"></i></span>
    <strong>${escapeHtml(space.name)}</strong>
    <p>${escapeHtml(space.purpose||'Custom controlled-document space.')}</p>
    <span class="spaceMeta"><b>0</b> resources · ${escapeHtml(space.type||'Custom space')}</span>`;
  spacesHost.insertBefore(card,createCard);
  spaceDefinitions[space.id]={...space,docs:space.docs||[],count:space.count||0,path:space.path||space.name};
  const rail=document.getElementById('dmsSpaceTabs');
  if(rail && !rail.querySelector('[data-dms-space="'+space.id+'"]')){
    const tab=document.createElement('button');
    tab.dataset.dmsSpace=space.id;
    tab.innerHTML='<span class="dmsTabIcon toneSlate"><i data-lucide="folder-kanban"></i></span><span><b>'+escapeHtml(space.name)+'</b><small>0 documents</small></span><i data-lucide="chevron-right"></i>';
    rail.appendChild(tab);
  }
  refreshIcons();
}
loadCustomSpaces().forEach(renderCustomSpaceCard);

function createDocumentSpace(){
  const name=document.getElementById('newSpaceName')?.value.trim();
  if(!name){
    document.getElementById('newSpaceName')?.focus();
    toast('Space name required','Give the document space a name before creating it.');
    return;
  }
  const code=(document.getElementById('newSpaceCode')?.value.trim()||name.slice(0,3)).toUpperCase();
  const type=document.getElementById('newSpaceType')?.value||'Department / Function';
  const purpose=document.getElementById('newSpacePurpose')?.value.trim()||'Custom controlled-document space.';
  const owner=document.getElementById('newSpaceOwner')?.value||'Quality Department';
  const view=document.getElementById('newSpaceView')?.value||'Controlled documents';
  const id='custom-'+Date.now();
  const space={id,name,code,type,purpose,owner,view,count:0,path:name,docs:[]};
  const saved=loadCustomSpaces();
  saved.push(space);
  saveCustomSpaces(saved);
  renderCustomSpaceCard(space);
  refreshRegistrationOptions();
  closeSpaceModal();
  ['newSpaceName','newSpaceCode','newSpacePurpose'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});
  toast('Document space created',name+' is ready. Add controlled documents or link existing canonical resources.');
  openDocumentSpace(id,space);
}

/* Document workspace */
const documents={
  qa014:{
    title:'Control of Nonconforming Outputs',code:'SOP-QA-014',rev:'Rev 06',status:'Effective',kind:'success',
    owner:'Quality Department',approver:'Quality Manager',effective:'15 Sep 2026',review:'15 Sep 2027',
    purpose:'Defines controls for identifying, segregating, reviewing and dispositioning nonconforming outputs.'
  },
  qa005:{
    title:'Internal Audit Procedure',code:'SOP-QA-005',rev:'Rev 04',status:'Review due',kind:'warning',
    owner:'Ana Reyes',approver:'Quality Manager',effective:'03 Oct 2025',review:'03 Oct 2026',
    purpose:'Defines planning, execution, reporting and follow-up requirements for the internal audit program.'
  },
  qa001:{
    title:'Document Control Procedure',code:'SOP-QA-001',rev:'Rev 05',status:'Effective',kind:'success',
    owner:'Quality Department',approver:'Quality Manager',effective:'20 Sep 2026',review:'20 Sep 2027',
    purpose:'Defines document creation, review, approval, release, revision, distribution and obsolete-document controls.'
  },
  qa020:{
    title:'Corrective Action Procedure',code:'SOP-QA-020',rev:'Rev 03',status:'Draft',kind:'neutral',
    owner:'J. Dela Cruz',approver:'Quality Manager',effective:'Not effective',review:'Not scheduled',
    purpose:'Defines investigation, root-cause analysis, corrective action, verification and closure requirements.'
  },
  qa009:{
    title:'Management of Customer Complaints',code:'SOP-QA-009',rev:'Rev 07',status:'Effective',kind:'success',
    owner:'L. Garcia',approver:'Quality Manager',effective:'11 Jan 2026',review:'11 Jan 2027',
    purpose:'Defines intake, investigation, response, escalation and closure controls for customer quality complaints.'
  }
};

function setTag(el,text,kind){
  if(!el) return;
  el.textContent=text;
  el.className='tag '+kind;
}
document.querySelectorAll('.documentRow').forEach(row=>{
  row.addEventListener('click',()=>{
    document.querySelectorAll('.documentRow').forEach(x=>x.classList.remove('selected'));
    row.classList.add('selected');
    const d=documents[row.dataset.doc];
    if(!d) return;
    document.getElementById('docTitle').textContent=d.title;
    document.getElementById('docCode').textContent=d.code;
    document.getElementById('docRev').textContent=d.rev;
    setTag(document.getElementById('docStatus'),d.status,d.kind);
    document.getElementById('docOwner').textContent=d.owner;
    document.getElementById('docApprover').textContent=d.approver;
    document.getElementById('docEffective').textContent=d.effective;
    document.getElementById('docReview').textContent=d.review;
    document.getElementById('docPurpose').textContent=d.purpose;
  });
});

document.querySelectorAll('.treeRow').forEach(row=>{
  row.addEventListener('click',()=>{
    if(row.classList.contains('root')) return;
    document.querySelectorAll('.treeRow').forEach(x=>x.classList.remove('selected'));
    row.classList.add('selected');
  });
});

document.querySelectorAll('.inspectorTabs button[data-tab]').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.inspectorTabs button[data-tab]').forEach(x=>x.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.inspectorContent').forEach(p=>p.classList.remove('active'));
    document.getElementById('tab-'+tab.dataset.tab)?.classList.add('active');
  });
});

/* Approval queue */
document.querySelectorAll('.approvalItem').forEach(item=>{
  item.addEventListener('click',()=>{
    document.querySelectorAll('.approvalItem').forEach(x=>x.classList.remove('selected'));
    item.classList.add('selected');
    const code=item.dataset.documentCode;
    const found=code?findDocByCode(code):null;
    const openButton=document.getElementById('openTaskDocument');
    if(found&&openButton){
      openButton.dataset.documentCode=code;
      const hero=document.querySelector('#approvals .approvalHero');
      const meta=hero?.querySelector('.recordMeta');
      if(hero?.querySelector('h2')) hero.querySelector('h2').textContent=found.doc.title;
      if(meta?.querySelector('b')) meta.querySelector('b').textContent=found.doc.code;
      if(meta?.querySelector('span')) meta.querySelector('span').textContent='Rev '+found.doc.rev;
      setTag(meta?.querySelector('.tag'),found.doc.status,found.doc.kind);
    }
  });
});
document.querySelectorAll('.queueTabs button').forEach(tab=>{
  tab.addEventListener('click',()=>{
    tab.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
    tab.classList.add('active');
  });
});

/* Sources & evidence */
const resources={
  cal:{title:'Calibration Certificate — DMM-14',code:'CAL-CERT-2026-0084',type:'Certificate',status:'Current',kind:'success',id:'RES-88291',storage:'S3 · immutable',owner:'Metrology',count:'4 active',used:[
    ['DMM-14','Equipment record · EVIDENCED_BY'],['IA-2026-004','Internal audit · EVIDENCED_BY'],['MR-229','Maintenance record · RELATED_TO']
  ]},
  audit:{title:'Internal Audit — Production Line 2',code:'IA-2026-004',type:'Audit record',status:'Closed',kind:'success',id:'RES-77404',storage:'S3 · immutable',owner:'Quality',count:'12 active',used:[
    ['SOP-QA-005','Internal Audit Procedure · EVIDENCES'],['CAR-2026-019','Corrective action · SOURCE_OF'],['LINE-02','Production line · RELATED_TO']
  ]},
  supplier:{title:'Supplier Evaluation — Alpha Metals',code:'SUP-EVAL-2026-031',type:'Quality record',status:'Current',kind:'success',id:'RES-66031',storage:'S3 · immutable',owner:'Purchasing',count:'2 active',used:[
    ['SOP-PUR-012','Supplier Control Procedure · EVIDENCED_BY'],['SUP-ALPHA','Supplier record · RELATED_TO']
  ]},
  external:{title:'Customer Quality Specification',code:'CS-204',type:'External source',status:'Tracked',kind:'info',id:'RES-EXT-204',storage:'External controlled source',owner:'Quality',count:'9 active',used:[
    ['WI-PROD-021','Final Inspection WI · REQUIRED_BY'],['SOP-QA-014','Nonconforming Outputs · REFERENCES'],['FORM-QA-011','NCR Form · RELATED_TO']
  ]},
  orphan:{title:'Receiving Inspection Attachment',code:'REC-2026-114',type:'Evidence',status:'Unlinked',kind:'warning',id:'RES-99114',storage:'S3 · staging',owner:'Warehouse',count:'0 active',used:[]}
};
function renderUsedBy(items){
  const host=document.getElementById('resUsedBy');
  if(!host) return;
  if(!items.length){
    host.innerHTML='<div class="emptyInline"><b>No active relationships</b><span>Link this resource to the document, record or audit it supports.</span></div>';
    return;
  }
  host.innerHTML=items.map(([code,label])=>'<button class="linkedRecord"><span><i data-lucide="link-2"></i></span><div><b>'+code+'</b><small>'+label+'</small></div></button>').join('');
  refreshIcons();
}
document.querySelectorAll('.resourceRow').forEach(row=>{
  row.addEventListener('click',()=>{
    document.querySelectorAll('.resourceRow').forEach(x=>x.classList.remove('selected'));
    row.classList.add('selected');
    const d=resources[row.dataset.resource];
    if(!d) return;
    document.getElementById('resTitle').textContent=d.title;
    document.getElementById('resCode').textContent=d.code;
    document.getElementById('resType').textContent=d.type;
    setTag(document.getElementById('resStatus'),d.status,d.kind);
    document.getElementById('resId').textContent=d.id;
    document.getElementById('resStorage').textContent=d.storage;
    document.getElementById('resOwner').textContent=d.owner;
    document.getElementById('resCount').textContent=d.count;
    renderUsedBy(d.used);
  });
});


const evidenceItems={
  screening:{type:'Completed form',title:'Candidate Screening Record — Batch 0918',code:'REC-SCR-2026-0918',status:'Retained',kind:'success',date:'18 Sep 2026',owner:'Recruitment',retention:'5 years',access:'Recruitment + Quality',process:'Recruitment',document:'QMS-PRO-REC-001 · Recruitment Procedure',audit:'Internal Audit 2026'},
  interview:{type:'Interview record',title:'Candidate Interview Record — A. Santos',code:'REC-INT-2026-442',status:'Retained',kind:'success',date:'17 Sep 2026',owner:'Recruitment',retention:'5 years',access:'Recruitment + Quality',process:'Recruitment',document:'SOP-REC-004 · Screening SOP',audit:'Internal Audit 2026'},
  cal:{type:'Certificate',title:'Calibration Certificate — DMM-14',code:'CAL-CERT-2026-0084',status:'Current',kind:'success',date:'18 Sep 2026',owner:'Metrology',retention:'7 years',access:'Quality + Operations',process:'Operations',document:'WI-QA-003 · Inspection Work Instruction',audit:'IA-2026-004'},
  audit:{type:'Audit evidence',title:'Internal Audit — Production Line 2',code:'IA-2026-004',status:'Closed',kind:'success',date:'12 Sep 2026',owner:'Quality',retention:'7 years',access:'Quality + Auditors',process:'Internal Audit',document:'SOP-QA-005 · Internal Audit Procedure',audit:'Audit Program 2026'},
  orphan:{type:'Evidence',title:'Receiving Inspection Attachment',code:'REC-2026-114',status:'Unlinked',kind:'warning',date:'20 Sep 2026',owner:'Warehouse',retention:'Pending classification',access:'Warehouse + Quality',process:'Unclassified',document:'Not linked',audit:'Not linked'}
};
let activeEvidenceProcess='all';
let activeEvidenceStatus='all';
let activeEvidenceKey='screening';

function recordProcessCopy(process){
  return {
    all:['All evidence','Canonical retained proof across all QMS processes.'],
    Recruitment:['Recruitment evidence','Completed recruitment forms, interview records and retained hiring evidence.'],
    Operations:['Operations evidence','Certificates, inspections and retained operational proof.'],
    Quality:['Quality evidence','Quality-system records and verification evidence.'],
    'Internal Audit':['Internal audit evidence','Audit records, evidence packages and verification history.'],
    Unclassified:['Unclassified evidence','Items that still need process or controlled-information links.']
  }[process]||[process+' evidence','Retained proof for this QMS process.'];
}
function applyEvidenceFilters(){
  const q=(document.getElementById('recordsSearch')?.value||'').trim().toLowerCase();
  const type=document.getElementById('recordTypeFilter')?.value||'all';
  let visible=0;
  document.querySelectorAll('#recordsLibraryRows .evidenceRow').forEach(row=>{
    const matchProcess=activeEvidenceProcess==='all'||row.dataset.process===activeEvidenceProcess;
    const matchStatus=activeEvidenceStatus==='all'||row.dataset.status===activeEvidenceStatus;
    const matchType=type==='all'||row.dataset.type===type;
    const matchSearch=!q||row.textContent.toLowerCase().includes(q);
    const show=matchProcess&&matchStatus&&matchType&&matchSearch;
    row.style.display=show?'grid':'none';
    if(show) visible++;
  });
  const empty=document.getElementById('recordsLibraryEmpty');
  if(empty) empty.style.display=visible?'none':'grid';
}
function setEvidenceProcess(process){
  activeEvidenceProcess=process;
  document.querySelectorAll('#recordsProcessTabs [data-record-process]').forEach(button=>button.classList.toggle('active',button.dataset.recordProcess===process));
  const copy=recordProcessCopy(process);
  const title=document.getElementById('recordsLibraryTitle');
  const subtitle=document.getElementById('recordsLibrarySubtitle');
  if(title) title.textContent=copy[0];
  if(subtitle) subtitle.textContent=copy[1];
  applyEvidenceFilters();
}
function openEvidenceDetail(key){
  const d=evidenceItems[key];
  if(!d) return;
  activeEvidenceKey=key;
  const hub=document.getElementById('recordsHub');
  const detail=document.getElementById('recordDetail');
  if(hub) hub.style.display='none';
  if(detail) detail.style.display='block';

  const set=(id,value)=>{const el=document.getElementById(id);if(el) el.textContent=value};
  set('recordDetailProcess',d.process); set('recordDetailCode',d.code); set('recordDetailTitle',d.title);
  set('recordDetailCodeMeta',d.code); set('recordDetailType',d.type); set('recordFileName',d.code+'.pdf');
  set('recordPreviewTitle',d.title.replace(/ — .*/,'')); set('evidenceDate',d.date); set('evidenceOwner',d.owner);
  set('evidenceRetention',d.retention); set('evidenceAccess',d.access); set('recordInfoProcess',d.process);
  set('recordInfoDocument',d.document); set('traceProcess',d.process); set('traceDocument',d.document);
  set('traceEvidence',d.title.replace(/ — .*/,'')); set('traceAudit',d.audit);
  set('recordTraceabilityTitle',d.title.replace(/ — .*/,'')); set('retentionPanelPeriod',d.retention); set('retentionPanelAccess',d.access);
  setTag(document.getElementById('recordDetailStatus'),d.status,d.kind);
  setRecordDetailTab('record');
  if(breadcrumbCurrent) breadcrumbCurrent.textContent='Records & evidence / '+d.process+' / '+d.code;
  window.scrollTo({top:0,behavior:'smooth'});
  refreshIcons();
}
function closeEvidenceDetail(){
  const hub=document.getElementById('recordsHub');
  const detail=document.getElementById('recordDetail');
  if(detail) detail.style.display='none';
  if(hub) hub.style.display='block';
  if(breadcrumbCurrent) breadcrumbCurrent.textContent='Records & evidence';
  window.scrollTo({top:0,behavior:'smooth'});
}
function setRecordDetailTab(tab='record'){
  document.querySelectorAll('#recordDetailTabs [data-record-tab]').forEach(button=>button.classList.toggle('active',button.dataset.recordTab===tab));
  document.querySelectorAll('#recordDetail [data-record-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.recordPanel===tab));
  refreshIcons();
}
document.getElementById('recordsLibraryRows')?.addEventListener('click',e=>{
  const row=e.target.closest('.evidenceRow[data-evidence]');
  if(row) openEvidenceDetail(row.dataset.evidence);
});
document.getElementById('recordsProcessTabs')?.addEventListener('click',e=>{
  const button=e.target.closest('[data-record-process]');
  if(button) setEvidenceProcess(button.dataset.recordProcess);
});
document.getElementById('recordsProcessSearch')?.addEventListener('input',e=>{
  const q=e.target.value.trim().toLowerCase();
  document.querySelectorAll('#recordsProcessTabs [data-record-process]').forEach(button=>button.style.display=!q||button.textContent.toLowerCase().includes(q)?'grid':'none');
});
document.getElementById('recordsSearch')?.addEventListener('input',applyEvidenceFilters);
document.getElementById('recordTypeFilter')?.addEventListener('change',applyEvidenceFilters);
document.querySelectorAll('#recordsLibraryTabs [data-records-tab]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('#recordsLibraryTabs [data-records-tab]').forEach(x=>x.classList.remove('active'));
  button.classList.add('active');
  activeEvidenceStatus=button.dataset.recordsTab||'all';
  applyEvidenceFilters();
}));

/* Document type configuration */
const typeConfigs={
  sop:{name:'SOP / Procedure',count:'184 documents',prefix:'SOP',numbering:'SOP-{DEPT}-{###}',approval:'Department review → Quality approval',review:'12 months'},
  wi:{name:'Work Instruction',count:'326 documents',prefix:'WI',numbering:'WI-{DEPT}-{###}',approval:'Department approval',review:'12 months'},
  form:{name:'Form / Template',count:'391 documents',prefix:'FORM',numbering:'FORM-{DEPT}-{###}',approval:'Owner → Quality approval',review:'24 months'},
  policy:{name:'Policy',count:'37 documents',prefix:'POL',numbering:'POL-{###}',approval:'Executive approval',review:'24 months'},
  external:{name:'External Document',count:'203 documents',prefix:'EXT',numbering:'EXT-{SRC}-{###}',approval:'Document control review',review:'12 months'}
};
function selectTypeConfiguration(row,key){
  document.querySelectorAll('.typeRow').forEach(x=>x.classList.remove('selected'));
  row?.classList.add('selected');
  const d=typeConfigs[key];
  if(!d) return;
  document.getElementById('typeName').textContent=d.name;
  document.getElementById('typeCount').textContent=d.count;
  document.getElementById('typePrefix').value=d.prefix;
  document.getElementById('typeNumbering').value=d.numbering;
  const approval=document.getElementById('typeApproval');
  const review=document.getElementById('typeReview');
  approval.innerHTML='<option>'+d.approval+'</option>';
  review.innerHTML='<option>'+d.review+'</option><option>'+(d.review==='12 months'?'24 months':'12 months')+'</option>';
}
document.querySelectorAll('.typeRow').forEach(row=>row.addEventListener('click',()=>selectTypeConfiguration(row,row.dataset.type)));

function loadCustomDocumentTypes(){
  try{return JSON.parse(localStorage.getItem('nexus.customDocumentTypes')||'[]')}catch(e){return[]}
}
function saveCustomDocumentTypes(types){
  try{localStorage.setItem('nexus.customDocumentTypes',JSON.stringify(types))}catch(e){}
}
function renderCustomDocumentTypeRow(type){
  if(!type?.id||document.querySelector('.typeRow[data-type="'+type.id+'"]')) return;
  typeConfigs[type.id]={
    name:type.name,
    count:(type.count||0)+' documents',
    prefix:type.code,
    numbering:type.numbering||('QMS-'+type.code+'-{SPACE}-{###}'),
    approval:type.approval||'Process Owner → Quality Manager',
    review:type.review||'12 months'
  };
  const pane=document.querySelector('.typeTablePane');
  if(!pane) return;
  const row=document.createElement('button');
  row.className='typeRow customTypeRow';
  row.dataset.type=type.id;
  row.innerHTML='<div><b>'+escapeHtml(type.name)+'</b><small>Custom controlled type</small></div><span>'+escapeHtml(type.code)+'</span><span>'+escapeHtml(type.numbering||('QMS-'+type.code+'-{SPACE}-{###}'))+'</span><span>'+escapeHtml(type.approval||'Process Owner → Quality Manager')+'</span><span>'+escapeHtml((type.review||'12 months').replace(' months',' mo'))+'</span><span>'+String(type.count||0)+'</span><span class="tag success">Active</span>';
  row.addEventListener('click',()=>selectTypeConfiguration(row,type.id));
  pane.appendChild(row);
}
loadCustomDocumentTypes().forEach(renderCustomDocumentTypeRow);

/* Canonical QMS resource registration */
let registrationStep=1;
let registrationClass='controlled';
let registrationSourceMode='upload';
let authoringMode='blank';
let selectedAuthoringTemplate='Procedure Template';
let selectedExistingResource={id:'SOP-QA-014',title:'Control of Nonconforming Outputs'};
let lastNonEffectiveStatus='Draft';

let quickTypeContext='registration';
let lastValidRegType='Procedure';
let lastValidRegSpace='Recruitment';

function sanitizeConfigCode(value,max=10){
  return String(value||'').toUpperCase().replace(/[^A-Z0-9-]/g,'').slice(0,max);
}

function refreshRegistrationOptions(){
  const spaceSelect=document.getElementById('regSpace');
  const typeSelect=document.getElementById('regType');

  if(spaceSelect){
    const current=spaceSelect.value;
    spaceSelect.querySelectorAll('option[data-custom="1"]').forEach(o=>o.remove());
    const create=spaceSelect.querySelector('option[value="__create__"]');
    loadCustomSpaces().forEach(space=>{
      const option=document.createElement('option');
      option.value=space.name;
      option.dataset.code=space.code;
      option.dataset.custom='1';
      option.textContent=space.name;
      spaceSelect.insertBefore(option,create);
    });
    if([...spaceSelect.options].some(o=>o.value===current)) spaceSelect.value=current;
  }

  if(typeSelect){
    const current=typeSelect.value;
    typeSelect.querySelectorAll('option[data-custom="1"]').forEach(o=>o.remove());
    const create=typeSelect.querySelector('option[value="__create__"]');
    loadCustomDocumentTypes().forEach(type=>{
      const option=document.createElement('option');
      option.value=type.name;
      option.dataset.code=type.code;
      option.dataset.custom='1';
      option.textContent=type.name;
      typeSelect.insertBefore(option,create);
    });
    if([...typeSelect.options].some(o=>o.value===current)) typeSelect.value=current;
  }
}

function updateQuickTypePattern(){
  const code=sanitizeConfigCode(document.getElementById('quickTypeCode')?.value||'TYPE',8)||'TYPE';
  const target=document.getElementById('quickTypePattern');
  if(target) target.textContent='QMS-'+code+'-{SPACE}-{###}';
}
function updateQuickSpacePattern(){
  const code=sanitizeConfigCode(document.getElementById('quickSpaceCode')?.value||'SPACE',10)||'SPACE';
  const typeCode=getSelectCode('regType')==='GEN'?'PRO':getSelectCode('regType');
  const target=document.getElementById('quickSpacePattern');
  if(target) target.textContent='QMS-'+typeCode+'-'+code+'-001';
}

function openQuickTypeModal(context='registration'){
  quickTypeContext=context;
  const name=document.getElementById('quickTypeName');
  const code=document.getElementById('quickTypeCode');
  if(name) name.value='';
  if(code) code.value='';
  updateQuickTypePattern();
  document.getElementById('quickTypeModal')?.classList.add('show');
  setTimeout(()=>name?.focus(),60);
  refreshIcons();
}
function closeQuickTypeModal(){document.getElementById('quickTypeModal')?.classList.remove('show')}

function saveQuickDocumentType(){
  const name=document.getElementById('quickTypeName')?.value.trim();
  const code=sanitizeConfigCode(document.getElementById('quickTypeCode')?.value,8);
  if(!name){toast('Type name required','Enter a name for the new document type.');document.getElementById('quickTypeName')?.focus();return}
  if(code.length<2){toast('Type code required','Use a short unique code such as INS or SPEC.');document.getElementById('quickTypeCode')?.focus();return}

  const reserved=[...document.querySelectorAll('#regType option[data-code]')].map(o=>o.dataset.code);
  if(reserved.includes(code)||loadCustomDocumentTypes().some(t=>t.code===code)){
    toast('Type code already in use',code+' is already assigned to another document type.');
    document.getElementById('quickTypeCode')?.focus();
    return;
  }

  const review=document.getElementById('quickTypeReview')?.value||'12 months';
  const approval=document.getElementById('quickTypeApproval')?.value||'Process Owner → Quality Manager';
  const type={id:'ctype-'+Date.now(),name,code,review,approval,numbering:'QMS-'+code+'-{SPACE}-{###}',count:0};
  const saved=loadCustomDocumentTypes();
  saved.push(type);
  saveCustomDocumentTypes(saved);
  renderCustomDocumentTypeRow(type);
  refreshRegistrationOptions();
  closeQuickTypeModal();

  if(quickTypeContext==='registration'){
    const select=document.getElementById('regType');
    if(select){
      select.value=name;
      lastValidRegType=name;
      generateControlledDocumentId();
    }
    toast('Document type created',name+' is selected for this registration.');
  }else{
    const row=document.querySelector('.typeRow[data-type="'+type.id+'"]');
    selectTypeConfiguration(row,type.id);
    toast('Document type created',name+' is now available in document registration.');
  }
}

function openQuickSpaceModal(){
  const name=document.getElementById('quickSpaceName');
  const code=document.getElementById('quickSpaceCode');
  const purpose=document.getElementById('quickSpacePurpose');
  if(name) name.value='';
  if(code) code.value='';
  if(purpose) purpose.value='';
  updateQuickSpacePattern();
  document.getElementById('quickSpaceModal')?.classList.add('show');
  setTimeout(()=>name?.focus(),60);
  refreshIcons();
}
function closeQuickSpaceModal(){document.getElementById('quickSpaceModal')?.classList.remove('show')}

function saveQuickSpace(){
  const name=document.getElementById('quickSpaceName')?.value.trim();
  const code=sanitizeConfigCode(document.getElementById('quickSpaceCode')?.value,10);
  if(!name){toast('Space name required','Enter a name for the new QMS space.');document.getElementById('quickSpaceName')?.focus();return}
  if(code.length<2){toast('Space code required','Use a short code such as MNT or LAB.');document.getElementById('quickSpaceCode')?.focus();return}

  const existingCodes=[...document.querySelectorAll('#regSpace option[data-code]')].map(o=>o.dataset.code);
  if(existingCodes.includes(code)||loadCustomSpaces().some(s=>s.code===code)){
    toast('Space code already in use',code+' is already assigned to another space.');
    document.getElementById('quickSpaceCode')?.focus();
    return;
  }

  const type=document.getElementById('quickSpaceType')?.value||'Department / Function';
  const purpose=document.getElementById('quickSpacePurpose')?.value.trim()||'Custom QMS working space.';
  const space={id:'custom-'+Date.now(),name,code,type,purpose,owner:'Quality Department',view:'Controlled documents',count:0,path:name,docs:[]};
  const saved=loadCustomSpaces();
  saved.push(space);
  saveCustomSpaces(saved);
  renderCustomSpaceCard(space);
  refreshRegistrationOptions();
  refreshExistingTargetSpaces();
  closeQuickSpaceModal();

  const select=document.getElementById('regSpace');
  if(select){
    select.value=name;
    lastValidRegSpace=name;
    updateRegistrationSpaceLabel();
    generateControlledDocumentId();
  }
  toast('Process space created',name+' is selected as the Primary Space.');
}

function updateRegistrationSpaceLabel(){
  const select=document.getElementById('regSpace');
  const label=document.getElementById('regSpaceMappingLabel');
  if(label&&select) label.textContent=select.options[select.selectedIndex]?.textContent||select.value;
}

function getSelectCode(selectId){
  const select=document.getElementById(selectId);
  const option=select?.selectedOptions?.[0];
  return option?.dataset?.code||'GEN';
}

function nextControlledSequence(typeCode,spaceCode){
  const prefix='QMS-'+typeCode+'-'+spaceCode+'-';
  let max=0;
  document.querySelectorAll('.controlledLibraryRow div b').forEach(el=>{
    const id=(el.textContent||'').trim();
    if(id.startsWith(prefix)){
      const n=parseInt(id.slice(prefix.length),10);
      if(Number.isFinite(n)) max=Math.max(max,n);
    }
  });
  try{
    const saved=JSON.parse(localStorage.getItem('nexus.registeredControlledIds')||'[]');
    saved.forEach(id=>{
      if(String(id).startsWith(prefix)){
        const n=parseInt(String(id).slice(prefix.length),10);
        if(Number.isFinite(n)) max=Math.max(max,n);
      }
    });
  }catch(e){}
  return String(max+1).padStart(3,'0');
}

function generateControlledDocumentId(){
  const id=document.getElementById('regId');
  if(!id) return '';
  const typeCode=getSelectCode('regType');
  const spaceCode=getSelectCode('regSpace');
  const seq=nextControlledSequence(typeCode,spaceCode);
  const generated='QMS-'+typeCode+'-'+spaceCode+'-'+seq;
  id.value=generated;
  const help=document.getElementById('regIdHelp');
  if(help) help.textContent='Generated from '+typeCode+' document type + '+spaceCode+' space code + system sequence '+seq+'.';
  updateRegistrationReview();
  return generated;
}

function syncRegistrationSpaceFromContext(){
  const select=document.getElementById('regSpace');
  if(!select||!activeSpace?.name) return;
  const match=[...select.options].find(option=>option.value===activeSpace.name);
  if(match) select.value=match.value;
}

function refreshExistingTargetSpaces(){
  const select=document.getElementById('existingTargetSpace');
  if(!select) return;
  const current=select.value;
  select.querySelectorAll('option[data-custom="1"]').forEach(o=>o.remove());
  loadCustomSpaces().forEach(space=>{
    const option=document.createElement('option');
    option.value=space.name;
    option.dataset.code=space.code;
    option.dataset.custom='1';
    option.textContent=space.name;
    select.appendChild(option);
  });
  if([...select.options].some(o=>o.value===current)) select.value=current;
  if(activeSpace?.name && [...select.options].some(o=>o.value===activeSpace.name)) select.value=activeSpace.name;
}

function setRegistrationTypeLocked(locked){
  const type=document.getElementById('regType');
  if(!type) return;
  type.disabled=!!locked;
  type.closest('label')?.classList.toggle('disabledField',!!locked);
}

function setEffectiveImportMode(enabled){
  const status=document.getElementById('regStatus');
  const statusHelp=document.getElementById('regStatusHelp');
  document.querySelectorAll('.effectiveImportOnly').forEach(el=>el.style.display=enabled?'block':'none');

  if(status){
    if(enabled){
      if(status.value!=='Effective') lastNonEffectiveStatus=status.value||'Draft';
      status.value='Effective';
      status.disabled=true;
      status.closest('label')?.classList.add('disabledField');
      if(statusHelp) statusHelp.textContent='Imported as the already-approved/current revision. No new approval route is created.';
    }else{
      status.disabled=false;
      status.closest('label')?.classList.remove('disabledField');
      if(status.value==='Effective') status.value=lastNonEffectiveStatus||'Draft';
      if(statusHelp) statusHelp.textContent='New controlled information begins as Draft unless changed before submission.';
    }
  }
}

function configureSourceIntentForClass(){
  const controlled=registrationClass==='controlled';
  const heading=document.getElementById('sourceIntentHeading');
  const help=document.getElementById('sourceIntentHelp');
  const uploadTitle=document.getElementById('sourceUploadTitle');
  const uploadText=document.getElementById('sourceUploadText');
  const createTitle=document.getElementById('sourceCreateTitle');
  const createText=document.getElementById('sourceCreateText');
  const existingTitle=document.getElementById('sourceExistingTitle');
  const existingText=document.getElementById('sourceExistingText');
  const externalCard=document.querySelector('.externalIntent');
  const effectiveCard=document.querySelector('[data-source-mode="effective"]');
  const authoring=document.querySelector('.controlledAuthoringOptions');
  const recordNoFile=document.querySelector('.recordNoFileOptions');
  const uploadPanelTitle=document.getElementById('uploadPanelTitle');
  const hint=document.getElementById('registerDropHint');

  if(controlled){
    if(heading) heading.textContent='How are you adding this controlled information?';
    if(help) help.textContent='Choose one action. iQMS only shows the fields needed for that action.';
    if(uploadTitle) uploadTitle.textContent='Upload a new document';
    if(uploadText) uploadText.textContent='I already have the file and want to register it in iQMS.';
    if(createTitle) createTitle.textContent='Create a new document';
    if(createText) createText.textContent='I do not have the file yet. Start blank or from an authoring template.';
    if(existingTitle) existingTitle.textContent='Add an existing iQMS document';
    if(existingText) existingText.textContent='The resource already exists. Add it to a space without creating a duplicate.';
    if(externalCard) externalCard.style.display='grid';
    if(effectiveCard) effectiveCard.style.display='grid';
    if(authoring) authoring.style.display='block';
    if(recordNoFile) recordNoFile.style.display='none';
    if(uploadPanelTitle) uploadPanelTitle.textContent='Drop the document file here';
    if(hint) hint.textContent='PDF, DOCX, XLSX or image · Example: Recruitment_Procedure_Rev3.docx';
  }else{
    if(heading) heading.textContent='How are you adding this record or evidence?';
    if(help) help.textContent='Choose one action. Records focus on retention and traceability, not document revision control.';
    if(uploadTitle) uploadTitle.textContent='Upload record / evidence';
    if(uploadText) uploadText.textContent='I have a completed form, certificate, image, report or evidence file.';
    if(createTitle) createTitle.textContent='Register without a file';
    if(createText) createText.textContent='Create a record entry for evidence that is mainly metadata or comes from another system.';
    if(existingTitle) existingTitle.textContent='Add existing evidence to this context';
    if(existingText) existingText.textContent='The record already exists in iQMS. Link it without creating a duplicate.';
    if(externalCard) externalCard.style.display='none';
    if(effectiveCard) effectiveCard.style.display='none';
    if(authoring) authoring.style.display='none';
    if(recordNoFile) recordNoFile.style.display='block';
    if(uploadPanelTitle) uploadPanelTitle.textContent='Drop the evidence file here';
    if(hint) hint.textContent='PDF, XLSX, image or certificate · Example: Candidate_Screening_Record_0918.pdf';
    if(registrationSourceMode==='external'||registrationSourceMode==='effective') registrationSourceMode='upload';
  }
}

function selectRegistrationSource(mode){
  if(registrationClass==='record' && (mode==='external'||mode==='effective')) mode='upload';
  registrationSourceMode=mode;
  setEffectiveImportMode(registrationClass==='controlled' && mode==='effective');
  document.querySelectorAll('.sourceIntentCard').forEach(card=>card.classList.toggle('selected',card.dataset.sourceMode===mode));
  document.querySelectorAll('.sourceIntentPanel').forEach(panel=>panel.classList.remove('active'));
  const panel=document.getElementById('sourcePanel'+mode.charAt(0).toUpperCase()+mode.slice(1));
  panel?.classList.add('active');

  if(registrationClass==='controlled'){
    if(mode==='external'){
      const type=document.getElementById('regType');
      if(type){
        if(type.value!=='__create__') lastValidRegType=type.value;
        type.value='External Document';
      }
      setRegistrationTypeLocked(true);
      generateControlledDocumentId();
    }else{
      setRegistrationTypeLocked(false);
      const type=document.getElementById('regType');
      if(type && type.value==='External Document' && lastValidRegType && lastValidRegType!=='External Document'){
        type.value=lastValidRegType;
      }
      generateControlledDocumentId();
    }
  }

  updateRegistrationReview();
  refreshIcons();
}

function selectAuthoringMode(mode){
  authoringMode=mode==='template'?'template':'blank';
  document.querySelectorAll('.authoringOption').forEach(btn=>btn.classList.toggle('selected',btn.dataset.authoringMode===authoringMode));
  const picker=document.getElementById('authoringTemplatePicker');
  if(picker) picker.style.display=authoringMode==='template'?'block':'none';
  refreshIcons();
}

function selectExistingResource(item){
  document.querySelectorAll('.existingResourceItem').forEach(x=>{
    const selected=x===item;
    x.classList.toggle('selected',selected);
    const icon=x.lastElementChild;
    if(icon) icon.setAttribute('data-lucide',selected?'check-circle-2':'circle');
  });
  selectedExistingResource={id:item.dataset.existingId||'',title:item.dataset.existingTitle||''};
  updateRegistrationReview();
  refreshIcons();
}

function openRegisterResource(kind='controlled'){
  registrationClass=kind==='record'?'record':'controlled';
  registrationStep=1;
  refreshRegistrationOptions();
  refreshExistingTargetSpaces();
  registrationSourceMode='upload';
  setEffectiveImportMode(false);
  authoringMode='blank';
  selectedAuthoringTemplate='Procedure Template';
  selectRegistrationClass(registrationClass,false);
  configureSourceIntentForClass();
  selectRegistrationSource('upload');
  if(registrationClass==='controlled'){
    syncRegistrationSpaceFromContext();
    const typeSelect=document.getElementById('regType');
    const spaceSelect=document.getElementById('regSpace');
    if(typeSelect&&typeSelect.value!=='__create__') lastValidRegType=typeSelect.value;
    if(spaceSelect&&spaceSelect.value!=='__create__') lastValidRegSpace=spaceSelect.value;
    updateRegistrationSpaceLabel();
    generateControlledDocumentId();
  }
  renderRegistration();
  if(registrationClass==='controlled'){
    const preset=document.getElementById('approvalRoutePreset');
    if(preset){preset.value='type-default';applyApprovalRoutePreset('type-default');}
  }
  document.getElementById('registerResourceModal')?.classList.add('show');
  refreshIcons();
}
function closeRegisterResource(){document.getElementById('registerResourceModal')?.classList.remove('show')}

function selectRegistrationClass(kind,rerender=true){
  registrationClass=kind==='record'?'record':'controlled';
  document.querySelectorAll('.registrationClass').forEach(card=>card.classList.toggle('selected',card.dataset.class===registrationClass));
  const controlled=registrationClass==='controlled';
  document.querySelectorAll('.registrationControlledFields').forEach(x=>x.style.display=controlled?'grid':'none');
  document.querySelectorAll('.registrationRecordFields').forEach(x=>x.style.display=controlled?'none':'grid');
  const title=document.getElementById('registerResourceTitle');
  const subtitle=document.getElementById('registerResourceSubtitle');
  const identity=document.getElementById('identityHeading');
  const hint=document.getElementById('registerDropHint');
  if(title) title.textContent=controlled?'Register controlled information':'Register record / evidence';
  if(subtitle) subtitle.textContent=controlled?'Create one canonical controlled resource and connect it to the QMS context where it applies.':'Register retained proof and connect it to the process, controlled information and verification context it evidences.';
  if(identity) identity.textContent=controlled?'Document identity & control metadata':'Record identity & retention metadata';
  if(hint) hint.textContent=controlled?'Example: Recruitment_Procedure_Rev3.docx':'Example: Candidate_Screening_Record_0918.pdf';
  configureSourceIntentForClass();
  selectRegistrationSource(registrationSourceMode);
  if(rerender) renderRegistration();
}

function registrationPages(){
  return [...document.querySelectorAll('#registerResourceModal .registrationPage')];
}
function renderRegistration(){
  const controlled=registrationClass==='controlled';
  const pages=registrationPages();
  // Record/evidence skips Governance page (page 6).
  const effectiveStep=registrationStep;
  pages.forEach((el,i)=>{
    const page=i+1;
    let show=page===effectiveStep;
    if(!controlled && effectiveStep===6){show=false}
    el.style.display=show?'block':'none';
  });
  document.querySelectorAll('#registerResourceModal .rs').forEach((el,i)=>{
    const step=i+1;
    el.classList.toggle('active',step===effectiveStep);
    el.classList.toggle('done',step<effectiveStep);
    if(el.classList.contains('controlledOnly')) el.style.display=(controlled && registrationSourceMode!=='effective')?'block':'none';
  });
  const prev=document.getElementById('registerPrev');
  const next=document.getElementById('registerNext');
  if(prev) prev.style.display=effectiveStep===1?'none':'inline-flex';
  if(next) next.style.display=effectiveStep===7?'none':'inline-flex';
  updateRegistrationReview();
  refreshIcons();
}
function validateApprovalRoute(){
  const stages=[...document.querySelectorAll('#approvalStages .approvalStage')];
  const approvalStages=stages.filter(stage=>stage.dataset.stageKind==='approve');
  if(!approvalStages.length){
    toast('Approval stage required','Add at least one approval stage before continuing.');
    return false;
  }
  for(const stage of stages){
    const count=stage.querySelectorAll('.participantChip').length;
    if(count<1){
      const label=stage.dataset.stageKind==='approve'?'approver':'reviewer';
      toast('Incomplete approval route','Each '+stage.dataset.stageKind+' stage needs at least one '+label+'.');
      return false;
    }
  }
  return true;
}

function moveRegistration(delta){
  if(delta>0 && registrationClass==='controlled' && registrationStep===6 && !['existing','effective'].includes(registrationSourceMode) && !validateApprovalRoute()) return;

  let next=registrationStep+delta;

  // Existing iQMS resources are not re-registered. Step 2 goes directly to Review.
  if(registrationSourceMode==='existing'){
    if(delta>0 && registrationStep===2) next=7;
    if(delta<0 && registrationStep===7) next=2;
  }

  if(registrationClass==='record' || registrationSourceMode==='effective'){
    if(delta>0 && next===6) next=7;
    if(delta<0 && next===6) next=5;
  }

  registrationStep=Math.max(1,Math.min(7,next));
  renderRegistration();
}
function updateRegistrationReview(){
  const controlled=registrationClass==='controlled';
  updateRegistrationSpaceLabel();
  const reviewLibrary=document.getElementById('reviewLibrary');
  const reviewIdentity=document.getElementById('reviewIdentity');
  const reviewProcess=document.getElementById('reviewProcess');
  const reviewIso=document.getElementById('reviewIso');
  const reviewState=document.getElementById('reviewNextState');
  const reviewApprovalRoute=document.getElementById('reviewApprovalRoute');
  const reviewDetail=document.getElementById('reviewNextStateDetail');
  const confirmTitle=document.getElementById('registerConfirmTitle');
  const confirmText=document.getElementById('registerConfirmText');
  const confirmButton=document.getElementById('registerConfirmButton');
  const mapping=document.getElementById('mappingPreviewResource');

  if(registrationSourceMode==='existing'){
    const target=document.getElementById('existingTargetSpace')?.value||activeSpace?.name||'Selected space';
    const relation=document.getElementById('existingRelationship')?.value||'Used by this space';
    if(reviewLibrary) reviewLibrary.textContent=controlled?'Controlled Information':'Records & Evidence';
    if(reviewIdentity) reviewIdentity.textContent=(selectedExistingResource.id||'Existing resource')+' · '+(selectedExistingResource.title||'Selected resource');
    if(reviewProcess) reviewProcess.textContent=target;
    if(reviewIso) reviewIso.textContent=relation;
    if(reviewState) reviewState.textContent='Relationship will be created';
    if(reviewDetail) reviewDetail.textContent='No new resource, Document ID, revision or approval route will be created.';
    if(confirmTitle) confirmTitle.textContent='Add existing resource to '+target+'?';
    if(confirmText) confirmText.textContent='iQMS will point this space to the existing canonical resource. The source resource remains unchanged.';
    if(confirmButton) confirmButton.textContent='Add to space';
    if(mapping) mapping.textContent=selectedExistingResource.title||'Existing resource';
    return;
  }

  if(confirmButton) confirmButton.textContent=controlled?'Register resource':'Register record / evidence';
  if(controlled){
    const id=document.getElementById('regId')?.value||'QMS-PRO-REC-001';
    const title=document.getElementById('regTitle')?.value||'Recruitment Procedure';
    if(reviewLibrary) reviewLibrary.textContent='Controlled Information';
    if(reviewIdentity) reviewIdentity.textContent=id+' · '+title;
    if(reviewProcess) reviewProcess.textContent=document.getElementById('regProcess')?.value||document.getElementById('regSpace')?.value||'—';
    if(reviewIso) reviewIso.textContent=document.getElementById('regIso')?.value||'—';

    if(registrationSourceMode==='effective'){
      if(reviewApprovalRoute) reviewApprovalRoute.textContent='No new approval route · legacy/current effective import';
      if(reviewState) reviewState.textContent='Registered as Effective';
      if(reviewDetail) reviewDetail.textContent='The current approved revision is onboarded directly. iQMS records the registration and source control details in the audit trail without creating approval tasks.';
      if(confirmTitle) confirmTitle.textContent='Register this current effective document?';
      if(confirmText) confirmText.textContent='iQMS will register the current revision as Effective and preserve its original effective date, review date and source references.';
      if(confirmButton) confirmButton.textContent='Register effective document';
    }else{
      if(reviewApprovalRoute) reviewApprovalRoute.textContent=approvalRouteSnapshotText()||'Configured for this revision';
      if(reviewState) reviewState.textContent=registrationSourceMode==='create'?(authoringMode==='template'?'Draft created from '+selectedAuthoringTemplate:'Blank controlled draft created'):(registrationSourceMode==='external'?'External document draft created':'Draft revision created');
      if(reviewDetail) reviewDetail.textContent=registrationSourceMode==='external'?'iQMS will track the external source version, review date and internal relationships.':'Approval route is snapshotted. The document is not Effective until final approval.';
      if(confirmTitle) confirmTitle.textContent='Create controlled draft?';
      if(confirmText) confirmText.textContent='The canonical resource, relationships and approval workflow will be created together.';
      if(confirmButton) confirmButton.textContent='Register resource';
    }
    if(mapping) mapping.textContent=title;
  }else{
    const id=document.getElementById('recId')?.value||'REC-SCR-2026-0918';
    const title=document.getElementById('recTitle')?.value||'Candidate Screening Record';
    if(reviewLibrary) reviewLibrary.textContent='Records & Evidence';
    if(reviewIdentity) reviewIdentity.textContent=id+' · '+title;
    if(reviewProcess) reviewProcess.textContent=document.getElementById('regProcess')?.value||'—';
    if(reviewIso) reviewIso.textContent='Retention + traceability';
    if(reviewApprovalRoute) reviewApprovalRoute.textContent='Not applicable';
    if(reviewState) reviewState.textContent='Retained record registered';
    if(reviewDetail) reviewDetail.textContent='Retention, access and traceability are applied. No approval lifecycle is forced unless configured for this record type.';
    if(confirmTitle) confirmTitle.textContent='Register record / evidence?';
    if(confirmText) confirmText.textContent='The canonical record and its QMS traceability links will be created together.';
    if(mapping) mapping.textContent=title;
  }
}


document.querySelectorAll('.templateCard').forEach(card=>card.addEventListener('click',()=>{
  document.querySelectorAll('.templateCard').forEach(x=>x.classList.remove('selected'));
  card.classList.add('selected');
  selectedAuthoringTemplate=card.dataset.template||'Authoring Template';
  refreshIcons();
}));
document.querySelectorAll('.existingResourceItem').forEach(item=>item.addEventListener('click',()=>selectExistingResource(item)));
document.getElementById('existingResourceSearch')?.addEventListener('input',e=>{
  const q=e.target.value.trim().toLowerCase();
  document.querySelectorAll('.existingResourceItem').forEach(item=>item.style.display=!q||item.textContent.toLowerCase().includes(q)?'grid':'none');
});
document.getElementById('existingTargetSpace')?.addEventListener('change',updateRegistrationReview);
document.getElementById('existingRelationship')?.addEventListener('change',updateRegistrationReview);

document.querySelectorAll('.relationshipPick').forEach(btn=>btn.addEventListener('click',()=>{
  btn.classList.toggle('selected');
  const icon=btn.lastElementChild;
  if(icon && icon.dataset) icon.setAttribute('data-lucide',btn.classList.contains('selected')?'check':'plus');
  refreshIcons();
}));
['regTitle','recTitle','recId'].forEach(id=>document.getElementById(id)?.addEventListener('input',updateRegistrationReview));

document.getElementById('regStatus')?.addEventListener('change',e=>{
  if(e.target.value!=='Effective') lastNonEffectiveStatus=e.target.value;
});

document.getElementById('regType')?.addEventListener('change',e=>{
  if(e.target.value==='__create__'){
    e.target.value=lastValidRegType;
    openQuickTypeModal('registration');
    return;
  }
  lastValidRegType=e.target.value;
  generateControlledDocumentId();
});

document.getElementById('regSpace')?.addEventListener('change',e=>{
  if(e.target.value==='__create__'){
    e.target.value=lastValidRegSpace;
    openQuickSpaceModal();
    return;
  }
  lastValidRegSpace=e.target.value;
  updateRegistrationSpaceLabel();
  generateControlledDocumentId();
});

document.getElementById('quickTypeCode')?.addEventListener('input',e=>{
  e.target.value=sanitizeConfigCode(e.target.value,8);
  updateQuickTypePattern();
});
document.getElementById('quickSpaceCode')?.addEventListener('input',e=>{
  e.target.value=sanitizeConfigCode(e.target.value,10);
  updateQuickSpacePattern();
});


const approvalPeople={
  reviewers:[
    ['Ana Reyes','QA Supervisor'],
    ['Oscar Flores','Operations Manager'],
    ['John Cruz','Purchasing Manager'],
    ['Lea Garcia','Process Owner'],
    ['Maria Santos','Quality Manager'],
    ['Document Control','Document Controller']
  ],
  approvers:[
    ['Maria Santos','Quality Manager'],
    ['Lea Garcia','Process Owner'],
    ['Oscar Flores','Operations Manager'],
    ['John Cruz','Purchasing Manager'],
    ['Document Control','Document Controller']
  ]
};

function participantInitials(name){
  return String(name||'').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'U';
}

function participantChipHtml(name,title){
  return '<span class="participantChip"><span class="participantAvatar">'+escapeHtml(participantInitials(name))+'</span><span><b>'+escapeHtml(name)+'</b><small>'+escapeHtml(title)+'</small></span><button type="button" onclick="removeRouteParticipant(this)" aria-label="Remove participant"><i data-lucide="x"></i></button></span>';
}

function participantOptionsHtml(role){
  const list=role==='approver'?approvalPeople.approvers:approvalPeople.reviewers;
  return '<option value="">Select '+(role==='approver'?'approver':'reviewer')+'...</option>'+list.map(([n,t])=>'<option>'+escapeHtml(n)+'|'+escapeHtml(t)+'</option>').join('');
}

function approvalStageHtml(kind,participants=[]){
  const review=kind==='review';
  const role=review?'reviewer':'approver';
  const label=review?'Review':'Approval';
  const description=review?'Reviewers check content and return comments before approval.':'Approvers authorize this revision before it can be released.';
  const ruleAll=review?'All reviewers must complete':'All approvers must approve';
  const ruleAny=review?'Any one reviewer can complete':'Any one approver can approve';
  return '<section class="approvalStage" data-stage-kind="'+kind+'">'
    +'<div class="stageHeader"><div class="stageOrder">1</div><div class="stageTitle"><span class="stageKind '+kind+'">'+label+'</span><div><b>'+label+' stage</b><small>'+description+'</small></div></div>'
    +'<div class="stageActions"><button class="iconButton" type="button" onclick="moveApprovalStage(this,-1)" title="Move up"><i data-lucide="arrow-up"></i></button><button class="iconButton" type="button" onclick="moveApprovalStage(this,1)" title="Move down"><i data-lucide="arrow-down"></i></button><button class="iconButton dangerIcon" type="button" onclick="removeApprovalStage(this)" title="Remove stage"><i data-lucide="trash-2"></i></button></div></div>'
    +'<div class="stageBody"><label>Completion rule<select class="stageRule"><option value="all">'+ruleAll+'</option><option value="any">'+ruleAny+'</option></select></label>'
    +'<div class="participantBlock"><div class="participantHeader"><span>'+(review?'Reviewers':'Approvers')+'</span><small>1 or more people</small></div>'
    +'<div class="participantChips" data-role="'+role+'">'+participants.map(p=>participantChipHtml(p[0],p[1])).join('')+'</div>'
    +'<div class="participantAddRow"><select class="participantPicker '+role+'Picker">'+participantOptionsHtml(role)+'</select><button class="btn secondary" type="button" onclick="addRouteParticipant(this,\''+role+'\')"><i data-lucide="user-plus"></i>Add '+role+'</button></div></div></div></section>';
}

function renumberApprovalStages(){
  document.querySelectorAll('#approvalStages .approvalStage').forEach((stage,i)=>{
    const order=stage.querySelector('.stageOrder');
    if(order) order.textContent=String(i+1);
  });
  updateApprovalRouteSummary();
  refreshIcons();
}

function updateApprovalRouteSummary(){
  const stages=[...document.querySelectorAll('#approvalStages .approvalStage')];
  const reviewers=document.querySelectorAll('#approvalStages .participantChips[data-role="reviewer"] .participantChip').length;
  const approvers=document.querySelectorAll('#approvalStages .participantChips[data-role="approver"] .participantChip').length;
  const summary=document.querySelector('#routeSummary span');
  if(summary) summary.textContent=stages.length+' stage'+(stages.length===1?'':'s')+' · '+reviewers+' reviewer'+(reviewers===1?'':'s')+' · '+approvers+' approver'+(approvers===1?'':'s');
}

function addRouteParticipant(button,role){
  const row=button.closest('.participantAddRow');
  const select=row?.querySelector('.participantPicker');
  const chips=row?.previousElementSibling;
  const value=select?.value||'';
  if(!value||!chips) return;
  const [name,title='']=value.split('|');
  const exists=[...chips.querySelectorAll('.participantChip b')].some(el=>el.textContent.trim()===name.trim());
  if(exists){
    toast('Already added',name+' is already included in this stage.');
    return;
  }
  chips.insertAdjacentHTML('beforeend',participantChipHtml(name,title));
  select.value='';
  document.getElementById('approvalRoutePreset').value='custom';
  updateApprovalRouteSummary();
  refreshIcons();
}

function removeRouteParticipant(button){
  const chip=button.closest('.participantChip');
  const stage=button.closest('.approvalStage');
  chip?.remove();
  document.getElementById('approvalRoutePreset').value='custom';
  updateApprovalRouteSummary();
  const remaining=stage?.querySelectorAll('.participantChip').length||0;
  if(remaining===0) toast('Stage needs a participant','Add at least one '+(stage?.dataset.stageKind==='approve'?'approver':'reviewer')+' before submitting the revision.');
}

function addApprovalStage(kind){
  const host=document.getElementById('approvalStages');
  if(!host) return;
  host.insertAdjacentHTML('beforeend',approvalStageHtml(kind,[]));
  document.getElementById('approvalRoutePreset').value='custom';
  renumberApprovalStages();
}

function removeApprovalStage(button){
  const host=document.getElementById('approvalStages');
  const stage=button.closest('.approvalStage');
  if(!host||!stage) return;
  const kind=stage.dataset.stageKind;
  const sameKind=host.querySelectorAll('.approvalStage[data-stage-kind="'+kind+'"]').length;
  if(kind==='approve' && sameKind<=1){
    toast('Approval stage required','A controlled document must keep at least one approval stage.');
    return;
  }
  stage.remove();
  document.getElementById('approvalRoutePreset').value='custom';
  renumberApprovalStages();
}

function moveApprovalStage(button,direction){
  const stage=button.closest('.approvalStage');
  if(!stage) return;
  if(direction<0 && stage.previousElementSibling) stage.parentElement.insertBefore(stage,stage.previousElementSibling);
  if(direction>0 && stage.nextElementSibling) stage.parentElement.insertBefore(stage.nextElementSibling,stage);
  document.getElementById('approvalRoutePreset').value='custom';
  renumberApprovalStages();
}

function applyApprovalRoutePreset(value){
  if(value==='custom') return;
  const host=document.getElementById('approvalStages');
  if(!host) return;
  let stages=[];
  if(value==='quality-controlled'){
    stages=[
      {kind:'review',people:[['Ana Reyes','QA Supervisor'],['Oscar Flores','Operations Manager']]},
      {kind:'approve',people:[['Maria Santos','Quality Manager'],['Lea Garcia','Process Owner']]}
    ];
  }else if(value==='department-quality'){
    stages=[
      {kind:'review',people:[['Oscar Flores','Operations Manager'],['John Cruz','Purchasing Manager']]},
      {kind:'approve',people:[['Maria Santos','Quality Manager']]}
    ];
  }else{
    stages=[
      {kind:'review',people:[['Lea Garcia','Process Owner']]},
      {kind:'approve',people:[['Maria Santos','Quality Manager']]}
    ];
  }
  host.innerHTML=stages.map(s=>approvalStageHtml(s.kind,s.people)).join('');
  renumberApprovalStages();
}

function approvalRouteSnapshotText(){
  const stages=[...document.querySelectorAll('#approvalStages .approvalStage')];
  return stages.map((stage,i)=>{
    const kind=stage.dataset.stageKind==='approve'?'Approval':'Review';
    const rule=stage.querySelector('.stageRule')?.value==='any'?'any one':'all';
    const people=[...stage.querySelectorAll('.participantChip b')].map(x=>x.textContent.trim());
    return (i+1)+'. '+kind+' ('+rule+'): '+people.join(', ');
  }).join(' | ');
}

document.getElementById('approvalStages')?.addEventListener('change',e=>{
  if(e.target.classList.contains('stageRule')){
    const preset=document.getElementById('approvalRoutePreset');
    if(preset) preset.value='custom';
    updateApprovalRouteSummary();
  }
});

function finishResourceRegistration(){
  const controlled=registrationClass==='controlled';

  if(registrationSourceMode==='existing'){
    const target=document.getElementById('existingTargetSpace')?.value||activeSpace?.name||'selected space';
    const relation=document.getElementById('existingRelationship')?.value||'Used by this space';
    closeRegisterResource();
    toast('Existing resource added',(selectedExistingResource.id||'The resource')+' was linked to '+target+' as "'+relation+'". No duplicate resource was created.');
    if(controlled) showView('repository'); else showView('records');
    return;
  }

  closeRegisterResource();
  if(controlled){
    const generatedId=document.getElementById('regId')?.value;
    if(generatedId){
      try{
        const saved=JSON.parse(localStorage.getItem('nexus.registeredControlledIds')||'[]');
        if(!saved.includes(generatedId)) saved.push(generatedId);
        localStorage.setItem('nexus.registeredControlledIds',JSON.stringify(saved));
      }catch(e){}
    }
    showView('repository');
    if(registrationSourceMode==='effective'){
      const legacy=document.getElementById('legacyDocId')?.value.trim();
      toast('Effective document registered',(generatedId||'The document')+' was registered as Effective'+(legacy?' · legacy ID '+legacy:'')+'. No approval tasks were created.');
    }else{
      toast('Controlled resource registered',(generatedId||'The document')+' was created as a Draft. Approval route snapshot: '+approvalRouteSnapshotText());
    }
    setTimeout(()=>document.getElementById('controlledMasterPanel')?.scrollIntoView({behavior:'smooth',block:'start'}),120);
  }else{
    showView('records');
    toast('Record / evidence registered','The retained record was added to the shared evidence library with process, controlled-information and audit traceability.');
  }
}

/* Manual document wizard */
let manualStep=1;
function openManualRepo(){
  manualStep=1;
  renderManual();
  document.getElementById('manualRepo')?.classList.add('show');
}
function closeManualRepo(){document.getElementById('manualRepo')?.classList.remove('show')}
function renderManual(){
  document.querySelectorAll('#manualRepo .manualPage').forEach((el,i)=>el.style.display=(i+1===manualStep?'block':'none'));
  document.querySelectorAll('#manualRepo .ms').forEach((el,i)=>{
    el.classList.toggle('active',i+1===manualStep);
    el.classList.toggle('done',i+1<manualStep);
  });
  const prev=document.getElementById('manualPrev');
  const next=document.getElementById('manualNext');
  if(prev) prev.style.display=manualStep===1?'none':'inline-flex';
  if(next) next.style.display=manualStep===7?'none':'inline-flex';
}
function manualMove(delta){
  manualStep=Math.max(1,Math.min(7,manualStep+delta));
  renderManual();
}
function finishManualRepo(){
  closeManualRepo();
  showView('repository');
  toast('Controlled draft created','SOP-PUR-012 Rev 05 was created as Draft. It is not Effective until the approval route is completed.');
}

/* AI repository builder */
let wizStep=1;
function openBuilder(){
  wizStep=1;
  renderWizard();
  document.getElementById('builder')?.classList.add('show');
}
function closeBuilder(){document.getElementById('builder')?.classList.remove('show')}
function renderWizard(){
  document.querySelectorAll('#builder .wiz').forEach((el,i)=>el.style.display=(i+1===wizStep?'block':'none'));
  document.querySelectorAll('#builder .wp').forEach((el,i)=>{
    el.classList.toggle('active',i+1===wizStep);
    el.classList.toggle('done',i+1<wizStep);
  });
  const prev=document.getElementById('prevBtn');
  const next=document.getElementById('nextBtn');
  if(prev) prev.style.display=wizStep===1?'none':'inline-flex';
  if(next) next.style.display=wizStep===5?'none':'inline-flex';
}
function wizardMove(delta){
  wizStep=Math.max(1,Math.min(5,wizStep+delta));
  renderWizard();
}
function addAIReply(){
  const area=document.getElementById('wiz3');
  if(!area||area.querySelector('.confirmationReply')) return;
  const composer=area.querySelector('.chatComposer');
  const reply=document.createElement('div');
  reply.className='bubble ai confirmationReply';
  reply.innerHTML='<b>QMS AI</b><br>Understood. I will treat the Quality Manager as the authority who confirms the current effective revision during onboarding. The proposal can now be prepared.';
  area.insertBefore(reply,composer);
  const input=composer?.querySelector('input');
  if(input) input.value='';
}
function buildRepo(){
  closeBuilder();
  showView('repository');
  toast('Draft repository created','Resources remain pending human validation before any controlled status is assigned.');
}

document.querySelectorAll('.choiceGrid').forEach(group=>{
  group.querySelectorAll('.sourceChoice').forEach(choice=>{
    choice.addEventListener('click',()=>{
      group.querySelectorAll('.sourceChoice').forEach(x=>x.classList.remove('selected'));
      choice.classList.add('selected');
    });
  });
});

document.querySelectorAll('.modal').forEach(modal=>{
  modal.addEventListener('click',e=>{
    if(e.target===modal){
      if(modal.id==='builder') closeBuilder();
      if(modal.id==='manualRepo') closeManualRepo();
      if(modal.id==='spaceModal') closeSpaceModal();
      if(modal.id==='registerResourceModal') closeRegisterResource();
      if(modal.id==='quickTypeModal') closeQuickTypeModal();
      if(modal.id==='quickSpaceModal') closeQuickSpaceModal();
    }
  });
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeBuilder();closeManualRepo();closeSpaceModal();closeRegisterResource();closeQuickTypeModal();closeQuickSpaceModal();closeComplianceFinding()}
});

document.addEventListener('DOMContentLoaded',refreshIcons);
refreshIcons();

refreshRegistrationOptions();

const initialExisting=document.querySelector('.existingResourceItem.selected');
if(initialExisting) selectExistingResource(initialExisting);
configureSourceIntentForClass();
selectRegistrationSource('upload');

updateApprovalRouteSummary();



/* iQMS build: 20260922-hierarchy1 */

renderTraceability('QMS-PRO-REC-001');

renderDmsSpace('quality');

selectAccessUser('maria',document.querySelector('.accessUserRow[data-user-id="maria"]'));

try{
  const p=JSON.parse(localStorage.getItem('iqms.profile')||'null');
  if(p){
    if(document.getElementById('profileFullName')) document.getElementById('profileFullName').value=p.name||'';
    if(document.getElementById('profileJobTitle')) document.getElementById('profileJobTitle').value=p.title||'';
    if(document.getElementById('profileDepartment')) document.getElementById('profileDepartment').value=p.department||'Quality';
    if(document.getElementById('profileEmail')) document.getElementById('profileEmail').value=p.email||'';
    if(document.getElementById('profilePhone')) document.getElementById('profilePhone').value=p.phone||'';
    if(document.getElementById('profileTimezone')) document.getElementById('profileTimezone').value=p.timezone||'Asia/Manila (UTC+8)';
    if(document.getElementById('profileLanguage')) document.getElementById('profileLanguage').value=p.language||'English';
    saveSettingsProfile();
  }
  const co=JSON.parse(localStorage.getItem('iqms.company')||'null');
  if(co){
    if(document.getElementById('companyDisplayName')) document.getElementById('companyDisplayName').value=co.name||'';
    if(document.getElementById('companyLegalName')) document.getElementById('companyLegalName').value=co.legalName||'';
    if(document.getElementById('companyWorkspaceName')) document.getElementById('companyWorkspaceName').value=co.workspace||'';
    if(document.getElementById('companyCode')) document.getElementById('companyCode').value=co.code||'';
    if(document.getElementById('companyIndustry')) document.getElementById('companyIndustry').value=co.industry||'Manufacturing';
    if(document.getElementById('companyWebsite')) document.getElementById('companyWebsite').value=co.website||'';
    if(document.getElementById('companyQmsContact')) document.getElementById('companyQmsContact').value=co.qmsContact||'';
    if(document.getElementById('companyTimezone')) document.getElementById('companyTimezone').value=co.timezone||'Asia/Manila (UTC+8)';
    if(document.getElementById('companyAddress')) document.getElementById('companyAddress').value=co.address||'';
    saveSettingsCompany();
  }
}catch(e){}

refreshRevisionTasks();
refreshRevisionDashboard();
refreshOpenRevisionIndicators();
