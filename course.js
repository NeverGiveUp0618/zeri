/* 教材正文与题目均由 content 构建；学习状态只由用户操作改变。 */
(async function(){
'use strict';
const D=window.ZERI_COURSE,KEY='zeri_course_v1',QKEY='zeri_course_answers_v1',POS='zeri_course_positions_v1';
const host=window.ZERI_EMBEDDED,root=host?document.getElementById(host.rootId):document,scroller=host?document.getElementById(host.scrollId):window;
const isActive=()=>!host||host.isActive(),scrollTop=()=>host?scroller.scrollTop:window.scrollY,scrollToPosition=y=>{if(!isActive())return;if(host)scroller.scrollTop=y;else window.scrollTo(0,y)};
const $=s=>root.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(!D||!Array.isArray(D.chapters)){$('#course-home').innerHTML='<p>课程数据加载未完成，请重新打开课程。</p><a class="btn" href="course.html">重新加载</a>';return}
if(window.YG&&window.YG.ready){$('#course-home').textContent='正在读取学习记录…';try{await window.YG.ready}catch(e){}}
function read(k,def){try{return JSON.parse(localStorage.getItem(k))||def}catch(e){return def}}
let progress=read(KEY,{read:{},last:null}),answers=read(QKEY,{}),positions=read(POS,{}),current=null,noteSection=null,activeUtility=null,activeMountain=null,drawn=new Map();
const chapters=D.chapters;
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
if(!object(progress))progress={};if(!object(progress.read))progress.read={};
if(!object(answers))answers={};if(!object(positions))positions={};
const knownChapters=new Set(chapters.map(c=>c.id)),knownQuestions=new Set(chapters.flatMap(c=>c.questions.map(q=>q.id)));
progress.read=Object.fromEntries(Object.entries(progress.read).filter(([id,v])=>knownChapters.has(id)&&typeof v==='boolean'));
positions=Object.fromEntries(Object.entries(positions).filter(([id,y])=>knownChapters.has(id)&&Number.isFinite(y)&&y>=0));
for(const id of Object.keys(answers))if(!knownQuestions.has(id))delete answers[id];
for(const c of chapters)for(const q of c.questions){const a=answers[q.id];if(a&&(!object(a)||![q.a,...q.w].includes(a.choice)||a.correct!==(a.choice===q.a)||(a.rev&&a.rev!==q.rev)))delete answers[q.id]}
function storageIssue(){let el=document.getElementById('storage-issue');if(!el){el=document.createElement('div');el.id='storage-issue';el.className='source-notice';if(host)root.prepend(el);else document.querySelector('header').after(el)}el.textContent='当前浏览器未能保存学习记录。本页仍可学习，请检查浏览器存储空间后重试。'}
function save(){try{localStorage.setItem(KEY,JSON.stringify(progress));localStorage.setItem(QKEY,JSON.stringify(answers))}catch(e){storageIssue()}report()}
function byId(id){return chapters.find(c=>c.id===id)}
function report(){const n=chapters.filter(c=>progress.read[c.id]).length;try{parent.postMessage({type:'yst-progress',app:'zeri',text:`课程已读 ${n}/${chapters.length} · 章末题 ${Object.keys(answers).length}/${D.questionCount}`},location.origin)}catch(e){}}
function jump(id,sec){if(host){host.open(encodeURIComponent(id)+(sec?'~'+encodeURIComponent(sec):''));return}const target='#'+encodeURIComponent(id)+(sec?'~'+encodeURIComponent(sec):'');if(location.hash===target)route();else location.hash=target}
function card(c){return `<a class="lesson" href="#${c.id}"><span class="num">${String(c.n).padStart(2,'0')}</span><div><h3>${esc(c.title)}</h3><p>${esc(c.goal)}</p></div><span class="state ${progress.read[c.id]?'read':''}">${progress.read[c.id]?'已读':'未读'}</span></a>`}
function catalog(query=''){
 const term=query.trim().toLowerCase(),filtered=chapters.filter(c=>!term||(`${c.title} ${c.text} ${c.questions.map(q=>q.q).join(' ')}`).toLowerCase().includes(term));
 $('#catalog').innerHTML=['初级','中级','高级'].map((level,i)=>{
  const all=chapters.filter(c=>c.stage===level),list=filtered.filter(c=>c.stage===level);if(!list.length)return '';
  const count=all.filter(c=>progress.read[c.id]).length;
  return `<details class="level" ${term?'open':''}><summary>${level}<span>${all.length}章 · 已读${count}</span></summary>${list.map(card).join('')}</details>`;
 }).join('')||'<div class="empty">没有匹配内容，可换一个术语搜索。</div>';
}
function home(){
 current=null;noteSection=null;activeUtility=null;$('#course-reader').hidden=true;$('#course-reader').innerHTML='';$('#course-home').hidden=false;
 const readCount=chapters.filter(c=>progress.read[c.id]).length,next=byId(progress.last)||chapters.find(c=>!progress.read[c.id])||chapters[0];
 const wrong=Object.values(answers).filter(a=>!a.correct).length;
 $('#course-home').innerHTML=`<section class="hero"><div class="eyebrow">从会查规则，到能逐项核课</div><h1>把择日学成一条完整思路</h1><p>先立时间与山命坐标，再学日常用事、嫁娶造葬，最后进入正体五行与斗首复核。</p><div class="meta">${chapters.length}章 · ${D.questionCount}道章末题 · 原课案例拆解 · 逐页出处</div><div class="actions"><a class="btn primary" href="#${next.id}">${progress.last?'继续阅读':'开始第一章'}</a><a class="btn" href="#route">学习路线</a><a class="btn" href="#cases">案例索引</a><a class="btn" href="#wrong">错题 ${wrong}</a></div><div class="progress"><i style="width:${readCount/chapters.length*100}%"></i></div><div class="meta">手动已读 ${readCount}/${chapters.length} · 标记与答题记录分别保存</div></section><input class="search" id="course-search" type="search" placeholder="搜索课程全文、规则和题目" aria-label="搜索课程"><div id="catalog"></div><div class="source-notice">以《择日合集》PDF文件页序标源。原课存在异文的地方就近说明，不作为唯一答案。原PDF和本地分册不随网站发布。</div>`;
 catalog();$('#course-search').addEventListener('input',e=>catalog(e.target.value));
 scrollToPosition(0);report();
}
function gzClass(z){if('甲乙寅卯'.includes(z))return 'wood';if('丙丁巳午'.includes(z))return 'fire';if('戊己辰戌丑未'.includes(z))return 'earth';if('庚辛申酉'.includes(z))return 'metal';return 'water'}
function chart(c){if(!c||!c.pillars)return '';return `<aside class="chart"><div class="caption">${esc(c.people)} · ${esc(c.type)}${c.illustration?' · 不作真实候选':''}</div><div class="pillars">${c.pillars.map((p,i)=>`<div class="pillar"><small>${['年','月','日','时'][i]}</small>${p==='—'?'<span class="gz">—</span>':p.split('').map(z=>`<span class="gz ${gzClass(z)}">${z}</span>`).join('')}</div>`).join('')}</div></aside>`}
let tableObserver;const quizPages=new Map();
function prepareReading(root){
 if(tableObserver)tableObserver.disconnect();
 const intro=root.querySelector('.chapter-intro blockquote');
 if(intro&&!intro.dataset.typeset){intro.dataset.typeset='1';const pieces=intro.innerHTML.split(/<br\s*\/?\s*>/i);intro.innerHTML=pieces.filter(p=>p.trim()).map(p=>'<p>'+p+'</p>').join('')}
 const frames=[...root.querySelectorAll('.table-frame')];
 const activeChart=root.querySelector('.chart');
 const measure=()=>{root.style.setProperty('--chart-anchor-gap',activeChart?(Math.ceil(activeChart.offsetHeight)+12)+'px':'0px');frames.forEach(frame=>{const wrap=frame.querySelector('.table-wrap');if(!wrap)return;const max=wrap.scrollWidth-wrap.clientWidth;frame.classList.toggle('is-scrollable',max>2);frame.classList.toggle('can-scroll-back',wrap.scrollLeft>2);frame.classList.toggle('can-scroll-forward',wrap.scrollLeft<max-2)});};
 for(const frame of frames){const wrap=frame.querySelector('.table-wrap');if(!wrap.dataset.scrollBound){wrap.dataset.scrollBound='1';wrap.addEventListener('scroll',measure,{passive:true})}}
 if(window.ResizeObserver){tableObserver=new ResizeObserver(measure);frames.forEach(f=>tableObserver.observe(f));if(activeChart)tableObserver.observe(activeChart)}
 measure();requestAnimationFrame(measure);
 root.querySelectorAll('details').forEach(d=>{if(!d.dataset.tableBound){d.dataset.tableBound='1';d.addEventListener('toggle',measure)}});
}
function reader(c,sec){
 current=c.id;noteSection=sec||null;activeUtility=null;progress.last=c.id;save();drawn=new Map();$('#course-home').hidden=true;$('#course-home').innerHTML='';const box=$('#course-reader');box.hidden=false;
 const caseItem=(D.cases||[]).find(x=>x.chapter===c.id),prev=chapters[c.n-2],next=chapters[c.n];
 box.innerHTML=`<div class="reader-top"><a href="#">课程目录</a><span class="meta">${c.stage} · 第${c.n}/${chapters.length}章</span></div><h1 class="reader-title">${esc(c.title)}</h1><div class="meta"><a href="#${c.id}~${c.id}-s8">出处与页码</a> · ${c.questions.length}道章末题</div><div class="chapter-intro">${c.intro}</div>${chart(caseItem)}<div class="chapter-toc">${c.sections.filter(s=>!s.title.startsWith('六、')).map(s=>`<a href="#${c.id}~${encodeURIComponent(s.id)}">${esc(s.title.replace(/^[一二三四五六七八]、/,''))}</a>`).join('')}<a href="#${c.id}~quiz">章末题</a></div>${c.sections.map((s,i)=>`<details class="section" id="${s.id}" ${i<2?'open':''}><summary>${esc(s.title)}</summary><div class="section-body">${s.html}</div></details>`).join('')}<div class="reference-links"></div><section class="quiz-box" id="quiz"><h2>本章练一练</h2><div class="meta">每次一题，答后看解析，再点下一题。</div><div id="quiz-progress" class="meta" aria-live="polite"></div><div id="chapter-questions"></div><div class="actions"><button class="btn small" id="retry">再做本章</button></div></section><div class="read-control"><button class="btn ${progress.read[c.id]?'done':''}" id="mark-read">${progress.read[c.id]?'已标记为已读 · 可撤销':'标记本章为已读'}</button><span class="meta">由你决定是否读完</span></div><div class="chapter-pager">${prev?`<a class="btn" href="#${prev.id}">上一章 · ${esc(prev.title)}</a>`:'<a class="btn" href="#">课程目录</a>'}${next?`<a class="btn" href="#${next.id}">下一章 · ${esc(next.title)}</a>`:'<a class="btn" href="#">回课程目录</a>'}</div>`;
 renderChapterQuiz(c);
 $('#mark-read').onclick=()=>{progress.read[c.id]=!progress.read[c.id];save();$('#mark-read').textContent=progress.read[c.id]?'已标记为已读 · 可撤销':'标记本章为已读';$('#mark-read').classList.toggle('done',!!progress.read[c.id])};
 $('#retry').onclick=()=>{for(const q of c.questions)delete answers[q.id];save();quizPages.set(c.id,0);renderChapterQuiz(c)};
 const links=box.querySelector('.reference-links');links.innerHTML=`<a class="btn small" href="index.html?review=${c.id}">本课知识点速查</a>`;
 if(c.n===30)links.insertAdjacentHTML('beforeend','<a class="btn small" href="#mountains">二十四山原表查阅</a>');
 requestAnimationFrame(()=>{if(sec)focusSection(sec);else scrollToPosition(positions[c.id]||0)});
}
function shuffled(arr){return arr.map(x=>({x,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.x)}
function renderChapterQuiz(c,index=quizPages.get(c.id)||0){
 quizPages.set(c.id,index);const parent=$('#chapter-questions');parent.innerHTML='';
 $('#quiz-progress').textContent=index<c.questions.length?`第 ${index+1} / ${c.questions.length} 题`:`已完成 ${c.questions.length} 题`;
 if(index>=c.questions.length){const right=c.questions.filter(q=>answers[q.id]?.correct).length;parent.innerHTML=`<div class="quiz-result" role="status"><h3>本章练习已完成</h3><p>答对 ${right} / ${c.questions.length} 题。可以回看讲解，或再做本章。</p></div>`;return}
 const q=c.questions[index],next=document.createElement('button');next.className='btn primary quiz-next';next.dataset.nextQuestion='';next.textContent=index===c.questions.length-1?'完成本章练习':'下一题';
 const setReady=ready=>{next.hidden=!ready;next.disabled=!ready};
 appendQuestion(q,c,parent,setReady);setReady(!!answers[q.id]);parent.appendChild(next);
 next.onclick=()=>{if(next.disabled)return;renderChapterQuiz(c,index+1);$('#quiz').scrollIntoView({block:'start'})};
}
function appendQuestion(q,c,parent,onAnswered){
 const div=document.createElement('div');div.className='question';div.dataset.qid=q.id;
 const opts=shuffled([q.a,...q.w]);drawn.set(q.id,opts);
 div._onAnswered=onAnswered;div.id=q.id;div.innerHTML=`<h3>${esc(q.q)}</h3><div class="options">${opts.map((v,i)=>`<button class="option" data-qi="${i}">${esc(v)}</button>`).join('')}</div><div class="feedback" aria-live="polite"></div>`;
 div.querySelectorAll('.option').forEach(btn=>btn.onclick=()=>{
  const chosen=opts[+btn.dataset.qi];answers[q.id]={choice:chosen,correct:chosen===q.a,at:Date.now(),tries:(answers[q.id]?.tries||0)+1,rev:q.rev};save();feedback(div,q,c);if(onAnswered)onAnswered(true);
 });parent.appendChild(div);if(answers[q.id])feedback(div,q,c);
}
function feedback(div,q,c){
 const ans=answers[q.id];div.querySelectorAll('.option').forEach(btn=>{const value=btn.textContent;btn.disabled=true;btn.classList.toggle('correct',value===q.a);btn.classList.toggle('wrong',!ans.correct&&value===ans.choice)});
 const section=c.sections.find(s=>s.title===q.sec);
 div.querySelector('.feedback').innerHTML=`<strong>${ans.correct?'回答正确':'正确答案：'+esc(q.a)}</strong><br>${esc(q.e)}<br><a href="#${c.id}~${encodeURIComponent(section?.id||'')}">回看本章相关讲解</a>${!ans.correct?'<br><button class="btn small" data-retry-question>重做此题</button>':''}`;
 const retry=div.querySelector('[data-retry-question]');if(retry)retry.onclick=()=>{const copy={...q};const old=answers[q.id];delete answers[q.id];const holder=document.createElement('div');appendQuestion(copy,c,holder,div._onAnswered);answers[q.id]=old;div.replaceWith(holder.firstElementChild);if(div._onAnswered)div._onAnswered(false)};
}
function focusSection(id){if(current){const c=byId(current),i=c.questions.findIndex(q=>q.id===id);if(i>=0&& !document.getElementById(id))renderChapterQuiz(c,i)}const el=document.getElementById(id);if(!el)return;noteSection=id;for(let p=el;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;el.scrollIntoView({block:'start'})}
function utility(which,ref){
 current=null;noteSection=null;activeUtility=which;$('#course-home').hidden=true;$('#course-home').innerHTML='';const box=$('#course-reader');box.hidden=false;
 box.innerHTML='<div class="reader-top"><a href="#">课程目录</a></div>';
 if(which==='route'){box.insertAdjacentHTML('beforeend','<h1 class="reader-title">学习路线与资料范围</h1>'+D.route);}
 else if(which==='mountains'){
  box.insertAdjacentHTML('beforeend','<h1 class="reader-title">二十四山原表查阅</h1><p class="source-notice">据PDF第1601–1628页自排版表提取，仅整理断行。保留原表条件与异文；未逐条裁定的条文不作自动选课结论。可与第1631–1669页另一版本对照。</p><label>选择坐山 <select id="mountain-pick" class="btn">'+D.mountains.map(m=>`<option value="${m.id}">${m.title}</option>`).join('')+'</select></label><div id="mountain-text"></div>');
  const draw=()=>{const m=D.mountains.find(m=>m.id===$('#mountain-pick').value);activeMountain=m.id;$('#mountain-text').innerHTML=`<h2>${esc(m.title)}</h2><div class="meta">PDF ${m.pages.join('、')}页</div>`+m.text.split(/\n+/).filter(Boolean).map(p=>'<p>'+esc(p)+'</p>').join('')};if(ref&&D.mountains.some(m=>m.id===ref))$('#mountain-pick').value=ref;$('#mountain-pick').onchange=draw;draw();
 }
 else if(which==='cases'){
  box.insertAdjacentHTML('beforeend','<h1 class="reader-title">原课案例索引</h1><p class="meta">完整日课、部分日课、局部规则示例和格局示意分别标明；缺柱保留空缺，不补造结果。</p>'+(D.cases||[]).map(x=>`<a class="lesson" href="#${x.chapter}~${x.chapter}-s4"><div><h3>${esc(x.title)}</h3><p>${esc(x.type)} · PDF ${x.pages.join('、')}页</p><p>${esc(x.note)}</p></div></a>`).join(''));
 }else{
  box.insertAdjacentHTML('beforeend','<h1 class="reader-title">章末错题</h1><p class="meta">显示最近一次回答仍然错误的题；可以直接重做此题，答对后下次不再列入。</p><div id="wrong-list"></div>');
  let n=0;for(const c of chapters)for(const q of c.questions)if(answers[q.id]&&!answers[q.id].correct){n++;appendQuestion(q,c,$('#wrong-list'))}
  if(!n)$('#wrong-list').innerHTML='<div class="empty">目前没有未改正的章末错题。</div>';
 }
 scrollToPosition(0);
}
function route(hash=location.hash){flushPosition();let id='',sec=null;try{const parts=String(hash).replace(/^#/,'').split('~');id=decodeURIComponent(parts[0]||'');sec=parts[1]?decodeURIComponent(parts[1]):null}catch(e){home();return}if(['route','cases','wrong','mountains'].includes(id))utility(id,sec);else {const c=byId(id);if(c){if(current===c.id&&!$('#course-reader').hidden){if(sec)focusSection(sec)}else reader(c,sec)}else home()}prepareReading($('#course-reader'))}
let timer,pendingPosition=null;
function flushPosition(){clearTimeout(timer);if(!pendingPosition)return;positions[pendingPosition.id]=pendingPosition.y;pendingPosition=null;try{localStorage.setItem(POS,JSON.stringify(positions))}catch(e){storageIssue()}}
scroller.addEventListener('scroll',()=>{if(!current||!isActive())return;clearTimeout(timer);pendingPosition={id:current,y:Math.max(0,Math.round(scrollTop()))};timer=setTimeout(flushPosition,180)},{passive:true});
window.addEventListener('pagehide',flushPosition);
document.addEventListener('click',e=>{const section=e.target.closest&&e.target.closest('#course-reader .section');const q=e.target.closest&&e.target.closest('#course-reader .question');if(section)noteSection=section.id;else if(q)noteSection=q.id},true);
const noteHook={blocks:'.section-body p,.section-body li,.section-body tr,.question h3,.feedback',loc:()=>current?{v:'course',id:current,sec:noteSection}:activeUtility==='mountains'?{v:'course-ref',id:'mountains',mountain:activeMountain}:null,go:l=>{if(l&&l.v==='course')jump(l.id,l.sec);else if(l&&l.v==='course-ref')jump('mountains',l.mountain);else if(l&&l.v){if(host)host.openTool(l);else location.href='index.html?knowledge='+encodeURIComponent(l.id||'')}},label:()=>{if(!current)return activeUtility==='mountains'?'二十四山 · '+activeMountain+'山':'择日课程';const c=byId(current),s=c.sections.find(s=>s.id===noteSection);return '第'+c.n+'章 '+c.title+(s?' · '+s.title:noteSection&&noteSection.includes('-q')?' · 章末题':'')}};
let lastHash=null;
const api={hook:noteHook,prepareReading,pause:flushPosition,activate(hash,force=false){hash=String(hash||'').replace(/^#/,'');if(force||lastHash!==hash){route(hash);lastHash=hash;return false}else{prepareReading($('#course-reader'));return true}}};
window.ZeriCourse=api;
if(host){host.ready(api)}else{window.YGN_HOOK=noteHook;window.addEventListener('hashchange',()=>route());route()}
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
