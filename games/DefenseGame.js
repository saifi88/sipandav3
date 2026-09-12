// =====================================================================
// INVASI ROBOT (defense): robot menyerbu markas! Hancurkan dengan
// jawaban benar sebelum mereka mencapai markas.
// Makin lama makin cepat (wave naik). Combo = tembakan ganda.
// Paling melatih kecepatan + ketepatan. Soal dari pairs. Bonus-only.
// =====================================================================

function DefenseGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = flatPairs(game);
    const [level, setLevel] = React.useState(null);
    const DS = diffSettings(level);
    const questions = React.useMemo(() => {
        if (!level) return [];
        return shuffleArray(buildMCQ(bankForLevel(game, level, DS.rounds), pairs));
    }, [game.id, level]);
    const total = questions.length;

    const [enemyIdx, setEnemyIdx] = React.useState(0);
    const [enemyPos, setEnemyPos] = React.useState(0); // 0-100 ke markas
    const [baseHp, setBaseHp] = React.useState(100);
    const [benar, setBenar] = React.useState(0);
    const [salah, setSalah] = React.useState(0);
    const [streak, setStreak] = React.useState(0);
    const [bestStreak, setBestStreak] = React.useState(0);
    const [picked, setPicked] = React.useState(null);
    const [blastKey, setBlastKey] = React.useState(0);
    const [hitBaseKey, setHitBaseKey] = React.useState(0);
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 3) * 60);
    const [finished, setFinished] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);

    const wave = Math.floor(enemyIdx / 3) + 1;
    const enemySpeed = Math.min(4.5, 1.2 + (wave - 1) * 0.7); // % per tick (200ms)
    const kills = benar;
    const score = total === 0 ? 0 : Math.max(0, Math.min(100, Math.round((kills / total) * 100 - salah * 3 + bestStreak * 2)));
    const theme = (typeof gameTheme === "function" ? gameTheme("defense") : { grad: "from-rose-500 to-red-600" });
    const timeWarning = timeLeft <= 15 && !finished;
    const cur = questions.length > 0 ? questions[enemyIdx % questions.length] : null;
    const dead = baseHp <= 0;
    const doneAll = enemyIdx >= total;

    React.useEffect(() => {
        if (!level || finished) return;
        const t = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
        return () => clearInterval(t);
    }, [finished, level]);

    // Robot berjalan ke markas
    React.useEffect(() => {
        if (!level || finished || !cur || doneAll || dead) return;
        const c = setInterval(() => {
            setEnemyPos(p => {
                const np = p + enemySpeed;
                if (np >= 100) {
                    // Menabrak markas!
                    setSalah(s => s + 1);
                    setStreak(0);
                    setBaseHp(h => Math.max(0, h - 20));
                    setHitBaseKey(k => k + 1);
                    playGameTone(140, 0.3, "sawtooth");
                    setEnemyIdx(i => i + 1);
                    return 0;
                }
                return np;
            });
        }, 200);
        return () => clearInterval(c);
    }, [finished, cur, doneAll, dead, enemySpeed, enemyIdx, level]);

    React.useEffect(() => {
        if (!level || finished) return;
        if (doneAll || dead || timeLeft === 0) {
            const timer = setTimeout(() => setFinished(true), dead ? 600 : 400);
            return () => clearTimeout(timer);
        }
    }, [doneAll, dead, timeLeft, finished]);

    React.useEffect(() => {
        if (!level || !finished || reported.current) return;
        reported.current = true;
        if (doneAll && !dead) { playGameTone(1046, 0.2, "triangle"); setTimeout(() => playGameTone(1318, 0.4, "triangle"), 200); }
        onFinish && onFinish({
            gameId: game.id, title: game.title, mapel: game.mapel, type: "defense",
            skor: score, benar, salah, level,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    const shoot = (opt) => {
        if (!level || finished || picked !== null || dead || doneAll || !cur) return;
        setPicked(opt);
        if (opt === cur.answer) {
            const ns = streak + 1;
            setStreak(ns);
            setBestStreak(b => Math.max(b, ns));
            setBenar(v => v + 1);
            setBlastKey(k => k + 1);
            playGameTone(880, 0.1);
            setTimeout(() => playGameTone(1320, 0.15, "square"), 110);
        } else {
            setSalah(v => v + 1);
            setStreak(0);
            // Salah = robot melompat maju!
            setEnemyPos(p => Math.min(95, p + 18));
            playGameTone(160, 0.25, "sawtooth");
        }
        setTimeout(() => { setPicked(null); setEnemyPos(0); setEnemyIdx(i => i + 1); }, 550);
    };

    const handleExit = () => {
        if (!finished && (benar + salah) > 0 && !window.confirm("Keluar dari game? Progres tidak akan disimpan.")) return;
        onExit();
    };

    const enemyEmoji = ["🤖", "👾", "🦾", "🛸"][Math.min(wave - 1, 3)];
    const baseColor = baseHp > 60 ? "from-emerald-400 to-green-500" : baseHp > 30 ? "from-amber-400 to-orange-500" : "from-red-500 to-rose-600";

    if (!level) {
        return (
            <DifficultySelect theme={{ ...theme, label: "Invasi Robot", emoji: "🤖" }} mapel={game.mapel} title={game.title}
                pairCount={pairs.length} banks={levelBankCounts(game)} typeLabel="Invasi Robot" onPick={setLevel} onExit={onExit} />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-rose-950 to-slate-900 flex flex-col select-none relative overflow-hidden">
            <div className="pointer-events-none absolute top-12 left-8 text-2xl game-float">🌌</div>
            <div className="pointer-events-none absolute top-20 right-10 text-2xl game-float" style={{ animationDelay: "1s" }}>✨</div>

            <GameHud theme={{ ...theme, label: `Invasi Robot · ${levelLabel(level)} · Wave ${wave}`, emoji: "🤖" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />

            <main className="relative flex-1 max-w-2xl mx-auto w-full p-3 sm:p-5 space-y-3">
                {/* Medan perang */}
                <div key={hitBaseKey} className={`bg-white/10 backdrop-blur border border-white/20 rounded-[1.75rem] p-4 relative overflow-hidden ${hitBaseKey ? "game-shake" : ""}`}>
                    <div className="flex justify-between text-[11px] font-black text-white/80 mb-1">
                        <span>🏰 Markas HP {baseHp}</span>
                        <span>🌊 Wave {wave} · Musuh {Math.min(enemyIdx + 1, total)}/{total}</span>
                    </div>
                    <div className="h-3 rounded-full bg-black/50 border border-white/20 overflow-hidden mb-3">
                        <div className={`h-full rounded-full bg-gradient-to-r ${baseColor} transition-all duration-500`} style={{ width: `${baseHp}%` }}></div>
                    </div>
                    {/* Lintasan */}
                    <div className="relative h-20 rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-gradient-to-r from-emerald-500/30 to-transparent"></div>
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-[repeating-linear-gradient(to_bottom,#f43f5e_0_8px,transparent_8px_16px)] opacity-70"></div>
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-4xl">🏰</span>
                        <span key={blastKey} className={`absolute top-1/2 -translate-y-1/2 text-4xl transition-all duration-200 ${blastKey ? "game-pop" : ""}`} style={{ left: `calc(${Math.min(88, 12 + enemyPos * 0.76)}%)` }}>
                            {enemyEmoji}
                        </span>
                        {streak >= 2 && <span className="absolute right-3 top-1.5 text-[11px] font-black text-amber-300 bg-black/50 px-2 py-0.5 rounded-full">🔥 Combo {streak}x</span>}
                        {blastKey > 0 && picked !== null && (
                            <span className="absolute top-1 left-1/3 text-2xl game-star-pop">💥</span>
                        )}
                    </div>
                    <div className="h-1.5 rounded-full bg-black/40 mt-2 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-red-500 transition-all duration-200" style={{ width: `${enemyPos}%` }}></div>
                    </div>
                    <p className="text-center text-[11px] font-bold text-white/60 mt-1.5">Jawab benar untuk menembak! Salah = robot melompat maju ⚠️</p>
                </div>

                {/* Soal */}
                {cur && !finished && !dead && !doneAll && (
                    <div key={enemyIdx} className="game-card-in bg-white rounded-[1.75rem] shadow-xl p-4 sm:p-5 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${theme.grad}`}></div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-rose-500">{enemyEmoji} Musuh {enemyIdx + 1}/{total} mendekat! ✅ {benar} · ❌ {salah}</p>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1 mb-3">{cur.q}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {cur.options.map((opt, i) => {
                                const isAns = picked !== null && opt === cur.answer;
                                const isWrong = picked === opt && opt !== cur.answer;
                                return (
                                    <button key={i} onClick={() => shoot(opt)}
                                        className={`px-3.5 py-3 rounded-2xl border-2 text-sm font-bold text-left transition-all active:scale-95 cursor-pointer
                                            ${isAns ? "bg-gradient-to-r from-rose-500 to-red-500 border-transparent text-white game-pop"
                                            : isWrong ? "bg-rose-50 border-rose-400 text-rose-700 game-shake"
                                            : "bg-slate-50 border-slate-200 hover:border-rose-400 text-slate-700"}`}>
                                        🎯 {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
                {dead && !finished && (
                    <p className="text-center text-white font-black text-lg game-card-in">💥 Markas hancur! Robot menang...</p>
                )}
            </main>

            {finished && <GameResultModal score={score} benar={benar} salah={salah} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel={doneAll && !dead ? "Markas selamat! Kamu pahlawan! 🏆" : dead ? "Markas jatuh! Coba lagi! 💪" : "Pertahanan selesai! 🛡️"} level={level} onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
