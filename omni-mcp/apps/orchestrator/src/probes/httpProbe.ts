import { request } from 'undici';

export interface ProbeResult {
  ok: boolean;
  ms: number;
}

export async function httpProbe(url: string, timeoutMs: number): Promise<ProbeResult> {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  
  try {
    const res = await request(url, { 
      method: 'GET', 
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'omni-mcp-health-checker',
      }
    });
    
    return { 
      ok: res.statusCode >= 200 && res.statusCode < 300, 
      ms: Date.now() - t0 
    };
  } catch {
    return { 
      ok: false, 
      ms: Date.now() - t0 
    };
  } finally { 
    clearTimeout(id); 
  }
}