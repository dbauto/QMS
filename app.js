let wizard=0;
const views=[...document.querySelectorAll('.nav[data-view]')];
function show(id){document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));const v=document.getElementById(id);if(v)v.classList.add('on');views.forEach(x=>x.classList.toggle('on',x.dataset.view===id));scrollTo(0,0)}
views.forEach(x=>x.onclick=()=>show(x.dataset.view));
function openBuilder(){wizard=0;renderWizard();document.getElementById('builder').classList.add('on')}
function closeBuilder(){document.getElementById('builder').classList.remove('on')}
function renderWizard(){document.querySelectorAll('.wiz').forEach((x,i)=>x.classList.toggle('on',i===wizard));document.querySelectorAll('.step').forEach((x,i)=>x.classList.toggle('on',i===wizard));back.style.display=wizard?'block':'none';next.style.display=wizard===4?'none':'block'}
function move(n){wizard=Math.max(0,Math.min(4,wizard+n));renderWizard()}
function buildRepo(){closeBuilder();show('repository');setTimeout(()=>alert('Draft repository created. Human validation is still required before controlled/effective status is assigned.'),100)}
document.querySelectorAll('.source').forEach(x=>x.onclick=()=>{document.querySelectorAll('.source').forEach(y=>y.classList.remove('sel'));x.classList.add('sel')});
document.querySelectorAll('.tab').forEach(x=>x.onclick=()=>{x.parentElement.querySelectorAll('.tab').forEach(y=>y.classList.remove('on'));x.classList.add('on')});