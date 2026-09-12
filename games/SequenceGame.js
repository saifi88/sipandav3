// =====================================================================
// SUSUN KALIMAT (sequence): susun kata acak menjadi kalimat yang benar.
// Lebih menantang dari acak-huruf: melatih tata bahasa, ingatan, dan
// pemahaman makna. `left` = petunjuk, `right` = kalimat jawaban benar.
// Kata dipecah per spasi. Bonus-only.
// =====================================================================

function SequenceGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = flatPairs(game);
    const [level, setLevel] = React.useState(null);
    const DS = diffSettings(level);
    // Bank kalimat per level (pendek → panjang/kompleks); format lama diulang.
    const bank = React.useMemo(() => {
        if (!level) return [];
        return bankForLevel(game, level, DS.rounds);
    }, [game.id, level]);
    const total = bank.length;

    const [idx, setIdx] = React.useState(0);
    const [benar, setBenar] = React.useState(0);
    const [salah, setSalah] = React.useState(0);
    const [picked, setPicked] = React.useState([]); // uid terpilih berurutan
    const [attempts, setAttempts] = React.useState(0);
    const [shakeKey, setShakeKey] = React.useState(0);
    const [flashOk, setFlashOk] = React.useState(false);
    const [revealed, setRevealed] = React.useState(null);
    const [reshuffleKey, setReshuffleKey] = React.useState(0);
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 3) * 60);
    const [finished, setFinished] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);

    const cur = bank[idx];
    const words = React.useMemo(() => {
        if (!cur) return [];
        return String(cur.right || "").split(/\s+/).filter(Boolean);
    }, [cur, idx]);
    const pool = React.useMemo(() => {
        const arr = words.map((w, i) => ({ uid: `${idx}-${reshuffleKey}-${i}`, w }));
        return shuffleArray(arr);
    }, [words, idx, reshuffleKey]);

    const score = calcChallengeScore(benar, total, salah, level);
    const theme = (typeof gameTheme === "function" ? gameTheme("sequence") : { grad: "from-teal-500 to-emerald-600" });
    const timeWarning = timeLeft <= 15 && !finished;

    React.useEffect(() => {
        if (!level || finished) return;
        const t = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
        return () => clearInterval(t);
    }, [finished, level]);

    React.useEffect(() => {
        if (!level || finished || total === 0) return;
        if (idx >= total || timeLeft === 0) setFinished(true);
    }, [idx, timeLeft, total, finished, level]);

    React.useEffect(() => {
        if (!level || !finished || reported.current) return;
        reported.current = true;
        playGameTone(1046, 0.3, "triangle");
        onFinish && onFinish({
            gameId: game.id, title: game.title, mapel: game.mapel, type: "sequence",
            skor: score, benar, salah, level,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    const nextQ = () => {
        setIdx(i => i + 1);
        setPicked([]); setAttempts(0); setRevealed(null); setFlashOk(false);
        setReshuffleKey(k => k + 1);
    };

    const toggleWord = (uid) => {
        if (finished || !cur || revealed || flashOk) return;
        playGameTone(660, 0.07);
        setPicked(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]);
    };

    const submit = () => {
        if (finished || !cur || revealed || flashOk) return;
        const byUid = {};
        pool.forEach(o => { byUid[o.uid] = o.w; });
        const attempt = picked.map(uid => byUid[uid]).join(" ");
        const norm = (s) => String(s || "").toLowerCase().trim().replace(/\s+/g, " ");
        if (!picked.length) return;
        if (norm(attempt) === norm(words.join(" "))) {
            setBenar(v => v + 1);
            setFlashOk(true);
            playGameTone(880, 0.12);
            setTimeout(() => playGameTone(1174, 0.2, "triangle"), 130);
            setTimeout(nextQ, 800);
        } else {
            const att = attempts + 1;
            setAttempts(att);
            setSalah(v => v + 1);
            playGameTone(170, 0.25, "sawtooth");
            setShakeKey(k => k + 1);
            if (att >= 2) {
                setRevealed(words.join(" "));
                setTimeout(nextQ, 2200);
            } else {
                setPicked([]);
            }
        }
    };

    const handleExit = () => {
        if (!finished && (benar + salah) > 0 && !window.confirm("Keluar dari game? Progres tidak akan disimpan.")) return;
        onExit();
    };

    const byUidMap = {};
    pool.forEach(o => { byUidMap[o.uid] = o.w; });

    if (!level) {
        return (
            <DifficultySelect theme={{ ...theme, label: "Susun Kalimat", emoji: "📜" }} mapel={game.mapel} title={game.title}
                pairCount={pairs.length} banks={levelBankCounts(game)} typeLabel="Susun Kalimat" onPick={setLevel} onExit={onExit} />
        );
    }

    return (
        <div className="min-h-screen bg-[#ecfdf5] flex flex-col select-none relative overflow-hidden">
            <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-300/40 blur-3xl"></div>
            <div className="pointer-events-none absolute top-1/3 -left-24 w-80 h-80 rounded-full bg-teal-300/40 blur-3xl"></div>
            <div className="pointer-events-none absolute bottom-8 left-6 text-4xl game-float">📜</div>
            <div className="pointer-events-none absolute bottom-8 right-6 text-4xl game-float" style={{ animationDelay: "1s" }}>🧠</div>

            <GameHud theme={{ ...theme, label: `Susun Kalimat · ${levelLabel(level)}`, emoji: "📜" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />

            <main className="relative flex-1 max-w-2xl mx-auto w-full p-3 sm:p-5 space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs font-black flex-wrap">
                    <span className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600">📜 Kalimat {Math.min(idx + 1, total)}/{total}</span>
                    <DifficultyBadge level={level} />
                    <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">✅ {benar}</span>
                    <span className={`px-3 py-1.5 rounded-full ${salah ? "bg-rose-100 text-rose-600" : "bg-white text-slate-400 border border-slate-200"}`}>❌ {salah}</span>
                </div>
                <div className="flex gap-1">
                    {bank.map((_, i) => (
                        <span key={i} className={`h-1.5 flex-1 rounded-full ${i < idx ? "bg-emerald-400" : i === idx ? "bg-teal-400" : "bg-white border border-slate-200"}`}></span>
                    ))}
                </div>

                {cur && !finished && (
                    <div key={`${idx}-${shakeKey}`} className="game-card-in bg-white rounded-[1.75rem] border border-white shadow-xl p-5 sm:p-6 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${theme.grad}`}></div>
                        <div className={`${attempts > 0 && !revealed && !flashOk ? "game-shake" : ""} ${flashOk ? "game-pop" : ""}`}>
                            <p className="text-[11px] font-black uppercase tracking-widest text-teal-600">🧠 Susun kata jadi kalimat benar {attempts > 0 && !revealed ? `(kesempatan ${2 - attempts}x lagi)` : ""}</p>
                            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">{cur.left}</h3>

                            {/* Area jawaban */}
                            <div className="mt-4 min-h-[64px] rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50/60 p-2.5 flex flex-wrap gap-1.5 items-center">
                                {picked.length === 0 && <span className="text-xs font-bold text-teal-400 px-1">Ketuk kata di bawah secara berurutan...</span>}
                                {picked.map((uid, order) => (
                                    <button key={uid} onClick={() => toggleWord(uid)}
                                        className="px-3 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-black shadow active:scale-95 cursor-pointer">
                                        <span className="text-[10px] opacity-75 mr-1">{order + 1}</span>{byUidMap[uid]}
                                    </button>
                                ))}
                            </div>

                            {/* Bank kata */}
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                                {pool.filter(o => !picked.includes(o.uid)).map(o => (
                                    <button key={o.uid} onClick={() => toggleWord(o.uid)}
                                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-teal-100 border-2 border-slate-200 hover:border-teal-400 text-sm font-bold text-slate-700 transition-all active:scale-95 cursor-pointer">
                                        {o.w}
                                    </button>
                                ))}
                            </div>

                            {flashOk && <p className="text-sm font-black text-emerald-600 mt-3">🎉 Tepat! Kalimatmu sempurna!</p>}
                            {revealed && <p className="text-sm font-black text-amber-600 mt-3">💡 Jawaban: <span className="bg-amber-100 px-2 py-0.5 rounded-lg">{revealed}</span></p>}
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button onClick={() => { setPicked([]); playGameTone(500, 0.08); }} className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-black transition-all active:scale-95 cursor-pointer">↺ Ulangi</button>
                            <button onClick={submit} disabled={picked.length === 0 || !!revealed || flashOk}
                                className={`flex-1 py-3 rounded-2xl text-white text-sm font-black shadow-lg transition-all active:scale-95 cursor-pointer bg-gradient-to-r ${theme.grad} hover:brightness-110 disabled:opacity-40`}>
                                Periksa ✓
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {finished && <GameResultModal score={score} benar={benar} salah={salah} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel="Semua kalimat tersusun! 📜" level={level} onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
