import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { deckCues } from "./deck-cues";
import { deckParams } from "./deck-params";
import ranking from "../../ranking.json";

const PAPER = "#f3f2ed";
const SHEET = "#fbfaf7";
const INK = "#1a1a18";
const MUTED = "#5c5a54";
const CORAL = "#a8513c";
const LINE = "rgba(26,26,24,0.22)";
const SANS = "'Microsoft YaHei','PingFang SC','Noto Sans SC',sans-serif";
const MONO = "Consolas,'Cascadia Mono','Courier New',monospace";

const enter = (frame: number, fps: number, delay: number) => {
  const p = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, mass: 0.55 },
  });
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * 16}px)`,
  };
};

const Masthead: React.FC<{ section: string }> = ({ section }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "32px 64px 0",
      fontFamily: SANS,
      color: INK,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 16, height: 16, background: CORAL }} />
      <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: 0.5 }}>每日 AI</div>
    </div>
    <div style={{ fontFamily: MONO, fontSize: 22, color: MUTED }}>
      2026.10.23  /  {section}
    </div>
  </div>
);

const Rule: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const width = Math.min(Math.max(frame - delay, 0) * 14, 1280);
  return <div style={{ height: 6, width, background: CORAL, marginTop: 14 }} />;
};

const PaperSubs: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cue = deckCues.find((c) => t >= c.start && t < c.end);
  if (!cue) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        right: 64,
        bottom: 22,
        height: 58,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(243,242,237,0.94)",
        borderTop: `1px solid ${LINE}`,
        fontFamily: SANS,
        fontSize: 32,
        fontWeight: 700,
        color: INK,
      }}
    >
      {cue.text}
    </div>
  );
};

const RankingPage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = ranking.top15;
  const lead = rows.slice(0, 3);
  const rest = rows.slice(3);
  return (
    <AbsoluteFill style={{ background: PAPER, fontFamily: SANS, color: INK }}>
      <Masthead section="综合智力" />
      <div style={{ padding: "18px 64px 0" }}>
        <div style={{ fontSize: 60, fontWeight: 900, lineHeight: 1, letterSpacing: -0.5 }}>
          AI 模型综合智力 TOP 15
        </div>
        <div style={{ marginTop: 8, fontSize: 24, color: MUTED }}>
          Epoch Capabilities Index / ECI
        </div>
        <Rule />
      </div>
      <div style={{ display: "flex", gap: 28, padding: "22px 64px 0", height: 700 }}>
        <div style={{ width: 860, display: "flex", flexDirection: "column", gap: 14 }}>
          {lead.map((row, i) => {
            const first = i === 0;
            const motion = enter(frame, fps, 4 + i * 6);
            const shown = first
              ? interpolate(frame, [8, 44], [row.eci - 0.9, row.eci], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : row.eci;
            return (
              <div
                key={row.id}
                style={{
                  ...motion,
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 28px",
                  background: first ? CORAL : SHEET,
                  color: first ? "#fff" : INK,
                  border: first ? "none" : `1.5px solid ${INK}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
                  <div style={{ fontFamily: MONO, fontSize: 42, fontWeight: 700 }}>
                    {String(row.rank).padStart(2, "0")}
                  </div>
                  <div style={{ fontSize: 40, fontWeight: 800 }}>{row.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, letterSpacing: 1, opacity: 0.8 }}>ECI</div>
                  <div style={{ fontFamily: MONO, fontSize: 40, fontWeight: 700 }}>
                    {shown.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ flex: 1, borderTop: `1.5px solid ${INK}` }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "64px 1fr 110px",
              padding: "8px 8px 6px",
              fontSize: 18,
              color: MUTED,
              fontFamily: MONO,
            }}
          >
            <div>#</div>
            <div>模型</div>
            <div style={{ textAlign: "right" }}>ECI</div>
          </div>
          {rest.map((row, i) => {
            const motion = enter(frame, fps, 10 + i * 2);
            const hint =
              row.rank === 12 ? "muse-wonder" : row.rank === 13 ? "muse-wonder-1.0" : "";
            return (
              <div
                key={row.id}
                style={{
                  ...motion,
                  display: "grid",
                  gridTemplateColumns: "64px 1fr 110px",
                  alignItems: "center",
                  height: 48,
                  borderTop: `1px solid ${LINE}`,
                  padding: "0 8px",
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700 }}>
                  {String(row.rank).padStart(2, "0")}
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, whiteSpace: "nowrap" }}>
                  {row.name}
                  {hint ? (
                    <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 500, color: MUTED }}>
                      {"  "}
                      {hint}
                    </span>
                  ) : null}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 24, textAlign: "right" }}>
                  {row.eci.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          bottom: 96,
          display: "flex",
          justifyContent: "space-between",
          borderTop: `1px solid ${LINE}`,
          paddingTop: 8,
          fontSize: 18,
          color: MUTED,
          fontFamily: SANS,
        }}
      >
        <div>大模型世界开源数据，生成于 2026-10-23 21:46（北京时间），Epoch ECI</div>
        <div>不是网页现场抓取，不标升降</div>
      </div>
    </AbsoluteFill>
  );
};

