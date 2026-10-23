# 文档与作品状态维护

日常由当前编程 Agent 运行一个命令，工具生成确定事实并定位候选说明，Agent 直接改相关段落。默认复用已有文件，不另建日报、逐次维护报告或中央知识副本。

## 日常入口

```powershell
# 在 vibe-studio 根目录：生成清单、定位影响、检查新增问题
npm run docs:maintain
# 确定检查与只读影响分析
npm run docs:check
node scripts/docs.mjs impact --staged
# 搜索整个 workspace，默认排除历史文档；需要时加 --history
node scripts/docs.mjs search --workspace .. --query "网页采集"
```

maintain 自动修改 README 的受管生成区；普通文字由当前 Agent 依据影响清单和实际实现修订。无语义变化就简述无需更新，不为完成检查新增文档。这个命令不调用模型或网络，不会替人编造接受/发布记录。

### 自动生成与提交检查

根 README 内 skills、tree、commands、versions 四类 docs:auto 块自动生成；后两类可通过 source 属性指定命令声明或依赖配置，块外内容保持原样。命令 JSON 同时提供 CLI 帮助与命令表。工具默认检查工作区，--staged 严格读取暂存区；sync 只写工作区，不自动暂存或拼接部分提交。

本仓库安装钩子用 `node scripts/docs.mjs hooks`。workspace 批量接入用 `node scripts/docs.mjs setup --workspace .. --chain-existing`：默认钩子保存在 Git 本地目录；兼容的干净 Husky lint-staged 脚本只追加有标记的检查段，需随该仓库提交；其他自定义/修改中的钩子保留并明确报告。加 --remove 只移除本工具拥有且未被修改的部分。

钩子快速检查生成漂移和本次新增坏链接；旧断链和语义候选分别处理。它不改写或暂存文件，也不自动发起 AI 任务。检出后初始化时安装一次；本地钩子和绝对工具路径不会随普通 clone 自动安装。CI 的 docs:check 负责确定检查，语义修订由当前 Agent 完成。

### 跨项目与索引

从其他仓库调用本工具的绝对路径，--repo 指向目标；不必为每个项目复制脚本或建配置表。setup 前核对目标项目规则，工具保留已有改动；Husky 追加段使用 workspace 相对路径，离开该布局且共享工具不存在时保留原检查，重新接入后恢复文档检查。

索引缓存放在本工具 .cache/docs，仅保存词项、路径、标题、哈希与来源引用，源正文留在原仓库。每次检索重新核对文档内容哈希，结果正文从源文件读取；中文/英文关键词检索可换词重查，不是向量问答。扫描深度为 3，排除依赖、缓存、归档仓库、链接与凭证命名文件；非 Git workspace 的根 README/AGENTS/CLAUDE 也可检索。

结果标注 current/historical、Git 版本和源内容哈希。归档/报告目录、阶段快照、带日期的验收/报告默认归历史，明确标记活跃的阶段文件保留在默认结果中；current 只表示未按这些规则归历史，不证明内容符合当前实现。needs-review 表示引用来源有变化的线索，unverified 表示没有自动确认语义；二者都不代表人工已经核对。默认不显示历史文档，--history 可纳入。无法从检索结果推断上线、业务完成或人工接受。

## 信息正本

| 信息 | 正本 | 其他文档怎么引用 |
|---|---|---|
| 仓库结构、技能清单、命令事实 | 代码、SKILL.md、scripts/studio-commands.json；[README](../README.md) 自动区展示 | 不手改生成区，不另维护一份列表 |
| 安装、整体用法 | [README](../README.md) 非生成部分 | 放入口链接，目录 README 仅补充本区规则 |
| 产品与交付物选路 | [product-map](product-map.md) | 不另维护一份完整产品列表 |
| 制作阶段、交接、流程裁剪 | [视频制作流程](../workflows/explainer-video.md) | skill 链接流程，工艺留在本 skill |
| 各技能工艺、模板接口 | 对应 skills 下的 SKILL.md 与代码 | 参数事实以实际解析器/模板为准，改接口同时改示例 |
| 共用资产与版式、组件 | [assets](../assets/README.md)、[版式库](../assets/patterns.md)、[组件目录](../assets/component-catalog.md) | 项目保留实际使用版本与来源 |
| 当前作品状态与后续动作 | 作品 README，规则见下节 | 根目录说明不维护动态的“全部完成”等结论 |
| 历史实施与验收证据 | 对应 Stage Spec、验收记录 | 保留当时版本和范围，不用历史 PASS 推断当前可用 |

