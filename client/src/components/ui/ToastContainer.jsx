import { useNotifications } from '../../context/NotificationContext'

const TYPES = {
  urgent:  { icon: '🚨', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.2)',   bar: '#ef4444' },
  success: { icon: '✅', bg: 'rgba(61,214,138,0.10)',  border: 'rgba(61,214,138,0.2)', bar: '#3dd68a' },
  info:    { icon: 'ℹ️', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', bar: '#4a90e2' },
  warning: { icon: '⚠️', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.2)',  bar: '#f59e0b' },
}

export default function ToastContainer() {
  const { toasts, removeToast } = useNotifications()

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 w-[340px] max-w-[calc(100vw-2.5rem)]">
      {toasts.map(toast => {
        const t = TYPES[toast.type] || TYPES.info
        return (
          <div key={toast.id} className="animate-fade-up relative rounded-xl overflow-hidden"
            style={{ background: t.bg, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            {/* Color bar */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: t.bar }} />
            <div className="flex items-start gap-3 px-4 py-3.5 pl-5">
              <span className="text-base mt-0.5 flex-shrink-0">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{toast.title}</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-2)' }}>{toast.message}</p>
              </div>
              <button onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 mt-0.5 opacity-40 hover:opacity-80 transition-opacity text-lg leading-none"
                style={{ color: 'var(--text-1)' }}>×</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
