import { spawn } from 'node:child_process';

export interface ProbeResult {
  ok: boolean;
  ms: number;
  error?: string;
}

export async function stdioProbe(
  cmd: string, 
  args: string[], 
  timeoutMs: number
): Promise<ProbeResult> {
  const t0 = Date.now();
  
  return new Promise((resolve) => {
    const child = spawn(cmd, [...args, '--health'], { 
      stdio: ['ignore', 'pipe', 'pipe'] 
    });
    
    let settled = false;
    
    const timer = setTimeout(() => {
      if (!settled) { 
        settled = true; 
        child.kill(); 
        resolve({ 
          ok: false, 
          ms: Date.now() - t0,
          error: 'timeout'
        }); 
      }
    }, timeoutMs);
    
    child.stdout?.on('data', () => {
      // Output captured but not used in this implementation
    });
    
    child.stderr?.on('data', () => {
      // Error output captured but not used in this implementation
    });
    
    child.on('exit', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      
      const ms = Date.now() - t0;
      const ok = code === 0;
      
      resolve({ 
        ok, 
        ms,
        error: ok ? undefined : `exit code ${code}`
      });
    });
    
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      
      resolve({ 
        ok: false, 
        ms: Date.now() - t0,
        error: error.message
      });
    });
  });
}