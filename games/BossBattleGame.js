// =====================================================================
// BOSS BATTLE + LEVEL: kalahkan monster dengan jawaban benar!
// 🌱 Monster lembek (HP 80) · 🔥 HP 120 · ⚡ HP 150 + nyawamu 80 +
// timer per soal. Salah = monster menyerang balik. Bonus-only.
// =====================================================================

const BOSS_MONSTERS = ["👹", "🐲", "👾", "🦖", "👺"];

function BossBattleGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = flatPairs(game);
    const [level, setLevel] = React.useState(null);
    const DS = diffSettings(level);

    const BOSS_MAX_HP = !level ? 100 : level === "mudah" ? 80 : level === "sedang" ? 120 : 150;
    const PLAYER_MAX_HP = !level ? 100 : level === "sulit" ? 80 : 100;
    const BOSS_DMG_TO_MONSTER = !level ? 20 : level === "mudah" ? 25 : 20;
    const BOSS_DMG_TO_PLAYER = !level ? 15 : level === "mudah" ? 10 : level === "sedang" ? 15 : 20;

    const monster = React.useMemo(() => {
        let h = 0;
        String(game.id).split("").forEach(c => { h = (h * 31 + c.charCodeAt(0)) % 997; });
        return BOSS_MONSTERS[h % BOSS_MONSTERS.length];
    }, [game.id]);

    const questions = React.useMemo(() => {
        if (!level) return [];
        return buildMCQ(bankForLevel(game, level, DS.rounds), pairs);
    }, [game.id, level]);

    const [qIdx, setQIdx] = React.useState(0);
    const [bossHp, setBossHp] = React.useState(BOSS_MAX_HP);
    const [playerHp, setPlayerHp] = React.useState(PLAYER_MAX_HP);
    const [benar, setBenar] = React.useState(0);
    const [salah, setSalah] = React.useState(0);
    const [picked, setPicked] = React.useState(null);
    const [bossShake, setBossShake] = React.useState(0);
    const [playerFlash, setPlayerFlash] = React.useState(0);
    const [hitText, setHitText] = React.useState(null);
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 3) * 60);
    const [qTime, setQTime] = React.useState(DS.timePerQ || 0);
    const [finished, setFinished] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);

    const won = bossHp <= 0;
    const lost = playerHp <= 0;
    const score = Math.max(0, Math.min(100, Math.round(((BOSS_MAX_HP - bossHp) / BOSS_MAX_HP) * 100) - salah * DS.penalty));
    const theme = (typeof gameTheme === "function" ? gameTheme("boss") : { grad: "from-red-600 to-orange-500" });
    const timeWarning = timeLeft <= 15 && !finished;
    const cur = questions.length > 0 ? questions[qIdx % questions.length] : null;

    React.useEffect(() => { setBossHp(BOSS_MAX_HP); setPlayerHp(PLAYER_MAX_HP); setQTime(diffSettings(level).timePerQ || 0); }, [level]);

    React.useEffect(() => {
        if (!level || finished) return;
        const t = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
        return () => clearInterval(t);
    }, [finished, level]);

    // Timer per soal di level sulit: habis = monster menyerang!
    React.useEffect(() => {
        if (!level || finished || !DS.timePerQ || picked !== null || won || lost) return;
        if (qTime <= 0) {
            setSalah(v => v + 1);
            setPlayerHp(h => Math.max(0, h - BOSS_DMG_TO_PLAYER));
            setPlayerFlash(k => k + 1);
            setHitText({ key: Date.now(), text: `-${BOSS_DMG_TO_PLAYER} 🔥`, side: "player" });
            playGameTone(150, 0.3, "sawtooth");
            setTimeout(() => { setHitText(null); setQIdx(i => i + 1); setQTime(diffSettings(level).timePerQ || 0); }, 700);
            return;
        }
        const t = setTimeout(() => setQTime(q => q - 1), 1000);
        return () => clearTimeout(t);
    }, [qTime, level, finished, picked, qIdx]);

    React.useEffect(() => {
        if (!level || finished || questions.length === 0) return;
        if (won || lost || timeLeft === 0) {
            const timer = setTimeout(() => setFinished(true), won ? 900 : 400);
            return () => clearTimeout(timer);
        }
    }, [won, lost, timeLeft, finished, level]);

    React.useEffect(() => {
        if (!level || !finished || reported.current) return;
        reported.current = true;
        if (won) { playGameTone(1046, 0.2, "triangle"); setTimeout(() => playGameTone(1318, 0.4, "triangle"), 200); }
        onFinish && onFinish({
            gameId: game.id, title: game.title, mapel: game.mapel, type: "boss",
            skor: score, benar, salah, level,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    const attack = (opt) => {
        if (!level || finished || picked !== null || won || lost || !cur) return;
        setPicked(opt);
        if (opt === cur.answer) {
            setBenar(v => v + 1);
            setBossHp(h => Math.max(0, h - BOSS_DMG_TO_MONSTER));
            setBossShake(k => k + 1);
            setHitText({ key: Date.now(), text: `-${BOSS_DMG_TO_MONSTER} 💥`, side: "boss" });
            playGameTone(880, 0.12);
            setTimeout(() => playGameTone(1100, 0.18, "square"), 130);
        } else {
            setSalah(v => v + 1);
            setPlayerHp(h => Math.max(0, h - BOSS_DMG_TO_PLAYER));
            setPlayerFlash(k => k + 1);
            setHitText({ key: Date.now(), text: `-${BOSS_DMG_TO_PLAYER} 🔥`, side: "player" });
            playGameTone(150, 0.3, "sawtooth");
        }
        setTimeout(() => { setPicked(null); setHitText(null); setQIdx(i => i + 1); setQTime(diffSettings(level).timePerQ || 0); }, 750);
    };

    const handleExit = () => {
        if (!finished && (benar + salah) > 0 && !window.confirm("Keluar dari game? Progres tidak akan disimpan.")) return;
        onExit();
    };

    if (!level) {
        return (
            <DifficultySelect theme={{ ...theme, label: "Boss Battle", emoji: "👹" }} mapel={game.mapel} title={game.title}
                pairCount={pairs.length} banks={levelBankCounts(game)} typeLabel="Boss Battle" onPick={setLevel} onExit={onExit} />
        );
    }

    const hpColor = (hp, max) => (hp / max) > 0.6 ? "from-emerald-400 to-green-500" : (hp / max) > 0.3 ? "from-amber-400 to-orange-500" : "from-red-500 to-rose-600";

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-900 flex flex-col select-none relative overflow-hidden">
            <div className="pointer-events-none absolute top-10 left-10 text-3xl game-float">🌋</div>
            <div className="pointer-events-none absolute top-24 right-10 text-3xl game-float" style={{ animationDelay: "1s" }}>⚡</div>
            <div className="pointer-events-none absolute bottom-24 left-6 text-2xl opacity-60">🔥</div>
            <div className="pointer-events-none absolute bottom-24 right-6 text-2xl opacity-60">🔥</div>

            <GameHud theme={{ ...theme, label: `Boss Battle · ${levelLabel(level)}`, emoji: "⚔️" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />

            <main className="relative flex-1 max-w-2xl mx-auto w-full p-3 sm:p-5 space-y-3">
                <div className="flex items-center justify-center gap-2">
                    <DifficultyBadge level={level} />
                    {DS.timePerQ > 0 && <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${qTime <= 5 ? "bg-red-500 text-white animate-pulse" : "bg-white/15 text-white"}`}>⏱ {qTime} dtk</span>}
                    <span className="px-2.5 py-1 rounded-full bg-white/15 text-white text-[11px] font-black">❤️ {PLAYER_MAX_HP} · 👹 {BOSS_MAX_HP}</span>
                </div>
                {/* Monster */}
                <div key={`boss-${bossShake}`} className={`relative bg-white/10 backdrop-blur border border-white/20 rounded-[1.75rem] p-4 text-center ${bossShake ? "game-shake" : ""}`}>
                    <div className="text-6xl sm:text-7xl game-float inline-block">{won ? "😵" : monster}</div>
                    <p className="text-xs font-black uppercase tracking-widest text-rose-300 mt-1">Raja Monster</p>
                    <div className="mt-2 h-4 rounded-full bg-black/50 border border-white/20 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${hpColor(bossHp, BOSS_MAX_HP)} transition-all duration-500`} style={{ width: `${(bossHp / BOSS_MAX_HP) * 100}%` }}></div>
                    </div>
                    <p className="text-[11px] font-black text-white/70 mt-1">HP {bossHp}/{BOSS_MAX_HP}</p>
                    {hitText && hitText.side === "boss" && (
                        <span key={hitText.key} className="absolute top-2 right-4 text-2xl font-black text-amber-300 game-star-pop">{hitText.text}</span>
                    )}
                </div>

                <div className="text-center text-2xl font-black text-white/80 -my-1">⚔️</div>

                {/* Pemain */}
                <div key={`pl-${playerFlash}`} className={`relative bg-white/10 backdrop-blur border border-white/20 rounded-[1.75rem] px-4 py-2.5 flex items-center gap-3 ${playerFlash ? "game-shake" : ""}`}>
                    <span className="text-4xl">🧑‍🎓</span>
                    <div className="flex-1">
                        <p className="text-xs font-black text-white truncate">{currentUser.name}</p>
                        <div className="mt-1 h-3 rounded-full bg-black/50 border border-white/20 overflow-hidden">
                            <div className={`h-full rounded-full bg-gradient-to-r ${hpColor(playerHp, PLAYER_MAX_HP)} transition-all duration-500`} style={{ width: `${(playerHp / PLAYER_MAX_HP) * 100}%` }}></div>
                        </div>
                    </div>
                    <span className="text-xs font-black text-white/70">HP {playerHp}</span>
                    {hitText && hitText.side === "player" && (
                        <span key={hitText.key} className="absolute top-1 right-3 text-xl font-black text-rose-300 game-star-pop">{hitText.text}</span>
                    )}
                </div>

                {/* Soal */}
                {cur && !won && !lost && (
                    <div className="bg-white rounded-[1.75rem] shadow-xl p-4 sm:p-5">
                        <p className="text-[11px] font-black uppercase tracking-widest text-orange-500">🗡️ Serang dengan jawaban benar! ✅ {benar} · ❌ {salah}</p>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 mb-3">{cur.q}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {cur.options.map((opt, i) => {
                                const isAns = picked !== null && opt === cur.answer;
                                const isWrong = picked === opt && opt !== cur.answer;
                                return (
                                    <button key={i} onClick={() => attack(opt)}
                                        className={`px-3.5 py-3 rounded-2xl border-2 text-sm font-bold text-left transition-all active:scale-95 cursor-pointer
                                            ${isAns ? "bg-gradient-to-r from-orange-500 to-red-500 border-transparent text-white game-pop"
                                            : isWrong ? "bg-rose-50 border-rose-400 text-rose-700 game-shake"
                                            : "bg-slate-50 border-slate-200 hover:border-orange-400 text-slate-700"}`}>
                                        {isAns ? "💥 " : ""}{opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
                {(won || lost) && !finished && (
                    <p className="text-center text-white font-black text-lg game-card-in">{won ? "🎉 Monster tumbang!" : "😅 Kamu tumbang... coba lagi!"}</p>
                )}
            </main>

            {finished && <GameResultModal score={score} benar={benar} salah={salah} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel={won ? "Monster kalah! Kamu menang! 🏆" : lost ? "HP habis! Coba lagi! 💪" : "Waktu habis! ⏰"} level={level} onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
