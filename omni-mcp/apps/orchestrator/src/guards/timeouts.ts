export class TimeoutGuard {
  async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    serverName: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout after ${timeoutMs}ms for server: ${serverName}`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  createTimeoutSignal(timeoutMs: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    return controller.signal;
  }
}