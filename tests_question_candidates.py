"""Extraction regressions: cross-page answers, inline followups and numbered notes."""
from pathlib import Path
import hashlib,json,tempfile
from find_question_candidates import extract_qa,pages_text,match,run
checks=0

def test(name,fn):
 global checks
 fn();checks+=1;print('✓',name)

def extract(pages):
 t,o=pages_text(pages,1,len(pages));return extract_qa(t,o,1,'test')

def cross_page():
 u=extract(['1、修方如何选？\n答：先看实际动方，','再核所犯神煞。\n2、入宅看谁？\n答：主事年命。'])
 assert len(u)==2 and u[0]['questionPage']==1 and u[0]['answerEndPage']==2
 assert '再核所犯神煞' in u[0]['answer'] and '2、' not in u[0]['answer']
test('跨页答复保持完整且不吞下一问',cross_page)

def inline():
 u=extract(['问：安床看谁？答：男女共同。问：只看女命吗？答：不是。'])
 assert len(u)==2 and u[1]['question']=='只看女命吗？' and u[0]['answer']=='男女共同。'
test('一行多个问答分别定位',inline)

def notes():
 u=extract(['1、执日可以搬家吗？\n答：有大吉星可以。\n2、月忌是小煞。\n3、放水是什么？\n答：出水。'])
 assert len(u)==3 and sum(x['kind']=='numbered_note' for x in u)==1
 assert u[0]['answer']=='有大吉星可以。' and next(x for x in u if x['kind']=='numbered_note')['number']=='2'
test('无答的编号陈述单列，不粘在上一答',notes)

def sublists():
 u=extract(['34、迁坟怎么选？\n答：1、先定新地。\n2、再定旧地。\n35、祭主如何查？\n答：按年命。'])
 assert len(u)==2 and all(x['kind']=='qa' for x in u) and '2、再定旧地' in u[0]['answer']
test('答案中的步骤编号不误认为新原问',sublists)

def missing():
 u=extract(['13、\n答：从午起青龙。'])
 assert len(u)==1 and not u[0]['question'] and u[0]['confidence']=='review'
test('缺原问句仍列待审，不捏造问题',missing)

def repeats():
 u=extract(['1、第一问？\n答：甲。\n1、重排问？\n答：乙。'])
 assert len({x['id'] for x in u})==2 and u[1]['key'].endswith('repeat2')
test('同页重复编号不覆盖候选',repeats)

def partial_match():
 q={'id':'q1','chapter':'test','q':'如何修方？','e':'查实际方位。','quote':'先查方位'}
 u={'chapter':'test','question':'问？','answer':'先查方位，另须避大煞。'}
 matches=match(u,[(q,'draft')]);assert matches[0]['state']=='draft' and '部分覆盖' in matches[0]['method']
test('草稿与已发布分清，短据匹配不冒充全部覆盖',partial_match)

def real_lessons():
 root=Path(__file__).resolve().parent
 bank=root/'question-bank/questions.json';before=hashlib.sha256(bank.read_bytes()).digest()
 with tempfile.TemporaryDirectory() as d:
  r=run(out=Path(d)/'candidates.json',books=['basic'])
  cs={c['id']:c for c in r['chapters']}
  assert cs['basic-0119']['qaCandidates']+cs['basic-0119']['numberedNotes']==49
  assert cs['basic-0145']['qaCandidates']+cs['basic-0145']['numberedNotes']==68
  assert all(u['confidence'] in ['high','review'] for u in r['candidates'])
 assert hashlib.sha256(bank.read_bytes()).digest()==before
 test_count=len(r['candidates']);assert test_count>100

test('用两课已人工清点的49/68项回归，且绝不改题库',real_lessons)
print('通过',checks,'项找题脚本检查')
