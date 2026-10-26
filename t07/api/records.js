'use strict';
const PROJECT='https://krgebzcfvgflrkjisaxd.supabase.co';
const KEY='sb_publishable_XeyQYYYXSWxKBmtKqShq0g_drUUGO57';
const allow=['plans','tasks','runs','plan_revisions','completions','daily','rules'];
const idPattern=/^[a-f0-9-]{36}$/i;
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const table=String(req.query.table||'');const id=String(req.query.id||'');
 if(!allow.includes(table)||id&&!idPattern.test(id))return res.status(400).json({error:'invalid resource'});
 if(!['GET','POST','PATCH','DELETE'].includes(req.method))return res.status(405).json({error:'method not allowed'});
 const header=req.headers.authorization||'';
 if(!/^Bearer\s+\S+$/i.test(header))return res.status(401).json({error:'로그인이 필요합니다.'});
 const auth={apikey:KEY,Authorization:header};
 try{
  const a=await fetch(PROJECT+'/auth/v1/user',{headers:auth,cache:'no-store'});
  if(!a.ok)return res.status(401).json({error:'로그인 세션이 유효하지 않습니다.'});
  const user=await a.json();
  if(!user?.id)return res.status(401).json({error:'로그인 세션이 유효하지 않습니다.'});
  let url=PROJECT+'/rest/v1/pds07_'+table+'?select=*';
  if(id)url+='&'+(table==='completions'?'task_id':'id')+'=eq.'+encodeURIComponent(id);
  let body;
  if(['POST','PATCH'].includes(req.method)){
    if(!req.body||typeof req.body!=='object'||Array.isArray(req.body))return res.status(400).json({error:'invalid body'});
    body={...req.body,owner_id:user.id};
    delete body.created_at;delete body.updated_at;delete body.saved_at;delete body.completed_at;
    if(table==='plan_revisions'||table==='completions')return res.status(403).json({error:'read-only endpoint'});
    if(req.method==='PATCH')delete body.id;
    if(JSON.stringify(body).length>12000)return res.status(413).json({error:'body too large'});
  }
  if(req.method==='DELETE'&&table==='plan_revisions')return res.status(403).json({error:'read-only endpoint'});
  if(req.method!=='GET'&&!id&&req.method!=='POST')return res.status(400).json({error:'id required'});
  const target=await fetch(url,{method:req.method,headers:{...auth,'Content-Type':'application/json','Prefer':'return=representation'},body:body?JSON.stringify(body):undefined,cache:'no-store'});
  const payload=await target.json().catch(()=>[]);
  if(!target.ok){const status=target.status===401?401:target.status===403?403:target.status===404?404:400;return res.status(status).json({error:payload?.message||'요청이 거절됐습니다.'})}
  const rows=Array.isArray(payload)?payload:[payload];
  if(id&&rows.length===0)return res.status(404).json({error:'기록을 찾을 수 없습니다.'});
  return res.status(200).json(rows);
 }catch(e){return res.status(502).json({error:'서버 연결 오류'})}
};