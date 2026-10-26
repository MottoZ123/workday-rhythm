#!/usr/bin/env python3
"""Pre-publication check for private file names, credential-like literals, and known placeholders."""
from pathlib import Path
import re,sys,json,zipfile,struct
root=Path(__file__).resolve().parents[1]
forbidden_names={'.env','project.private.config.json','credentials.json','secrets.json',
                 'storage-export.json','personal-data.json','user-backup.json'}
forbidden_suffix={'.pem','.p12','.pfx','.key'}
text_suffix={'.js','.json','.md','.py','.wxml','.wxss','.yml','.yaml','.txt','.html'}
patterns={
 'real_wechat_appid': re.compile(r'\bwx[0-9a-fA-F]{16}\b'),
 'likely_real_email': re.compile(r'\b[A-Za-z0-9._%+-]+@(?!example\.com|example\.org)[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'),
 'auth_key': re.compile(r'\b(?:AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{24,})\b'),
 'mainland_phone': re.compile(r'(?<![0-9])1[3-9][0-9]{9}(?![0-9])'),
 'cloudbase_env': re.compile(r'\bcloud1-[a-z0-9-]{8,}\b',re.I),
 'student_number': re.compile(r'(?<![a-z0-9])u[0-9]{7,9}(?![0-9])',re.I),
}
errors=[]
for path in root.rglob('*'):
 if not path.is_file(): continue
 rel=path.relative_to(root).as_posix()
 if any(seg in {'.git', '__pycache__', 'node_modules', 'release'} for seg in path.parts): continue
 if path.name.lower().startswith('.env') or path.name.lower().endswith('.private.json'):
  errors.append(f'private configuration: {rel}')
 if re.search(r'(personal-data|private-backup|storage-export|user-backup|salary-export)', path.name, re.I):
  errors.append(f'personal export filename: {rel}')
 if path.name.lower() in forbidden_names or path.suffix.lower() in forbidden_suffix:
  errors.append(f'forbidden filename: {rel}')
 if path.suffix.lower() == '.pdf' and rel.startswith('source/'):
  errors.append(f'official/source PDF not redistributable by default: {rel}')
 if path.name == 'Weekly Schedule Update 20260830.xlsx':
  errors.append(f'private-source original included: {rel}')
 if 'ui_reference/' in rel or 'ui-reference/' in rel:
  errors.append(f'private screenshot directory: {rel}')
 if path.suffix.lower() in text_suffix and path.name not in {'prepublish_check.py','DELIVERY_MANIFEST.json'}:
  try: content=path.read_text(encoding='utf-8')
  except UnicodeDecodeError: continue
  for name,pat in patterns.items():
   if pat.search(content): errors.append(f'{name} in {rel}')
# Simple runtime guard
mini=root/'miniprogram'
for f in mini.rglob('*.js'):
 t=f.read_text(encoding='utf-8')
 if 'wx.cloud.' in t or 'cloudfunctions/' in t:errors.append(f'cloud call found in {f.relative_to(root)}')
if (root/'cloudfunctions').exists(): errors.append('cloudfunctions dir found')
# Scan container metadata as well as ordinary text. Never print matching values.
extra_patterns = {
 'github_credential': re.compile(r'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})'),
 'private_key_block': re.compile(r'-----BEGIN [A-Z ]*PRIVATE KEY-----'),
 'credential_assignment': re.compile(r"""(?i)(?:appsecret|access_token|openid|unionid)\s*[:=]\s*['"][A-Za-z0-9_-]{20,}['"]"""),
}
for path in root.rglob('*'):
 if not path.is_file() or any(p in {'.git','release','node_modules','__pycache__'} for p in path.parts): continue
 rel=path.relative_to(root).as_posix()
 if path.name == 'prepublish_check.py': continue
 contents=[]
 if path.suffix.lower() in text_suffix:
  contents.append(path.read_text(encoding='utf-8-sig'))
 elif path.suffix.lower()=='.xlsx':
  with zipfile.ZipFile(path) as z:
   for entry in z.namelist():
    if entry.endswith(('.xml','.rels')):
     text=z.read(entry).decode('utf-8')
     contents.append(text)
     if 'externalLinks/' in entry: errors.append(f'external workbook link: {rel}')
     if 'docProps/core.xml' == entry and re.search(r'<(?:dc:creator|cp:lastModifiedBy)[^>]*>[^<]+</',text):
      errors.append(f'workbook author metadata requires review: {rel}')
 elif path.suffix.lower()=='.png':
  data=path.read_bytes()
  if data[:8]!=b'\x89PNG\r\n\x1a\n': errors.append(f'invalid PNG: {rel}'); continue
  pos=8
  while pos+12<=len(data):
   size=struct.unpack('>I',data[pos:pos+4])[0]
   kind=data[pos+4:pos+8]
   if kind in {b'tEXt',b'zTXt',b'iTXt',b'eXIf'}: errors.append(f'image metadata requires review: {rel}')
   pos+=size+12
 for content in contents:
  for label,pat in {**patterns,**extra_patterns}.items():
   if pat.search(content): errors.append(f'{label} in {rel}')
if json.loads((root/'project.config.json').read_text(encoding='utf-8'))['appid']!='touristappid':
 errors.append('public AppID must be touristappid')
if errors:
 for e in errors:print('FAIL:',e)
 sys.exit(1)
print('PASS: no known personal/secret artifacts, no cloud integration')
