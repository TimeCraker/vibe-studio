# ddd-paper — 领域驱动设计 (DDD) 实战技术论文与演讲底稿

**论文题目**：《从理论到代码：基于小象培训管理系统的领域驱动设计 (DDD) 实战精要》  
**目标定位**：40 分钟中高级技术演讲 / 团队内部架构研讨底稿（理论 30% + 实战 70%）  
**总字数**：约 13,350 字（中文字 11,100 + 英文单词/代码标识符 2,250，总长 1,085 行）  
**实证代码基线**：`D:\xiaoxiang-training-management`（小象培训班管理系统）

---

## 交付文件清单

| 文件 | 说明 |
|---|---|
| [`DDD-Practical-Architecture-Paper.md`](DDD-Practical-Architecture-Paper.md) | 完整论文正文（含 7 大章节、5 处核心代码实证、Mermaid 架构/时序/象限图） |
| `README.md` | 本说明文件，包含章节速览、演讲时间分配建议及代码映射索引 |

---

## 演讲时间分配建议（40 分钟控场指引）

| 章节 | 核心话题 | 建议用时 | 重点表达心智 |
|---|---|:---:|---|
| **第一章** | 业务全景与复杂度破局 | 5 分钟 | 从“报名→缴费→分班→排课→消课”通俗引入，点破传统 CRUD 贫血泥球的痛点，强调选择性 DDD |
| **第二章** | 战略设计：统一语言到限界上下文 | 7 分钟 | 讲清统一语言与代码映射，拆解 5 个 BC 与同一个“学生”的不同投影，展示 Context Map 与防腐层 |
| **第三章** | 战术设计元模型与充血实践 | 10 分钟 | 核心重头戏：结合 `Money` 讲透值对象，结合 `Order` 聚合根讲透不变性守恒（分摊冻结）与状态机门禁 |
| **第四章** | 六边形分层与依赖倒置落地 | 6 分钟 | 剖析 `domain/north/south/pl` 目录铁律，证明领域层零框架依赖与毫秒级纯内存单测收益，讲透 DIP |
| **第五章** | CQRS 与 Transactional Outbox | 6 分钟 | 警示严禁跨 BC 本地大事务，拆解 Transactional Outbox 同事务原子落盘与异步高可用分发机制 |
| **第六章** | 仓储防腐与 Mapper 隔离设计 | 4 分钟 | 说明 ORM 实体与充血聚合根的天然张力，演示 `OrderMapper` 双向转换与数据库解耦 |
| **第七章** | 总结与架构演进心智 | 2 分钟 | 明确 DDD 适用边界与权衡，分享给独立架构师的五条军规，升华金句收尾 |

---

## 关键代码实证索引映射

本论文引用的所有代码均真实存在于 `D:\xiaoxiang-training-management` 生产工程中：

- **值对象（不可变与自校验）**：`apps/server/src/domain-shared/values/money.ts`
- **充血聚合根（不变性与分摊守恒）**：`apps/server/src/bounded-contexts/billing/domain/order/order.aggregate.ts`
- **纯领域仓储端口 (Port)**：`apps/server/src/bounded-contexts/billing/domain/ports/order.repository.ts`
- **事务性发件箱 (Transactional Outbox)**：`apps/server/src/shared/kernel/outbox/outbox-writer.service.ts`
- **双向映射器 (Bi-directional Mapper)**：`apps/server/src/bounded-contexts/billing/south/mappers/order.mapper.ts`
