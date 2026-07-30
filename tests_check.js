const fs=require('fs'),{JSDOM}=require('jsdom');
const DIR='/Users/xiaojin/Documents/文稿同步文件夹/03_学习 (Learning)/Seafile/学习资料/自创项目/zeri-web/';
const errs=[];
const vc=new (require('jsdom').VirtualConsole)();
vc.on('jsdomError',e=>{if(!/scrollTo|Not implemented|serviceWorker/.test(e.message))errs.push('JSDOM:'+e.message)});
vc.on('error',m=>errs.push('console.error:'+m));
// 真加载外部 data.js（照 index.html 的 <script src="data.js"> 顺序内联进去）
const html=fs.readFileSync(DIR+'index.html','utf8')
  .replace('<script src="data.js"></script>','<script>'+fs.readFileSync(DIR+'data.js','utf8')+'</script>');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',virtualConsole:vc});
setTimeout(()=>{
 const w=dom.window,E=x=>w.eval(x);
 const t=(n,f)=>{try{const r=f();const ok=r===true;console.log((ok?'✓ ':'✗ ')+n+(ok?'':' → '+r));if(!ok)errs.push(n)}catch(e){console.log('✗ '+n+' → THREW '+e.message);errs.push(n)}};
 const eq=(got,exp)=>{const a=[...got].sort().join(''),b=[...exp].sort().join('');return a===b?true:`得[${[...got].join('')}] 应[${[...exp].join('')}]`};

 console.log('【加载】');
 t('页面无脚本错误',()=>errs.length===0?true:errs.join('|'));

 console.log('\n【戊己都天 · 独立按五虎遁推算比对（教材p343）】');
 const GAN='甲乙丙丁戊己庚辛壬癸',ZHI='子丑寅卯辰巳午未申酉戌亥';
 const WUHU={甲:'丙',己:'丙',乙:'戊',庚:'戊',丙:'庚',辛:'庚',丁:'壬',壬:'壬',戊:'甲',癸:'甲'};
 const SHAN24=['壬','子','癸','丑','艮','寅','甲','卯','乙','辰','巽','巳','丙','午','丁','未','坤','申','庚','酉','辛','戌','乾','亥'];
 const derive=yg=>{const st=GAN.indexOf(WUHU[yg]),h=[];
   for(let m=0;m<12;m++){if('戊己'.includes(GAN[(st+m)%10]))h.push(ZHI[(2+m)%12])}return h};
 const deriveJia=h=>{const j=[];for(let i=0;i<h.length-1;i++){const a=SHAN24.indexOf(h[i]),b=SHAN24.indexOf(h[i+1]);if(b-a===2)j.push(SHAN24[a+1])}return j};
 t('DUTIAN 十干全部与五虎遁推算一致',()=>{const D=E('DUTIAN'),bad=[];
   GAN.split('').forEach(g=>{const r=eq(D[g],derive(g));if(r!==true)bad.push(g+'年 '+r)});
   return bad.length?bad.join(' | '):true});
 t('乙庚年为四支（寅卯子丑）',()=>eq(E('DUTIAN').乙,['寅','卯','子','丑']));
 t('DUTIAN_JIA 与教材夹杀行（巽甲乾庚丁）一致',()=>{const J=E('DUTIAN_JIA'),bad=[];
   GAN.split('').forEach(g=>{const r=eq(J[g],deriveJia(derive(g)));if(r!==true)bad.push(g+'年 '+r)});
   const book={甲:'巽',乙:'甲',丙:'乾',丁:'庚',戊:'丁'};
   Object.entries(book).forEach(([g,v])=>{if(!J[g].includes(v))bad.push(`${g}年夹杀应含${v}`)});
   return bad.length?bad.join(' | '):true});
 t('每个夹杀字确在其年两都天支之间',()=>{const D=E('DUTIAN'),J=E('DUTIAN_JIA'),bad=[];
   GAN.split('').forEach(g=>J[g].forEach(x=>{const i=SHAN24.indexOf(x);
     if(!(D[g].includes(SHAN24[(i+23)%24])&&D[g].includes(SHAN24[(i+1)%24])))bad.push(`${g}年${x}`)}));
   return bad.length?bad.join(','):true});

 console.log('\n【贵人 · 教材p299/p1189 歌诀】');
 // 阳贵：庚戊见牛甲在羊，乙猴己鼠丙鸡方。丁猪癸蛇壬是兔，六辛逢虎贵为阳
 t('YANGGUI 合阳贵人歌诀',()=>eq(Object.entries(E('YANGGUI')).map(([g,z])=>g+z),
   ['庚丑','戊丑','甲未','乙申','己子','丙酉','丁亥','癸巳','壬卯','辛寅']));
 // 阴贵：甲贵阴牛庚戊羊，乙贵在鼠己猴乡。丙猪丁鸡辛遇马，壬蛇癸兔属阴方
 t('YINGUI 合阴贵人歌诀',()=>eq(Object.entries(E('YINGUI')).map(([g,z])=>g+z),
   ['甲丑','庚未','戊未','乙子','己申','丙亥','丁酉','辛午','壬巳','癸卯']));

 console.log('\n【正阴府 · 教材p1116 歌诀】');
 // 甲己艮巽 乙庚乾兑 丙辛坤坎 丁壬离乾 戊癸震坤（反查成 卦→干）
 t('ZHENGYINFU 合正阴府歌诀',()=>{
   const src={甲:['艮','巽'],己:['艮','巽'],乙:['乾','兑'],庚:['乾','兑'],丙:['坤','坎'],辛:['坤','坎'],
              丁:['离','乾'],壬:['离','乾'],戊:['震','坤'],癸:['震','坤']};
   const exp={};Object.entries(src).forEach(([g,gs])=>gs.forEach(k=>(exp[k]=exp[k]||[]).push(g)));
   const Z=E('ZHENGYINFU'),bad=[];
   Object.keys(exp).forEach(k=>{const r=eq(Z[k]||[],exp[k]);if(r!==true)bad.push(k+'卦 '+r)});
   return bad.length?bad.join(' | '):true});

 console.log('\n【其余定式表】');
 t('LU 十干禄',()=>eq(Object.entries(E('LU')).map(([g,z])=>g+z),
   ['甲寅','乙卯','丙巳','丁午','戊巳','己午','庚申','辛酉','壬亥','癸子']));
 t('MA 驿马（三合局对冲之首）',()=>{const M=E('MA'),bad=[];
   [[['申','子','辰'],'寅'],[['寅','午','戌'],'申'],[['巳','酉','丑'],'亥'],[['亥','卯','未'],'巳']]
    .forEach(([zs,m])=>zs.forEach(z=>{if(M[z]!==m)bad.push(`${z}马应${m}得${M[z]}`)}));
   return bad.length?bad.join(','):true});
 t('SANSHA_FANG 三煞方（局→对冲三方）',()=>{const S=E('SANSHA_FANG');
   return eq(S.水,['巳','午','未'])===true&&eq(S.火,['亥','子','丑'])===true&&
          eq(S.金,['寅','卯','辰'])===true&&eq(S.木,['申','酉','戌'])===true?true:JSON.stringify(S)});
 t('sanshaYears 与三煞方互为反查',()=>{const S=E('SANSHA_FANG'),bad=[];
   Object.entries(S).forEach(([ju,zs])=>{const ju2={水:'申子辰',火:'寅午戌',金:'巳酉丑',木:'亥卯未'}[ju];
     zs.forEach(z=>{const g=E(`sanshaYears('${z}')`);if(!g.startsWith(ju2))bad.push(`${z}→${g} 应${ju2}`)})});
   return bad.length?bad.join(','):true});
 t('SHAN_GUA 二十四山配八卦（每卦三山）',()=>{const G=E('SHAN_GUA'),c={};
   Object.values(G).forEach(k=>c[k]=(c[k]||0)+1);
   const bad=Object.entries(c).filter(([k,n])=>n!==3);
   return bad.length?JSON.stringify(c):true});
 t('SHAN_ZHI 天干山/四维山归位正确',()=>eq(
   ['壬子','癸丑','艮寅','甲卯','乙辰','巽巳','丙午','丁未','坤申','庚酉','辛戌','乾亥']
     .map(p=>p[0]+E('SHAN_ZHI')[p[0]]),
   ['壬子','癸丑','艮寅','甲卯','乙辰','巽巳','丙午','丁未','坤申','庚酉','辛戌','乾亥']));
 t('LIUHE 六合对称',()=>{const L=E('LIUHE'),bad=[];
   Object.entries(L).forEach(([a,b])=>{if(L[b]!==a)bad.push(a+b)});return bad.length?bad.join(','):true});

 console.log('\n【data.js 文本与引擎一致】');
 const djs=fs.readFileSync(DIR+'data.js','utf8');
 t('data.js 都天文本不含旧错值',()=>{const bad=[];
   if(/丙[、,]?\s*辛年?[：:]?\s*→?\s*子[、,]丑/.test(djs))bad.push('丙辛年仍写子丑');
   if(/丁[、,]?\s*壬年?[：:]?\s*→?\s*戌[、,]亥/.test(djs))bad.push('丁壬年仍写戌亥');
   if(/戊[、,]?\s*癸年?[：:]?\s*→?\s*申[、,]酉/.test(djs))bad.push('戊癸年仍写申酉');
   return bad.length?bad.join(' | '):true});
 t('data.js 都天文本含订正后值',()=>{const need=['丙辛年（正月庚寅）：戌、亥','丁壬年（正月壬寅）：申、酉','戊癸年（正月甲寅）：午、未'];
   const miss=need.filter(x=>!djs.includes(x));return miss.length?'缺: '+miss.join('/'):true});
 t('data.js 无重复 id / 字段齐全',()=>{
   const D=E('DATA'),ids=D.map(x=>x.id);
   if(ids.length!==new Set(ids).size)return '有重复id';
   const bad=D.filter(x=>!x.id||!x.cat||!x.title||!x.body);
   return bad.length?bad.length+' 条缺字段':true});

 console.log('\n【PWA】');
 t('sw 缓存版本已随内容更新',()=>{const sw=fs.readFileSync(DIR+'sw.js','utf8');
   const v=(sw.match(/zeri-v(\d+)/)||[])[1];console.log('   sw 版本: zeri-v'+v);
   return v&&+v>=15?true:'版本仍为 v'+v+'，改了内容需升版'});

 console.log('\n'+(errs.length?'❌ '+errs.length+' 项未通过':'✅ 全部通过'));
 process.exit(errs.length?1:0);
},2000);
