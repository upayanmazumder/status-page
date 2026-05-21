"use client";

import { useEffect } from "react";
import { useToastStore } from "@/stores/toast";

const toastStyles = {
  success: "bg-green-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  warning: "bg-yellow-500",
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: { message: string; type: keyof typeof toastStyles; duration?: number };
  onRemove: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onRemove, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast.duration, onRemove]);

  return (
    <div
      className={`${toastStyles[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] animate-in slide-in-from-right`}
    >
      <span className="flex-1">{toast.message}</span>
      <button onClick={onRemove} className="text-white/80 hover:text-white">
        x
      </button>
    </div>
  );
}
