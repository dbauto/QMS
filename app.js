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
  if(id==='repository') closeDocumentSpace();
  if(breadcrumbCurrent && id!=='repository') breadcrumbCurrent.textContent=viewLabels[id]||'Workspace';
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


/* QMS document spaces */
const spaceDefinitions={
  quality:{
    name:'Quality Management',path:'Quality / Procedures',count:486,
    docs:[
      {code:'SOP-QA-014',title:'Control of Nonconforming Outputs',type:'SOP · Quality',rev:'06',owner:'M. Santos',status:'Effective',kind:'success',review:'15 Sep 2027',approver:'Quality Manager',effective:'15 Sep 2026',purpose:'Defines controls for identifying, segregating, reviewing and dispositioning nonconforming outputs.'},
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
  const workspace=document.querySelector('#repositorySpace .documentWorkspace');
  if(!host||!empty) return;
  const docs=space.docs||[];
  host.innerHTML=docs.map((d,i)=>`
    <button class="documentRow ${i===0?'selected':''}" data-space-doc-index="${i}">
      <div><b>${escapeHtml(d.code)}</b><strong>${escapeHtml(d.title)}</strong><small>${escapeHtml(d.type)}</small></div>
      <span>${escapeHtml(d.rev)}</span><span>${escapeHtml(d.owner)}</span><span class="tag ${escapeHtml(d.kind)}">${escapeHtml(d.status)}</span><span>${escapeHtml(d.review)}</span>
    </button>`).join('');
  host.style.display=docs.length?'block':'none';
  empty.style.display=docs.length?'none':'block';
  workspace?.classList.toggle('inspectorHidden',!docs.length);
  if(docs[0]) selectSpaceDocument(docs[0],host.querySelector('.documentRow'));
  refreshIcons();
}

function selectSpaceDocument(doc,row){
  document.querySelectorAll('#repositorySpace .documentRow').forEach(x=>x.classList.remove('selected'));
  row?.classList.add('selected');
  const title=document.getElementById('docTitle');
  if(!title) return;
  title.textContent=doc.title;
  document.getElementById('docCode').textContent=doc.code;
  document.getElementById('docRev').textContent=doc.rev==='—'?'Record':('Rev '+doc.rev);
  setTag(document.getElementById('docStatus'),doc.status,doc.kind);
  document.getElementById('docOwner').textContent=doc.owner;
  document.getElementById('docApprover').textContent=doc.approver||'—';
  document.getElementById('docEffective').textContent=doc.effective||'—';
  document.getElementById('docReview').textContent=doc.review||'—';
  document.getElementById('docPurpose').textContent=doc.purpose||'No purpose statement has been added yet.';
}

let activeSpace=null;
function openDocumentSpace(spaceId,override=null){
  const base=override||spaceDefinitions[spaceId];
  if(!base) return;
  activeSpace=base;
  document.getElementById('repositoryHub').style.display='none';
  document.getElementById('repositorySpace').style.display='block';
  document.getElementById('spaceDetailName').textContent=base.name;
  document.getElementById('spaceDetailCount').textContent=base.count||0;
  document.getElementById('spaceDetailPath').textContent=base.path||base.name;
  document.getElementById('spaceListTitle').textContent=base.path||base.name;
  renderSpaceRows(base);
  if(breadcrumbCurrent) breadcrumbCurrent.textContent='Documents / '+base.name;
  window.scrollTo({top:0,behavior:'smooth'});
}
function closeDocumentSpace(){
  const hub=document.getElementById('repositoryHub');
  const detail=document.getElementById('repositorySpace');
  if(hub) hub.style.display='block';
  if(detail) detail.style.display='none';
  activeSpace=null;
  if(breadcrumbCurrent) breadcrumbCurrent.textContent='Documents';
}

const spacesHost=document.getElementById('documentSpaces');
spacesHost?.addEventListener('click',e=>{
  const card=e.target.closest('.spaceCard[data-space-id]');
  if(!card) return;
  openDocumentSpace(card.dataset.spaceId);
});

document.getElementById('spaceDocumentRows')?.addEventListener('click',e=>{
  const row=e.target.closest('.documentRow[data-space-doc-index]');
  if(!row||!activeSpace) return;
  const doc=activeSpace.docs?.[Number(row.dataset.spaceDocIndex)];
  if(doc) selectSpaceDocument(doc,row);
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
      if(modal.id==='spaceModal') closeSpaceModal();
    }
  });
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeBuilder();closeManualRepo();closeSpaceModal()}
});

document.addEventListener('DOMContentLoaded',refreshIcons);
refreshIcons();
