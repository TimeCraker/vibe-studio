import { continueRender, delayRender } from "remotion";

// 字体装载工具(网络可选,**不进确定性验收链**——spec §1):
// - loadRemoteFont:包一层 @remotion/google-fonts 的 loadFont。渲染时从 fonts.gstatic.com
//   拉字模,中国网络可能卡住/失败——失败仅告警并回落系统字体栈,绝不阻塞渲染。
//   用法:loadRemoteFont(() => import("@remotion/google-fonts/montserrat").then((m) => m.loadFont()), "Montserrat")
// - mountLocalFont:@remotion/fonts 自托管 woff2(生产推荐,文件放项目 public/,零网络依赖)。
//   用法:mountLocalFont("MiSans", staticFile("fonts/MiSans-Bold.woff2"))

export const loadRemoteFont = async (loader: () => Promise<unknown>, family: string): Promise<void> => {
  const handle = delayRender(`fonts: loading ${family}`);
  try {
    await loader();
  } catch {
    // 网络失败不抛:回落系统栈,验收链外
    console.warn(`[fonts] ${family} load failed, fallback to system stack`);
  } finally {
    continueRender(handle);
  }
};

export const mountLocalFont = async (family: string, url: string): Promise<void> => {
  const { loadFont } = await import("@remotion/fonts");
  const handle = delayRender(`fonts: mounting ${family}`);
  try {
    await loadFont({ family, url });
  } catch {
    console.warn(`[fonts] ${family} mount failed, fallback to system stack`);
  } finally {
    continueRender(handle);
  }
};
