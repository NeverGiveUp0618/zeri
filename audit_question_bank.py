"""Independent content checks; this does not replace reading each question and source."""
from pathlib import Path
from collections import Counter
import hashlib,json,re
from build_question_bank import norm

R=Path(__file__).resolve().parent
qs=json.loads((R/'question-bank/questions.json').read_text())
cat=json.loads((R/'question-bank/sources.json').read_text())
pages=json.loads((R/'_src/pages.json').read_text()) if (R/'_src/pages.json').exists() else None
assets=json.loads((R/'question-bank/page-assets.json').read_text())
assert len(qs)==len({q['id'] for q in qs})
assert len(qs)==len({norm(q['q']) for q in qs})
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
 if pages:assert norm(q['quote']) in norm(pages[q['page']-1]),q['id']
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
print('原文核对：'+('已执行本地原页文字对照。' if pages else '本机无原页文字，未执行该层。'))
