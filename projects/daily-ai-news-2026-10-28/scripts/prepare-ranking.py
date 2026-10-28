"""Use today's observed order and the matching fresh upstream score precision."""
from datetime import datetime, timezone
from hashlib import sha256
import gzip
import json
from pathlib import Path

root=Path(__file__).resolve().parents[1]
load=lambda name:json.loads((root/name).read_text(encoding='utf-8'))
edition=load('edition.json')
retrieval=next(record for record in load('evidence/retrieval.json') if record['id']=='ranking-models')
stored=(root/retrieval['file']).read_bytes()
raw=gzip.decompress(stored) if retrieval['file'].endswith('.gz') else stored
if sha256(raw).hexdigest()!=retrieval['sha256']:
    raise ValueError('Original upstream snapshot changed')
snapshot=json.loads(raw)
if snapshot['generatedAt'][:10]!=edition['date']:
    raise ValueError('Source generation date does not match this edition; inspect before use')
live=load('evidence/ranking-live.json')
models={model['slug']:model for model in snapshot['models']}
vendors={vendor['id']:vendor for vendor in snapshot['vendors']}
icons={'anthropic':'claude.png','openai':'openai.svg','google':'google.png','meta':'meta.svg','moonshotai':'kimi.png','alibaba':'qwen.png','zhipuai':'glm.svg','deepseek':'deepseek.ico'}
ranking={'editionDate':edition['date'],'metric':'ECI','queriedAt':live['observations'][-1]['queriedAt'],
         'sourceGeneratedAt':snapshot['generatedAt'],'sourceSha256':sha256(raw).hexdigest(),
         'entryUrl':live['entryUrl'],'observedLeaderboardUrl':live['leaderboardUrl'],
         'precisionSourceUrl':retrieval['url'],'sourceFile':retrieval['file'],
         'method':'Keep the exact model-id order observed in each live UI filter; use this freshly retrieved upstream snapshot only for two-decimal precision. Distinct model versions and source ties are retained. No old scores or invented changes.',
         'caption':'综合能力评分（ECI），分数越高，模型综合表现越好。',
         'attribution':'AI Model World (liyupi), Epoch Capabilities Index, Epoch AI CC-BY 4.0; source/precision documented in edition evidence.'}
proof=[]
for observation in live['observations']:
    if observation['queriedAt'][:10]!=edition['date']:
        raise ValueError('Live query date differs from this edition')
    entries=observation['rows'][:15]
    if len(entries)!=15:
        raise ValueError('Live UI did not yield a complete TOP15')
    output=[]
    for index,row in enumerate(entries):
        slug=row['links'][0]['href'].split('/')[-2]
        model=models[slug]
        eci=model['benchmarks'].get('eci')
        if not isinstance(eci,(int,float)) or model.get('retiredAt'):
            raise ValueError('UI/upstream eligibility mismatch: '+slug)
        displayed=float(row['links'][-1]['text'])
        if abs(eci-displayed)>.051:
            raise ValueError('Live score and upstream differ: '+slug)
        icon='assets/'+icons[model['vendorId']]
        if not (root/icon).is_file():
            raise ValueError('Missing actual official icon: '+icon)
        output.append({'rank':index+1,'id':model['id'],'name':model['name'],'eci':eci,
                       'vendor':model['vendorId'],'country':vendors[model['vendorId']]['country'],'icon':icon})
    if any(output[i]['eci']>output[i-1]['eci'] for i in range(1,15)):
        raise ValueError('Unexpected source ordering')
    ranking[observation['kind']]=output
    proof.append({'kind':observation['kind'],'actualFilter':observation['filter'],
                  'queriedAt':observation['queriedAt'],'modelIds':[item['id'] for item in output],
                  'checkedRows':len(output),'sourcePrecisionMatches':True})
(root/'ranking.json').write_text(json.dumps(ranking,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(root/'evidence/ranking-validation.json').write_text(json.dumps({'checkedAt':datetime.now(timezone.utc).isoformat(),'snapshotSha256':ranking['sourceSha256'],'checks':proof},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'global':len(ranking['global']),'domestic':len(ranking['domestic']),'sourceGeneratedAt':ranking['sourceGeneratedAt'],'queriedAt':ranking['queriedAt'],'liveUiAndSnapshotMatch':True},ensure_ascii=False))
