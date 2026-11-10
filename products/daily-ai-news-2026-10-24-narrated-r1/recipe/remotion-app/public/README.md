# public/ — 项目素材目录

渲染素材（截图、页图、配音、插画）放这里，`staticFile("<文件名>")` 相对读取。
**素材不进 git、不进 skill 模板**：这是每个项目工程自己的目录，按项目隔离。

常用子目录（由脚本自动创建）：
- `deck/pages/p-<N>.png` — PPT 页图（extract_pages.py 产出）
- `deck/audio/page-<N>.wav` — 逐页配音（SAPI 占位 / 剪映真人配音同名回填）
- `<项目名>/…` — 截图与插画等项目素材
