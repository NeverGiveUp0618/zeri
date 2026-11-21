"""课程Markdown/题目JSON -> 网页数据。标准库；不依赖原PDF即可重建。"""
import hashlib, html, json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parent

def inline(t):
    t=html.escape(t)
    t=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',t)
    t=re.sub(r'\[([^\]]+)\]\((#(?:zr|zp)-\d{2}(?:~[\w-]+)?)\)',r'<a href="\2">\1</a>',t)
    t=re.sub(r'〔([^〕]+)〕',r'<span class="citation">〔\1〕</span>',t)
    return t

def render(text):
    out=[]; lines=text.strip().splitlines(); i=0
    while i<len(lines):
        line=lines[i].strip()
        if not line: i+=1; continue
        if line.startswith('# '): i+=1;continue
        if line.startswith('## '):out.append('<h2>'+inline(line[3:])+'</h2>');i+=1;continue
        if line.startswith('### '):out.append('<h3>'+inline(line[4:])+'</h3>');i+=1;continue
        if line.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                cells=[c.strip() for c in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?',c) for c in cells):rows.append(cells)
                i+=1
            # Keep useful text widths even on a narrow screen; the wrapper scrolls.
            columns=max(map(len,rows),default=0)
            widths=[];compact=[]
            for col in range(columns):
                cells=[r[col] for r in rows if col<len(r)]
                length=max((sum(1 if ord(ch)>255 else .6 for ch in cell) for cell in cells),default=1)
                compact.append(length<=6)
                limit=12 if col==0 else 26
                widths.append(round(max(4.5,min(limit,length+2)),1))
            label=html.escape('、'.join(rows[0]),quote=True)
            out.append('<div class="table-frame"><div class="table-scroll-hint" aria-hidden="true">左右滑动查看表格 <span>→</span></div>')
            out.append(f'<div class="table-wrap" tabindex="0" role="region" aria-label="{label}，可横向滚动"><table class="{"table-many" if columns>=3 else "table-pair"}{" table-pinned" if columns>=3 and widths[0]<=9 else ""}" style="width:{sum(widths):g}em">')
            out.append('<colgroup>'+''.join(f'<col style="width:{w:g}em">' for w in widths)+'</colgroup><thead>')
            for j,row in enumerate(rows):
                if j==1:out.append('</thead><tbody>')
                tag='th' if j==0 else 'td'
                out.append('<tr>'+''.join(f'<{tag}'+(' scope="col"' if j==0 else '')+(' class="cell-compact"' if compact[k] else '')+f'>{inline(c)}</{tag}>' for k,c in enumerate(row))+'</tr>')
            out.append(('</tbody>' if len(rows)>1 else '</thead>')+'</table></div></div>');continue
        if line.startswith('>'):
            quote=[]
            while i<len(lines) and lines[i].strip().startswith('>'):
                quote.append(lines[i].strip().lstrip('>').strip());i+=1
            out.append('<blockquote>'+ '<br>'.join(inline(x) for x in quote)+'</blockquote>');continue
        if re.match(r'^(\d+\. |\- )',line):
            numbered=bool(re.match(r'^\d+\. ',line));tag='ol' if numbered else 'ul';out.append('<'+tag+'>')
            while i<len(lines) and re.match(r'^(\d+\. |\- )',lines[i].strip()):
                out.append('<li>'+inline(re.sub(r'^(\d+\. |\- )','',lines[i].strip()))+'</li>');i+=1
            out.append('</'+tag+'>');continue
        para=[]
        while i<len(lines) and lines[i].strip() and not re.match(r'^(#|>|\||\d+\. |\- )',lines[i].strip()):
            para.append(lines[i].strip());i+=1
        if para:out.append('<p>'+inline(''.join(para))+'</p>')
        else:i+=1
    return ''.join(out)

def build_projects(chapters, cases):
    items=json.loads((ROOT/'content/项目目录.json').read_text())
    knowledge={c['id']:c for c in chapters}
    assert len({p['id'] for p in items})==len(items)
    for n,p in enumerate(items,1):
        assert p['id']==f'zp-{n:02}' and p['n']==n
        assert all(cid in knowledge for cid in p['sourceChapters'])
        text=(ROOT/'content/项目'/p['file']).read_text()
        assert text.splitlines()[0]==f"# 项目{n} {p['title']}"
        parts=re.split(r'^## (.+)$',text,flags=re.M)
        p['project']=True;p['stage']='项目学习';p['questions']=[]
        p['intro']=render(parts[0]);p['text']=re.sub(r'[>#*|]','',text)
        p['sections']=[dict(id=f"{p['id']}-s{(i+1)//2}",title=parts[i],html=render(parts[i+1])) for i in range(1,len(parts),2)]
        assert len(p['sections'])>=6
        for step,refs in p['resources'].items():
            assert 1<=int(step)<=len(p['sections'])
            for r in refs:
                assert r['chapter'] in p['sourceChapters']
                assert 1<=r['section']<=len(knowledge[r['chapter']]['sections'])
                if 'table' in r:assert 0<=r['table']<knowledge[r['chapter']]['sections'][r['section']-1]['html'].count('class="table-frame')
        if p.get('caseId'):assert any(c['id']==p['caseId'] for c in cases)
        p['pages']=sorted({page for cid in p['sourceChapters'] for page in knowledge[cid]['refs']})
    return items


def build():
    catalog=json.loads((ROOT/'content/课程目录.json').read_text())
    key_names=dict(re.findall(r'id:\s*"([^"]+)".*?title:\s*"([^"]+)"',(ROOT/'data.js').read_text(),re.S))
    count=0; chars=0
    for c in catalog:
        name=f"{c['n']:02}-{c['title']}"
        p=ROOT/'content/教材'/c['stage']/(name+'.md')
        text=p.read_text(); chars+=len(text)
        parts=re.split(r'^## (.+)$',text,flags=re.M)
        c['intro']=render(parts[0])
        c['links']=[dict(id=k,title=key_names[k]) for k in c['keys'] if k in key_names]
        c['sections']=[dict(id=f"{c['id']}-s{(i+1)//2}",title=parts[i],html=render(parts[i+1])) for i in range(1,len(parts),2)]
        questions=json.loads((ROOT/'content/题目'/c['stage']/(name+'.json')).read_text())
        for q in questions:
            assert len(q['w'])==3 and len(set([q['a']]+q['w']))==4, q['id']
            assert q['sec'] in [s['title'] for s in c['sections']],q['id']
            q['rev']=hashlib.sha256(json.dumps(q,ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:12]
        c['questions']=questions;count+=len(questions)
        c['text']=re.sub(r'[>#*|]','',text)
        c['words']=len(re.findall('[\u4e00-\u9fff]',text))
    route=(ROOT/'content/学习路线.md').read_text()
    cases=json.loads((ROOT/'content/案例.json').read_text())
    mountains=json.loads((ROOT/'content/二十四山原表.json').read_text())
    # 精确到具体山的正/傍阴府对应，直接来自逐山条文；不把八卦原理表铺满24山。
    mountain_rules={}
    for m in mountains:
        part=re.search(r'4[、.]阴府[：:]?(.*?)(?:5[、.]|$)',m['text'],re.S)
        assert part,m['id']
        source=part[1].strip();plain=source.replace('、','').replace('，','')
        pairs=list(dict.fromkeys(re.findall('甲己|乙庚|丙辛|丁壬|戊癸',plain)))
        assert pairs,m['id']
        mountain_rules[m['id']]=dict(kind='正阴府' if '正阴府' in source else '傍阴府',pairs=pairs,source=source,pages=m['pages'])
    (ROOT/'data-mountain.js').write_text('/* 生成文件：来自content/二十四山原表.json，勿手改 */\nwindow.ZERI_MOUNTAINS='+json.dumps(mountain_rules,ensure_ascii=False,separators=(',',':'))+';\n')
    for item in cases:
        assert any(c['id']==item['chapter'] for c in catalog), item['id']
    projects=build_projects(catalog,cases)
    data=dict(chapters=catalog,projects=projects,cases=cases,mountains=mountains,route=render(route),characters=chars,questionCount=count)
    data['built']=hashlib.sha256(json.dumps(data,ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:12]
    (ROOT/'data-course.js').write_text('/* 生成文件；编辑 content/项目、content/教材 与 content/题目 后运行 build_course.py */\nwindow.ZERI_COURSE='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
    (ROOT/'course-textbook.md').write_text(route+'\n\n'+'\n\n---\n\n'.join((ROOT/'content/项目'/p['file']).read_text() for p in projects)+'\n\n---\n\n'+'\n\n---\n\n'.join((ROOT/'content/教材'/c['stage']/(f"{c['n']:02}-{c['title']}.md")).read_text() for c in catalog))
    print(f'课程构建：{len(projects)}个项目，{len(catalog)}个知识章，{count}题；版本 {data["built"]}')

if __name__=='__main__':
    build()
    from build_ui import build_ui
    build_ui()
