import { useCallback, useEffect, useState } from "react";

export default function useRequest<T>(url: string, options: UseRequestOptions = {}) {
  const {
    method = "GET",
    headers = { "Content-Type": "application/json" },
    credentials = "include",
    body,
    manual = false,
    params,
  } = options;

  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (overrideBody?: any): Promise<{ data: T | null; error: string | null }> => {
      setLoading(true);
      setError(null);

      let _url = import.meta.env.VITE_API_URL + url;

      if (params) {
        const urlParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          urlParams.append(key, String(value));
        });
        _url += `?${urlParams.toString()}`;
      }
      try {
        const res = await fetch(_url, {
          method,
          headers,
          credentials,
          body: body ? JSON.stringify(body) : overrideBody ? JSON.stringify(overrideBody) : null,
        });

        const result: IResponse<T> = await res.json();

        if (!result.success) {
          const errbody = result.body as IResponseError;

          if (Array.isArray(errbody.message)) {
            const messages: Record<string, string> = {};
            errbody.message.map((item) => (messages[item.path] = item.msg));

            throw new Error(JSON.stringify(messages));
          }
          throw new Error(errbody.message);
        }

        const jsonData: T = result.body as T;

        setData(jsonData);
        return { data: jsonData, error: null };
      } catch (error) {
        setError(error as Error);
        const errorMessages = (error as Error).message;
        return { data: null, error: errorMessages };
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
