import { spawn } from 'node:child_process';

export interface ProbeResult {
  ok: boolean;
  ms: number;
}

export async function stdioProbe(cmd: string, args: string[], timeoutMs: number): Promise<ProbeResult> {
  const t0 = Date.now();
  
  return new Promise<ProbeResult>((resolve) => {
    const child = spawn(cmd, [...args, '--health'], { 
      stdio: ['ignore', 'pipe', 'pipe'] 
    });
    
    let done = false;
    const timer = setTimeout(() => { 
      if (!done) { 
        done = true; 
        child.kill(); 
        resolve({ ok: false, ms: Date.now() - t0 }); 
      }
    }, timeoutMs);
    
    child.on('exit', (code) => { 
      if (done) return; 
      done = true; 
      clearTimeout(timer); 
      resolve({ ok: code === 0, ms: Date.now() - t0 }); 
    });
  });
}