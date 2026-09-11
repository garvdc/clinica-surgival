"""Export a consistent local snapshot for the first private demo deployment."""
from pathlib import Path
import json, sqlite3
root=Path(__file__).resolve().parents[1]
tables=['users','patients','payers','patient_payers','professionals','appointments','audit','encounters','encounter_versions','quotes','sales','payments']
files=list((root/'.wrangler/state/v3/d1/miniflare-D1DatabaseObject').glob('*.sqlite'))
for file in files:
 conn=sqlite3.connect(file.as_uri()+'?mode=ro',uri=True)
 if conn.execute("SELECT count(*) FROM sqlite_master WHERE name='patients'").fetchone()[0]:break
 conn.close()
else:raise SystemExit('No local clinic database found')
conn.row_factory=sqlite3.Row
conn.execute('BEGIN')
data={t:[dict(row) for row in conn.execute('SELECT * FROM '+t)] for t in tables}
conn.rollback();conn.close()
path=root/'backups/demo-transfer.json'
path.parent.mkdir(exist_ok=True,mode=0o700)
path.write_text(json.dumps(data,ensure_ascii=False));path.chmod(0o600)
print(json.dumps({t:len(rows) for t,rows in data.items()}))
