import { Hono } from 'hono';
import { logger, logSecurityEvent } from '../logging/pino';
import { LogBatchSchema } from '../../modules/logging/schemas';
import { checkClockSkew, verifySignature } from '../../modules/security/integrity';

const app = new Hono();

app.post('/ingest/logs', async (c) => {
  try {
    const body = await c.req.json();
    
    const parseResult = LogBatchSchema.safeParse(body);
    
    if (!parseResult.success) {
      logger.warn({
        evt: 'ingest_validation_failed',
        error: parseResult.error.message,
      }, 'Log batch validation failed');
      
      return c.json({ error: 'Invalid log batch format' }, 400);
    }

    const batch = parseResult.data;

    if (!checkClockSkew(batch.sig.ts)) {
      logSecurityEvent('SEC_INTEGRITY_FAIL', {
        reason: 'clock_skew',
        signatureTs: batch.sig.ts,
      });
      
      return c.json({ error: 'Clock skew too large' }, 400);
    }

    const payload = { items: batch.logs, ts: batch.sig.ts };
    if (!verifySignature(payload, batch.sig.hmac)) {
      logSecurityEvent('SEC_SIGNATURE_INVALID', {
        reason: 'hmac_mismatch',
      });
      
      return c.json({ error: 'Invalid signature' }, 401);
    }

    for (const log of batch.logs) {
      const correlationId = (c.get as any)('correlationId') as string | undefined;
      const logData = {
        ...log,
        corr: {
          ...log.corr,
          correlationId: log.corr?.correlationId || correlationId || '',
        },
      };

      switch (log.lvl) {
        case 'TRACE':
        case 'DEBUG':
          logger.debug(logData, log.msg);
          break;
        case 'INFO':
          logger.info(logData, log.msg);
          break;
        case 'NOTICE':
          logger.info(logData, log.msg);
          break;
        case 'WARN':
          logger.warn(logData, log.msg);
          break;
        case 'ERROR':
          logger.error(logData, log.msg);
          break;
        case 'FATAL':
          logger.fatal(logData, log.msg);
          break;
        case 'SECURITY':
          logSecurityEvent(log.evt, logData);
          break;
      }
    }

    logger.info({
      evt: 'logs_ingested',
      count: batch.logs.length,
    }, `Ingested ${batch.logs.length} logs`);

    return c.json({ success: true, count: batch.logs.length });
  } catch (error) {
    logger.error({
      evt: 'ingest_error',
      error: error instanceof Error ? error.message : String(error),
    }, 'Failed to ingest logs');
    
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;
