import { useAppStore } from '../store/useAppStore';

export default function ToastStack() {
  const toasts = useAppStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          <span className="toast-icon">{toast.icon}</span>
          <span>{toast.text}</span>
        </div>
      ))}
    </div>
  );
}
