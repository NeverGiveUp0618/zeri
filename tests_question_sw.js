const fs=require('fs'),vm=require('vm'),assert=require('assert');
const listeners={},store=new Map(),deleted=[],current='zeri-v48-tongshu2024-508';let offline=true,claimed=false,skipped=false;
const key=x=>(typeof x==='string'?x:x.url).replace('https://example.test/zeri/','./').split('?')[0];
const cache={addAll:async urls=>{for(const u of urls){assert(fs.existsSync(u==='./'?'index.html':u.slice(2)),u);store.set(u,{url:u})}},add:async u=>store.set(u,{url:u}),put:async(u,v)=>store.set(key(u),v)};
const ctx={self:{addEventListener:(k,f)=>listeners[k]=f,skipWaiting:async()=>skipped=true,clients:{claim:async()=>claimed=true}},caches:{open:async()=>cache,keys:async()=>['zeri-v31-input-review',current,'bazi-v64','notes-v1'],delete:async k=>deleted.push(k),match:async x=>store.get(key(x))},fetch:async req=>{if(offline)throw Error('offline');return {ok:true,url:key(req),clone(){return this}}},Response:{error:()=>({error:true})}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('sw.js','utf8'),ctx);
async function lifecycle(name){let done;listeners[name]({waitUntil:p=>done=p});await done}
async function get(file,mode='cors'){let response;listeners.fetch({request:{method:'GET',url:'https://example.test/zeri/'+file,mode},respondWith:p=>response=p});return response}
(async()=>{
 await lifecycle('install');assert(skipped);for(const name of ['data.js','core.js','app.js','app.css'])assert(store.has('./question-bank/'+name));for(const name of ['data.js','app.js'])assert(store.has('./question-bank/glossary/'+name));for(const name of ['data.js','app.js'])assert(store.has('./question-bank/calculation/'+name));assert(!store.has('./data-course.js'));console.log('✓ 离线核心只预缓存题库，旧课程退出入口');
 assert(store.has('https://nevergiveup0618.github.io/all-project/notes.js'));console.log('✓ 共用阅读、笔记与保护模块可选缓存');
 await lifecycle('activate');assert(claimed);assert.deepEqual(deleted,['zeri-v31-input-review']);console.log('✓ 只清择日旧缓存，保留其他科目与笔记缓存');
 for(const name of ['index.html','question-bank/data.js','question-bank/core.js','question-bank/app.js','question-bank/glossary/data.js','question-bank/glossary/app.js','question-bank/calculation/data.js','question-bank/calculation/app.js'])assert.equal((await get(name)).url,'./'+name);console.log('✓ 断网仍可打开题库和作答脚本');
 assert.equal((await get('question-bank/data.js?v=next')).url,'./question-bank/data.js');assert((await get('missing.js')).error);console.log('✓ 版本参数可回落缓存，脚本缺失不误取HTML');
 const image='question-bank/pages/p0010.webp';assert((await get(image)).error);offline=false;await get(image);await Promise.resolve();offline=true;assert.equal((await get(image)).url,'./'+image);console.log('✓ 原页按需缓存，浏览过的原页可离线回看');
 console.log('通过 6 项题库离线检查');
})().catch(e=>{console.error(e);process.exitCode=1});
