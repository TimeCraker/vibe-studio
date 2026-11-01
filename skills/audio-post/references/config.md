# audio.json

路径相对项目根目录，只读项目内实际文件。输出 WAV，48kHz 双声道；默认 audio/mix.wav，报告为同名 .json。会替换指定输出，但拒绝覆盖配置或任何输入。

```json
{
  "schemaVersion": 1,
  "duration": 12,
  "target": { "integrated": -16, "truePeak": -1.5, "range": 11 },
  "ducking": { "threshold": 0.03, "ratio": 8, "attack": 10, "release": 250 },
  "tracks": [
    { "file": "audio/voice.wav", "role": "voice", "start": 0, "in": 0, "duration": 12, "gainDb": 0 },
    { "file": "audio/music.wav", "role": "music", "loop": true, "gainDb": -12, "fadeIn": 0.3, "fadeOut": 0.8 }
  ]
}
```

duration 是输出秒数；每轨 start 是时间轴起点，in 是源音轨起点，duration 是使用长度。非循环轨省略长度时使用剩余源时长，超出时间轴时报错，须明确裁切；循环仅允许 music。role 为 voice/music/effect，可放多条；缺省 start/in/gainDb 为 0，fadeIn/fadeOut 为 0（秒）。highpassHz 可选 0..400，用于确有需要的低频清理。

默认启用两遍 loudnorm，target 分别为 LUFS、dBTP、LU，以上仅为项目示例而非平台统一标准。normalize:false 可保留原增益供对照；仍测量并报告，不放过静音。ducking:false 关闭避让；没有人声或音乐时不应用避让。attack/release 单位毫秒，threshold 为线性幅度。

人声轨可选 `"denoise": {"reductionDb": 8, "noiseFloorDb": -50}`，或 false/省略关闭。只接受 voice 轨的设置对象；reductionDb 为 0.01..30 dB，noiseFloorDb 为 -80..-20 dB，未填字段分别采用 8/-50。底噪参数对应源录音增益，处理在轨道 gainDb 和 loudnorm 之前，用 FFmpeg 的 [afftdn](https://ffmpeg.org/ffmpeg-filters.html#afftdn) 做频谱降噪。无需外部模型；这些是可调参数，不是通用录音预设或保证减少的实测分贝数。

滤镜在本工具固定的 48kHz 下有 1200 采样（25ms）处理延迟，工具补尾后裁去延迟并重置时间戳，报告 denoiseDelayCompensationSamples。回归检查实际信号起点与尾部保留；只比较总时长不足以证明字幕时钟没变。FFmpeg 行为变化时先用音频回归核对，不直接沿用延迟假设。

先取确无说话的底噪段，并与正常说话/轻声句尾对照后试较轻的处理；ASR 空隙可能含呼吸或漏识别，不能直接等同纯噪声。对照不加音乐、匹配人声响度，原录音与采用轨保留，另存处理输出；检查时长和剪口没有变化，再混 BGM。报告 inputs 会记录 denoise、highpassHz 和 gainDb 及源哈希。测得噪声能量下降仍不证明人声自然；有吞字/水声先减弱或停用，不为降低指标强加噪声门。

处理报告记录配置、输入与输出哈希、前后测量、是否避让和待审听项。技术达标不表示音乐选得合适或听感已通过。FFmpeg 原理见 [loudnorm / sidechaincompress](https://ffmpeg.org/ffmpeg-filters.html)。

加入 job.json 时声明 audio.json 和每个源文件为 inputs，输出混音与报告为 outputs；调用 `node {repo}/scripts/studio.mjs audio --project {project}`。后续渲染步骤也要把实际混音列为输入，参数变化时缓存才会正确失效。
