/* 教材正文与题目均由 content 构建；学习状态只由用户操作改变。 */
(function(){
'use strict';
const D=window.ZERI_COURSE,KEY='zeri_course_v1',QKEY='zeri_course_answers_v1',POS='zeri_course_positions_v1';
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(k,def){try{return JSON.parse(localStorage.getItem(k))||def}catch(e){return def}}
let progress=read(KEY,{read:{},last:null}),answers=read(QKEY,{}),positions=read(POS,{}),current=null,noteSection=null,activeUtility=null,activeMountain=null,drawn=new Map();
const chapters=D.chapters;
function save(){localStorage.setItem(KEY,JSON.stringify(progress));localStorage.setItem(QKEY,JSON.stringify(answers));report()}
function byId(id){return chapters.find(c=>c.id===id)}
function report(){const n=chapters.filter(c=>progress.read[c.id]).length;try{parent.postMessage({type:'yst-progress',app:'zeri',text:`课程已读 ${n}/${chapters.length} · 章末题 ${Object.keys(answers).length}/${D.questionCount}`},location.origin)}catch(e){}}
function jump(id,sec){const target='#'+encodeURIComponent(id)+(sec?'~'+encodeURIComponent(sec):'');if(location.hash===target)route();else location.hash=target}
function card(c){return `<a class="lesson" href="#${c.id}"><span class="num">${String(c.n).padStart(2,'0')}</span><div><h3>${esc(c.title)}</h3><p>${esc(c.goal)}</p></div><span class="state ${progress.read[c.id]?'read':''}">${progress.read[c.id]?'已读':'未读'}</span></a>`}
function catalog(query=''){
 const term=query.trim().toLowerCase(),filtered=chapters.filter(c=>!term||(`${c.title} ${c.text} ${c.questions.map(q=>q.q).join(' ')}`).toLowerCase().includes(term));
 $('#catalog').innerHTML=['初级','中级','高级'].map((level,i)=>{
  const all=chapters.filter(c=>c.stage===level),list=filtered.filter(c=>c.stage===level);if(!list.length)return '';
  const count=all.filter(c=>progress.read[c.id]).length;
  return `<details class="level" ${term||i===0?'open':''}><summary>${level}<span>${all.length}章 · 已读${count}</span></summary>${list.map(card).join('')}</details>`;
 }).join('')||'<div class="empty">没有匹配内容，可换一个术语搜索。</div>';
}
function home(){
 current=null;noteSection=null;activeUtility=null;$('#course-reader').hidden=true;$('#course-reader').innerHTML='';$('#course-home').hidden=false;
 const readCount=chapters.filter(c=>progress.read[c.id]).length,next=byId(progress.last)||chapters.find(c=>!progress.read[c.id])||chapters[0];
 const wrong=Object.values(answers).filter(a=>!a.correct).length;
 $('#course-home').innerHTML=`<section class="hero"><div class="eyebrow">从会查规则，到能逐项核课</div><h1>把择日学成一条完整思路</h1><p>先立时间与山命坐标，再学日常用事、嫁娶造葬，最后进入正体五行与斗首复核。</p><div class="meta">${chapters.length}章 · ${D.questionCount}道章末题 · 原课案例拆解 · 逐页出处</div><div class="actions"><a class="btn primary" href="#${next.id}">${progress.last?'继续阅读':'开始第一章'}</a><a class="btn" href="#route">学习路线</a><a class="btn" href="#cases">案例索引</a><a class="btn" href="#wrong">错题 ${wrong}</a></div><div class="progress"><i style="width:${readCount/chapters.length*100}%"></i></div><div class="meta">手动已读 ${readCount}/${chapters.length} · 标记与答题记录分别保存</div></section><input class="search" id="course-search" type="search" placeholder="搜索课程全文、规则和题目" aria-label="搜索课程"><div id="catalog"></div><div class="actions"><a class="btn small" href="course-textbook.md" download>下载课程 Markdown</a><button class="btn small" data-export>导出学习记录</button><a class="btn small" href="https://nevergiveup0618.github.io/all-project/backup.html">全科进度备份</a></div><div class="source-notice">以《择日合集》PDF文件页序标源。原课存在异文的地方就近说明，不作为唯一答案。原PDF和本地分册不随网站发布。</div>`;
 catalog();$('#course-search').addEventListener('input',e=>catalog(e.target.value));$('[data-export]').onclick=exportProgress;
 window.scrollTo(0,0);report();
}
function gzClass(z){if('甲乙寅卯'.includes(z))return 'wood';if('丙丁巳午'.includes(z))return 'fire';if('戊己辰戌丑未'.includes(z))return 'earth';if('庚辛申酉'.includes(z))return 'metal';return 'water'}
function chart(c){if(!c||!c.pillars)return '';return `<aside class="chart"><div class="caption">${esc(c.people)} · ${esc(c.type)}${c.illustration?' · 不作真实候选':''}</div><div class="pillars">${c.pillars.map((p,i)=>`<div class="pillar"><small>${['年','月','日','时'][i]}</small>${p==='—'?'<span class="gz">—</span>':p.split('').map(z=>`<span class="gz ${gzClass(z)}">${z}</span>`).join('')}</div>`).join('')}</div></aside>`}
function reader(c,sec){
 current=c.id;noteSection=sec||null;activeUtility=null;progress.last=c.id;save();drawn=new Map();$('#course-home').hidden=true;$('#course-home').innerHTML='';const box=$('#course-reader');box.hidden=false;
 const caseItem=(D.cases||[]).find(x=>x.chapter===c.id),prev=chapters[c.n-2],next=chapters[c.n];
 box.innerHTML=`<div class="reader-top"><a href="#">课程目录</a><span class="meta">${c.stage} · 第${c.n}/${chapters.length}章</span></div><h1 class="reader-title">${esc(c.title)}</h1><div class="meta">PDF ${c.refs.join('、')}页 · ${c.questions.length}道章末题</div><div class="chapter-intro">${c.intro}</div>${chart(caseItem)}<div class="chapter-toc">${c.sections.filter(s=>!s.title.startsWith('六、')).map(s=>`<a href="#${c.id}~${encodeURIComponent(s.id)}">${esc(s.title.replace(/^[一二三四五六七八]、/,''))}</a>`).join('')}<a href="#${c.id}~quiz">章末题</a></div>${c.sections.map((s,i)=>`<details class="section" id="${s.id}" ${i<2?'open':''}><summary>${esc(s.title)}</summary><div class="section-body">${s.html}</div></details>`).join('')}<div class="reference-links">${c.keys.map(k=>`<a class="btn small" href="index.html?knowledge=${encodeURIComponent(k)}">关联速查 ${esc(k)}</a>`).join('')}</div><section class="quiz-box" id="quiz"><h2>本章练一练</h2><div class="meta">当场判断，答后看解析；不自动跳题，也不自动标已读。</div><div id="chapter-questions"></div><div class="actions"><button class="btn small" id="retry">再做本章</button></div></section><div class="read-control"><button class="btn ${progress.read[c.id]?'done':''}" id="mark-read">${progress.read[c.id]?'已标记为已读 · 可撤销':'标记本章为已读'}</button><span class="meta">由你决定是否读完</span></div><div class="chapter-pager">${prev?`<a class="btn" href="#${prev.id}">上一章 · ${esc(prev.title)}</a>`:'<a class="btn" href="#">课程目录</a>'}${next?`<a class="btn" href="#${next.id}">下一章 · ${esc(next.title)}</a>`:'<a class="btn" href="#">回课程目录</a>'}</div>`;
 for(const q of c.questions)appendQuestion(q,c,$('#chapter-questions'));
 $('#mark-read').onclick=()=>{progress.read[c.id]=!progress.read[c.id];save();$('#mark-read').textContent=progress.read[c.id]?'已标记为已读 · 可撤销':'标记本章为已读';$('#mark-read').classList.toggle('done',!!progress.read[c.id])};
 $('#retry').onclick=()=>{for(const q of c.questions)delete answers[q.id];save();$('#chapter-questions').innerHTML='';for(const q of c.questions)appendQuestion(q,c,$('#chapter-questions'))};
 const links=box.querySelector('.reference-links');links.innerHTML=(c.links||[]).map(l=>`<a class="btn small" href="index.html?knowledge=${encodeURIComponent(l.id)}">速查 · ${esc(l.title)}</a>`).join('');
 if(c.n===15)links.insertAdjacentHTML('beforeend','<a class="btn small" href="index.html?tab=calc&sub=nv">查询六十甲子女命全表</a>');
 if(c.n===30)links.insertAdjacentHTML('beforeend','<a class="btn small" href="#mountains">二十四山原表查阅</a>');
 requestAnimationFrame(()=>{if(sec)focusSection(sec);else window.scrollTo(0,positions[c.id]||0)});
}
function shuffled(arr){return arr.map(x=>({x,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.x)}
function appendQuestion(q,c,parent){
 const div=document.createElement('div');div.className='question';div.dataset.qid=q.id;
 const opts=shuffled([q.a,...q.w]);drawn.set(q.id,opts);
 div.innerHTML=`<h3>${esc(q.q)}</h3><div class="options">${opts.map((v,i)=>`<button class="option" data-qi="${i}">${esc(v)}</button>`).join('')}</div><div class="feedback" aria-live="polite"></div>`;
 div.querySelectorAll('.option').forEach(btn=>btn.onclick=()=>{
  const chosen=opts[+btn.dataset.qi];answers[q.id]={choice:chosen,correct:chosen===q.a,at:Date.now(),tries:(answers[q.id]?.tries||0)+1};save();feedback(div,q,c);
 });parent.appendChild(div);if(answers[q.id])feedback(div,q,c);
}
function feedback(div,q,c){
 const ans=answers[q.id];div.querySelectorAll('.option').forEach(btn=>{const value=btn.textContent;btn.disabled=true;btn.classList.toggle('correct',value===q.a);btn.classList.toggle('wrong',!ans.correct&&value===ans.choice)});
 const section=c.sections.find(s=>s.title===q.sec);
 div.querySelector('.feedback').innerHTML=`<strong>${ans.correct?'回答正确':'正确答案：'+esc(q.a)}</strong><br>${esc(q.e)}<br><a href="#${c.id}~${encodeURIComponent(section?.id||'')}">回看本章相关讲解</a>`;
}
function focusSection(id){const el=document.getElementById(id);if(!el)return;for(let p=el;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;el.scrollIntoView({block:'start'})}
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
  box.insertAdjacentHTML('beforeend','<h1 class="reader-title">章末错题</h1><p class="meta">显示最近一次回答仍然错误的题；回到章节点“再做本章”可重新作答。</p><div id="wrong-list"></div>');
  let n=0;for(const c of chapters)for(const q of c.questions)if(answers[q.id]&&!answers[q.id].correct){n++;appendQuestion(q,c,$('#wrong-list'))}
  if(!n)$('#wrong-list').innerHTML='<div class="empty">目前没有未改正的章末错题。</div>';
 }
 window.scrollTo(0,0);
}
function route(){const raw=location.hash.slice(1),[part,sec]=raw.split('~'),id=decodeURIComponent(part||'');if(['route','cases','wrong','mountains'].includes(id))utility(id,sec?decodeURIComponent(sec):null);else {const c=byId(id);if(c)reader(c,sec?decodeURIComponent(sec):null);else home()}}
function exportProgress(){
 const blob=new Blob([JSON.stringify({v:1,app:'zeri-course',at:new Date().toISOString(),progress,answers,positions},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='择日课程学习记录.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
let timer;window.addEventListener('scroll',()=>{if(!current)return;clearTimeout(timer);timer=setTimeout(()=>{positions[current]=Math.round(scrollY);localStorage.setItem(POS,JSON.stringify(positions))},180)},{passive:true});
document.addEventListener('click',e=>{const section=e.target.closest&&e.target.closest('#course-reader .section');if(section)noteSection=section.id},true);
window.YGN_HOOK={blocks:'.section-body p,.section-body li,.section-body tr',loc:()=>current?{v:'course',id:current,sec:noteSection}:activeUtility==='mountains'?{v:'course-ref',id:'mountains',mountain:activeMountain}:null,go:l=>{if(l&&l.v==='course')jump(l.id,l.sec);else if(l&&l.v==='course-ref')jump('mountains',l.mountain);else if(l&&l.v)location.href='index.html?knowledge='+encodeURIComponent(l.id||'')},label:()=>{if(!current)return activeUtility==='mountains'?'二十四山 · '+activeMountain+'山':'择日课程';const c=byId(current),s=c.sections.find(s=>s.id===noteSection);return '第'+c.n+'章 '+c.title+(s?' · '+s.title:'')}};
window.addEventListener('hashchange',route);route();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
