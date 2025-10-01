import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";
import Constants from "expo-constants";

export const trpc = createTRPCReact<AppRouter>();

const getNativeBaseFromHostUri = (hostUri: string) => {
  let cleaned = hostUri.trim();
  cleaned = cleaned.replace(/^exp:\/\//i, '').replace(/^ws:\/\//i, '').replace(/^wss:\/\//i, '');
  if (!/^https?:\/\//i.test(cleaned)) cleaned = `http://${cleaned}`;
  return cleaned;
};

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (envUrl && envUrl.length > 0) {
    console.log('[tRPC] Using EXPO_PUBLIC_RORK_API_BASE_URL:', envUrl);
    return envUrl.replace(/\/$/, '');
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Use relative path on web to avoid cross-origin and tunnel hostname issues
    console.log('[tRPC] Using relative URL on web');
    return '';
  }

  const hostUri = (Constants?.expoConfig as any)?.hostUri || (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;
  if (hostUri && typeof hostUri === 'string') {
    const base = getNativeBaseFromHostUri(hostUri);
    console.log('[tRPC] Using Expo hostUri for native:', base);
    return base.replace(/\/$/, '');
  }

  console.log('[tRPC] Fallback base URL http://localhost:8081');
  return "http://localhost:8081";
};

const base = getBaseUrl();
const apiUrl = Platform.OS === 'web' ? `/api/trpc` : `${base}/api/trpc`;
console.log('[tRPC] Final API URL:', apiUrl);

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: apiUrl,
      transformer: superjson,
      fetch(url, options) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 15000);
        return fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...(options?.headers || {}),
          },
        }).finally(() => clearTimeout(id));
      },
    }),
  ],
});