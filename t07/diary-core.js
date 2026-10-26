import {db,el,today,request,runAction,message} from './diary.js';
const $=s=>document.querySelector(s),tasks=p=>db.tasks.filter(t=>t.plan_id===p&&!t.deleted_at),runs=t=>db.runs.filter(r=>r.task_id===t);
const button=(name,fn)=>{const b=el('button',name);b.onclick=()=>runAction(fn);return b};
const fill=(id,keep)=>{const e=$(id),old=keep?e.value:null;e.replaceChildren();for(const p of db.plans){const o=el('option',p.title);o.value=p.id;e.append(o)}if(db.plans.some(p=>p.id===old))e.value=old};
export function renderCore(){
 fill('#task-plan',true);fill('#see-plan',true);
 $('#plans').replaceChildren(...db.plans.map(p=>{const c=el('div');c.className='card';c.append(el('h3',p.title),el('p',p.start_date+' ~ '+p.end_date+' / 예상 '+p.estimated_minutes+'분'),el('p','성공 기준: '+p.success_criteria));
 c.append(button('수정',async()=>{const title=prompt('계획명',p.title);if(title?.trim())await request('plans','PATCH',p.id,{title:title.trim()})}),button('수정 이력',async()=>{const found=db.plan_revisions.filter(r=>r.plan_id===p.id);message(found.length?found.map(x=>JSON.stringify(x.snapshot)).join(' / '):'이전 수정 이력 없음')}));return c}));
 renderTasks();renderSee();
}
function renderTasks(){const area=$('#tasks');area.replaceChildren();for(const t of tasks($('#task-plan').value)){const c=el('article');c.append(el('h3',t.title),el('p',t.description+' / '+t.due_date+' / '+(t.is_done?'완료':'진행 중')),el('p','예상 '+t.estimated_minutes+'분 · 실제 '+runs(t.id).reduce((sum,r)=>sum+r.actual_minutes,0)+'분'));
 c.append(button(t.is_done?'되돌리기':'완료',()=>request('tasks','PATCH',t.id,{is_done:!t.is_done})),button('수정',async()=>{const title=prompt('할 일 제목',t.title);if(title?.trim())await request('tasks','PATCH',t.id,{title:title.trim()})}),button('삭제',()=>request('tasks','PATCH',t.id,{deleted_at:new Date().toISOString()})),button('실행 기록',async()=>{const form=$('#run-form');form.elements.task_id.value=t.id;$('#run-form-card').classList.remove('hidden')}));area.append(c)}}
function renderSee(){const list=tasks($('#see-plan').value),sum=list.reduce((a,t)=>a+t.estimated_minutes,0),actual=list.reduce((a,t)=>a+runs(t.id).reduce((n,r)=>n+r.actual_minutes,0),0);
 const all={계획:list,완료:list.filter(t=>t.is_done),지연:list.filter(t=>!t.is_done&&t.due_date<today()),막힘:list.filter(t=>runs(t.id).some(r=>r.blocker)),예상:list,실제:list,차이:list};
 const stats=[['계획',list.length,'건'],['완료',all.완료.length,'건'],['지연',all.지연.length,'건'],['막힘',all.막힘.length,'건'],['예상',sum,'분'],['실제',actual,'분'],['차이',actual-sum,'분']];
 $('#metrics').replaceChildren(...stats.map(([k,v,u])=>{const b=el('button',k+' '+v+u);b.className='stat';b.onclick=()=>{$('#evidence').classList.remove('hidden');$('#evidence').replaceChildren(el('h3',k+' 근거'),...all[k].map(t=>el('p',t.title+' · 실제 '+runs(t.id).reduce((s,r)=>s+r.actual_minutes,0)+'분')))};return b}));
}
export function wireCore(){
 $('#task-plan').onchange=renderTasks;$('#see-plan').onchange=renderSee;
 $('#plan-form').onsubmit=e=>{e.preventDefault();const f=e.currentTarget,v=Object.fromEntries(new FormData(f));v.estimated_minutes=Number(v.estimated_minutes);runAction(async()=>{await request('plans','POST','',v);f.reset()})};
 $('#task-form').onsubmit=e=>{e.preventDefault();const f=e.currentTarget,v=Object.fromEntries(new FormData(f));v.plan_id=$('#task-plan').value;v.estimated_minutes=Number(v.estimated_minutes);v.tags=v.tags.split(',').map(x=>x.trim()).filter(Boolean);runAction(async()=>{await request('tasks','POST','',v);f.reset()})};
 $('#run-form').onsubmit=e=>{e.preventDefault();const f=e.currentTarget,v=Object.fromEntries(new FormData(f)),a=new Date(v.started_at),b=new Date(v.ended_at);v.actual_minutes=Math.round((b-a)/60000);if(v.actual_minutes<0||!Number.isFinite(v.actual_minutes)){message('시각이 잘못되었습니다.');return}v.started_at=a.toISOString();v.ended_at=b.toISOString();runAction(async()=>{await request('runs','POST','',v);f.reset();$('#run-form-card').classList.add('hidden')})};
 $('#make-next').onclick=()=>runAction(async()=>{const p=db.plans.find(p=>p.id===$('#see-plan').value),improvement=$('#improvement').value.trim();if(!p||!improvement)throw Error('개선점을 입력하세요.');await request('plans','PATCH',p.id,{next_improvement:improvement});await request('plans','POST','',{title:p.title+' · 다음 계획',start_date:today(),end_date:today(),priority:p.priority,estimated_minutes:0,success_criteria:'이전 돌아보기 반영: '+improvement})});
}
