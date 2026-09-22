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
  repository:'Controlled information',
  records:'Records & evidence',
  approvals:'My tasks',
  register:'Document register',
  audit:'Audit trail',
  relationships:'Relationship map',
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



function openMasterLibrary(kind){
  if(kind==='controlled'){
    showView('repository');
    setTimeout(()=>document.getElementById('controlledMasterPanel')?.scrollIntoView({behavior:'smooth',block:'start'}),120);
  }else if(kind==='record'){
    showView('records');
  }
}
document.getElementById('controlledSearch')?.addEventListener('input',e=>{
  const q=e.target.value.trim().toLowerCase();
  document.querySelectorAll('.controlledLibraryRow').forEach(row=>{
    row.style.display=!q||row.textContent.toLowerCase().includes(q)?'grid':'none';
  });
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
  if(!host||!empty) return;
  const docs=space.docs||[];
  host.innerHTML=docs.map((d,i)=>`
    <button class="spaceDocumentItem ${i===0?'selected':''}" data-space-doc-index="${i}">
      <span class="docMain">
        <b>${escapeHtml(d.code)}</b>
        <strong>${escapeHtml(d.title)}</strong>
        <small>${escapeHtml(d.type)}</small>
      </span>
      <span class="docSide">
        <span class="tag ${escapeHtml(d.kind)}">${escapeHtml(d.status)}</span>
        <span>${d.review==='—'?'No review date':escapeHtml(d.review)}</span>
      </span>
    </button>`).join('');
  host.style.display=docs.length?'block':'none';
  empty.style.display=docs.length?'none':'block';
  if(docs[0]) selectSpaceDocument(docs[0],host.querySelector('.spaceDocumentItem'));
  const count=document.getElementById('spaceTabDocCount');
  if(count) count.textContent=space.count||docs.length;
  refreshIcons();
}

function selectSpaceDocument(doc,row){
  document.querySelectorAll('#repositorySpace .spaceDocumentItem').forEach(x=>x.classList.remove('selected'));
  row?.classList.add('selected');

  const title=document.getElementById('docTitle');
  if(!title) return;

  const normalizedRev=doc.rev==='—'?'Record':('Rev '+doc.rev);
  const isWorkflow=['In approval','In review','Draft','Review due'].includes(doc.status);

  title.textContent=doc.title;
  document.getElementById('docCode').textContent=doc.code;
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
  document.getElementById('detailResourceId').textContent='RES-'+String(doc.code||'DOC').replace(/[^A-Z0-9]/gi,'').slice(0,12).toUpperCase();
  document.getElementById('changeReasonRev').textContent=doc.rev==='—'?'—':doc.rev;
  document.getElementById('changeReasonText').textContent=doc.status==='Draft'
    ? 'Draft revision is being prepared and has not yet been released.'
    : doc.status==='In approval'
      ? 'Revision submitted for controlled approval. Release is blocked until the route is completed.'
      : 'Controlled revision retained with its documented change reason and approval history.';

  const decision=document.getElementById('approvalDecision');
  if(decision) decision.style.display=doc.status==='In approval'?'block':'none';

  const workflow=document.querySelector('#repositorySpace .reviewWorkflow');
  if(workflow){
    workflow.innerHTML=isWorkflow && doc.status!=='Effective'
      ? '<div class="done"><i data-lucide="check"></i><span><b>Author</b><small>Completed</small></span></div><div class="done"><i data-lucide="check"></i><span><b>Department review</b><small>Completed</small></span></div><div class="active"><i data-lucide="clock-3"></i><span><b>Final approval</b><small>Waiting for decision</small></span></div><div><i data-lucide="circle"></i><span><b>Release</b><small>Blocked</small></span></div>'
      : '<div class="done"><i data-lucide="check"></i><span><b>Author</b><small>Completed</small></span></div><div class="done"><i data-lucide="check"></i><span><b>Department review</b><small>Completed</small></span></div><div class="done"><i data-lucide="check"></i><span><b>Final approval</b><small>Completed</small></span></div><div class="done"><i data-lucide="check"></i><span><b>Released</b><small>'+escapeHtml(doc.status)+'</small></span></div>';
  }

  document.querySelector('.documentStage')?.scrollTo({top:0,behavior:'smooth'});
  refreshIcons();
}

function prototypeDecision(result){
  const comment=document.getElementById('approvalDecisionComment')?.value.trim();
  toast('Revision '+result.toLowerCase(),comment||('The '+result.toLowerCase()+' decision was recorded in the prototype audit trail.'));
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
  const row=e.target.closest('.spaceDocumentItem[data-space-doc-index]');
  if(!row||!activeSpace) return;
  const doc=activeSpace.docs?.[Number(row.dataset.spaceDocIndex)];
  if(doc) selectSpaceDocument(doc,row);
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


const evidenceItems={
  screening:{type:'Completed form',title:'Candidate Screening Record — Batch 0918',code:'REC-SCR-2026-0918',status:'Retained',kind:'success',date:'18 Sep 2026',owner:'Recruitment',retention:'5 years',access:'Recruitment + Quality',process:'Recruitment',document:'QMS-PRO-REC-001 · Recruitment Procedure',audit:'Internal Audit 2026'},
  interview:{type:'Interview record',title:'Candidate Interview Record — A. Santos',code:'REC-INT-2026-442',status:'Retained',kind:'success',date:'17 Sep 2026',owner:'Recruitment',retention:'5 years',access:'Recruitment + Quality',process:'Recruitment',document:'SOP-REC-004 · Screening SOP',audit:'Internal Audit 2026'},
  cal:{type:'Certificate',title:'Calibration Certificate — DMM-14',code:'CAL-CERT-2026-0084',status:'Current',kind:'success',date:'18 Sep 2026',owner:'Metrology',retention:'7 years',access:'Quality + Operations',process:'Operations',document:'WI-QA-003 · Inspection Work Instruction',audit:'IA-2026-004'},
  audit:{type:'Audit evidence',title:'Internal Audit — Production Line 2',code:'IA-2026-004',status:'Closed',kind:'success',date:'12 Sep 2026',owner:'Quality',retention:'7 years',access:'Quality + Auditors',process:'Internal Audit',document:'SOP-QA-005 · Internal Audit Procedure',audit:'Audit Program 2026'},
  orphan:{type:'Evidence',title:'Receiving Inspection Attachment',code:'REC-2026-114',status:'Unlinked',kind:'warning',date:'20 Sep 2026',owner:'Warehouse',retention:'Pending classification',access:'Warehouse + Quality',process:'Unclassified',document:'Not linked',audit:'Not linked'}
};
function selectEvidence(key,row){
  const d=evidenceItems[key];
  if(!d) return;
  document.querySelectorAll('.evidenceRow').forEach(x=>x.classList.remove('selected'));
  row?.classList.add('selected');
  document.getElementById('evidenceType').textContent=d.type;
  document.getElementById('evidenceTitle').textContent=d.title;
  document.getElementById('evidenceCode').textContent=d.code;
  setTag(document.getElementById('evidenceStatus'),d.status,d.kind);
  document.getElementById('evidenceDate').textContent=d.date;
  document.getElementById('evidenceOwner').textContent=d.owner;
  document.getElementById('evidenceRetention').textContent=d.retention;
  document.getElementById('evidenceAccess').textContent=d.access;
  document.getElementById('traceProcess').textContent=d.process;
  document.getElementById('traceDocument').textContent=d.document;
  document.getElementById('traceEvidence').textContent=d.title.replace(/ — .*/,'');
  document.getElementById('traceAudit').textContent=d.audit;
}
document.querySelectorAll('.evidenceRow').forEach(row=>row.addEventListener('click',()=>selectEvidence(row.dataset.evidence,row)));
document.getElementById('recordsSearch')?.addEventListener('input',e=>{
  const q=e.target.value.trim().toLowerCase();
  document.querySelectorAll('.evidenceRow').forEach(row=>row.style.display=!q||row.textContent.toLowerCase().includes(q)?'grid':'none');
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
  active.querySelectorAll('.documentRow,.resourceRow,.controlledLibraryRow,.evidenceRow,.dataTable tbody tr').forEach(row=>{
    row.style.display=!q||row.textContent.toLowerCase().includes(q)?'':'none';
  });
});


/* Canonical QMS resource registration */
let registrationStep=1;
let registrationClass='controlled';

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

function openRegisterResource(kind='controlled'){
  registrationClass=kind==='record'?'record':'controlled';
  registrationStep=1;
  selectRegistrationClass(registrationClass,false);
  if(registrationClass==='controlled'){
    syncRegistrationSpaceFromContext();
    generateControlledDocumentId();
  }
  renderRegistration();
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
    if(el.classList.contains('controlledOnly')) el.style.display=controlled?'block':'none';
  });
  const prev=document.getElementById('registerPrev');
  const next=document.getElementById('registerNext');
  if(prev) prev.style.display=effectiveStep===1?'none':'inline-flex';
  if(next) next.style.display=effectiveStep===7?'none':'inline-flex';
  updateRegistrationReview();
  refreshIcons();
}
function moveRegistration(delta){
  let next=registrationStep+delta;
  if(registrationClass==='record'){
    if(delta>0 && next===6) next=7;
    if(delta<0 && next===6) next=5;
  }
  registrationStep=Math.max(1,Math.min(7,next));
  renderRegistration();
}
function updateRegistrationReview(){
  const controlled=registrationClass==='controlled';
  const reviewLibrary=document.getElementById('reviewLibrary');
  const reviewIdentity=document.getElementById('reviewIdentity');
  const reviewState=document.getElementById('reviewNextState');
  const reviewDetail=document.getElementById('reviewNextStateDetail');
  const confirmTitle=document.getElementById('registerConfirmTitle');
  const confirmText=document.getElementById('registerConfirmText');
  const mapping=document.getElementById('mappingPreviewResource');
  if(controlled){
    const id=document.getElementById('regId')?.value||'QMS-PRO-REC-001';
    const title=document.getElementById('regTitle')?.value||'Recruitment Procedure';
    if(reviewLibrary) reviewLibrary.textContent='Controlled Information';
    if(reviewIdentity) reviewIdentity.textContent=id+' · '+title;
    if(reviewState) reviewState.textContent='Draft revision created';
    if(reviewDetail) reviewDetail.textContent='Approval route is snapshotted. The document is not Effective until final approval.';
    if(confirmTitle) confirmTitle.textContent='Create controlled draft?';
    if(confirmText) confirmText.textContent='The canonical resource, relationships and approval workflow will be created together.';
    if(mapping) mapping.textContent=title;
  }else{
    const id=document.getElementById('recId')?.value||'REC-SCR-2026-0918';
    const title=document.getElementById('recTitle')?.value||'Candidate Screening Record';
    if(reviewLibrary) reviewLibrary.textContent='Records & Evidence';
    if(reviewIdentity) reviewIdentity.textContent=id+' · '+title;
    if(reviewState) reviewState.textContent='Retained record registered';
    if(reviewDetail) reviewDetail.textContent='Retention, access and traceability are applied. No approval lifecycle is forced unless configured for this record type.';
    if(confirmTitle) confirmTitle.textContent='Register record / evidence?';
    if(confirmText) confirmText.textContent='The canonical record and its QMS traceability links will be created together.';
    if(mapping) mapping.textContent=title;
  }
}

