// =====================================================================
// ZONA GAME (modern): lobby meriah untuk anak SD.
// Menerima `games` (dari backend atau SAMPLE_GAMES) dan `gameResults`
// untuk menampilkan skor terbaik siswa.
// =====================================================================

// Zona Game: daftar game bonus (tidak memengaruhi nilai tugas formal).
// Helper GAME_TYPE_META / bestScoreForGame berasal dari games/GameShell.js bila ada.

function GameHub({ games, gameResults, currentUser, onPlay, onBack, exams = [], contextExamId = null }) {
    const [filterMapel, setFilterMapel] = React.useState("Semua");
    const [query, setQuery] = React.useState("");

    const availableMapel = ["Semua", ...MAPEL_LIST.filter(m => games.some(g => g.mapel === m))];
    const shownGames = games.filter(g =>
        (filterMapel === "Semua" || g.mapel === filterMapel) &&
        (!query.trim() || String(g.title).toLowerCase().includes(query.trim().toLowerCase()))
    );

    const bestScoreFor = (gameId) => {
        if (typeof bestScoreForGame === "function") return bestScoreForGame(gameResults, currentUser.nisn, gameId);
        const mine = (gameResults || []).filter(r => r.nisn === currentUser.nisn && r.gameId === gameId);
        if (mine.length === 0) return null;
        return Math.max(...mine.map(r => Number(r.skor) || 0));
    };

    const examTitleFor = (game) => {
        if (!game.linkedExamId) return null;
        const ex = (exams || []).find(e => String(e.id) === String(game.linkedExamId));
        return ex ? ex.title : null;
    };

    const myResults = (gameResults || []).filter(r => String(r.nisn) === String(currentUser.nisn));
    const totalPlayed = new Set(myResults.map(r => r.gameId)).size;
    const totalStars = myResults.reduce((acc, r) => acc, 0) || shownGames.reduce((acc, g) => {
        const b = bestScoreFor(g.id);
        return acc + (b === null ? 0 : scoreToStars(b));
    }, 0);
    const pct = games.length > 0 ? Math.round((totalPlayed / games.length) * 100) : 0;

    return (
        <div className="space-y-5">
            {/* HERO */}
            <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400 text-white shadow-xl shadow-fuchsia-500/20">
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/20 blur-3xl game-float"></div>
                <div className="absolute -bottom-14 -left-8 w-56 h-56 rounded-full bg-black/10 blur-3xl"></div>
                <div className="absolute top-4 right-8 text-4xl game-float">🎮</div>
                <div className="absolute bottom-5 right-24 text-2xl game-float" style={{ animationDelay: "1.2s" }}>⭐</div>
                <div className="absolute top-6 right-40 text-2xl game-float hidden sm:block" style={{ animationDelay: "0.6s" }}>✨</div>
                <div className="relative p-5 sm:p-7">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0" title="Kembali">
                            <Icon name="chevron-left" size={20} />
                        </button>
                        <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80">Zona Game</p>
                            <h2 className="text-2xl sm:text-3xl font-black leading-tight truncate">Hai, {currentUser.name}! 👋</h2>
                        </div>
                    </div>
                    <p className="text-white/90 text-sm mt-2 max-w-xl font-medium">Pilih game yang akan kamu mainkan, kumpulkan ⭐, dan raih skor tertinggi.</p>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                        <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur text-xs font-black">🎯 {totalPlayed}/{games.length} dimainkan</span>
                        <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur text-xs font-black">⭐ {totalStars} bintang</span>
                        <span className="px-3 py-1.5 rounded-full bg-black/20 text-xs font-black">{pct}% petualang</span>
                    </div>
                    <div className="mt-4 h-3 rounded-full bg-black/20 overflow-hidden border border-white/20">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-white transition-all duration-700" style={{ width: `${pct}%` }}></div>
                    </div>
                    <div className="mt-4 relative max-w-md">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/70 text-sm">🔎</span>
                        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari game seru..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/95 text-slate-800 text-sm font-semibold outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-white/40" />
                    </div>
                </div>
            </div>

            {/* Filter mapel */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {availableMapel.map(m => {
                    const active = filterMapel === m;
                    return (
                        <button
                            key={m}
                            onClick={() => setFilterMapel(m)}
                            className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap border-2 transition-all active:scale-95 cursor-pointer shrink-0
                                ${active ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:-translate-y-0.5"}`}
                        >
                            {m}
                        </button>
                    );
                })}
            </div>

            {shownGames.length === 0 ? (
                <div className="text-center py-14 bg-white rounded-[1.75rem] border-2 border-dashed border-slate-200 shadow-sm">
                    <div className="text-6xl mb-3 game-float inline-block">🕹️</div>
                    <p className="font-black text-slate-700">Belum ada game di sini</p>
                    <p className="text-slate-400 text-sm font-medium">Coba kata kunci atau mapel lain ya!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {shownGames.map((game, gi) => {
                        const theme = (typeof gameTheme === "function" ? gameTheme(game.type) : null) || ((typeof GAME_TYPE_META !== "undefined" && GAME_TYPE_META[game.type]) || { label: game.type, emoji: "🎲", desc: "", grad: "from-violet-500 to-fuchsia-500", soft: "bg-violet-100 text-violet-700" });
                        const best = bestScoreFor(game.id);
                        const linkedTitle = examTitleFor(game);
                        const isContext = contextExamId && String(game.linkedExamId) === String(contextExamId);
                        const stars = best === null ? 0 : scoreToStars(best);
                        return (
                            <div key={game.id} className="game-card-in group bg-white rounded-[1.75rem] shadow-lg shadow-slate-900/5 border border-slate-100 overflow-hidden hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-violet-500/15 transition-all duration-300" style={{ animationDelay: `${Math.min(gi, 8) * 0.05}s` }}>
                                <div className={`relative bg-gradient-to-r ${theme.grad} p-5 text-white overflow-hidden`}>
                                    <div className="absolute -right-6 -top-8 text-[92px] leading-none opacity-25 rotate-12 group-hover:rotate-6 group-hover:scale-110 transition-transform">{theme.emoji}</div>
                                    <div className="absolute left-8 bottom-3 text-xl opacity-40">✨</div>
                                    <div className="relative flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/25 backdrop-blur border border-white/30">{game.mapel}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/25 backdrop-blur">{theme.label}</span>
                                    </div>
                                    <h3 className="relative font-black text-lg leading-snug mt-2.5 pr-16 drop-shadow-sm">{game.title}</h3>
                                    <p className="relative text-white/85 text-xs mt-1 font-medium">{theme.desc} · {(() => { const c = (typeof levelBankCounts === "function" ? levelBankCounts(game) : null); if (c && c.perLevel) return `🌱${c.mudah} 🔥${c.sedang} ⚡${c.sulit} soal`; return `${(game.pairs || []).length} soal dasar`; })()} · {game.duration || 3} mnt · 🌱🔥⚡ 3 level</p>
                                </div>
                                <div className="p-4">
                                    {linkedTitle && (
                                        <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-2.5 py-1.5 font-bold">🎯 Bonus untuk: {linkedTitle}</p>
                                    )}
                                    {isContext && (
                                        <p className="text-[11px] text-violet-700 font-black mt-1.5">★ Direkomendasikan untuk tugas ini</p>
                                    )}
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="text-xs">
                                            {best === null ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-500 font-bold">✨ Baru! Ayo coba</span>
                                            ) : (
                                                <span className="font-black text-slate-700">
                                                    <span className="text-2xl font-black text-slate-900">{best}</span>{" "}
                                                    <span className="text-amber-400 text-sm">{"★".repeat(stars)}</span><span className="text-slate-200 text-sm">{"★".repeat(3 - stars)}</span>
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => onPlay(game)}
                                            className={`px-5 py-2.5 rounded-2xl bg-gradient-to-r ${theme.grad} text-white text-xs font-black shadow-lg active:scale-95 hover:brightness-110 transition-all cursor-pointer`}
                                        >
                                            {best === null ? "▶ Main" : "▶ Main Lagi"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
