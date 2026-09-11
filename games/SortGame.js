// =====================================================================
// SORTIR CEPAT: ketuk benda, lalu ketuk keranjang kategorinya.
// Keranjang = nilai `right` yang berbeda (maks 4). Tepat +poin, salah −5.
// Bonus-only. Pas untuk materi klasifikasi (IPAS, dsb).
// =====================================================================

const SORT_BIN_GRADS = [
    "from-amber-400 to-orange-500",
    "from-sky-400 to-blue-500",
    "from-violet-400 to-purple-500",
    "from-pink-400 to-rose-500"
];
const SORT_BIN_EMOJI = ["🧺", "🪣", "📦", "🎁"];

function SortGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = game.pairs || [];

    const bins = React.useMemo(() => [...new Set(pairs.map(p => String(p.right)))].slice(0, 4), [game.id]);
    const items = React.useMemo(() => (
        shuffleArray(pairs.filter(p => bins.includes(String(p.right)))).slice(0, 12)
            .map((p, i) => ({ uid: i, text: p.left, cat: String(p.right) }))
    ), [game.id]);
    const total = items.length;

    const [placed, setPlaced] = React.useState({});
    const [selected, setSelected] = React.useState(null);
    const [benar, setBenar] = React.useState(0);
    const [salah, setSalah] = React.useState(0);
    const [shakeBin, setShakeBin] = React.useState(null);
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 3) * 60);
    const [finished, setFinished] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);

    const placedCount = Object.keys(placed).length;
    const score = total === 0 ? 0 : Math.max(0, Math.round((benar / total) * 100 - salah * 5));
    const progress = total > 0 ? Math.round((placedCount / total) * 100) : 0;
    const theme = (typeof gameTheme === "function" ? gameTheme("sort") : { grad: "from-teal-500 to-green-600" });
    const timeWarning = timeLeft <= 15 && !finished;

    React.useEffect(() => {
        if (finished) return;
        const t = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
        return () => clearInterval(t);
    }, [finished]);

    React.useEffect(() => {
        if (!finished && ((total > 0 && placedCount === total) || timeLeft === 0)) setFinished(true);
    }, [placedCount, timeLeft, total, finished]);

    React.useEffect(() => {
        if (!finished || reported.current) return;
        reported.current = true;
        if (placedCount === total) playGameTone(1046, 0.35, "triangle");
        onFinish && onFinish({
            gameId: game.id, title: game.title, mapel: game.mapel, type: "sort",
            skor: score, benar, salah,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    const dropTo = (bin) => {
        if (finished || selected === null || placed[selected]) return;
        const item = items.find(it => it.uid === selected);
        if (!item) { setSelected(null); return; }
        if (item.cat === bin) {
            setPlaced(p => ({ ...p, [selected]: bin }));
            setBenar(v => v + 1);
            playGameTone(880, 0.12);
        } else {
            setSalah(v => v + 1);
            setShakeBin(bin);
            playGameTone(160, 0.25, "sawtooth");
            setTimeout(() => setShakeBin(null), 450);
        }
        setSelected(null);
    };

    const handleExit = () => {
        if (!finished && placedCount > 0 && !window.confirm("Keluar dari game? Progres tidak akan disimpan.")) return;
        onExit();
    };

    const remaining = items.filter(it => !placed[it.uid]);

    return (
        <div className="min-h-screen bg-[#ecfdf5] flex flex-col select-none relative overflow-hidden">
            <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-300/40 blur-3xl"></div>
            <div className="pointer-events-none absolute top-1/3 -left-24 w-80 h-80 rounded-full bg-teal-300/40 blur-3xl"></div>

            <GameHud theme={{ ...theme, label: "Sortir Cepat", emoji: "🧺" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />

            <div className="relative max-w-3xl mx-auto w-full px-3 sm:px-5 pt-4">
                <div className="rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg p-3.5">
                    <div className="flex items-center justify-between gap-2 text-xs font-black">
                        <span className="px-2.5 py-1.5 rounded-full bg-emerald-100 text-emerald-700">🧺 {placedCount}/{total} tersortir</span>
                        <span className={`px-2.5 py-1.5 rounded-full ${salah ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-400"}`}>❌ {salah}</span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200/70">
                        <div className={`h-full rounded-full bg-gradient-to-r ${theme.grad} transition-all duration-500`} style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 text-center font-semibold">👆 Ketuk benda, lalu ketuk keranjang yang tepat!</p>
                </div>
            </div>

            <main className="relative flex-1 max-w-3xl mx-auto w-full p-3 sm:p-5 space-y-4">
                {/* Keranjang */}
                <div className={`grid gap-2.5 ${bins.length <= 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
                    {bins.map((bin, i) => {
                        const count = Object.values(placed).filter(b => b === bin).length;
                        const shaking = shakeBin === bin;
                        return (
                            <button key={bin} onClick={() => dropTo(bin)}
                                className={`rounded-3xl p-3 sm:p-4 text-center border-2 transition-all active:scale-95 cursor-pointer bg-gradient-to-b ${SORT_BIN_GRADS[i % SORT_BIN_GRADS.length]} border-white/60 shadow-lg text-white ${shaking ? "game-shake" : "hover:-translate-y-1"}`}>
                                <div className="text-4xl sm:text-5xl">{SORT_BIN_EMOJI[i % SORT_BIN_EMOJI.length]}</div>
                                <p className="font-black text-xs sm:text-sm mt-1 leading-tight drop-shadow">{bin}</p>
                                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-black/25 text-[11px] font-black">✓ {count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Benda */}
                <div className="bg-white/70 backdrop-blur rounded-[1.75rem] border border-white shadow-lg p-3.5 sm:p-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2.5">📦 Benda yang belum disortir</p>
                    {remaining.length === 0 ? (
                        <p className="text-center text-sm font-black text-emerald-600 py-3">🎉 Semua beres!</p>
                    ) : (
                        <div className="flex flex-wrap justify-center gap-2">
                            {remaining.map(it => (
                                <button key={it.uid} onClick={() => setSelected(prev => prev === it.uid ? null : it.uid)}
                                    className={`px-4 py-2.5 rounded-2xl text-sm font-black border-2 transition-all active:scale-95 cursor-pointer
                                        ${selected === it.uid ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-105 ring-4 ring-amber-300" : "bg-white border-slate-200 text-slate-700 shadow hover:-translate-y-0.5"}`}>
                                    {it.text}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {finished && <GameResultModal score={score} benar={benar} salah={salah} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel={placedCount === total ? "Semua tersortir rapi! 🧺" : "Waktu habis! ⏰"} onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
