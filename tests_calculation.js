const fs=require('fs'),assert=require('assert'),{JSDOM,VirtualConsole}=require('jsdom');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),Q=JSON.parse(fs.readFileSync('question-bank/calculation/questions.json'));
let count=0;const check=(name,fn)=>{fn();count++;console.log('✓ '+name)};
function browser(saved={},hash='#bank'){
 const vc=new VirtualConsole(),errors=[];vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(fs.readFileSync('index.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,''),{url:'https://nevergiveup0618.github.io/zeri/'+hash,runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 for(const [k,v]of Object.entries(saved))w.localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));
 for(const f of ['question-bank/data.js','question-bank/core.js','question-bank/glossary/data.js','question-bank/glossary/app.js','question-bank/calculation/data.js','question-bank/calculation/app.js','question-bank/app.js'])w.eval(fs.readFileSync(f,'utf8'));
 return {dom,w,errors,$:s=>w.document.querySelector(s)};
}
(async()=>{
 let b=browser(),w=b.w,$=b.$;await sleep(20);const go=async route=>{w.ZeriQuiz.go(route);await sleep(5)};
 check('题库有推算练习入口，保留四个底栏',()=>{assert($('a[href="#calculation"]'));assert.equal(w.document.querySelectorAll('.nav button').length,4)});
 await go('terms');check('名词目录有推算入口',()=>assert($('a[href="#calculation"]')));
 await go('term/zt-真禄');check('有题的词条可直接练起法',()=>assert($('[data-calc-term="zt-真禄"]')));
 await go('calculation');check('130题六类40种起法与题量设置可达',()=>{assert($('#app').textContent.includes('130道'));assert.equal($('#calc-category').options.length,7);assert.equal(w.document.querySelectorAll('[data-calc-term]').length,40);assert($('#calc-size'))});
 $('#calc-category').value='doushou';$('#calc-category').dispatchEvent(new w.Event('change',{bubbles:true}));$('[data-calc-start="category"]').click();await sleep(15);
 check('按分类组题不串类，不足20题不凑数',()=>{const s=w.ZeriCalc.state.active;assert.equal(s.base.length,11);assert(s.base.every(id=>w.ZeriCalc.by[id].category==='doushou'));assert.equal(new Set(s.base).size,11)});
 check('答前仅四选项，没有推算过程或出处泄答',()=>{assert.equal(w.document.querySelectorAll('.option').length,4);assert(!$('.feedback'));assert(!$('.source-link'));assert(!$('[data-calc-next]'))});
 // Keep both older unfinished rounds alive while the independent calculation round runs.
 w.ZeriQuiz.state.active=w.ZeriQuizCore.start(w.ZERI_BANK.questions,w.ZeriQuiz.state,{size:10});
 w.ZeriTerms.state.active=w.ZeriQuizCore.start(w.ZERI_TERMS.questions,w.ZeriTerms.state,{size:10});
 const oldBank=JSON.stringify(w.ZeriQuiz.state.active),oldTerms=JSON.stringify(w.ZeriTerms.state.active);
 for(const q of Q){
  w.ZeriCalc.state.active=w.ZeriQuizCore.start([q],w.ZeriCalc.state,{size:1});await go('calc-quiz');
  assert($('.question-card').textContent.includes(q.q));assert.equal(w.document.querySelectorAll('.option').length,4);assert(!$('.feedback'));
  const s=w.ZeriCalc.state.active;$('[data-calc-answer="'+s.queue[0].opts.indexOf(q.a)+'"]').click();
  assert.equal(w.document.querySelectorAll('.feedback li.explanation').length,q.steps.length);assert($('.feedback').textContent.includes(q.basis));
 }
 check('130题逐题作答：全部解析步骤、依据与答案完整渲染',()=>assert.equal(b.errors.length,0));
 check('推算未覆盖旧题库和旧名词的未完组',()=>{assert.equal(JSON.stringify(w.ZeriQuiz.state.active),oldBank);assert.equal(JSON.stringify(w.ZeriTerms.state.active),oldTerms)});
 const q=Q[0];w.ZeriCalc.state.active=w.ZeriQuizCore.start([q],w.ZeriCalc.state,{size:1});await go('calc-quiz');let s=w.ZeriCalc.state.active;
 $('[data-calc-answer="'+s.queue[0].opts.indexOf(q.w[0])+'"]').click();
 check('答错入独立错题本，禁重复答，回炉只追加一次',()=>{assert(w.ZeriCalc.state.wrong[q.id].active);assert.equal(s.queue.length,2);assert.equal(w.document.querySelectorAll('.option:disabled').length,4);assert(!w.ZeriQuiz.state.wrong[q.id]);assert(!w.ZeriTerms.state.wrong[q.id])});
 const attempts=w.ZeriCalc.state.seen[q.id].attempts,loc=JSON.parse(JSON.stringify(w.YGN_HOOK.loc()));
 check('笔记绑定推算稳定题ID',()=>{assert.deepEqual(loc,{v:'zeri-calc',id:q.id});assert(w.YGN_HOOK.label().includes(q.topic))});
 $('.source-link').click();await sleep(12);
 check('答后回看准确起法且能返回推算已答题',()=>{assert.equal($('.term-detail h1').textContent,q.topic);assert($('.back-row a').href.endsWith('#calc-quiz'))});
 $('.back-row a').click();await sleep(12);assert($('.feedback.incorrect'));
 let saved=Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]));b.dom.window.close();b=browser(saved,'#calc-quiz');w=b.w;$=b.$;await sleep(20);s=w.ZeriCalc.state.active;
 check('刷新恢复同题同选项同错答和回炉队列',()=>{assert.equal(s.queue[0].id,q.id);assert.equal(s.answers[0].chosen,q.w[0]);assert($('.feedback.incorrect'));assert.equal(s.queue.length,2)});
 $('[data-calc-next]').click();await sleep(12);$('[data-calc-answer="'+s.queue[1].opts.indexOf(q.a)+'"]').click();$('[data-calc-next]').click();await sleep(12);
 check('手动下一题完成组末回炉，不重复首答且错题保留',()=>{assert(s.done);assert.equal(w.ZeriCalc.state.seen[q.id].attempts,attempts);assert(w.ZeriCalc.state.wrong[q.id].active);assert($('#app').textContent.includes('0 / 1'))});
 await go('calc-records');check('完成记录首答与回炉分开统计',()=>{assert.equal(w.ZeriCalc.state.sessions.length,1);assert.equal(w.ZeriCalc.state.sessions[0].correct,0);assert.equal(w.ZeriCalc.state.sessions[0].redoCorrect,1)});
 await go('calc-wrong');$('[data-calc-resolve]').click();check('订正操作保留历史并可逆',()=>{assert(!w.ZeriCalc.state.wrong[q.id].active);$('[data-calc-status="resolved"]').click();$('[data-calc-resolve]').click();assert(w.ZeriCalc.state.wrong[q.id].active)});
 $('[data-calc-status="active"]').click();$('.wrong-card details').open=true;$('.source-link').click();await sleep(12);check('从推算错题回看词条后返回错题页',()=>assert($('.back-row a').href.endsWith('#calc-wrong')));
 await go('calculation');w.YGN_HOOK.go(loc);await sleep(12);check('笔记回出处显示原推算题、解析，不覆盖当前组',()=>{assert.equal(w.YGN_HOOK.loc().id,q.id);assert($('#app').textContent.includes(q.q));assert(q.steps.every(step=>$('#app').textContent.includes(step)))});
 await go('calculation');$('#calc-category').value='';$('#calc-category').dispatchEvent(new w.Event('change',{bubbles:true}));$('[data-calc-term="zt-真禄"]').click();await sleep(12);const original=w.ZeriCalc.state.active.id;await go('calculation');$('[data-calc-start="all"]').click();
 check('切换新组先保留未完组，可继续原组',()=>{assert($('#switch-dialog').open);assert.equal(w.ZeriCalc.state.active.id,original);$('#keep-round').click()});await sleep(12);
 await go('calculation');$('[data-calc-start="all"]').click();$('#replace-round').click();await sleep(12);check('明确换组后组题成功',()=>assert.notEqual(w.ZeriCalc.state.active.id,original));
 await go('wrong');check('共用错题入口接推算错题数',()=>assert($('a[href="#calc-wrong"]').textContent.includes('1')));
 await go('records');check('共用记录入口接推算记录',()=>assert($('a[href="#calc-records"]')));
 check('全流程无脚本异常',()=>assert.equal(b.errors.length,0));
 b.dom.window.close();b=browser({'zeri_calc_v1':'{bad'},'#calculation');await sleep(20);check('损坏推算存储单独回退',()=>assert.equal(b.w.ZeriCalc.state.v,1));b.dom.window.close();
 console.log('通过 '+count+' 项推算练习检查');
})().catch(e=>{console.error(e);process.exitCode=1});