引用入口、简短摘要可以重复；完整规则、动态状态与清单尽量只有一处维护。发现矛盾时核对实际文件/实现，修正正本与错误摘要，不用新增文档绕过矛盾。

## 作品状态记录

制作中以项目 README 为当前交接页；归档后转到作品根 README，recipe 内的 README 保留当时快照，不再维护第二份当前状态。阶段变更、失败阻塞或本次交付发生时更新即可，不要求每次执行命令都改文档。

| 信息 | 记录位置 | 能证明什么 |
|---|---|---|
| 当前阶段、下一步、阻塞项 | 制作中项目 README；归档后作品根 README | 当前交接信息，建议带核对日期 |
| 分镜人工接受 | storyboard.json 的 review；README 链接它 | 只代表该版分镜；已有工具识别 status 为 accepted |
| 样片/成片人工结论 | 同一 README 中的审阅记录 | 对象/版本或哈希、结论、日期、审阅来源与证据；没人看就写待审 |
| 步骤运行 | 项目 .studio | 临时执行状态与日志，studio status 只返回这些信息 |
| 技术质检 | media-qc 生成的报告 | 该文件的技术结果，交付时显式列入 deliverables.json |
| 发布 | README 中逐平台记录 | 填表/待核对/已发布/未知及结果链接；脚本日志不代替实际发布证据 |
| 归档完整性 | archive.json 与实际校验/恢复记录 | 文件是否保全；不等于重渲染或人工接受 |

最小交接页可以只有几行，不要求固定字段全集：

```markdown
# 作品名称
最近核对：YYYY-MM-DD
当前阶段：样片待审
下一步：检查代表镜头的字幕阅读与节奏
阻塞/待人工：尚无样片人工审阅结论
证据：链接 storyboard.json、当前样片和技术报告

## 审阅与发布
按实际对象记录人工结论；各平台没有结果证据就保留待发布/未知。
```

已有状态文件或项目说明能表达这些信息时直接复用，不迁移历史作品来凑格式。人工结论要能追溯到当时对象；改稿后按影响更新，不能沿用已经失效的接受结论。

### 归档后的持续记录

- 产品目录下 recipe、media、deliverables 及 archive.json 中列出的文件保留快照。新制作版本使用新归档 id。
- 作品根 README 是持续维护的入口；`operations/` 可保存后续发布记录、metrics.json、脱敏原始统计来源与 review 输出，独立于制作快照。
- 需要复盘时，在 operations 内准备 metrics.json，将 source.path 写成相对此目录的已有来源文件；运行 `node scripts/studio.mjs review --project products/<作品id>/operations`。此命令只生成复盘报告，不负责创建数据或记录实际发布。
- operations 中的 Markdown、JSON 和 CSV 可入 Git；截图/媒体另做备份，来源记录其可取回位置与哈希。脚本需要读取的本地来源仍须存在，不用远程位置描述冒充已有原始数据。
- 只保留必要且脱敏的统计内容，不提交登录态、凭证或未经处理的后台导出。operations 不受制作 archive.json 覆盖，需要独立备份。

## 按变化维护，不逐项填表

maintain/impact 根据 Git diff、路径、目录和命令引用给出候选文件与行号。当前 Agent 阅读相关实现并修订现有说明；候选同时被修改也不能自动当成内容正确。unmapped 中涉及对外行为的改动仍需判断文档影响，路径引用无法覆盖所有语义关联。

提交前除自动入口外保留 `python scripts/check-docs.py` 的项目专用检查与 `git diff --check`；涉及行为另外执行相称验证。确定检查不能判断文字承诺是否真实、人工是否看过成片或外部平台是否改版。

无需仅因时间过去而更新日期或重写历史验收。再次使用旧流程/模板时核对入口、关键命令和当前限制；交付报告说明检查范围与未更新原因，避免靠“所有文档已同步”一句话代替核对。
