# humanizer — 中英文去 AI 味改写

识别并去除 AI 生成文本的痕迹，让文字像真人写的。不改事实，不发明细节。

**主要用途**：视频口播稿与 TTS 文案（vibe-studio 流水线的文案一站），也用于日常文章。

## 血统

v5.0.0 融合版（2026-08-24）：

- **英文体系**：[blader/humanizer](https://github.com/blader/humanizer) v2.11.2 — Wikipedia "Signs of AI writing" 35 条模式、误判防护、写作样本机制、事实不增不减铁律
- **中文体系**：unclecheng "Humanizer v4.1" 整合的中文社区研究 — 「不是A而是B」三毒机制、量化诊断分级、Phase 1-4 收敛流程、L1-L4 四层自检、AI 幻觉假数据识别

## 关键裁决

破折号**中英文都禁**（TimeCraker 2026-08 拍板，推翻早期"中文破折号合法"规则）：AI 滥用破折号是重灾区。写作样本例外——用户自己的样本爱用就保留同等频率。

## 用法

进 vibe-studio 会话自动生效；其他项目软链：

```bash
ln -s ~/Desktop/my-workspace/vibe-studio/skills/humanizer <project>/.claude/skills/humanizer
```

规则全文见 [SKILL.md](SKILL.md)。
