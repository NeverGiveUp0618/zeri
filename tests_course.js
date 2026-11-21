const fs=require('fs'),assert=require('assert'),{JSDOM,VirtualConsole}=require('jsdom');
let checks=0;const t=(s,f)=>{f();checks++;console.log('✓ '+s)};
const raw=fs.readFileSync('course.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
const vc=new VirtualConsole(),errors=[];vc.on('jsdomError',e=>errors.push(e.message));
const d=new JSDOM(raw,{url:'https://example.test/zeri/course.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc}),w=d.window;
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
w.eval(fs.readFileSync('data-course.js','utf8'));w.eval(fs.readFileSync('course.js','utf8'));
const D=w.ZERI_COURSE,wait=()=>new Promise(r=>setTimeout(r,25));
async function route(h){w.location.hash=h;await wait()}
(async()=>{
 t('课程首页列全34章',()=>assert.equal(w.document.querySelectorAll('.lesson').length,34));
 t('首次阅读不会标为已读',()=>assert.equal(Object.keys(JSON.parse(w.localStorage.getItem('zeri_course_v1')||'{"read":{}}').read).length,0));
 await route('zr-22');
 t('章节渲染8个小节与一题练习',()=>{assert.equal(w.document.querySelectorAll('.section').length,8);assert.equal(w.document.querySelectorAll('.question').length,1)});
 t('丁壬案例绘完整四柱',()=>{assert.equal(w.document.querySelectorAll('.pillar').length,4);assert(w.document.querySelector('.chart').textContent.includes('午山子向'))});
 t('进入章节仍未自动标已读',()=>assert(!JSON.parse(w.localStorage.getItem('zeri_course_v1')).read['zr-22']));
 const q=D.chapters.find(c=>c.id==='zr-22').questions[0],div=w.document.querySelector(`[data-qid="${q.id}"]`);
 [...div.querySelectorAll('button')].find(b=>b.textContent===q.w[0]).click();
 t('答错显示正确答案、解析和相关讲解',()=>{assert(div.textContent.includes(q.a));assert(div.textContent.includes(q.e));assert(div.querySelector('.feedback a'))});
 t('答题不改变已读状态',()=>assert(!JSON.parse(w.localStorage.getItem('zeri_course_v1')).read['zr-22']));
 t('重复点击不会重复计次',()=>{div.querySelector('button').click();assert.equal(JSON.parse(w.localStorage.getItem('zeri_course_answers_v1'))[q.id].tries,1)});
 w.document.querySelector('#mark-read').click();
 t('手动标记已读并持久化',()=>assert(JSON.parse(w.localStorage.getItem('zeri_course_v1')).read['zr-22']));
 w.document.querySelector('#mark-read').click();
 t('支持撤销已读',()=>assert(!JSON.parse(w.localStorage.getItem('zeri_course_v1')).read['zr-22']));
 w.document.querySelector('#retry').click();
 t('再做本章只清本章答案',()=>assert(!JSON.parse(w.localStorage.getItem('zeri_course_answers_v1'))[q.id]));
 const newdiv=w.document.querySelector(`[data-qid="${q.id}"]`);[...newdiv.querySelectorAll('button')].find(b=>b.textContent===q.a).click();
 t('正确作答客观记录',()=>assert(JSON.parse(w.localStorage.getItem('zeri_course_answers_v1'))[q.id].correct));
 await route('cases');t('案例索引8个且链接存在',()=>{assert.equal(w.document.querySelectorAll('#course-reader .lesson').length,8);for(const a of w.document.querySelectorAll('#course-reader .lesson'))assert(D.chapters.some(c=>a.hash.startsWith('#'+c.id+'~')))});
 await route('mountains');t('24山均可切换查原表',()=>{const s=w.document.querySelector('#mountain-pick');assert.equal(s.options.length,24);s.value='巳';s.dispatchEvent(new w.Event('change'));assert(w.document.querySelector('#mountain-text').textContent.includes('巳山亥向'))});
 for(const c of D.chapters){await route(c.id);assert.equal(w.document.querySelectorAll('.question').length,1);const chart=w.document.querySelector('.chart');if(chart){const illustration=D.cases.find(x=>x.chapter===c.id)?.illustration;assert.deepEqual([...chart.querySelectorAll('.pillar small')].map(x=>x.textContent),illustration?['示意年','示意月','示意日','示意时']:['用事年','用事月','用事日','用事时']);assert(chart.querySelector('.caption').textContent.includes(illustration?'格局示意':'用事日课'));if(D.cases.find(x=>x.chapter===c.id)?.pillars.includes('—'))assert(chart.textContent.includes('— 表示原例未给该柱。'))}for(const a of w.document.querySelectorAll('.chapter-toc a')){const id=decodeURIComponent(a.hash.split('~')[1]);assert(w.document.getElementById(id))}}
 t('34章逐页可达，盘中用事/示意及缺柱标识清楚，锚点均可定位',()=>assert.equal(w.document.querySelectorAll('.section').length,8));
 await route('zr-15');t('课程连接本课知识点速查且无推算入口',()=>{assert(w.document.querySelector('a[href="index.html?review=zr-15"]'));assert(!w.document.querySelector('a[href*="tab=calc"]'))});
 await route('zr-30');t('逐山课程连到24山原表',()=>assert(w.document.querySelector('a[href="#mountains"]')));
 await route('');const search=w.document.querySelector('#course-search');search.value='单干';search.dispatchEvent(new w.Event('input'));
 t('搜索包含章节正文',()=>assert([...w.document.querySelectorAll('.lesson')].some(a=>a.href.endsWith('#zr-22'))));
 t('笔记钩子记住课程来源',()=>assert(w.YGN_HOOK&&typeof w.YGN_HOOK.go==='function'));
 // 原分析器回归：去重和分组，不依赖原测试里同一张基准表。
 const oldhtml=fs.readFileSync('index.html','utf8').replace('<script src="data.js"></script>','<script>'+fs.readFileSync('data.js','utf8')+'</script>').replace('<script src="data-mountain.js"></script>','<script>'+fs.readFileSync('data-mountain.js','utf8')+'</script>');
 const old=new JSDOM(oldhtml,{url:'https://example.test/zeri/',runScripts:'dangerously',virtualConsole:new VirtualConsole()});const ow=old.window;ow.scrollTo=()=>{};ow.document.body.insertAdjacentHTML('beforeend','<div id="ripan-out"></div>');
 function analyze(state){ow.ripanState={yg:'',yz:'',mg:'',mz:'',dg:'',dz:'',hg:'',hz:'',shan:'',cg:'',cz:'',...state};ow.analyzeRipan();return ow.document.querySelector('#ripan-out').textContent}
 t('两个丁不再误算丁壬双全',()=>{const s=analyze({yg:'丁',mg:'丁',shan:'午'});assert(s.includes('单干'));assert(!s.includes('双全'))});
 t('丁壬俱见才提示双全且保留死活',()=>{const s=analyze({yg:'丁',mg:'壬',shan:'午'});assert(s.includes('双全'));assert(s.includes('死活'))});
 t('乾山乙丁不跨阴府组凑双全',()=>assert(!analyze({yg:'乙',mg:'丁',shan:'乾'}).includes('双全')));
 t('缺参数显示信息未齐，不报绿色无煞',()=>{const s=analyze({dg:'甲'});assert(s.includes('信息未齐'));assert(!s.includes('未见明显冲煞'))});
 t('无效干支组合提示先核四柱',()=>assert(analyze({yg:'甲',yz:'丑'}).includes('干支配对无效')));
 t('课程资源进入离线缓存',()=>{const sw=fs.readFileSync('sw.js','utf8');for(const s of ['course.html','course.css','course.js','data-course.js'])assert(sw.includes(s))});
 t('页面无运行时异常',()=>assert.deepEqual(errors,[]));
 old.window.close();w.close();console.log(`通过 ${checks} 项课程/路由/学习状态/旧引擎回归检查`);
})().catch(e=>{console.error(e);process.exitCode=1;w.close()});
