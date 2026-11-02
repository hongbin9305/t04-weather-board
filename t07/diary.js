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
 $('#import-old').textContent='T06 기록 이전 완료';
 $('#import-old').disabled=true;
 $('#import-old').title='서버에서 계획·할 일·실행·수정 이력·완료 기록을 T07 내 계정으로 이전했습니다.';
 const deletion=$('#request-deletion');
 deletion.disabled=false;deletion.textContent='내 계정과 모든 기록 영구 삭제';
 deletion.onclick=async()=>{
  const phrase=prompt('이 작업은 되돌릴 수 없습니다. 본인 계정과 T07 자료를 영구 삭제하려면 [계정 삭제]를 입력하세요.');
  if(phrase!=='계정 삭제'){message('계정 삭제를 취소했습니다.');return}
  if(!confirm('최종 확인: 이 계정과 연결된 모든 T07 기록을 영구 삭제하시겠습니까?'))return;
  deletion.disabled=true;
  try{
   const {data}=await window.t07Auth.auth.getSession();
   if(!data.session)throw Error('다시 로그인해 주세요.');
   const r=await fetch('https://krgebzcfvgflrkjisaxd.supabase.co/functions/v1/pds07-delete-account',{method:'POST',headers:{apikey:'sb_publishable_XeyQYYYXSWxKBmtKqShq0g_drUUGO57',Authorization:'Bearer '+data.session.access_token,'Content-Type':'application/json'},body:JSON.stringify({confirmation:phrase}),cache:'no-store'});
   const v=await r.json();
   if(!r.ok||!v.deleted)throw Error(v.error||'계정 삭제 요청이 거절됐습니다.');
   await window.t07Auth.auth.signOut({scope:'local'});
   window.location.reload();
  }catch(e){message(e.message);deletion.disabled=false}
 };
 $('#download').onclick=async()=>{try{
 await refreshDiary();const file=new Blob([JSON.stringify({timezone:'Asia/Seoul',exported_at:new Date().toISOString(),records:db},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download='pds07-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }catch(e){message(e.message)}};
}
