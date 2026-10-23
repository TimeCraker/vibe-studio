// 从 capture/edl*.json 派生 src/hsr-cues.ts——所有叠加元素的绝对时刻都由 EDL 计算，改剪重跑本脚本。
// 用法：node tools/gen-cues.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(HERE, '..');
const APP = join(PROJECT, 'remotion-app');

function loadEdl(rel) {
  const edl = JSON.parse(readFileSync(join(PROJECT, 'capture', rel), 'utf8'));
  let t = 0;
  const starts = {};
  for (const s of edl.segments) {
    starts[s.id] = t;
    t += s.dur / s.speed;
  }
  return { starts, total: t };
}

const main = loadEdl('edl.json');
const vert = loadEdl('edl-vertical.json');
const at = (starts, seg, off) => +(starts[seg] + off).toFixed(2);

// ---------- 横版字幕（主语=这把有多爽；不与画面自带大字重复） ----------
const sub = (seg, o, d, text) => ({ start: at(main.starts, seg, o), end: at(main.starts, seg, o + d), text });
const subtitles = [
  sub('C02', 0.4, 2.0, '货币战争：星穹铁道的自走棋'),
  sub('C02', 2.5, 1.9, '攒钱、上人口、凑完全体'),
  sub('C03', 0.4, 1.8, '决战前夕，先把板子理顺'),
  sub('C03', 2.2, 1.6, '今晚的目标：三星昔涟、三星银狼'),
  sub('C04', 0.3, 2.1, '合成三星的奖励：金币雨'),
  sub('C05', 0.3, 2.6, '刷牌：把钱换成战力'),
  sub('C05', 3.2, 2.6, '每一轮商店都是一次机会'),
  sub('C06', 0.3, 2.6, '拿牌、囤钱，两手都要抓'),
  sub('C07', 0.4, 3.0, '中期运营：板面一点点厚起来'),
  sub('C07', 3.6, 3.2, '三星在路上，谁先成型谁说了算'),
  sub('C07', 7.0, 4.6, '备战阶段的每一秒都是钱'),
  sub('C08', 0.4, 3.4, '时间快进：半小时运营压缩成十几秒'),
  sub('C08', 4.0, 3.6, '主力一张张到齐，装备一件件穿上'),
  sub('C08', 7.8, 4.0, '板面成型，只差最后一步'),
  sub('C08', 12.0, 4.2, '决战前的家底，全攒齐了'),
  sub('C09', 0.6, 2.4, '然后，银狼塞过来一个好东西'),
  sub('C09', 3.2, 3.2, 'GM 操作台：加金币、满血、改敌人血量'),
  sub('C09', 6.6, 4.0, '字面意义上的，开挂菜单'),
  sub('C10', 0.5, 2.4, '敌方生命值：自己定'),
  sub('C10', 3.1, 2.5, '拉到 1000%，嫌它不够肉'),
  sub('C11', 0.3, 2.4, '确认——不作弊，不痛快'),
  sub('C12', 0.4, 3.2, '回头把最后的三星合出来'),
  sub('C13', 0.3, 2.0, '合成光效，看着就爽'),
  sub('C14', 0.5, 2.2, '13/13，人口拉满'),
  sub('C14', 2.8, 2.0, '970 金币，全是运营攒下的'),
  sub('C15', 0.4, 2.0, '商店直接刷出三星卡'),
  sub('C15', 2.4, 2.0, '后台清一色，全是三星'),
  sub('C15b', 0.4, 2.0, '又一张三星，拿下'),
  sub('C15b', 2.4, 2.0, '昔涟、银狼，一个都不能少'),
  sub('C16', 0.3, 3.4, '三星到手，决战就绪'),
  sub('C17', 0.4, 3.2, '财富遗物：决战前最后一块拼图'),
  sub('C18', 0.5, 2.2, '决战阵容，检查完毕'),
  sub('C18', 2.8, 2.0, '对面血量 1000%，来吧'),
  sub('C19', 0.4, 2.0, '战斗阶段 3-7'),
  sub('C19', 2.4, 2.3, '首领强敌，来袭'),
  sub('C20', 0.4, 2.0, '第一轮齐射，21 亿起步'),
  sub('C20', 2.4, 1.9, '这还只是热身'),
  sub('C21', 0.4, 3.2, '大招，连环开'),
  sub('C22', 0.5, 2.6, '完整体演出，一个接一个'),
  sub('C22', 3.3, 2.4, '伤害？先别急'),
  sub('C23', 0.4, 1.8, '蓄力——'),
  sub('C23', 2.2, 1.6, '幸运暴击，10 亿起步'),
  sub('C24', 0.3, 2.4, '单段伤害，直接破万亿'),
  sub('C25', 0.6, 2.6, '昔涟完整体，温柔登场'),
  sub('C25', 3.4, 4.2, '这一段，一个字都不用多说'),
  sub('C26', 0.4, 2.2, '伤害结算：5566 亿暴击'),
  sub('C26', 2.8, 4.2, '对面血量 1000%？没感觉到'),
  sub('C27', 0.4, 3.2, '然后，数字直接上万亿'),
  sub('C28', 0.4, 2.2, '真伤结算，1622 亿一跳'),
  sub('C28', 2.8, 2.4, '血条？什么血条？'),
  sub('C29', 0.2, 1.8, '第一次运营，完美收官'),
];

