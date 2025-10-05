import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import type { LogEnvelope } from './schemas';

const DB_NAME = 'logs.db';
const TABLE_NAME = 'log_queue';

interface QueueItem {
  id: number;
  ts: string;
  lvl: string;
  payload: string;
  attempts: number;
  nextAttemptAt: number;
}

const QUEUE_CONFIG = {
  maxSize: 1000,
  maxBatchSize: 200,
  maxBatchBytes: 200_000,
  retryAttempts: 5,
  backoffBase: 1000,
  backoffMax: 300_000,
  jitterPercent: 15,
  flushInterval: 30_000,
};

let db: SQLite.SQLiteDatabase | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let isFlushingRef = { current: false };

export async function initQueue(): Promise<void> {
  if (Platform.OS === 'web') {
    if (__DEV__) {

      console.log('[Queue] SQLite not available on web, using in-memory queue');

    }
    return;
  }

  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT NOT NULL,
        lvl TEXT NOT NULL,
        payload TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        nextAttemptAt INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_nextAttemptAt ON ${TABLE_NAME}(nextAttemptAt);
      CREATE INDEX IF NOT EXISTS idx_lvl ON ${TABLE_NAME}(lvl);
    `);

    if (__DEV__) {


      console.log('[Queue] Initialized successfully');


    }
    
    startFlushWorker();
  } catch (error) {
    if (__DEV__) {

      console.error('[Queue] Failed to initialize:', error);

    }
  }
}

export async function enqueue(log: LogEnvelope): Promise<void> {
  if (!db) {
    if (__DEV__) {

      console.warn('[Queue] Database not initialized, dropping log');

    }
    return;
  }

  try {
    const size = await getQueueSize();
    
    if (size >= QUEUE_CONFIG.maxSize) {
      if (__DEV__) {

        console.warn('[Queue] Queue full, dropping oldest DEBUG/TRACE logs');

      }
      await db.runAsync(
        `DELETE FROM ${TABLE_NAME} WHERE id IN (
          SELECT id FROM ${TABLE_NAME} 
          WHERE lvl IN ('DEBUG', 'TRACE') 
          ORDER BY ts ASC 
          LIMIT 100
        )`
      );
    }

    await db.runAsync(
      `INSERT INTO ${TABLE_NAME} (ts, lvl, payload, attempts, nextAttemptAt) 
       VALUES (?, ?, ?, 0, 0)`,
      [log.ts, log.lvl, JSON.stringify(log)]
    );

    if (__DEV__) {


      console.log(`[Queue] Enqueued log: ${log.evt}`);


    }
  } catch (error) {
    if (__DEV__) {

      console.error('[Queue] Failed to enqueue:', error);

    }
  }
}

export async function dequeue(limit: number = QUEUE_CONFIG.maxBatchSize): Promise<LogEnvelope[]> {
  if (!db) {
    return [];
  }

  try {
    const now = Date.now();
    const rows = await db.getAllAsync<QueueItem>(
      `SELECT * FROM ${TABLE_NAME} 
       WHERE nextAttemptAt <= ? 
       ORDER BY ts ASC 
       LIMIT ?`,
      [now, limit]
    );

    return rows.map(row => JSON.parse(row.payload) as LogEnvelope);
  } catch (error) {
    if (__DEV__) {

      console.error('[Queue] Failed to dequeue:', error);

    }
    return [];
  }
}

export async function markSuccess(logs: LogEnvelope[]): Promise<void> {
  if (!db || logs.length === 0) {
    return;
  }

  try {
    const timestamps = logs.map(log => log.ts);
    const placeholders = timestamps.map(() => '?').join(',');
    
    await db.runAsync(
      `DELETE FROM ${TABLE_NAME} WHERE ts IN (${placeholders})`,
      timestamps
    );

    if (__DEV__) {


      console.log(`[Queue] Marked ${logs.length} logs as sent`);


    }
  } catch (error) {
    if (__DEV__) {

      console.error('[Queue] Failed to mark success:', error);

    }
  }
}

export async function markFailure(logs: LogEnvelope[]): Promise<void> {
  if (!db || logs.length === 0) {
    return;
  }

  try {
    for (const log of logs) {
      const row = await db.getFirstAsync<QueueItem>(
        `SELECT * FROM ${TABLE_NAME} WHERE ts = ?`,
        [log.ts]
      );

      if (!row) {
        continue;
      }

      const newAttempts = row.attempts + 1;

      if (newAttempts >= QUEUE_CONFIG.retryAttempts) {
        if (__DEV__) {

          console.warn(`[Queue] Max retries reached for log: ${log.evt}, dropping`);

        }
        await db.runAsync(
          `DELETE FROM ${TABLE_NAME} WHERE ts = ?`,
          [log.ts]
        );
      } else {
        const backoff = calculateBackoff(newAttempts);
        const nextAttemptAt = Date.now() + backoff;

        await db.runAsync(
          `UPDATE ${TABLE_NAME} 
           SET attempts = ?, nextAttemptAt = ? 
           WHERE ts = ?`,
          [newAttempts, nextAttemptAt, log.ts]
        );

        if (__DEV__) {


          console.log(`[Queue] Retry scheduled for log: ${log.evt} in ${backoff}ms`);


        }
      }
    }
  } catch (error) {
    if (__DEV__) {

      console.error('[Queue] Failed to mark failure:', error);

    }
  }
}

function calculateBackoff(attempts: number): number {
  const exponential = Math.min(
    QUEUE_CONFIG.backoffBase * Math.pow(2, attempts - 1),
    QUEUE_CONFIG.backoffMax
  );

  const jitter = exponential * (QUEUE_CONFIG.jitterPercent / 100);
  const jitterAmount = Math.random() * jitter * 2 - jitter;

  return Math.floor(exponential + jitterAmount);
}

export async function getQueueSize(): Promise<number> {
  if (!db) {
    return 0;
  }

  try {
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAME}`
    );
    return result?.count || 0;
  } catch (error) {
    if (__DEV__) {

      console.error('[Queue] Failed to get queue size:', error);

    }
    return 0;
  }
}

