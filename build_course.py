"""课程Markdown/题目JSON -> 网页数据。标准库；不依赖原PDF即可重建。"""
import hashlib, html, json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parent

def inline(t):
    t=html.escape(t)
    t=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',t)
    t=re.sub(r'\[([^\]]+)\]\((#zr-\d{2}(?:~[\w-]+)?)\)',r'<a href="\2">\1</a>',t)
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
            out.append('<div class="table-wrap"><table>')
            for j,row in enumerate(rows):
                tag='th' if j==0 else 'td'
                out.append('<tr>'+''.join(f'<{tag}>{inline(c)}</{tag}>' for c in row)+'</tr>')
            out.append('</table></div>');continue
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
    data=dict(chapters=catalog,cases=cases,mountains=mountains,route=render(route),characters=chars,questionCount=count)
    data['built']=hashlib.sha256(json.dumps(data,ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:12]
    (ROOT/'data-course.js').write_text('/* 生成文件；编辑 content/教材 与 content/题目 后运行 build_course.py */\nwindow.ZERI_COURSE='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
    (ROOT/'course-textbook.md').write_text(route+'\n\n'+'\n\n---\n\n'.join((ROOT/'content/教材'/c['stage']/(f"{c['n']:02}-{c['title']}.md")).read_text() for c in catalog))
    print(f'课程构建：{len(catalog)}章，{count}题，{chars}字符；版本 {data["built"]}')

if __name__=='__main__':build()
