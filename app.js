const items=[...document.querySelectorAll('.navItem[data-view]')];
function showView(id){
 document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
 const v=document.getElementById(id); if(v)v.classList.add('active');
 items.forEach(i=>i.classList.toggle('active',i.dataset.view===id));
 window.scrollTo(0,0);
}
items.forEach(i=>i.addEventListener('click',()=>showView(i.dataset.view)));
let wizStep=1;
function openBuilder(){wizStep=1;renderWizard();document.getElementById('builder').classList.add('show')}
function closeBuilder(){document.getElementById('builder').classList.remove('show')}
function renderWizard(){
 document.querySelectorAll('.wiz').forEach((e,i)=>e.style.display=(i+1===wizStep?'block':'none'));
 document.querySelectorAll('.wp').forEach((e,i)=>{e.classList.toggle('active',i+1===wizStep);e.classList.toggle('done',i+1<wizStep)});
 document.getElementById('prevBtn').style.display=wizStep===1?'none':'inline-block';
 document.getElementById('nextBtn').style.display=wizStep===5?'none':'inline-block';
}
function wizardMove(n){wizStep=Math.max(1,Math.min(5,wizStep+n));renderWizard()}
function addAIReply(){
 const area=document.querySelector('#wiz3 .aiInterview');
 const input=document.querySelector('#wiz3 .chatInput input');
 const b=document.createElement('div');b.className='bubble ai';b.innerHTML='<b>QMS AI</b><br>Thanks. I will configure the Quality Manager as the authority who confirms the current effective revision during onboarding. I can now prepare the proposed repository.';
 area.insertBefore(b,area.querySelector('.chatInput'));input.value='';
}
function buildRepo(){closeBuilder();showView('repository');setTimeout(()=>alert('Draft repository created. All resources remain pending human validation before controlled status is assigned.'),100)}
document.querySelectorAll('.sourceChoice').forEach(x=>x.onclick=()=>{document.querySelectorAll('.sourceChoice').forEach(y=>y.classList.remove('selected'));x.classList.add('selected')});
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{t.parentElement.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));t.classList.add('active')});
document.querySelectorAll('button').forEach(b=>{if(!b.onclick&&!b.closest('.sourceChoices')&&!b.id)b.addEventListener('click',()=>{b.animate([{transform:'scale(1)'},{transform:'scale(.97)'},{transform:'scale(1)'}],{duration:140})})});

let manualStep=1;
function openManualRepo(){manualStep=1;renderManual();document.getElementById('manualRepo').classList.add('show')}
function closeManualRepo(){document.getElementById('manualRepo').classList.remove('show')}
function renderManual(){document.querySelectorAll('.manualPage').forEach((e,i)=>e.style.display=(i+1===manualStep?'block':'none'));document.querySelectorAll('.ms').forEach((e,i)=>{e.classList.toggle('active',i+1===manualStep);e.classList.toggle('done',i+1<manualStep)});document.getElementById('manualPrev').style.display=manualStep===1?'none':'inline-block';document.getElementById('manualNext').style.display=manualStep===7?'none':'inline-block'}
function manualMove(n){manualStep=Math.max(1,Math.min(7,manualStep+n));renderManual()}
function finishManualRepo(){closeManualRepo();showView('repository');setTimeout(()=>alert('SOP-PUR-012 Rev 05 created as DRAFT. Approval route is ready for submission; the document is not Effective yet.'),100)}