// ---------- 横版其余元素 ----------
const titleCards = [
  {
    t: at(main.starts, 'C01', 0.6), ttl: 3.9,
    kicker: '崩坏：星穹铁道 · 货币战争',
    title: '第一次三星昔涟银狼',
    sub: '这把，直接爽局',
  },
];
const chapterCards = [
  { t: at(main.starts, 'C02', 0.0), ttl: 1.8, index: 'PHASE 1', name: '运营' },
  { t: at(main.starts, 'C09', 0.0), ttl: 1.8, index: 'PHASE 2', name: '开挂时间' },
  { t: at(main.starts, 'C18', 0.0), ttl: 1.8, index: 'FINAL', name: '决战 3-7' },
];
const nameBanners = [
  { t: at(main.starts, 'C09', 1.2), ttl: 3.0, name: '银狼999', tag: '这个好东西是她给的' },
  { t: at(main.starts, 'C25', 1.0), ttl: 3.2, name: '昔涟 · 完整体', tag: '完整体登场' },
];
const damageCards = [
  { t: at(main.starts, 'C24', 0.6), ttl: 2.2, value: '1.2 万亿', label: '单次爆发伤害' },
  { t: at(main.starts, 'C26', 0.6), ttl: 2.2, value: '5566 亿', label: '幸运暴击' },
  { t: at(main.starts, 'C27', 0.8), ttl: 2.6, value: '9999 亿', label: '单段伤害 · 打满上限' },
];
const spotlights = [
  { t: at(main.starts, 'C09', 2.2), ttl: 3.4, kind: 'box', x: 380, y: 320, w: 1120, h: 430, text: 'GM 操作台' },
  { t: at(main.starts, 'C10', 0.8), ttl: 2.6, kind: 'box', x: 600, y: 470, w: 740, h: 130, text: '敌人血量 1000%' },
  { t: at(main.starts, 'C14', 0.8), ttl: 2.8, kind: 'box', x: 1655, y: 860, w: 200, h: 105, text: '970 金币' },
];
const dataBars = [
  {
    t: at(main.starts, 'C14', 0.4), ttl: 7, x: 110, y: 600, scale: 0.9,
    bars: [
      { label: '备战开局', value: 62, unit: '金', color: '#e8c15a' },
      { label: '峰值(加金币)', value: 1029, unit: '金', color: '#f2984a' },
      { label: '决战前', value: 970, unit: '金', color: '#7bc96f' },
    ],
  },
];
const endCard = {
  t: at(main.starts, 'C30', 0.3), ttl: 4.0,
  title: '三星昔涟银狼 · 爽局收官',
  rows: [
    { label: '单段伤害上限', value: '9999 亿（幸运暴击）' },
    { label: '单角色总伤', value: '343 亿+（霸绊面板）' },
    { label: '本局配置', value: '敌人血量 1000% · 人口 13/13' },
  ],
  sub: '下一把，已经预约',
};

