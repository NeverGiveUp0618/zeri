"""Independent checks for the 2026-11-25 worked examples and preserved data."""
from pathlib import Path
import hashlib,json,subprocess
R=Path(__file__).resolve().parent;B=R/'question-bank/glossary'
T=json.loads((B/'terms.json').read_text());by={t['title']:t for t in T}
review=json.loads((B/'算法补充复核.json').read_text())
assert len(review['added'])==93
assert sum(bool(t.get('derivation')) for t in T)==review['afterDerivations']==213
for name in review['added']:
 d=by[name]['derivation'];assert len(d['steps'])>=2 and d['basis'] and d['example']
for path,key in [('questions.json','questionsUnchangedSHA256'),('../questions.json','textbookQuestionsUnchangedSHA256')]:
 assert hashlib.sha256((B/path).read_bytes()).hexdigest()==review[key]
G='甲乙丙丁戊己庚辛壬癸';Z='子丑寅卯辰巳午未申酉戌亥'
cycle=[G[i%10]+Z[i%12] for i in range(60)]
def tiger(g,z):
 # Five groups start with 丙戊庚壬甲 at 寅.
 start=[2,4,6,8,0][G.index(g)%5]
 return G[(start+(Z.index(z)-2)%12)%10]+z
assert tiger('甲','寅')=='丙寅' and tiger('乙','卯')=='己卯'
assert tiger('甲','未')=='辛未' and tiger('甲','丑')=='丁丑'
assert tiger('癸','巳')=='丁巳' and tiger('乙','亥')=='丁亥'
for name,need in [('真禄',['丙寅','己卯']),('真贵人',['辛未','丁丑']),('驿马',['丁巳']),('天嗣',['丁亥'])]:
 text=json.dumps(by[name]['derivation'],ensure_ascii=False)
 assert all(x in text for x in need),name
# Derive every 戊己都天 group from all twelve tiger months, including the second pair.
expected={'甲':'辰巳','乙':'寅卯子丑','丙':'戌亥','丁':'申酉','戊':'午未'}
for g,want in expected.items():
 found=''.join(z for z in '寅卯辰巳午未申酉戌亥子丑' if tiger(g,z)[0] in '戊己')
 assert found==want,(g,found)
 assert want in json.dumps(by['戊己都天']['derivation'],ensure_ascii=False)
# Textbook's two known flying-lu results catch inclusive-count and palace-offset errors.
def fly(start,target):return (4+(cycle.index(target)-cycle.index(start))%60)%9+1
assert fly('庚子','丙寅')==4 and fly('庚寅','丙寅')==5
assert fly('庚子','己卯')==8
assert '26位' in by['飞禄']['derivation']['example']
assert (cycle.index('丙寅')-cycle.index('庚子'))%60==26
# Month-pillar fetal-origin transformation and reversed yin growth sequence.
def fetal(gz):return G[(G.index(gz[0])+1)%10]+Z[(Z.index(gz[1])+3)%12]
assert fetal('丙寅')=='丁巳'
assert '丁巳' in by['胎元']['derivation']['example']
gui=[Z[(3-i)%12] for i in range(12)]
assert ''.join(gui[7:10])=='申未午'
assert '申死、未墓、午绝' in by['十二长生']['derivation']['example']
# Longitude and equation-of-time sign, both explicitly defined in the explanation.
assert 12*60+4*(105-120)+8==11*60+8
assert '11:08' in by['真太阳时']['derivation']['example']
assert '10:54' in by['均时差']['derivation']['example']
assert (cycle.index('丙戌')//2)==11
assert '屋上土' in by['纳音']['derivation']['example']
for name,words in [('回头贡煞',['辰戌丑未','三合支全']),('洪范五行',['不一致']),('山运',['冬至','冲突']),('阴府',['冲突'])]:
 text=json.dumps(by[name]['derivation'],ensure_ascii=False)
 assert all(x in text for x in words),name
print('通过：93项新增推导结构、两题库SHA保护、五虎遁与真贵/真禄、五组都天全月、九宫计数、胎元与阴干逆排、时差符号、纳音序号及异文边界。')
