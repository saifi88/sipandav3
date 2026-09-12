// =====================================================================
// ACAK KATA + LEVEL: susun huruf jadi kata yang benar.
// 🌱 1 putaran, tanpa pengecoh · 🔥 2 putaran + 2 huruf pengecoh
// ⚡ 3 putaran + 4 huruf pengecoh + penalti besar. Bonus-only.
// =====================================================================

function ScrambleGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = flatPairs(game);
    const [level, setLevel] = React.useState(null);
    const DS = diffSettings(level);

    const roundsArr = React.useMemo(() => {
        if (!level) return [];
        return bankForLevel(game, level, DS.rounds);
    }, [game.id, level]);
    const total = roundsArr.length;
    const decoys = !level ? 0 : level === "mudah" ? 0 : level === "sedang" ? 2 : 4;

    const [idx, setIdx] = React.useState(0);
    const [benar, setBenar] = React.useState(0);
    const [salah, setSalah] = React.useState(0);
    const [picked, setPicked] = React.useState([]);
    const [shakeKey, setShakeKey] = React.useState(0);
    const [reshuffleKey, setReshuffleKey] = React.useState(0);
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 3) * 60);
    const [finished, setFinished] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);

    const score = calcChallengeScore(benar, total, salah, level);
    const theme = (typeof gameTheme === "function" ? gameTheme("scramble") : { grad: "from-lime-500 to-teal-600" });
    const timeWarning = timeLeft <= 15 && !finished;

    const cur = roundsArr[idx];
    const answerUpper = cur ? String(cur.right).toUpperCase() : "";
    const poolLetters = answerUpper.replace(/ /g, "").split("");

    // Ubin huruf: jawaban + pengecoh (level tinggi).
    const tiles = React.useMemo(() => {
        if (!level || !cur) return [];
        let extra = [];
        if (decoys > 0) {
            const pool = pairs.map(p => String(p.right).toUpperCase().replace(/[^A-Z]/g, "")).join("");
            const ans = new Set(poolLetters);
            const cands = shuffleArray(pool.split("").filter(ch => ch && !ans.has(ch)));
            extra = cands.slice(0, decoys);
            while (extra.length < decoys) extra.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]);
        }
        return shuffleArray([...poolLetters, ...extra].map((ch, i) => ({ uid: `${idx}-${reshuffleKey}-${i}`, ch })));
    }, [idx, reshuffleKey, game.id, level]);

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
            gameId: game.id, title: game.title, mapel: game.mapel, type: "scramble",
            skor: score, benar, salah, level,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    // Reset pilihan tiap ganti soal.
    React.useEffect(() => { setPicked([]); }, [idx]);

    // Cek otomatis saat slot jawaban penuh (sepanjang jawaban asli).
    React.useEffect(() => {
        if (!level || finished || poolLetters.length === 0 || picked.length !== poolLetters.length) return;
        const byUid = {};
        tiles.forEach(t => { byUid[t.uid] = t.ch; });
        const guess = picked.map(uid => byUid[uid]).join("");
        if (guess === poolLetters.join("")) {
            setBenar(v => v + 1);
            playGameTone(880, 0.12);
            setTimeout(() => playGameTone(1174, 0.2, "triangle"), 130);
            setTimeout(() => setIdx(i => i + 1), 550);
        } else {
            setSalah(v => v + 1);
            playGameTone(160, 0.25, "sawtooth");
            setShakeKey(k => k + 1);
            setTimeout(() => setPicked([]), 650);
        }
    }, [picked]);

    const tapTile = (uid) => {
        if (!level || finished || picked.includes(uid) || picked.length >= poolLetters.length) return;
        playGameTone(660, 0.07);
        setPicked(p => [...p, uid]);
    };

    const unpick = (pos) => {
        if (finished) return;
        setPicked(p => p.filter((_, i) => i !== pos));
    };

    const handleExit = () => {
        if (!finished && (benar + salah) > 0 && !window.confirm("Keluar dari game? Progres tidak akan disimpan.")) return;
        onExit();
    };

    if (!level) {
        return (
            <DifficultySelect theme={{ ...theme, label: "Acak Kata", emoji: "🔤" }} mapel={game.mapel} title={game.title}
                pairCount={pairs.length} banks={levelBankCounts(game)} typeLabel="Acak Kata" onPick={setLevel} onExit={onExit} />
        );
    }

    // Slot jawaban: susun huruf terpilih ke posisi non-spasi.
    const byUid = {};
    tiles.forEach(t => { byUid[t.uid] = t.ch; });
    let slotCursor = 0;
    const slots = answerUpper.split("").map((ch, i) => {
        if (ch === " ") return { gap: true, key: `gap-${i}` };
        const uid = picked[slotCursor];
        slotCursor++;
        return { gap: false, key: `s-${i}`, ch: uid ? byUid[uid] : null, pos: slotCursor - 1 };
    });
    const remaining = tiles.filter(t => !picked.includes(t.uid));

    return (
        <div className="min-h-screen bg-[#f7fee7] flex flex-col select-none relative overflow-hidden">
            <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-lime-300/50 blur-3xl"></div>
            <div className="pointer-events-none absolute top-1/3 -left-24 w-80 h-80 rounded-full bg-teal-300/40 blur-3xl"></div>
            <div className="pointer-events-none absolute bottom-8 left-6 text-4xl game-float">🔤</div>
            <div className="pointer-events-none absolute bottom-8 right-6 text-4xl game-float" style={{ animationDelay: "1s" }}>✏️</div>

            <GameHud theme={{ ...theme, label: `Acak Kata · ${levelLabel(level)}`, emoji: "🔤" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />

            <main className="relative flex-1 max-w-2xl mx-auto w-full p-3 sm:p-5 space-y-4">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                    <DifficultyBadge level={level} />
                    {cur && <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-500 text-[11px] font-black">Putaran {cur.round}/{DS.rounds}</span>}
                    {decoys > 0 && <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-600 text-[11px] font-black">😈 +{decoys} pengecoh!</span>}
                </div>
                {/* Petunjuk */}
                <div key={idx} className="game-card-in bg-white/90 backdrop-blur rounded-[1.75rem] border border-white shadow-xl p-5 text-center relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${theme.grad}`}></div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-lime-600">Kata {Math.min(idx + 1, total)}/{total} · {poolLetters.length} huruf · Benar {benar} · Salah {salah}</p>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">{cur ? cur.left : "…"}</h2>
                    <p className="text-[11px] text-slate-400 font-bold mt-1">Ketuk huruf di bawah secara berurutan 👇{decoys > 0 ? " (awas huruf pengecoh!)" : ""}</p>
                </div>

                {/* Slot jawaban */}
                <div key={`slots-${idx}-${shakeKey}`} className={`flex flex-wrap justify-center gap-1.5 sm:gap-2 ${shakeKey ? "game-shake" : ""}`}>
                    {slots.map(s => s.gap ? (
                        <span key={s.key} className="w-4 sm:w-5"></span>
                    ) : (
                        <button key={s.key} onClick={() => s.ch && unpick(s.pos)}
                            className={`w-10 h-12 sm:w-11 sm:h-14 rounded-2xl border-2 text-lg sm:text-xl font-black transition-all
                                ${s.ch ? "bg-slate-900 border-slate-900 text-white shadow-lg cursor-pointer hover:scale-105" : "bg-white border-dashed border-slate-300 text-slate-300"}`}>
                            {s.ch || "·"}
                        </button>
                    ))}
                </div>

                {/* Bank huruf */}
                <div className="bg-white/70 backdrop-blur rounded-[1.75rem] border border-white shadow-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">🔤 Bank Huruf</p>
                        <button onClick={() => { setReshuffleKey(k => k + 1); setPicked([]); }} className="px-3 py-1.5 rounded-xl bg-lime-100 hover:bg-lime-200 text-lime-800 text-[11px] font-black transition-colors cursor-pointer">🔀 Acak ulang</button>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {remaining.map(t => (
                            <button key={t.uid} onClick={() => tapTile(t.uid)}
                                className={`w-11 h-13 sm:w-12 sm:h-14 py-3 rounded-2xl bg-gradient-to-b ${theme.grad} text-white text-lg sm:text-xl font-black shadow-md border-2 border-white/60 hover:-translate-y-1 hover:shadow-lg active:scale-95 transition-all cursor-pointer`}>
                                {t.ch}
                            </button>
                        ))}
                        {remaining.length === 0 && <p className="text-xs font-bold text-slate-400">Menunggu pengecekan…</p>}
                    </div>
                </div>
            </main>

            {finished && <GameResultModal score={score} benar={benar} salah={salah} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel="Semua kata tersusun! 🔤" level={level} onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
