// =====================================================================
// BALON MELETUS: balon-balon melayang naik membawa jawaban.
// Letuskan (ketuk) balon yang cocok dengan soal di atas. Bonus-only.
// Memakai pairs yang sama: left = soal, right = jawaban.
// =====================================================================

const BALLOON_COLORS = [
    "from-red-400 to-rose-500",
    "from-amber-400 to-orange-500",
    "from-lime-400 to-emerald-500",
    "from-sky-400 to-blue-500",
    "from-violet-400 to-purple-500",
    "from-pink-400 to-fuchsia-500"
];

function BalloonPopGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = game.pairs || [];
    const total = pairs.length;

    const [idx, setIdx] = React.useState(0);
    const [benar, setBenar] = React.useState(0);
    const [salah, setSalah] = React.useState(0);
    const [poppedUid, setPoppedUid] = React.useState(null);
    const [wobbleUid, setWobbleUid] = React.useState(null);
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 3) * 60);
    const [finished, setFinished] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);
    const lock = React.useRef(false);

    const score = total === 0 ? 0 : Math.max(0, Math.round((benar / total) * 100 - salah * 5));
    const theme = (typeof gameTheme === "function" ? gameTheme("balloon") : { grad: "from-sky-400 to-indigo-600" });
    const timeWarning = timeLeft <= 15 && !finished;

    const cur = pairs[idx];

    // Balon untuk ronde ini: 1 jawaban benar + 3 pengecoh, posisi & kecepatan acak.
    const balloons = React.useMemo(() => {
        if (!cur) return [];
        const others = shuffleArray(pairs.filter((_, j) => j !== idx)).slice(0, 3).map(o => o.right);
        return shuffleArray([cur.right, ...others]).map((text, i) => ({
            uid: `${idx}-${i}`,
            text,
            correct: text === cur.right,
            leftPct: 4 + ((i * 23 + (idx * 37)) % 78),
            dur: 6 + ((i * 1.7 + idx) % 4),
            delay: -((i * 1.3 + idx * 0.7) % 5),
            color: BALLOON_COLORS[(i + idx) % BALLOON_COLORS.length]
        }));
    }, [idx, game.id]);

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
            gameId: game.id, title: game.title, mapel: game.mapel, type: "balloon",
            skor: score, benar, salah,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    const pop = (b) => {
        if (finished || lock.current || poppedUid) return;
        if (b.correct) {
            lock.current = true;
            setPoppedUid(b.uid);
            setBenar(v => v + 1);
            playGameTone(880, 0.12);
            setTimeout(() => playGameTone(1174, 0.2, "triangle"), 120);
            setTimeout(() => { setPoppedUid(null); lock.current = false; setIdx(i => i + 1); }, 450);
        } else {
            setSalah(v => v + 1);
            setWobbleUid(b.uid);
            playGameTone(160, 0.2, "sawtooth");
            setTimeout(() => setWobbleUid(null), 400);
        }
    };

    const handleExit = () => {
        if (!finished && (benar + salah) > 0 && !window.confirm("Keluar dari game? Progres tidak akan disimpan.")) return;
        onExit();
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100 flex flex-col select-none relative overflow-hidden">
            {/* Matahari + awan dekorasi */}
            <div className="pointer-events-none absolute top-16 right-8 w-20 h-20 rounded-full bg-amber-300 shadow-[0_0_60px_20px_rgba(253,224,71,0.6)] game-float"></div>
            <div className="pointer-events-none absolute top-24 left-6 text-5xl opacity-80 game-float" style={{ animationDelay: "0.8s" }}>☁️</div>
            <div className="pointer-events-none absolute top-40 right-1/4 text-4xl opacity-70 game-float" style={{ animationDelay: "1.6s" }}>☁️</div>
            <div className="pointer-events-none absolute bottom-6 left-8 text-4xl">🌳</div>
            <div className="pointer-events-none absolute bottom-6 right-8 text-4xl">🌳</div>

            <GameHud theme={{ ...theme, label: "Balon Meletus", emoji: "🎈" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />

            {/* Soal */}
            <div className="relative max-w-2xl mx-auto w-full px-3 sm:px-5 pt-4">
                <div key={idx} className="game-card-in bg-white/90 backdrop-blur rounded-[1.75rem] border border-white shadow-xl p-4 sm:p-5 text-center relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${theme.grad}`}></div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-sky-500">Soal {Math.min(idx + 1, total)}/{total} · 🎈 Letuskan balon yang benar!</p>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{cur ? cur.left : "…"}</h2>
                    <div className="flex justify-center gap-1.5 mt-2.5">
                        {pairs.map((_, i) => (
                            <span key={i} className={`h-2 w-6 rounded-full ${i < idx ? "bg-emerald-400" : i === idx ? "bg-sky-400" : "bg-slate-200"}`}></span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Arena balon */}
            <main className="relative flex-1 max-w-2xl mx-auto w-full overflow-hidden" style={{ minHeight: "46vh" }}>
                {balloons.map(b => {
                    const isPopped = poppedUid === b.uid;
                    const isWobble = wobbleUid === b.uid;
                    return (
                        <button key={b.uid} onClick={() => pop(b)}
                            className="absolute top-0 cursor-pointer active:scale-95"
                            style={{ left: `${b.leftPct}%` }}>
                            <span
                                className={`game-balloon flex flex-col items-center ${isWobble ? "game-balloon-wobble" : ""} ${isPopped ? "game-balloon-pop" : ""}`}
                                style={{ animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }}>
                                <span className={`w-20 sm:w-24 min-h-[5.5rem] rounded-full bg-gradient-to-b ${b.color} shadow-lg flex items-center justify-center px-2 py-3 border-2 border-white/50 relative`}>
                                    <span className="absolute top-2 left-3 w-4 h-7 rounded-full bg-white/40 rotate-12"></span>
                                    <span className="text-white text-xs sm:text-sm font-black text-center leading-tight drop-shadow">{isPopped ? "💥" : b.text}</span>
                                </span>
                                <span className={`w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent bg-gradient-to-b ${b.color} bg-clip-padding`} style={{ borderTopColor: "rgba(255,255,255,0.35)" }}></span>
                                <span className="w-0.5 h-10 bg-white/80"></span>
                            </span>
                        </button>
                    );
                })}
            </main>

            <p className="relative text-center text-[11px] font-bold text-sky-800/70 pb-4">💡 Balon terus naik — ketuk yang jawabannya tepat! Salah ketuk −5 poin.</p>

            {finished && <GameResultModal score={score} benar={benar} salah={salah} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel="Semua balon meletus! 🎈" onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
