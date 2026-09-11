// =====================================================================
// BENAR ATAU SALAH KILAT: pernyataan muncul, siswa menilai ✅ / ❌.
// Separuh pernyataan benar (dari pairs), separuh salah (jawaban ditukar
// dengan pasangan lain). Bonus-only.
// =====================================================================

function TrueFalseGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = game.pairs || [];

    // Satu pernyataan per pair: genap = benar, ganjil = salah (diacak).
    const rounds = React.useMemo(() => {
        if (pairs.length === 0) return [];
        const arr = pairs.map((p, i) => {
            const isTrue = i % 2 === 0;
            let shown = p.right;
            if (!isTrue) {
                const other = pairs[(i + 3) % pairs.length];
                shown = (other && other.right !== p.right) ? other.right : (pairs[(i + 1) % pairs.length] || {}).right || "?";
            }
            return { left: p.left, shown, isTrue };
        });
        return shuffleArray(arr);
    }, [game.id]);
    const total = rounds.length;

    const [idx, setIdx] = React.useState(0);
    const [benar, setBenar] = React.useState(0);
    const [salah, setSalah] = React.useState(0);
    const [streak, setStreak] = React.useState(0);
    const [picked, setPicked] = React.useState(null);
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 3) * 60);
    const [finished, setFinished] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);

    const score = total === 0 ? 0 : Math.max(0, Math.round((benar / total) * 100 - salah * 5));
    const theme = (typeof gameTheme === "function" ? gameTheme("truefalse") : { grad: "from-rose-500 to-orange-500" });
    const timeWarning = timeLeft <= 15 && !finished;
    const cur = rounds[idx];

    React.useEffect(() => {
        if (finished) return;
        const t = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
        return () => clearInterval(t);
    }, [finished]);

    React.useEffect(() => {
        if (!finished && (idx >= total || timeLeft === 0)) setFinished(true);
    }, [idx, timeLeft, total, finished]);

    React.useEffect(() => {
        if (!finished || reported.current) return;
        reported.current = true;
        playGameTone(1046, 0.3, "triangle");
        onFinish && onFinish({
            gameId: game.id, title: game.title, mapel: game.mapel, type: "truefalse",
            skor: score, benar, salah,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    const judge = (choice) => {
        if (finished || picked !== null || !cur) return;
        setPicked(choice);
        const correct = (choice === "benar") === cur.isTrue;
        if (correct) {
            setBenar(v => v + 1);
            setStreak(s => s + 1);
            playGameTone(880, 0.12);
            if (streak + 1 >= 3) setTimeout(() => playGameTone(1174, 0.18, "triangle"), 140);
        } else {
            setSalah(v => v + 1);
            setStreak(0);
            playGameTone(160, 0.25, "sawtooth");
        }
        setTimeout(() => { setPicked(null); setIdx(i => i + 1); }, 650);
    };

    const handleExit = () => {
        if (!finished && (benar + salah) > 0 && !window.confirm("Keluar dari game? Progres tidak akan disimpan.")) return;
        onExit();
    };

    const verdict = picked !== null && cur ? ((picked === "benar") === cur.isTrue ? "correct" : "wrong") : null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-rose-200 via-orange-100 to-amber-50 flex flex-col select-none relative overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-rose-300/50 blur-3xl"></div>
            <div className="pointer-events-none absolute bottom-10 -left-20 w-72 h-72 rounded-full bg-orange-300/40 blur-3xl"></div>

            <GameHud theme={{ ...theme, label: "Benar atau Salah", emoji: "🤔" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />

            <main className="relative flex-1 max-w-xl mx-auto w-full p-3 sm:p-5 flex flex-col gap-3">
                <div className="flex items-center justify-center gap-2 text-xs font-black">
                    <span className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600">📜 {Math.min(idx + 1, total)}/{total}</span>
                    {streak >= 2 && <span className="px-3 py-1.5 rounded-full bg-orange-500 text-white game-pop">🔥 Streak {streak}!</span>}
                </div>
                <div className="flex gap-1">
                    {rounds.map((_, i) => (
                        <span key={i} className={`h-1.5 flex-1 rounded-full ${i < idx ? "bg-emerald-400" : i === idx ? "bg-rose-400" : "bg-white border border-slate-200"}`}></span>
                    ))}
                </div>

                {cur && !finished && (
                    <div key={idx} className={`game-card-in flex-1 bg-white/95 backdrop-blur rounded-[2rem] border-4 shadow-xl p-6 sm:p-8 text-center flex flex-col justify-center min-h-[240px]
                        ${verdict === "correct" ? "border-emerald-400 game-pop" : verdict === "wrong" ? "border-rose-400 game-shake" : "border-white"}`}>
                        <div className="text-5xl mb-3">{verdict === "correct" ? "🎉" : verdict === "wrong" ? "😅" : "❓"}</div>
                        <p className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">"{cur.left} = {cur.shown}"</p>
                        <p className="text-xs font-bold text-slate-400 mt-2">Benarkah pernyataan ini?</p>
                        {verdict && (
                            <p className={`text-sm font-black mt-2 ${verdict === "correct" ? "text-emerald-600" : "text-rose-500"}`}>
                                {verdict === "correct" ? "✅ Tepat sekali!" : `❌ Kurang tepat — jawabannya ${cur.isTrue ? "BENAR" : "SALAH"}`}
                            </p>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 pb-2">
                    <button onClick={() => judge("benar")} disabled={picked !== null || finished}
                        className="py-5 rounded-[1.75rem] bg-gradient-to-b from-emerald-400 to-emerald-600 text-white font-black text-xl shadow-xl shadow-emerald-500/30 hover:-translate-y-1 active:scale-95 transition-all cursor-pointer disabled:opacity-60">
                        ✅<br /><span className="text-sm tracking-widest">BENAR</span>
                    </button>
                    <button onClick={() => judge("salah")} disabled={picked !== null || finished}
                        className="py-5 rounded-[1.75rem] bg-gradient-to-b from-rose-400 to-rose-600 text-white font-black text-xl shadow-xl shadow-rose-500/30 hover:-translate-y-1 active:scale-95 transition-all cursor-pointer disabled:opacity-60">
                        ❌<br /><span className="text-sm tracking-widest">SALAH</span>
                    </button>
                </div>
            </main>

            {finished && <GameResultModal score={score} benar={benar} salah={salah} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel="Penilaian selesai! 🤔" onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
