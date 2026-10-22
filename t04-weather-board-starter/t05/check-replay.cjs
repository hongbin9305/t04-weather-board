// Node.js 20+ — run from t04-weather-board-starter/
// node t05/check-replay.cjs
const fs=require('node:fs'),vm=require('node:vm');
const nodes=new Map();
function elem(tag='div',value=''){return {tag,textContent:value,children:[],hidden:false,disabled:false,className:'',append(...v){this.children.push(...v)},replaceChildren(...v){this.children=v}}}
function get(id){if(!nodes.has(id))nodes.set(id,elem());return nodes.get(id)}
const ctx={document:{getElementById:get,createElement:elem},navigator:{onLine:true},localStorage:{getItem:()=>null,setItem:()=>{}},Date,Intl,JSON,Number,AbortController,setTimeout,clearTimeout,console,fetch:async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('assets/fixtures/'+url.split('/').pop(),'utf8'))})};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('app.js','utf8'),ctx);
const run=id=>vm.runInContext('run('+JSON.stringify(id)+')',ctx);
const getState=()=>vm.runInContext('({rows:replay.rows.length, last:replay.last?.normalized_value, freshness:replay.freshness, code:replay.error_code, delta:delta(replay.rows),retry:replay.retry})',ctx);
const cases=[
['T05-03',['normal-d1-a'],s=>s.rows===1&&s.last===100&&s.freshness==='fresh'],
['T05-04',['normal-d1-a','normal-d1-b'],s=>s.rows===1&&s.last===105],
['T05-05',['normal-d1-a','normal-d1-b','normal-d2'],s=>s.rows===2&&s.last===120&&s.delta===15],
['T05-06',['normal-d1-a','normal-d1-b','timeout'],s=>s.rows===1&&s.last===105&&s.code==='timeout'&&s.freshness==='stale'&&s.retry],
['T05-07',['normal-d1-a','normal-d1-b','auth-401'],s=>s.rows===1&&s.last===105&&s.code==='auth'&&s.freshness==='stale'&&s.retry],
['T05-08',['normal-d1-a','normal-d1-b','rate-429'],s=>s.rows===1&&s.last===105&&s.code==='rate_limit'&&s.freshness==='stale'&&s.retry],
['T05-09',['normal-d1-a','normal-d1-b','offline'],s=>s.rows===1&&s.last===105&&s.code==='offline'&&s.freshness==='stale'&&s.retry],
['T05-10',['normal-d1-a','normal-d1-b','schema-break','recover-d2'],s=>s.rows===2&&s.last===120&&s.code==='none'&&s.freshness==='fresh'&&s.delta===15]];
(async()=>{let count=0;for(const [id,seq,pass] of cases){vm.runInContext('reset()',ctx);for(const name of seq)await run(name);const s=getState(),ok=pass(s);if(ok)count++;console.log(id,ok?'PASS':'FAIL',JSON.stringify(s))}console.log('TOTAL '+count+'/'+cases.length);if(count!==cases.length)process.exitCode=1})().catch(e=>{console.error(e);process.exitCode=1});
