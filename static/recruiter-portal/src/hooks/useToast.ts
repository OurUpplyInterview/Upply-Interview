import { useState, useCallback, useRef } from 'react';
import type { Toast } from '../interfaces';

export function useToast() {
  const [toast, setToast] = useState<Toast & { visible: boolean }>({
    message: '', type: '', visible: false,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback((message: string, type: Toast['type'] = '') => {
    clearTimeout(timerRef.current);
    setToast({ message, type, visible: true });
    timerRef.current = setTimeout(
      () => setToast(t => ({ ...t, visible: false })),
      3600
    );
  }, []);

  return { toast, showToast: show };
}
