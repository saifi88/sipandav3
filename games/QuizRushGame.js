// =====================================================================
// KUIS CEPAT (modern + LEVEL): pairs dipakai sebagai bank soal.
// 🌱 Mudah: 1 putaran · 🔥 Sedang: 2 putaran + timer 20 dtk/soal
// ⚡ Sulit: 3 putaran + timer 12 dtk/soal, penalti besar. Bonus-only.
// =====================================================================

function QuizRushGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = flatPairs(game);
    const [level, setLevel] = React.useState(null);
    const DS = diffSettings(level);

    const questions = React.useMemo(() => {
        if (!level) return [];
        return buildMCQ(bankForLevel(game, level, DS.rounds), pairs);
    }, [game.id, level]);

    const [idx, setIdx] = React.useState(0);
    const [benar, setBenar] = React.useState(0);
    const [salah, setSalah] = React.useState(0);
    const [picked, setPicked] = React.useState(null);
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 3) * 60);
    const [qTime, setQTime] = React.useState(DS.timePerQ || 0);
    const [finished, setFinished] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);
    const total = questions.length;
    const score = calcChallengeScore(benar, total, salah, level);
    const theme = (typeof gameTheme === "function" ? gameTheme("quizrush") : { grad: "from-amber-500 to-pink-500" });
    const timeWarning = timeLeft <= 15 && !finished;
    const totalSecs = (game.duration || 3) * 60;
    const timePct = Math.max(0, Math.round((timeLeft / totalSecs) * 100));

    React.useEffect(() => { setQTime(diffSettings(level).timePerQ || 0); }, [level]);
    React.useEffect(() => { if (level) setQTime(diffSettings(level).timePerQ || 0); }, [idx]);

    React.useEffect(() => {
        if (!level || finished) return;
        const t = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
        return () => clearInterval(t);
    }, [finished, level]);

    // Timer per soal (Sedang/Sulit): habis = salah + lanjut.
    React.useEffect(() => {
        if (!level || finished || !DS.timePerQ || picked !== null) return;
        if (qTime <= 0) {
            setSalah(s => s + 1);
            playGameTone(160, 0.25, "sawtooth");
            setIdx(i => i + 1);
            return;
        }
        const t = setTimeout(() => setQTime(q => q - 1), 1000);
        return () => clearTimeout(t);
    }, [qTime, level, finished, picked, idx]);

    React.useEffect(() => {
        if (!level || finished || idx < total || total === 0) return;
        if (timeLeft === 0 || idx >= total) setFinished(true);
    }, [idx, timeLeft, total, finished, level]);

    React.useEffect(() => {
        if (!level) return;
        if (!finished && timeLeft === 0) setFinished(true);
    }, [timeLeft]);

    React.useEffect(() => {
        if (!level || !finished || reported.current) return;
        reported.current = true;
        playGameTone(1046, 0.3, "triangle");
        onFinish && onFinish({
            gameId: game.id, title: game.title, mapel: game.mapel, type: "quizrush",
            skor: score, benar, salah, level,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    const answer = (opt) => {
        if (!level || finished || picked !== null) return;
        const cur = questions[idx];
        if (!cur) return;
        setPicked(opt);
        if (opt === cur.answer) { setBenar(b => b + 1); playGameTone(880, 0.12); }
        else { setSalah(s => s + 1); playGameTone(160, 0.2, "sawtooth"); }
        setTimeout(() => { setPicked(null); setIdx(i => i + 1); }, 550);
    };

    const handleExit = () => {
        if (!finished && (benar + salah) > 0 && !window.confirm("Keluar dari game? Progres tidak akan disimpan.")) return;
        onExit();
    };

    if (!level) {
        return (
            <DifficultySelect theme={{ ...theme, label: "Kuis Cepat", emoji: "⚡" }} mapel={game.mapel} title={game.title}
                pairCount={pairs.length} banks={levelBankCounts(game)} typeLabel="Kuis Cepat" onPick={setLevel} onExit={onExit} />
        );
    }

    const cur = questions[idx];
    const letters = ["A", "B", "C", "D"];

    return (
        <div className="min-h-screen bg-[#fff8ed] flex flex-col select-none relative overflow-hidden">
            <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-amber-300/50 blur-3xl"></div>
            <div className="pointer-events-none absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-pink-300/40 blur-3xl"></div>
            <GameHud theme={{ ...theme, label: `Kuis Cepat · ${levelLabel(level)}`, emoji: "⚡" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />
            <div className="relative max-w-2xl mx-auto w-full px-3 sm:px-5 pt-4 space-y-2">
                <div className="flex items-center justify-center gap-2">
                    <DifficultyBadge level={level} />
                    {DS.timePerQ > 0 && <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${qTime <= 5 ? "bg-red-500 text-white animate-pulse" : "bg-amber-100 text-amber-700"}`}>⏱ {qTime} dtk</span>}
                    {cur && <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-500 text-[11px] font-black">Putaran {cur.round}/{DS.rounds}</span>}
                </div>
                <div className="h-3 rounded-full bg-white border border-slate-200 overflow-hidden shadow-sm">
                    <div className={`h-full rounded-full transition-all duration-1000 ${timeWarning ? "bg-gradient-to-r from-red-500 to-orange-400" : `bg-gradient-to-r ${theme.grad}`}`} style={{ width: `${timePct}%` }}></div>
                </div>
            </div>
            <main className="relative flex-1 max-w-2xl mx-auto w-full p-3 sm:p-5">
                {!cur && !finished && (
                    <div className="text-center mt-14">
                        <div className="text-6xl game-float inline-block">⚡</div>
                        <p className="text-slate-500 font-bold mt-3">Menyiapkan soal seru…</p>
                    </div>
                )}
                {cur && !finished && (
                    <div key={idx} className="game-card-in bg-white/90 backdrop-blur rounded-[1.75rem] border border-white shadow-xl shadow-orange-500/10 p-5 sm:p-6 overflow-hidden relative">
                        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${theme.grad}`}></div>
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-black uppercase tracking-widest text-orange-500">Soal {idx + 1}/{total}</p>
                            <div className="flex gap-1.5">
                                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-black">✓ {benar}</span>
                                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-600 text-[11px] font-black">✗ {salah}</span>
                            </div>
                        </div>
                        <div className="flex gap-1 mt-3 mb-1">
                            {questions.map((_, i) => (
                                <span key={i} className={`h-1.5 flex-1 rounded-full ${i < idx ? "bg-emerald-400" : i === idx ? "bg-orange-400" : "bg-slate-100"}`}></span>
                            ))}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black mt-3 mb-5 text-slate-900 leading-snug">{cur.q}</h2>
                        <div className="space-y-2.5">
                            {cur.options.map((opt, i) => {
                                const isAns = picked !== null && opt === cur.answer;
                                const isWrongPick = picked === opt && opt !== cur.answer;
                                return (
                                    <button key={i} onClick={() => answer(opt)}
                                        className={`w-full text-left px-3.5 py-3.5 rounded-2xl border-2 text-sm font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center gap-3
                                            ${isAns ? "bg-gradient-to-r from-emerald-500 to-teal-500 border-transparent text-white shadow-lg game-pop"
                                            : isWrongPick ? "bg-rose-50 border-rose-400 text-rose-700 game-shake"
                                            : "bg-slate-50 border-slate-200 hover:border-orange-300 hover:bg-orange-50/60 hover:-translate-y-0.5 hover:shadow-md text-slate-700"}`}>
                                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${isAns ? "bg-white/25 text-white" : "bg-slate-900 text-white"}`}>{letters[i] || "•"}</span>
                                        <span className="flex-1">{opt}</span>
                                        {isAns && <span>✅</span>}
                                        {isWrongPick && <span>❌</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
            {finished && <GameResultModal score={score} benar={benar} salah={salah} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel="Kuis selesai! ⚡" level={level} onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
