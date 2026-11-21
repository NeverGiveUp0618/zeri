/* Exercise the unified app with the real course and shared notes modules. */
const fs=require('fs'),assert=require('assert'),{JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync('index.html','utf8').replace('<script src="data.js"></script>','<script>'+fs.readFileSync('data.js','utf8')+'</script>').replace('<script src="data-mountain.js"></script>','<script>'+fs.readFileSync('data-mountain.js','utf8')+'</script>');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(html,{url:'https://nevergiveup0618.github.io/zeri/index.html?tab=course',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,$=s=>w.document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){w.lastScroll=this};
w.eval(fs.readFileSync('data-course.js','utf8'));w.eval(fs.readFileSync('review.js','utf8'));w.eval(fs.readFileSync('course.js','utf8'));w.eval(fs.readFileSync('../mingli-home/notes.js','utf8'));
let n=0;const t=(label,f)=>{f();n++;console.log('✓ '+label)};
(async()=>{

 for(const [path,view,hash] of [['','course',''],['index.html','course',''],['#zp-01','course','zp-01'],['index.html?tab=cha','home',''],['index.html?review=zr-15','home',''],['index.html?tab=learn','learn','']]){
  const extra=new JSDOM(html,{url:'https://nevergiveup0618.github.io/zeri/'+path,runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc}),x=extra.window;
  x.scrollTo=()=>{};x.HTMLElement.prototype.scrollIntoView=function(){};
  for(const f of ['data-course.js','review.js','course.js'])x.eval(fs.readFileSync(f,'utf8'));
  t('入口路由 '+(path||'根网址')+' → '+view,()=>{assert(x.document.querySelector('#v-'+view+'.on'));assert.equal(x.document.querySelectorAll('.site-nav .on').length,1);if(hash)assert(x.document.getElementById(hash+'-s1'));if(path.includes('review='))assert(x.document.querySelector('[data-review-chapter="zr-15"]').open)});
  if(view==='home'&&!path.includes('review=')){assert(new URL(x.stateUrl({v:'home'}),x.location.href).searchParams.get('tab')==='cha')}
  x.close();
 }
 const doc=w.document,head=$('.site-header'),nav=$('.site-nav');
 t('课程入口在统一应用中显示34章',()=>{assert($('#v-course.on'));assert.equal(w.document.querySelectorAll('.lesson').length,34)});
 w.location.hash='zr-22';await sleep(50);const chapter=$('#course-reader'),section=$('#zr-22-s5');section.open=true;const para=section.querySelector('p,li');para.click();
 $('#app').scrollTop=420;$('#app').dispatchEvent(new w.Event('scroll'));await sleep(200);
 t('课程位置来自实际内容滚动容器',()=>assert.equal(JSON.parse(w.localStorage.getItem('zeri_course_positions_v1'))['zr-22'],420));
 $('#n-xue').click();const quiz=$('#learn-body .qcard');$('#qopts button').click();
 $('#n-cha').click();$('#n-xue').click();
 t('切回练习保留当前题及已作答状态',()=>{assert.strictEqual($('#learn-body .qcard'),quiz);assert($('#qopts button').disabled)});
 $('#n-course').click();await sleep(50);
 t('切回课程保留原章、展开小节和阅读位置',()=>{assert.strictEqual($('#course-reader'),chapter);assert.strictEqual($('#zr-22-s5'),section);assert(section.open);assert.equal($('#app').scrollTop,420)});
 t('三个入口切换不更换文档、页头或底栏',()=>{assert.strictEqual(w.document,doc);assert.strictEqual($('.site-header'),head);assert.strictEqual($('.site-nav'),nav);assert.equal(w.document.querySelectorAll('.site-nav .on').length,1)});
 $('#ygnBtn').click();para.click();$('#ygnMemo').value='切换入口后核验出处';$('#ygnSh [data-a="ok"]').click();const note=w.YGN.all()[0];
 t('统一应用仍保存全科笔记的章与实际小节',()=>{assert.equal(note.loc.id,'zr-22');assert.equal(note.loc.sec,'zr-22-s5');assert(note.path.includes('tab=course#zr-22'))});
 $('#n-cha').click();w.YGN_HOOK.go(note.loc);await sleep(60);
 t('从查页回笔记出处无需整页跳转',()=>{assert($('#v-course.on'));assert.equal(w.YGN_HOOK.loc().sec,'zr-22-s5');assert.strictEqual(w.document,doc);assert(section.open)});
 section.open=false;w.lastScroll=null;w.YGN_HOOK.go(note.loc);await sleep(50);
 t('再次回同一出处仍展开折叠节并执行定位',()=>{assert(section.open);assert.strictEqual(w.lastScroll,section)});
 w.YGN_HOOK.go({v:'detail',id:'ss-08'});
 t('旧速查笔记入口转到对应课程',()=>{assert($('#v-course.on'));assert.equal(w.YGN_HOOK.loc().v,'course')});
 $('#n-course').click();w.location.hash='zr-15';await sleep(60);
 t('换章不被上章滚动恢复覆盖',()=>{assert($('#zr-15-s1'));assert.equal($('#app').scrollTop,0)});
 const link=$('a[href="index.html?review=zr-15"]');link.click();await sleep(40);
 t('课程内速查链接在页内打开本课知识点',()=>{assert($('#v-home.on'));assert($('[data-review-chapter="zr-15"]').open);assert.strictEqual(w.document,doc)});
 w.history.back();await sleep(70);
 t('浏览器后退返回原课程章节',()=>{assert($('#v-course.on'));assert($('#zr-15-s1'));assert.strictEqual(w.document,doc)});
 t('完整切换与笔记联调无脚本异常',()=>assert.deepEqual(errors,[]));
 w.close();console.log('页内切换与全科笔记通过 '+n+' 项');
})().catch(e=>{console.error(e);w.close();process.exitCode=1});
