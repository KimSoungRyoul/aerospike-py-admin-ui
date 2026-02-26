import { useState, useEffect, useCallback, useRef } from "react";
import { getErrorMessage } from "@/lib/utils";

interface UseAsyncDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = [],
): UseAsyncDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  const requestIdRef = useRef(0);
  fetcherRef.current = fetcher;

  const fetch = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (requestIdRef.current === requestId) {
        setData(result);
      }
    } catch (err) {
      if (requestIdRef.current === requestId) {
        setError(getErrorMessage(err));
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetch();
    const ref = requestIdRef;
    return () => {
      ref.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: fetch };
}
