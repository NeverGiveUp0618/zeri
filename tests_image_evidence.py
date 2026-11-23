"""An image citation must bind an excerpt to the exact reviewed source image."""
from pathlib import Path
import hashlib,importlib.util,json,tempfile,unittest
spec=importlib.util.spec_from_file_location('evidence',Path(__file__).parent/'question-bank/evidence.py')
ev=importlib.util.module_from_spec(spec);spec.loader.exec_module(ev)

class ImageEvidenceTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.old=ev.ROOT;ev.ROOT=Path(self.tmp.name)
  image=ev.ROOT/'question-bank/pages/p0001.webp';image.parent.mkdir(parents=True);image.write_bytes(b'reviewed-image-fixture')
  self.digest=hashlib.sha256(image.read_bytes()).hexdigest()
  self.entry={'page':1,'method':'原图逐字核读','image':'question-bank/pages/p0001.webp','sha256':self.digest,'text':'第一数用于冬至后，第二数用于夏至后。'}
  (ev.ROOT/'question-bank/image-evidence.json').write_text(json.dumps({'excerpt':self.entry},ensure_ascii=False))
  self.q={'id':'fixture','page':1,'quote':'第一数用于冬至后','evidenceRef':'excerpt'}
 def tearDown(self):ev.ROOT=self.old;self.tmp.cleanup()
 def test_image_without_text_layer(self):self.assertEqual(ev.check_quote(self.q,[''],{'1':{'sha256':self.digest}}),'image')
 def test_invented_quote_rejected(self):
  self.q['quote']='第三数全年皆用'
  with self.assertRaises(AssertionError):ev.check_quote(self.q,[''])
 def test_wrong_page_rejected(self):
  self.q['page']=2
  with self.assertRaises(AssertionError):ev.check_quote(self.q,['',''])
 def test_unknown_excerpt_rejected(self):
  self.q['evidenceRef']='missing'
  with self.assertRaises(AssertionError):ev.check_quote(self.q,[''])
 def test_changed_image_rejected(self):
  (ev.ROOT/self.entry['image']).write_bytes(b'changed-image')
  with self.assertRaises(AssertionError):ev.check_quote(self.q,[''])
 def test_manifest_mismatch_rejected(self):
  with self.assertRaises(AssertionError):ev.check_quote(self.q,[''],{'1':{'sha256':'other'}})
 def test_text_quote_still_literal(self):
  self.q.pop('evidenceRef')
  with self.assertRaises(AssertionError):ev.check_quote(self.q,['不含引用原文'])
if __name__=='__main__':unittest.main()
