import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { tutorDataFetcher, TutorDataFetchError, TutorDataValidationError } from "@/lib/services/tutor-data-fetcher";

// Input validation schemas
const fetchTutorDataInputSchema = z.object({
  url: z.string().url("Invalid URL format"),
  options: z.object({
    useCache: z.boolean().optional().default(true),
    timeout: z.number().min(1000).max(120000).optional().default(30000),
    validate: z.boolean().optional().default(true),
  }).optional().default({}),
});

const fetchMultipleTutorDataInputSchema = z.object({
  urls: z.array(z.string().url("Invalid URL format")).min(1).max(10),
  options: z.object({
    useCache: z.boolean().optional().default(true),
    timeout: z.number().min(1000).max(120000).optional().default(30000),
    validate: z.boolean().optional().default(true),
    concurrency: z.number().min(1).max(5).optional().default(3),
  }).optional().default({}),
});

const clearCacheInputSchema = z.object({
  url: z.string().url("Invalid URL format").optional(),
});

// tRPC procedures
export const fetchTutorDataProcedure = publicProcedure
  .input(fetchTutorDataInputSchema)
  .mutation(async ({ input }) => {
    try {
      const { url, options } = input;
      
      // Validate URL format
      if (!tutorDataFetcher.constructor.isValidUrl(url)) {
        throw new Error("Invalid URL format");
      }

      const data = await tutorDataFetcher.fetchTutorData(url, options);
      
      return {
        success: true,
        data,
        url,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[tRPC] Error fetching tutor data:", error);
      
      if (error instanceof TutorDataFetchError) {
        return {
          success: false,
          error: {
            type: "fetch_error",
            message: error.message,
            status: error.status,
            url: error.url,
          },
          data: null,
        };
      }
      
      if (error instanceof TutorDataValidationError) {
        return {
          success: false,
          error: {
            type: "validation_error",
            message: error.message,
            validationErrors: error.validationErrors.errors,
          },
          data: null,
        };
      }
      
      return {
        success: false,
        error: {
          type: "unknown_error",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        },
        data: null,
      };
    }
  });

export const fetchMultipleTutorDataProcedure = publicProcedure
  .input(fetchMultipleTutorDataInputSchema)
  .mutation(async ({ input }) => {
    try {
      const { urls, options } = input;
      
      // Validate all URLs
      const invalidUrls = urls.filter(url => !tutorDataFetcher.constructor.isValidUrl(url));
      if (invalidUrls.length > 0) {
        throw new Error(`Invalid URLs: ${invalidUrls.join(", ")}`);
      }

      const results = await tutorDataFetcher.fetchMultipleTutorData(urls, options);
      
      return {
        success: true,
        results,
        timestamp: new Date().toISOString(),
        summary: {
          total: results.length,
          successful: results.filter(r => r.data !== null).length,
          failed: results.filter(r => r.error !== null).length,
        },
      };
    } catch (error) {
      console.error("[tRPC] Error fetching multiple tutor data:", error);
      
      return {
        success: false,
        error: {
          type: "batch_error",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        },
        results: [],
      };
    }
  });

export const clearTutorDataCacheProcedure = publicProcedure
  .input(clearCacheInputSchema)
  .mutation(async ({ input }) => {
    try {
      const { url } = input;
      tutorDataFetcher.clearCache(url);
      
      return {
        success: true,
        message: url ? `Cache cleared for ${url}` : "All cache cleared",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[tRPC] Error clearing cache:", error);
      
      return {
        success: false,
        error: {
          type: "cache_error",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        },
      };
    }
  });

export const getTutorDataCacheStatsProcedure = publicProcedure
  .query(async () => {
    try {
      const stats = tutorDataFetcher.getCacheStats();
      
      return {
        success: true,
        stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[tRPC] Error getting cache stats:", error);
      
      return {
        success: false,
        error: {
          type: "stats_error",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        },
        stats: null,
      };
    }
  });

// Create the router
export const tutorDataRouter = createTRPCRouter({
  fetch: fetchTutorDataProcedure,
  fetchMultiple: fetchMultipleTutorDataProcedure,
  clearCache: clearTutorDataCacheProcedure,
  getCacheStats: getTutorDataCacheStatsProcedure,
});