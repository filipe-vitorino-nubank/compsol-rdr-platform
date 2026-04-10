import { env } from "../config/env";

export function isAppsScriptEnv(): boolean {
  return env.isAppsScript || !!(window as any).google?.script?.run; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function gasRun<T>(fnName: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runner = (window as any).google?.script?.run;
    if (!runner) {
      reject(new Error("google.script.run não disponível. Recarregue a página."));
      return;
    }

    runner
      .withSuccessHandler((result: T) => resolve(result))
      .withFailureHandler((err: any) => reject(new Error(err?.message || String(err)))) // eslint-disable-line @typescript-eslint/no-explicit-any
      [fnName](...args);
  });
}
