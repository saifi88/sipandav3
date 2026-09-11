// =====================================================================
// ISIAN SINGKAT: lengkapi kalimat rumpang dengan mengetik jawaban.
// `left` = kalimat berisi ___ , `right` = jawaban. Maks 2x coba per soal,
// lalu jawaban dibuka. Tombol Lewati netral. Bonus-only.
// =====================================================================

const normAnswer = (s) => String(s || "").toLowerCase().trim().replace(/\s+/g, " ");

function FillBlankGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = game.pairs || [];
    const total = pairs.length;

    const [idx, setIdx] = React.useState(0);
    const [benar, setBenar] = React.useState(0);
    const [salah, setSalah] = React.useState(0);
    const [input, setInput] = React.useState("");
    const [attempts, setAttempts] = React.useState(0);
    const [shakeKey, setShakeKey] = React.useState(0);
    const [revealed, setRevealed] = React.useState(null);
    const [flashOk, setFlashOk] = React.useState(false);
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 3) * 60);
    const [finished, setFinished] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);

    const score = total === 0 ? 0 : Math.max(0, Math.round((benar / total) * 100 - salah * 5));
    const theme = (typeof gameTheme === "function" ? gameTheme("fillblank") : { grad: "from-indigo-500 to-sky-500" });
    const timeWarning = timeLeft <= 15 && !finished;
    const cur = pairs[idx];

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
            gameId: game.id, title: game.title, mapel: game.mapel, type: "fillblank",
            skor: score, benar, salah,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    const nextQ = () => { setIdx(i => i + 1); setInput(""); setAttempts(0); setRevealed(null); setFlashOk(false); };

    const submit = () => {
        if (finished || !cur || revealed) return;
        if (normAnswer(input) === "") return;
        if (normAnswer(input) === normAnswer(cur.right)) {
            setBenar(v => v + 1);
            setFlashOk(true);
            playGameTone(880, 0.12);
            setTimeout(() => playGameTone(1174, 0.2, "triangle"), 130);
            setTimeout(nextQ, 700);
        } else {
            const att = attempts + 1;
            setAttempts(att);
            setSalah(v => v + 1);
            playGameTone(170, 0.25, "sawtooth");
            setShakeKey(k => k + 1);
            if (att >= 2) {
                setRevealed(cur.right);
                setTimeout(nextQ, 1800);
            }
        }
    };

    const skip = () => {
        if (finished || !cur) return;
        playGameTone(500, 0.08);
        nextQ();
    };

    const handleExit = () => {
        if (!finished && (benar + salah) > 0 && !window.confirm("Keluar dari game? Progres tidak akan disimpan.")) return;
        onExit();
    };

    // Render kalimat: ___ jadi slot bergaris.
    const renderClue = (text) => {
        const parts = String(text || "").split("___");
        return parts.map((p, i) => (
            <React.Fragment key={i}>
                <span>{p}</span>
                {i < parts.length - 1 && (
                    <span className="inline-block min-w-[72px] border-b-4 border-amber-400 text-amber-500 font-black px-1">?</span>
                )}
            </React.Fragment>
        ));
    };

    return (
        <div className="min-h-screen bg-[#eff6ff] flex flex-col select-none relative overflow-hidden">
            <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-indigo-300/40 blur-3xl"></div>
            <div className="pointer-events-none absolute top-1/3 -left-24 w-80 h-80 rounded-full bg-sky-300/40 blur-3xl"></div>
            <div className="pointer-events-none absolute bottom-8 left-6 text-4xl game-float">✏️</div>
            <div className="pointer-events-none absolute bottom-8 right-6 text-4xl game-float" style={{ animationDelay: "1s" }}>📝</div>

            <GameHud theme={{ ...theme, label: "Isian Singkat", emoji: "✍️" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />

            <main className="relative flex-1 max-w-2xl mx-auto w-full p-3 sm:p-5 space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs font-black">
                    <span className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600">📝 Soal {Math.min(idx + 1, total)}/{total}</span>
                    <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">✅ {benar}</span>
                    <span className={`px-3 py-1.5 rounded-full ${salah ? "bg-rose-100 text-rose-600" : "bg-white text-slate-400 border border-slate-200"}`}>❌ {salah}</span>
                </div>
                <div className="flex gap-1">
                    {pairs.map((_, i) => (
                        <span key={i} className={`h-1.5 flex-1 rounded-full ${i < idx ? "bg-emerald-400" : i === idx ? "bg-indigo-400" : "bg-white border border-slate-200"}`}></span>
                    ))}
                </div>

                {cur && !finished && (
                    <div key={`${idx}-${shakeKey}`} className={`game-card-in bg-white rounded-[1.75rem] border border-white shadow-xl p-5 sm:p-6 relative overflow-hidden ${shakeKey && !flashOk && !revealed ? "" : ""}`}>
                        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${theme.grad}`}></div>
                        <div className={`${attempts > 0 && !revealed && !flashOk ? "game-shake" : ""} ${flashOk ? "game-pop" : ""}`}>
                            <p className="text-[11px] font-black uppercase tracking-widest text-indigo-500">✍️ Lengkapi kalimat ini {attempts > 0 && !revealed ? `(coba lagi! sisa ${2 - attempts}x)` : ""}</p>
                            <p className="text-xl sm:text-2xl font-black text-slate-900 leading-relaxed mt-2">{renderClue(cur.left)}</p>
                        </div>
                        {flashOk && <p className="text-sm font-black text-emerald-600 mt-2">🎉 Betul! Hebat!</p>}
                        {revealed && <p className="text-sm font-black text-amber-600 mt-2">💡 Jawabannya: <span className="bg-amber-100 px-2 py-0.5 rounded-lg">{revealed}</span></p>}
                        <div className="flex gap-2 mt-4">
                            <input value={input} onChange={e => setInput(e.target.value)} disabled={!!revealed || flashOk}
                                onKeyDown={e => { if (e.key === "Enter") submit(); }}
                                placeholder="Ketik jawaban di sini..."
                                autoFocus
                                className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-slate-200 text-base font-bold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:opacity-50" />
                            <button onClick={submit} disabled={!!revealed || flashOk}
                                className={`px-5 py-3.5 rounded-2xl text-white text-sm font-black shadow-lg transition-all active:scale-95 cursor-pointer bg-gradient-to-r ${theme.grad} hover:brightness-110 disabled:opacity-50`}>
                                Kirim ➤
                            </button>
                        </div>
                        <button onClick={skip} className="mt-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer">Lewati soal ini →</button>
                    </div>
                )}
            </main>

            {finished && <GameResultModal score={score} benar={benar} salah={salah} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel="Semua terisi! ✍️" onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
