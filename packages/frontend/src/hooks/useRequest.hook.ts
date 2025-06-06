import { useCallback, useEffect, useState } from "react";
import { isFormData } from "../utils/isFormData";

interface UserRequestOptionsWithAuth extends UseRequestOptions {
  onTokenRefresh?: () => Promise<string | null>;
}

export default function useRequest<T>(url: string, options: UserRequestOptionsWithAuth = {}) {
  const {
    method = "GET",
    headers = { "Content-Type": "application/json" },
    credentials = "include",
    body,
    manual = false,
    params,
    accessToken,
    onTokenRefresh,
  } = options;

  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<T | null>(null);

  const makeRequest = useCallback(
    async (requestUrl: string, requestHeaders: HeadersInit, requestBody: any) => {
      return await fetch(requestUrl, {
        method,
        headers: requestHeaders,
        credentials,
        body: requestBody,
      });
    },
    [method, credentials]
  );

  const execute = useCallback(
    async (overrideBody?: any): Promise<{ data: T | null; error: string | null }> => {
      setLoading(true);
      setError(null);

      let _url = import.meta.env.VITE_API_URL + url;
      let currentAccessToken = accessToken;

      const baseHeaders: HeadersInit = {
        ...headers,
      };

      if (params) {
        const urlParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          urlParams.append(key, String(value));
        });
        _url += `?${urlParams.toString()}`;
      }

      const requestBody = body
        ? !isFormData(body)
          ? JSON.stringify(body)
          : body
        : overrideBody
        ? !isFormData(overrideBody)
          ? JSON.stringify(overrideBody)
          : overrideBody
        : null;

      try {
        let requestHeaders: HeadersInit = {
          ...baseHeaders,
          ...(currentAccessToken ? { Authorization: `Bearer ${currentAccessToken}` } : {}),
        };

        let res = await makeRequest(_url, requestHeaders, requestBody);

        if (res.status === 401 && onTokenRefresh && currentAccessToken) {
          try {
            const newAccessToken = await onTokenRefresh();
            if (newAccessToken) {
              currentAccessToken = newAccessToken;
              requestHeaders = {
                ...baseHeaders,
                Authorization: `Bearer ${currentAccessToken}`,
              };
              res = await makeRequest(_url, requestHeaders, requestBody);
            }
          } catch (error) {
            throw new Error("Access token refresh failed");
          }
        }

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
    [url, method, headers, body, accessToken, params, onTokenRefresh, makeRequest]
  );

  useEffect(() => {
    if (!manual && method === "GET") {
      execute();
    }
  }, [url]);

  return { data, error, loading, execute };
}
