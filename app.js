const DATA={docs:[
{id:"SOP-QA-014",title:"Control of Nonconforming Outputs",type:"SOP",dept:"Quality",rev:"06",status:"Effective",owner:"Maria Santos",review:"2027-09-15"},
{id:"SOP-PUR-012",title:"Supplier Control Procedure",type:"SOP",dept:"Purchasing",rev:"05",status:"Review Due",owner:"John Cruz",review:"2026-09-28"},
{id:"WI-PROD-021",title:"Final Inspection Work Instruction",type:"Work Instruction",dept:"Operations",rev:"03",status:"In Approval",owner:"Ana Reyes",review:"—"},
{id:"POL-QMS-001",title:"Quality Policy",type:"Policy",dept:"Management",rev:"05",status:"Effective",owner:"Quality Manager",review:"2027-01-12"},
{id:"FORM-QA-011",title:"Nonconformance Report Form",type:"Form",dept:"Quality",rev:"09",status:"Effective",owner:"Document Control",review:"2027-06-01"},
{id:"EXT-STD-002",title:"Customer Quality Specification",type:"External",dept:"Quality",rev:"2026.2",status:"Current",owner:"Document Control",review:"2027-02-01"}],
records:[
{id:"NCR-2026-091",title:"Supplier defect — incoming material",type:"NCR",dept:"Quality",status:"Closed",linked:"SOP-QA-014"},
{id:"IA-2026-004",title:"Internal Audit — Production",type:"Audit Record",dept:"Quality",status:"Open",linked:"SOP-QA-014"},
{id:"CAL-CERT-0084",title:"Calibration Certificate — DMM-14",type:"Certificate",dept:"Engineering",status:"Current",linked:"EQ-DMM-14"},
{id:"TRN-2026-118",title:"SOP-QA-014 Training Acknowledgement",type:"Training",dept:"HR",status:"Complete",linked:"SOP-QA-014"}]};
let wizard=0,activeDoc=DATA.docs[0];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function show(id){$$('.view').forEach(x=>x.classList.remove('on'));const v=$('#'+id);if(v)v.classList.add('on');$$('.nav[data-view]').forEach(x=>x.classList.toggle('on',x.dataset.view===id));scrollTo(0,0)}
$$('.nav[data-view]').forEach(x=>x.onclick=()=>show(x.dataset.view));
function badge(s){let c=s==="Effective"||s==="Current"||s==="Closed"||s==="Complete"?"tag":s.includes("Approval")?"tag blueTag":"tag warn";return '<span class="'+c+'">'+s+'</span>'}
function renderDocs(){let q=($('#docSearch')?.value||"").toLowerCase();$('#docRows').innerHTML=DATA.docs.filter(d=>Object.values(d).join(" ").toLowerCase().includes(q)).map(d=>'<tr class="clickrow" onclick="openDoc(\''+d.id+'\')"><td><b>'+d.id+'</b></td><td>'+d.title+'</td><td>'+d.type+'</td><td>'+d.dept+'</td><td>'+d.rev+'</td><td>'+badge(d.status)+'</td><td>'+d.owner+'</td><td>'+d.review+'</td></tr>').join('')}
function renderRecords(){$('#recordRows').innerHTML=DATA.records.map(r=>'<tr><td><b>'+r.id+'</b></td><td>'+r.title+'</td><td>'+r.type+'</td><td>'+r.dept+'</td><td>'+badge(r.status)+'</td><td>'+r.linked+'</td></tr>').join('')}
function openDoc(id){activeDoc=DATA.docs.find(d=>d.id===id)||DATA.docs[0];$('#dNo').textContent=activeDoc.id;$('#dTitle').textContent=activeDoc.title;$('#dRev').textContent='REV '+activeDoc.rev;$('#dOwner').textContent=activeDoc.owner;$('#dDept').textContent=activeDoc.dept;show('document')}
function openRevision(){openModal('revisionModal')}
function openModal(id){$('#'+id).classList.add('on')}function closeModal(id){$('#'+id).classList.remove('on')}
function submitRevision(){closeModal('revisionModal');alert('Mock: Revision 07 draft created with change reason, owner and approval route. Audit event recorded.')}
function openBuilder(){wizard=0;renderWizard();$('#builder').classList.add('on')}function closeBuilder(){$('#builder').classList.remove('on')}
function renderWizard(){$$('.wiz').forEach((x,i)=>x.classList.toggle('on',i===wizard));$$('.step').forEach((x,i)=>{x.classList.toggle('on',i===wizard);x.classList.toggle('done',i<wizard)});$('#back').style.display=wizard?'block':'none';$('#next').style.display=wizard===5?'none':'block'}
function move(n){wizard=Math.max(0,Math.min(5,wizard+n));renderWizard()}
function buildRepo(){closeBuilder();show('repository');$('#repoName').textContent='Apex Precision Manufacturing';alert('Draft repository created. 1,428 resources staged for human validation. No controlled/effective status was assigned automatically.')}
$$('.source').forEach(x=>x.onclick=()=>{$$('.source').forEach(y=>y.classList.remove('sel'));x.classList.add('sel')});
function askAI(){let inp=$('#aiInput'),txt=inp.value.trim();if(!txt)return;$('#chat').insertAdjacentHTML('beforeend','<div class="bubble me">'+txt+'</div><div class="bubble"><b>QMS AI</b><br>Based on the current effective documents, I found SOP-QA-014 Rev 06 and related evidence. This mock response is permission-aware and would cite the source revision in production.</div>');inp.value=''}
function filterGlobal(){let q=$('#globalSearch').value.toLowerCase();if(q.length>2){show('register');$('#docSearch').value=q;renderDocs()}}
function switchTab(el,target){el.parentElement.querySelectorAll('.tab').forEach(x=>x.classList.remove('on'));el.classList.add('on');$$('.docTab').forEach(x=>x.style.display='none');$('#'+target).style.display='block'}
renderDocs();renderRecords();