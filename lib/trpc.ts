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
    const hasProtocol = /^https?:\/\//i.test(hostUri);
    const base = hasProtocol ? hostUri : `http://${hostUri}`;
    console.log('[tRPC] Using Expo hostUri for native:', base);
    return base;
  }

  console.log('[tRPC] Fallback base URL http://localhost:8081');
  return "http://localhost:8081";
};

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
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