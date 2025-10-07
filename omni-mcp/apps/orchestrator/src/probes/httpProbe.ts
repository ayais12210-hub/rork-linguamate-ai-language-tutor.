export interface ProbeResult {
  ok: boolean;
  ms: number;
  error?: string;
}

export async function httpProbe(
  url: string, 
  timeoutMs: number
): Promise<ProbeResult> {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  
  try {
    const res = await fetch(url, { 
      method: 'GET', 
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'omni-mcp-health-checker',
      }
    });
    
    const ms = Date.now() - t0;
    const ok = res.status >= 200 && res.status < 300;
    
    return { 
      ok, 
      ms,
      error: ok ? undefined : `HTTP ${res.status}`
    };
  } catch (error) {
    const ms = Date.now() - t0;
    
    return { 
      ok: false, 
      ms,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    clearTimeout(id);
  }
}