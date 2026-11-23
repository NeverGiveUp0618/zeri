"""Check literal citations from a PDF text layer or explicitly reviewed image excerpts."""
from pathlib import Path
import hashlib,json,re
ROOT=Path(__file__).resolve().parents[1]
NORM=lambda s:re.sub(r'\s+','',s)

def check_quote(q,pages=None,assets=None):
    key=q.get('evidenceRef')
    if not key:
        if pages is not None:assert NORM(q['quote']) in NORM(pages[q['page']-1]),('原文不匹配',q['id'])
        return 'text'
    entries=json.loads((ROOT/'question-bank/image-evidence.json').read_text())
    assert key in entries,('未登记图证',key)
    e=entries[key];assert e['page']==q['page'] and e['method']=='原图逐字核读',key
    expected=f"question-bank/pages/p{q['page']:04d}.webp"
    assert e['image']==expected and NORM(q['quote']) in NORM(e['text']),key
    image=ROOT/expected
    assert image.exists() and hashlib.sha256(image.read_bytes()).hexdigest()==e['sha256'],('图证哈希',key)
    if assets is not None:assert assets[str(q['page'])]['sha256']==e['sha256'],('图证与原页清单不同',key)
    return 'image'
