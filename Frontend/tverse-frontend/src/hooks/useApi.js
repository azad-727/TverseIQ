import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Generic API hook with loading, error, and data state management.
 *
 * Usage:
 *   const { data, loading, error, execute } = useApi(productApi.getAll);
 *   const { data, loading, error, execute } = useApi(productApi.getAll, { immediate: true });
 */
export function useApi(apiFunc, { immediate = false } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunc(...args);
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Something went wrong');
        setLoading(false);
      }
      throw err;
    }
  }, [apiFunc]);

  // Auto-fetch on mount if immediate
  const initialFetchDone = useRef(false);
  useEffect(() => {
    if (immediate && !initialFetchDone.current) {
      initialFetchDone.current = true;
      execute();
    }
  }, [immediate, execute]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset, setData };
}


/**
 * Toast notification context and hook.
 * Provides addToast / removeToast for the app-wide toast system.
 */
import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback: console-based toasts when no provider is mounted
    return {
      success: (msg) => console.log('[Toast:success]', msg),
      error:   (msg) => console.error('[Toast:error]', msg),
      warning: (msg) => console.warn('[Toast:warning]', msg),
      info:    (msg) => console.info('[Toast:info]', msg),
    };
  }
  return ctx;
}
