"""本体系定式复核：60女命原页420字段、120项独立十神五虎遁、24山阴府原条。"""
import json,re,subprocess
from pathlib import Path
R=Path(__file__).resolve().parent
pages=json.loads((R/'_src/pages.json').read_text())
code="const fs=require('fs'),vm=require('vm'),c={};vm.createContext(c);vm.runInContext(fs.readFileSync('data.js','utf8')+';this.W=WOMEN',c);process.stdout.write(JSON.stringify(c.W));"
w=json.loads(subprocess.check_output(['node','-e',code],cwd=R,text=True))
G='甲乙丙丁戊己庚辛壬癸';Z='子丑寅卯辰巳午未申酉戌亥';n=0
for i in range(60):
 p=992+i;s=re.sub(r'\s+','',pages[p-1]);gz=G[i%10]+Z[i%12];label=re.search('(['+G+']['+Z+'])女',s)[1]
 if label!=gz:assert (p,label,gz)==(1009,'己巳','辛巳'),(p,label,gz)
 for k,l in [('dali','大利'),('jili','(?:吉利|小利)'),('wg','翁姑'),('fm','父母'),('fu','夫星[：:]'),('si','天嗣[：:]'),('tai','胎元[：:]')]:
  val=re.search(l+'(['+G+Z+']{2})',s)[1]
  if (p,k) in [(1000,'fu'),(1015,'si')]:assert val=='巳酉';val='己酉' # 已逐页看图核对，是文字层己/巳，不是改原规则。
  assert w[gz][k]==val,(p,gz,k,w[gz][k],val);n+=1
 # 夫星正官、天嗣食神：按女命年干生克阴阳独立求干，再由五虎遁求支。
 g=i%10;fu=[7,6,9,8,1,0,3,2,5,4][g];si=(g+2)%10
 start=(g%5*2+2)%10
 for key,stem in [('fu',fu),('si',si)]:
  possible=[G[(start+m)%10]+Z[(2+m)%12] for m in range(12) if (start+m)%10==stem]
  assert w[gz][key] in possible,(gz,key,w[gz][key],possible)
print('通过：女命60×7='+str(n)+'字段；夫星天嗣120项独立推算。')
print('已说明原源差异：第1009页题头己巳→按序归辛巳；1000/1015页文字层己巳近形字。')
# 逐山规则由原文生成，但另外用人工复核的24山对应当基准，防八卦整套套山。
expected={'壬':('傍','丁壬乙庚'),'子':('正','丙辛'),'癸':('傍','丙辛'),'丑':('傍','乙庚'),'艮':('正','甲己'),'寅':('傍','丁壬'),'甲':('傍','乙庚丁壬'),'卯':('正','戊癸'),'乙':('傍','戊癸丙辛'),'辰':('傍','丙辛'),'巽':('正','甲己'),'巳':('傍','乙庚'),'丙':('傍','甲己'),'午':('正','丁壬'),'丁':('傍','乙庚'),'未':('傍','戊癸'),'坤':('正','丙辛戊癸'),'申':('傍','丙辛'),'庚':('傍','戊癸'),'酉':('正','乙庚'),'辛':('傍','甲己'),'戌':('傍','丁壬'),'乾':('正','乙庚丁壬'),'亥':('傍','戊癸')}
text=(R/'data-mountain.js').read_text();m=json.loads(text.split('window.ZERI_MOUNTAINS=',1)[1].rstrip(';\n'))
for shan,(kind,pairs) in expected.items():
 assert m[shan]['kind']==kind+'阴府',shan
 assert set(m[shan]['pairs'])==set(pairs[j:j+2] for j in range(0,len(pairs),2)),shan
print('通过：24山正傍类别与全部对应组，独立基准核对。')
