const fs=require('fs'),vm=require('vm'),assert=require('assert');
const listeners={},store=new Map(),deleted=[];let claimed=false,skipped=false;
const cache={addAll:async urls=>{for(const url of urls){assert(fs.existsSync(url==='./'?'index.html':url.slice(2)),url);store.set(url,{url})}},add:async url=>{store.set(url,{url})},put:async(url,res)=>store.set(url,res)};
const ctx={self:{addEventListener:(k,f)=>listeners[k]=f,skipWaiting:async()=>{skipped=true},clients:{claim:async()=>{claimed=true}}},caches:{open:async()=>cache,keys:async()=>['zeri-v17','zeri-v31-input-review','bazi-course-v192'],delete:async k=>deleted.push(k),match:async(req)=>store.get(typeof req==='string'?req:req.url.replace('https://example.test/zeri/','./').split('?')[0])},fetch:async()=>{throw Error('offline')},Response:{error:()=>({error:true})}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('sw.js','utf8'),ctx);
async function lifecycle(name){let done;listeners[name]({waitUntil:p=>done=p});await done}
async function offline(url,mode='cors'){let response;listeners.fetch({request:{method:'GET',url:'https://example.test/zeri/'+url,mode},respondWith:p=>response=p});return await response}
(async()=>{
 await lifecycle('install');assert(skipped);assert(store.has('./course.html'));assert(store.has('./data-course.js'));assert(store.has('https://nevergiveup0618.github.io/all-project/notes.js'));
 console.log('✓ 安装缓存课程正文、脚本和共享笔记模块');
 await lifecycle('activate');assert(claimed);assert.deepEqual(deleted,['zeri-v17']);console.log('✓ 只清择日旧缓存，保留其他学习站缓存');
 for(const file of ['course.html','course.js','course.css','site-shell.css','course-embedded.css','review.js','review.css','data-course.js'])assert.equal((await offline(file)).url,'./'+file);
 console.log('✓ 断网可取回课程与共用界面资源');
 assert((await offline('missing.js')).error);console.log('✓ 缺失脚本不会误返回HTML');
 assert.equal((await offline('course.html?v=new')).url,'./course.html');console.log('✓ 带版本参数的离线请求能回落已缓存正文');
})().catch(e=>{console.error(e);process.exitCode=1});
