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
# 新补教材表：用独立起点推算登天240格、麒麟288格，保留原页戊/戌异文。
def chapter_text(n):
 files=list((R/'content/教材').glob(f'*/{n:02}-*.md'));assert len(files)==1;return files[0].read_text()
ch18=chapter_text(18);star_rows=re.findall(r'^\| (立春|雨水|惊蛰|春分|清明|谷雨|立夏|小满|芒种|夏至|小暑|大暑|立秋|处暑|白露|秋分|寒露|霜降|立冬|小雪|大雪|冬至|小寒|大寒) \| ([^\n]+)',ch18,re.M)
# Only 24-step rows here; the separate 12-month table has 阳贵/阴贵 as its second cell.
star_rows=[(term,[v.strip() for v in row.strip('| ').split('|')]) for term,row in star_rows if '贵' not in row]
assert len(star_rows)==24
for term,vals in star_rows:
 assert len(vals)==14,(term,vals)
 star,solar=vals[:2]
 for hour,location in enumerate(vals[2:]):assert location==Z[(hour+Z.index(star)-Z.index(solar))%12],(term,hour,location)
months=['雨水','春分','谷雨','小满','夏至','大暑','处暑','秋分','霜降','小雪','冬至','大寒'];gu={'阳贵':'未申酉亥丑子丑寅卯巳','阴贵':'丑子亥酉未申未午巳卯'}
rows=re.findall(r'^\| ('+'|'.join(months)+r') \| (阳贵|阴贵) \| ([^\n]+)',ch18,re.M);assert len(rows)==24
for term,kind,row in rows:
 vals=[v.strip() for v in row.strip('| ').split('|')];assert len(vals)==10
 solar=(11-months.index(term))%12
 for j,v in enumerate(vals):
  expected=Z[(solar+11-Z.index(gu[kind][j]))%12]
  if (term,kind,j)==('春分','阳贵',3):assert v=='戊〔待核〕' and expected=='戌'
  else:assert v==expected,(term,kind,j,v,expected)
ch33=chapter_text(33);table=ch33.split('### 乌兔太阳日按月朔柱查',1)[1].split('## 三、',1)[0]
sets=re.findall(r'^\| ([甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥、]+) \|',table,re.M);pillars=[x for row in sets for x in row.split('、')]
assert len(pillars)==60 and len(set(pillars))==60
assert set(pillars)=={G[i%10]+Z[i%12] for i in range(60)}
print('通过：新增麒麟到方288格、贵人登天240格独立复算；乌兔月朔60甲子无漏重。')
