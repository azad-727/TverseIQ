import { useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastContext } from '../../hooks/useApi';
import './Toast.css';

let toastId = 0;
const ICONS = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };
const DURATION = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((variant, message) => {
    const id = ++toastId;
    setToasts(prev => {
      const next = [...prev, { id, variant, message }];
      return next.length > 5 ? next.slice(-5) : next;
    });
    timersRef.current[id] = setTimeout(() => removeToast(id), DURATION);
  }, [removeToast]);

  const ctx = {
    success: (msg) => addToast('success', msg),
    error: (msg) => addToast('error', msg),
    warning: (msg) => addToast('warning', msg),
    info: (msg) => addToast('info', msg),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="toast-container">
        {toasts.map(({ id, variant, message }) => {
          const Icon = ICONS[variant];
          return (
            <div key={id} className={`toast toast-${variant}`}>
              <Icon size={18} className="toast-icon" />
              <span className="toast-message">{message}</span>
              <button className="toast-close" onClick={() => removeToast(id)}><X size={14} /></button>
              <div className="toast-progress"><div className="toast-progress-bar" /></div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
