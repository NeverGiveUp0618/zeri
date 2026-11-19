/* 加载真实全科笔记模块，验证择日课程保存、分屏、跨章返回及折叠小节定位。 */
const fs=require('fs'),{JSDOM,VirtualConsole}=require('jsdom'),assert=require('assert');
const html=fs.readFileSync('course.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
const dom=new JSDOM(html,{url:'https://nevergiveup0618.github.io/zeri/course.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
const w=dom.window,$=s=>w.document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
w.scrollTo=()=>{};let lastScroll=null;w.HTMLElement.prototype.scrollIntoView=function(){lastScroll=this};
w.eval(fs.readFileSync('data-course.js','utf8'));w.eval(fs.readFileSync('course.js','utf8'));w.eval(fs.readFileSync('../mingli-home/notes.js','utf8'));
let n=0;function ok(label,f){f();n++;console.log('✓ '+label)}
(async()=>{
 w.location.hash='zr-22';await sleep(80);
 ok('真实笔记模块识别为择日学习',()=>assert.equal(w.YGN.appOfPath(),'zeri'));
 const details=$('#zr-22-s5');details.open=true;const target=details.querySelector('p,li'),text=target.textContent;
 $('#ygnBtn').click();target.click();await sleep(30);
 ok('点击段落只打开面板，不自动存笔记',()=>assert.equal(w.YGN.all().length,0));
 $('#ygnSh [data-a="nb"]').click();
 ok('打开同一全科笔记本分屏且不顺手保存',()=>{assert($('#ygnNb iframe').src.includes('notebook.html?embed=1&app=zeri'));assert.equal(w.YGN.all().length,0)});
 w.dispatchEvent(new w.MessageEvent('message',{origin:w.location.origin,data:{ygn:'close'}}));
 target.click();await sleep(20);$('#ygnMemo').value='核对原文异文，不能只数出现次数';$('#ygnSh [data-k="q"]').click();$('#ygnSh [data-a="ok"]').click();
 const item=w.YGN.all()[0];
 ok('笔记写入统一ygn_v1，保留择日分类与批注',()=>{assert.equal(item.app,'zeri');assert.equal(item.kind,'q');assert(item.memo.includes('核对原文'))});
 ok('出处包含章节和实际小节',()=>{assert.equal(item.loc.id,'zr-22');assert.equal(item.loc.sec,'zr-22-s5');assert(item.crumb.includes('第22章'));assert(item.crumb.includes('适用边界'))});
 ok('原文段落保持疑问标记',()=>assert(target.classList.contains('ygn-q')));
 w.location.hash='zr-01';await sleep(50);
 w.dispatchEvent(new w.MessageEvent('message',{origin:w.location.origin,data:{ygn:'go',app:'zeri',h:item.h,title:item.title,loc:item.loc}}));
 await sleep(800);
 ok('从其他章节回到笔记所属章',()=>assert.equal(w.YGN_HOOK.loc().id,'zr-22'));
 ok('折叠小节自动展开，可定位到原段落',()=>{assert($('#zr-22-s5').open);assert(lastScroll);assert.equal(lastScroll.textContent,text);assert(lastScroll.classList.contains('ygn-flash'))});
 ok('笔记路径指向课程页而非旧速查卡',()=>assert(item.path.includes('course.html#zr-22')));
 w.location.hash='mountains';await sleep(50);$('#mountain-pick').value='庚';$('#mountain-pick').dispatchEvent(new w.Event('change'));
 const mp=$('#mountain-text p'),mtext=mp.textContent;mp.click();await sleep(20);$('#ygnSh [data-a="ok"]').click();
 const mi=w.YGN.all().find(x=>x.loc&&x.loc.v==='course-ref');
 ok('逐山原表笔记保存具体山名',()=>{assert(mi);assert.equal(mi.loc.mountain,'庚')});
 w.location.hash='zr-01';await sleep(40);w.dispatchEvent(new w.MessageEvent('message',{origin:w.location.origin,data:{ygn:'go',app:'zeri',h:mi.h,title:mi.title,loc:mi.loc}}));await sleep(800);
 ok('原表笔记可回到对应山及原段落',()=>{assert.equal($('#mountain-pick').value,'庚');assert.equal(lastScroll.textContent,mtext)});
 w.close();console.log('全科笔记本联调通过 '+n+' 项');
})().catch(e=>{console.error(e);w.close();process.exitCode=1});
