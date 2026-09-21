const navItems=[...document.querySelectorAll('.navItem[data-view]')];

function showView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  const target=document.getElementById(id);
  if(target) target.classList.add('active');
  navItems.forEach(item=>item.classList.toggle('active',item.dataset.view===id));
  window.scrollTo({top:0,behavior:'smooth'});
}
navItems.forEach(item=>item.addEventListener('click',()=>showView(item.dataset.view)));

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
  if(!area) return;
  const composer=area.querySelector('.chatComposer');
  if(area.querySelector('.confirmationReply')) return;
  const reply=document.createElement('div');
  reply.className='bubble ai confirmationReply';
  reply.innerHTML='<b>QMS AI</b><br>Understood. I will treat the Quality Manager as the authority who confirms the current effective revision during onboarding. I can now prepare the proposed repository.';
  area.insertBefore(reply,composer);
  const input=composer?.querySelector('input');
  if(input) input.value='';
}
function buildRepo(){
  closeBuilder();
  showView('repository');
  toast('Draft repository created','Resources remain pending human validation before controlled status is assigned.');
}

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
  toast('Controlled draft created','SOP-PUR-012 Rev 05 is Draft. It is not Effective until its approval route is completed.');
}

function toast(title,message){
  document.querySelector('.toast')?.remove();
  const el=document.createElement('div');
  el.className='toast';
  el.innerHTML='<b>'+title+'</b><span>'+message+'</span>';
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('show'));
  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),250)},4200);
}

document.querySelectorAll('.choiceGrid').forEach(group=>{
  group.querySelectorAll('.sourceChoice').forEach(choice=>{
    choice.addEventListener('click',()=>{
      group.querySelectorAll('.sourceChoice').forEach(x=>x.classList.remove('selected'));
      choice.classList.add('selected');
    });
  });
});

const inspectorTabs=[...document.querySelectorAll('.inspectorTabs button[data-tab]')];
inspectorTabs.forEach(tab=>{
  tab.addEventListener('click',()=>{
    inspectorTabs.forEach(x=>x.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.inspectorPane').forEach(p=>p.classList.remove('active'));
    document.getElementById('tab-'+tab.dataset.tab)?.classList.add('active');
  });
});

const docs={
  qa014:{title:'Control of Nonconforming Outputs',code:'SOP-QA-014'},
  qa005:{title:'Internal Audit Procedure',code:'SOP-QA-005'},
  qa001:{title:'Document Control Procedure',code:'SOP-QA-001'},
  qa020:{title:'Corrective Action Procedure',code:'SOP-QA-020'}
};
document.querySelectorAll('.docListItem').forEach(item=>{
  item.addEventListener('click',()=>{
    document.querySelectorAll('.docListItem').forEach(x=>x.classList.remove('selected'));
    item.classList.add('selected');
    const data=docs[item.dataset.doc];
    if(data){
      const title=document.getElementById('docTitle');
      const code=document.getElementById('docCode');
      if(title) title.textContent=data.title;
      if(code) code.textContent=data.code;
    }
  });
});

document.querySelectorAll('.approvalItem').forEach(item=>{
  item.addEventListener('click',()=>{
    document.querySelectorAll('.approvalItem').forEach(x=>x.classList.remove('selected'));
    item.classList.add('selected');
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

document.querySelectorAll('button').forEach(button=>{
  button.addEventListener('mousedown',()=>button.classList.add('pressed'));
  button.addEventListener('mouseup',()=>button.classList.remove('pressed'));
  button.addEventListener('mouseleave',()=>button.classList.remove('pressed'));
});
