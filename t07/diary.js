import {renderCore,wireCore} from './diary-core.js';
import {renderDaily,wireDaily} from './diary-days.js';
const $=s=>document.querySelector(s);
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const db={plans:[],tasks:[],runs:[],plan_revisions:[],completions:[],daily:[],rules:[]};
export const el=(tag,text='')=>{const e=document.createElement(tag);e.textContent=text;return e};
export const message=s=>{$('#status').textContent=s};
export async function request(table,method='GET',id='',body){
 const {data}=await window.t07Auth.auth.getSession();
 if(!data.session)throw Error('로그인이 필요합니다.');
 const r=await fetch('/api/records?table='+table+(id?'&id='+id:''),{
 method,headers:{Authorization:'Bearer '+data.session.access_token,'Content-Type':'application/json'},
 body:body?JSON.stringify(body):undefined,cache:'no-store'});
 const v=await r.json();if(!r.ok)throw Error(v.error||'서버 오류');return v;
}
export async function refreshDiary(){
 const keys=Object.keys(db),results=await Promise.all(keys.map(k=>request(k)));
 keys.forEach((k,i)=>db[k]=results[i]);renderCore();renderDaily();
}
export async function runAction(action){try{await action();await refreshDiary();message('저장 완료')}catch(e){message(e.message)}}
export function initDiary(){
 wireCore();wireDaily();
 $('#import-old').onclick=async()=>{
  const b=$('#import-old');b.disabled=true;message('기존 기록을 확인하고 있습니다.');
  try{
   await refreshDiary();
   const cfg=await fetch('/api/config',{cache:'no-store'}).then(r=>r.json());
   const allowed=new Set(['b2e5118d-adf8-4df6-8541-bba1a0078336','571d5369-bdf3-4f19-9318-26ca6a43df83','d7b7f276-437c-4c68-8be4-d0605b237ec3']);
   const keys=['plans','tasks','runs','plan_revisions','completions'];
   const old={};
   for(const name of keys){
    const res=await fetch(cfg.url+'/rest/v1/pds06_'+name+'?select=*',{headers:{apikey:cfg.publishableKey},cache:'no-store'});
    if(!res.ok)throw Error('T06 기록 읽기 실패: '+name+' '+res.status);
    old[name]=await res.json();
   }
   old.plans=old.plans.filter(x=>allowed.has(x.id));
   const plans=new Set(old.plans.map(x=>x.id));
   old.tasks=old.tasks.filter(x=>plans.has(x.plan_id));
   const tasks=new Set(old.tasks.map(x=>x.id));
   old.runs=old.runs.filter(x=>tasks.has(x.task_id));
   old.plan_revisions=old.plan_revisions.filter(x=>plans.has(x.plan_id));
   old.completions=old.completions.filter(x=>tasks.has(x.task_id));
   const added={};
   for(const name of keys){
    const seen=new Set(db[name].map(x=>name==='completions'?x.task_id:x.id));
    let n=0;
    for(const record of old[name]){
     const id=name==='completions'?record.task_id:record.id;
     if(seen.has(id))continue;
     const payload={...record};
     for(const key of ['owner_id','created_at','updated_at','saved_at','completed_at'])delete payload[key];
     await request(name,'POST','',payload);
     seen.add(id);n++;
    }
    added[name]=n;message(name+' 가져오기: '+n+'건');
   }
   await refreshDiary();message('T06 가져오기 완료 · 계획 '+db.plans.length+'건, 할 일 '+db.tasks.filter(x=>!x.deleted_at).length+'건, 실행 '+db.runs.length+'건, 이력 '+db.plan_revisions.length+'건');
  }catch(e){message('가져오기 중단: '+e.message+' · 다시 누르면 완료된 항목은 건너뜁니다.')}finally{b.disabled=false}
 };
 $('#download').onclick=async()=>{try{
 await refreshDiary();const file=new Blob([JSON.stringify({timezone:'Asia/Seoul',exported_at:new Date().toISOString(),records:db},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download='pds07-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }catch(e){message(e.message)}};
}