const Fact: React.FC<{ label: string; value: string; delay: number }> = ({
  label,
  value,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        ...enter(frame, fps, delay),
        display: "grid",
        gridTemplateColumns: "168px 1fr",
        gap: 16,
        padding: "11px 0",
        borderTop: `1px solid ${LINE}`,
        fontSize: 28,
      }}
    >
      <div style={{ color: CORAL, fontWeight: 800 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
};

const LogoCard: React.FC<{ file: string; caption: string; height?: number }> = ({
  file,
  caption,
  height = 280,
}) => (
  <div
    style={{
      width: 460,
      background: SHEET,
      border: `1.5px solid ${INK}`,
      boxShadow: "0 12px 28px rgba(26,26,24,0.06)",
      padding: 24,
    }}
  >
    <Img
      src={staticFile(file)}
      style={{ width: "100%", height, objectFit: "contain" }}
    />
    <div style={{ marginTop: 12, fontSize: 20, color: MUTED }}>{caption}</div>
  </div>
);

const NewsShell: React.FC<{
  section: string;
  kicker: string;
  title: string;
  logo: string;
  caption: string;
  logoHeight?: number;
  children: React.ReactNode;
}> = ({ section, kicker, title, logo, caption, logoHeight, children }) => (
  <AbsoluteFill style={{ background: PAPER, fontFamily: SANS, color: INK }}>
    <Masthead section={section} />
    <div style={{ display: "flex", gap: 48, padding: "28px 64px 0" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: MONO, fontSize: 20, color: CORAL, letterSpacing: 1 }}>
          {kicker}
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.05,
            marginTop: 8,
            whiteSpace: "pre-line",
          }}
        >
          {title}
        </div>
        <Rule delay={2} />
        <div style={{ marginTop: 8 }}>{children}</div>
      </div>
      <LogoCard file={logo} caption={caption} height={logoHeight} />
    </div>
  </AbsoluteFill>
);

const MiniMaxPage: React.FC = () => (
  <NewsShell
    section="头条"
    kicker="2026-10-23  权重开放"
    title={"M3.1 Flash\n开放权重"}
    logo="brands/minimax.png"
    caption="MiniMax 官方组织标志"
    logoHeight={320}
  >
    <Fact label="总参" value="约 428B，模型卡写法" delay={6} />
    <Fact label="激活" value="每 token 约 23B" delay={10} />
    <Fact label="输入" value="文字、图像、视频，输出文字" delay={14} />
    <Fact label="上下文" value="最长 100 万 token" delay={18} />
    <Fact label="相对 M3" value="前三层改稀疏注意力；路由专家量化；DSpark" delay={22} />
    <Fact label="用量" value="IT之家转述：72 小时超 100 万亿 token，无独立复测" delay={26} />
    <Fact label="许可" value="非商业免费。商用要署名；年收入过 2000 万美元需事先书面授权" delay={30} />
    <Fact label="芯片" value="宣布与昇腾、平头哥、昆仑芯等推进接入，不是已经跑通" delay={34} />
  </NewsShell>
);

const FlintPage: React.FC = () => (
  <NewsShell
    section="本地编码"
    kicker="2026-10-21  Recursive"
    title={"Flint\n放到自己的机器上"}
    logo="brands/recursive-mark.png"
    caption="Recursive 浅色站点标志，型号 Flint"
    logoHeight={180}
  >
    <Fact label="规模" value="39.8B 总参，每 token 约 2.5B 激活" delay={6} />
    <Fact label="专家" value="256 个里选 6 个，另有 1 个共享专家" delay={10} />
    <Fact label="上下文" value="模型卡 262144。介绍页另写最长 512k，编码建议 256k 内" delay={14} />
    <Fact label="许可" value="Apache 2.0，权重在 Hugging Face" delay={18} />
    <Fact label="自测" value="Verified 74.2%  /  Pro v2 89.7%  /  Terminal-Bench 2.1 为 54.9%" delay={22} />
    <Fact label="速度" value="M4 Pro 短上下文超过 125 token/s，64GB RTX Spark 超过 150" delay={26} />
    <Fact label="限制" value="主文件是 BF16，服务套件面向单张大卡。笔记本数字不要直接套主文件" delay={30} />
  </NewsShell>
);