// ---------- 竖版 ----------
const vsub = (seg, o, d, text) => ({ start: at(vert.starts, seg, o), end: at(vert.starts, seg, o + d), text });
const vertical = {
  total: vert.total,
  titleCards: [
    { t: at(vert.starts, 'V01', 0.25), ttl: 2.3, kicker: '货币战争 · 第一次三星昔涟银狼', title: '直接爽局', sub: '' },
  ],
  subtitles: [
    vsub('V02', 0.3, 2.6, '银狼塞来一个 GM 操作台'),
    vsub('V02', 3.1, 2.7, '加金币、满血、改血量，随便开'),
    vsub('V03', 0.3, 2.6, '完整体演出，直接拉满'),
    vsub('V04', 0.5, 2.2, '昔涟完整体'),
    vsub('V04', 2.9, 2.4, '先看这段演出'),
    vsub('V04', 5.5, 2.2, '伤害？等下再说'),
    vsub('V05', 0.3, 2.0, '幸运暴击：5566 亿'),
    vsub('V05', 2.4, 1.9, '这还只是一段'),
    vsub('V06', 0.3, 3.4, '数字，上万亿了'),
    vsub('V07', 0.3, 2.4, '真伤 1622 亿一跳'),
    vsub('V07', 2.9, 2.4, '对面血量 1000%，照样秒'),
    vsub('V08', 0.2, 1.8, '挑战成功'),
  ],
  damageCards: [
    { t: at(vert.starts, 'V05', 0.4), ttl: 1.9, value: '5566 亿', label: '幸运暴击' },
    { t: at(vert.starts, 'V06', 0.5), ttl: 2.4, value: '9999 亿', label: '单段上限' },
  ],
  endCard: {
    t: at(vert.starts, 'V09', 0.3), ttl: 2.9,
    title: '三星昔涟银狼 · 爽局',
    rows: [
      { label: '单段上限', value: '9999 亿' },
      { label: '敌方血量', value: '1000%' },
    ],
    sub: '完整版已发布',
  },
};

const out = `// AUTO-GENERATED by tools/gen-cues.mjs — 改 EDL 或注解后重跑，勿手改
export interface TitleCardCue { t: number; ttl: number; kicker: string; title: string; sub: string; }
export interface ChapterCardCue { t: number; ttl: number; index: string; name: string; }
export interface NameBannerCue { t: number; ttl: number; name: string; tag: string; }
export interface DamageCardCue { t: number; ttl: number; value: string; label: string; }
export interface EndCardCue { t: number; ttl: number; title: string; rows: { label: string; value: string }[]; sub: string; }
export interface SubtitleCue { start: number; end: number; text: string; }
export interface DataBarGroup { t: number; ttl?: number; x: number; y: number; scale?: number; bars: { label: string; value: number; unit?: string; color?: string }[]; }
export interface SpotlightCue { t: number; ttl: number; kind: 'circle' | 'arrow' | 'box'; x: number; y: number; w: number; h: number; text?: string; }

export const MAIN_TOTAL = ${main.total.toFixed(2)};
export const hsrCues = {
  subtitles: ${JSON.stringify(subtitles, null, 2)} as SubtitleCue[],
  titleCards: ${JSON.stringify(titleCards, null, 2)} as TitleCardCue[],
  chapterCards: ${JSON.stringify(chapterCards, null, 2)} as ChapterCardCue[],
  nameBanners: ${JSON.stringify(nameBanners, null, 2)} as NameBannerCue[],
  damageCards: ${JSON.stringify(damageCards, null, 2)} as DamageCardCue[],
  spotlights: ${JSON.stringify(spotlights, null, 2)} as SpotlightCue[],
  dataBars: ${JSON.stringify(dataBars, null, 2)} as DataBarGroup[],
  endCard: ${JSON.stringify(endCard, null, 2)} as EndCardCue,
  darkRanges: [{ from: 0, to: ${main.total.toFixed(2)} }],
};

export const VERTICAL_TOTAL = ${vert.total.toFixed(2)};
export const hsrCuesVertical = {
  titleCards: ${JSON.stringify(vertical.titleCards, null, 2)} as TitleCardCue[],
  subtitles: ${JSON.stringify(vertical.subtitles, null, 2)} as SubtitleCue[],
  damageCards: ${JSON.stringify(vertical.damageCards, null, 2)} as DamageCardCue[],
  endCard: ${JSON.stringify(vertical.endCard, null, 2)} as EndCardCue,
};
`;

writeFileSync(join(APP, 'src', 'hsr-cues.ts'), out);
console.log(`hsr-cues.ts written: main ${main.total.toFixed(1)}s / vertical ${vert.total.toFixed(1)}s, ${subtitles.length}+${vertical.subtitles.length} subs`);
