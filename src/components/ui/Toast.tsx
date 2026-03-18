import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timerRef.current!);
          onDismiss();
          return 0;
        }
        return prev - (100 / 50); // 5 seconds / 50 steps = 100ms per step
      });
    }, 100);

    return () => clearInterval(timerRef.current!);
  }, [isPaused, onDismiss]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-900 border-emerald-700 text-emerald-100';
      case 'error':
        return 'bg-red-900 border-red-700 text-red-100';
      case 'warning':
        return 'bg-amber-900 border-amber-700 text-amber-100';
      default:
        return 'bg-slate-900 border-slate-700 text-slate-100';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      default:
        return <AlertCircle size={20} />;
    }
  };

  const getProgressColor = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-400';
      case 'error':
        return 'bg-red-400';
      case 'warning':
        return 'bg-amber-400';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`relative w-80 p-4 rounded-lg shadow-lg border overflow-hidden ${getStyles()}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onContextMenu={(e) => { e.preventDefault(); onDismiss(); }}
    >
      <div className="flex items-center gap-3">
        {getIcon()}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button onClick={onDismiss} className="hover:bg-white/10 p-1 rounded">
          <X size={16} />
        </button>
      </div>
      <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full">
        <motion.div
          className={`h-full ${getProgressColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};
