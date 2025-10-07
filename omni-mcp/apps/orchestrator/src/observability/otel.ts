import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

export type { NodeSDK };

export function initializeOpenTelemetry(config: {
  otelEnabled: boolean;
  sentryDsn?: string;
  sampling: number;
}): NodeSDK | null {
  if (!config.otelEnabled) {
    return null;
  }

  const sdk = new NodeSDK({
    traceExporter: new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
    }),
    metricReader: new PrometheusExporter({
      port: 9464,
      endpoint: '/metrics',
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // Disable fs instrumentation to reduce noise
        },
      }),
    ],
  });

  sdk.start();
  return sdk;
}

export function shutdownOpenTelemetry(sdk: NodeSDK | null): Promise<void> {
  if (sdk) {
    return sdk.shutdown();
  }
  return Promise.resolve();
}