const TypeScriptPage: React.FC = () => {
  const speeds = [
    ["bluesky", "1.2x", "13%"],
    ["mui-docs", "1.9x", "47%"],
    ["sentry", "1.3x", "23%"],
    ["t3code", "1.4x", "28%"],
    ["vscode", "1.2x", "18%"],
  ];
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <NewsShell
      section="工具链"
      kicker="2026-10-20  不是今天的发布"
      title={"类型检查\n又快了一截"}
      logo="brands/typescript.svg"
      caption="TypeScript 标志"
      logoHeight={220}
    >
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 12 }}>
        微软 7.1 beta，对照 7.0，4 线程，noEmit
      </div>
      <div style={{ marginTop: 8 }}>
        {speeds.map((row, i) => (
          <div
            key={row[0]}
            style={{
              ...enter(frame, fps, 8 + i * 4),
              display: "grid",
              gridTemplateColumns: "180px 100px 1fr",
              alignItems: "center",
              height: 46,
              borderTop: `1px solid ${LINE}`,
              fontFamily: MONO,
              fontSize: 26,
            }}
          >
            <div style={{ fontFamily: SANS, fontWeight: 700 }}>{row[0]}</div>
            <div style={{ color: CORAL, fontWeight: 700 }}>{row[1]}</div>
            <div style={{ height: 10, background: "rgba(168,81,60,0.18)" }}>
              <div style={{ width: `${Math.min(frame * 1.2, Number(row[1].replace("x", "")) * 28)}%`, height: "100%", background: CORAL }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, fontSize: 26, lineHeight: 1.45 }}>
        tsrs 是 Cloudflare 的 Rust 移植，实验版。官方说比 7.0 快最多 8 倍、内存大约少 70%。这 8 倍不是相对 7.1 beta。第三方拿 7.1 beta 复测，加速大约 2 到 3 倍。
      </div>
    </NewsShell>
  );
};

const ClosePage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = [
    ["01", "综合智力", "ECI 前 15，开源数据 21:46"],
    ["02", "M3.1 Flash", "今天开放权重，许可先看清楚"],
    ["03", "Flint", "本地编码模型，自测和速度分开看"],
    ["04", "TypeScript", "7.1 beta 与 tsrs，日期是 10 月 20 日"],
  ];
  return (
    <AbsoluteFill style={{ background: PAPER, fontFamily: SANS, color: INK }}>
      <Masthead section="本期" />
      <div style={{ padding: "36px 64px 0" }}>
        <div style={{ fontSize: 68, fontWeight: 900, lineHeight: 1 }}>今天先记这几件</div>
        <Rule />
        <div style={{ marginTop: 28 }}>
          {items.map((item, i) => (
            <div
              key={item[0]}
              style={{
                ...enter(frame, fps, 6 + i * 5),
                display: "grid",
                gridTemplateColumns: "90px 280px 1fr",
                alignItems: "baseline",
                padding: "18px 0",
                borderTop: `1px solid ${LINE}`,
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 28, color: CORAL }}>{item[0]}</div>
              <div style={{ fontSize: 36, fontWeight: 800 }}>{item[1]}</div>
              <div style={{ fontSize: 28 }}>{item[2]}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 28, fontSize: 24, color: MUTED }}>
          数字以模型卡、官方公告和点名的报道为准。测试配音，正式音色未定。
        </div>
      </div>
    </AbsoluteFill>
  );
};

const PageBody: React.FC<{ index: number }> = ({ index }) => {
  if (index === 1) return <RankingPage />;
  if (index === 2) return <MiniMaxPage />;
  if (index === 3) return <FlintPage />;
  if (index === 4) return <TypeScriptPage />;
  if (index === 5) return <ClosePage />;
  return <AbsoluteFill style={{ background: PAPER }} />;
};

export const DailyEdition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  let acc = 0;
  const pages = deckParams.pages.map((page, i) => {
    const isLast = i === deckParams.pages.length - 1;
    const dur = isLast
      ? durationInFrames - acc
      : Math.round(page.pageSeconds * fps);
    const from = acc;
    acc += dur;
    return { page, from, dur };
  });
  const progress = interpolate(frame, [0, Math.max(durationInFrames - 1, 1)], [0, 100], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      {pages.map(({ page, from, dur }) => (
        <Sequence key={page.index} from={from} durationInFrames={Math.max(dur, 1)}>
          <Audio src={staticFile(`deck/audio/page-${page.index}.wav`)} />
          <PageBody index={page.index} />
        </Sequence>
      ))}
      <PaperSubs />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 5,
          width: `${progress}%`,
          background: CORAL,
        }}
      />
    </AbsoluteFill>
  );
};

export const DailyCover: React.FC = () => (
  <AbsoluteFill style={{ background: PAPER, fontFamily: SANS, color: INK }}>
    <Masthead section="封面" />
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 56, padding: "0 72px 72px" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: MONO, fontSize: 22, color: CORAL, letterSpacing: 1 }}>
          2026.10.23
        </div>
        <div style={{ fontSize: 86, fontWeight: 900, lineHeight: 1.02, marginTop: 16 }}>
          M3.1 Flash
          <br />
          开放权重
        </div>
        <Rule />
        <div style={{ marginTop: 22, fontSize: 34, fontWeight: 700 }}>
          总参约 428B，激活约 23B
        </div>
        <div style={{ marginTop: 12, fontSize: 26, color: MUTED }}>
          上下文最长 100 万 token。商用许可和芯片接入，正文再说清楚。
        </div>
      </div>
      <div
        style={{
          width: 520,
          background: SHEET,
          border: `1.5px solid ${INK}`,
          boxShadow: "0 16px 36px rgba(26,26,24,0.07)",
          padding: 28,
        }}
      >
        <Img
          src={staticFile("brands/minimax.png")}
          style={{ width: "100%", height: 420, objectFit: "contain" }}
        />
      </div>
    </div>
  </AbsoluteFill>
);
