import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";
import Constants from "expo-constants";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (envUrl && envUrl.length > 0) {
    console.log('[tRPC] Using EXPO_PUBLIC_RORK_API_BASE_URL:', envUrl);
    return envUrl;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const origin = window.location.origin;
    console.log('[tRPC] Using window origin for web:', origin);
    return origin;
  }

  const hostUri = (Constants?.expoConfig as any)?.hostUri || (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;
  if (hostUri && typeof hostUri === 'string') {
    let cleaned = hostUri.trim();
    cleaned = cleaned.replace(/^exp:\/\//i, '').replace(/^ws:\/\//i, '').replace(/^wss:\/\//i, '');
    const hasProtocol = /^https?:\/\//i.test(cleaned);
    const base = hasProtocol ? cleaned : `http://${cleaned}`;
    console.log('[tRPC] Using Expo hostUri for native:', base);
    return base;
  }

  console.log('[tRPC] Fallback base URL http://localhost:8081');
  return "http://localhost:8081";
};

const apiUrl = `${getBaseUrl()}/api/trpc`;
console.log('[tRPC] Final API URL:', apiUrl);

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: apiUrl,
      transformer: superjson,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          headers: {
            ...(options?.headers || {}),
          },
        });
      },
    }),
  ],
});