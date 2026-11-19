/* Course review reuses the checked lesson text; it introduces no extra rules. */
(function(){
'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let ready=false,stage='全部',source=null;
const selected=c=>[c.sections[1],c.sections[4],c.sections[6]];
function text(html){const d=document.createElement('div');d.innerHTML=html;return d.textContent}
function chapters(){return window.ZERI_COURSE?.chapters||[]}
function refreshLayout(){if(window.ZeriCourse)window.ZeriCourse.prepareReading($('#review-view'))}
function fill(details,c){
 if(details.dataset.filled)return;details.dataset.filled='1';
 details.insertAdjacentHTML('beforeend','<div class="review-content">'+selected(c).map(s=>`<section data-review-sec="${s.id}" id="review-${s.id}"><h2>${esc(s.title.replace(/^[一二三四五六七八]、/,''))}</h2><div class="section-body">${s.html}</div><a class="review-source" href="index.html?tab=course#${c.id}~${s.id}">回看第 ${c.n} 课相关讲解 →</a></section>`).join('')+'</div>');
 refreshLayout();
}
function render(){
 const query=$('#review-search').value.trim().toLowerCase(),filtered=chapters().filter(c=>(stage==='全部'||c.stage===stage)&&(!query||(c.title+' '+selected(c).map(s=>text(s.html)).join(' ')).toLowerCase().includes(query)));
 $('#review-count').textContent=`${filtered.length} / ${chapters().length} 课`;
 $('#review-list').innerHTML=filtered.map(c=>`<details class="review-lesson" data-review-chapter="${c.id}"><summary><span class="review-number">${String(c.n).padStart(2,'0')}</span><span><b>${esc(c.title)}</b><small>${c.stage} · 规则与条件 / 易错点 / 小结</small></span></summary></details>`).join('')||'<p class="empty">没有找到对应知识点，换个词试试。</p>';
 $('#review-list').querySelectorAll('details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)fill(d,chapters().find(c=>c.id===d.dataset.reviewChapter))}));
}
function filters(){
 $('#review-filters').innerHTML=['全部','初级','中级','高级'].map(s=>`<button class="btn small ${stage===s?'primary':''}" data-review-stage="${s}" aria-pressed="${stage===s}">${s}</button>`).join('');
 $('#review-filters').querySelectorAll('button').forEach(b=>b.onclick=()=>{stage=b.dataset.reviewStage;filters();render()});
}
function init(){
 if(ready||!chapters().length)return;ready=true;filters();render();$('#review-search').addEventListener('input',render);
 const id=new URLSearchParams(location.search).get('review');if(id)go({id});
}
function go(l){
 init();const c=chapters().find(c=>c.id===l.id);if(!c)return;
 stage='全部';$('#review-search').value='';filters();render();
 const d=$(`[data-review-chapter="${c.id}"]`);d.open=true;fill(d,c);
 source={v:'course-review',id:c.id,sec:l.sec||selected(c)[0].id};
 const target=document.getElementById('review-'+source.sec)||d;
 requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
}
 document.addEventListener('click',e=>{const d=e.target.closest('[data-review-chapter]');if(!d)return;source={v:'course-review',id:d.dataset.reviewChapter,sec:e.target.closest('[data-review-sec]')?.dataset.reviewSec||null}},true);
 window.ZeriReview={init,refreshLayout,hook:{loc:()=>source,label:()=>{const c=chapters().find(c=>c.id===source?.id);return c?`速查 · 第${c.n}课 ${c.title}`:'课程知识点速查'},go}};
})();
