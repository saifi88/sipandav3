// =====================================================================
// ZONA GAME: daftar game yang tersedia untuk siswa.
// Menerima `games` (dari backend atau SAMPLE_GAMES) dan `gameResults`
// untuk menampilkan skor terbaik siswa.
// =====================================================================

// Zona Game: daftar game bonus (tidak memengaruhi nilai tugas formal).
// Helper GAME_TYPE_META / bestScoreForGame berasal dari games/GameShell.js bila ada.

function GameHub({ games, gameResults, currentUser, onPlay, onBack, exams = [], contextExamId = null }) {
    const [filterMapel, setFilterMapel] = React.useState("Semua");

    const availableMapel = ["Semua", ...MAPEL_LIST.filter(m => games.some(g => g.mapel === m))];
    const shownGames = games.filter(g => filterMapel === "Semua" || g.mapel === filterMapel);

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

    const totalPlayed = new Set((gameResults || []).filter(r => r.nisn === currentUser.nisn).map(r => r.gameId)).size;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-bold text-sm flex items-center gap-1 cursor-pointer">
                        <Icon name="chevron-left" size={18} /> Kembali
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">🎮 Zona Game</h2>
                        <p className="text-xs text-slate-500">Belajar sambil bermain. Kamu sudah mencoba {totalPlayed} dari {games.length} game.</p>
                    </div>
                </div>
            </div>

            {/* Filter mapel */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {availableMapel.map(m => (
                    <button
                        key={m}
                        onClick={() => setFilterMapel(m)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors cursor-pointer
                            ${filterMapel === m ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"}`}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {shownGames.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-slate-400 font-medium">Belum ada game untuk mata pelajaran ini.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {shownGames.map(game => {
                        const meta = (typeof GAME_TYPE_META !== "undefined" && GAME_TYPE_META[game.type]) || { label: game.type, emoji: "🎲", desc: "" };
                        const best = bestScoreFor(game.id);
                        const linkedTitle = examTitleFor(game);
                        const isContext = contextExamId && String(game.linkedExamId) === String(contextExamId);
                        const stars = best === null ? 0 : scoreToStars(best);
                        return (
                            <div key={game.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-xl bg-violet-100 text-2xl flex items-center justify-center shrink-0">{meta.emoji}</div>
                                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-slate-100 text-slate-600">{game.mapel}</span>
                                </div>
                                <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wide">{meta.label} · Bonus</p>
                                <h3 className="font-bold text-slate-800 leading-snug">{game.title}</h3>
                                <p className="text-xs text-slate-500 mt-1 flex-1">{meta.desc} · {(game.pairs || []).length} pasangan · {game.duration || 3} menit</p>
                                {linkedTitle && (
                                    <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 mt-2 font-semibold">🎯 Latihan bonus untuk: {linkedTitle}</p>
                                )}
                                {isContext && (
                                    <p className="text-[11px] text-violet-700 font-bold mt-1">★ Direkomendasikan untuk tugas ini</p>
                                )}

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                                    <div className="text-xs">
                                        {best === null ? (
                                            <span className="text-slate-400 italic">Belum dimainkan</span>
                                        ) : (
                                            <span className="font-bold text-slate-700">
                                                Terbaik: <span className="text-violet-600">{best}</span>{" "}
                                                <span className="text-amber-400">{"★".repeat(stars)}</span><span className="text-slate-300">{"★".repeat(3 - stars)}</span>
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => onPlay(game)}
                                        className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                                    >
                                        ▶ Main
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
