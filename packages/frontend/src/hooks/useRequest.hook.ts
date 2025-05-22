import { useCallback, useEffect, useState } from "react";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface UseRequestOptions {
  method?: HttpMethod;
  headers?: HeadersInit;
  body?: any;
  manual?: boolean;
  params?: Record<string, string | number>;
}

function useRequest<T>(url: string, options: UseRequestOptions = {}) {
  const {
    method = "GET",
    headers = { "Content-Type": "application/json" },
    body,
    manual = false,
    params,
  } = options;

  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (overrideBody?: any) => {
      setLoading(true);
      setError(null);

      let _url = import.meta.env.VITE_API_URL + url;

      try {
        if (params) {
          const urlParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            urlParams.append(key, String(value));
          });
          _url += `?${urlParams.toString()}`;
        }

        const res = await fetch(_url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : overrideBody ? JSON.stringify(overrideBody) : null,
        });

        if (!res.ok) {
          throw new Error(`Http Error! Status: ${res.status}`);
        }
        const result = await res.json();

        if (!result.success) {
          throw new Error(`Error! Message: ${result.message}`);
        }

        const jsonData: T = result.body;

        setData(jsonData);
        return jsonData;
      } catch (error) {
        setError(error as Error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [url, method, headers, body]
  );

  useEffect(() => {
    if (!manual && method === "GET") {
      execute();
    }
  }, []);

  return { data, error, loading, execute };
}

export default useRequest;
