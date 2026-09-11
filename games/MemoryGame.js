// =====================================================================
// GAME MEMORI: buka 2 kartu, cocokkan left<->right dari pairs yang sama.
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-violet-100 via-slate-100 to-slate-100 flex flex-col select-none">
            <header className="bg-violet-700 text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-40">
                <div className="flex items-center gap-3 min-w-0">
                    <button onClick={onExit} className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 cursor-pointer"><Icon name="chevron-left" size={20} /></button>
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-violet-200">🃏 Memori · {game.mapel} · Bonus</p>
                        <h1 className="font-bold text-sm sm:text-base truncate">{game.title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="bg-violet-600 px-3 py-1.5 rounded-lg text-xs font-bold">⭐ {score}</div>
                    <div className="bg-violet-600 px-3 py-1.5 rounded-lg text-xs font-bold font-mono">⏱ {formatGameTime(timeLeft)}</div>
                </div>
            </header>
            <p className="text-[11px] text-slate-500 mt-3 text-center px-4">Buka dua kartu. Cocokkan istilah dengan artinya. Cocok: {matchedCount}/{total} · Salah: {wrongCount}</p>
            <main className="flex-1 max-w-3xl mx-auto w-full p-4 grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 items-start">
                {deck.map(card => {
                    const isFound = !!found[card.pairId];
                    const isOpen = isFound || open.some(c => c.uid === card.uid);
                    return (
                        <button key={card.uid} onClick={() => flip(card)} disabled={isFound}
                            className={`min-h-[72px] rounded-2xl px-2 py-3 text-xs sm:text-sm font-bold border-2 transition-all cursor-pointer ${isFound ? "bg-emerald-500 border-emerald-500 text-white" : isOpen ? "bg-white border-violet-500 text-slate-800 shadow-md scale-[1.02]" : "bg-violet-600 border-violet-600 text-violet-200 hover:bg-violet-500"}`}>
                            {isOpen ? card.text : "?"}
                        </button>
                    );
                })}
            </main>
            {finished && <GameResultModal score={score} benar={matchedCount} salah={wrongCount} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel={matchedCount === total ? "Ingatanmu hebat!" : "Waktu habis!"} onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
