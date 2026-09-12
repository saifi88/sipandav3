// =====================================================================
// MOCHI SI MONSTER LAPAR (feed): suapi monster dengan jawaban yang benar!
// Bisa DISERET ke mulut atau KETUK makanan lalu KETUK mulut (ramah HP).
// Benar = monster mengunyah senang + tumbuh; salah = dilepeh, nyawa kurang.
// XP peliharaan tersimpan di HP (localStorage) → Mochi berevolusi Lv.1-3.
// Soal dari bank per level. Bonus-only.
// =====================================================================

const FEED_FOOD_EMOJI = ["🍎", "🍩", "🍔", "🍇", "🍪", "🍉", "🥪", "🍒"];
const FEED_MAX_HEARTS = 3;

function FeedGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = flatPairs(game);
    const [level, setLevel] = React.useState(null);
    const DS = diffSettings(level);

    const bank = React.useMemo(() => {
        if (!level) return [];
        return bankForLevel(game, level, DS.rounds);
    }, [game.id, level]);
    const total = bank.length;
    const optCount = !level ? 4 : level === "mudah" ? 3 : level === "sedang" ? 4 : 5;

    const petKey = `mochi_pet_${currentUser.nisn}`;
    const [petXp, setPetXp] = React.useState(() => {
        try { return Number((JSON.parse(localStorage.getItem(petKey) || "{}") || {}).xp) || 0; }
        catch (e) { return 0; }
    });
    const petStage = petXp >= 30 ? 2 : petXp >= 12 ? 1 : 0;
    const xpNext = petStage === 0 ? 12 : petStage === 1 ? 30 : null;

    const [idx, setIdx] = React.useState(0);
    const [benar, setBenar] = React.useState(0);
    const [salah, setSalah] = React.useState(0);
    const [hearts, setHearts] = React.useState(FEED_MAX_HEARTS);
    const [selected, setSelected] = React.useState(null);
    const [drag, setDrag] = React.useState(null);
    const [hoverMouth, setHoverMouth] = React.useState(false);
    const [mouth, setMouth] = React.useState("open"); // open | chew | sad | yum
    const [busy, setBusy] = React.useState(false);
    const [evoMsg, setEvoMsg] = React.useState(null);
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 3) * 60);
    const [qTime, setQTime] = React.useState(DS.timePerQ || 0);
    const [finished, setFinished] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);
    const dragRef = React.useRef(null);

    const cur = bank[idx];
    const dead = hearts <= 0;
    const score = calcChallengeScore(benar, total, salah, level);
    const theme = (typeof gameTheme === "function" ? gameTheme("feed") : { grad: "from-orange-400 to-pink-500" });
    const timeWarning = timeLeft <= 15 && !finished;

    // Makanan jawaban untuk soal ini.
    const foods = React.useMemo(() => {
        if (!level || !cur) return [];
        const others = shuffleArray(
            pairs.filter(p => String(p.right) !== String(cur.right)).map(o => o.right)
                .filter((v, i, a) => v && a.indexOf(v) === i)
        ).slice(0, optCount - 1);
        while (others.length < optCount - 1) others.push("???");
        return shuffleArray([cur.right, ...others]).map((text, i) => ({
            uid: `${idx}-${i}`,
            text,
            correct: text === cur.right,
            emo: FEED_FOOD_EMOJI[i % FEED_FOOD_EMOJI.length],
            delay: `${(i * 0.4) % 1.5}s`
        }));
    }, [idx, level, game.id]);

    React.useEffect(() => { setQTime(diffSettings(level).timePerQ || 0); }, [level]);
    React.useEffect(() => { if (level) setQTime(diffSettings(level).timePerQ || 0); }, [idx]);

    React.useEffect(() => {
        if (!level || finished) return;
        const t = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
        return () => clearInterval(t);
    }, [finished, level]);

    // Timer per soal (Sedang/Sulit): habis = salah + nyawa kurang.
    React.useEffect(() => {
        if (!level || finished || busy || !DS.timePerQ) return;
        if (qTime <= 0) {
            swallow(null);
            return;
        }
        const t = setTimeout(() => setQTime(q => q - 1), 1000);
        return () => clearTimeout(t);
    }, [qTime, level, finished, busy, idx]);

    React.useEffect(() => {
        if (!level || finished || total === 0) return;
        if (idx >= total || dead || timeLeft === 0) setFinished(true);
    }, [idx, dead, timeLeft, total, finished, level]);

    React.useEffect(() => {
        if (!level || !finished || reported.current) return;
        reported.current = true;
        if (idx >= total) { playGameTone(1046, 0.2, "triangle"); setTimeout(() => playGameTone(1318, 0.4, "triangle"), 200); }
        onFinish && onFinish({
            gameId: game.id, title: game.title, mapel: game.mapel, type: "feed",
            skor: score, benar, salah, level,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    const saveXp = (xp) => {
        setPetXp(xp);
        try { localStorage.setItem(petKey, JSON.stringify({ xp })); } catch (e) {}
    };

    // Suapi makanan ke mulut (food null = waktu habis).
    const swallow = (food) => {
        if (!level || finished || busy || dead || !cur) return;
        setBusy(true);
        setSelected(null);
        setDrag(null);
        setHoverMouth(false);
        if (food && food.correct) {
            setBenar(v => v + 1);
            setMouth("chew");
            playGameTone(880, 0.12);
            setTimeout(() => playGameTone(1174, 0.2, "triangle"), 130);
            const nxp = petXp + 1;
            const before = petStage;
            saveXp(nxp);
            const after = nxp >= 30 ? 2 : nxp >= 12 ? 1 : 0;
            setTimeout(() => {
                setMouth("yum");
                if (after > before) {
                    setEvoMsg(after === 1 ? "🎉 Mochi tumbuh jadi Remaja!" : "🎉🎉 Mochi berevolusi jadi Raksasa!");
                    playGameTone(1046, 0.25, "triangle");
                }
            }, 450);
        } else {
            setSalah(v => v + 1);
            setHearts(h => Math.max(0, h - 1));
            setMouth("sad");
            playGameTone(160, 0.25, "sawtooth");
        }
        setTimeout(() => {
            setMouth("open");
            setEvoMsg(null);
            setBusy(false);
            setIdx(i => i + 1);
        }, 1100);
    };

    // ---- Drag (seret makanan ke mulut) ----
    const findMouth = (x, y) => {
        const el = document.elementFromPoint(x, y);
        return !!(el && el.closest("[data-drop-id='mouth']"));
    };
    const handlePointerDown = (e, food) => {
        if (!level || finished || busy) return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        dragRef.current = {
            uid: food.uid, text: food.text, emo: food.emo,
            startX: e.clientX, startY: e.clientY, moved: false,
            dx: e.clientX - rect.left, dy: e.clientY - rect.top, w: rect.width
        };
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    };
    const handlePointerMove = (e) => {
        const d = dragRef.current;
        if (!d) return;
        if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 8) return;
        d.moved = true;
        setDrag({ ...d, x: e.clientX, y: e.clientY });
        setHoverMouth(findMouth(e.clientX, e.clientY));
    };
    const handlePointerUp = (e) => {
        const d = dragRef.current;
        if (!d) return;
        dragRef.current = null;
        setDrag(null);
        setHoverMouth(false);
        if (!d.moved) {
            // Mode ketuk: pilih / batal pilih makanan
            setSelected(prev => (prev === d.uid ? null : d.uid));
            playGameTone(660, 0.07);
            return;
        }
        if (findMouth(e.clientX, e.clientY)) {
            const food = foods.find(f => f.uid === d.uid);
            if (food) swallow(food);
        }
    };
    const tapMouth = () => {
        if (selected === null) return;
        const food = foods.find(f => f.uid === selected);
        if (food) swallow(food);
    };

    const handleExit = () => {
        if (!finished && (benar + salah) > 0 && !window.confirm("Keluar dari game? Mochi akan kelaparan...")) return;
        onExit();
    };

    if (!level) {
        return (
            <DifficultySelect theme={{ ...theme, label: "Monster Lapar", emoji: "👾" }} mapel={game.mapel} title={game.title}
                pairCount={pairs.length} banks={levelBankCounts(game)} typeLabel="Monster Lapar" onPick={setLevel} onExit={onExit} />
        );
    }

    const stageScale = [1, 1.15, 1.32][petStage];
    const stageName = ["Bayi", "Remaja", "Raksasa"][petStage];

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-200 via-orange-100 to-rose-100 flex flex-col select-none relative overflow-hidden">
            <div className="pointer-events-none absolute top-16 right-8 text-4xl game-float">☁️</div>
            <div className="pointer-events-none absolute top-40 left-6 text-3xl game-float" style={{ animationDelay: "1s" }}>🌳</div>
            <div className="pointer-events-none absolute bottom-6 right-6 text-4xl">🏠</div>

            <GameHud theme={{ ...theme, label: `Monster Lapar · ${levelLabel(level)}`, emoji: "👾" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />

            <main className="relative flex-1 max-w-2xl mx-auto w-full p-3 sm:p-5 space-y-3">
                {/* Status: nyawa + lapar + XP */}
                <div className="flex items-center justify-center gap-1.5 text-xs font-black flex-wrap">
                    <span className="px-3 py-1.5 rounded-full bg-white border border-slate-200">
                        {[0, 1, 2].map(i => <span key={i} className={i < hearts ? "" : "grayscale opacity-30"}>❤️</span>)}
                    </span>
                    <DifficultyBadge level={level} />
                    <span className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">👾 Mochi {stageName} · ✨{petXp}{xpNext ? `/${xpNext}` : " MAX"}</span>
                    {DS.timePerQ > 0 && <span className={`px-3 py-1.5 rounded-full font-black ${qTime <= 5 ? "bg-red-500 text-white animate-pulse" : "bg-amber-100 text-amber-700"}`}>⏱ {qTime}</span>}
                </div>

                {/* Soal */}
                <div key={idx} className="game-card-in bg-white/95 backdrop-blur rounded-[1.75rem] border border-white shadow-xl p-4 text-center relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${theme.grad}`}></div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-orange-500">Soal {Math.min(idx + 1, total)}/{total} · Suapi jawaban yang benar! ✅ {benar} · ❌ {salah}</p>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{cur ? cur.left : "…"}</h2>
                    {evoMsg && <p className="text-sm font-black text-purple-600 mt-1 game-star-pop">{evoMsg}</p>}
                </div>

                {/* Monster Mochi */}
                <div className="flex justify-center py-1">
                    <div className="relative transition-transform duration-500" style={{ transform: `scale(${stageScale})` }}>
                        <div className="w-44 h-44 rounded-full bg-gradient-to-b from-lime-300 via-green-400 to-emerald-500 shadow-xl border-4 border-white/70 relative game-float">
                            {/* Telinga/tanduk */}
                            <span className="absolute -top-3 left-8 w-6 h-8 rounded-full bg-emerald-500 rotate-[-20deg]"></span>
                            <span className="absolute -top-3 right-8 w-6 h-8 rounded-full bg-emerald-500 rotate-[20deg]"></span>
                            {petStage === 2 && <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-3xl">👑</span>}
                            {/* Mata (berkedip) */}
                            <span className="pet-blink absolute top-10 left-9 w-9 h-11 bg-white rounded-full flex items-center justify-center overflow-hidden">
                                <span className="w-4 h-6 bg-slate-900 rounded-full mt-2"></span>
                            </span>
                            <span className="pet-blink absolute top-10 right-9 w-9 h-11 bg-white rounded-full flex items-center justify-center overflow-hidden" style={{ animationDelay: "0.05s" }}>
                                <span className="w-4 h-6 bg-slate-900 rounded-full mt-2"></span>
                            </span>
                            {/* Pipi */}
                            <span className="absolute top-24 left-5 w-6 h-4 rounded-full bg-rose-400/70"></span>
                            <span className="absolute top-24 right-5 w-6 h-4 rounded-full bg-rose-400/70"></span>
                            {/* Mulut (target suapan) */}
                            <div data-drop-id="mouth" onClick={tapMouth} title="Mulut Mochi"
                                className={`absolute left-1/2 -translate-x-1/2 bottom-5 flex items-center justify-center transition-all duration-200 cursor-pointer
                                    ${mouth === "open" ? "w-16 h-10 rounded-b-full bg-red-900 border-4 border-red-950" : ""}
                                    ${mouth === "chew" ? "w-16 h-10 rounded-b-full bg-red-900 border-4 border-red-950 game-pop" : ""}
                                    ${mouth === "yum" ? "w-14 h-6 rounded-full bg-red-800 border-4 border-red-950" : ""}
                                    ${mouth === "sad" ? "w-14 h-6 rounded-full bg-slate-700 border-4 border-slate-800 game-shake" : ""}
                                    ${hoverMouth ? "ring-4 ring-amber-300 scale-110" : ""}
                                    ${selected !== null ? "ring-4 ring-amber-300 game-glow" : ""}`}>
                                {mouth === "open" && <span className="w-6 h-3 rounded-b-full bg-red-500 mt-3"></span>}
                                {mouth === "chew" && <span className="text-xl">😋</span>}
                                {mouth === "yum" && <span className="text-lg">😊</span>}
                                {mouth === "sad" && <span className="text-lg">😝</span>}
                            </div>
                        </div>
                        <p className="text-center text-[11px] font-black text-emerald-700 mt-1">🍽️ {selected !== null ? "Ketuk mulut untuk menyuap!" : "Seret makanan / ketuk lalu ketuk mulut"}</p>
                    </div>
                </div>

                {/* Makanan jawaban */}
                <div className="flex flex-wrap justify-center gap-2.5 pb-2">
                    {foods.map(f => {
                        const isSel = selected === f.uid;
                        const isDragging = drag && drag.uid === f.uid;
                        return (
                            <div key={f.uid}
                                onPointerDown={(e) => handlePointerDown(e, f)}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                                style={{ touchAction: "none", animationDelay: f.delay }}
                                className={`game-float rounded-3xl px-4 py-3 border-2 text-center transition-all duration-200
                                    ${isSel ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-105 ring-4 ring-amber-300"
                                    : "bg-white/95 border-white text-slate-800 shadow-lg hover:-translate-y-1 hover:border-orange-300 cursor-grab active:cursor-grabbing"}
                                    ${isDragging ? "opacity-30 scale-95" : ""}`}>
                                <div className="text-3xl">{f.emo}</div>
                                <div className="text-xs sm:text-sm font-black mt-0.5 max-w-[110px] leading-tight">{f.text}</div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Bayangan makanan saat diseret */}
            {drag && (
                <div className="fixed z-[90] pointer-events-none rounded-3xl px-4 py-2 bg-slate-900 text-white shadow-2xl rotate-3 border-2 border-white/60 text-center"
                    style={{ left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.w }}>
                    <div className="text-2xl">{drag.emo}</div>
                    <div className="text-xs font-black">{drag.text}</div>
                </div>
            )}

            {finished && <GameResultModal score={score} benar={benar} salah={salah} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel={idx >= total ? "Mochi kenyang! Kamu hebat! 🎉" : dead ? "Mochi kabur... coba lagi! 💪" : "Waktu habis! ⏰"} level={level} onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
