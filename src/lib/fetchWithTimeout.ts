export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15_000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        `TIMEOUT: A requisição demorou mais de ${timeoutMs / 1000}s. ` +
          "Verifique sua conexão e tente novamente.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: { timeoutMs?: number; retries?: number } = {},
): Promise<Response> {
  const { timeoutMs = 15_000, retries = 2 } = config;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);

      if (attempt < retries && (response.status === 429 || response.status >= 500)) {
        const delay = Math.pow(2, attempt) * 1_000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === retries) throw error;
      const delay = Math.pow(2, attempt) * 1_000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new Error("Todas as tentativas falharam.");
}
