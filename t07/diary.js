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
 $('#download').onclick=async()=>{try{
 await refreshDiary();const file=new Blob([JSON.stringify({timezone:'Asia/Seoul',exported_at:new Date().toISOString(),records:db},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download='pds07-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }catch(e){message(e.message)}};
}