export async function getQueueStats(): Promise<{
  total: number;
  byLevel: Record<string, number>;
  oldestTs?: string;
  newestTs?: string;
}> {
  if (!db) {
    return { total: 0, byLevel: {} };
  }

  try {
    const total = await getQueueSize();
    
    const levelRows = await db.getAllAsync<{ lvl: string; count: number }>(
      `SELECT lvl, COUNT(*) as count FROM ${TABLE_NAME} GROUP BY lvl`
    );

    const byLevel: Record<string, number> = {};
    for (const row of levelRows) {
      byLevel[row.lvl] = row.count;
    }

    const oldest = await db.getFirstAsync<{ ts: string }>(
      `SELECT ts FROM ${TABLE_NAME} ORDER BY ts ASC LIMIT 1`
    );

    const newest = await db.getFirstAsync<{ ts: string }>(
      `SELECT ts FROM ${TABLE_NAME} ORDER BY ts DESC LIMIT 1`
    );

    return {
      total,
      byLevel,
      oldestTs: oldest?.ts,
      newestTs: newest?.ts,
    };
  } catch (error) {
    if (__DEV__) {

      console.error('[Queue] Failed to get queue stats:', error);

    }
    return { total: 0, byLevel: {} };
  }
}

export async function clearOldQueueItems(olderThan: number): Promise<number> {
  if (!db) {
    return 0;
  }

  try {
    const cutoffDate = new Date(olderThan).toISOString();
    const result = await db.runAsync(
      `DELETE FROM ${TABLE_NAME} WHERE ts < ?`,
      [cutoffDate]
    );

    if (__DEV__) {


      console.log(`[Queue] Cleared ${result.changes} old items`);


    }
    return result.changes;
  } catch (error) {
    if (__DEV__) {

      console.error('[Queue] Failed to clear old items:', error);

    }
    return 0;
  }
}

export async function clearQueue(): Promise<void> {
  if (!db) {
    return;
  }

  try {
    await db.runAsync(`DELETE FROM ${TABLE_NAME}`);
    if (__DEV__) {

      console.log('[Queue] Cleared all items');

    }
  } catch (error) {
    if (__DEV__) {

      console.error('[Queue] Failed to clear queue:', error);

    }
  }
}

function startFlushWorker(): void {
  if (flushTimer) {
    return;
  }

  flushTimer = setInterval(() => {
    flushQueue({ force: false }).catch(error => {
      if (__DEV__) {

        console.error('[Queue] Flush worker error:', error);

      }
    });
  }, QUEUE_CONFIG.flushInterval);

  if (__DEV__) {


    console.log('[Queue] Flush worker started');


  }
}

export function stopFlushWorker(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
    if (__DEV__) {

      console.log('[Queue] Flush worker stopped');

    }
  }
}

export async function flushQueue(options: { force?: boolean } = {}): Promise<void> {
  if (isFlushingRef.current) {
    if (__DEV__) {

      console.log('[Queue] Flush already in progress, skipping');

    }
    return;
  }

  if (!db) {
    if (__DEV__) {

      console.warn('[Queue] Database not initialized, cannot flush');

    }
    return;
  }

  isFlushingRef.current = true;

  try {
    const size = await getQueueSize();
    
    if (size === 0) {
      if (__DEV__) {

        console.log('[Queue] Queue empty, nothing to flush');

      }
      return;
    }

    if (__DEV__) {


      console.log(`[Queue] Flushing ${size} items...`);


    }

    const logs = await dequeue(QUEUE_CONFIG.maxBatchSize);
    
    if (logs.length === 0) {
      console.log('[Queue] No logs ready to send (backoff in progress)');
      return;
    }

    const { sendBatch } = await import('./transport/http');
    const success = await sendBatch(logs);

    if (success) {
      await markSuccess(logs);
      if (__DEV__) {

        console.log(`[Queue] Successfully flushed ${logs.length} logs`);

      }
    } else {
      await markFailure(logs);
      if (__DEV__) {

        console.warn(`[Queue] Failed to flush ${logs.length} logs, will retry`);

      }
    }
  } catch (error) {
    if (__DEV__) {

      console.error('[Queue] Flush error:', error);

    }
  } finally {
    isFlushingRef.current = false;
  }
}

export async function closeQueue(): Promise<void> {
  stopFlushWorker();
  
  if (db) {
    try {
      await db.closeAsync();
      db = null;
      if (__DEV__) {

        console.log('[Queue] Closed successfully');

      }
    } catch (error) {
      if (__DEV__) {

        console.error('[Queue] Failed to close:', error);

      }
    }
  }
}
