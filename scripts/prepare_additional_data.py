"""Prepare fixed subsets from local source downloads.
Usage: python3 scripts/prepare_additional_data.py /path/to/extracted/events /path/to/top.csv.gz /path/to/JC-202401-citibike-tripdata.csv.zip
See public/data/ADDITIONAL-DATA.md for authoritative download links and terms.
"""
from pathlib import Path
import csv,gzip,json,re,datetime,collections,sys
out=Path(__file__).resolve().parents[1]/'public/data';out.mkdir(exist_ok=True)
def iso(y):return f'{int(y):04d}-01-01T00:00:00'
# One annotation stream per story avoids tripling the same updates.
records=[];groups=[]
labels={'ukraine_conflict':'Ukraine conflict','nsa_leak':'NSA leak','swine_flu':'Swine flu','libyan_war':'Libyan war','bp_oil_spill':'BP oil spill','mh370_disappearance':'MH370 disappearance','haitian_earthquake':'Haitian earthquake','syrian_crisis':'Syrian crisis','gaza_conflict':'Gaza conflict','mj_death':'Michael Jackson','egyptian_crisis':'Egyptian crisis','yemen_crisis':'Yemen crisis','iraq_war':'Iraq war','financial_crisis':'Financial crisis'}
for folder in sorted(Path(sys.argv[1]).iterdir()):
 files=sorted(folder.glob('*.tsv'))
 if not files:continue
 group=folder.name;groups.append({'id':group,'name':labels.get(group,group.replace('_',' ').title())})
 seen=set()
 for i,row in enumerate(csv.DictReader(files[0].open(),delimiter='\t')):
  date=row.get('Date','').strip('[] ');body=row.get('Update','').strip()
  if not re.fullmatch(r'\d{4}-\d\d-\d\d',date) or not body or (date,body) in seen:continue
  seen.add((date,body));records.append(dict(id=f'{group}-{i}',group=group,label=labels.get(group,group),start=date+'T00:00:00',text=body,background=row.get('Background','').strip()))
dates=sorted(r['start'][:10] for r in records)
news=dict(id='news',title='News timelines',kind='events',precision='day',source='https://huggingface.co/datasets/adithya7/background-summaries',attribution='Pratapa, Small & Dreyer (2023) · CC BY-NC 4.0',note='Curated news updates, one annotator per story. Counts describe entries in this collection, not all real-world events. Dates have day precision.',min=dates[0],max=dates[-1],defaultFrom='2010-01-01',defaultTo=dates[-1],defaultGroups=[g['id'] for g in groups if g['id'] in ['bp_oil_spill','libyan_war','syrian_crisis','ukraine_conflict']],groups=groups,records=records)
(out/'news.json').write_text(json.dumps(news,separators=(',',':')))
rs=list(csv.DictReader(gzip.open(sys.argv[2],'rt')));eligible=collections.defaultdict(list)
for r in rs:
 try:birth=int(r['birth']);death=int(r['death']);rank=float(r['ranking'])
 except ValueError:continue
 if 1750<=birth<=1930 and birth<death<=2022 and death-birth<=120 and r['occupation'] not in ['Missing','Other']:eligible[r['occupation']].append((rank,r,birth,death))
records=[];groups=[]
for group,items in sorted(eligible.items()):
 groups.append(dict(id=group,name=group))
 for rank,r,birth,death in sorted(items,key=lambda x:x[0])[:30]:
  records.append(dict(id=r['wikidata_code'],group=group,label=r['name'].replace('_',' '),start=iso(birth),end=iso(death),text=r['citizenship']+' · '+group,source='https://www.wikidata.org/wiki/'+r['wikidata_code']))
people=dict(id='people',title='Notable lifespans',kind='intervals',precision='year',source='https://medialab.github.io/bhht-datascape/#series',attribution='Laouenan et al. · BHHT datascape · CC BY-SA',note='Selected top-ranked deceased people born 1750–1930, 30 per field from the datascape top file. Reported birth/death years imply approximate lifespans, not exact dates. This is not a population sample or life-expectancy estimate.',min=min(r['start'][:10] for r in records),max=max(r['end'][:10] for r in records),defaultFrom='1800-01-01',defaultTo='2000-12-31',defaultGroups=['Culture','Discovery/Science'],groups=groups,records=records)
(out/'people.json').write_text(json.dumps(people,separators=(',',':')))
print('news',len(news['records']),len(groups),dates[0],dates[-1]);print('people',len(records),len(groups),people['min'],people['max'])

import csv,zipfile,io,collections,json,datetime
from pathlib import Path
z=zipfile.ZipFile(sys.argv[3]);n=next(n for n in z.namelist() if n.endswith('.csv') and not n.startswith('__MACOSX'));rows=list(csv.DictReader(io.TextIOWrapper(z.open(n))))
counts=collections.Counter(r['start_station_id'] for r in rows if r['start_station_id']);chosen={k for k,_ in counts.most_common(8)};groups={};records=[];invalid=0
for r in rows:
 if r['start_station_id'] not in chosen:continue
 start=r['started_at'].replace(' ','T');end=r['ended_at'].replace(' ','T')
 try:
  if datetime.datetime.fromisoformat(end)<=datetime.datetime.fromisoformat(start):invalid+=1;continue
 except ValueError:invalid+=1;continue
 group=r['start_station_id'];groups[group]=dict(id=group,name=r['start_station_name'])
 records.append(dict(id=r['ride_id'],group=group,label=r['start_station_name']+' → '+r['end_station_name'],start=start,end=end,text=r['rideable_type'].replace('_',' ')+' · '+r['member_casual']))
groups=sorted(groups.values(),key=lambda g:-counts[g['id']])
d=dict(id='bikes',title='Bike trips',kind='intervals',precision='second',source='https://citibikenyc.com/system-data',attribution='Citi Bike System Data · NYCBS Data Use Policy',note=f'January 2024 Jersey City/Hoboken trip file, eight busiest origin stations. {invalid} non-positive or invalid durations excluded; long positive durations retained. Local clock: America/New_York. Starts/ends describe recorded trips, not routes or dock availability.',min='2024-01-01',max='2024-01-31',defaultFrom='2024-01-08',defaultTo='2024-01-08',defaultGroups=[g['id'] for g in groups[:4]],groups=groups,records=records)
(out/'bikes.json').write_text(json.dumps(d,separators=(',',':')))
print(len(rows),len(records),invalid,[(g['name'],counts[g['id']]) for g in groups]);print('bytes',(out/'bikes.json').stat().st_size)
