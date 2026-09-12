// =====================================================================
// LABIRIN HARTA KARUN (maze): jelajahi labirin, kumpulkan kunci dengan
// menjawab soal, hindari jebakan, capai harta karun!
// Melatih strategi + pengetahuan. Soal dari pairs. Bonus-only.
// Papan 5x5: S=start, T=harta, K=kunci(soal), X=jebakan, #=tembok.
// =====================================================================

const MAZE_SIZE = 5;
const MAZE_WALLS = ["1,1", "1,3", "2,1", "3,3"];
const MAZE_TRAPS = ["0,3", "2,3", "4,1"];
const MAZE_KEYS_POS = ["0,1", "2,0", "2,4", "4,2", "4,4"];

function MazeGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = flatPairs(game);
    const [level, setLevel] = React.useState(null);
    const DS = diffSettings(level);
    const questions = React.useMemo(() => {
        if (!level) return [];
        return shuffleArray(buildMCQ(bankForLevel(game, level, DS.rounds), pairs));
    }, [game.id, level]);

    const totalKeys = Math.max(1, Math.min(3, pairs.length));
    const keyCells = React.useMemo(() => MAZE_KEYS_POS.slice(0, Math.max(3, totalKeys)), [game.id]);
    const start = { x: 0, y: 4 };
    const treasure = { x: 4, y: 0 };

    const [pos, setPos] = React.useState(start);
    const [keys, setKeys] = React.useState([]); // "x,y" terkumpul
    const [openedKeys, setOpenedKeys] = React.useState({}); // sudah dijawab (benar/salah) agar tak mengulang
    const [energy, setEnergy] = React.useState(100);
    const [benar, setBenar] = React.useState(0);
    const [salah, setSalah] = React.useState(0);
    const [qIdx, setQIdx] = React.useState(0);
    const [activeQuiz, setActiveQuiz] = React.useState(null); // {cell, q}
    const [picked, setPicked] = React.useState(null);
    const [steps, setSteps] = React.useState(0);
    const [bumpKey, setBumpKey] = React.useState(0);
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 4) * 60);
    const [finished, setFinished] = React.useState(false);
    const [won, setWon] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);

    const score = Math.max(0, Math.min(100, Math.round((keys.length / totalKeys) * 85 + (benar / Math.max(1, benar + salah)) * 15) - salah * 2));
    const theme = (typeof gameTheme === "function" ? gameTheme("maze") : { grad: "from-amber-500 to-orange-600" });
    const timeWarning = timeLeft <= 15 && !finished;
    const isWall = (x, y) => MAZE_WALLS.includes(`${x},${y}`);
    const isTrap = (x, y) => MAZE_TRAPS.includes(`${x},${y}`);
    const isKeyCell = (x, y) => keyCells.includes(`${x},${y}`);

    React.useEffect(() => {
        if (!level || finished) return;
        const t = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
        return () => clearInterval(t);
    }, [finished, level]);

    React.useEffect(() => {
        if (!level || finished || questions.length === 0) return;
        if (energy <= 0 || timeLeft === 0) setFinished(true);
    }, [energy, timeLeft, finished, level]);

    React.useEffect(() => {
        if (!level || !finished || reported.current) return;
        reported.current = true;
        if (won) { playGameTone(1046, 0.2, "triangle"); setTimeout(() => playGameTone(1318, 0.4, "triangle"), 200); }
        onFinish && onFinish({
            gameId: game.id, title: game.title, mapel: game.mapel, type: "maze",
            skor: won ? Math.max(score, 70) : score, benar, salah, level,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    const tryMove = (dx, dy) => {
        if (!level || finished || activeQuiz) return;
        const nx = pos.x + dx, ny = pos.y + dy;
        if (nx < 0 || ny < 0 || nx >= MAZE_SIZE || ny >= MAZE_SIZE) { playGameTone(200, 0.1, "square"); return; }
        if (isWall(nx, ny)) { setBumpKey(k => k + 1); playGameTone(180, 0.15, "sawtooth"); return; }
        playGameTone(520, 0.07);
        setSteps(s => s + 1);
        setPos({ x: nx, y: ny });
        const cell = `${nx},${ny}`;
        // Harta karun
        if (nx === treasure.x && ny === treasure.y) {
            if (keys.length >= totalKeys) {
                setWon(true);
                setFinished(true);
            } else {
                setBumpKey(k => k + 1);
                playGameTone(300, 0.2, "square");
            }
            return;
        }
        // Jebakan
        if (isTrap(nx, ny)) {
            setEnergy(e => Math.max(0, e - 10));
            playGameTone(150, 0.25, "sawtooth");
        }
        // Kunci -> soal
        if (isKeyCell(nx, ny) && !openedKeys[cell] && questions.length > 0) {
            const q = questions[qIdx % questions.length];
            setActiveQuiz({ cell, q });
            setPicked(null);
        }
    };

    const answerQuiz = (opt) => {
        if (!activeQuiz || picked !== null) return;
        setPicked(opt);
        const ok = opt === activeQuiz.q.answer;
        setTimeout(() => {
            if (ok) {
                setBenar(v => v + 1);
                setKeys(k => [...k, activeQuiz.cell]);
                playGameTone(880, 0.12);
                setTimeout(() => playGameTone(1174, 0.2, "triangle"), 130);
            } else {
                setSalah(v => v + 1);
                setEnergy(e => Math.max(0, e - 15));
                playGameTone(160, 0.25, "sawtooth");
            }
            setOpenedKeys(o => ({ ...o, [activeQuiz.cell]: true }));
            setQIdx(i => i + 1);
            setActiveQuiz(null);
            setPicked(null);
        }, 600);
    };

    const handleExit = () => {
        if (!finished && (benar + salah + steps) > 0 && !window.confirm("Keluar dari game? Progres tidak akan disimpan.")) return;
        onExit();
    };

    const energyColor = energy > 60 ? "from-emerald-400 to-green-500" : energy > 30 ? "from-amber-400 to-orange-500" : "from-red-500 to-rose-600";

    if (!level) {
        return (
            <DifficultySelect theme={{ ...theme, label: "Labirin Harta", emoji: "🗺️" }} mapel={game.mapel} title={game.title}
                pairCount={pairs.length} banks={levelBankCounts(game)} typeLabel="Labirin Harta" onPick={setLevel} onExit={onExit} />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-950 via-stone-900 to-slate-950 flex flex-col select-none relative overflow-hidden">
            <div className="pointer-events-none absolute top-10 left-8 text-2xl game-float">🗺️</div>
            <div className="pointer-events-none absolute top-20 right-8 text-2xl game-float" style={{ animationDelay: "1s" }}>💎</div>

            <GameHud theme={{ ...theme, label: `Labirin Harta · ${levelLabel(level)}`, emoji: "🗺️" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />

            <main className="relative flex-1 max-w-2xl mx-auto w-full p-3 sm:p-5 space-y-3">
                {/* Status */}
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-[1.75rem] p-3.5 flex items-center gap-3">
                    <div className="flex-1">
                        <p className="text-[11px] font-black uppercase tracking-widest text-amber-300">🔑 {keys.length}/{totalKeys} kunci · 👣 {steps} langkah</p>
                        <div className="mt-1.5 h-3 rounded-full bg-black/50 border border-white/20 overflow-hidden">
                            <div className={`h-full rounded-full bg-gradient-to-r ${energyColor} transition-all duration-500`} style={{ width: `${energy}%` }}></div>
                        </div>
                    </div>
                    <span className="text-xs font-black text-white/80">⚡{energy}</span>
                </div>

                {/* Papan */}
                <div key={bumpKey} className="bg-white/10 backdrop-blur border border-white/20 rounded-[1.75rem] p-3">
                    <div className="grid grid-cols-5 gap-1.5" style={{ maxWidth: "420px", margin: "0 auto" }}>
                        {Array.from({ length: MAZE_SIZE }).map((_, y) => (
                            Array.from({ length: MAZE_SIZE }).map((_, x) => {
                                const isP = pos.x === x && pos.y === y;
                                const isT = treasure.x === x && treasure.y === y;
                                const wall = isWall(x, y);
                                const trap = isTrap(x, y);
                                const key = isKeyCell(x, y);
                                const got = keys.includes(`${x},${y}`);
                                let bg = "bg-amber-50/95";
                                let emoji = "";
                                if (wall) { bg = "bg-stone-700"; emoji = "🧱"; }
                                else if (isP) { bg = "bg-gradient-to-br from-violet-500 to-fuchsia-500"; emoji = "🧑‍🎓"; }
                                else if (isT) { bg = keys.length >= totalKeys ? "bg-gradient-to-br from-amber-300 to-yellow-500 game-glow" : "bg-amber-100"; emoji = "🏆"; }
                                else if (key && !got) { bg = "bg-gradient-to-br from-amber-200 to-orange-200"; emoji = "🔑"; }
                                else if (key && got) { bg = "bg-emerald-100"; emoji = "✅"; }
                                else if (trap) { bg = "bg-red-100"; emoji = "⚠️"; }
                                else if (x === start.x && y === start.y) { emoji = "🚪"; }
                                return (
                                    <div key={`${x}-${y}`} className={`${bg} rounded-xl aspect-square flex items-center justify-center text-xl sm:text-2xl border border-black/10 ${isP ? "game-pop ring-4 ring-white/60" : ""}`}>
                                        {emoji}
                                    </div>
                                );
                            })
                        ))}
                    </div>
                    <p className="text-center text-[11px] font-bold text-white/70 mt-2">
                        {keys.length >= totalKeys ? "🏆 Semua kunci terkumpul! Pergi ke harta karun!" : `Cari ${totalKeys - keys.length} kunci 🔑 lagi! Hati-hati jebakan ⚠️ (−10⚡)`}
                    </p>
                </div>

                {/* Kontrol arah */}
                <div className="bg-white rounded-[1.75rem] shadow-xl p-4">
                    <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
                        <span></span>
                        <button onClick={() => tryMove(0, -1)} className="py-3 rounded-2xl bg-slate-900 text-white text-xl font-black active:scale-95 hover:bg-slate-700 cursor-pointer">▲</button>
                        <span></span>
                        <button onClick={() => tryMove(-1, 0)} className="py-3 rounded-2xl bg-slate-900 text-white text-xl font-black active:scale-95 hover:bg-slate-700 cursor-pointer">◀</button>
                        <button onClick={() => tryMove(0, 1)} className="py-3 rounded-2xl bg-slate-900 text-white text-xl font-black active:scale-95 hover:bg-slate-700 cursor-pointer">▼</button>
                        <button onClick={() => tryMove(1, 0)} className="py-3 rounded-2xl bg-slate-900 text-white text-xl font-black active:scale-95 hover:bg-slate-700 cursor-pointer">▶</button>
                    </div>
                    <p className="text-center text-[11px] text-slate-400 font-bold mt-2">✅ {benar} · ❌ {salah} · Petak kunci selalu mengunci soal!</p>
                </div>

                {/* Modal kuis kunci */}
                {activeQuiz && (
                    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                        <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-5 game-card-in relative overflow-hidden">
                            <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${theme.grad}`}></div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-amber-600">🔑 Buka kunci dengan jawaban benar!</p>
                            <h3 className="text-base font-black text-slate-900 mt-1 mb-3">{activeQuiz.q.q}</h3>
                            <div className="space-y-2">
                                {activeQuiz.q.options.map((opt, i) => {
                                    const isAns = picked !== null && opt === activeQuiz.q.answer;
                                    const isWrong = picked === opt && opt !== activeQuiz.q.answer;
                                    return (
                                        <button key={i} onClick={() => answerQuiz(opt)}
                                            className={`w-full px-3.5 py-3 rounded-2xl border-2 text-sm font-bold text-left transition-all active:scale-95 cursor-pointer
                                                ${isAns ? "bg-gradient-to-r from-amber-500 to-orange-500 border-transparent text-white game-pop"
                                                : isWrong ? "bg-rose-50 border-rose-400 text-rose-700 game-shake"
                                                : "bg-slate-50 border-slate-200 hover:border-amber-400 text-slate-700"}`}>
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold mt-2 text-center">Salah = −15⚡ energi!</p>
                        </div>
                    </div>
                )}
            </main>

            {finished && <GameResultModal score={score} benar={benar} salah={salah} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel={won ? "Harta karun ditemukan! 🏆" : energy <= 0 ? "Energi habis! Coba lagi! ⚡" : "Waktu habis! ⏰"} level={level} onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
