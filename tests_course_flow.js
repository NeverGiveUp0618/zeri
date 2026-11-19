const fs=require('fs'),assert=require('assert'),{JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync('index.html','utf8').replace('<script src="data.js"></script>','<script>'+fs.readFileSync('data.js','utf8')+'</script>').replace('<script src="data-mountain.js"></script>','<script>'+fs.readFileSync('data-mountain.js','utf8')+'</script>');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const w=new JSDOM(html,{url:'https://nevergiveup0618.github.io/zeri/index.html?tab=course',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc}).window,$=s=>w.document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){w.lastScroll=this};for(const f of ['data-course.js','review.js','course.js','../mingli-home/notes.js'])w.eval(fs.readFileSync(f,'utf8'));
let count=0;const t=(label,fn)=>{fn();count++;console.log('✓ '+label)},go=async hash=>{w.location.hash=hash;await sleep(25)};
(async()=>{
 t('初中高级目录默认全部折叠',()=>{assert.equal(w.document.querySelectorAll('#catalog .level').length,3);assert.equal(w.document.querySelectorAll('#catalog .level[open]').length,0)});
 t('只保留学查练，无推算页面及课程下载导入导出备份入口',()=>{assert.equal(w.document.querySelectorAll('.site-nav a').length,3);assert(!$('#v-calc'));assert(!w.document.querySelector('[download],[data-export],[data-import],#course-import,a[href*="backup.html"]'))});
 let answered=0;
 for(const c of w.ZERI_COURSE.chapters){await go(c.id);for(let i=0;i<c.questions.length;i++){
  const q=c.questions[i],div=$('#chapter-questions .question'),next=$('[data-next-question]');assert.equal(w.document.querySelectorAll('#chapter-questions .question').length,1);assert.equal(div.dataset.qid,q.id);assert(next.hidden);assert(next.disabled);
  [...div.querySelectorAll('.option')].find(b=>b.textContent===q.a).click();assert(!next.hidden);assert(!next.disabled);assert.equal($('#chapter-questions .question'),div);
  next.click();answered++;
 }assert($('#chapter-questions .quiz-result'));assert(!$('#chapter-questions .question'));assert(!JSON.parse(w.localStorage.getItem('zeri_course_v1')).read[c.id]);}
 t('34章160题逐题答完后手动下一题，最后显示结果且不自动标已读',()=>assert.equal(answered,160));
 const c=w.ZERI_COURSE.chapters.at(-1);$('#retry').click();
 t('再做本章回第一题，只清本章作答',()=>{const a=JSON.parse(w.localStorage.getItem('zeri_course_answers_v1'));assert(a['zr-01-q01']);assert(!a[c.questions[0].id]);assert.equal($('#chapter-questions .question').dataset.qid,c.questions[0].id);assert($('[data-next-question]').hidden)});
 await go('zr-01');w.YGN_HOOK.go({v:'course',id:'zr-01',sec:'zr-01-q02'});await sleep(35);
 t('笔记可直接定位当前未显示的第二题',()=>assert.equal($('#chapter-questions .question').dataset.qid,'zr-01-q02'));
 $('#n-cha').click();
 t('旧速查内容撤下，新速查列出34课',()=>{assert.equal(w.document.querySelectorAll('.review-lesson').length,34);assert(!$('#cats'));assert(!$('#v-detail'));assert(!$('#fav-wrap'))});
 $('[data-review-stage="高级"]').click();t('速查支持按初中高级筛选',()=>assert.equal(w.document.querySelectorAll('.review-lesson').length,6));
 $('[data-review-stage="全部"]').click();$('#review-search').value='麒麟';$('#review-search').dispatchEvent(new w.Event('input'));
 t('速查搜索可命中规则正文',()=>assert($('[data-review-chapter="zr-18"]')));
 const plain=html=>{const d=w.document.createElement('div');d.innerHTML=html;return d.textContent.replace(/\s/g,'')};
 for(const c of w.ZERI_COURSE.chapters){w.ZeriReview.hook.go({id:c.id});const blocks=[...w.document.querySelectorAll(`[data-review-chapter="${c.id}"] [data-review-sec]`)];assert.equal(blocks.length,3);[1,4,6].forEach((idx,i)=>assert.equal(plain(blocks[i].querySelector('.section-body').innerHTML),plain(c.sections[idx].html)))}
 t('34课速查规则、易错边界和小结与已复核正文逐字一致',()=>assert(true));
 w.ZeriReview.hook.go({id:'zr-22',sec:'zr-22-s5'});await sleep(30);$('#ygnBtn').click();const p=$('#review-zr-22-s5 li, #review-zr-22-s5 p');p.click();$('#ygnMemo').value='逐课速查复习';$('#ygnSh [data-a="ok"]').click();const note=w.YGN.all()[0];
 t('速查笔记存入同一全科笔记本并记录课及规则小节',()=>{assert.equal(note.app,'zeri');assert.equal(note.loc.v,'course-review');assert.equal(note.loc.id,'zr-22');assert.equal(note.loc.sec,'zr-22-s5')});
 $('#n-course').click();w.YGN_HOOK.go(note.loc);await sleep(30);
 t('从课程回速查笔记能打开对应课并定位小节',()=>{assert($('#v-home.on'));assert($('[data-review-chapter="zr-22"]').open);assert.equal(w.lastScroll.id,'review-zr-22-s5')});
 t('新界面及逐题全流程无脚本异常',()=>assert.deepEqual(errors,[]));
 w.close();console.log('课程逐题与速查通过 '+count+' 项');
})().catch(e=>{console.error(e);w.close();process.exitCode=1});
