const fs=require('fs'),assert=require('assert'),{JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync('course.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,''),source=fs.readFileSync('course.js','utf8');let checks=0;
const t=(s,f)=>{f();checks++;console.log('✓ '+s)},sleep=ms=>new Promise(r=>setTimeout(r,ms));
function raw(setup){const d=new JSDOM(html,{url:'https://example.test/zeri/course.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});d.window.scrollTo=()=>{};d.window.HTMLElement.prototype.scrollIntoView=function(){};d.window.eval(fs.readFileSync('data-course.js','utf8'));if(setup)setup(d.window);return d}
async function init(setup){const d=raw(setup);await d.window.eval(source);return d}
async function go(w,h){w.location.hash=h;await sleep(35)}
(async()=>{
 let d=raw(w=>{w.YG={ready:new Promise(r=>w.restoreReady=r)}}),w=d.window;const pending=w.eval(source);
 t('镜像恢复完成前不写空进度',()=>{assert.equal(w.localStorage.getItem('zeri_course_v1'),null);assert(w.document.body.textContent.includes('正在读取'))});
 w.localStorage.setItem('zeri_course_v1',JSON.stringify({read:{'zr-09':true}}));w.restoreReady();await pending;
 t('初始化读取恢复后的已读记录',()=>assert(w.document.body.textContent.includes('已读 1/34')));w.close();
 d=await init(w=>{w.localStorage.setItem('zeri_course_v1','[]');w.localStorage.setItem('zeri_course_answers_v1','"broken"');w.localStorage.setItem('zeri_course_positions_v1','[]')});w=d.window;
 t('错误类型存储不会导致白屏',()=>assert.equal(w.document.querySelectorAll('.lesson').length,34));
 await go(w,'zr-22');let c=w.ZERI_COURSE.chapters.find(x=>x.id==='zr-22'),q=c.questions[0],q2=c.questions[1];
 let div=w.document.querySelector(`[data-qid="${q.id}"]`);[...div.querySelectorAll('.option')].find(x=>x.textContent===q.w[0]).click();
 w.document.querySelector('[data-next-question]').click();let div2=w.document.querySelector(`[data-qid="${q2.id}"]`);[...div2.querySelectorAll('.option')].find(x=>x.textContent===q2.a).click();
 await go(w,'wrong');div=w.document.querySelector(`[data-qid="${q.id}"]`);div.querySelector('[data-retry-question]').click();div=w.document.querySelector(`[data-qid="${q.id}"]`);
 t('错题可直接重做且不先删错题记录',()=>{assert(!div.querySelector('.option').disabled);assert(!JSON.parse(w.localStorage.getItem('zeri_course_answers_v1'))[q.id].correct)});
 [...div.querySelectorAll('.option')].find(x=>x.textContent===q.a).click();
 t('错题答对保留其他题进度并累计尝试',()=>{const a=JSON.parse(w.localStorage.getItem('zeri_course_answers_v1'));assert(a[q.id].correct);assert.equal(a[q.id].tries,2);assert(a[q2.id].correct)});
 await go(w,'zr-22');const p=w.document.querySelector('#zr-22-s5');p.open=true;await go(w,'zr-22~zr-22-s2');
 t('同章跳小节不重建DOM或关闭其他小节',()=>assert.strictEqual(w.document.querySelector('#zr-22-s5'),p));assert(p.open);
 await go(w,'zr-01');Object.defineProperty(w,'scrollY',{value:740,writable:true,configurable:true});w.dispatchEvent(new w.Event('scroll'));await go(w,'zr-02');await sleep(210);
 t('快速换章不把旧章滚动位置写入新章',()=>{const pos=JSON.parse(w.localStorage.getItem('zeri_course_positions_v1'));assert.equal(pos['zr-01'],740);assert.notEqual(pos['zr-02'],740)});
 await go(w,'%E0%A4%A');t('坏的URL编码不会导致白屏',()=>assert.equal(w.document.querySelectorAll('.lesson').length,34));
 t('目录移除下载及导入导出与备份入口',()=>{assert(!w.document.querySelector('[data-export],[data-import],#course-import,[download],a[href*="backup"]'))});w.close();
 d=await init(w=>{w.Storage.prototype.setItem=function(){throw Error('quota')}});w=d.window;await go(w,'zr-01');
 t('存储空间不足仍可打开课程并明确提示',()=>{assert(w.document.querySelector('#storage-issue'));assert(w.document.querySelector('.reader-title'))});w.close();
 const oldhtml=fs.readFileSync('index.html','utf8').replace('<script src="data.js"></script>','<script>'+fs.readFileSync('data.js','utf8')+'</script>').replace('<script src="data-mountain.js"></script>','<script>'+fs.readFileSync('data-mountain.js','utf8')+'</script>');
 d=new JSDOM(oldhtml,{url:'https://example.test/zeri/',runScripts:'dangerously',virtualConsole:new VirtualConsole()});w=d.window;
 function analyze(state){w.ripanState={yg:'',yz:'',mg:'',mz:'',dg:'',dz:'',hg:'',hz:'',shan:'',cg:'',cz:'',...state};w.analyzeRipan();return w.document.getElementById('ripan-out').textContent}
 t('底栏切换练习会初始化完整题面，统计标签和数字保留在同组',()=>{w.document.getElementById('n-xue').click();assert(w.document.querySelector('#v-learn.on .qcard'));assert.equal(w.document.querySelectorAll('#learn-stat .stat-item').length,3);for(const el of w.document.querySelectorAll('#learn-stat .stat-item'))assert(el.querySelector('b'));w.streak.days=123;w.renderStat();assert.equal(w.document.querySelectorAll('#learn-stat .stat-item').length,4)});
 t('三入口导航移除推算，切换后仅当前入口高亮',()=>{assert.equal(w.document.querySelectorAll('.site-nav a').length,3);assert(!w.document.getElementById('n-suan'));w.document.getElementById('n-cha').click();assert(w.document.querySelector('#v-home.on'));assert.equal(w.document.querySelectorAll('.site-nav .on').length,1)});
 w.document.body.insertAdjacentHTML('beforeend','<div id="ripan-out"></div>');
 t('艮山甲己与寅山丁壬逐山区分',()=>{assert(analyze({shan:'艮',yg:'甲',mg:'己'}).includes('正阴府'));assert(analyze({shan:'寅',yg:'丁',mg:'壬'}).includes('傍阴府'));assert(!analyze({shan:'寅',yg:'甲',mg:'己'}).includes('双全'))});
 t('壬山两组傍阴府不再错套坎卦丙辛',()=>{assert(analyze({shan:'壬',yg:'乙',mg:'庚'}).includes('傍阴府'));assert(!analyze({shan:'壬',yg:'丙',mg:'辛'}).includes('双全'))});
 t('四维山缺兼向不再输出确定三煞或冲山',()=>{const s=analyze({shan:'乾',yz:'巳'});assert(s.includes('待核兼向'));assert(!s.includes('山家三煞'));assert(!s.includes('巳 冲坐山'))});
 t('年月干不合五虎遁时暂停后续扫描',()=>{const s=analyze({yg:'甲',yz:'子',mg:'甲',mz:'寅',shan:'午'});assert(s.includes('五虎遁'));assert(s.includes('暂停'))});
 t('日时干不合五鼠遁时暂停后续扫描',()=>assert(analyze({dg:'甲',dz:'寅',hg:'甲',hz:'寅'}).includes('五鼠遁')));
 t('主命四煞只按对应墓支提示，不把三方等同全忌',()=>{assert(!analyze({cz:'子',dz:'巳'}).includes('主命四煞'));assert(analyze({cz:'子',dz:'未'}).includes('主命四煞'))});
 t('女命冲支提示不再把所有同支日一律禁用',()=>{assert(w.nvRes('甲子').includes('不把所有同支日一概判忌'));assert(w.nvRes('辛巳').includes('第18项题头误印'))});
 for(let i=0;i<1000;i++){const q=w.genQ('阴府'),shan=q.stem.match(/<b>(.)山/)[1],rule=w.ZERI_MOUNTAINS[shan];assert(rule.pairs.includes(q.ans));assert(q.stem.includes(rule.kind));assert.equal(new Set(q.opts).size,4)}
 t('随机阴府题1000题均匹配具体山原条',()=>assert(true));
 w.close();console.log('新增复查回归通过 '+checks+' 项');
})().catch(e=>{console.error(e);process.exitCode=1});
