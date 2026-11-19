"""Scope course styles to the unified app's course view; keep the source reusable."""
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def scoped(css):
    result=[]
    while css.strip():
        css=css.lstrip()
        if css.startswith('/*'):
            end=css.index('*/')+2;css=css[end:];continue
        start=css.index('{');selector=css[:start].strip();depth=1;end=start+1
        while depth:
            if css[end]=='{':depth+=1
            elif css[end]=='}':depth-=1
            end+=1
        body=css[start+1:end-1]
        if selector.startswith('@media'):
            result.append(selector+'{'+scoped(body)+'}')
        else:
            selectors=[]
            for item in selector.split(','):
                item=item.strip()
                if item in (':root','html','body','main'):selectors.append('#course-view')
                elif item=='*':selectors.extend(['#course-view','#course-view *'])
                else:selectors.append('#course-view '+item)
            result.append(','.join(selectors)+'{'+body+'}')
        css=css[end:]
    return '\n'.join(result)

def build_ui():
    (ROOT/'course-embedded.css').write_text('/* Generated from course.css by build_ui.py; edit the source stylesheet. */\n'+scoped((ROOT/'course.css').read_text())+'\n')

if __name__=='__main__':build_ui()
