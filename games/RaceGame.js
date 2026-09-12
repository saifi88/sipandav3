// =====================================================================
// BALAPAN KUIS + LEVEL: jawab benar = mobilmu maju, komputer jalan sendiri.
// 🌱 1 putaran, komputer santai · 🔥 2 putaran · ⚡ 3 putaran, komputer
// ngebut + timer per soal + penalti besar. Bonus-only.
// =====================================================================

function RaceGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = flatPairs(game);
    const [level, setLevel] = React.useState(null);
    const DS = diffSettings(level);

    const questions = React.useMemo(() => {
        if (!level) return [];
        return buildMCQ(bankForLevel(game, level, DS.rounds), pairs);
    }, [game.id, level]);
    const total = questions.length;

    const FINISH = Math.max(1, total);
    const totalSecs = (game.duration || 2) * 60;
    const compBoost = !level ? 1 : level === "mudah" ? 1.15 : level === "sedang" ? 1 : 0.8;

    const [idx, setIdx] = React.useState(0);
    const [playerPos, setPlayerPos] = React.useState(0);
    const [compPos, setCompPos] = React.useState(0);
    const [benar, setBenar] = React.useState(0);
    const [salah, setSalah] = React.useState(0);
    const [picked, setPicked] = React.useState(null);
    const [timeLeft, setTimeLeft] = React.useState(totalSecs);
    const [qTime, setQTime] = React.useState(DS.timePerQ || 0);
    const [finished, setFinished] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);

    const playerWon = playerPos >= FINISH;
    const compWon = !playerWon && compPos >= FINISH;
    const score = calcChallengeScore(playerPos, FINISH, salah, level);
    const theme = (typeof gameTheme === "function" ? gameTheme("race") : { grad: "from-fuchsia-500 to-indigo-600" });
    const timeWarning = timeLeft <= 15 && !finished;
    const cur = questions[idx];

    React.useEffect(() => { setQTime(diffSettings(level).timePerQ || 0); }, [level]);
    React.useEffect(() => { if (level) setQTime(diffSettings(level).timePerQ || 0); }, [idx]);

    // Timer + mobil komputer jalan otomatis (makin sulit makin ngebut).
    React.useEffect(() => {
        if (!level || finished) return;
        const t = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
        return () => clearInterval(t);
    }, [finished, level]);

    React.useEffect(() => {
        if (!level || finished || total === 0) return;
        const stepMs = (totalSecs * 1000) / (FINISH + 1) * compBoost;
        const c = setInterval(() => setCompPos(p => Math.min(FINISH, p + 1)), stepMs);
        return () => clearInterval(c);
    }, [finished, total, level]);

    React.useEffect(() => {
        if (!level || finished || !DS.timePerQ || picked !== null || playerWon || compWon) return;
        if (qTime <= 0) {
            setSalah(v => v + 1);
            playGameTone(160, 0.25, "sawtooth");
            setIdx(i => i + 1);
            return;
        }
        const t = setTimeout(() => setQTime(q => q - 1), 1000);
        return () => clearTimeout(t);
    }, [qTime, level, finished, picked, idx]);

    React.useEffect(() => {
        if (!level || finished || total === 0) return;
        if (playerWon || compWon || idx >= total || timeLeft === 0) {
            const timer = setTimeout(() => setFinished(true), playerWon ? 900 : 400);
            return () => clearTimeout(timer);
        }
    }, [playerWon, compWon, idx, timeLeft, finished, level]);

    React.useEffect(() => {
        if (!level || !finished || reported.current) return;
        reported.current = true;
        if (playerWon) { playGameTone(1046, 0.2, "triangle"); setTimeout(() => playGameTone(1318, 0.4, "triangle"), 200); }
        onFinish && onFinish({
            gameId: game.id, title: game.title, mapel: game.mapel, type: "race",
            skor: score, benar, salah, level,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    const answer = (opt) => {
        if (!level || finished || picked !== null || playerWon || compWon || !cur) return;
        setPicked(opt);
        if (opt === cur.answer) {
            setBenar(v => v + 1);
            setPlayerPos(p => Math.min(FINISH, p + 1));
            playGameTone(880, 0.12);
            setTimeout(() => playGameTone(1100, 0.15, "square"), 130);
        } else {
            setSalah(v => v + 1);
            playGameTone(160, 0.25, "sawtooth");
        }
        setTimeout(() => { setPicked(null); setIdx(i => i + 1); }, 550);
    };

    const handleExit = () => {
        if (!finished && (benar + salah) > 0 && !window.confirm("Keluar dari game? Progres tidak akan disimpan.")) return;
        onExit();
    };

    if (!level) {
        return (
            <DifficultySelect theme={{ ...theme, label: "Balapan Kuis", emoji: "🏎️" }} mapel={game.mapel} title={game.title}
                pairCount={pairs.length} banks={levelBankCounts(game)} typeLabel="Balapan Kuis" onPick={setLevel} onExit={onExit} />
        );
    }

    const carLeft = (p) => `calc(${(p / FINISH) * 88}% + 4px)`;

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-900 flex flex-col select-none relative overflow-hidden">
            <div className="pointer-events-none absolute top-12 left-8 text-2xl game-float">🌙</div>
            <div className="pointer-events-none absolute top-20 right-10 text-2xl game-float" style={{ animationDelay: "1s" }}>⭐</div>

            <GameHud theme={{ ...theme, label: `Balapan Kuis · ${levelLabel(level)}`, emoji: "🏎️" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />

            <main className="relative flex-1 max-w-2xl mx-auto w-full p-3 sm:p-5 space-y-3">
                <div className="flex items-center justify-center gap-2">
                    <DifficultyBadge level={level} />
                    {DS.timePerQ > 0 && <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${qTime <= 5 ? "bg-red-500 text-white animate-pulse" : "bg-white/15 text-white"}`}>⏱ {qTime} dtk</span>}
                    {cur && <span className="px-2.5 py-1 rounded-full bg-white/15 text-white text-[11px] font-black">Putaran {cur.round}/{DS.rounds}</span>}
                </div>
                {/* Lintasan */}
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-[1.75rem] p-4 space-y-3 relative overflow-hidden">
                    <div className="absolute right-3 top-2 bottom-2 w-1 bg-[repeating-linear-gradient(to_bottom,#fff_0_8px,transparent_8px_16px)] opacity-60"></div>
                    <div className="absolute right-0 top-2 bottom-2 flex items-center pr-1 text-xl">🏁</div>
                    {[
                        { label: `Kamu 🏎️`, pos: playerPos, car: "🏎️", bar: "from-fuchsia-400 to-purple-500" },
                        { label: "Komputer 🤖", pos: compPos, car: "🚗", bar: "from-slate-400 to-slate-500" }
                    ].map((lane, li) => (
                        <div key={li}>
                            <div className="flex justify-between text-[11px] font-black text-white/80 mb-1 pr-8">
                                <span>{lane.label}</span><span>{lane.pos}/{FINISH}</span>
                            </div>
                            <div className="relative h-12 rounded-2xl bg-black/40 border border-white/10 mr-6">
                                <div className={`absolute left-1 top-1 bottom-1 rounded-xl bg-gradient-to-r ${lane.bar} opacity-40 transition-all duration-500`} style={{ width: `calc(${(lane.pos / FINISH) * 100}% - 8px)` }}></div>
                                <span className="absolute top-1/2 -translate-y-1/2 text-3xl transition-all duration-500 game-pop" style={{ left: carLeft(lane.pos) }}>{lane.car}</span>
                            </div>
                        </div>
                    ))}
                    {(playerWon || compWon) && !finished && (
                        <p className="text-center text-white font-black game-card-in">{playerWon ? "🏆 Kamu finis duluan!" : "🤖 Komputer finis duluan!"}</p>
                    )}
                </div>

                {/* Soal */}
                {cur && !playerWon && !compWon && !finished && (
                    <div key={idx} className="game-card-in bg-white rounded-[1.75rem] shadow-xl p-4 sm:p-5 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${theme.grad}`}></div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-purple-500">Soal {idx + 1}/{total} · Gas! 🏎️💨 ✅ {benar} · ❌ {salah}</p>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1 mb-3">{cur.q}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {cur.options.map((opt, i) => {
                                const isAns = picked !== null && opt === cur.answer;
                                const isWrong = picked === opt && opt !== cur.answer;
                                return (
                                    <button key={i} onClick={() => answer(opt)}
                                        className={`px-3.5 py-3 rounded-2xl border-2 text-sm font-bold text-left transition-all active:scale-95 cursor-pointer
                                            ${isAns ? "bg-gradient-to-r from-fuchsia-500 to-purple-500 border-transparent text-white game-pop"
                                            : isWrong ? "bg-rose-50 border-rose-400 text-rose-700 game-shake"
                                            : "bg-slate-50 border-slate-200 hover:border-fuchsia-400 text-slate-700"}`}>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {finished && <GameResultModal score={score} benar={benar} salah={salah} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel={playerWon ? "Kamu memenangkan balapan! 🏆" : compWon ? "Komputer menang! Coba lagi! 🤖" : "Balapan selesai! 🏁"} level={level} onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
