import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";
import Constants from "expo-constants";

export const trpc = createTRPCReact<AppRouter>();

const getNativeBaseFromHostUri = (hostUri: string) => {
  let cleaned = hostUri.trim();
  cleaned = cleaned
    .replace(/^exp:\/\//i, "")
    .replace(/^ws:\/\//i, "")
    .replace(/^wss:\/\//i, "");
  if (!/^https?:\/\//i.test(cleaned)) cleaned = `http://${cleaned}`;
  return cleaned;
};

const getEnvBaseUrl = () => {
  const candidates = [
    process.env.EXPO_PUBLIC_BACKEND_URL,
    process.env.EXPO_PUBLIC_API_BASE_URL,
    process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
  ];
  for (const url of candidates) {
    if (url && url.length > 0) {
      console.log("[tRPC] Using env base URL:", url);
      return url.replace(/\/$/, "");
    }
  }
  return null;
};

const getBaseUrl = () => {
  const envUrl = getEnvBaseUrl();
  if (envUrl) return envUrl;

  if (Platform.OS === "web" && typeof window !== "undefined") {
    const origin = window.location.origin.replace(/\/$/, "");
    let basePath = "";
    try {
      const match = window.location.pathname.match(/^\/p\/[^/]+/);
      if (match && match[0]) {
        basePath = match[0];
      }
    } catch (e) {
      console.log("[tRPC] Path prefix detection failed", e);
    }
    const full = `${origin}${basePath}`.replace(/\/$/, "");
    console.log("[tRPC] Web detected, using base:", full, "(origin:", origin, "path:", basePath, ")");
    return full; // Backend is mounted at same origin (and possibly project prefix) under /api
  }

  const hostUri =
    (Constants as any)?.expoConfig?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;
  if (hostUri && typeof hostUri === "string") {
    const base = getNativeBaseFromHostUri(hostUri);
    console.log("[tRPC] Using Expo hostUri for native:", base);
    return base.replace(/\/$/, "");
  }

  console.log("[tRPC] Fallback base URL http://localhost:8081");
  return "http://localhost:8081";
};

const base = getBaseUrl();
const apiUrl = `${base}/api/trpc`;
console.log("[tRPC] Final API URL:", apiUrl);

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: apiUrl,
      transformer: superjson,
      fetch: async (url, options) => {
        // Use our enhanced HTTP client for tRPC requests
        const { httpClient } = await import('./http');
        
        try {
          // Convert fetch options to our HTTP client format
          const response = await httpClient.request(url, {
            method: options?.method || 'GET',
            headers: options?.headers as Record<string, string>,
            body: options?.body as string,
            timeout: 15000,
            retries: 2, // Retry tRPC calls
          });
          
          // Create a Response-like object for tRPC
          return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          // Convert our AppError back to a fetch error for tRPC
          if (error && typeof error === 'object' && 'kind' in error) {
            const appError = error as any;
            
            // Check for HTML response error
            if (appError.message?.includes('HTML') || appError.code === 'HTML_RESPONSE') {
              console.error(
                "[tRPC] HTML response received at",
                url,
                "— likely frontend index. Check backend base URL."
              );
              throw new Error(
                "Backend endpoint not found at " +
                  url +
                  ". Set EXPO_PUBLIC_BACKEND_URL to your API origin."
              );
            }
            
            // Create appropriate HTTP response for tRPC error handling
            const status = appError.kind === 'Auth' ? 401 :
                          appError.kind === 'Validation' ? 400 :
                          appError.kind === 'Server' ? 500 : 500;
                          
            return new Response(JSON.stringify({
              error: {
                message: appError.message,
                code: appError.code,
                data: appError.details,
              }
            }), {
              status,
              headers: {
                'Content-Type': 'application/json',
              },
            });
          }
          
          // Re-throw unknown errors
          throw error;
        }
      },
    }),
  ],
});
