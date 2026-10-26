import {db,el,today,request,runAction,message} from './diary.js';
const $=s=>document.querySelector(s);
const ordered=()=>[...db.daily].sort((a,b)=>a.record_date.localeCompare(b.record_date));
export function renderDaily(){
 const rows=ordered(),rule=db.rules[0];$('#daily-date').value=today();
 $('#daily-rows').replaceChildren(...rows.map(x=>el('p',x.record_date+' · '+x.actual_study_minutes+'분 · '+x.note)));
 const box=$('#rules-view');box.replaceChildren();if(rule){
 box.append(el('p','질문: '+rule.question),el('p','지표: '+rule.metric_name+' ('+rule.unit+') / '+rule.calculation),el('p','첫 규칙: '+rule.initial_rule));
 if(rule.changed_at)box.append(el('p','변경: '+rule.changed_rule+' / 이유: '+rule.change_reason+' / 시각: '+rule.changed_at));
 }
 const sum=a=>a.reduce((s,x)=>s+x.actual_study_minutes,0),pre=rows.slice(0,2),post=rows.slice(2,5);
 $('#comparison').textContent='날짜 '+rows.length+'/5일 · 총 '+sum(rows)+'분 · 평균 '+(rows.length?(sum(rows)/rows.length).toFixed(1):0)+'분 · 변경 전 평균 '+(pre.length?(sum(pre)/pre.length).toFixed(1):'-')+'분 / 변경 후 평균 '+(post.length?(sum(post)/post.length).toFixed(1):'-')+'분';
}
export function wireDaily(){
 $('#rule-form').onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));if(db.rules.length||db.daily.length){message('1일차 시작 전에 한 번만 고정할 수 있습니다.');return}runAction(()=>request('rules','POST','',v))};
 $('#daily-form').onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget)),rows=ordered(),old=rows.find(x=>x.record_date===today());v.actual_study_minutes=Number(v.actual_study_minutes);
 if(!db.rules.length){message('관찰 질문과 규칙을 먼저 고정하세요.');return}
 if(v.record_date!==today()){message('실제 오늘 날짜만 기록할 수 있습니다.');return}
 if(!old&&rows.length>=5){message('5일 기록 완료');return}
 if(!old&&rows.length===2&&!db.rules[0].changed_at){message('3일차 기록 전에 규칙을 변경하세요.');return}
 runAction(()=>request('daily',old?'PATCH':'POST',old?.id||'',v))};
 $('#change-form').onsubmit=e=>{e.preventDefault();const rule=db.rules[0],rows=ordered();
 if(!rule||rule.changed_at||rows.length!==2||rows[1].record_date===today()){message('실제 2일차 기록 후, 다음 날짜 3일차 기록 전에 규칙을 한 번 변경하세요.');return}
 const v=Object.fromEntries(new FormData(e.currentTarget));v.changed_at=new Date().toISOString();v.day1_id=rows[0].id;v.day2_id=rows[1].id;
 runAction(()=>request('rules','PATCH',rule.id,v))};
}
