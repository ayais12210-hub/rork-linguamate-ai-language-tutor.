import { MonitoringUtils } from '@/lib/monitoring';

export const Analytics = {
  init: (userId?: string | null) => MonitoringUtils.initializeAll(userId ?? undefined),
  cleanup: () => MonitoringUtils.cleanup(),
};
