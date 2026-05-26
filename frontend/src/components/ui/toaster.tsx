'use client';

import { useToast } from '@/hooks/useToast';
import { Toast } from './toast';

export function Toaster() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        >
          {toast.message}
        </Toast>
      ))}
    </div>
  );
}
