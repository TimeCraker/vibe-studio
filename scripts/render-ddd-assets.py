"""
render-ddd-assets.py
渲染 DDD 44 页 PPT 所需的 7 幅架构/时序导图与 10 幅高保真暖纸代码卡片
统一采用 TimeCraker 个人主站官方色系: Signal Coral #CC785C + 暖纸底 #FAF6F0 + 碳墨 #1C1917 + 丰富语义辅助色
"""

import os
from pathlib import Path
from playwright.sync_api import sync_playwright

DIAGRAMS_DIR = Path("products/ddd-architecture/assets/diagrams")
CODE_CARDS_DIR = Path("products/ddd-architecture/assets/code-cards")
DIAGRAMS_DIR.mkdir(parents=True, exist_ok=True)
CODE_CARDS_DIR.mkdir(parents=True, exist_ok=True)

# 基础样式注入: 暖纸风 + 优雅字体 + 柔和阴影 + 丰富语义色
BASE_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap');

:root {
  --coral: #CC785C;
  --coral-deep: #9C4F37;
  --coral-light: rgba(204, 120, 92, 0.12);
  --coral-border: rgba(204, 120, 92, 0.35);
  --cream: #FAF6F0;
  --paper: #FFFFFF;
  --ink: #1C1917;
  --ink-soft: #57534E;
  --muted: #78716C;
  --line: #E7E0D8;
  
  /* 丰富语义辅助色 */
  --emerald: #2E7D32;
  --emerald-bg: #E8F5E9;
  --emerald-border: #A5D6A7;
  
  --amber: #D97706;
  --amber-bg: #FEF3C7;
  --amber-border: #FCD34D;
  
  --blue: #2563EB;
  --blue-bg: #EFF6FF;
  --blue-border: #BFDBFE;
  
  --purple: #7C3AED;
  --purple-bg: #F3E8FF;
  --purple-border: #DDD6FE;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--cream);
  font-family: 'Inter', 'Noto Sans SC', -apple-system, sans-serif;
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}
"""

def render_html_to_image(page, html_content: str, output_path: Path, width: int = 1280, height: int = 760):
    full_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
{BASE_CSS}
</style>
</head>
<body style="width: {width}px; height: {height}px; display: flex; align-items: center; justify-content: center; padding: 24px;">
{html_content}
</body>
</html>"""
    page.set_viewport_size({"width": width, "height": height})
    page.set_content(full_html)
    page.wait_for_timeout(100)
    page.screenshot(path=str(output_path), full_page=True)
    print(f"Rendered: {output_path.name}")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge")
        page = browser.new_page()

        # ==========================================
        # 1. 渲染 7 幅高精架构图
        # ==========================================

        # 图 1: 全局心智演进路线图
        html_01 = """
        <div style="width: 100%; height: 100%; background: var(--paper); border: 1.5px solid var(--line); border-radius: 16px; padding: 36px 44px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 20px rgba(28,25,23,0.04);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid var(--line); padding-bottom: 16px;">
                <div>
                    <span style="font-size: 13px; font-weight: 700; color: var(--coral); letter-spacing: 0.08em; text-transform: uppercase;">Roadmap & Mental Model</span>
                    <h2 style="font-size: 22px; font-weight: 700; color: var(--ink); margin-top: 4px;">DDD 架构演进与全景落地路线图</h2>
                </div>
                <div style="font-size: 13px; color: var(--muted); background: var(--cream); padding: 6px 14px; border-radius: 20px; border: 1px solid var(--line);">从业务破局到代码实证</div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 14px; margin-top: 20px;">
                <!-- 阶段 1 -->
                <div style="background: var(--cream); border: 1.5px solid var(--coral-border); border-radius: 12px; padding: 18px 14px; display: flex; flex-direction: column;">
                    <div style="font-size: 12px; font-weight: 700; color: var(--coral); margin-bottom: 6px;">01 破局</div>
                    <div style="font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 8px;">业务闭环</div>
                    <div style="font-size: 12px; color: var(--ink-soft); line-height: 1.5;">报名→缴费→分班→排课→消课五步走</div>
                    <div style="margin-top: auto; padding-top: 10px; font-size: 11px; color: var(--coral-deep); font-weight: 600;">选择性 DDD</div>
                </div>

                <!-- 阶段 2 -->
                <div style="background: var(--purple-bg); border: 1.5px solid var(--purple-border); border-radius: 12px; padding: 18px 14px; display: flex; flex-direction: column;">
                    <div style="font-size: 12px; font-weight: 700; color: var(--purple); margin-bottom: 6px;">02 战略</div>
                    <div style="font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 8px;">统一语言</div>
                    <div style="font-size: 12px; color: var(--ink-soft); line-height: 1.5;">消除多义性，代码即活的 PRD 契约</div>
                    <div style="margin-top: auto; padding-top: 10px; font-size: 11px; color: var(--purple); font-weight: 600;">强类型枚举</div>
                </div>

                <!-- 阶段 3 -->
                <div style="background: var(--purple-bg); border: 1.5px solid var(--purple-border); border-radius: 12px; padding: 18px 14px; display: flex; flex-direction: column;">
                    <div style="font-size: 12px; font-weight: 700; color: var(--purple); margin-bottom: 6px;">03 划界</div>
                    <div style="font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 8px;">限界上下文</div>
                    <div style="font-size: 12px; color: var(--ink-soft); line-height: 1.5;">打破上帝大表，学生四重独立投影</div>
                    <div style="margin-top: auto; padding-top: 10px; font-size: 11px; color: var(--purple); font-weight: 600;">Context Map</div>
                </div>

                <!-- 阶段 4 -->
                <div style="background: var(--emerald-bg); border: 1.5px solid var(--emerald-border); border-radius: 12px; padding: 18px 14px; display: flex; flex-direction: column;">
                    <div style="font-size: 12px; font-weight: 700; color: var(--emerald); margin-bottom: 6px;">04 战术</div>
                    <div style="font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 8px;">值对象 & 实体</div>
                    <div style="font-size: 12px; color: var(--ink-soft); line-height: 1.5;">不可变性与自我校验，消灭浮点漏洞</div>
                    <div style="margin-top: auto; padding-top: 10px; font-size: 11px; color: var(--emerald); font-weight: 600;">Money / Quantity</div>
                </div>

                <!-- 阶段 5 -->
                <div style="background: var(--emerald-bg); border: 1.5px solid var(--emerald-border); border-radius: 12px; padding: 18px 14px; display: flex; flex-direction: column;">
                    <div style="font-size: 12px; font-weight: 700; color: var(--emerald); margin-bottom: 6px;">05 守门</div>
                    <div style="font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 8px;">充血聚合根</div>
                    <div style="font-size: 12px; color: var(--ink-soft); line-height: 1.5;">不变性边界，收入分摊末位兜底守恒</div>
                    <div style="margin-top: auto; padding-top: 10px; font-size: 11px; color: var(--emerald); font-weight: 600;">单事务单聚合</div>
                </div>

                <!-- 阶段 6 -->
                <div style="background: var(--blue-bg); border: 1.5px solid var(--blue-border); border-radius: 12px; padding: 18px 14px; display: flex; flex-direction: column;">
                    <div style="font-size: 12px; font-weight: 700; color: var(--blue); margin-bottom: 6px;">06 解耦</div>
                    <div style="font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 8px;">六边形分层</div>
                    <div style="font-size: 12px; color: var(--ink-soft); line-height: 1.5;">依赖倒置 (DIP)，领域层零框架依赖</div>
                    <div style="margin-top: auto; padding-top: 10px; font-size: 11px; color: var(--blue); font-weight: 600;">仓储 Port / Mapper</div>
                </div>

                <!-- 阶段 7 -->
                <div style="background: var(--amber-bg); border: 1.5px solid var(--amber-border); border-radius: 12px; padding: 18px 14px; display: flex; flex-direction: column;">
                    <div style="font-size: 12px; font-weight: 700; color: var(--amber); margin-bottom: 6px;">07 协同</div>
                    <div style="font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 8px;">CQRS & Outbox</div>
                    <div style="font-size: 12px; color: var(--ink-soft); line-height: 1.5;">读写分离，发件箱同事务原子落盘</div>
                    <div style="margin-top: auto; padding-top: 10px; font-size: 11px; color: var(--amber); font-weight: 600;">最终一致性</div>
                </div>
            </div>

            <div style="background: var(--cream); border-radius: 10px; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--line); margin-top: 18px;">
                <span style="font-size: 13px; font-weight: 600; color: var(--coral-deep);">💡 架构心智原则：</span>
                <span style="font-size: 13px; color: var(--ink-soft);">业务先于技术 · 统一语言先于代码 · 守住领域纯洁性 · 跨上下文走最终一致性</span>
            </div>
        </div>
        """
        render_html_to_image(page, html_01, DIAGRAMS_DIR / "01-global-roadmap.png", width=1180, height=560)

        # 图 2: 业务五步闭环时序图
        html_02 = """
        <div style="width: 100%; height: 100%; background: var(--paper); border: 1.5px solid var(--line); border-radius: 16px; padding: 32px 40px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 20px rgba(28,25,23,0.04);">
            <div style="border-bottom: 1.5px solid var(--line); padding-bottom: 14px;">
                <span style="font-size: 12px; font-weight: 700; color: var(--coral); letter-spacing: 0.08em; text-transform: uppercase;">Business Pipeline</span>
                <h2 style="font-size: 20px; font-weight: 700; color: var(--ink); margin-top: 2px;">培训机构运营五大阶段与上下文协同流水线</h2>
            </div>
            
            <div style="display: flex; justify-content: space-between; position: relative; margin: 30px 0;">
                <!-- 流程步骤卡片 1 -->
                <div style="width: 18%; background: var(--cream); border: 1.5px solid var(--coral-border); border-radius: 12px; padding: 16px; text-align: center;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--coral); color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-weight: 700; font-size: 14px;">1</div>
                    <div style="font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 6px;">报名申请</div>
                    <div style="font-size: 12px; color: var(--coral-deep); font-weight: 600; margin-bottom: 8px;">Enrollment BC</div>
                    <div style="font-size: 12px; color: var(--ink-soft); line-height: 1.4; text-align: left; background: white; padding: 8px; border-radius: 6px; border: 1px solid var(--line);">
                        • 家长/顾问代建<br>• 多 SKU 打包<br>• <strong>赠送试听课时</strong>
                    </div>
                </div>

                <div style="display: flex; align-items: center; color: var(--coral); font-size: 20px; font-weight: 700;">➔</div>

                <!-- 流程步骤卡片 2 -->
                <div style="width: 18%; background: var(--cream); border: 1.5px solid var(--amber-border); border-radius: 12px; padding: 16px; text-align: center;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--amber); color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-weight: 700; font-size: 14px;">2</div>
                    <div style="font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 6px;">缴费订单</div>
                    <div style="font-size: 12px; color: var(--amber); font-weight: 600; margin-bottom: 8px;">Billing BC</div>
                    <div style="font-size: 12px; color: var(--ink-soft); line-height: 1.4; text-align: left; background: white; padding: 8px; border-radius: 6px; border: 1px solid var(--line);">
                        • 全款 / 30%首付<br>• <strong>收入分摊冻结</strong><br>• 尾款 30 天到期
                    </div>
                </div>

                <div style="display: flex; align-items: center; color: var(--amber); font-size: 20px; font-weight: 700;">➔</div>

                <!-- 流程步骤卡片 3 -->
                <div style="width: 18%; background: var(--cream); border: 1.5px solid var(--purple-border); border-radius: 12px; padding: 16px; text-align: center;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--purple); color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-weight: 700; font-size: 14px;">3</div>
                    <div style="font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 6px;">自动分班</div>
                    <div style="font-size: 12px; color: var(--purple); font-weight: 600; margin-bottom: 8px;">Classes BC</div>
                    <div style="font-size: 12px; color: var(--ink-soft); line-height: 1.4; text-align: left; background: white; padding: 8px; border-radius: 6px; border: 1px solid var(--line);">
                        • 成绩分段分组<br>• 班级容量上限<br>• <strong>在班唯一性</strong>
                    </div>
                </div>

                <div style="display: flex; align-items: center; color: var(--purple); font-size: 20px; font-weight: 700;">➔</div>

                <!-- 流程步骤卡片 4 -->
                <div style="width: 18%; background: var(--cream); border: 1.5px solid var(--blue-border); border-radius: 12px; padding: 16px; text-align: center;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--blue); color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-weight: 700; font-size: 14px;">4</div>
                    <div style="font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 6px;">周期排课</div>
                    <div style="font-size: 12px; color: var(--blue); font-weight: 600; margin-bottom: 8px;">Scheduling BC</div>
                    <div style="font-size: 12px; color: var(--ink-soft); line-height: 1.4; text-align: left; background: white; padding: 8px; border-radius: 6px; border: 1px solid var(--line);">
                        • 规则展开为课次<br>• <strong>教室/教师硬冲突</strong><br>• 异常微调重校验
                    </div>
                </div>

                <div style="display: flex; align-items: center; color: var(--blue); font-size: 20px; font-weight: 700;">➔</div>

                <!-- 流程步骤卡片 5 -->
                <div style="width: 18%; background: var(--cream); border: 1.5px solid var(--emerald-border); border-radius: 12px; padding: 16px; text-align: center;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--emerald); color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-weight: 700; font-size: 14px;">5</div>
                    <div style="font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 6px;">消课与审计</div>
                    <div style="font-size: 12px; color: var(--emerald); font-weight: 600; margin-bottom: 8px;">Entitlement BC</div>
                    <div style="font-size: 12px; color: var(--ink-soft); line-height: 1.4; text-align: left; background: white; padding: 8px; border-radius: 6px; border: 1px solid var(--line);">
                        • 批量扣减课时<br>• <strong>不可变复式账本</strong><br>• 试课用尽自动退班
                    </div>
                </div>
            </div>

            <div style="background: var(--coral-light); border-left: 4px solid var(--coral); padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: var(--ink);">
                <strong>核心协同特征：</strong> 各阶段依靠领域集成事件异步串联，严禁在单个本地事务中直接跨库修改其他阶段的数据表。
            </div>
        </div>
        """
        render_html_to_image(page, html_02, DIAGRAMS_DIR / "02-business-flow.png", width=1180, height=560)

        # 图 3: 学生模型四重解构
        html_03 = """
        <div style="width: 100%; height: 100%; background: var(--paper); border: 1.5px solid var(--line); border-radius: 16px; padding: 32px 40px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 20px rgba(28,25,23,0.04);">
            <div style="border-bottom: 1.5px solid var(--line); padding-bottom: 14px;">
                <span style="font-size: 12px; font-weight: 700; color: var(--purple); letter-spacing: 0.08em; text-transform: uppercase;">Bounded Context Model Projection</span>
                <h2 style="font-size: 20px; font-weight: 700; color: var(--ink); margin-top: 2px;">同一个现实实体“学生”在 4 个限界上下文的独立投影</h2>
            </div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0;">
                <!-- 报名上下文 -->
                <div style="background: var(--cream); border: 1.5px solid var(--coral-border); border-radius: 12px; overflow: hidden;">
                    <div style="background: var(--coral); color: white; padding: 10px 14px; font-size: 14px; font-weight: 700;">
                        报名上下文 (Enrollment)
                    </div>
                    <div style="padding: 14px; font-size: 13px; line-height: 1.8; color: var(--ink);">
                        <div style="font-weight: 700; color: var(--coral-deep); margin-bottom: 6px;">定位：销售线索与转化</div>
                        <div>• <code>studentName</code>: string</div>
                        <div>• <code>guardianPhone</code>: PhoneNumber</div>
                        <div>• <code>leadSource</code>: string</div>
                        <div>• <code>salesConsultantId</code>: string</div>
                        <div>• <code>intendedGrade</code>: string</div>
                    </div>
                </div>

                <!-- 计费上下文 -->
                <div style="background: var(--cream); border: 1.5px solid var(--amber-border); border-radius: 12px; overflow: hidden;">
                    <div style="background: var(--amber); color: white; padding: 10px 14px; font-size: 14px; font-weight: 700;">
                        计费上下文 (Billing)
                    </div>
                    <div style="padding: 14px; font-size: 13px; line-height: 1.8; color: var(--ink);">
                        <div style="font-weight: 700; color: var(--amber); margin-bottom: 6px;">定位：付款人与应收账款</div>
                        <div>• <code>studentId</code>: StudentId</div>
                        <div>• <code>campusId</code>: CampusId</div>
                        <div>• <code>paymentQrCode</code>: string</div>
                        <div>• <code>balanceDue</code>: Money</div>
                        <div>• <code>finalDueAt</code>: UtcInstant</div>
                    </div>
                </div>

                <!-- 班级上下文 -->
                <div style="background: var(--cream); border: 1.5px solid var(--purple-border); border-radius: 12px; overflow: hidden;">
                    <div style="background: var(--purple); color: white; padding: 10px 14px; font-size: 14px; font-weight: 700;">
                        班级上下文 (Classes)
                    </div>
                    <div style="padding: 14px; font-size: 13px; line-height: 1.8; color: var(--ink);">
                        <div style="font-weight: 700; color: var(--purple); margin-bottom: 6px;">定位：班级教学学员</div>
                        <div>• <code>studentId</code>: StudentId</div>
                        <div>• <code>classId</code>: ClassId</div>
                        <div>• <code>placementScore</code>: number</div>
                        <div>• <code>enrolledAt</code>: Date</div>
                        <div>• <code>status</code>: ACTIVE / LEFT</div>
                    </div>
                </div>

                <!-- 课时上下文 -->
                <div style="background: var(--cream); border: 1.5px solid var(--emerald-border); border-radius: 12px; overflow: hidden;">
                    <div style="background: var(--emerald); color: white; padding: 10px 14px; font-size: 14px; font-weight: 700;">
                        课时上下文 (Entitlement)
                    </div>
                    <div style="padding: 14px; font-size: 13px; line-height: 1.8; color: var(--ink);">
                        <div style="font-weight: 700; color: var(--emerald); margin-bottom: 6px;">定位：资产账本主体</div>
                        <div>• <code>studentId</code>: StudentId</div>
                        <div>• <code>skuId</code>: CourseSkuId</div>
                        <div>• <code>available</code>: LessonQuantity</div>
                        <div>• <code>frozen</code>: LessonQuantity</div>
                        <div>• <code>ledger</code>: LedgerEntry[]</div>
                    </div>
                </div>
            </div>

            <div style="background: var(--paper); border: 1.5px dashed var(--coral); border-radius: 8px; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 13px; font-weight: 700; color: var(--coral);">🌟 架构隔离收益：</span>
                <span style="font-size: 13px; color: var(--ink-soft);">各上下文表结构完全独立，唯一纽带为强类型标识符 <code>StudentId</code>。顾问改线索渠道绝不影响财务尾款与在班名单！</span>
            </div>
        </div>
        """
        render_html_to_image(page, html_03, DIAGRAMS_DIR / "03-student-projection.png", width=1180, height=560)

        # 图 4: 上下文映射与防腐层
        html_04 = """
        <div style="width: 100%; height: 100%; background: var(--paper); border: 1.5px solid var(--line); border-radius: 16px; padding: 32px 40px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 20px rgba(28,25,23,0.04);">
            <div style="border-bottom: 1.5px solid var(--line); padding-bottom: 14px;">
                <span style="font-size: 12px; font-weight: 700; color: var(--coral); letter-spacing: 0.08em; text-transform: uppercase;">Context Map Architecture</span>
                <h2 style="font-size: 20px; font-weight: 700; color: var(--ink); margin-top: 2px;">5 大核心上下文协同拓扑与外部系统防腐隔离 (ACL)</h2>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: stretch; margin: 20px 0; gap: 20px; height: 340px;">
                <!-- 左侧: 外部系统与防腐层 -->
                <div style="width: 28%; background: var(--blue-bg); border: 1.5px solid var(--blue-border); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="font-size: 14px; font-weight: 700; color: var(--blue); margin-bottom: 8px;">外部平台 (Generic / External)</div>
                        <div style="background: white; border: 1px solid var(--blue-border); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                            <div style="font-weight: 700; font-size: 13px; color: var(--ink);">微信支付 API</div>
                            <div style="font-size: 11px; color: var(--muted); margin-top: 4px;">字段: sp_openid, sub_mch_id, payer_total</div>
                        </div>
                        <div style="background: white; border: 1px solid var(--blue-border); border-radius: 8px; padding: 12px;">
                            <div style="font-weight: 700; font-size: 13px; color: var(--ink);">腾讯云短信 / 企微</div>
                            <div style="font-size: 11px; color: var(--muted); margin-top: 4px;">模板消息通道与频控</div>
                        </div>
                    </div>
                    <div style="background: var(--blue); color: white; border-radius: 8px; padding: 10px; text-align: center; font-size: 12px; font-weight: 700;">
                        🛡️ 防腐层 (ACL Adapter)<br><span style="font-size: 11px; opacity: 0.9;">拦截外部脏数据，翻译为内部值对象</span>
                    </div>
                </div>

                <!-- 中间: 核心领域上下文集群 -->
                <div style="width: 44%; background: var(--cream); border: 1.5px solid var(--coral-border); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="font-size: 14px; font-weight: 700; color: var(--coral-deep); margin-bottom: 12px; display: flex; justify-content: space-between;">
                        <span>核心域 (Core Bounded Contexts)</span>
                        <span style="font-size: 11px; background: var(--coral-light); color: var(--coral-deep); padding: 2px 8px; border-radius: 10px;">DDD 六边形</span>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div style="background: white; border: 1px solid var(--line); border-radius: 8px; padding: 10px;">
                            <div style="font-weight: 700; font-size: 13px; color: var(--coral);">Enrollment (报名)</div>
                            <div style="font-size: 11px; color: var(--ink-soft); margin-top: 2px;">聚合根: Submission</div>
                        </div>
                        <div style="background: white; border: 1px solid var(--line); border-radius: 8px; padding: 10px;">
                            <div style="font-weight: 700; font-size: 13px; color: var(--amber);">Billing (计费)</div>
                            <div style="font-size: 11px; color: var(--ink-soft); margin-top: 2px;">聚合根: Order / Payment</div>
                        </div>
                        <div style="background: white; border: 1px solid var(--line); border-radius: 8px; padding: 10px;">
                            <div style="font-weight: 700; font-size: 13px; color: var(--purple);">Classes (班级)</div>
                            <div style="font-size: 11px; color: var(--ink-soft); margin-top: 2px;">聚合根: ClassGroup</div>
                        </div>
                        <div style="background: white; border: 1px solid var(--line); border-radius: 8px; padding: 10px;">
                            <div style="font-weight: 700; font-size: 13px; color: var(--blue);">Scheduling (排课)</div>
                            <div style="font-size: 11px; color: var(--ink-soft); margin-top: 2px;">聚合根: Schedule / Session</div>
                        </div>
                    </div>

                    <div style="background: white; border: 1.5px solid var(--emerald-border); border-radius: 8px; padding: 10px; margin-top: 10px;">
                        <div style="font-weight: 700; font-size: 13px; color: var(--emerald);">Entitlement (课时权益与账本)</div>
                        <div style="font-size: 11px; color: var(--ink-soft); margin-top: 2px;">聚合根: EntitlementAccount / DeductionBatch</div>
                    </div>

                    <div style="font-size: 11px; color: var(--muted); text-align: center; margin-top: 6px;">
                        模块间通过 <strong>Transactional Outbox 集成事件</strong> 最终一致解耦
                    </div>
                </div>

                <!-- 右侧: 支撑域与只读模型 -->
                <div style="width: 28%; background: var(--purple-bg); border: 1.5px solid var(--purple-border); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="font-size: 14px; font-weight: 700; color: var(--purple); margin-bottom: 8px;">支撑域 (Supporting CRUD)</div>
                        <div style="background: white; border: 1px solid var(--purple-border); border-radius: 8px; padding: 10px; margin-bottom: 8px;">
                            <div style="font-weight: 700; font-size: 12px; color: var(--ink);">产品目录 (Product Catalog)</div>
                            <div style="font-size: 11px; color: var(--muted);">课程 SKU / 打包商品上架</div>
                        </div>
                        <div style="background: white; border: 1px solid var(--purple-border); border-radius: 8px; padding: 10px; margin-bottom: 8px;">
                            <div style="font-weight: 700; font-size: 12px; color: var(--ink);">学生档案 (Student Registry)</div>
                            <div style="font-size: 11px; color: var(--muted);">11位全局学号 (PG advisory lock)</div>
                        </div>
                    </div>
                    <div style="background: white; border: 1px solid var(--amber-border); border-radius: 8px; padding: 10px;">
                        <div style="font-weight: 700; font-size: 12px; color: var(--amber);">CQRS 只读大盘 (Operations API)</div>
                        <div style="font-size: 11px; color: var(--muted);">绕过聚合根，SQL 宽表直查 (10ms)</div>
                    </div>
                </div>
            </div>

            <div style="font-size: 12px; color: var(--muted); display: flex; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 10px;">
                <span>• 核心域 (DDD六边形严格保护)</span>
                <span>• 支撑域 (经典三层高效开发)</span>
                <span>• 防腐层 (隔离外部微信细节)</span>
                <span>• 读写分离 (报表走快速直查通道)</span>
            </div>
        </div>
        """
        render_html_to_image(page, html_04, DIAGRAMS_DIR / "04-context-map.png", width=1180, height=560)

        # 图 5: 六边形架构分层与依赖倒置
        html_05 = """
        <div style="width: 100%; height: 100%; background: var(--paper); border: 1.5px solid var(--line); border-radius: 16px; padding: 32px 40px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 20px rgba(28,25,23,0.04);">
            <div style="border-bottom: 1.5px solid var(--line); padding-bottom: 14px;">
                <span style="font-size: 12px; font-weight: 700; color: var(--blue); letter-spacing: 0.08em; text-transform: uppercase;">Hexagonal & Onion Architecture</span>
                <h2 style="font-size: 20px; font-weight: 700; color: var(--ink); margin-top: 2px;">四层目录铁律与依赖倒置 (DIP) 真实工程投影</h2>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: stretch; margin: 24px 0; gap: 16px;">
                <!-- 驱动侧 -->
                <div style="width: 22%; background: var(--cream); border: 1.5px solid var(--line); border-radius: 12px; padding: 16px;">
                    <div style="font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; margin-bottom: 8px;">1. 外部驱动适配器</div>
                    <div style="background: white; border: 1px solid var(--line); border-radius: 8px; padding: 10px; margin-bottom: 8px;">
                        <div style="font-weight: 700; font-size: 13px;">HTTP Controller</div>
                        <div style="font-size: 11px; color: var(--muted);">Express / NestJS 控制器</div>
                    </div>
                    <div style="background: white; border: 1px solid var(--line); border-radius: 8px; padding: 10px; margin-bottom: 8px;">
                        <div style="font-weight: 700; font-size: 13px;">Worker / Cron</div>
                        <div style="font-size: 11px; color: var(--muted);">BullMQ 队列与定时任务</div>
                    </div>
                    <div style="background: white; border: 1px solid var(--line); border-radius: 8px; padding: 10px;">
                        <div style="font-weight: 700; font-size: 13px;">MQ Consumer</div>
                        <div style="font-size: 11px; color: var(--muted);">跨 BC 事件监听器</div>
                    </div>
                </div>

                <!-- 北向应用层 -->
                <div style="width: 22%; background: var(--blue-bg); border: 1.5px solid var(--blue-border); border-radius: 12px; padding: 16px;">
                    <div style="font-size: 12px; font-weight: 700; color: var(--blue); text-transform: uppercase; margin-bottom: 8px;">2. 北向应用层 (north)</div>
                    <div style="background: white; border: 1px solid var(--blue-border); border-radius: 8px; padding: 12px; margin-bottom: 10px;">
                        <div style="font-weight: 700; font-size: 13px; color: var(--blue);">Command Handlers</div>
                        <div style="font-size: 11px; color: var(--ink-soft); margin-top: 4px;">• 开启本地事务<br>• 加载聚合根<br>• 推进充血行为<br>• 仓储持久化</div>
                    </div>
                    <div style="background: white; border: 1px solid var(--blue-border); border-radius: 8px; padding: 12px;">
                        <div style="font-weight: 700; font-size: 13px; color: var(--blue);">Query Handlers</div>
                        <div style="font-size: 11px; color: var(--ink-soft); margin-top: 4px;">• 只读高效组装 DTO</div>
                    </div>
                </div>

                <!-- 领域内核层 (中心) -->
                <div style="width: 32%; background: var(--coral-light); border: 2px solid var(--coral); border-radius: 12px; padding: 18px; box-shadow: 0 4px 14px rgba(204,120,92,0.15);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="font-size: 12px; font-weight: 700; color: var(--coral-deep); text-transform: uppercase;">3. 领域内核 (domain)</div>
                        <span style="font-size: 10px; background: var(--coral); color: white; padding: 2px 6px; border-radius: 4px; font-weight: 700;">绝对纯洁</span>
                    </div>
                    <div style="background: white; border: 1px solid var(--coral-border); border-radius: 8px; padding: 10px; margin-bottom: 8px;">
                        <div style="font-weight: 700; font-size: 13px; color: var(--ink);">充血聚合根 (Aggregate Root)</div>
                        <div style="font-size: 11px; color: var(--ink-soft);">Order, EntitlementAccount</div>
                    </div>
                    <div style="background: white; border: 1px solid var(--coral-border); border-radius: 8px; padding: 10px; margin-bottom: 8px;">
                        <div style="font-weight: 700; font-size: 13px; color: var(--ink);">不可变值对象 (Value Object)</div>
                        <div style="font-size: 11px; color: var(--ink-soft);">Money, LessonQuantity, TimeRange</div>
                    </div>
                    <div style="background: white; border: 1.5px dashed var(--coral); border-radius: 8px; padding: 10px;">
                        <div style="font-weight: 700; font-size: 13px; color: var(--coral-deep);">仓储端口 (Repository Port)</div>
                        <div style="font-size: 11px; color: var(--coral-deep); font-weight: 600;">OrderRepositoryPort 纯接口 (DIP核心)</div>
                    </div>
                </div>

                <!-- 南向基础设施层 -->
                <div style="width: 24%; background: var(--emerald-bg); border: 1.5px solid var(--emerald-border); border-radius: 12px; padding: 16px;">
                    <div style="font-size: 12px; font-weight: 700; color: var(--emerald); text-transform: uppercase; margin-bottom: 8px;">4. 南向基础设施 (south)</div>
                    <div style="background: white; border: 1px solid var(--emerald-border); border-radius: 8px; padding: 10px; margin-bottom: 8px;">
                        <div style="font-weight: 700; font-size: 13px; color: var(--emerald);">Repository 适配器</div>
                        <div style="font-size: 11px; color: var(--ink-soft);">反向实现领域 Port 接口</div>
                    </div>
                    <div style="background: white; border: 1px solid var(--emerald-border); border-radius: 8px; padding: 10px; margin-bottom: 8px;">
                        <div style="font-weight: 700; font-size: 13px; color: var(--emerald);">双向 Mapper 映射器</div>
                        <div style="font-size: 11px; color: var(--ink-soft);">toDomain / toPersistence</div>
                    </div>
                    <div style="background: white; border: 1px solid var(--emerald-border); border-radius: 8px; padding: 10px;">
                        <div style="font-weight: 700; font-size: 13px; color: var(--ink);">MikroORM / PostgreSQL</div>
                        <div style="font-size: 11px; color: var(--muted);">扁平关系表存储细节</div>
                    </div>
                </div>
            </div>

            <div style="background: var(--cream); border: 1px solid var(--line); border-radius: 8px; padding: 10px 16px; font-size: 12px; color: var(--ink-soft); display: flex; justify-content: space-between;">
                <span><strong>依赖倒置关键：</strong> 领域层只声明需求接口 (Port)，基础设施反向依赖领域层实现该接口。</span>
                <span style="color: var(--coral-deep); font-weight: 600;">⚡ 单测无需启动 NestJS / DB，毫秒级纯内存运行！</span>
            </div>
        </div>
        """
        render_html_to_image(page, html_05, DIAGRAMS_DIR / "05-hexagonal-layers.png", width=1180, height=560)

        # 图 6: Transactional Outbox 事务时序图
        html_06 = """
        <div style="width: 100%; height: 100%; background: var(--paper); border: 1.5px solid var(--line); border-radius: 16px; padding: 32px 40px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 20px rgba(28,25,23,0.04);">
            <div style="border-bottom: 1.5px solid var(--line); padding-bottom: 14px;">
                <span style="font-size: 12px; font-weight: 700; color: var(--amber); letter-spacing: 0.08em; text-transform: uppercase;">Transactional Outbox Pattern</span>
                <h2 style="font-size: 20px; font-weight: 700; color: var(--ink); margin-top: 2px;">事务性发件箱：本地原子双写与异步可靠分发时序全景</h2>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: stretch; margin: 20px 0; gap: 16px;">
                <!-- 步骤 1: 原子本地事务 -->
                <div style="flex: 1; background: var(--amber-bg); border: 1.5px solid var(--amber-border); border-radius: 12px; padding: 18px; display: flex; flex-direction: column;">
                    <div style="font-size: 13px; font-weight: 700; color: var(--amber); margin-bottom: 8px;">阶段一：本地单事务原子双写</div>
                    <div style="font-size: 12px; color: var(--ink-soft); margin-bottom: 12px;">在同一个数据库连接 (BEGIN ... COMMIT) 内完成两件事：</div>
                    
                    <div style="background: white; border: 1px solid var(--amber-border); border-radius: 8px; padding: 10px; margin-bottom: 8px;">
                        <div style="font-weight: 700; font-size: 12px; color: var(--ink);">1. 更新业务聚合根状态</div>
                        <code style="font-size: 11px; color: var(--coral-deep); font-family: monospace;">UPDATE orders SET status='PAID'</code>
                    </div>

                    <div style="background: white; border: 1px solid var(--amber-border); border-radius: 8px; padding: 10px; margin-bottom: 12px;">
                        <div style="font-weight: 700; font-size: 12px; color: var(--ink);">2. 发件箱写入待发事件信封</div>
                        <code style="font-size: 11px; color: var(--coral-deep); font-family: monospace;">INSERT INTO outbox_events (event_id, payload, 'PENDING')</code>
                    </div>

                    <div style="margin-top: auto; background: var(--amber); color: white; padding: 8px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; text-align: center;">
                        🔒 原子性保障：同生共死，绝无“订单已改但事件丢失”
                    </div>
                </div>

                <div style="display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--amber); font-weight: 700;">➔</div>

                <!-- 步骤 2: 异步 Worker 扫描与投递 -->
                <div style="flex: 1; background: var(--cream); border: 1.5px solid var(--coral-border); border-radius: 12px; padding: 18px; display: flex; flex-direction: column;">
                    <div style="font-size: 13px; font-weight: 700; color: var(--coral); margin-bottom: 8px;">阶段二：独立 Worker 异步可靠拉取</div>
                    <div style="font-size: 12px; color: var(--ink-soft); margin-bottom: 12px;">独立 Worker 进程并发安全扫描：</div>

                    <div style="background: white; border: 1px solid var(--line); border-radius: 8px; padding: 10px; margin-bottom: 8px;">
                        <div style="font-weight: 700; font-size: 12px; color: var(--ink);">3. 高并发无锁轻量扫描</div>
                        <code style="font-size: 10.5px; color: var(--ink-soft); font-family: monospace;">SELECT ... FOR UPDATE SKIP LOCKED</code>
                    </div>

                    <div style="background: white; border: 1px solid var(--line); border-radius: 8px; padding: 10px; margin-bottom: 12px;">
                        <div style="font-weight: 700; font-size: 12px; color: var(--ink);">4. 投递到消息总线 / Redis / MQ</div>
                        <div style="font-size: 11px; color: var(--muted);">携带 OTel traceparent 链路追踪上下文</div>
                    </div>

                    <div style="margin-top: auto; background: var(--coral); color: white; padding: 8px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; text-align: center;">
                        🚀 高可用容错：下游挂机数小时，事件依然静默重试
                    </div>
                </div>

                <div style="display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--emerald); font-weight: 700;">➔</div>

                <!-- 步骤 3: 下游幂等开通 -->
                <div style="flex: 1; background: var(--emerald-bg); border: 1.5px solid var(--emerald-border); border-radius: 12px; padding: 18px; display: flex; flex-direction: column;">
                    <div style="font-size: 13px; font-weight: 700; color: var(--emerald); margin-bottom: 8px;">阶段三：下游课时独立事务消费</div>
                    <div style="font-size: 12px; color: var(--ink-soft); margin-bottom: 12px;">课时上下文监听并幂等推进：</div>

                    <div style="background: white; border: 1px solid var(--emerald-border); border-radius: 8px; padding: 10px; margin-bottom: 8px;">
                        <div style="font-weight: 700; font-size: 12px; color: var(--ink);">5. 幂等校验与开辟独立事务</div>
                        <div style="font-size: 11px; color: var(--muted);">按 event_id 防重消费，避免重复开课</div>
                    </div>

                    <div style="background: white; border: 1px solid var(--emerald-border); border-radius: 8px; padding: 10px; margin-bottom: 12px;">
                        <div style="font-weight: 700; font-size: 12px; color: var(--ink);">6. 记入课时复式账户</div>
                        <div style="font-size: 11px; color: var(--muted);">可用课时增加，追加不可变流水</div>
                    </div>

                    <div style="margin-top: auto; background: var(--emerald); color: white; padding: 8px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; text-align: center;">
                        🎯 最终一致性达成：两边系统完全解耦
                    </div>
                </div>
            </div>

            <div style="font-size: 12px; background: var(--paper); border: 1px solid var(--line); border-radius: 8px; padding: 10px 16px; color: var(--ink-soft);">
                <strong>避坑红线：</strong> 严禁在一个事务里同时写订单表和课时表！一旦跨网络调用卡顿或下游异常，整个系统将陷入高并发死锁。
            </div>
        </div>
        """
        render_html_to_image(page, html_06, DIAGRAMS_DIR / "06-outbox-sequence.png", width=1180, height=560)

        # 图 7: 系统复杂度与架构选型四象限图
        html_07 = """
        <div style="width: 100%; height: 100%; background: var(--paper); border: 1.5px solid var(--line); border-radius: 16px; padding: 32px 40px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 20px rgba(28,25,23,0.04);">
            <div style="border-bottom: 1.5px solid var(--line); padding-bottom: 14px;">
                <span style="font-size: 12px; font-weight: 700; color: var(--coral); letter-spacing: 0.08em; text-transform: uppercase;">Architecture Strategy Matrix</span>
                <h2 style="font-size: 20px; font-weight: 700; color: var(--ink); margin-top: 2px;">业务复杂度 vs 架构模式选型四象限</h2>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 16px; margin: 20px 0; height: 350px;">
                <!-- 象限 2 (左上) -->
                <div style="background: var(--blue-bg); border: 1.5px solid var(--blue-border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-size: 12px; font-weight: 700; color: var(--blue);">第二象限：高技术性能 / 低业务逻辑</span>
                        <span style="font-size: 11px; background: white; padding: 2px 6px; border-radius: 4px; color: var(--blue);">专用通道</span>
                    </div>
                    <div style="font-weight: 700; font-size: 14px; margin: 8px 0 4px; color: var(--ink);">专项技术优化模式 (Reactive / Direct)</div>
                    <div style="font-size: 12px; color: var(--ink-soft); line-height: 1.5;">
                        • 典型场景：实时通知网关、日志埋点上报、大文件异步下载<br>
                        • 策略：不建复杂聚合，采用轻量反应式框架或只读直连
                    </div>
                </div>

                <!-- 象限 1 (右上) -->
                <div style="background: var(--coral-light); border: 2px solid var(--coral); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; box-shadow: 0 4px 12px rgba(204,120,92,0.12);">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-size: 12px; font-weight: 700; color: var(--coral-deep);">第一象限：高业务复杂度 / 高资产风险</span>
                        <span style="font-size: 11px; background: var(--coral); color: white; padding: 2px 6px; border-radius: 4px; font-weight: 700;">DDD 核心阵地</span>
                    </div>
                    <div style="font-weight: 700; font-size: 14px; margin: 8px 0 4px; color: var(--ink);">严格 DDD 六边形 + 充血聚合 + 最终一致性</div>
                    <div style="font-size: 12px; color: var(--ink); line-height: 1.5;">
                        • <strong>实战落地：小象计费订单、资金对账、周期排课冲突、复式课时账本</strong><br>
                        • 收益：严格守护业务不变性，杜绝资金差错，代码高内聚可审计
                    </div>
                </div>

                <!-- 象限 3 (左下) -->
                <div style="background: var(--cream); border: 1.5px solid var(--line); border-radius: 12px; padding: 16px; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-size: 12px; font-weight: 700; color: var(--muted);">第三象限：低业务复杂度 / 低技术要求</span>
                        <span style="font-size: 11px; background: white; padding: 2px 6px; border-radius: 4px; color: var(--muted);">轻量快车道</span>
                    </div>
                    <div style="font-weight: 700; font-size: 14px; margin: 8px 0 4px; color: var(--ink);">传统三层 CRUD (Controller → Service → DB)</div>
                    <div style="font-size: 12px; color: var(--ink-soft); line-height: 1.5;">
                        • <strong>实战落地：校区字典维护、系统公共参数配置、临时营销单页</strong><br>
                        • 策略：坚决拒绝 DDD 形式主义，增删改查怎么快怎么来
                    </div>
                </div>

                <!-- 象限 4 (右下) -->
                <div style="background: var(--purple-bg); border: 1.5px solid var(--purple-border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-size: 12px; font-weight: 700; color: var(--purple);">第四象限：高业务逻辑 / 低性能负载</span>
                        <span style="font-size: 11px; background: white; padding: 2px 6px; border-radius: 4px; color: var(--purple);">轻量领域</span>
                    </div>
                    <div style="font-weight: 700; font-size: 14px; margin: 8px 0 4px; color: var(--ink);">模块化三层 + 轻量值对象校验</div>
                    <div style="font-size: 12px; color: var(--ink-soft); line-height: 1.5;">
                        • <strong>实战落地：学生基础主档档案、课程目录商品包装</strong><br>
                        • 策略：引入基础值对象校验参数合法性，但不拆分复杂聚合
                    </div>
                </div>
            </div>

            <div style="background: var(--cream); border-radius: 8px; padding: 10px 16px; font-size: 12px; color: var(--coral-deep); font-weight: 600; text-align: center;">
                架构师警训：DDD 不是银弹！分清核心域与支撑域，把 80% 的工程精力投入到产生 80% 商业价值的核心象限。
            </div>
        </div>
        """
        render_html_to_image(page, html_07, DIAGRAMS_DIR / "07-complexity-quadrant.png", width=1180, height=560)


        # ==========================================
        # 2. 渲染 10 幅暖纸 IDE 语法高亮代码切片卡片
        # ==========================================

        def render_code_card(filename: str, title: str, code_lines: list, highlights: list = []):
            """
            渲染暖纸风格的 IDE 代码卡片
            code_lines: [(line_no, line_html), ...]
            highlights: [line_no, ...]
            """
            lines_html = ""
            for line_no, content in code_lines:
                is_hl = line_no in highlights
                bg_style = "background: rgba(204, 120, 92, 0.16); border-left: 3px solid var(--coral);" if is_hl else "border-left: 3px solid transparent;"
                lines_html += f"""
                <div style="display: flex; padding: 2px 8px; {bg_style} font-family: 'Fira Code', monospace; font-size: 13px; line-height: 1.6;">
                    <span style="width: 32px; color: #A8A29E; user-select: none; font-size: 11.5px; text-align: right; margin-right: 14px;">{line_no}</span>
                    <span style="color: var(--ink); flex: 1;">{content}</span>
                </div>
                """

            html = f"""
            <div style="width: 100%; height: 100%; background: var(--paper); border: 1.5px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(28,25,23,0.05); display: flex; flex-direction: column;">
                <!-- Mac 风格窗口顶栏 -->
                <div style="background: var(--cream); border-bottom: 1px solid var(--line); padding: 10px 16px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <span style="width: 11px; height: 11px; border-radius: 50%; background: #EF4444; opacity: 0.8;"></span>
                        <span style="width: 11px; height: 11px; border-radius: 50%; background: #F59E0B; opacity: 0.8;"></span>
                        <span style="width: 11px; height: 11px; border-radius: 50%; background: #10B981; opacity: 0.8;"></span>
                    </div>
                    <span style="font-family: 'Fira Code', monospace; font-size: 12px; color: var(--ink-soft); font-weight: 500;">{title}</span>
                    <span style="font-size: 11px; color: var(--coral-deep); font-weight: 600; background: var(--coral-light); padding: 2px 8px; border-radius: 4px;">TypeScript</span>
                </div>
                <!-- 代码区域 -->
                <div style="padding: 14px 6px; background: #FFFFFF; flex: 1; overflow: hidden;">
                    {lines_html}
                </div>
            </div>
            """
            render_html_to_image(page, html, CODE_CARDS_DIR / filename, width=680, height=480)

        # Code 01: Money create
        render_code_card(
            "code-01-money-create.png",
            "domain-shared/values/money.ts",
            [
                (1, "<span style='color:#7C3AED;'>export class</span> <span style='color:#2563EB; font-weight:600;'>Money</span> <span style='color:#7C3AED;'>extends</span> <span style='color:#2563EB;'>ValueObject</span>&lt;MoneyValue&gt; {"),
                (2, "  <span style='color:#78716C;'>// 私有构造函数：强制外部只能走静态工厂，守住门禁</span>"),
                (3, "  <span style='color:#7C3AED;'>private constructor</span>(value: MoneyValue) { <span style='color:#7C3AED;'>super</span>(value); }"),
                (4, ""),
                (5, "  <span style='color:#7C3AED;'>protected</span> <span style='color:#2E7D32; font-weight:600;'>validate</span>(value: MoneyValue): <span style='color:#2563EB;'>void</span> {"),
                (6, "    <span style='color:#7C3AED;'>const</span> { amountMinor, currency } = value;"),
                (7, "    <span style='color:#78716C;'>// 规则 1：金额必须是非负整数（分），严禁浮点数</span>"),
                (8, "    <span style='color:#7C3AED;'>if</span> (!Number.<span style='color:#2E7D32;'>isInteger</span>(amountMinor) || amountMinor &lt; <span style='color:#D97706;'>0</span>) {"),
                (9, "      <span style='color:#7C3AED;'>throw new</span> <span style='color:#EF4444; font-weight:600;'>BusinessRuleViolationException</span>("),
                (10, "        <span style='color:#CC785C;'>`金额必须为非负整数(分)，收到: ${amountMinor}`</span>"),
                (11, "      );"),
                (12, "    }"),
                (13, "    <span style='color:#78716C;'>// 规则 2：币种必须是 3 位大写字母代码 (ISO 4217)</span>"),
                (14, "    <span style='color:#7C3AED;'>if</span> (!currency || !<span style='color:#D97706;'>/^[A-Z]{3}$/</span>.<span style='color:#2E7D32;'>test</span>(currency)) {"),
                (15, "      <span style='color:#7C3AED;'>throw new</span> <span style='color:#EF4444; font-weight:600;'>BusinessRuleViolationException</span>(<span style='color:#CC785C;'>'币种格式不合法'</span>);"),
                (16, "    }"),
                (17, "  }"),
                (18, ""),
                (19, "  <span style='color:#7C3AED;'>static</span> <span style='color:#2E7D32; font-weight:600;'>create</span>(amountMinor: <span style='color:#2563EB;'>number</span>, currency = <span style='color:#CC785C;'>'CNY'</span>): <span style='color:#2563EB;'>Money</span> {"),
                (20, "    <span style='color:#7C3AED;'>return new</span> <span style='color:#2563EB;'>Money</span>({ amountMinor, currency });"),
                (21, "  }"),
                (22, "}")
            ],
            highlights=[8, 9, 10, 19, 20]
        )

        # Code 02: Money ops
        render_code_card(
            "code-02-money-ops.png",
            "domain-shared/values/money.ts (Immutable Operations)",
            [
                (24, "  <span style='color:#78716C;'>// 核心特征：不可变运算，返回全新实例，原对象绝不修改</span>"),
                (25, "  <span style='color:#2E7D32; font-weight:600;'>add</span>(other: <span style='color:#2563EB;'>Money</span>): <span style='color:#2563EB;'>Money</span> {"),
                (26, "    <span style='color:#7C3AED;'>this</span>.<span style='color:#2E7D32;'>assertSameCurrency</span>(other);"),
                (27, "    <span style='color:#7C3AED;'>return new</span> <span style='color:#2563EB;'>Money</span>({"),
                (28, "      amountMinor: <span style='color:#7C3AED;'>this</span>.amountMinor + other.amountMinor,"),
                (29, "      currency: <span style='color:#7C3AED;'>this</span>.currency,"),
                (30, "    });"),
                (31, "  }"),
                (32, ""),
                (33, "  <span style='color:#2E7D32; font-weight:600;'>subtract</span>(other: <span style='color:#2563EB;'>Money</span>): <span style='color:#2563EB;'>Money</span> {"),
                (34, "    <span style='color:#7C3AED;'>this</span>.<span style='color:#2E7D32;'>assertSameCurrency</span>(other);"),
                (35, "    <span style='color:#7C3AED;'>const</span> remain = <span style='color:#7C3AED;'>this</span>.amountMinor - other.amountMinor;"),
                (36, "    <span style='color:#78716C;'>// 门禁守门：扣减后不能为负数，彻底杜绝负余额漏洞</span>"),
                (37, "    <span style='color:#7C3AED;'>if</span> (remain &lt; <span style='color:#D97706;'>0</span>) {"),
                (38, "      <span style='color:#7C3AED;'>throw new</span> <span style='color:#EF4444; font-weight:600;'>BusinessRuleViolationException</span>(<span style='color:#CC785C;'>'资金扣减导致负数'</span>);"),
                (39, "    }"),
                (40, "    <span style='color:#7C3AED;'>return new</span> <span style='color:#2563EB;'>Money</span>({ amountMinor: remain, currency: <span style='color:#7C3AED;'>this</span>.currency });"),
                (41, "  }"),
                (42, ""),
                (43, "  <span style='color:#7C3AED;'>private</span> <span style='color:#2E7D32;'>assertSameCurrency</span>(other: <span style='color:#2563EB;'>Money</span>): <span style='color:#2563EB;'>void</span> {"),
                (44, "    <span style='color:#7C3AED;'>if</span> (<span style='color:#7C3AED;'>this</span>.currency !== other.currency) {"),
                (45, "      <span style='color:#7C3AED;'>throw new</span> <span style='color:#EF4444; font-weight:600;'>BusinessRuleViolationException</span>(<span style='color:#CC785C;'>'不同币种禁止直接加减'</span>);"),
                (46, "    }"),
                (47, "  }")
            ],
            highlights=[27, 28, 29, 37, 38, 44, 45]
        )

        # Code 03: LessonQuantity
        render_code_card(
            "code-03-lesson-quantity.png",
            "domain-shared/values/lesson-quantity.ts",
            [
                (1, "<span style='color:#7C3AED;'>export class</span> <span style='color:#2563EB; font-weight:600;'>LessonQuantity</span> <span style='color:#7C3AED;'>extends</span> <span style='color:#2563EB;'>ValueObject</span>&lt;<span style='color:#2563EB;'>number</span>&gt; {"),
                (2, "  <span style='color:#7C3AED;'>protected</span> <span style='color:#2E7D32; font-weight:600;'>validate</span>(value: <span style='color:#2563EB;'>number</span>): <span style='color:#2563EB;'>void</span> {"),
                (3, "    <span style='color:#78716C;'>// 强制非负整数：杜绝负课时，更不允许倒贴课时</span>"),
                (4, "    <span style='color:#7C3AED;'>if</span> (!Number.<span style='color:#2E7D32;'>isInteger</span>(value) || value &lt; <span style='color:#D97706;'>0</span>) {"),
                (5, "      <span style='color:#7C3AED;'>throw new</span> <span style='color:#EF4444; font-weight:600;'>BusinessRuleViolationException</span>("),
                (6, "        <span style='color:#CC785C;'>`LessonQuantity 必须为非负整数，收到 ${value}`</span>"),
                (7, "      );"),
                (8, "    }"),
                (9, "  }"),
                (10, ""),
                (11, "  <span style='color:#2E7D32; font-weight:600;'>subtract</span>(other: <span style='color:#2563EB;'>LessonQuantity</span>): <span style='color:#2563EB;'>LessonQuantity</span> {"),
                (12, "    <span style='color:#7C3AED;'>const</span> result = <span style='color:#7C3AED;'>this</span>.value - other.value;"),
                (13, "    <span style='color:#78716C;'>// 业务铁律锁死：消课扣减如果超出可用余额直接抛错</span>"),
                (14, "    <span style='color:#7C3AED;'>if</span> (result &lt; <span style='color:#D97706;'>0</span>) {"),
                (15, "      <span style='color:#7C3AED;'>throw new</span> <span style='color:#EF4444; font-weight:600;'>BusinessRuleViolationException</span>("),
                (16, "        <span style='color:#CC785C;'>`课时扣减超额（当前: ${this.value}, 尝试扣: ${other.value}）`</span>"),
                (17, "      );"),
                (18, "    }"),
                (19, "    <span style='color:#7C3AED;'>return new</span> <span style='color:#2563EB;'>LessonQuantity</span>(result);"),
                (20, "  }"),
                (21, "}")
            ],
            highlights=[4, 5, 14, 15, 16, 19]
        )

        # Code 04: Order aggregate create
        render_code_card(
            "code-04-order-create.png",
            "billing/domain/order/order.aggregate.ts",
            [
                (1, "<span style='color:#7C3AED;'>export class</span> <span style='color:#2563EB; font-weight:600;'>Order</span> <span style='color:#7C3AED;'>extends</span> <span style='color:#2563EB;'>AggregateRootBase</span>&lt;OrderId&gt; {"),
                (2, "  <span style='color:#78716C;'>// 聚合内部集合全部 private：外部绝对无法绕过聚合根直接篡改</span>"),
                (3, "  <span style='color:#7C3AED;'>private readonly</span> _items: <span style='color:#2563EB;'>OrderItem</span>[] = [];"),
                (4, "  <span style='color:#7C3AED;'>private readonly</span> _allocations: <span style='color:#2563EB;'>OrderSkuRevenueAllocation</span>[] = [];"),
                (5, "  <span style='color:#7C3AED;'>private</span> _status: <span style='color:#2563EB;'>OrderStatus</span>;"),
                (6, ""),
                (7, "  <span style='color:#7C3AED;'>static</span> <span style='color:#2E7D32; font-weight:600;'>create</span>(params: CreateOrderParams): <span style='color:#2563EB;'>Order</span> {"),
                (8, "    <span style='color:#78716C;'>// 业务门禁校验：订单必须有明细，且必须覆盖打包商品中所有 SKU</span>"),
                (9, "    <span style='color:#7C3AED;'>if</span> (!params.items || params.items.length === <span style='color:#D97706;'>0</span>) {"),
                (10, "      <span style='color:#7C3AED;'>throw new</span> <span style='color:#EF4444;'>BusinessRuleViolationException</span>(<span style='color:#CC785C;'>'订单明细项不能为空'</span>);"),
                (11, "    }"),
                (12, "    <span style='color:#7C3AED;'>const</span> order = <span style='color:#7C3AED;'>new</span> <span style='color:#2563EB;'>Order</span>("),
                (13, "      OrderId.<span style='color:#2E7D32;'>generate</span>(),"),
                (14, "      StudentId.<span style='color:#2E7D32;'>create</span>(params.studentId),"),
                (15, "      Money.<span style='color:#2E7D32;'>create</span>(params.productSnapshot.price, <span style='color:#CC785C;'>'CNY'</span>),"),
                (16, "      OrderStatus.<span style='color:#2E7D32;'>pendingPayment</span>()"),
                (17, "    );"),
                (18, "    <span style='color:#78716C;'>// 核心：在创建的同时，自动在聚合内部计算并冻结收入分摊比例</span>"),
                (19, "    order.<span style='color:#2E7D32;'>freezeAllocations</span>();"),
                (20, "    <span style='color:#7C3AED;'>return</span> order;"),
                (21, "  }"),
                (22, "}")
            ],
            highlights=[3, 4, 9, 10, 18, 19]
        )

        # Code 05: Order freeze allocations
        render_code_card(
            "code-05-order-freeze-allocations.png",
            "billing/domain/order/order.aggregate.ts (Revenue Allocation)",
            [
                (24, "  <span style='color:#78716C;'>/** 收入分摊冻结算法：保证分摊累加之和严格恒等于订单总金额 */</span>"),
                (25, "  <span style='color:#7C3AED;'>private</span> <span style='color:#2E7D32; font-weight:600;'>freezeAllocations</span>(): <span style='color:#2563EB;'>void</span> {"),
                (26, "    <span style='color:#7C3AED;'>const</span> totalMinor = <span style='color:#7C3AED;'>this</span>._receivableAmount.amountMinor;"),
                (27, "    <span style='color:#7C3AED;'>const</span> totalOriginal = <span style='color:#7C3AED;'>this</span>._items.<span style='color:#2E7D32;'>reduce</span>((s, i) =&gt; s + i.unitPriceMinor, <span style='color:#D97706;'>0</span>);"),
                (28, "    <span style='color:#7C3AED;'>let</span> allocatedSum = <span style='color:#D97706;'>0</span>;"),
                (29, "    <span style='color:#7C3AED;'>const</span> count = <span style='color:#7C3AED;'>this</span>._items.length;"),
                (30, ""),
                (31, "    <span style='color:#7C3AED;'>for</span> (<span style='color:#7C3AED;'>let</span> i = <span style='color:#D97706;'>0</span>; i &lt; count; i++) {"),
                (32, "      <span style='color:#7C3AED;'>const</span> item = <span style='color:#7C3AED;'>this</span>._items[i];"),
                (33, "      <span style='color:#7C3AED;'>let</span> itemShareMinor = <span style='color:#D97706;'>0</span>;"),
                (34, "      <span style='color:#78716C;'>// 最后一门课程做末位兜底！彻底消灭除不尽产生的 1 分钱差异</span>"),
                (35, "      <span style='color:#7C3AED;'>if</span> (i === count - <span style='color:#D97706;'>1</span>) {"),
                (36, "        itemShareMinor = totalMinor - allocatedSum;"),
                (37, "      } <span style='color:#7C3AED;'>else</span> {"),
                (38, "        itemShareMinor = Math.<span style='color:#2E7D32;'>floor</span>((item.unitPriceMinor / totalOriginal) * totalMinor);"),
                (39, "        allocatedSum += itemShareMinor;"),
                (40, "      }"),
                (41, "      <span style='color:#7C3AED;'>this</span>._allocations.<span style='color:#2E7D32;'>push</span>(OrderSkuRevenueAllocation.<span style='color:#2E7D32;'>create</span>({"),
                (42, "        skuId: item.skuId, amount: Money.<span style='color:#2E7D32;'>create</span>(itemShareMinor, <span style='color:#CC785C;'>'CNY'</span>)"),
                (43, "      }));"),
                (44, "    }"),
                (45, "  }")
            ],
            highlights=[34, 35, 36, 38, 39, 41]
        )

        # Code 06: Order cancel
        render_code_card(
            "code-06-order-cancel.png",
            "billing/domain/order/order.aggregate.ts (State Invariant)",
            [
                (48, "  <span style='color:#78716C;'>/** 业务意图方法：取消订单 */</span>"),
                (49, "  <span style='color:#2E7D32; font-weight:600;'>cancel</span>(reason: <span style='color:#2563EB;'>string</span>): <span style='color:#2563EB;'>void</span> {"),
                (50, "    <span style='color:#78716C;'>// 状态机硬性守卫：只有待支付订单允许取消，已付款的不能随便改</span>"),
                (51, "    <span style='color:#7C3AED;'>if</span> (!<span style='color:#7C3AED;'>this</span>._status.<span style='color:#2E7D32;'>isPendingPayment</span>()) {"),
                (52, "      <span style='color:#7C3AED;'>throw new</span> <span style='color:#EF4444; font-weight:600;'>OrderNotCancellable</span>("),
                (53, "        <span style='color:#CC785C;'>`当前订单状态为 [${this._status.code}]，仅待支付订单允许取消`</span>"),
                (54, "      );"),
                (55, "    }"),
                (56, ""),
                (57, "    <span style='color:#78716C;'>// 状态流转推进</span>"),
                (58, "    <span style='color:#7C3AED;'>this</span>._status = OrderStatus.<span style='color:#2E7D32;'>cancelled</span>();"),
                (59, ""),
                (60, "    <span style='color:#78716C;'>// 产生领域事件：通知下游（发通知/释放库存）</span>"),
                (61, "    <span style='color:#7C3AED;'>this</span>.<span style='color:#2E7D32;'>apply</span>(<span style='color:#7C3AED;'>new</span> <span style='color:#2563EB; font-weight:600;'>OrderCancelledDomainEvent</span>("),
                (62, "      <span style='color:#7C3AED;'>this</span>.id.value,"),
                (63, "      reason,"),
                (64, "      <span style='color:#7C3AED;'>new</span> Date()"),
                (65, "    ));"),
                (66, "  }")
            ],
            highlights=[51, 52, 53, 58, 61, 62]
        )

        # Code 07: OrderRepositoryPort
        render_code_card(
            "code-07-order-repo-port.png",
            "billing/domain/ports/order.repository.ts",
            [
                (1, "<span style='color:#78716C;'>/** 领域层仓储端口：完全纯粹的 TypeScript 接口，零 ORM 依赖 */</span>"),
                (2, "<span style='color:#7C3AED;'>export const</span> <span style='color:#D97706; font-weight:600;'>ORDER_REPOSITORY</span> = <span style='color:#2E7D32;'>Symbol</span>(<span style='color:#CC785C;'>'ORDER_REPOSITORY'</span>);"),
                (3, ""),
                (4, "<span style='color:#7C3AED;'>export interface</span> <span style='color:#2563EB; font-weight:600;'>OrderRepositoryPort</span> {"),
                (5, "  <span style='color:#78716C;'>// 面向集合存取风格：只通过强类型 ID 检索聚合根</span>"),
                (6, "  <span style='color:#2E7D32;'>findById</span>(orderId: <span style='color:#2563EB;'>OrderId</span>): <span style='color:#2563EB;'>Promise</span>&lt;<span style='color:#2563EB;'>Order</span> | <span style='color:#2563EB;'>null</span>&gt;;"),
                (7, ""),
                (8, "  <span style='color:#78716C;'>// 业务检索接口</span>"),
                (9, "  <span style='color:#2E7D32;'>findActiveBySourceAndProduct</span>("),
                (10, "    submissionId: <span style='color:#2563EB;'>EnrollmentSubmissionId</span>,"),
                (11, "    productId: <span style='color:#2563EB;'>CourseProductId</span>"),
                (12, "  ): <span style='color:#2563EB;'>Promise</span>&lt;<span style='color:#2563EB;'>Order</span> | <span style='color:#2563EB;'>null</span>&gt;;"),
                (13, ""),
                (14, "  <span style='color:#78716C;'>// 保存完整聚合根生命周期变更</span>"),
                (15, "  <span style='color:#2E7D32;'>save</span>(order: <span style='color:#2563EB;'>Order</span>): <span style='color:#2563EB;'>Promise</span>&lt;<span style='color:#2563EB;'>void</span>&gt;;"),
                (16, "}")
            ],
            highlights=[2, 4, 6, 9, 15]
        )

        # Code 08: OutboxWriter
        render_code_card(
            "code-08-outbox-writer.png",
            "shared/kernel/outbox/outbox-writer.service.ts",
            [
                (1, "<span style='color:#2563EB;'>@Injectable</span>()"),
                (2, "<span style='color:#7C3AED;'>export class</span> <span style='color:#2563EB; font-weight:600;'>OutboxWriter</span> {"),
                (3, "  <span style='color:#7C3AED;'>constructor</span>(<span style='color:#7C3AED;'>private readonly</span> em: <span style='color:#2563EB;'>EntityManager</span>) {}"),
                (4, ""),
                (5, "  <span style='color:#7C3AED;'>async</span> <span style='color:#2E7D32; font-weight:600;'>append</span>(event: <span style='color:#2563EB;'>IntegrationEvent</span>): <span style='color:#2563EB;'>Promise</span>&lt;<span style='color:#2563EB;'>void</span>&gt; {"),
                (6, "    <span style='color:#7C3AED;'>const</span> sqlEm = <span style='color:#7C3AED;'>this</span>.em <span style='color:#7C3AED;'>as</span> <span style='color:#2563EB;'>SqlEntityManager</span>;"),
                (7, "    <span style='color:#78716C;'>// 架构硬防御：必须在显式事务上下文内调用！非事务直接抛错阻断</span>"),
                (8, "    <span style='color:#7C3AED;'>if</span> (!sqlEm.<span style='color:#2E7D32;'>isInTransaction</span>()) {"),
                (9, "      <span style='color:#7C3AED;'>throw new</span> <span style='color:#EF4444; font-weight:600;'>Error</span>(<span style='color:#CC785C;'>'OutboxWriter.append 必须在事务上下文内调用！禁止业务与事件落盘分离'</span>);"),
                (10, "    }"),
                (11, "    <span style='color:#78716C;'>// 注入 OpenTelemetry 分布式链路 TraceContext</span>"),
                (12, "    event.traceparent = <span style='color:#2E7D32;'>currentTraceparent</span>() ?? <span style='color:#CC785C;'>''</span>;"),
                (13, "    <span style='color:#78716C;'>// 同事务内追加发件箱实体记录</span>"),
                (14, "    <span style='color:#7C3AED;'>const</span> record = sqlEm.<span style='color:#2E7D32;'>create</span>(OutboxEventEntity, {"),
                (15, "      eventId: event.eventId,"),
                (16, "      eventName: event.eventName,"),
                (17, "      payload: JSON.<span style='color:#2E7D32;'>stringify</span>(event.payload),"),
                (18, "      status: <span style='color:#CC785C;'>'PENDING'</span>,"),
                (19, "    });"),
                (20, "    sqlEm.<span style='color:#2E7D32;'>persist</span>(record);"),
                (21, "  }"),
                (22, "}")
            ],
            highlights=[8, 9, 12, 14, 18, 20]
        )

        # Code 09: OrderMapper toDomain
        render_code_card(
            "code-09-order-mapper-todomain.png",
            "billing/south/mappers/order.mapper.ts (toDomain)",
            [
                (1, "<span style='color:#7C3AED;'>export class</span> <span style='color:#2563EB; font-weight:600;'>OrderMapper</span> {"),
                (2, "  <span style='color:#78716C;'>// 数据库关系实体 -&gt; 纯净充血聚合根</span>"),
                (3, "  <span style='color:#7C3AED;'>static</span> <span style='color:#2E7D32; font-weight:600;'>toDomain</span>(orm: <span style='color:#2563EB;'>OrderOrmEntity</span>): <span style='color:#2563EB;'>Order</span> {"),
                (4, "    <span style='color:#7C3AED;'>return</span> Order.<span style='color:#2E7D32;'>fromPersistence</span>({"),
                (5, "      id: OrderId.<span style='color:#2E7D32;'>create</span>(orm.id),"),
                (6, "      orderNo: orm.orderNo,"),
                (7, "      studentId: StudentId.<span style='color:#2E7D32;'>create</span>(orm.studentId),"),
                (8, "      campusId: CampusId.<span style='color:#2E7D32;'>create</span>(orm.campusId),"),
                (9, "      <span style='color:#78716C;'>// 标量整数 -&gt; 充血值对象 Money</span>"),
                (10, "      receivableAmount: Money.<span style='color:#2E7D32;'>create</span>(orm.receivableAmountMinor, orm.currency),"),
                (11, "      <span style='color:#78716C;'>// 字符串代码 -&gt; 状态值对象</span>"),
                (12, "      status: OrderStatus.<span style='color:#2E7D32;'>fromCode</span>(orm.statusCode),"),
                (13, "      version: orm.version, <span style='color:#78716C;'>// 乐观锁版本</span>"),
                (14, "      createdAt: orm.createdAt,"),
                (15, "    });"),
                (16, "  }"),
                (17, "}")
            ],
            highlights=[4, 5, 10, 12, 13]
        )

        # Code 10: OrderMapper toPersistence
        render_code_card(
            "code-10-order-mapper-topersistence.png",
            "billing/south/mappers/order.mapper.ts (toPersistence)",
            [
                (18, "  <span style='color:#78716C;'>// 充血聚合根 -&gt; 数据库关系实体 (扁平化)</span>"),
                (19, "  <span style='color:#7C3AED;'>static</span> <span style='color:#2E7D32; font-weight:600;'>toPersistence</span>(domain: <span style='color:#2563EB;'>Order</span>): <span style='color:#2563EB;'>OrderOrmEntity</span> {"),
                (20, "    <span style='color:#7C3AED;'>const</span> orm = <span style='color:#7C3AED;'>new</span> <span style='color:#2563EB;'>OrderOrmEntity</span>();"),
                (21, "    orm.id = domain.id.value;"),
                (22, "    orm.orderNo = domain.orderNo.value;"),
                (23, "    orm.studentId = domain.studentId.value;"),
                (24, "    orm.campusId = domain.campusId.value;"),
                (25, "    <span style='color:#78716C;'>// 提取 Money 内部的整数分，解构写入数据库列</span>"),
                (26, "    orm.receivableAmountMinor = domain.receivableAmount.amountMinor;"),
                (27, "    orm.currency = domain.receivableAmount.currency;"),
                (28, "    orm.statusCode = domain.status.code;"),
                (29, "    orm.version = domain.version;"),
                (30, "    <span style='color:#7C3AED;'>return</span> orm;"),
                (31, "  }"),
                (32, "}")
            ],
            highlights=[20, 26, 27, 28, 29]
        )

        browser.close()
        print("All 17 assets rendered successfully!")

if __name__ == "__main__":
    main()
