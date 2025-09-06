import { useEffect, useState } from 'react';

export default function useData(fetchFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let didCancel = false;
    async function fetchData() {
      setData(null);
      setLoading(true);
      setError(null);
      try {
        const data = await fetchFn();
        if (!didCancel) setData(data);
      } catch (error) {
        if (!didCancel) setError(error);
      } finally {
        if (!didCancel) setLoading(false);
      }
    }
    fetchData();

    return () => {
      didCancel = true;
    };
  }, [fetchFn]);
  return { data, loading, error };
}
