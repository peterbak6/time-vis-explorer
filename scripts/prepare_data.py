"""Usage: python3 scripts/prepare_data.py metadata.csv electricity_cleaned.csv
Source: https://github.com/buds-lab/building-data-genome-project-2
Keeps source gaps, no interpolation or zero filling. Selects 12 varied Fox-site buildings.
"""
import csv,json,sys,math,collections
from pathlib import Path
meta={r['building_id']:r for r in csv.DictReader(open(sys.argv[1])) if r['site_id']=='Fox' and r['electricity']=='Yes'}
values=collections.defaultdict(list);start=None;hours=0
with open(sys.argv[2]) as f:
 reader=csv.reader(f);header=next(reader);indices=[(i,k) for i,k in enumerate(header) if k in meta]
 for row in reader:
  if not start:start=row[0]
  hours+=1
  for i,k in indices:
   try:v=float(row[i]);v=round(v,3) if math.isfinite(v) and v>=0 else None
   except (ValueError,IndexError):v=None
   values[k].append(v)
byuse=collections.defaultdict(list)
for k,vs in values.items():
 good=[v for v in vs if v is not None]
 coverage=len(good)/hours
 if coverage>=.97 and good and sum(good)/len(good)>1 and max(good)>min(good):byuse[meta[k]['primaryspaceusage']].append((coverage,k))
chosen=[]
for group in byuse.values():group.sort(reverse=True)
for round_ in range(12):
 for use in sorted(byuse):
  if round_<len(byuse[use]) and len(chosen)<12:chosen.append(byuse[use][round_][1])
chosen.sort(key=lambda k:(meta[k]['primaryspaceusage'],k))
buildings=[]
for k in chosen:
 r=meta[k];buildings.append(dict(id=k,name=k.split('_')[-1],use=r['primaryspaceusage'],timezone=r['timezone'],coverage=round(sum(v is not None for v in values[k])/hours,5),values=values[k]))
 print(k,r['primaryspaceusage'],buildings[-1]['coverage'])
data=dict(start=start,hours=hours,site='Fox',timezone=buildings[0]['timezone'],buildings=buildings,source='https://github.com/buds-lab/building-data-genome-project-2')
out=Path(__file__).resolve().parents[1]/'public/data';out.mkdir(parents=True,exist_ok=True)
(out/'electricity.json').write_text(json.dumps(data,separators=(',',':')))
print(start,hours,'bytes',(out/'electricity.json').stat().st_size)
