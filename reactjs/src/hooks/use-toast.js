import { useState, useCallback } from 'react';

let toastId = 0;
const listeners = new Set();

function createToast({ title, description, variant = 'default' }) {
  const id = ++toastId;
  const toast = {
    id,
    title,
    description,
    variant,
    open: true,
  };
  listeners.forEach((listener) => listener(toast));
  return id;
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 5000);
  }, []);

  const toast = useCallback(({ title, description, variant }) => {
    const id = createToast({ title, description, variant });
    return id;
  }, []);

  useState(() => {
    const listener = (toast) => {
      addToast(toast);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [addToast]);

  return {
    toast,
    toasts,
  };
}

