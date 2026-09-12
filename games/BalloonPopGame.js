// =====================================================================
// BALON MELETUS + LEVEL: letuskan balon jawaban yang benar.
// 🌱 1 putaran, 4 balon · 🔥 2 putaran, 5 balon, balon lebih cepat
// ⚡ 3 putaran, 6 balon + timer per soal. Penalti besar. Bonus-only.
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
    const pairs = flatPairs(game);
    const [level, setLevel] = React.useState(null);
    const DS = diffSettings(level);

    const roundsArr = React.useMemo(() => {
        if (!level) return [];
        return bankForLevel(game, level, DS.rounds);
    }, [game.id, level]);
    const total = roundsArr.length;
    const optCount = !level ? 4 : level === "mudah" ? 4 : level === "sedang" ? 5 : 6;

    const [idx, setIdx] = React.useState(0);
    const [benar, setBenar] = React.useState(0);
    const [salah, setSalah] = React.useState(0);
    const [poppedUid, setPoppedUid] = React.useState(null);
    const [wobbleUid, setWobbleUid] = React.useState(null);
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 3) * 60);
    const [qTime, setQTime] = React.useState(DS.timePerQ || 0);
    const [finished, setFinished] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);
    const lock = React.useRef(false);

    const score = calcChallengeScore(benar, total, salah, level);
    const theme = (typeof gameTheme === "function" ? gameTheme("balloon") : { grad: "from-sky-400 to-indigo-600" });
    const timeWarning = timeLeft <= 15 && !finished;

    const cur = roundsArr[idx];

    // Balon ronde ini: 1 benar + pengecoh; makin sulit makin banyak & cepat.
    const balloons = React.useMemo(() => {
        if (!cur || !level) return [];
        const others = shuffleArray(roundsArr.filter((_, j) => j !== idx).map(o => o.right)
            .filter((v, i, a) => v !== cur.right && a.indexOf(v) === i)).slice(0, optCount - 1);
        while (others.length < optCount - 1) others.push(pairs[(idx + others.length + 1) % Math.max(1, pairs.length)]?.right || "?");
        const speedBoost = level === "mudah" ? 0 : level === "sedang" ? 1.5 : 2.8;
        return shuffleArray([cur.right, ...others]).map((text, i) => ({
            uid: `${idx}-${i}`,
            text,
            correct: text === cur.right,
            leftPct: 4 + ((i * 19 + (idx * 37)) % 78),
            dur: Math.max(2.6, 6 + ((i * 1.7 + idx) % 4) - speedBoost),
            delay: -((i * 1.3 + idx * 0.7) % 5),
            color: BALLOON_COLORS[(i + idx) % BALLOON_COLORS.length]
        }));
    }, [idx, game.id, level]);

    React.useEffect(() => { setQTime(diffSettings(level).timePerQ || 0); }, [level]);
    React.useEffect(() => { if (level) setQTime(diffSettings(level).timePerQ || 0); }, [idx]);

    React.useEffect(() => {
        if (!level || finished) return;
        const t = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
        return () => clearInterval(t);
    }, [finished, level]);

    React.useEffect(() => {
        if (!level || finished || !DS.timePerQ || poppedUid) return;
        if (qTime <= 0) {
            setSalah(v => v + 1);
            playGameTone(160, 0.25, "sawtooth");
            setIdx(i => i + 1);
            return;
        }
        const t = setTimeout(() => setQTime(q => q - 1), 1000);
        return () => clearTimeout(t);
    }, [qTime, level, finished, poppedUid, idx]);

    React.useEffect(() => {
        if (!level || finished || total === 0) return;
        if (idx >= total || timeLeft === 0) setFinished(true);
    }, [idx, timeLeft, total, finished, level]);

    React.useEffect(() => {
        if (!level || !finished || reported.current) return;
        reported.current = true;
        playGameTone(1046, 0.3, "triangle");
        onFinish && onFinish({
            gameId: game.id, title: game.title, mapel: game.mapel, type: "balloon",
            skor: score, benar, salah, level,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    const pop = (b) => {
        if (!level || finished || lock.current || poppedUid) return;
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

    if (!level) {
        return (
            <DifficultySelect theme={{ ...theme, label: "Balon Meletus", emoji: "🎈" }} mapel={game.mapel} title={game.title}
                pairCount={pairs.length} banks={levelBankCounts(game)} typeLabel="Balon Meletus" onPick={setLevel} onExit={onExit} />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100 flex flex-col select-none relative overflow-hidden">
            {/* Matahari + awan dekorasi */}
            <div className="pointer-events-none absolute top-16 right-8 w-20 h-20 rounded-full bg-amber-300 shadow-[0_0_60px_20px_rgba(253,224,71,0.6)] game-float"></div>
            <div className="pointer-events-none absolute top-24 left-6 text-5xl opacity-80 game-float" style={{ animationDelay: "0.8s" }}>☁️</div>
            <div className="pointer-events-none absolute top-40 right-1/4 text-4xl opacity-70 game-float" style={{ animationDelay: "1.6s" }}>☁️</div>
            <div className="pointer-events-none absolute bottom-6 left-8 text-4xl">🌳</div>
            <div className="pointer-events-none absolute bottom-6 right-8 text-4xl">🌳</div>

            <GameHud theme={{ ...theme, label: `Balon Meletus · ${levelLabel(level)}`, emoji: "🎈" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />

            {/* Soal */}
            <div className="relative max-w-2xl mx-auto w-full px-3 sm:px-5 pt-4">
                <div key={idx} className="game-card-in bg-white/90 backdrop-blur rounded-[1.75rem] border border-white shadow-xl p-4 sm:p-5 text-center relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${theme.grad}`}></div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-sky-500">Soal {Math.min(idx + 1, total)}/{total} · 🎈 Letuskan balon yang benar!</p>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{cur ? cur.left : "…"}</h2>
                    <div className="flex justify-center items-center gap-1.5 mt-2.5 flex-wrap">
                        <DifficultyBadge level={level} />
                        {DS.timePerQ > 0 && <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${qTime <= 5 ? "bg-red-500 text-white animate-pulse" : "bg-amber-100 text-amber-700"}`}>⏱ {qTime}</span>}
                        {cur && <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[11px] font-black">Putaran {cur.round}/{DS.rounds}</span>}
                    </div>
                    <div className="flex justify-center gap-1.5 mt-2.5">
                        {roundsArr.map((_, i) => (
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

            <p className="relative text-center text-[11px] font-bold text-sky-800/70 pb-4">💡 Balon terus naik — ketuk yang jawabannya tepat! Salah ketuk −{DS.penalty} poin.</p>

            {finished && <GameResultModal score={score} benar={benar} salah={salah} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel="Semua balon meletus! 🎈" level={level} onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
