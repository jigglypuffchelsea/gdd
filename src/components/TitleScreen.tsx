interface Props {
  onStart: () => void;
}

export function TitleScreen({ onStart }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 text-center animate-slide-up">
        {/* Logo / Title */}
        <div className="mb-6">
          <div className="text-6xl mb-4">🏢</div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent mb-2">
            熵與奮鬥者
          </h1>
          <p className="text-slate-400 text-lg tracking-widest">ENTROPY & STRIVERS</p>
        </div>

        {/* Subtitle */}
        <p className="text-slate-400 max-w-md mx-auto mb-2 text-sm leading-relaxed">
          你是一間中小企業的 CEO。在接下來的五年（20 個季度）裡，
        </p>
        <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm leading-relaxed">
          你要在<span className="text-red-400"> 現金動脈</span>、
          <span className="text-pink-400"> 組織心跳</span>、
          <span className="text-green-400"> 市場根系</span>三條生命線之間做出取捨。
        </p>

        {/* Three lifelines preview */}
        <div className="flex gap-6 justify-center mb-10">
          <div className="bg-slate-800/60 backdrop-blur rounded-xl p-4 w-32 border border-slate-700/50">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-amber-400 font-bold text-sm">現金動脈</div>
            <div className="text-slate-500 text-xs mt-1">活下去的血液</div>
          </div>
          <div className="bg-slate-800/60 backdrop-blur rounded-xl p-4 w-32 border border-slate-700/50">
            <div className="text-2xl mb-1">💓</div>
            <div className="text-red-400 font-bold text-sm">組織心跳</div>
            <div className="text-slate-500 text-xs mt-1">團隊的戰鬥力</div>
          </div>
          <div className="bg-slate-800/60 backdrop-blur rounded-xl p-4 w-32 border border-slate-700/50">
            <div className="text-2xl mb-1">🌿</div>
            <div className="text-green-400 font-bold text-sm">市場根系</div>
            <div className="text-slate-500 text-xs mt-1">客戶與口碑</div>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={onStart}
          className="px-10 py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-lg rounded-xl shadow-lg shadow-amber-900/30 transition-all hover:scale-105 hover:shadow-amber-800/40 active:scale-95"
        >
          開始經營 →
        </button>

        <p className="text-slate-600 text-xs mt-6">存活 20 季 · 10 張決策牌 · 每個選擇都有伏筆</p>
      </div>
    </div>
  );
}
