import { useCallback, useEffect, useState } from "react";

export default function useRequestMultiple<T>({
  urls,
  pickFields,
  options = {},
}: UseRequestPrams<T>) {
  const {
    method = "GET",
    headers = { "Content-Type": "application/json" },
    body,
    manual = false,
  } = options;

  const requestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  };

  const [data, setData] = useState<Partial<ElementType<T>>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!urls || urls.length === 0) {
      setLoading(false);
      return null;
    }

    const _url = import.meta.env.VITE_API_URL;

    try {
      const responses = await Promise.all(
        urls.map(async (url) => {
          const res = await fetch(_url + url, requestInit);
          if (!res.ok) {
            throw new Error(`Http Error! Status: ${res.status}`);
          }
          const data = await res.json();
          return data.body as ElementType<T>;
        })
      );

      const filteredData = pickFields
        ? responses.map((item) => pickFieldsFromObject(item, pickFields))
        : responses;

      setData(filteredData);
    } catch (error) {
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  }, [urls, method, headers, body]);

  useEffect(() => {
    if (!manual && method === "GET") {
      execute();
    }
  }, []);

  return { data, error, loading, execute };
}

function pickFieldsFromObject<T>(
  obj: ElementType<T>,
  fields: (keyof ElementType<T>)[]
): Partial<ElementType<T>> {
  const picked: Partial<ElementType<T>> = {};
  for (const field of fields) {
    picked[field] = obj[field];
  }
  return picked;
}
