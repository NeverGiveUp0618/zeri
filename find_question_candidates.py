"""Find reviewable question material from local course pages; never publish questions.

Outputs stay under ignored _src/. Matching is a review hint, not a coverage verdict.
"""
from pathlib import Path
import argparse,bisect,collections,hashlib,json,re
ROOT=Path(__file__).resolve().parent
SPACE=re.compile(r'\s+')
ANSWER=re.compile(r'(?:回答|答)[：:]')
ANCHOR=re.compile(r'(?m)^[ \t]*(?P<number>\d{1,3})[、．.][ \t]*|(?:追问|提问|问)[：:]')
QUESTION=re.compile(r'[？?]|吗|如何|怎么|怎样|什么|是否|能否|为何|可否|请问|区别')
EMPHASIS=re.compile(r'重点|特别|注意|必须|切忌|不宜|不能|如果|但是|除非|只有|只要|先.{0,25}再')
FOREIGN=re.compile(r'奇门|六爻|八门|六仪|拆补法|置闰法')
META=re.compile(r'哪位|谁讲|哪个老师|学习态度|直播|收费|购买|联系电话|背下来|听懂没有')
norm=lambda s:SPACE.sub('',s)

def grams(s):
    s=norm(s);return {s[i:i+2] for i in range(len(s)-1)}

def pages_text(pages,start,end):
    text='';offsets=[]
    for p in range(start,end+1):offsets.append(len(text));text+=pages[p-1]+'\n'
    return text,offsets

def page_at(offset,offsets,start):return start+bisect.bisect_right(offsets,max(offset,0))-1

def extract_qa(text,offsets,start,chapter):
    answers=list(ANSWER.finditer(text));anchors=list(ANCHOR.finditer(text));units=[]
    previous_end=0;orphan_counts=collections.Counter();number_counts=collections.Counter()
    for index,a in enumerate(answers):
        # The last prompt before this answer is preferable to numbered sublists in an older answer.
        eligible=[m for m in anchors if previous_end<=m.start()<a.start()]
        chosen=eligible[-1] if eligible else None
        if chosen and not chosen.group('number') and len(eligible)>1:
            outer=eligible[-2]
            if outer.group('number') and len(text[outer.end():chosen.start()].strip())<160:
                chosen=outer
        qstart=chosen.start() if chosen else a.start()
        q=text[chosen.end():a.start()].strip() if chosen else ''
        number=chosen.group('number') if chosen else None
        # Strip the question marker only; preserve all original wording and source spans.
        q=re.sub(r'^问[：:]\s*','',q)
        qp=page_at(qstart,offsets,start);ap=page_at(a.end(),offsets,start)
        if number:
            number_counts[(qp,number)]+=1
            suffix='' if number_counts[(qp,number)]==1 else f'-repeat{number_counts[(qp,number)]}'
            label=f'{qp}-{number}{suffix}'
        else:
            orphan_counts[qp]+=1;label=f'{qp}-问{orphan_counts[qp]}'
        flags=[]
        if not q:flags.append('原问句缺失或该答复是续答')
        elif len(q)>900:flags.append('问题跨度过长，需核提取边界')
        elif not QUESTION.search(q):flags.append('原问为短标题或陈述，需人工确认意图')
        units.append({'id':f'candidate-{chapter}-{label}-{hashlib.sha256(text[qstart:a.end()].encode()).hexdigest()[:8]}',
                      'chapter':chapter,'kind':'qa','key':label,'number':number,'questionPage':qp,'sourceOffset':qstart,
                      'answerPage':ap,'question':q,'_qstart':qstart,'_astart':a.end(),
                      '_answerMarker':a.start(),'flags':flags})
        previous_end=a.end()
    for i,u in enumerate(units):
        nxt=units[i+1] if i+1<len(units) else None
        end=nxt['_qstart'] if nxt else len(text)
        if end<u['_astart']:end=nxt['_answerMarker'] if nxt else len(text)
        answer=text[u['_astart']:end].strip()
        # Terminal course marker is not an answer; do not truncate an actual long answer.
        answer=re.split(r'\n\s*[（(]完[）)]\s*(?:\n|$)',answer,maxsplit=1)[0].strip()
        u['_end']=end;u['answer']=answer;u['answerEndPage']=page_at(max(u['_astart'],end-1),offsets,start)
        if len(answer)>1800:u['flags'].append('答复跨度过长，可能夹有未标答的问题或正文')
        if ANCHOR.search(answer):u['flags'].append('答复内有编号或追问，需核是否应拆分')
        if not answer:u['flags'].append('原答为空')
        if FOREIGN.search(u['question']+'\n'+answer):u['flags'].append('含其他术数，不自动转题')
        if META.search(u['question']):u['flags'].append('可能为课程事务或非规则内容')
        u['confidence']='high' if u['question'] and QUESTION.search(u['question']) and not u['flags'] else 'review'
    # Numbered statements without an explicit answer must not disappear into the preceding answer.
    selected={u['_qstart'] for u in units};notes=[]
    for i,m in enumerate(anchors):
        if not m.group('number') or m.start() in selected or not units or m.start()<units[0]['_qstart']:continue
        before=[u for u in units if u['_qstart']<m.start()];after=[u for u in units if u['_qstart']>m.start()]
        if not before or not after:continue
        prev,nxt=before[-1],after[0]
        if not prev['number'] or not nxt['number']:continue
        n,pn,nn=map(int,(m.group('number'),prev['number'],nxt['number']))
        if not (pn<n<nn or (n<pn and nn==n+1)):continue
        end=anchors[i+1].start() if i+1<len(anchors) else len(text)
        excerpt=text[m.end():end].strip()
        if not excerpt or ANSWER.search(excerpt) or len(excerpt)>600:continue
        page=page_at(m.start(),offsets,start);key=f'{page}-{n}-note'
        notes.append({'id':f'candidate-{chapter}-{key}-{hashlib.sha256(excerpt.encode()).hexdigest()[:8]}',
                      'chapter':chapter,'kind':'numbered_note','key':key,'number':str(n),'sourceOffset':m.start(),
                      'questionPage':page,'answerPage':page,'answerEndPage':page_at(max(m.end(),end-1),offsets,start),
                      'question':'','sourceText':excerpt,'flags':['编号条目无显式答复，需按正文规则复核'],'confidence':'review'})
        if prev['_astart']<m.start()<prev['_end']:
            prev['answer']=text[prev['_astart']:m.start()].strip();prev['_end']=m.start()
            prev['answerEndPage']=page_at(max(prev['_astart'],m.start()-1),offsets,start)
    return units+notes

