import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import ranking from "../../ranking.json";

const PAPER = "#f4f1ea";
const INK = "#161613";
const MUTED = "#5e5b54";
const CORAL = "#a8513c";
const LINE = "rgba(22,22,19,0.16)";
const SANS = "'Noto Sans SC','DengXian','Microsoft YaHei',sans-serif";
const MONO = "'Cascadia Mono','Cascadia Code',Consolas,monospace";

const SCENES = [
  { id: "ranking", frames: 16 * 60 },
  { id: "minimax", frames: 11 * 60 },
  { id: "limits", frames: 9 * 60 },
  { id: "flint", frames: 12 * 60 },
  { id: "typescript", frames: 11 * 60 },
  { id: "close", frames: 6 * 60 },
] as const;

export const EDITION_FPS = 60;
export const EDITION_FRAMES = SCENES.reduce((sum, scene) => sum + scene.frames, 0);

const rise = (frame: number, fps: number, delay: number) => {
  const p = spring({
    frame: frame - delay,
    fps,
    config: { damping: 26, mass: 0.6, stiffness: 140 },
  });
  return {
    opacity: Math.min(1, Math.max(0, p)),
    transform: `translateY(${(1 - Math.min(1, Math.max(0, p))) * 18}px)`,
  };
};

const Mast: React.FC<{ section: string }> = ({ section }) => (
  <div
    style={{
      position: "absolute",
      top: 36,
      left: 56,
      right: 56,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontFamily: SANS,
      color: INK,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 14, height: 14, background: CORAL }} />
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.4 }}>每日 AI</div>
    </div>
    <div style={{ fontFamily: MONO, fontSize: 18, color: MUTED }}>
      2026.10.23<span style={{ margin: "0 10px", color: LINE }}>|</span>
      {section}
    </div>
  </div>
);

