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
const chapters=D.chapters,projects=D.projects||[],documents=chapters.concat(projects);
const learningProjects=[...projects].sort((a,b)=>(a.order||a.n)-(b.order||b.n));
let projectReturn=null;
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
if(!object(progress))progress={};if(!object(progress.read))progress.read={};
if(!object(answers))answers={};if(!object(positions))positions={};
const knownChapters=new Set(documents.map(c=>c.id)),knownQuestions=new Set(chapters.flatMap(c=>c.questions.map(q=>q.id)));
progress.read=Object.fromEntries(Object.entries(progress.read).filter(([id,v])=>knownChapters.has(id)&&typeof v==='boolean'));
positions=Object.fromEntries(Object.entries(positions).filter(([id,y])=>knownChapters.has(id)&&Number.isFinite(y)&&y>=0));
for(const id of Object.keys(answers))if(!knownQuestions.has(id))delete answers[id];
for(const c of chapters)for(const q of c.questions){const a=answers[q.id];if(a&&(!object(a)||![q.a,...q.w].includes(a.choice)||a.correct!==(a.choice===q.a)||(a.rev&&a.rev!==q.rev)))delete answers[q.id]}
function storageIssue(){let el=document.getElementById('storage-issue');if(!el){el=document.createElement('div');el.id='storage-issue';el.className='source-notice';if(host)root.prepend(el);else document.querySelector('header').after(el)}el.textContent='当前浏览器未能保存学习记录。本页仍可学习，请检查浏览器存储空间后重试。'}
function save(){try{localStorage.setItem(KEY,JSON.stringify(progress));localStorage.setItem(QKEY,JSON.stringify(answers))}catch(e){storageIssue()}report()}
function byId(id){return documents.find(c=>c.id===id)}
function report(){const n=chapters.filter(c=>progress.read[c.id]).length;try{parent.postMessage({type:'yst-progress',app:'zeri',text:`项目已读 ${projects.filter(p=>progress.read[p.id]).length}/${projects.length} · 知识章 ${n}/${chapters.length} · 章末题 ${Object.keys(answers).length}/${D.questionCount}`},location.origin)}catch(e){}}
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
function projectCards(query=''){
 const term=query.trim().toLowerCase(),groups=[...new Set(learningProjects.map(p=>p.group||'项目学习'))];
 $('#project-list').innerHTML=groups.map((group,i)=>{const list=learningProjects.filter(p=>(p.group||'项目学习')===group&&(!term||(p.title+p.goal+p.text).toLowerCase().includes(term)));if(!list.length)return '';return `<details class="project-group" ${i===0||term?'open':''}><summary>${esc(group)} · ${list.length}项</summary>${list.map(p=>`<a class="project-card" href="#${p.id}"><span class="project-number">项目${p.n}</span><h2>${esc(p.title)}</h2><p>${esc(p.goal)}</p><div class="project-output">交付：${esc(p.outcome)}</div><span class="meta">${progress.read[p.id]?'已读 · 可继续练习':'从任务开始，按步骤跟做'}　›</span></a>`).join('')}</details>`}).join('')||'<p class="empty">没有匹配项目，可在下方知识资料中继续查找。</p>';
}
function home(){
 current=null;noteSection=null;activeUtility=null;$('#course-reader').hidden=true;$('#course-reader').innerHTML='';$('#course-home').hidden=false;
 const readCount=projects.filter(p=>progress.read[p.id]).length,last=projects.find(p=>p.id===(progress.lastProject||progress.last)),next=last||learningProjects.find(p=>!progress.read[p.id])||learningProjects[0];
 const wrong=Object.values(answers).filter(a=>!a.correct).length;
 $('#course-home').innerHTML=`<section class="hero"><div class="eyebrow">做一件事，学会一段择日流程</div><h1>先选你要完成的择日任务</h1><p>从开市复工开始：先接任务，再取得资料，走到哪一步就学那一步的知识，最后交出可复核的择日记录。</p><div class="actions"><a class="btn primary" href="#${next.id}">${last?'继续项目'+last.n:'开始项目1：开市复工'}</a><a class="btn" href="#route">项目学习路线</a></div><div class="progress"><i style="width:${readCount/Math.max(1,projects.length)*100}%"></i></div><div class="meta">${projects.length}个项目 · 手动已读${readCount}个 · 用到的知识在步骤内展开</div></section><input class="search" id="course-search" type="search" placeholder="搜任务或知识，例如入宅、冲山、五鼠遁" aria-label="搜索课程"><div id="project-list"></div><details class="knowledge-library" id="knowledge-library"><summary>按问题查知识 · ${chapters.length}章资料</summary><p class="meta">这是项目中调用的资料库。需要哪条，再查哪条；也保留原章、章末题和已有学习记录。</p><div class="actions"><a class="btn small" href="#cases">原例索引</a><a class="btn small" href="#wrong">知识题错题 ${wrong}</a></div><div id="catalog"></div></details>`;
 catalog();projectCards();$('#course-search').addEventListener('input',e=>{catalog(e.target.value);projectCards(e.target.value);$('#knowledge-library').open=!!e.target.value.trim()});
 scrollToPosition(0);report();
}
function projectResources(p,step){
 return (p.resources[String(step)]||[]).map(r=>{const source=chapters.find(c=>c.id===r.chapter),sec=source.sections[r.section-1];let content=sec.html;if(Number.isInteger(r.table)){const t=document.createElement('template');t.innerHTML=sec.html;content=t.content.querySelectorAll('.table-frame')[r.table].outerHTML}return `<details class="project-resource"><summary>${esc(r.label)}</summary><p class="meta">本步查表资料 · ${esc(source.title)}</p>${content}<a class="btn small" href="#${source.id}~${sec.id}">查看这条知识的完整讲解</a></details>`}).join('');
}
function projectReader(p,sec){
 current=p.id;noteSection=sec||null;activeUtility=null;progress.last=p.id;progress.lastProject=p.id;projectReturn={id:p.id,sec:sec||p.sections[0].id};save();drawn=new Map();$('#course-home').hidden=true;$('#course-home').innerHTML='';const box=$('#course-reader');box.hidden=false;
 const sourceCase=p.example||(D.cases||[]).find(c=>c.id===p.caseId),caseItem=sourceCase&&{...sourceCase,pillars:sourceCase.alternative||sourceCase.pillars,people:p.chartPeople||sourceCase.people,labels:p.chartLabels,role:p.chartRole,type:p.chartType??(p.example?'本项目对照盘':sourceCase.alternative?'原课改后方案':'原课给定方案')},prev=learningProjects[learningProjects.indexOf(p)-1],next=learningProjects[learningProjects.indexOf(p)+1];
 box.innerHTML=`<div class="reader-top"><a href="#">项目目录</a><span class="meta">项目 ${p.n} · ${esc(p.group||'项目学习')}</span></div><h1 class="reader-title">${esc(p.title)}</h1>${p.prerequisites?.length?`<p class="meta project-prerequisites">需要时先跟做：${p.prerequisites.map(id=>`<a href="#${id}">项目${byId(id).n}</a>`).join(' · ')}</p>`:''}<div class="project-deliverable"><strong>本项目交付</strong><p>${esc(p.outcome)}</p></div><div class="chapter-intro">${p.intro}</div>${chart(caseItem)}<div class="chapter-toc">${p.sections.map(x=>`<a href="#${p.id}~${x.id}">${esc(x.title)}</a>`).join('')}</div>${p.sections.map((x,i)=>`<details class="section project-step" id="${x.id}" ${i<2?'open':''}><summary>${esc(x.title)}</summary><div class="section-body">${x.html}${projectResources(p,i+1)}</div></details>`).join('')}<div class="read-control"><button class="btn ${progress.read[p.id]?'done':''}" id="mark-read">${progress.read[p.id]?'本项目已读 · 可撤销':'标记本项目为已读'}</button><span class="meta">已读与已完成实际任务分开，由你确认。</span></div><div class="chapter-pager">${prev?`<a class="btn" href="#${prev.id}">上一项目 · ${esc(prev.title)}</a>`:'<a class="btn" href="#">项目目录</a>'}${next?`<a class="btn" href="#${next.id}">下一项目 · ${esc(next.title)}</a>`:'<a class="btn" href="#">回项目目录</a>'}</div><div class="source-notice">规则来自项目各步骤所列知识资料，案例只采用原课已给字段；操作次序为教学编排。原文出处供核对，完成项目不以另读原PDF为前提。</div>`;
 $('#mark-read').onclick=()=>{progress.read[p.id]=!progress.read[p.id];save();$('#mark-read').textContent=progress.read[p.id]?'本项目已读 · 可撤销':'标记本项目为已读';$('#mark-read').classList.toggle('done',!!progress.read[p.id])};
 prepareReading(box);requestAnimationFrame(()=>{if(sec)focusSection(sec);else scrollToPosition(positions[p.id]||0)});
}
function gzClass(z){if('甲乙寅卯'.includes(z))return 'wood';if('丙丁巳午'.includes(z))return 'fire';if('戊己辰戌丑未'.includes(z))return 'earth';if('庚辛申酉'.includes(z))return 'metal';return 'water'}
function chart(c){
 if(!c||!c.pillars)return '';
 const role=c.illustration?'格局示意 · 不作真实候选':c.role||'用事日课',labels=c.labels||(c.illustration?['示意年','示意月','示意日','示意时']:['用事年','用事月','用事日','用事时']);
 return `<aside class="chart"><div class="caption"><strong>${esc(role)}</strong><br>${esc(c.people)}${c.type?' · '+esc(c.type):''}</div><div class="pillars">${c.pillars.map((p,i)=>`<div class="pillar"><small>${esc(labels[i])}</small>${p==='—'?'<span class="gz">—</span>':p.split('').map(z=>`<span class="gz ${gzClass(z)}">${z}</span>`).join('')}</div>`).join('')}</div>${c.pillars.includes('—')?'<div class="meta">— 表示原例未给该柱。</div>':''}</aside>`;
}
let tableObserver;const quizPages=new Map();
function prepareReading(root){
 if(tableObserver)tableObserver.disconnect();
 const intro=root.querySelector('.chapter-intro blockquote');
 if(intro&&!intro.dataset.typeset){intro.dataset.typeset='1';const pieces=intro.innerHTML.split(/<br\s*\/?\s*>/i);intro.innerHTML=pieces.filter(p=>p.trim()).map(p=>'<p>'+p+'</p>').join('')}
 const frames=[...root.querySelectorAll('.table-frame')];
 const activeChart=root.querySelector('.chart');
 const measure=()=>{root.style.setProperty('--chart-anchor-gap',activeChart?(Math.ceil(activeChart.offsetHeight)+12)+'px':'0px');frames.forEach(frame=>{const wrap=frame.querySelector('.table-wrap');if(!wrap)return;const table=wrap.querySelector('.table-pinned');if(table){const cells=[...table.rows[0].cells];table.classList.toggle('pin-disabled',wrap.clientWidth-cells[0].offsetWidth<Math.max(...cells.slice(1).map(c=>c.offsetWidth))-1)}const max=wrap.scrollWidth-wrap.clientWidth;frame.classList.toggle('is-scrollable',max>2);frame.classList.toggle('can-scroll-back',wrap.scrollLeft>2);frame.classList.toggle('can-scroll-forward',wrap.scrollLeft<max-2)});};
 for(const frame of frames){const wrap=frame.querySelector('.table-wrap');if(!wrap.dataset.scrollBound){wrap.dataset.scrollBound='1';wrap.addEventListener('scroll',measure,{passive:true})}}
 if(window.ResizeObserver){tableObserver=new ResizeObserver(measure);frames.forEach(f=>tableObserver.observe(f));if(activeChart)tableObserver.observe(activeChart)}
 measure();requestAnimationFrame(measure);
 root.querySelectorAll('details').forEach(d=>{if(!d.dataset.tableBound){d.dataset.tableBound='1';d.addEventListener('toggle',measure)}});
}
function reader(c,sec){
 if(c.project){projectReader(c,sec);return}
 if(current&&byId(current)?.project)projectReturn={id:current,sec:noteSection||byId(current).sections[0].id};
 current=c.id;noteSection=sec||null;activeUtility=null;progress.last=c.id;save();drawn=new Map();$('#course-home').hidden=true;$('#course-home').innerHTML='';const box=$('#course-reader');box.hidden=false;
 const caseItem=(D.cases||[]).find(x=>x.chapter===c.id),prev=chapters[c.n-2],next=chapters[c.n];
 box.innerHTML=`<div class="reader-top"><a href="#">课程目录</a><span class="meta">${c.stage} · 第${c.n}/${chapters.length}章</span></div><h1 class="reader-title">${esc(c.title)}</h1><div class="meta"><a href="#${c.id}~${c.id}-s8">出处与页码</a> · ${c.questions.length}道章末题</div><div class="chapter-intro">${c.intro}</div>${chart(caseItem)}<div class="chapter-toc">${c.sections.filter(s=>!s.title.startsWith('六、')).map(s=>`<a href="#${c.id}~${encodeURIComponent(s.id)}">${esc(s.title.replace(/^[一二三四五六七八]、/,''))}</a>`).join('')}<a href="#${c.id}~quiz">章末题</a></div>${c.sections.map((s,i)=>`<details class="section" id="${s.id}" ${i<2?'open':''}><summary>${esc(s.title)}</summary><div class="section-body">${s.html}</div></details>`).join('')}<div class="reference-links"></div><section class="quiz-box" id="quiz"><h2>本章练一练</h2><div class="meta">每次一题，答后看解析，再点下一题。</div><div id="quiz-progress" class="meta" aria-live="polite"></div><div id="chapter-questions"></div><div class="actions"><button class="btn small" id="retry">再做本章</button></div></section><div class="read-control"><button class="btn ${progress.read[c.id]?'done':''}" id="mark-read">${progress.read[c.id]?'已标记为已读 · 可撤销':'标记本章为已读'}</button><span class="meta">由你决定是否读完</span></div><div class="chapter-pager">${prev?`<a class="btn" href="#${prev.id}">上一章 · ${esc(prev.title)}</a>`:'<a class="btn" href="#">课程目录</a>'}${next?`<a class="btn" href="#${next.id}">下一章 · ${esc(next.title)}</a>`:'<a class="btn" href="#">回课程目录</a>'}</div>`;
 renderChapterQuiz(c);
 $('#mark-read').onclick=()=>{progress.read[c.id]=!progress.read[c.id];save();$('#mark-read').textContent=progress.read[c.id]?'已标记为已读 · 可撤销':'标记本章为已读';$('#mark-read').classList.toggle('done',!!progress.read[c.id])};
 $('#retry').onclick=()=>{for(const q of c.questions)delete answers[q.id];save();quizPages.set(c.id,0);renderChapterQuiz(c)};
 if(projectReturn)box.querySelector('.reader-top').insertAdjacentHTML('beforeend',`<a href="#${projectReturn.id}~${projectReturn.sec}">回到项目${byId(projectReturn.id).n}当前步骤</a>`);
 const links=box.querySelector('.reference-links');links.innerHTML=`<a class="btn small" href="index.html?review=${c.id}">本课知识点速查</a>`;
 if(projectReturn)links.insertAdjacentHTML('afterbegin',`<a class="btn primary small" href="#${projectReturn.id}~${projectReturn.sec}">回到项目${byId(projectReturn.id).n}当前步骤</a>`);
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
const noteHook={blocks:'.section-body p,.section-body li,.section-body tr,.question h3,.feedback',loc:()=>current?{v:'course',id:current,sec:noteSection}:activeUtility==='mountains'?{v:'course-ref',id:'mountains',mountain:activeMountain}:null,go:l=>{if(l&&l.v==='course')jump(l.id,l.sec);else if(l&&l.v==='course-ref')jump('mountains',l.mountain);else if(l&&l.v){if(host)host.openTool(l);else location.href='index.html?knowledge='+encodeURIComponent(l.id||'')}},label:()=>{if(!current)return activeUtility==='mountains'?'二十四山 · '+activeMountain+'山':'择日课程';const c=byId(current),s=c.sections.find(s=>s.id===noteSection);return (c.project?'项目'+c.n:'第'+c.n+'章')+' '+c.title+(s?' · '+s.title:noteSection&&noteSection.includes('-q')?' · 章末题':'')}};
let lastHash=null;
const api={hook:noteHook,prepareReading,pause:flushPosition,activate(hash,force=false){hash=String(hash||'').replace(/^#/,'');if(force||lastHash!==hash){route(hash);lastHash=hash;return false}else{prepareReading($('#course-reader'));return true}}};
window.ZeriCourse=api;
if(host){host.ready(api)}else{window.YGN_HOOK=noteHook;window.addEventListener('hashchange',()=>route());route()}
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
