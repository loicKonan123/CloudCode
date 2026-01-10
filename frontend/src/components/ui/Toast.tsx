'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

function Toast({ toast, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration ?? 4000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-green-900/90',
      border: 'border-green-700',
      iconColor: 'text-green-400',
    },
    error: {
      icon: XCircle,
      bg: 'bg-red-900/90',
      border: 'border-red-700',
      iconColor: 'text-red-400',
    },
    warning: {
      icon: AlertCircle,
      bg: 'bg-yellow-900/90',
      border: 'border-yellow-700',
      iconColor: 'text-yellow-400',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-900/90',
      border: 'border-blue-700',
      iconColor: 'text-blue-400',
    },
  };

  const { icon: Icon, bg, border, iconColor } = config[toast.type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${bg} ${border} border rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      }`}
    >
      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
      <p className="text-white text-sm flex-1">{toast.message}</p>
      <button
        onClick={handleClose}
        className="p-1 text-gray-400 hover:text-white rounded transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (type: ToastType, message: string, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const success = (message: string, duration?: number) => addToast('success', message, duration);
  const error = (message: string, duration?: number) => addToast('error', message, duration);
  const warning = (message: string, duration?: number) => addToast('warning', message, duration);
  const info = (message: string, duration?: number) => addToast('info', message, duration);

  return {
    toasts,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
