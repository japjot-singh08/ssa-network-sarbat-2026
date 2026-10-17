"""Create a source-only hackathon archive; exclude secrets and persistent demo data."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import os
root=Path(__file__).resolve().parents[1]
files=[]
for directory in ('app','lib','tests','scripts','supabase','public'):
    files.extend(p for p in (root/directory).rglob('*') if p.is_file() and not p.is_symlink() and '__pycache__' not in p.parts)
for name in ('README.md','AUTHENTICATION.md','DEPLOYMENT.md','DEMO.md','LICENSE','package.json','package-lock.json','tsconfig.json','next-env.d.ts','postcss.config.mjs','eslint.config.mjs','playwright.config.ts','.gitignore','.env.example'):
    p=root/name
    if p.is_file(): files.append(p)
secrets=[]
env=root/'.env.local'
if env.exists():
    for line in env.read_text().splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key,value=line.split('=',1)
            if any(s in key for s in ('SECRET','PASSCODE','API_KEY','DATABASE_URL')) and len(value.strip())>=12:
                secrets.append(value.strip().strip('"').strip("'").encode())
for key in ('ANTHROPIC_API_KEY','DATABASE_URL','SESSION_SECRET','DEMO_REVIEWER_PASSCODE'):
    if len(os.environ.get(key,''))>=12: secrets.append(os.environ[key].encode())
for p in files:
    if any(secret in p.read_bytes() for secret in secrets):
        raise RuntimeError('Secret detected in source; archive creation stopped.')
output=root/'outputs'/'SSA-Network-Source.zip'
output.parent.mkdir(exist_ok=True)
with ZipFile(output,'w',ZIP_DEFLATED) as z:
    for p in sorted(set(files)):z.write(p,Path('ssa-network')/p.relative_to(root))
with ZipFile(output) as z:
    assert z.testzip() is None
    assert all(not n.startswith('/') and '/.data/' not in n and '/.env.local' not in n and '/node_modules/' not in n for n in z.namelist())
    assert 'ssa-network/LICENSE' in z.namelist()
    print(f'Created {output.name}: {len(z.namelist())} source files. No local secrets, dependencies, or demo data included.')
