"""Render only the PDF pages cited by questions, for on-demand source review."""
from pathlib import Path
import argparse,json,hashlib
import fitz

ROOT=Path(__file__).resolve().parent
def build(pdf):
    qs=json.loads((ROOT/'question-bank/questions.json').read_text())
    dest=ROOT/'question-bank/pages';dest.mkdir(exist_ok=True)
    doc=fitz.open(pdf);assert len(doc)==1832
    old=json.loads((ROOT/'question-bank/page-assets.json').read_text()) if (ROOT/'question-bank/page-assets.json').exists() else {}
    manifest={};rendered=0
    for p in sorted({q['page'] for q in qs}):
        previous=old.get(str(p));out=dest/f'p{p:04d}.webp'
        if previous and out.exists() and previous['width']==1500 and hashlib.sha256(out.read_bytes()).hexdigest()==previous['sha256']:
            manifest[str(p)]=previous;continue
        rendered+=1
        page=doc[p-1];scale=1500/page.rect.width
        pix=page.get_pixmap(matrix=fitz.Matrix(scale,scale),alpha=False)
        out=dest/f'p{p:04d}.webp'
        pix.pil_save(str(out),format='WEBP',quality=82,method=6)
        manifest[str(p)]={'file':f'question-bank/pages/{out.name}','width':pix.width,'height':pix.height,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
    (ROOT/'question-bank/page-assets.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print('Rendered new/repaired',rendered,'; total',len(manifest),'cited pages,',round(sum((ROOT/v['file']).stat().st_size for v in manifest.values())/1024/1024,2),'MB')
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('pdf');build(p.parse_args().pdf)
