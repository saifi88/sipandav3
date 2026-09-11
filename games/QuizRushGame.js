// =====================================================================
// KUIS CEPAT: pairs dipakai sebagai bank soal (left=pertanyaan, right=jwb).
// 4 opsi dibuat dari right milik pasangan lain. Bonus-only.
// =====================================================================

function QuizRushGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = game.pairs || [];
    const questions = React.useMemo(() => pairs.map((p, i) => {
        const others = shuffleArray(pairs.filter((_, j) => j !== i)).slice(0, 3).map(o => o.right);
        return { q: p.left, answer: p.right, options: shuffleArray([p.right, ...others]) };
    }), [game.id]);

    const [idx, setIdx] = React.useState(0);
    const [benar, setBenar] = React.useState(0);
    const [salah, setSalah] = React.useState(0);
    const [picked, setPicked] = React.useState(null);
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 3) * 60);
    const [finished, setFinished] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);
    const total = questions.length;
    const score = total === 0 ? 0 : Math.max(0, Math.round((benar / total) * 100 - salah * 5));

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
            gameId: game.id, title: game.title, mapel: game.mapel, type: "quizrush",
            skor: score, benar, salah,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    const answer = (opt) => {
        if (finished || picked !== null) return;
        const cur = questions[idx];
        setPicked(opt);
        if (opt === cur.answer) { setBenar(b => b + 1); playGameTone(880, 0.12); }
        else { setSalah(s => s + 1); playGameTone(160, 0.2, "sawtooth"); }
        setTimeout(() => { setPicked(null); setIdx(i => i + 1); }, 550);
    };

    const cur = questions[idx];

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-100 via-slate-100 to-slate-100 flex flex-col select-none">
            <header className="bg-violet-700 text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-40">
                <div className="flex items-center gap-3 min-w-0">
                    <button onClick={onExit} className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 cursor-pointer"><Icon name="chevron-left" size={20} /></button>
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-violet-200">⚡ Kuis Cepat · {game.mapel} · Bonus</p>
                        <h1 className="font-bold text-sm sm:text-base truncate">{game.title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="bg-violet-600 px-3 py-1.5 rounded-lg text-xs font-bold">⭐ {score}</div>
                    <div className="bg-violet-600 px-3 py-1.5 rounded-lg text-xs font-bold font-mono">⏱ {formatGameTime(timeLeft)}</div>
                </div>
            </header>
            <main className="flex-1 max-w-2xl mx-auto w-full p-4">
                {!cur && !finished && <p className="text-center text-slate-500 mt-10">Menyiapkan soal…</p>}
                {cur && !finished && (
                    <div className="bg-white rounded-2xl border shadow-sm p-5">
                        <p className="text-xs font-bold text-violet-600">SOAL {idx + 1}/{total} · Benar {benar} · Salah {salah}</p>
                        <h2 className="text-lg font-bold mt-2 mb-4">{cur.q}</h2>
                        <div className="space-y-2">
                            {cur.options.map((opt, i) => {
                                const isAns = picked !== null && opt === cur.answer;
                                const isWrongPick = picked === opt && opt !== cur.answer;
                                return (
                                    <button key={i} onClick={() => answer(opt)}
                                        className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${isAns ? "bg-emerald-500 border-emerald-500 text-white" : isWrongPick ? "bg-red-50 border-red-400 text-red-700" : "bg-slate-50 border-slate-200 hover:border-violet-400"}`}>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
            {finished && <GameResultModal score={score} benar={benar} salah={salah} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel="Kuis selesai!" onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
