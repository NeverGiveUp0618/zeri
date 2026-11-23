const fs=require('fs'),assert=require('assert'),C=require('./question-bank/core.js'),{JSDOM,VirtualConsole}=require('jsdom');
const DATA=JSON.parse(fs.readFileSync('question-bank/questions.json','utf8'));
let n=0;const t=(name,fn)=>{fn();n++;console.log('✓ '+name)},sleep=ms=>new Promise(r=>setTimeout(r,ms));
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),map}};
t('损坏存储可回退且不清旧记录',()=>{const s=storage();s.setItem('zeri_course_v1','legacy');s.setItem(C.KEY,'{bad');assert.equal(C.read(s).v,1);assert.equal(s.getItem('zeri_course_v1'),'legacy')});
t('章节排序先未做，再上次错，再最久未练',()=>{const qs=DATA.slice(0,4),s=C.empty();s.seen[qs[1].id]={at:90,lastCorrect:true};s.seen[qs[2].id]={at:20,lastCorrect:false};s.seen[qs[3].id]={at:10,lastCorrect:true};assert.deepEqual(C.order(qs,s).map(q=>q.id),[qs[0],qs[2],qs[3],qs[1]].map(q=>q.id))});
let s=C.empty(),r=C.start(DATA.slice(0,2),s,{size:20},100),q=DATA.find(x=>x.id===r.queue[0].id);
t('少于设置题数时不重复凑题',()=>{assert.equal(r.queue.length,2);assert.equal(new Set(r.base).size,2)});
t('未答不能下一题',()=>assert.equal(C.next(s,r),false));
t('所有题的选项集包含唯一正解及三个原干扰项',()=>{for(const x of DATA){const a=C.start([x],C.empty());assert.equal(new Set(a.queue[0].opts).size,4);assert.equal(a.queue[0].opts.filter(v=>v===x.a).length,1)}});
t('首次答错立刻入错题本并记录选错项',()=>{C.answer(s,r,q,q.w[0],101);assert(s.wrong[q.id].active);assert.equal(s.wrong[q.id].chosen,q.w[0]);assert.equal(s.seen[q.id].attempts,1);assert.equal(r.queue.length,3)});
t('重复点答案不重复计数或追加回炉',()=>{assert.equal(C.answer(s,r,q,q.a,102),false);assert.equal(s.seen[q.id].attempts,1);assert.equal(r.queue.length,3)});
t('正常题先答完，错题只在组末回炉一次',()=>{C.next(s,r);assert.equal(r.index,1);const next=DATA.find(x=>x.id===r.queue[1].id);C.answer(s,r,next,next.a);C.next(s,r);assert(r.queue[r.index].retry);assert.equal(r.queue[r.index].id,q.id)});
t('回炉答对不改首答成绩也不清掉原错题',()=>{C.answer(s,r,q,q.a);assert.equal(s.seen[q.id].attempts,1);assert(s.wrong[q.id].active);assert.deepEqual(C.score(r),{total:2,answered:2,correct:1,wrong:[q.id],redo:1,redoCorrect:1})});
t('完成只写一条组记录',()=>{C.next(s,r);C.next(s,r);assert.equal(s.sessions.length,1);assert(r.done)});
t('另开两组首答正确后订正，错题历史仍保留',()=>{for(let i=0;i<2;i++){const a=C.start([q],s,{mode:'wrong'},200+i);C.answer(s,a,q,q.a);C.next(s,a);if(!i)assert(s.wrong[q.id].active)}assert.equal(s.wrong[q.id].active,false);assert.equal(s.wrong[q.id].count,1);assert.equal(s.seen[q.id].attempts,1)});
t('订正后再错会重新进入待复习',()=>{const a=C.start([q],s,{mode:'wrong'},300);C.answer(s,a,q,q.w[1]);assert(s.wrong[q.id].active);assert.equal(s.wrong[q.id].streak,0)});
t('刷新断点保持题ID、选项次序和已答结果',()=>{const a=C.start([q],s);C.answer(s,a,q,q.a);const copy=JSON.parse(JSON.stringify(a));const x=C.resume(copy,{[q.id]:q});assert.deepEqual(x.queue[0].opts,a.queue[0].opts);assert.equal(x.answers[0].chosen,q.a);assert.equal(x.index,0)});
t('题目修订或停用后旧断点不串题',()=>{const a=C.start([q],s);assert.equal(C.resume(a,{[q.id]:{...q,rev:q.rev+1}}),null);assert.equal(C.resume(a,{}),null)});
t('每日复习仅选已经到期的题',()=>{const st=C.empty();st.seen[q.id]={due:100};assert.equal(C.due(DATA,st,99).length,0);assert.equal(C.due(DATA,st,101)[0].id,q.id)});
t('学新题保持教材知识点次序，选项仍随机',()=>{const a=C.start(DATA.slice(0,8),C.empty(),{mode:'new',size:8});assert.deepEqual(a.base,DATA.slice(0,8).map(q=>q.id))});
t('损坏的做题断点不会进入答题页',()=>{const a=C.start([q],C.empty());a.answers=null;assert.equal(C.resume(a,{[q.id]:q}),null)});
function browser(saved={},hash=''){
 const html=fs.readFileSync('index.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(html,{url:'https://nevergiveup0618.github.io/zeri/'+hash,runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 for(const [k,v]of Object.entries(saved))w.localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));
 for(const f of ['question-bank/data.js','question-bank/core.js','question-bank/glossary/data.js','question-bank/glossary/app.js','question-bank/app.js'])w.eval(fs.readFileSync(f,'utf8'));
 return {dom,w,$:sel=>w.document.querySelector(sel),errors};
}
(async()=>{
 let b=browser({'zeri_course_v1':'{"read":{"zp-01":true}}'}),{w,$}=b;await sleep(30);
 t('新增名词解释与训练，保留题库错题记录且无旧课程入口',()=>{assert.equal($('title').textContent,'择日题库');assert.equal(w.document.querySelectorAll('.nav button').length,4);assert(!$('#course-view'));assert(!w.document.querySelector('script[src="data-course.js"]'));assert.equal(w.localStorage.getItem('zeri_course_v1'),'{"read":{"zp-01":true}}')});
 t('每本教材和每个有题原课时都可达',()=>{const D=w.ZERI_BANK;assert.equal(w.document.querySelectorAll('.book').length,D.catalog.books.length);assert.equal(w.document.querySelectorAll('[data-chapter]').length,new Set(DATA.map(q=>q.chapter)).size)});
 $('#book-search').value='安床';$('#book-search').dispatchEvent(new w.Event('input'));t('搜索按章节和考点过滤，展开匹配教材',()=>{assert(w.document.querySelectorAll('[data-chapter]').length>0);assert([...w.document.querySelectorAll('.book')].every(x=>x.open))});
 const go=async h=>{w.ZeriQuiz.go(h);await sleep(25)};
 let reached=0;for(const id of new Set(DATA.map(q=>q.chapter))){reached++;await go('chapter/'+id);assert(w.document.querySelectorAll('[data-topic]').length>0);assert($('.panel').textContent.includes(w.ZERI_BANK.catalog.books.flatMap(b=>b.chapters).find(c=>c.id===id).title))}
 t('全部有题原章节逐一可达，面板与知识点没有串章',()=>assert.equal(reached,new Set(DATA.map(q=>q.chapter)).size));
 await go('chapter/'+DATA[0].chapter);t('章节面板能按知识点进入练习',()=>assert(w.document.querySelectorAll('[data-topic]').length>0));
 $('[data-action="chapter-start"]').click();await sleep(25);const a=w.ZeriQuiz.state.active,id=a.queue[0].id,question=w.ZeriQuiz.byId[id];
 t('每次只显示一题，未答不显示正解或回查入口',()=>{assert.equal(w.document.querySelectorAll('.question-card').length,1);assert(!$('.feedback'));assert(!$('.source-link'))});
 $('[data-answer="'+a.queue[0].opts.indexOf(question.w[0])+'"]').click();await sleep(25);
 t('答后禁用四选项并保留解析、原教材章节页码',()=>{assert.equal(w.document.querySelectorAll('.option:disabled').length,4);assert($('.feedback').textContent.includes(question.e));assert($('.source-link').textContent.includes('PDF第'+question.page+'页'));assert($('.source-link').textContent.includes(w.ZeriQuiz.sourceLabel(question)))});
 await sleep(5600);t('超过旧五秒倒计时仍停原题，必须手动下一题',()=>assert.equal(w.ZeriQuiz.state.active.index,0));
 $('.source-link').click();await sleep(30);t('回查打开对应原页并明确原教材与文件页序',()=>{assert($('#source-image').getAttribute('src').endsWith('p'+String(question.page).padStart(4,'0')+'.webp'));assert($('.source-card').textContent.includes(question.quote));assert.equal(w.ZeriQuiz.state.active.index,0)});
 const staleImage=$('#source-image');await go('quiz');staleImage.dispatchEvent(new w.Event('error'));t('离开原页后图片加载失败也不会扰乱新题面',()=>{assert($('.feedback'));assert.equal(b.errors.length,0)});
 const saved=w.localStorage.getItem(C.KEY);b.dom.window.close();b=browser({[C.KEY]:saved},'#quiz');w=b.w;$=b.$;await sleep(25);
 t('回查后即使重载，也恢复同题的已答结果',()=>{assert.equal(w.ZeriQuiz.state.active.queue[0].id,id);assert($('.feedback.incorrect'));assert.equal(w.document.querySelectorAll('.option:disabled').length,4)});
 $('[data-action="next"]').click();await sleep(25);t('手动下一题后恰好前进一题',()=>assert.equal(w.ZeriQuiz.state.active.index,1));
 await go.call(null,'bank'); // go uses current w.
 await go('wrong');t('错题本有真实错项、原教材回查与单题重练',()=>{const d=$('.wrong-card');assert(d);assert(d.textContent.includes(question.w[0]));assert(d.querySelector('.source-link'));assert(d.querySelector('[data-practice]'))});
 $('#wrong-book').value=question.book;$('#wrong-book').dispatchEvent(new w.Event('change'));$('#wrong-chapter').value=question.chapter;$('#wrong-chapter').dispatchEvent(new w.Event('change'));
 t('错题按教材及章节筛选成立',()=>{assert($('.wrong-card'));assert.equal($('#wrong-chapter').value,question.chapter)});
 $('[data-resolve]').click();t('手动订正可逆且不会删除错题历史',()=>{assert(!w.ZeriQuiz.state.wrong[id].active);$('[data-wrong-status="resolved"]').click();assert($('.wrong-card'));$('[data-resolve]').click();assert(w.ZeriQuiz.state.wrong[id].active)});
 await go('bank');$('[data-action="mixed"]').click();t('未完组切换需要选择，当前进度未被默默覆盖',()=>{assert($('#switch-dialog').open);assert.equal(w.ZeriQuiz.state.active.index,1);$('#keep-round').click()});await sleep(20);
 t('当前题库无脚本运行异常',()=>assert.equal(b.errors.length,0));
 b.dom.window.close();console.log('通过 '+n+' 项题库、状态、错题和原页回查检查');
})().catch(e=>{console.error(e);process.exitCode=1});
