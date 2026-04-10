export function isAppsScriptEnv(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(window as any).google?.script?.run;
}

export function gasRun<T>(fnName: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runner = (window as any).google?.script?.run;
    if (!runner) {
      reject(new Error("google.script.run não disponível"));
      return;
    }

    runner
      .withSuccessHandler((result: T) => resolve(result))
      .withFailureHandler((err: Error) => reject(err))
      [fnName](...args);
  });
}
