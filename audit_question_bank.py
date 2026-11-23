"""Independent content checks; this does not replace reading each question and source."""
from pathlib import Path
from collections import Counter
import hashlib,json,re
from build_question_bank import norm,_evidence

R=Path(__file__).resolve().parent
qs=json.loads((R/'question-bank/questions.json').read_text())
cat=json.loads((R/'question-bank/sources.json').read_text())
pages=json.loads((R/'_src/pages.json').read_text()) if (R/'_src/pages.json').exists() else None
assets=json.loads((R/'question-bank/page-assets.json').read_text())
assert len(qs)==len({q['id'] for q in qs})
assert len(qs)==len({norm(q['q']) for q in qs})
# 旧题完整性独立基准：追加题不修改原题及其稳定 ID、版本。
assert hashlib.sha256(json.dumps(qs[:327],ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()=='00bda8a2d3c67bf63546e36b2c09b6166c27bd6207bc00ef27647fa618ccb4f8'
assert len([q for q in qs if q['id'].startswith('zq-detail-')])==283
assert hashlib.sha256(json.dumps(qs[:610],ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()=='49a529d35c79bd80f4e3a900e3c440dc226ee544d2536e7550824f81c6ee653f'
byid={q['id']:q for q in qs}
def answer(key,value):assert byid['zq-'+key]['a']==value,(key,value)
for z,el in zip('子丑寅卯辰巳午未申酉戌亥','水土木木土火火土金金土水'):answer('branch-element-'+z,el)
for group,place in [('甲己','辰巳'),('乙庚','寅卯子丑'),('丙辛','戌亥'),('丁壬','申酉'),('戊癸','午未')]:answer('dutian-'+group,place)
for group,day in [('甲己','庚午'),('乙庚','甲申'),('丙辛','戊戌'),('丁壬','壬子'),('戊癸','甲寅')]:answer('beam-collapse-'+group,day)
for group,months in [('子午','丑未'),('丑未','子午'),('寅申','卯酉'),('卯酉','寅申'),('辰戌','巳亥'),('巳亥','辰戌')]:answer('wedding-good-month-'+group,months)
for key,expected in [('yuan','元辰'),('wu','贪官'),('tan','破鬼'),('po','廉子'),('lian','武财')]:answer('dou-second-'+key,expected)
for q in qs:
 assert len(set([q['a'],*q['w']]))==4 and len(q['w'])==3,q['id']
 assert not re.search(r'视频|中观|奇门|六爻|杨筠松|王进武|蒋大鸿',json.dumps(q,ensure_ascii=False)),q['id']
 assert not re.search(r'哪位讲者|谁说的|来自哪份|哪个版本|下句|接龙|比喻',q['q']),q['id']
 assert len(q['quote'])>=3,q['id']
 _evidence.check_quote(q,pages,assets)
 assert len(q['a'])<=max(map(len,q['w'])),q['id']
 a=assets[str(q['page'])];p=R/a['file'];assert p.exists(),p
 assert hashlib.sha256(p.read_bytes()).hexdigest()==a['sha256'],p
 # In a body of rules, irrelevant everyday facts should not serve as distractors.
 assert not any(w in '|'.join(q['w']) for w in ['颜色','品牌','天气晴雨','发票','礼品','门牌数字','宾客签到','酒店开灯']),q['id']
assert set(assets)=={str(q['page']) for q in qs}
print(f"通过：{len(qs)}个稳定题ID、四选一、题干去重、短依据、原教材归属、全部{len(assets)}张原页素材及哈希。")
print('通过：地支五行、五组都天、倒家煞、女命大利月、斗首番化独立答案核对；无正解独自最长题。')
for b in cat['books']:
 n=sum(q['book']==b['id'] for q in qs);ch={q['chapter'] for q in qs if q['book']==b['id']}
 print(b['title'],f'{n}题 / {len(ch)}个有题章节')
print(f"原文核对：{sum(not q.get('evidenceRef') for q in qs)}题"+('已执行文字层对照；' if pages else '本机无文字层，跳过该层；')+f"{sum(bool(q.get('evidenceRef')) for q in qs)}题核已登记的原图短段及图片哈希。")

# 第1/2课逐条问答的持久对账，不以总题数代替覆盖核验。
review=json.loads((R/'question-bank/reviews/basic-01-02.json').read_text())
units=review['units'];assert len(units)==117 and len({u['key'] for u in units})==117
assert Counter(u['chapter'] for u in units)=={'basic-0119':49,'basic-0145':68}
assert Counter(u['status'] for u in units)=={'covered':104,'held':9,'outside':4}
covered=set(review['bodyQuestions'])
for u in units:
 assert ('basic-0119' if 136<=u['page']<=144 else 'basic-0145')==u['chapter']
 if u['status']=='covered':
  assert u['questionIds']
  for qid in u['questionIds']:
   q=byid[qid];assert q['chapter']==u['chapter'],qid
   assert q['qaRef']==('136-1' if u['key']=='139-9' else u['key']),qid
   covered.add(qid)
 else:assert not u['questionIds'] and len(u['reason'])>10
new={q['id'] for q in qs if q['id'].startswith('zq-qa12-')}
assert new==covered and len(new)==review['addedQuestions']==121
assert sum(len(byid[i]['a'])<min(map(len,byid[i]['w'])) for i in new)/len(new)<0.2,'新题正解过度偏短，需逐题重写同层次干扰项'
# 独立核实际条件的答案，不只核原句是否存在。
for ref,expected in [('138-7','碑向'),('140-18','定磉竖柱按坐山'),('141-26','壬癸水星'),('166-15','坐山兼中宫'),('167-22','有大吉星可搬'),('168-29','日时均论'),('172-62','出生年干支')]:
 assert expected in {q['a'] for q in qs if q.get('qaRef')==ref},ref
print('两课问答对账通过：117条逐项定位，104条有对应题；9条待核、4条非本轮范围；正文补充另列，无悬空题ID。')

# 后续71章采用逐项记录，基准题不得随扩题改写或串号。
round3=json.loads((R/'question-bank/reviews/all-courses-round3.json').read_text())
assert round3['baselineQuestions']==731
assert hashlib.sha256(json.dumps(qs[:731],ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()==round3['baselineSha256']
expected={c['id'] for b in cat['books'] for c in b['chapters']}-{ 'basic-0119','basic-0145'}
assert set(round3['scope'])==expected and len(round3['scope'])==71
assert {c['id'] for c in round3['chapters']}==expected
new3={q['id'] for q in qs if q['id'].startswith('zq-r3-')}
assert len(new3)==round3['addedQuestions'] and new3=={q['id'] for q in qs[731:]}
linked=set();counts=Counter();chapter_meta={c['id']:c for b in cat['books'] for c in b['chapters']}
for c in round3['chapters']:
 meta=chapter_meta[c['id']]
 assert c['reviewedPages'] and c['units'],c['id']
 assert all(meta['start']<=p<=meta['end'] for p in c['reviewedPages']),c['id']
 assert len(c['units'])==len({u['key'] for u in c['units']}),c['id']
 for u in c['units']:
  assert meta['start']<=u['page']<=meta['end'] and u['reason'],u['key']
  assert u['status'] in ['covered','held','outside'];counts[u['status']]+=1
  if u['status']=='covered':
   assert u['questionIds'],u['key']
   for qid in u['questionIds']:
    assert qid in byid and byid[qid]['chapter']==c['id'],(u['key'],qid)
    linked.add(qid)
  else:assert not u['questionIds'],u['key']
assert new3<=linked,('新题未对账',new3-linked)
for book in {byid[i]['book'] for i in new3}:
 cohort=[byid[i] for i in new3 if byid[i]['book']==book]
 assert sum(len(q['a'])<min(map(len,q['w'])) for q in cohort)/len(cohort)<.2,('答案偏短',book)
# 本轮特别容易混淆的实际条件：不能只核引文是否存在。
for suffix,expected_answer in [('9d5f4c7b222f','开忌葬闭可葬'),('dc510bbc70c9','火'),('3d07b80d837b','水')]:
 q=byid['zq-r3-theory-'+suffix];assert expected_answer in q['a'],q['id']
q=byid['zq-r3-applied-0b495a017c4f'];assert '子山' in q['q'] and '子、辰' in q['q'] and '半合' in q['a']
assert not any(i.endswith('92dc229a7c59') for i in new3),'天官偏冲异文未解不得入题'
print(f"后续71章对账通过：新增{len(new3)}题、原731题基准不变；条目{dict(counts)}。")
