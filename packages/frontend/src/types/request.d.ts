type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type ElementType<T> = T extends (infer U)[] ? U : T;

type UseRequestPrams<T> = {
  urls: string[];
  pickFields?: (keyof ElementType<T>)[];
  options?: Omit<UseRequestOptions, "params">;
};

interface UseRequestOptions {
  method?: HttpMethod;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  body?: any;
  manual?: boolean;
  params?: Record<string, string | number>;
  accessToken?: string | null;
}
