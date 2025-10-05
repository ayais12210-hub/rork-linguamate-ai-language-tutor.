import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export interface OfflineStatus {
  isOffline: boolean;
  isConnected: boolean;
  connectionType: string | null;
  lastSync: Date | null;
  unsyncedCount: number;
}

export const offlineManager = {
  listeners: new Set<(status: OfflineStatus) => void>(),
  currentStatus: {
    isOffline: false,
    isConnected: true,
    connectionType: 'unknown',
    lastSync: null,
    unsyncedCount: 0,
  } as OfflineStatus,

  subscribe(listener: (status: OfflineStatus) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },

  notify() {
    this.listeners.forEach(listener => listener(this.currentStatus));
  },

  updateStatus(updates: Partial<OfflineStatus>) {
    this.currentStatus = { ...this.currentStatus, ...updates };
    this.notify();
  },

  setOffline(isOffline: boolean) {
    this.updateStatus({ isOffline, isConnected: !isOffline });
  },

  setLastSync(date: Date) {
    this.updateStatus({ lastSync: date });
  },

  setUnsyncedCount(count: number) {
    this.updateStatus({ unsyncedCount: count });
  },

  incrementUnsyncedCount() {
    this.updateStatus({ unsyncedCount: this.currentStatus.unsyncedCount + 1 });
  },

  decrementUnsyncedCount(amount: number = 1) {
    this.updateStatus({ 
      unsyncedCount: Math.max(0, this.currentStatus.unsyncedCount - amount) 
    });
  },
};

let unsubscribeNetInfo: (() => void) | null = null;

export function initializeOfflineManager() {
  if (unsubscribeNetInfo) {
    return;
  }

  if (__DEV__) {


    console.log('[OfflineManager] Initializing network listener');


  }

  unsubscribeNetInfo = NetInfo.addEventListener(state => {
    if (__DEV__) {

      console.log('[OfflineManager] Network state changed:', {
      isConnected: state.isConnected,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
    });

    }

    const isOffline = !state.isConnected || state.isInternetReachable === false;
    
    offlineManager.updateStatus({
      isOffline,
      isConnected: state.isConnected ?? false,
      connectionType: state.type,
    });
  });

  NetInfo.fetch().then(state => {
    const isOffline = !state.isConnected || state.isInternetReachable === false;
    offlineManager.updateStatus({
      isOffline,
      isConnected: state.isConnected ?? false,
      connectionType: state.type,
    });
  });
}

export function cleanupOfflineManager() {
  if (unsubscribeNetInfo) {
    if (__DEV__) {

      console.log('[OfflineManager] Cleaning up network listener');

    }
    unsubscribeNetInfo();
    unsubscribeNetInfo = null;
  }
}

export function useOfflineStatus(): OfflineStatus {
  const [status, setStatus] = useState<OfflineStatus>(offlineManager.currentStatus);

  useEffect(() => {
    const unsubscribe = offlineManager.subscribe(setStatus);
    setStatus(offlineManager.currentStatus);
    return () => {
      unsubscribe();
    };
  }, []);

  return status;
}