const RankingPage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = ranking.top15;
  const lead = rows.slice(0, 3);
  const rest = rows.slice(3);
  const rule = interpolate(frame, [4, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ background: PAPER, fontFamily: SANS, color: INK }}>
      <Mast section="综合智力" />
      <div style={{ position: "absolute", top: 86, left: 56, right: 56 }}>
        <div style={{ ...rise(frame, fps, 0), fontSize: 64, fontWeight: 900, lineHeight: 1, letterSpacing: -1.2 }}>
          AI 模型综合智力 TOP 15
        </div>
        <div style={{ marginTop: 10, fontSize: 22, color: MUTED, letterSpacing: 0.3 }}>
          Epoch Capabilities Index / ECI
        </div>
        <div style={{ marginTop: 14, height: 5, width: `${rule * 100}%`, background: CORAL }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 56,
          right: 56,
          top: 214,
          bottom: 58,
          display: "flex",
          gap: 32,
        }}
      >
        <div style={{ width: 900, display: "flex", flexDirection: "column", gap: 12 }}>
          {lead.map((row, i) => {
            const first = i === 0;
            const shown = first
              ? interpolate(frame, [8, 36], [row.eci - 0.6, row.eci], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : row.eci;
            return (
              <div
                key={row.id}
                style={{
                  ...rise(frame, fps, 6 + i * 5),
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 28px",
                  background: first ? CORAL : PAPER,
                  color: first ? "#fffdf8" : INK,
                  border: first ? "none" : `1.5px solid ${INK}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
                  <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, opacity: 0.85 }}>
                    {String(row.rank).padStart(2, "0")}
                  </div>
                  <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -0.4 }}>{row.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 1.4, opacity: 0.75 }}>ECI</div>
                  <div style={{ fontFamily: MONO, fontSize: 40, fontWeight: 600, letterSpacing: -0.5 }}>
                    {shown.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "52px 1fr 92px",
              padding: "0 4px 8px",
              fontFamily: MONO,
              fontSize: 15,
              letterSpacing: 0.6,
              color: MUTED,
            }}
          >
            <div>#</div>
            <div>模型</div>
            <div style={{ textAlign: "right" }}>ECI</div>
          </div>
          {rest.map((row, i) => {
            const hint = row.rank === 12 ? "muse-wonder" : row.rank === 13 ? "muse-wonder-1.0" : "";
            return (
              <div
                key={row.id}
                style={{
                  ...rise(frame, fps, 14 + i * 2),
                  flex: 1,
                  display: "grid",
                  gridTemplateColumns: "52px 1fr 92px",
                  alignItems: "center",
                  borderTop: `1px solid ${LINE}`,
                  padding: "0 4px",
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 600 }}>
                  {String(row.rank).padStart(2, "0")}
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.2, whiteSpace: "nowrap" }}>
                  {row.name}
                  {hint ? (
                    <span style={{ marginLeft: 10, fontFamily: MONO, fontSize: 14, fontWeight: 500, color: MUTED }}>
                      {hint}
                    </span>
                  ) : null}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 22, textAlign: "right" }}>{row.eci.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 56,
          right: 56,
          bottom: 26,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 16,
          color: MUTED,
        }}
      >
        <div>大模型世界开源数据 · 2026-10-23 21:46 北京时间 · Epoch ECI</div>
        <div>不是网页现场抓取，不标升降</div>
      </div>
    </AbsoluteFill>
  );
};

const Stat: React.FC<{ value: string; label: string; delay: number }> = ({ value, label, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ ...rise(frame, fps, delay), borderTop: `1.5px solid ${INK}`, paddingTop: 16 }}>
      <div style={{ fontFamily: MONO, fontSize: 64, fontWeight: 600, letterSpacing: -1.5, lineHeight: 1 }}>{value}</div>
      <div style={{ marginTop: 10, fontSize: 24, fontWeight: 650 }}>{label}</div>
    </div>
  );
};

const MiniMaxPage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: PAPER, fontFamily: SANS, color: INK }}>
      <Mast section="头条" />
      <div style={{ position: "absolute", top: 108, left: 56, width: 1040 }}>
        <div style={{ ...rise(frame, fps, 0), fontFamily: MONO, fontSize: 18, color: CORAL, letterSpacing: 0.8 }}>
          2026.10.23  权重开放
        </div>
        <div style={{ ...rise(frame, fps, 3), marginTop: 12, fontSize: 92, fontWeight: 900, lineHeight: 0.96, letterSpacing: -2 }}>
          M3.1 Flash
          <br />
          开放权重
        </div>
        <div
          style={{
            marginTop: 36,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 36,
            rowGap: 28,
          }}
        >
          <Stat value="428B" label="总参，模型卡的约数" delay={8} />
          <Stat value="23B" label="每个 token 激活" delay={11} />
          <Stat value="100万" label="上下文 token" delay={14} />
          <Stat value="三模态" label="文字、图像、视频进，文字出" delay={17} />
        </div>
      </div>
      <div style={{ ...rise(frame, fps, 6), position: "absolute", top: 150, right: 64, width: 560 }}>
        <Img src={staticFile("brands/minimax.png")} style={{ width: 560, height: 560, objectFit: "contain" }} />
        <div style={{ marginTop: 14, fontSize: 18, color: MUTED }}>MiniMax 官方标志</div>
      </div>
      <div style={{ position: "absolute", left: 56, bottom: 36, fontSize: 22, color: MUTED }}>
        相对 M3：前三层改成稀疏注意力，路由专家做了量化，推测解码换成 DSpark。
      </div>
    </AbsoluteFill>
  );
};

const LimitsPage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = [
    ["01", "许可", "非商业免费。商用要署名。年收入超过 2000 万美元，先拿书面授权。"],
    ["02", "用量", "官方称 72 小时处理超过 100 万亿 token。没有独立复测。"],
    ["03", "芯片", "宣布和昇腾、平头哥、昆仑芯推进接入。不是每张卡都已经跑通。"],
  ];
  return (
    <AbsoluteFill style={{ background: PAPER, fontFamily: SANS, color: INK }}>
      <Mast section="怎么用" />
      <div style={{ position: "absolute", top: 108, left: 56, right: 56 }}>
        <div style={{ ...rise(frame, fps, 0), fontSize: 64, fontWeight: 900, letterSpacing: -1.4 }}>
          先看限制，再下载
        </div>
      </div>
      <div style={{ position: "absolute", left: 56, right: 56, top: 230, bottom: 48, display: "flex", flexDirection: "column" }}>
        {items.map((item, i) => (
          <div
            key={item[0]}
            style={{
              ...rise(frame, fps, 6 + i * 6),
              flex: 1,
              display: "grid",
              gridTemplateColumns: "88px 160px 1fr",
              alignItems: "center",
              borderTop: `1.5px solid ${INK}`,
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 28, color: CORAL }}>{item[0]}</div>
            <div style={{ fontSize: 36, fontWeight: 800 }}>{item[1]}</div>
            <div style={{ fontSize: 32, fontWeight: 650, lineHeight: 1.35 }}>{item[2]}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const FlintPage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scores = [
    ["74.2", "Verified"],
    ["89.7", "Pro v2"],
    ["54.9", "Terminal-Bench 2.1"],
  ];
  return (
    <AbsoluteFill style={{ background: PAPER, fontFamily: SANS, color: INK }}>
      <Mast section="本地编码" />
      <div style={{ position: "absolute", top: 104, left: 56, right: 56, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ ...rise(frame, fps, 0), fontFamily: MONO, fontSize: 18, color: CORAL }}>2026.10.21  Recursive</div>
          <div style={{ ...rise(frame, fps, 3), marginTop: 8, fontSize: 96, fontWeight: 900, lineHeight: 0.92, letterSpacing: -2.4 }}>
            Flint
          </div>
          <div style={{ ...rise(frame, fps, 6), marginTop: 8, fontSize: 36, fontWeight: 700 }}>放到自己的机器上</div>
        </div>
        <div style={{ ...rise(frame, fps, 4), display: "flex", alignItems: "center", gap: 16 }}>
          <Img src={staticFile("brands/recursive-mark.png")} style={{ width: 88, height: 88, objectFit: "contain" }} />
          <div style={{ fontSize: 28, fontWeight: 750 }}>Recursive</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 56, right: 56, top: 390, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        {scores.map((score, i) => (
          <div key={score[1]} style={{ ...rise(frame, fps, 10 + i * 4), borderTop: `1.5px solid ${INK}`, paddingTop: 18 }}>
            <div style={{ fontFamily: MONO, fontSize: 84, fontWeight: 600, letterSpacing: -2, lineHeight: 0.9 }}>{score[0]}</div>
            <div style={{ marginTop: 12, fontSize: 26, fontWeight: 700 }}>{score[1]}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 56, top: 590, fontSize: 22, color: MUTED }}>
        官方自测。温度 1.0，至少 5 次平均。
      </div>
      <div
        style={{
          position: "absolute",
          left: 56,
          right: 56,
          top: 640,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 28,
        }}
      >
        {[
          ["上下文", "模型卡写 262144。介绍页另写最长 512k，写代码建议留在 256k 内。"],
          ["速度", "M4 Pro 短上下文超过 125 token/s，64GB RTX Spark 超过 150。这是优化引擎的数字。"],
          ["主文件", "仓库里的 BF16 给单张大卡。笔记本速度不要直接套这份主文件。"],
        ].map((item, i) => (
          <div key={item[0]} style={{ ...rise(frame, fps, 18 + i * 3) }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: CORAL }}>{item[0]}</div>
            <div style={{ marginTop: 10, fontSize: 26, lineHeight: 1.4, fontWeight: 650 }}>{item[1]}</div>
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 56,
          right: 56,
          bottom: 40,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          borderTop: `1.5px solid ${INK}`,
          paddingTop: 16,
          fontSize: 26,
          fontWeight: 750,
        }}
      >
        <div>39.8B 总参</div>
        <div>约 2.5B 激活</div>
        <div>Apache 2.0</div>
      </div>
    </AbsoluteFill>
  );
};

const TypeScriptPage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = [
    ["mui-docs", 1.9],
    ["t3code", 1.4],
    ["sentry", 1.3],
    ["vscode", 1.2],
    ["bluesky", 1.2],
  ] as const;
  return (
    <AbsoluteFill style={{ background: PAPER, fontFamily: SANS, color: INK }}>
      <Mast section="工具链" />
      <Img
        src={staticFile("brands/typescript.svg")}
        style={{ position: "absolute", top: 96, right: 64, width: 168, height: 168 }}
      />
      <div style={{ position: "absolute", top: 100, left: 56, width: 1400 }}>
        <div style={{ ...rise(frame, fps, 0), fontFamily: MONO, fontSize: 18, color: CORAL }}>2026.10.20  不是今天的发布</div>
        <div style={{ ...rise(frame, fps, 3), marginTop: 8, fontSize: 68, fontWeight: 900, letterSpacing: -1.6, lineHeight: 1 }}>
          类型检查又快了一截
        </div>
        <div style={{ ...rise(frame, fps, 6), marginTop: 10, fontSize: 26, color: MUTED }}>
          微软 7.1 beta，对照 7.0，4 线程，noEmit
        </div>
      </div>
      <div style={{ position: "absolute", left: 56, right: 280, top: 340 }}>
        {rows.map((row, i) => {
          const width = interpolate(frame, [12 + i * 3, 36 + i * 3], [0, (row[1] / 1.9) * 100], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={row[0]}
              style={{
                ...rise(frame, fps, 8 + i * 3),
                display: "grid",
                gridTemplateColumns: "180px 90px 1fr",
                alignItems: "center",
                height: 78,
                borderTop: `1px solid ${LINE}`,
              }}
            >
              <div style={{ fontSize: 30, fontWeight: 750 }}>{row[0]}</div>
              <div style={{ fontFamily: MONO, fontSize: 28, color: CORAL }}>{row[1].toFixed(1)}x</div>
              <div style={{ height: 14, background: "rgba(168,81,60,0.12)" }}>
                <div style={{ width: `${width}%`, height: "100%", background: CORAL }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 56, right: 56, top: 760, fontSize: 28, lineHeight: 1.45, fontWeight: 650 }}>
        tsrs 官方说比 7.0 快最多 8 倍。这 8 倍不是相对 7.1。有人拿 7.1 beta 复测，大约 2 到 3 倍。
      </div>
    </AbsoluteFill>
  );
};

const ClosePage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = [
    ["01", "综合智力", "ECI 前 15，数据截止 21:46"],
    ["02", "M3.1 Flash", "今天开放权重，许可先看清楚"],
    ["03", "Flint", "本地编码，自测和速度分开"],
    ["04", "TypeScript", "7.1 与 tsrs，日期是 10 月 20 日"],
  ];
  return (
    <AbsoluteFill style={{ background: PAPER, fontFamily: SANS, color: INK }}>
      <Mast section="本期" />
      <div style={{ position: "absolute", top: 120, left: 56, fontSize: 72, fontWeight: 900, letterSpacing: -1.6 }}>
        今天先记这几件
      </div>
      <div style={{ position: "absolute", left: 56, right: 56, top: 260, bottom: 80, display: "flex", flexDirection: "column" }}>
        {items.map((item, i) => (
          <div
            key={item[0]}
            style={{
              ...rise(frame, fps, 4 + i * 4),
              flex: 1,
              display: "grid",
              gridTemplateColumns: "90px 340px 1fr",
              alignItems: "center",
              borderTop: `1.5px solid ${INK}`,
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 26, color: CORAL }}>{item[0]}</div>
            <div style={{ fontSize: 40, fontWeight: 800 }}>{item[1]}</div>
            <div style={{ fontSize: 30 }}>{item[2]}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 56, bottom: 32, fontSize: 18, color: MUTED }}>
        数字以模型卡、官方公告和点名的报道为准。
      </div>
    </AbsoluteFill>
  );
};

const BODY: Record<(typeof SCENES)[number]["id"], React.FC> = {
  ranking: RankingPage,
  minimax: MiniMaxPage,
  limits: LimitsPage,
  flint: FlintPage,
  typescript: TypeScriptPage,
  close: ClosePage,
};

export const DailyEdition: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      {SCENES.map((scene) => {
        const from = cursor;
        cursor += scene.frames;
        const Body = BODY[scene.id];
        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.frames}>
            <Body />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const DailyCover: React.FC = () => (
  <AbsoluteFill style={{ background: PAPER, fontFamily: SANS, color: INK }}>
    <Mast section="封面" />
    <div
      style={{
        position: "absolute",
        left: 56,
        right: 56,
        top: 150,
        bottom: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ width: 980 }}>
        <div style={{ fontFamily: MONO, fontSize: 20, color: CORAL, letterSpacing: 0.8 }}>2026.10.23</div>
        <div style={{ marginTop: 16, fontSize: 108, fontWeight: 900, lineHeight: 0.92, letterSpacing: -3 }}>
          M3.1 Flash
          <br />
          开放权重
        </div>
        <div style={{ marginTop: 28, height: 6, width: 220, background: CORAL }} />
        <div style={{ marginTop: 28, fontSize: 32, fontWeight: 700 }}>总参约 428B，激活约 23B</div>
      </div>
      <Img src={staticFile("brands/minimax.png")} style={{ width: 620, height: 620, objectFit: "contain" }} />
    </div>
  </AbsoluteFill>
);
