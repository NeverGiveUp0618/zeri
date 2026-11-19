"""结构、题目、出处、盘面与原文引文核对；无源PDF时结构检查仍可运行。"""
import html,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent
cats=json.loads((ROOT/'content/课程目录.json').read_text())
assert len(cats)==34
assert len({c['id'] for c in cats})==len(cats)
compiled=json.loads((ROOT/'data-course.js').read_text().split('window.ZERI_COURSE=',1)[1].rstrip(';\n'))
compiled_by={c['id']:c for c in compiled['chapters']}
chapter_ids={c['id'] for c in cats}
knowledge_ids=set(re.findall(r'id:\s*"([^"]+)"',(ROOT/'data.js').read_text()))
ids=set(); quotes=0; qcount=0; all_md=''; longest=0
source=ROOT/'_src/pages.json'
pages=json.loads(source.read_text()) if source.exists() else None
def norm(s):return re.sub(r'[^\u4e00-\u9fffA-Za-z0-9]','',s.replace('视频','v课').replace('中观',''))
for c in cats:
    name=f"{c['n']:02}-{c['title']}"
    md=(ROOT/'content/教材'/c['stage']/(name+'.md')).read_text();all_md+=md
    assert all(k in knowledge_ids for k in c['keys']),(c['id'],'关联速查不存在')
    for link in re.findall(r'\]\(#(zr-\d{2})\)',md):
        assert link in chapter_ids,(c['id'],link)
        if link in re.findall(r'\]\(#(zr-\d{2})\)',md.split('## ',1)[0]):
            assert int(link[3:])<c['n'],(c['id'],'前置必须在本章之前')
    sections=re.findall(r'^## (.+)$',md,re.M)
    assert len(sections)==8,(c['id'],sections)
    assert all(1<=n<=1832 for n in c['refs'])
    assert len(md)>800,(c['id'],'章节意外变短')
    for quote,page in re.findall(r'^> (.+)\n>\n> 〔《择日合集》PDF第(\d+)页〕',md,re.M):
        if pages:assert norm(quote) in norm(pages[int(page)-1]),(c['id'],page,'引文未命中')
        quotes+=1
    qs=json.loads((ROOT/'content/题目'/c['stage']/(name+'.json')).read_text())
    assert len(qs)>=4
    built_qs=compiled_by[c['id']]['questions']
    assert [{k:v for k,v in q.items() if k!='rev'} for q in built_qs]==qs,(c['id'],'构建题目与源不一致')
    assert all(re.fullmatch(r'[0-9a-f]{12}',q['rev']) for q in built_qs)
    for q in qs:
        assert q['id'] not in ids,q['id'];ids.add(q['id']);qcount+=1
        assert len(q['w'])==3 and len(set([q['a']]+q['w']))==4,q['id']
        assert not any(w in ''.join(q['w']) for w in ['婚纱颜色','门牌笔画','生日蛋糕']),q['id']
        assert q['sec'] in sections,(q['id'],'小节不存在')
        assert q['e'] and len(q['a'])<=23,q['id']
        assert not re.search(r'例中|如上例|那个命主|这个盘|谁说过|哪份讲义',q['q']),q['id']
        if len(q['a'])>max(map(len,q['w'])):longest+=1
assert not re.search('中观|视频|奇门遁甲起局',all_md),'展示层禁用词'
cases=json.loads((ROOT/'content/案例.json').read_text())
gan='甲乙丙丁戊己庚辛壬癸';zhi='子丑寅卯辰巳午未申酉戌亥'
def valid_pillars(p):
    for col in p:
        if col=='—':continue
        if len(col)!=2 or col[0] not in gan or col[1] not in zhi or gan.index(col[0])%2!=zhi.index(col[1])%2:return False
    if p[0]!='—' and p[1]!='—':
        start=(gan.index(p[0][0])%5*2+2)%10
        if gan.index(p[1][0])!=(start+(zhi.index(p[1][1])-2)%12)%10:return False
    if p[2]!='—' and p[3]!='—':
        start=gan.index(p[2][0])%5*2
        if gan.index(p[3][0])!=(start+zhi.index(p[3][1]))%10:return False
    return True
for c in cases:
    assert c['chapter'] in {c['id'] for c in cats}
    if 'pillars' in c:
        if c.get('illustration'):assert not valid_pillars(c['pillars']),c['id']
        else:assert valid_pillars(c['pillars']),c['id']
    if 'alternative' in c:assert valid_pillars(c['alternative']),c['id']
mountains=json.loads((ROOT/'content/二十四山原表.json').read_text())
assert len(mountains)==24 and len({m['id'] for m in mountains})==24
for m in mountains:
    assert len(m['text'])>250,m['id']
    if pages:assert norm(m['text']) in norm(''.join(pages[p-1] for p in m['pages'])),m['id']
assert longest/qcount<0.65,(longest,qcount,'正确答案长度过于突出')
print(f'通过：{len(cats)}章结构；{qcount}题；{quotes}段逐页引文；{len(cases)}个原例/示意；24山原表。')
print(f'正确答案独自最长：{longest}/{qcount}（未形成统一长度提示）。')
print('原PDF文字依据核对：'+('已执行（本地源）' if pages else '未执行，缺少本地源；不冒充出处核查已通过'))
