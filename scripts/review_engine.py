from pathlib import Path
p=Path('index.html');s=p.read_text()
def change(a,b):
 global s
 assert a in s,a[:100]
 s=s.replace(a,b,1)
change('<script src="data.js"></script>','<script src="data.js"></script>\n<script src="data-mountain.js"></script>')
a=s.index('function shanRes(s){');b=s.index('function gzRes()',a)
s=s[:a]+'''function shanRes(s){
 const zhi=SHAN_ZHI[s],gua=SHAN_GUA[s],chong=ZHI[(ZHI.indexOf(zhi)+6)%12],r=window.ZERI_MOUNTAINS&&window.ZERI_MOUNTAINS[s];
 return `<div class="res"><div class="rrow"><div class="rk">坐山</div><div class="rv"><b>${s}山</b>（属${gua}卦）</div></div>
 <div class="rrow"><div class="rk">冲山</div><div class="rv">${ZHI.includes(s)?`逢${chong}之年月日时冲山，分别核岁破、月破、日破、时破`:'须补兼向并查该山专条，不按简化归支直接判冲山'}</div></div>
 <div class="rrow"><div class="rk">山家三煞</div><div class="rv">${'乾坤艮巽'.includes(s)?'四维山须补兼家，不能按单一归支判定':`逢${sanshaYears(zhi)}时间支，三煞占此山方，年月日时分别核`}</div></div>
 <div class="rrow"><div class="rk">${r?r.kind:'阴府待核'}</div><div class="rv">${r?r.source:'逐山数据尚未加载，请重新打开页面'}</div></div>
 <div class="calc-note"><a href="course.html#mountains~${encodeURIComponent(s)}">查看${s}山原条及页码</a>；仍须分单双、山运死活与用事条件。</div></div>`;
}
''' +s[b:]
change("zhis.forEach(([l,z])=>{if(z===chong)F.push", "if(ZHI.includes(shan))zhis.forEach(([l,z])=>{if(z===chong)F.push")
change("zhis.forEach(([l,z])=>{if(ssz.includes(z))F.push", "if(!'乾坤艮巽'.includes(shan))zhis.forEach(([l,z])=>{if(ssz.includes(z))F.push")
change("    const yf=ZHENGYINFU[gua];\n    [['甲','己'],['乙','庚'],['丙','辛'],['丁','壬'],['戊','癸']].filter(pair=>pair.every(g=>yf.includes(g))).forEach(pair=>{", "    const rule=window.ZERI_MOUNTAINS&&window.ZERI_MOUNTAINS[shan];\n    if(!rule)F.push(['warn','逐山阴府数据尚未加载，本项不能判定，请重试或查原条。']);\n    (rule?rule.pairs:[]).map(pair=>pair.split('')).forEach(pair=>{")
change('<b>正阴府</b>：${shan}(${gua}卦) ${pair.join(\'\')}组','<b>${rule.kind}</b>：${shan}山 ${pair.join(\'\')}组')
change("'（单干，重复同字仍按单干核）'}`]);","'（单干，重复同字仍按单干核）'}；制化条件依该山原条核。`]);")
change("    const cfang=SANSHA_FANG[heJu(cz).e];\n    zhis.forEach(([l,z])=>{if(cfang.includes(z))F.push(['warn',`<b>主命三煞</b>：${l}支 ${z} 为 ${cz}命三煞方，需贵人化`]);});", "    const sha={水:'未',火:'丑',金:'辰',木:'戌'}[heJu(cz).e];\n    zhis.forEach(([l,z])=>{if(z===sha)F.push(['warn',`<b>主命四煞</b>：${l}支 ${z} 为 ${cz}命对应岁煞支；真三煞还须配出生年干，制化依专条核。`]);});")
change("if(shan&&'乾坤艮巽'.includes(shan))F.unshift(['warn','<b>四维山待核兼向</b>：当前简化归支不能代替兼家专条，请对照课程第五、九、三十章。']);", "if(shan&&!ZHI.includes(shan))F.unshift(['warn',`<b>${'乾坤艮巽'.includes(shan)?'四维山':'天干山'}待核兼向</b>：冲山等依兼家专条另核，不把简化归支当最终结论。`]);")
change("  const w=WOMEN[gz],chg=z=>ZHI[(ZHI.indexOf(z)+6)%12];", "  const w=WOMEN[gz],chg=z=>ZHI[(ZHI.indexOf(z)+6)%12];\n  const page=992+Array.from({length:60},(_,i)=>GAN[i%10]+ZHI[i%12]).indexOf(gz);")
change('忌 <span class="warn">冲夫星日（${chg(w.fu[1])}日）</span>','<span class="warn">冲支提示：${chg(w.fu[1])}日</span> <small>真冲、正冲、偏冲及制化依本命原页分别核</small>')
change('忌 <span class="warn">冲胎元日（${chg(w.tai[1])}日）</span>','<span class="warn">冲支提示：${chg(w.tai[1])}日</span> <small>不把所有同支日一概判忌，须核具体干支</small>')
change('   <div class="rrow"><div class="rk">天嗣</div>', '   <div class="calc-note">基础字段据PDF第${page}页；完整日忌、宫位与制化仍须回原页，不等于整课已核。${gz===\'辛巳\'?\'原第18项题头误印己巳，依序及十神对应归辛巳；正常己巳另在第6项。\':\'\'}</div>\n   <div class="rrow"><div class="rk">天嗣</div>')
change("if(type==='三煞'){const s=rnd(SHAN),", "if(type==='三煞'){const s=rnd(SHAN.filter(x=>!'乾坤艮巽'.includes(x))),")
change("if(type==='岁破'){const s=rnd(SHAN),", "if(type==='岁破'){const s=rnd(ZHI),")
a=s.index('  const pool=SHAN.filter(x=>ZHENGYINFU');b=s.index('\n}',a)
s=s[:a]+'''  const rules=window.ZERI_MOUNTAINS||{},pool=SHAN.filter(x=>rules[x]&&rules[x].pairs.length===1);
  if(!pool.length)return genQ('六冲');
  const s=rnd(pool),r=rules[s],a=r.pairs[0];
  return{stem:`【${r.kind}】坐 <b>${s}山</b>，依逐山原条对应哪组天干？`,ans:a,opts:optFrom(['甲己','乙庚','丙辛','丁壬','戊癸'],a)};''' +s[b:]
p.write_text(s)
print('逐山阴府、兼向、主命四煞、女命冲支与速查出题已校正')
