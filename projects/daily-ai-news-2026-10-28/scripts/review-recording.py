"""Apply this edition's reviewed names and scene anchors to the edited word clock."""
from copy import deepcopy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def load(name):
    return json.loads((ROOT / name).read_text(encoding='utf-8-sig'))
def write(name, value):
    (ROOT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')

content = load('content.json')
raw = load('audio/asr/raw-words.json')
joined = ''.join(w['text'].strip() for s in raw['segments'] for w in s['words']).replace(',', '，')
pairs = [
    ('近日AI资讯', '今日AI资讯', '栏目名称及新闻语境同音校订；不改变声音。'),
    ('今天的投降', '今天的头条', '开场新闻语境和原稿对应词校订；不伪造替代声音。'),
    ('LiquidAI', 'Liquid AI', '官方品牌拼写与词间空格。'),
    ('四位量化', '4位量化', '量化位宽规范写法。'),
    ('额外类存', '额外内存', '上下文缓存语境，ASR同音校订。'),
    ('多部推理', '多步推理', '任务边界语境的同音词。'),
    ('稳定的完成', '稳定地完成', '书面字幕助词校订。'),
    ('OpenRMB', 'OpenBMB', '官方组织名规范拼写，原始词窗保留。'),
    ('miniCPMOCR', 'MiniCPM-OCR', '官方模型名规范拼写。'),
    ('代表格的公式的文档', '带表格和公式的文档', '文档类型语境，整理连续口语助词，不补原稿整句。'),
    ('markdown', 'Markdown', '文件格式规范拼写。'),
    ('JV', 'Jev', '官方质量评估模型名。'),
    ('打质量', '打质量分', '整理口语省略的评分宾语；维持原词窗，未补读声音。'),
    ('识别的不可靠', '识别得不可靠', '字幕助词规范。'),
    ('挑出来复合', '挑出来复核', '文档质量复核语境的同音词校订。'),
    ('文档再没有错误文字', '文档没有错误文字', '删口语赘字，保持不能保证无错的原意，不声称声音补读。'),
    ('国产小模型方便', '国产小模型方面', '衔接新闻的同音词校订。'),
    ('训飞', '讯飞', '官方主体名规范。'),
    ('SparkX的2.6，1.7B', 'Spark-X2.6-1.7B', '官方型号；保留真实朗读时间范围。'),
    ('自信部署', '自行部署', '部署资源语境的同音词。'),
]
corrections=[]
for old,new,reason in pairs:
    if old not in joined:
        raise ValueError('Current edited ASR does not contain correction: '+old)
    corrections.append(dict(old=old,new=new,reason=reason))
    joined=joined.replace(old,new)
definitions = {s['id']:s for s in content['scenes']}
spec = [
    ('overview','overview','各位观众们',''),
    ('lfm-family','lfm-family','Liquid AI在10月27日','modalities'),
    ('lfm-local','lfm-local','其中文本模型','memory'),
    ('lfm-decisions','lfm-decisions','同一系列还提供决策模型','pointing'),
    ('lfm-limits','lfm-limits','不过小模型','limits'),
    ('ocr-parse','ocr-parse','接下来看看文档识别','ocr-demo'),
    ('ocr-check','ocr-check','它还有一个约20亿','ocr-judge'),
    ('spark-update','spark-budget','国产小模型方面','spark-model'),
    ('spark-budget','spark-budget','并提供不思考','thinking'),
    ('spark-license','spark-budget','权重按此协议开放','license'),
    ('ling-weights','ling-weights','蚂蚁百灵也有一条权重开放的更新','ling'),
    ('ling-resources','ling-weights','它的体量比前面','ling-resources'),
    ('dotnet-reminder','dotnet-reminder','再补一条开发者安全提醒','security'),
]
scenes=[]
cursor=0
for ident,base,anchor,visual in spec:
    position=joined.find(anchor,cursor)
    if position<0:
        raise ValueError('Missing anchor: '+anchor)
    cursor=position+len(anchor)
    s=deepcopy(definitions[base])
    s.update(id=ident,anchor=anchor,visual=visual)
    if ident=='lfm-family': s.pop('media',None)
    s.pop('draftAnchor',None)
    scenes.append(s)
titles = {'spark-update':'讯飞更新 Spark-X2.6-1.7B','spark-budget':'Spark 提供三档思考预算','spark-license':'Spark 权重按 Apache 2.0 开放','ling-resources':'Ling 部署需评估服务器资源'}
for s in scenes:
    if s['id'] in titles: s['title']=titles[s['id']]
    if s['id']=='lfm-decisions': s['productionNote']='采用已核实的 Point 功能图解；未取得官方演示原片，不标作实录。'
    if s['id']=='ocr-parse': s['productionNote']='采用官方中文样例原速片段；真实区间按最终对齐镜头限制。'
content.update(scenes=scenes,productionNote='按剪辑后真人声音和最终ASR词窗制作。长型号、许可和安全适用条件在画面补充；字幕不补写整段未朗读原稿。人工连续审听仍待用户。')
write('content.json',content)
write('audio/alignment.json',{
    'review':{'status':'reviewed','reviewer':'Codex / edited-ASR, EDL and frozen-source review','notes':'核对剪辑后逐词转写、原稿、日期/数字、主体和专名；同音词及少量口语语法校订已逐项记录。原始转写、原录音及EDL保留。此为文本/时钟/事实核对，不代表完整主观审听，仍待用户听看。'},
    'corrections':corrections,'sourceIn':None,'sourceOut':None,
    'actualChangesExplained':'用户明确授权剪掉卡壳、重复和长停顿；采用独立剪辑版后重转写，保持原速与音高。实际朗读省略了Spark许可全名、Ling长型号、.NET/Brotli长名和详细影响条件，未念结束语；字幕不补这些整句，画面按冻结来源补充正确名称与限制。原稿的安全末段未完成后重读，只留最后完整句。约20亿参数搭档等保留实际说法；稿件相似度差异不通过改阈值掩盖。'
})
job=load('job.json')
for step in job['steps']:
    if step['id']=='voice':
        for item in ['audio/recording.json','audio/recording-import.json','audio/edit-decision.json','scripts/edit-recording.py','scripts/review-recording.py']:
            if item not in step['inputs']: step['inputs'].append(item)
write('job.json',job)
print('Reviewed corrections:',len(corrections),'actual speech scenes:',len(scenes))
