"""Source, content-boundary and independent nomenclature audit (no network needed)."""
import json,re
from build_glossary import build,BASE,ROOT
D=build();T={x['title']:x for x in D['terms']};Q={x['term']:x for x in D['questions']}
# 独立核与教材/历法最容易串层的定义；不靠浏览器生成答案作基准。
checks={
 '动土':['阳宅','挖土'],'破土':['安葬','墓穴'],'移徙':['迁移居所'],'入宅':['正式迁入'],
 '入殓':['遗体','入棺'],'安葬':['入墓'],'起攒':['开启旧墓'],'合寿木':['棺木'],
 '年命':['出生年'],'仙命':['出生年'],'祭主':['在世'],
 '五虎遁':['年干','月天干'],'五鼠遁':['日干','时辰天干'],
 '日破':['日支','坐山'],'时破':['时支','坐山'],
 '旬空':['每旬十组','两支'],'真太阳时':['实际可见太阳'],'平太阳时':['假想太阳'],
 '四离日':['春分','秋分','夏至','冬至','前一日'],'四绝日':['立春','立夏','立秋','立冬','前一日'],
 '元辰':['相同'],'武财':['所克'],'廉子':['所生'],'贪官':['生山'],'破鬼':['克山'],
}
for title,words in checks.items():
 for word in words:assert word in T[title]['definition'],(title,word)
assert '甲己土、乙庚金、丙辛水、丁壬木、戊癸火' in T['化气']['definition']
for title in ['阴府','山运','胎元','白虎','天狗','截路空亡']:
 assert any(w in T[title]['distinguish'] for w in ['争议','不同','分开','异文','差异','两','跨表','同名不能同算','同名条目']),title
assert set(Q)=={t['id'] for t in D['terms'] if not t.get('trainingUnavailable')},'可训练词题覆盖不齐'
assert all(t.get('trainingUnavailable') or t['id'] in Q for t in D['terms'])
assert all(len(t['sources'])+len(t['refs']) for t in D['terms'])
# 词条已有的别名不能被当作另一个错误选项。
for q in D['questions']:
 t=next(t for t in D['terms'] if t['id']==q['term'])
 assert not set(q['w']) & set([t['title'],*t['aliases']]),('把同义词当错项',q['id'])
 assert not re.search(r'/Users/|file://|待补|TODO|某例|例中',json.dumps(q,ensure_ascii=False)),q['id']
longest=sum(len(q['a'])>max(map(len,q['w'])) for q in D['questions'])
assert longest/len(D['questions'])<0.25,'长度提示过多'
old=json.loads((ROOT/'question-bank/questions.json').read_text());assert len(old)==610
print(f"通过：{len(D['terms'])}词与{len(D['questions'])}题，可训练词一对一；结构、出处短据、别名干扰项、禁词、术语层次与争议边界；教材题库610题，名词数据另行核验。")
print(f'长度提示抽查：正解独自最长{longest}题（{longest/len(D["questions"]):.1%}），不是多数。题目只考词义与条件识别，不据争议判断日课吉凶。')