document.querySelectorAll('.sourceMethod').forEach(btn=>btn.addEventListener('click',()=>{
  btn.parentElement.querySelectorAll('.sourceMethod').forEach(x=>x.classList.remove('selected'));
  btn.classList.add('selected');
}));
document.querySelectorAll('.relationshipPick').forEach(btn=>btn.addEventListener('click',()=>{
  btn.classList.toggle('selected');
  const icon=btn.lastElementChild;
  if(icon && icon.dataset) icon.setAttribute('data-lucide',btn.classList.contains('selected')?'check':'plus');
  refreshIcons();
}));
['regTitle','recTitle','recId'].forEach(id=>document.getElementById(id)?.addEventListener('input',updateRegistrationReview));
document.getElementById('regType')?.addEventListener('change',generateControlledDocumentId);
document.getElementById('regSpace')?.addEventListener('change',generateControlledDocumentId);

function finishResourceRegistration(){
  const controlled=registrationClass==='controlled';
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
    toast('Controlled resource registered',(generatedId||'The document')+' was created as a Draft in Controlled Information with QMS mapping, relationships and a snapshotted approval route.');
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
    }
  });
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeBuilder();closeManualRepo();closeSpaceModal();closeRegisterResource()}
});

document.addEventListener('DOMContentLoaded',refreshIcons);
refreshIcons();
