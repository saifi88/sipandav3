// =====================================================================
// MENARA LOGIKA (tower): panjat menara dengan menjawab soal beruntun.
// Lebih menantang dari kuis biasa: 3 nyawa, streak/combo pengganda,
// bonus kecepatan, dan lantai makin tinggi = makin seru.
// Soal dari pairs (left=soal, right=jawaban). Bonus-only.
// =====================================================================

const TOWER_LIVES = 3;
const TOWER_TIME_BONUS_LIMIT = 8; // jawab < 8 detik dapat bonus

function LogicTowerGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = flatPairs(game);
    const [level, setLevel] = React.useState(null);
    const DS = diffSettings(level);
    const questions = React.useMemo(() => {
        if (!level) return [];
        return shuffleArray(buildMCQ(bankForLevel(game, level, DS.rounds), pairs));
    }, [game.id, level]);
    const total = questions.length;

    const [idx, setIdx] = React.useState(0);
    const [lives, setLives] = React.useState(TOWER_LIVES);
    const [benar, setBenar] = React.useState(0);
    const [salah, setSalah] = React.useState(0);
    const [streak, setStreak] = React.useState(0);
    const [bestStreak, setBestStreak] = React.useState(0);
    const [points, setPoints] = React.useState(0);
    const [picked, setPicked] = React.useState(null);
    const [qTime, setQTime] = React.useState(0); // detik di soal ini
    const [climbKey, setClimbKey] = React.useState(0);
    const [shakeKey, setShakeKey] = React.useState(0);
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 3) * 60);
    const [finished, setFinished] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);

    const maxPoints = Math.max(1, total * 150);
    const score = Math.max(0, Math.min(100, Math.round((points / maxPoints) * 100)));
    const theme = (typeof gameTheme === "function" ? gameTheme("tower") : { grad: "from-indigo-500 to-purple-600" });
    const timeWarning = timeLeft <= 15 && !finished;
    const cur = questions[idx];
    const dead = lives <= 0;
    const multiplier = streak >= 5 ? 2 : streak >= 3 ? 1.5 : 1;

    React.useEffect(() => {
        if (!level || finished) return;
        const t = setInterval(() => {
            setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
            setQTime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(t);
    }, [finished, level]);

    React.useEffect(() => {
        if (!level || finished || questions.length === 0) return;
        if (idx >= total || dead || timeLeft === 0) {
            const timer = setTimeout(() => setFinished(true), dead ? 600 : 400);
            return () => clearTimeout(timer);
        }
    }, [idx, dead, timeLeft, total, finished]);

    React.useEffect(() => {
        if (!level || !finished || reported.current) return;
        reported.current = true;
        if (idx >= total) { playGameTone(1046, 0.2, "triangle"); setTimeout(() => playGameTone(1318, 0.4, "triangle"), 200); }
        onFinish && onFinish({
            gameId: game.id, title: game.title, mapel: game.mapel, type: "tower",
            skor: score, benar, salah, level,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    const answer = (opt) => {
        if (!level || finished || picked !== null || dead || !cur) return;
        setPicked(opt);
        if (opt === cur.answer) {
            const ns = streak + 1;
            setStreak(ns);
            setBestStreak(b => Math.max(b, ns));
            const mult = ns >= 5 ? 2 : ns >= 3 ? 1.5 : 1;
            const timeBonus = qTime <= TOWER_TIME_BONUS_LIMIT ? (TOWER_TIME_BONUS_LIMIT - qTime) * 2 : 0;
            setPoints(p => p + Math.round(100 * mult + timeBonus));
            setBenar(v => v + 1);
            setClimbKey(k => k + 1);
            playGameTone(880, 0.12);
            if (ns === 3 || ns === 5) setTimeout(() => playGameTone(1174, 0.2, "triangle"), 140);
        } else {
            setSalah(v => v + 1);
            setStreak(0);
            setLives(v => Math.max(0, v - 1));
            setShakeKey(k => k + 1);
            playGameTone(160, 0.25, "sawtooth");
        }
        setTimeout(() => { setPicked(null); setQTime(0); setIdx(i => i + 1); }, 650);
    };

    const handleExit = () => {
        if (!finished && (benar + salah) > 0 && !window.confirm("Keluar dari game? Progres tidak akan disimpan.")) return;
        onExit();
    };

    const floorPct = total > 0 ? Math.round((idx / total) * 100) : 0;

    if (!level) {
        return (
            <DifficultySelect theme={{ ...theme, label: "Menara Logika", emoji: "🗼" }} mapel={game.mapel} title={game.title}
                pairCount={pairs.length} banks={levelBankCounts(game)} typeLabel="Menara Logika" onPick={setLevel} onExit={onExit} />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 flex flex-col select-none relative overflow-hidden">
            <div className="pointer-events-none absolute top-10 left-6 text-3xl game-float">🗼</div>
            <div className="pointer-events-none absolute top-24 right-8 text-2xl game-float" style={{ animationDelay: "1s" }}>☁️</div>
            <div className="pointer-events-none absolute top-40 right-20 text-xl game-float hidden sm:block" style={{ animationDelay: "0.5s" }}>☁️</div>

            <GameHud theme={{ ...theme, label: `Menara Logika · ${levelLabel(level)}`, emoji: "🗼" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />

            <main className="relative flex-1 max-w-5xl mx-auto w-full p-3 sm:p-5 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-3 items-start">
                {/* Menara visual */}
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-[1.75rem] p-4 text-center">
                    <p className="text-[11px] font-black uppercase tracking-widest text-amber-300">Lantai {Math.min(idx + 1, total)}/{total}</p>
                    <div className="mt-2 h-3 rounded-full bg-black/50 border border-white/20 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${theme.grad} transition-all duration-500`} style={{ width: `${floorPct}%` }}></div>
                    </div>
                    {/* Nyawa */}
                    <div className="flex justify-center gap-1 mt-3 text-2xl">
                        {[0, 1, 2].map(i => (
                            <span key={i} className={i < lives ? "" : "grayscale opacity-30"}>❤️</span>
                        ))}
                    </div>
                    {/* Combo */}
                    <div className="mt-2">
                        {streak >= 2 ? (
                            <span className="inline-block px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black game-pop">🔥 Combo x{multiplier} · {streak} beruntun!</span>
                        ) : (
                            <span className="inline-block px-3 py-1.5 rounded-full bg-white/10 text-white/60 text-xs font-bold">Jawab 3x beruntun = combo 🔥</span>
                        )}
                    </div>
                    {/* Avatar memanjat */}
                    <div className="relative mt-3 h-44 rounded-2xl bg-gradient-to-b from-indigo-900/60 to-black/40 border border-white/10 overflow-hidden">
                        <div className="absolute right-3 top-2 bottom-2 w-10 rounded-xl bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.25)_0_10px,transparent_10px_22px)]"></div>
                        <div className="absolute right-3 top-1 text-lg">🏁</div>
                        <span key={climbKey} className="absolute text-4xl game-pop transition-all duration-500" style={{ right: "2.2rem", bottom: `calc(${(idx / Math.max(1, total)) * 75}% + 8px)` }}>🧑‍🎓</span>
                        <span className="absolute left-3 bottom-2 text-2xl">🗼</span>
                    </div>
                    <p className="text-[11px] font-bold text-white/60 mt-2">✅ {benar} · ❌ {salah} · 🔥 terbaik {bestStreak}x</p>
                </div>

                {/* Soal */}
                <div>
                    {cur && !finished && !dead && (
                        <div key={`${idx}-${shakeKey}`} className="game-card-in bg-white rounded-[1.75rem] shadow-xl p-4 sm:p-6 relative overflow-hidden">
                            <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${theme.grad}`}></div>
                            <div className={shakeKey ? "" : ""}>
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-indigo-500">🧗 Tantangan {idx + 1}/{total} · ⏱ {qTime} dtk</p>
                                    <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-black">+{Math.round(100 * multiplier)} poin</span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-2 mb-4 leading-snug">{cur.q}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {cur.options.map((opt, i) => {
                                        const isAns = picked !== null && opt === cur.answer;
                                        const isWrong = picked === opt && opt !== cur.answer;
                                        return (
                                            <button key={i} onClick={() => answer(opt)}
                                                className={`px-3.5 py-3 rounded-2xl border-2 text-sm font-bold text-left transition-all active:scale-95 cursor-pointer
                                                    ${isAns ? `bg-gradient-to-r ${theme.grad} border-transparent text-white game-pop`
                                                    : isWrong ? "bg-rose-50 border-rose-400 text-rose-700 game-shake"
                                                    : "bg-slate-50 border-slate-200 hover:border-indigo-400 text-slate-700"}`}>
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[11px] text-slate-400 font-semibold mt-3">💡 Tips: jawab cepat (di bawah {TOWER_TIME_BONUS_LIMIT} detik) dapat bonus + jaga combo jangan sampai salah!</p>
                            </div>
                        </div>
                    )}
                    {dead && !finished && (
                        <p className="text-center text-white font-black text-lg game-card-in">💔 Nyawa habis! Menara meruntuhkanmu...</p>
                    )}
                </div>
            </main>

            {finished && <GameResultModal score={score} benar={benar} salah={salah} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel={idx >= total ? "Puncak menara tercapai! 🏆" : dead ? "Coba lagi, jangan menyerah! 💪" : "Waktu habis! ⏰"} level={level} onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
