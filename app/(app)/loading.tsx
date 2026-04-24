export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="relative flex items-center justify-center">
        {/* Anneau externe pulsant */}
        <span
          className="absolute rounded-full border-2 border-[#D4AF37]/30 animate-ping"
          style={{ width: 120, height: 120, animationDuration: "1.6s" }}
        />
        {/* Anneau tournant */}
        <span
          className="absolute rounded-full border-2 border-transparent border-t-[#D4AF37] animate-spin"
          style={{ width: 96, height: 96, animationDuration: "1s" }}
        />
        {/* Logo */}
        <div className="relative flex items-center justify-center w-16 h-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Dolee Group"
            className="w-14 h-14 object-contain"
            style={{
              animation: "logoBreath 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes logoBreath {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(0.95); }
        }
      `}</style>
    </div>
  )
}
