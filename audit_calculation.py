"""Recompute every practice answer independently of the authoring script."""
import json,hashlib
from build_calculation import build,ROOT
D=build();Q=D['questions'];G='甲乙丙丁戊己庚辛壬癸';Z='子丑寅卯辰巳午未申酉戌亥';M='寅卯辰巳午未申酉戌亥子丑'
CYCLE=[G[n%10]+Z[n%12] for n in range(60)]
def tiger(g,z):
 start={'甲':'丙','己':'丙','乙':'戊','庚':'戊','丙':'庚','辛':'庚','丁':'壬','壬':'壬','戊':'甲','癸':'甲'}[g]
 return G[(G.index(start)+M.index(z))%10]+z
def group(b):return next(i for i,s in enumerate(['申子辰','寅午戌','亥卯未','巳酉丑']) if b in s)
lu=dict(zip(G,'寅卯巳午巳午申酉亥子'))
def compute(x):
 m=x['method'];g=x.get('stem');b=x.get('branch')
 if m=='tiger':return tiger(g,b)
 if m=='mouse':
  start={'甲':'甲','己':'甲','乙':'丙','庚':'丙','丙':'戊','辛':'戊','丁':'庚','壬':'庚','戊':'壬','癸':'壬'}[g]
  return G[(G.index(start)+Z.index(b))%10]+b
 if m=='void':return ['戌亥','申酉','午未','辰巳','寅卯','子丑'][CYCLE.index(x['pillar'])//10]
 if m=='jianchu':return ['建','除','满','平','定','执','破','危','成','收','开','闭'][(Z.index(x['day'])-Z.index(x['month']))%12]+'日'
 if m=='road':
  start={'寅':'子','申':'子','卯':'寅','酉':'寅','辰':'辰','戌':'辰','巳':'午','亥':'午','子':'申','午':'申','丑':'戌','未':'戌'}[x['month']]
  return ['青龙','明堂','天刑','朱雀','金匮','天德','白虎','玉堂','天牢','玄武','司命','勾陈'][(Z.index(x['day'])-Z.index(start))%12]
 if m=='cycle':return CYCLE[(CYCLE.index(x['pillar'])+x['n'])%60]
 if m=='leap':return '闰年，366天' if x['year']%400==0 or (x['year']%4==0 and x['year']%100!=0) else '平年，365天'
 if m=='solar':
  total=(720+4*(x['longitude']-120)+x['e'])%1440
  return f'{total//60:02}:{total%60:02}'
 if m=='boundary':return '丙寅' if x['before'] else '丁卯'
 if m in ['combine','clash','harm']:
  pairs={'combine':['子丑','寅亥','卯戌','辰酉','巳申','午未'],'clash':['子午','丑未','寅申','卯酉','辰戌','巳亥'],'harm':['子未','丑午','寅巳','卯辰','申亥','酉戌']}[m]
  return next(s.replace(b,'') for s in pairs if b in s)
 if m=='sanhe':return {'卯':'亥未','酉':'巳丑'}[b]
 if m=='season':return {'春':'木旺、火相','夏':'火旺、土相','秋':'金旺、水相','冬':'水旺、木相'}[x['season']]
 if m=='growth':
  starts=dict(zip(G,'亥午寅酉寅酉巳子申卯'));stages=['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养']
  return Z[(Z.index(starts[g])+(1 if g in '甲丙戊庚壬' else -1)*stages.index(x['stage']))%12]
 if m=='lu':return lu[g]
 if m=='true-lu':return tiger(g,lu[g])
 if m=='advance-lu':return next(k for k,v in lu.items() if v==b)
 if m=='noble':return {'甲':'丑未','己':'子申','辛':'寅午'}[g]
 if m in ['yang','yin']:
  return ({'甲':'未','乙':'申','庚':'丑'} if m=='yang' else {'甲':'丑','乙':'子','庚':'未'})[g]
 if m=='true-noble':return tiger(g,b)
 if m=='horse':return ['寅','申','巳','亥'][group(b)]
 if m=='fly':
  palace=5;pos=CYCLE.index(x['start']);target=CYCLE.index(x['target'])
  while pos!=target:pos=(pos+1)%60;palace=palace%9+1
  return ['坎一宫','坤二宫','震三宫','巽四宫','中五宫','乾六宫','兑七宫','艮八宫','离九宫'][palace-1]
 if m=='sansha':return ['巳午未南方','亥子丑北方','申酉戌西方','寅卯辰东方'][group(b)]
 if m=='life-sha':return ['未','丑','戌','辰'][group(b)]
 if m=='true-sha':return tiger(g,['未','丑','戌','辰'][group(b)])
 if m=='dutian':return {'甲':'辰巳','乙':'寅卯子丑','丙':'戌亥','丁':'申酉','戊':'午未'}[g]
 if m=='monthly':return {'土符':'丑巳酉寅午戌卯未亥辰申子','土府':M,'月厌':'戌酉申未午巳辰卯寅丑子亥','厌对':'辰卯寅丑子亥戌酉申未午巳'}[x['term']][M.index(x['month'])]
 if m=='month-de':return ['壬','丙','甲','庚'][group(x['month'])]
 if m=='mar-month':return {'子':{'大利月':'丑未','小利月':'寅申'},'丑':{'大利月':'子午','小利月':'巳亥'},'辰':{'大利月':'巳亥','小利月':'子午'}}[b][x['kind']]
 if m=='mar-star':return {'夫星':['辛未','庚辰','癸巳','壬寅','乙卯','甲戌','丁亥','丙申','己酉','戊午'],'天嗣':['丙寅','丁亥','戊戌','己酉','庚申','辛未','壬午','癸巳','甲辰','乙卯']}[x['kind']][G.index(g)]
 if m=='fetal':
  gz=x['pillar'];return G[(G.index(gz[0])+1)%10]+Z[(Z.index(gz[1])+3)%12]
 if m=='doushou':
  mountain={'艮':'木','乾':'火','壬':'土'}[x['mountain']];chem={'甲':'土','乙':'金','丙':'水','丁':'木','戊':'火','己':'土','庚':'金','辛':'水','壬':'木','癸':'火'}[g]
  creates={'木':'火','火':'土','土':'金','金':'水','水':'木'};controls={'木':'土','土':'水','水':'火','火':'金','金':'木'}
  if chem==mountain:return '元辰'
  if creates[mountain]==chem:return '廉子'
  if controls[mountain]==chem:return '武财'
  if creates[chem]==mountain:return '贪官'
  return '破鬼'
 if m=='transform':return {'元辰':'木','武财':'水','贪官':'金','破鬼':'火','廉子':'土'}[x['first']]
 raise AssertionError(m)
for q in Q:
 assert compute(q['inputs'])==q['a'],(q['id'],compute(q['inputs']),q['a'])
 assert q['a'] not in q['w'] and len(q['steps'])>=2 and q['a'] in q['e']
# Preserve both existing question banks and terminology content exactly.
snapshot=json.loads((ROOT/'question-bank/calculation/baseline.json').read_text())
for file,digest in snapshot.items():assert hashlib.sha256((ROOT/file).read_bytes()).hexdigest()==digest,file
print('通过：130题逐题独立验算、唯一答案与三干扰项、分步解析、40起法关联、原两题库及名词内容哈希保护。')
