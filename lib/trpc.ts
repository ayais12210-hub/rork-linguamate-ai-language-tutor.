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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        try {
          const res = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
              ...(options?.headers || {}),
            },
          });
          const ct = res.headers.get("content-type") ?? "";
          if (ct.includes("text/html")) {
            console.warn(
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
          return res as Response;
        } catch (error) {
          // Handle network errors gracefully
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            console.warn("[tRPC] Backend not available, will use fallback content");
            throw new Error("Backend not available");
          }
          // Handle other network-related errors
          if (error instanceof Error && (
            error.message.includes('NetworkError') ||
            error.message.includes('connection refused') ||
            error.message.includes('timeout') ||
            error.message.includes('ECONNREFUSED')
          )) {
            console.warn("[tRPC] Network error, will use fallback content:", error.message);
            throw new Error("Backend not available");
          }
          throw error;
        } finally {
          clearTimeout(timeoutId);
        }
      },
    }),
  ],
});
