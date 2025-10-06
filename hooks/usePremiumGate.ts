import { useState, useEffect } from 'react';
import { isPremiumUser, getCustomerInfo, addCustomerInfoUpdateListener } from '@/features/subscriptions/revenuecat';

/**
 * Hook to check if user has premium access
 * 
 * Usage:
 * ```tsx
 * const { isPremium, loading, refresh } = usePremiumGate();
 * 
 * if (loading) return <Loading />;
 * if (!isPremium) return <PaywallScreen />;
 * 
 * return <PremiumFeature />;
 * ```
 */
export function usePremiumGate() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPremiumStatus = async () => {
    try {
      setLoading(true);
      const premium = await isPremiumUser();
      setIsPremium(premium);
    } catch (error) {
      console.error('[usePremiumGate] Error checking premium status:', error);
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPremiumStatus();

    // Listen for subscription changes
    const removeListener = addCustomerInfoUpdateListener((info) => {
      const hasPremium = Object.keys(info.entitlements.active).length > 0;
      setIsPremium(hasPremium);
    });

    return removeListener;
  }, []);

  return {
    isPremium,
    loading,
    refresh: checkPremiumStatus,
  };
}

/**
 * Hook to get detailed customer info
 */
export function useCustomerInfo() {
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCustomerInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await getCustomerInfo();
      setCustomerInfo(info);
    } catch (err) {
      console.error('[useCustomerInfo] Error fetching customer info:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerInfo();

    // Listen for updates
    const removeListener = addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info);
    });

    return removeListener;
  }, []);

  return {
    customerInfo,
    loading,
    error,
    refresh: fetchCustomerInfo,
  };
}
