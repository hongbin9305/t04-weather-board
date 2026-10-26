import './client.js';
import {initDiary,refreshDiary} from './diary.js';
const $=s=>document.querySelector(s);
const msg=s=>{$('#status').textContent=s};
const auth=window.t07Auth;
async function openApp(){
 const {data,error}=await auth.auth.getUser();
 if(error||!data.user){$('#auth').classList.remove('hidden');$('#app').classList.add('hidden');return}
 $('#auth').classList.add('hidden');$('#app').classList.remove('hidden');
 $('#identity').replaceChildren();
 const label=document.createElement('span');label.textContent=data.user.email+' ';
 const out=document.createElement('button');out.textContent='로그아웃';out.onclick=async()=>{const r=await auth.auth.signOut({scope:'global'});if(r.error)msg(r.error.message);else await openApp()};
 $('#identity').append(label,out);
 await refreshDiary();
}
$('#auth-form').onsubmit=async e=>{
 e.preventDefault();const email=$('#email').value.trim(),password=$('#password').value;$('#password').value='';
 const r=await auth.auth.signInWithPassword({email,password});
 if(r.error){msg('이메일 또는 비밀번호가 올바르지 않습니다.');return}msg('');await openApp();
};
$('#sign-up').onclick=async()=>{
 const email=$('#email').value.trim(),password=$('#password').value;$('#password').value='';
 if(!email||password.length<8){msg('이메일과 8자 이상 비밀번호를 입력해 주세요.');return}
 const r=await auth.auth.signUp({email,password,options:{emailRedirectTo:location.origin}});
 msg(r.error?'가입 요청을 처리할 수 없습니다.':'가입 신청 완료. 확인 메일이 있으면 인증 후 로그인하세요.');
 if(!r.error)await openApp();
};
document.querySelectorAll('nav.tabs button').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('.tab').forEach(n=>n.classList.add('hidden'));
 $('#'+b.dataset.tab).classList.remove('hidden');
});
initDiary();
openApp().catch(e=>msg(e.message));
