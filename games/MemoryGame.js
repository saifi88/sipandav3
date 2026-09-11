// =====================================================================
// GAME MEMORI (modern): buka 2 kartu, cocokkan left<->right.
// Memakai kontrak onFinish yang sama dengan MatchGame (bonus-only).
// =====================================================================

function MemoryGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = game.pairs || [];
    const deck = React.useMemo(() => {
        const cards = [];
        pairs.forEach((p, i) => {
            cards.push({ uid: `${i}-l`, pairId: i, text: p.left });
            cards.push({ uid: `${i}-r`, pairId: i, text: p.right });
        });
        return shuffleArray(cards);
    }, [game.id]);
    const total = pairs.length;

    const [open, setOpen] = React.useState([]);
    const [found, setFound] = React.useState({});
    const [wrongCount, setWrongCount] = React.useState(0);
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 3) * 60);
    const [finished, setFinished] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);
    const lock = React.useRef(false);

    const matchedCount = Object.keys(found).length;
    const score = calcMatchScore(matchedCount, wrongCount, total);
    const theme = (typeof gameTheme === "function" ? gameTheme("memory") : { grad: "from-cyan-500 to-indigo-500" });
    const timeWarning = timeLeft <= 15 && !finished;
    const progress = total > 0 ? Math.round((matchedCount / total) * 100) : 0;

    React.useEffect(() => {
        if (finished) return;
        const t = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
        return () => clearInterval(t);
    }, [finished]);

    React.useEffect(() => {
        if (!finished && ((total > 0 && matchedCount === total) || timeLeft === 0)) setFinished(true);
    }, [matchedCount, timeLeft, total, finished]);

    React.useEffect(() => {
        if (!finished || reported.current) return;
        reported.current = true;
        playGameTone(1046, 0.3, "triangle");
        onFinish && onFinish({
            gameId: game.id, title: game.title, mapel: game.mapel, type: "memory",
            skor: score, benar: matchedCount, salah: wrongCount,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    const flip = (card) => {
        if (finished || found[card.pairId] || open.some(c => c.uid === card.uid) || lock.current) return;
        playGameTone(660, 0.08);
        const next = [...open, card];
        setOpen(next);
        if (next.length === 2) {
            if (next[0].pairId === next[1].pairId) {
                setFound(f => ({ ...f, [next[0].pairId]: true }));
                playGameTone(880, 0.15);
                setOpen([]);
            } else {
                lock.current = true;
                setWrongCount(c => c + 1);
                playGameTone(160, 0.2, "sawtooth");
                setTimeout(() => { setOpen([]); lock.current = false; }, 700);
            }
        }
    };

    const handleExit = () => {
        if (!finished && matchedCount > 0 && !window.confirm("Keluar dari game? Progres tidak akan disimpan.")) return;
        onExit();
    };

    return (
        <div className="min-h-screen bg-[#f0f9ff] flex flex-col select-none relative overflow-hidden">
            <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-cyan-300/40 blur-3xl"></div>
            <div className="pointer-events-none absolute top-1/3 -left-24 w-80 h-80 rounded-full bg-indigo-300/40 blur-3xl"></div>
            <GameHud theme={{ ...theme, label: "Memori", emoji: "🃏" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />
            <div className="relative max-w-3xl mx-auto w-full px-3 sm:px-5 pt-4">
                <div className="flex items-center justify-center gap-2 text-xs font-black">
                    <span className="px-3 py-1.5 rounded-full bg-cyan-100 text-cyan-700">🃏 {matchedCount}/{total} pasangan</span>
                    <span className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-500">{progress}%</span>
                    <span className={`px-3 py-1.5 rounded-full ${wrongCount ? "bg-rose-100 text-rose-600" : "bg-white text-slate-400 border border-slate-200"}`}>❌ {wrongCount}</span>
                </div>
                <div className="mt-2.5 h-3 rounded-full bg-white border border-slate-200 overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${theme.grad} transition-all duration-500`} style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            <main className="relative flex-1 max-w-3xl mx-auto w-full p-3 sm:p-5 grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3.5 items-start content-start">
                {deck.map(card => {
                    const isFound = !!found[card.pairId];
                    const isOpen = isFound || open.some(c => c.uid === card.uid);
                    return (
                        <button key={card.uid} onClick={() => flip(card)} disabled={isFound}
                            className={`game-card-in min-h-[86px] rounded-3xl px-2 py-3 text-xs sm:text-sm font-black border-2 transition-all duration-200 active:scale-95 cursor-pointer overflow-hidden relative
                                ${isFound
                                    ? "bg-gradient-to-br from-emerald-400 to-teal-500 border-transparent text-white shadow-lg shadow-emerald-500/30"
                                    : isOpen
                                        ? "bg-white border-cyan-400 text-slate-800 shadow-xl scale-[1.03] ring-4 ring-cyan-100"
                                        : `bg-gradient-to-br ${theme.grad} border-white/50 text-white shadow-lg hover:-translate-y-1 hover:shadow-xl`}`}>
                            {isOpen ? (
                                <span>{isFound ? "✓ " : ""}{card.text}</span>
                            ) : (
                                <span className="flex flex-col items-center gap-1">
                                    <span className="text-3xl drop-shadow">🃏</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Buka!</span>
                                </span>
                            )}
                        </button>
                    );
                })}
            </main>
            {finished && <GameResultModal score={score} benar={matchedCount} salah={wrongCount} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel={matchedCount === total ? "Ingatanmu hebat! 🧠" : "Waktu habis! ⏰"} onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
