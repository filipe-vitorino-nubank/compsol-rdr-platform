import { env } from "../config/env";

export function isAppsScriptEnv(): boolean {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const via1 = !!(window as any).google?.script?.run;
  const via2 = env.isAppsScript;
  console.log("[gasClient] isAppsScriptEnv:", { via1_scriptRun: via1, via2_envFlag: via2 });
  return via1 || via2;
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export function gasRun<T>(fnName: string, ...args: unknown[]): Promise<T> {
  console.log("[gasClient] gasRun chamado:", fnName, args);
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runner = (window as any).google?.script?.run;
    if (!runner) {
      console.error("[gasClient] google.script.run NÃO disponível!");
      reject(new Error("google.script.run não disponível. Recarregue a página."));
      return;
    }

    console.log("[gasClient] google.script.run disponível, chamando", fnName);
    runner
      .withSuccessHandler((result: T) => {
        console.log("[gasClient] Sucesso:", fnName, result);
        resolve(result);
      })
      .withFailureHandler((err: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("[gasClient] Erro:", fnName, err);
        reject(new Error(err?.message || String(err)));
      })
      [fnName](...args);
  });
}
