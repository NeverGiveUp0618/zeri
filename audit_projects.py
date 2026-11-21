"""检查项目课程的任务结构、知识来源、步骤链接及原例字段。"""
import json,re
from pathlib import Path
from build_course import render
root=Path(__file__).resolve().parent
meta=json.loads((root/'content/项目目录.json').read_text())
d=json.loads((root/'data-course.js').read_text().split('window.ZERI_COURSE=',1)[1].rstrip(';\n'))
assert len(meta)==len(d['projects'])==6
knowledge={c['id']:c for c in d['chapters']}
allids=set(knowledge)|{p['id'] for p in meta}
resource_count=0
for src,p in zip(meta,d['projects']):
    text=(root/'content/项目'/src['file']).read_text()
    assert p['id']==src['id'] and p['outcome']==src['outcome']
    assert len(text)>1000 and not re.search('中观|视频|奇门|六爻|大六壬|盲派',text),p['id']
    assert all(s in text for s in ['这次要完成的事','最后交出的东西','交付']),p['id']
    parts=re.split(r'^## (.+)$',text,flags=re.M)
    for i,s in enumerate(p['sections']):
        assert s['id']==f"{p['id']}-s{i+1}"
        assert s['title']==parts[2*i+1] and s['html']==render(parts[2*i+2]),p['id']
    pages={page for cid in src['sourceChapters'] for page in knowledge[cid]['refs']}
    for page in re.findall(r'第(\d{2,4})页',text):assert int(page) in pages,(p['id'],page)
    for target in re.findall(r'\]\(#((?:zr|zp)-\d{2})',text):assert target in allids,target
    for step,refs in src['resources'].items():
        assert 1<=int(step)<=len(p['sections'])
        for r in refs:
            assert r['chapter'] in src['sourceChapters'] and 1<=r['section']<=8
            if 'table' in r:assert 0<=r['table']<knowledge[r['chapter']]['sections'][r['section']-1]['html'].count('class="table-frame')
            resource_count+=1
    if p.get('caseId'):
        case=next(x for x in d['cases'] if x['id']==p['caseId'])
        assert case['pages'] and case['chapter'] in src['sourceChapters']
case=next(c for c in d['cases'] if c['id']=='case-02')
assert case['pillars']==['壬寅','壬寅','庚子','庚辰']
assert case['alternative']==['壬寅','壬寅','庚子','辛巳']
first=(root/'content/项目'/meta[0]['file']).read_text()
assert '没有未和午' in first and '只有寅，没有午戌' in first
assert '庚辰、辛巳' in first
print(f'通过：6个项目、{sum(len(p["sections"]) for p in d["projects"])}个任务步骤、{resource_count}处随步骤知识来源；原例时柱与换时演算一致。')
print('此检查不代替教学质量审阅，也不宣称现实日课全部已核。')
