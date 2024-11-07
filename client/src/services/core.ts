"use server";
/**
 * Code API configuration
 */

import { REVALIDATE_TIME } from "@/utils";

export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a promise that rejects after a specified timeout
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise<void>} - A promise that rejects after the specified timeout
 */
export const timeout = (ms: number): Promise<void> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timed out after ${ms} ms`)), ms);
  });
};

// Define a base URL from environment variables
const baseUrl = process.env.API_URL;

// Define a type for the possible options in the fetch request
interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  next?: {
    revalidate?: number;
  };
  timeoutMs?: number;
}

// Define an interface for the API response
interface ApiResponse<T> {
  status: number;
  data: T;
}

/**
 * Fetches data from an API endpoint with a timeout and dynamic authorization token
 * @param {string} endpoint - The API endpoint to fetch from
 * @param {FetchOptions} options - Fetch options
 * @returns {Promise<ApiResponse<T>>} - Parsed JSON response with status code
 */
export async function fetchAPI<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = "GET",
    headers = {},
    body = null,
    next,
    timeoutMs = 5000,
  } = options;

  const url = `${baseUrl}/api${endpoint}`;

  // Construct headers with optional Authorization token
  const fetchHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  try {
    const response = (await Promise.race([
      fetch(url, {
        method,
        headers: fetchHeaders,
        body: body ? JSON.stringify(body) : null,
        next: { revalidate: REVALIDATE_TIME, ...next },
      }),
      timeout(timeoutMs),
    ])) as Response;

    const data = (await response.json()) as T;

    return {
      status: response.status,
      data,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("timed out")) {
      console.error(`Request to ${url} timed out after ${timeoutMs} ms`);
    }
    throw error;
  }
}
