(function(root){
'use strict';
const KEY='zeri_qbank_v1',DAY=86400000,INTERVALS=[1,1,3,7,15,30];
const empty=()=>({v:1,seen:{},wrong:{},sessions:[],confuse:{},active:null,size:20});
function read(storage){try{const d=JSON.parse(storage.getItem(KEY)||'null');return d&&d.v===1?{...empty(),...d,seen:d.seen||{},wrong:d.wrong||{},sessions:d.sessions||[],confuse:d.confuse||{}}:empty()}catch{return empty()}}
function shuffle(xs,rng=Math.random){const out=[...xs];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
function order(qs,state){return shuffle(qs).sort((a,b)=>{const x=state.seen[a.id],y=state.seen[b.id],rank=s=>!s?0:s.lastCorrect?2:1;return rank(x)-rank(y)||(x?.at||0)-(y?.at||0)})}
function start(qs,state,config={},now=Date.now()){
 const n=Math.max(1,Math.min(Number(config.size)||state.size,qs.length)),selected=(config.mode==='random'?shuffle(qs):config.mode==='new'?qs:order(qs,state)).slice(0,n);
 if(!selected.length)return null;
 return {id:'round-'+now+'-'+Math.random().toString(36).slice(2,7),mode:config.mode||'chapter',label:config.label||'综合练习',filter:config.filter||{},started:now,index:0,base:selected.map(q=>q.id),queue:selected.map(q=>({id:q.id,rev:q.rev,opts:shuffle([q.a,...q.w]),retry:false})),answers:{},redone:[],done:false};
}
function answer(state,s,q,chosen,now=Date.now()){
 const item=s.queue[s.index];if(!item||item.id!==q.id||s.answers[s.index]||!item.opts.includes(chosen))return false;
 const ok=chosen===q.a;s.answers[s.index]={id:q.id,chosen,ok,retry:item.retry,at:now};
 if(!item.retry){
  const regular=!['wrong','retry'].includes(s.mode),old=state.seen[q.id];
  if(regular){const level=ok?Math.min((old?.level||0)+1,5):0;state.seen[q.id]={at:now,lastCorrect:ok,attempts:(old?.attempts||0)+1,correct:(old?.correct||0)+(ok?1:0),level,due:now+INTERVALS[level]*DAY};}
  if(!ok){const w=state.wrong[q.id]||{};state.wrong[q.id]={...w,active:true,count:(w.count||0)+1,chosen,at:now,streak:0,lastRound:s.id};
   const pair=[q.a,chosen].sort().join('｜'),c=state.confuse[pair]||{n:0,ids:[]};c.n++;c.ids=[...new Set([...c.ids,q.id])];state.confuse[pair]=c;
   if(!s.redone.includes(q.id)){s.redone.push(q.id);s.queue.push({id:q.id,rev:q.rev,opts:shuffle([q.a,...q.w]),retry:true});}
  }else if(state.wrong[q.id]?.active&&state.wrong[q.id].lastRound!==s.id){const w=state.wrong[q.id];w.streak=(w.streak||0)+1;w.lastRound=s.id;if(w.streak>=2)w.active=false;}
 }
 return true;
}
function score(s){const all=Object.values(s.answers),base=all.filter(a=>!a.retry),redo=all.filter(a=>a.retry);return {total:s.base.length,answered:base.length,correct:base.filter(a=>a.ok).length,wrong:base.filter(a=>!a.ok).map(a=>a.id),redo:redo.length,redoCorrect:redo.filter(a=>a.ok).length}}
function next(state,s,now=Date.now()){
 if(!s.answers[s.index]||s.done)return false;
 if(s.index+1<s.queue.length){s.index++;return true}
 s.done=true;const r=score(s);if(!state.sessions.some(x=>x.id===s.id)){state.sessions.unshift({id:s.id,at:now,mode:s.mode,label:s.label,...r});state.sessions=state.sessions.slice(0,100)}return true;
}
function resume(s,byId){
 if(!s||s.done||!Array.isArray(s.queue)||!s.queue.length||!Array.isArray(s.base)||!Array.isArray(s.redone)||!s.answers||typeof s.answers!=='object'||!Number.isInteger(s.index)||s.index<0||s.index>=s.queue.length)return null;
 // Preserve the attempt only when every queued question and its option set still match.
 if(s.queue.some(e=>{const q=byId[e.id];return !q||q.rev!==e.rev||!Array.isArray(e.opts)||e.opts.length!==4||new Set(e.opts).size!==4||e.opts.some(x=>![q.a,...q.w].includes(x))}))return null;
 return s;
}
function due(qs,state,now=Date.now()){return qs.filter(q=>state.seen[q.id]?.due<=now)}
const api={KEY,empty,read,shuffle,order,start,answer,next,score,resume,due};
if(typeof module==='object'&&module.exports)module.exports=api;else root.ZeriQuizCore=api;
})(typeof window==='object'?window:globalThis);
