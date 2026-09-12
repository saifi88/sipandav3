// =====================================================================
// BENAR ATAU SALAH KILAT + LEVEL: pernyataan muncul, siswa menilai ✅/❌.
// 🌱 1 putaran · 🔥 2 putaran + timer 20 dtk · ⚡ 3 putaran + timer 12 dtk.
// Penalti makin besar di level tinggi. Bonus-only.
// =====================================================================

function TrueFalseGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = flatPairs(game);
    const [level, setLevel] = React.useState(null);
    const DS = diffSettings(level);

    // Pernyataan dari bank level tsb; pola benar/salah digeser tiap putaran (legacy).
    const rounds = React.useMemo(() => {
        if (!level || pairs.length === 0) return [];
        const bank = bankForLevel(game, level, DS.rounds);
        const perRound = {};
        const out = [];
        // Kelompokkan per putaran agar pola benar/salah digeser per putaran.
        bank.forEach((item) => {
            const r = item.round || 1;
            (perRound[r] = perRound[r] || []).push(item);
        });
        Object.keys(perRound).sort().forEach((r) => {
            const arr = perRound[r].map((p, i) => {
                const isTrue = (i + Number(r)) % 2 === 0;
                let shown = p.right;
                if (!isTrue) {
                    const other = pairs[(i + 3 + Number(r)) % pairs.length];
                    shown = (other && other.right !== p.right) ? other.right : (pairs[(i + 1) % pairs.length] || {}).right || "?";
                }
                return { left: p.left, shown, isTrue, round: Number(r) };
            });
            shuffleArray(arr).forEach(o => out.push(o));
        });
        return out;
    }, [game.id, level]);
    const total = rounds.length;

    const [idx, setIdx] = React.useState(0);
    const [benar, setBenar] = React.useState(0);
    const [salah, setSalah] = React.useState(0);
    const [streak, setStreak] = React.useState(0);
    const [picked, setPicked] = React.useState(null);
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 3) * 60);
    const [qTime, setQTime] = React.useState(DS.timePerQ || 0);
    const [finished, setFinished] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);

    const score = calcChallengeScore(benar, total, salah, level);
    const theme = (typeof gameTheme === "function" ? gameTheme("truefalse") : { grad: "from-rose-500 to-orange-500" });
    const timeWarning = timeLeft <= 15 && !finished;
    const cur = rounds[idx];

    React.useEffect(() => { setQTime(diffSettings(level).timePerQ || 0); }, [level]);
    React.useEffect(() => { if (level) setQTime(diffSettings(level).timePerQ || 0); }, [idx]);

    React.useEffect(() => {
        if (!level || finished) return;
        const t = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
        return () => clearInterval(t);
    }, [finished, level]);

    React.useEffect(() => {
        if (!level || finished || !DS.timePerQ || picked !== null) return;
        if (qTime <= 0) {
            setSalah(v => v + 1);
            setStreak(0);
            playGameTone(160, 0.25, "sawtooth");
            setIdx(i => i + 1);
            return;
        }
        const t = setTimeout(() => setQTime(q => q - 1), 1000);
        return () => clearTimeout(t);
    }, [qTime, level, finished, picked, idx]);

    React.useEffect(() => {
        if (!level || finished || total === 0) return;
        if (idx >= total || timeLeft === 0) setFinished(true);
    }, [idx, timeLeft, total, finished, level]);

    React.useEffect(() => {
        if (!level || !finished || reported.current) return;
        reported.current = true;
        playGameTone(1046, 0.3, "triangle");
        onFinish && onFinish({
            gameId: game.id, title: game.title, mapel: game.mapel, type: "truefalse",
            skor: score, benar, salah, level,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    const judge = (choice) => {
        if (!level || finished || picked !== null || !cur) return;
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

    if (!level) {
        return (
            <DifficultySelect theme={{ ...theme, label: "Benar atau Salah", emoji: "🤔" }} mapel={game.mapel} title={game.title}
                pairCount={pairs.length} banks={levelBankCounts(game)} typeLabel="Benar atau Salah" onPick={setLevel} onExit={onExit} />
        );
    }

    const verdict = picked !== null && cur ? ((picked === "benar") === cur.isTrue ? "correct" : "wrong") : null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-rose-200 via-orange-100 to-amber-50 flex flex-col select-none relative overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-rose-300/50 blur-3xl"></div>
            <div className="pointer-events-none absolute bottom-10 -left-20 w-72 h-72 rounded-full bg-orange-300/40 blur-3xl"></div>

            <GameHud theme={{ ...theme, label: `Benar atau Salah · ${levelLabel(level)}`, emoji: "🤔" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />

            <main className="relative flex-1 max-w-xl mx-auto w-full p-3 sm:p-5 flex flex-col gap-3">
                <div className="flex items-center justify-center gap-2 text-xs font-black flex-wrap">
                    <span className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600">📜 {Math.min(idx + 1, total)}/{total}</span>
                    <DifficultyBadge level={level} />
                    {DS.timePerQ > 0 && <span className={`px-3 py-1.5 rounded-full font-black ${qTime <= 5 ? "bg-red-500 text-white animate-pulse" : "bg-amber-100 text-amber-700"}`}>⏱ {qTime}</span>}
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
                        <p className="text-xs font-bold text-slate-400 mt-2">Benarkah pernyataan ini? · Putaran {cur.round}/{DS.rounds}</p>
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

            {finished && <GameResultModal score={score} benar={benar} salah={salah} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel="Penilaian selesai! 🤔" level={level} onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
