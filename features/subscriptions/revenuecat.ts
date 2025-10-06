import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * RevenueCat Integration
 * 
 * Handles in-app purchases and subscriptions across iOS, Android, and Web.
 * 
 * Features:
 * - Cross-platform IAP management
 * - Subscription entitlement checking
 * - Restore purchases
 * - Promo code support
 */

// Subscription entitlements
export const ENTITLEMENTS = {
  PREMIUM: 'premium',
  PRO: 'pro',
} as const;

// Product identifiers
export const PRODUCTS = {
  MONTHLY: 'premium_monthly',
  YEARLY: 'premium_yearly',
  LIFETIME: 'premium_lifetime',
} as const;

let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 * Must be called early in app lifecycle
 */
export async function initializeRevenueCat(): Promise<void> {
  if (isInitialized) {
    console.log('[RevenueCat] Already initialized');
    return;
  }

  try {
    const apiKey = Constants.expoConfig?.extra?.revenueCatApiKey || process.env.EXPO_PUBLIC_RC_API_KEY;
    
    if (!apiKey) {
      console.warn('[RevenueCat] API key not configured, IAP disabled');
      return;
    }

    // Configure SDK
    await Purchases.configure({
      apiKey,
      ...(Platform.OS === 'ios' && { usesStoreKit2IfAvailable: true }),
    });

    // Set log level
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);

    isInitialized = true;
    console.log('[RevenueCat] Initialized successfully');
  } catch (error) {
    console.error('[RevenueCat] Failed to initialize:', error);
    throw error;
  }
}

/**
 * Identify user for cross-device subscription sync
 */
export async function identifyUser(userId: string): Promise<void> {
  try {
    await Purchases.logIn(userId);
    console.log('[RevenueCat] User identified:', userId);
  } catch (error) {
    console.error('[RevenueCat] Failed to identify user:', error);
    throw error;
  }
}

/**
 * Log out user
 */
export async function logoutUser(): Promise<void> {
  try {
    await Purchases.logOut();
    console.log('[RevenueCat] User logged out');
  } catch (error) {
    console.error('[RevenueCat] Failed to logout user:', error);
    throw error;
  }
}

/**
 * Get available offerings (subscription packages)
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('[RevenueCat] Failed to get offerings:', error);
    return null;
  }
}

/**
 * Purchase a package
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    console.log('[RevenueCat] Purchase successful');
    return customerInfo;
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('[RevenueCat] User cancelled purchase');
    } else {
      console.error('[RevenueCat] Purchase failed:', error);
    }
    throw error;
  }
}

/**
 * Restore purchases
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log('[RevenueCat] Purchases restored');
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Failed to restore purchases:', error);
    throw error;
  }
}

/**
 * Get customer info (current subscription status)
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('[RevenueCat] Failed to get customer info:', error);
    throw error;
  }
}

/**
 * Check if user has active entitlement
 */
export async function hasActiveEntitlement(entitlement: string): Promise<boolean> {
  try {
    const customerInfo = await getCustomerInfo();
    return (
      typeof customerInfo.entitlements.active[entitlement] !== 'undefined'
    );
  } catch (error) {
    console.error('[RevenueCat] Failed to check entitlement:', error);
    return false;
  }
}

/**
 * Check if user is premium
 */
export async function isPremiumUser(): Promise<boolean> {
  return await hasActiveEntitlement(ENTITLEMENTS.PREMIUM);
}

/**
 * Get all active entitlements
 */
export async function getActiveEntitlements(): Promise<string[]> {
  try {
    const customerInfo = await getCustomerInfo();
    return Object.keys(customerInfo.entitlements.active);
  } catch (error) {
    console.error('[RevenueCat] Failed to get active entitlements:', error);
    return [];
  }
}

/**
 * Apply promo code
 */
export async function applyPromoCode(code: string): Promise<CustomerInfo> {
  try {
    // Note: This is iOS only
    if (Platform.OS === 'ios') {
      const customerInfo = await Purchases.presentCodeRedemptionSheet();
      console.log('[RevenueCat] Promo code applied');
      return customerInfo;
    }
    throw new Error('Promo codes are only supported on iOS');
  } catch (error) {
    console.error('[RevenueCat] Failed to apply promo code:', error);
    throw error;
  }
}

/**
 * Set user attributes for targeting
 */
export async function setUserAttributes(attributes: Record<string, string | null>): Promise<void> {
  try {
    await Purchases.setAttributes(attributes);
    console.log('[RevenueCat] User attributes set');
  } catch (error) {
    console.error('[RevenueCat] Failed to set user attributes:', error);
  }
}

/**
 * Listen to customer info updates
 */
export function addCustomerInfoUpdateListener(
  listener: (info: CustomerInfo) => void
): () => void {
  Purchases.addCustomerInfoUpdateListener(listener);
  
  // Return cleanup function
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}
