export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: '#04060f' }}>
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1ec677, #0d6640)', boxShadow: '0 0 40px rgba(30,198,119,0.25)' }}>
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
              <path d="M14 3L25 9V19L14 25L3 19V9L14 3Z" fill="white" fillOpacity="0.95"/>
            </svg>
          </div>
          <div className="absolute inset-0 rounded-2xl animate-ping opacity-20"
            style={{ background: 'linear-gradient(135deg, #1ec677, #0d6640)' }} />
        </div>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce-soft"
              style={{ background: '#3dd68a', animationDelay: `${i * 0.15}s`, opacity: 0.6 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
