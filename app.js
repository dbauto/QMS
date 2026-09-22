function refreshIcons(){
  if(window.lucide) window.lucide.createIcons();
}
const navItems=[...document.querySelectorAll('.navItem[data-view]')];

/* Collapsible navigation and workspace panels */
const sidebarModeToggle=document.getElementById('sidebarModeToggle');
function setSidebarExpanded(expanded){
  document.body.classList.toggle('navExpanded',expanded);
  if(sidebarModeToggle){
    sidebarModeToggle.innerHTML=expanded
      ? '<i data-lucide="panel-left-close"></i><span>Collapse</span>'
      : '<i data-lucide="panel-left-open"></i><span>Expand</span>';
    sidebarModeToggle.title=expanded?'Collapse navigation':'Expand navigation';
    sidebarModeToggle.setAttribute('aria-label',sidebarModeToggle.title);
  }
  try{localStorage.setItem('nexus.navExpanded',expanded?'1':'0')}catch(e){}
  refreshIcons();
}

let savedExpanded=false;
try{savedExpanded=localStorage.getItem('nexus.navExpanded')==='1'}catch(e){}
try{localStorage.removeItem('nexus.navHidden')}catch(e){}
document.body.classList.remove('navHidden');
setSidebarExpanded(savedExpanded);
sidebarModeToggle?.addEventListener('click',()=>setSidebarExpanded(!document.body.classList.contains('navExpanded')));

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
  if((e.ctrlKey||e.metaKey)&&e.key==='\\'){
    e.preventDefault();
    setMainSidebar(!document.body.classList.contains('navHidden'));
  }
  if(e.altKey&&e.key==='\\'){
    e.preventDefault();
    setSidebarExpanded(!document.body.classList.contains('navExpanded'));
  }
});


const viewLabels={
  dashboard:'Overview',
  repository:'Documents',
  approvals:'My tasks',
  register:'Document register',
  audit:'Audit trail',
  relationships:'Sources & evidence',
  structure:'Repository structure',
  types:'Document types',
  ai:'QMS AI',
  users:'Users & access',
  settings:'Settings'
};
const breadcrumbCurrent=document.getElementById('breadcrumbCurrent');

function showView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  const target=document.getElementById(id);
  if(target) target.classList.add('active');
  navItems.forEach(item=>item.classList.toggle('active',item.dataset.view===id));
  if(breadcrumbCurrent) breadcrumbCurrent.textContent=viewLabels[id]||'Workspace';
  window.scrollTo({top:0,behavior:'smooth'});
}
navItems.forEach(item=>item.addEventListener('click',()=>showView(item.dataset.view)));

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

/* Document type configuration */
const typeConfigs={
  sop:{name:'SOP / Procedure',count:'184 documents',prefix:'SOP',numbering:'SOP-{DEPT}-{###}',approval:'Department review → Quality approval',review:'12 months'},
  wi:{name:'Work Instruction',count:'326 documents',prefix:'WI',numbering:'WI-{DEPT}-{###}',approval:'Department approval',review:'12 months'},
  form:{name:'Form / Template',count:'391 documents',prefix:'FORM',numbering:'FORM-{DEPT}-{###}',approval:'Owner → Quality approval',review:'24 months'},
  policy:{name:'Policy',count:'37 documents',prefix:'POL',numbering:'POL-{###}',approval:'Executive approval',review:'24 months'},
  external:{name:'External Document',count:'203 documents',prefix:'EXT',numbering:'EXT-{SRC}-{###}',approval:'Document control review',review:'12 months'}
};
document.querySelectorAll('.typeRow').forEach(row=>{
  row.addEventListener('click',()=>{
    document.querySelectorAll('.typeRow').forEach(x=>x.classList.remove('selected'));
    row.classList.add('selected');
    const d=typeConfigs[row.dataset.type];
    if(!d) return;
    document.getElementById('typeName').textContent=d.name;
    document.getElementById('typeCount').textContent=d.count;
    document.getElementById('typePrefix').value=d.prefix;
    document.getElementById('typeNumbering').value=d.numbering;
    const approval=document.getElementById('typeApproval');
    const review=document.getElementById('typeReview');
    approval.innerHTML='<option>'+d.approval+'</option>';
    review.innerHTML='<option>'+d.review+'</option><option>'+(d.review==='12 months'?'24 months':'12 months')+'</option>';
  });
});

/* Prototype search within the active operational list */
const globalSearch=document.getElementById('globalSearch');
globalSearch?.addEventListener('input',()=>{
  const q=globalSearch.value.trim().toLowerCase();
  const active=document.querySelector('.view.active');
  if(!active) return;
  active.querySelectorAll('.documentRow,.resourceRow,.dataTable tbody tr').forEach(row=>{
    row.style.display=!q||row.textContent.toLowerCase().includes(q)?'':'none';
  });
});

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
    }
  });
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeBuilder();closeManualRepo()}
});

document.addEventListener('DOMContentLoaded',refreshIcons);
refreshIcons();
