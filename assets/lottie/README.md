# Lottie 资产库

免费商用 Lottie JSON 的家底。**项目用时装载**:把 JSON 复制进 `projects/<项目>/remotion-app/public/lottie/`,渲染时 `LottieLayer src="lottie/<文件名>.json"`(src 是 public/ 相对路径);或直接 `import` 后走 `animationData`(零 IO,更确定性)。

## 登记表(每个资产一行,来源与许可证是硬字段)

| 文件 | 来源 | 许可证 | 拉取命令 / 备注 | 用途 |
|---|---|---|---|---|
| `spin-ring.json` | 自产(本仓库手写) | 无限制 | 虚线圆环旋转+呼吸,90 帧@30fps | LottieLayer 通道测试 / 加载态占位 |

## 收录铁律

1. **只收免费商用**:LottieFiles 筛 "Free" + 看资产页许可证标注;拿不准的坚决不收
2. **intake 禁带 expressions 的 JSON**(渲染逐帧闪烁,@remotion/lottie 已知坑):下载后打开 JSON 搜 `"x"` 表达式字段,命中即弃
3. **登记即入库**:来源 URL / 许可证 / 拉取日期(写进备注)三字段齐才算收录
4. 文件名 `kebab-case`,按用途命名(`arrow-draw.json` / `check-pop.json`),不保留下载原名
