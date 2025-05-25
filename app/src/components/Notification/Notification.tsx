"use client";

import {
  useState,
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import clsx from "clsx";

export type NotificationType = "success" | "error" | "info" | "warning";

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  notify: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const removalQueue = useRef<NodeJS.Timeout[]>([]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      removalQueue.current.forEach(clearTimeout);
    };
  }, []);

  const notify = (message: string, type: NotificationType = "info") => {
    const id = crypto.randomUUID();
    setNotifications((prev) => [...prev, { id, message, type }]);

    // Schedule removal with incremental delay to stagger disappear
    const timeoutId = setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      // Remove this timeout from queue after execution
      removalQueue.current = removalQueue.current.filter(
        (t) => t !== timeoutId
      );
    }, 4000 + notifications.length * 300);

    removalQueue.current.push(timeoutId);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <motion.div
        className="fixed bottom-4 right-4 z-50 flex flex-col-reverse space-y-2 space-y-reverse"
        initial={false}
        animate="animate"
        exit="exit"
        layout
      >
        <AnimatePresence initial={false}>
          {notifications.map((n, index) => (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1, // stagger enter animation by index
              }}
              className={clsx(
                "flex items-center gap-3 px-4 py-2 rounded-xl shadow-lg text-white w-72",
                {
                  "bg-green-600": n.type === "success",
                  "bg-red-600": n.type === "error",
                  "bg-blue-600": n.type === "info",
                  "bg-yellow-500": n.type === "warning",
                }
              )}
            >
              <span className="flex-1 text-sm">{n.message}</span>
              <button
                onClick={() => removeNotification(n.id)}
                title="Close notification"
                aria-label="Close notification"
                className="opacity-80 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </NotificationContext.Provider>
  );
};