def match(unit,bank):
    body=norm(unit.get('answer',unit.get('sourceText','')));content=grams(unit.get('question','')+' '+body)
    found=[]
    for q,state in bank:
        if q['chapter']!=unit['chapter']:continue
        quote=norm(q.get('quote',''));exact=len(quote)>=4 and quote in body
        qg=grams(q['q']+' '+q.get('e',''));similarity=len(content&qg)/max(1,len(qg))
        score=(1.0 if exact else 0)+similarity
        if exact or similarity>=.28:
            found.append({'id':q['id'],'state':state,'q':q['q'],'score':round(score,3),
                          'method':'原文短据命中，仅提示部分覆盖' if exact else '二字词重合，待核相似性'})
    return sorted(found,key=lambda x:(-x['score'],x['id']))[:5]

def run(root=ROOT,out=None,books=None):
    pages=json.loads((root/'_src/pages.json').read_text());catalog=json.loads((root/'question-bank/sources.json').read_text())
    published=json.loads((root/'question-bank/questions.json').read_text());bank=[(q,'published') for q in published]
    # Load this round's saved packets, never historical authoring snapshots or review ledgers.
    drafts_by_id={};published_ids={q['id'] for q in published}
    paths=sorted((root/'_src/bank_expansion').glob('round3-*.json'))+sorted((root/'_src/bank_expansion').glob('script-*-gaps.json'))
    for p in paths:
        payload=json.loads(p.read_text())
        if not isinstance(payload,list):continue
        for q in payload:
            if not isinstance(q,dict) or not {'id','chapter','q','a','w','quote'}<=q.keys():continue
            if q['id'] not in published_ids:drafts_by_id[q['id']]=q
    drafts=list(drafts_by_id.values())
    # A saved packet is not published; an already-published ID is not counted again as a draft.
    bank.extend((q,'draft') for q in drafts)
    rows=[];chapters=[]
    for b in catalog['books']:
        if books and b['id'] not in books:continue
        for c in b['chapters']:
            text,offsets=pages_text(pages,c['start'],c['end'])
            extracted=extract_qa(text,offsets,c['start'],c['id'])
            qa=[u for u in extracted if u['kind']=='qa'];notes=[u for u in extracted if u['kind']=='numbered_note']
            regions=[(u['_qstart'], (qa[i+1]['_qstart'] if i+1<len(qa) else len(text))) for i,u in enumerate(qa)]
            for u in qa+notes:
                u['book']=b['id'];u['matches']=match(u,bank)
                u['priority']='unmatched' if not any(x['state']=='published' for x in u['matches']) else 'check_remaining_conditions'
                for k in list(u):
                    if k.startswith('_'):del u[k]
            rules=[]
            for m in re.finditer(r'[^。！？]+[。！？]',text):
                sentence=m.group().strip()
                if not 8<=len(norm(sentence))<=300 or not EMPHASIS.search(sentence) or any(max(a,m.start())<min(z,m.end()) for a,z in regions):continue
                p=page_at(m.start(),offsets,c['start']);flags=[]
                if FOREIGN.search(sentence):flags.append('含其他术数，不自动转题')
                if META.search(sentence):flags.append('可能为非规则内容')
                u={'id':f"candidate-{c['id']}-rule-{hashlib.sha256((str(p)+sentence).encode()).hexdigest()[:10]}",
                   'book':b['id'],'chapter':c['id'],'kind':'rule','questionPage':p,'sourceOffset':m.start(),'answerPage':p,'answerEndPage':p,
                   'key':f'{p}-正文','question':'','sourceText':sentence,'flags':flags,'confidence':'review'}
                u['matches']=match(u,bank);u['priority']='unmatched' if not any(x['state']=='published' for x in u['matches']) else 'check_remaining_conditions';rules.append(u)
            sparse=[p for p in range(c['start'],c['end']+1) if len(norm(pages[p-1]))<35]
            chapters.append({'book':b['id'],'id':c['id'],'title':c['title'],'start':c['start'],'end':c['end'],
                             'qaCandidates':len(qa),'numberedNotes':len(notes),'ruleCandidates':len(rules),'sparseTextPages':sparse,
                             'publishedQuestions':sum(q['chapter']==c['id'] for q in published),
                             'draftQuestions':sum(q['chapter']==c['id'] for q in drafts)})
            rows+=sorted(qa+notes+rules,key=lambda u:(u['sourceOffset'],u['id']))
    result={'format':1,'note':'自动提取的待审素材，不是合格题目，也不代表完整覆盖。匹配可能只覆盖原答的一个条件；扫描页须另行核图。',
            'source':'_src/pages.json','publishedQuestions':len(published),'draftQuestions':len(drafts),
            'chapters':chapters,'candidates':rows}
    target=out or root/'_src/question-candidates.json';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    report=['# 自动找题候选摘要','',result['note'],'',f"现有题{len(published)}；落盘草稿{len(drafts)}。候选问答{sum(c['qaCandidates'] for c in chapters)}，编号补充条目{sum(c['numberedNotes'] for c in chapters)}，正文条件句{sum(c['ruleCandidates'] for c in chapters)}。",'',
            '|教材|课时|问答候选|编号补充|条件句候选|现有题|草稿|少文字页待看图|','|---|---|---:|---:|---:|---:|---:|---|']
    for c in chapters:report.append(f"|{c['book']}|{c['title']}|{c['qaCandidates']}|{c['numberedNotes']}|{c['ruleCandidates']}|{c['publishedQuestions']}|{c['draftQuestions']}|{','.join(map(str,c['sparseTextPages'])) or '—'}|")
    target.with_suffix('.md').write_text('\n'.join(report)+'\n')
    print(json.dumps({'chapters':len(chapters),'qaCandidates':sum(c['qaCandidates'] for c in chapters),'numberedNotes':sum(c['numberedNotes'] for c in chapters),'ruleCandidates':sum(c['ruleCandidates'] for c in chapters),'published':len(published),'drafts':len(drafts),'output':str(target)},ensure_ascii=False))
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--books',nargs='+');p.add_argument('--output',type=Path)
    a=p.parse_args();run(out=a.output,books=a.books)
