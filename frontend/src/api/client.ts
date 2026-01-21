export type ApiError = {
    message: string;
    status?: number;
  };
  
  export async function sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }
  
  // For now: simulated API call wrapper (latency + optional failure)
  export async function apiCall<T>(
    fn: () => T | Promise<T>,
    opts?: { delayMs?: number; failRate?: number }
  ): Promise<T> {
    const delayMs = opts?.delayMs ?? 250;
    const failRate = opts?.failRate ?? 0;
  
    await sleep(delayMs);
  
    if (failRate > 0 && Math.random() < failRate) {
      const err: ApiError = { message: "Simulated network error", status: 500 };
      throw err;
    }
  
    return await fn();
  }
  