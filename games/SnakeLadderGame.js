// =====================================================================
// ULAR TANGGA KUIS: lempar dadu, jalan di papan 1-36, jawab soal tiap
// berhenti. Tangga menaikkan, ular menurunkan. Salah jawab mundur 2.
// Menang bila mencapai 36. Bonus-only. Soal dari pairs (left=soal).
// =====================================================================

const SNAKE_BOARD_N = 36;
const SNAKE_HEADS = { 26: 8, 33: 19, 30: 13 };   // kepala : ekor
const SNAKE_LADDERS = { 4: 15, 11: 24, 21: 32 }; // bawah : atas
const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

function SnakeLadderGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = game.pairs || [];

    const [pos, setPos] = React.useState(1);
    const [dice, setDice] = React.useState(2);
    const [rolling, setRolling] = React.useState(false);
    const [phase, setPhase] = React.useState("roll"); // roll | moving | quiz
    const [quiz, setQuiz] = React.useState(null);
    const [picked, setPicked] = React.useState(null);
    const [benar, setBenar] = React.useState(0);
    const [salah, setSalah] = React.useState(0);
    const [message, setMessage] = React.useState("Lempar dadunya! 🎲");
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 3) * 60);
    const [finished, setFinished] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);

    const score = Math.max(0, Math.round((pos / SNAKE_BOARD_N) * 100) - salah * 3);
    const theme = (typeof gameTheme === "function" ? gameTheme("snake") : { grad: "from-green-500 to-teal-600" });
    const timeWarning = timeLeft <= 15 && !finished;

    React.useEffect(() => {
        if (finished) return;
        const t = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
        return () => clearInterval(t);
    }, [finished]);

    React.useEffect(() => {
        if (!finished && timeLeft === 0) setFinished(true);
    }, [timeLeft, finished]);

    React.useEffect(() => {
        if (!finished || reported.current) return;
        reported.current = true;
        if (pos >= SNAKE_BOARD_N) playGameTone(1318, 0.4, "triangle");
        onFinish && onFinish({
            gameId: game.id, title: game.title, mapel: game.mapel, type: "snake",
            skor: score, benar, salah,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    const buildQuiz = (landingPos) => {
        if (pairs.length === 0) return null;
        const p = pairs[(landingPos - 1) % pairs.length];
        const others = shuffleArray(pairs.filter(o => o.right !== p.right)).slice(0, 3).map(o => o.right);
        return { q: p.left, answer: p.right, options: shuffleArray([p.right, ...others]) };
    };

    const rollDice = () => {
        if (finished || phase !== "roll" || rolling || pairs.length === 0) return;
        setRolling(true);
        playGameTone(520, 0.08);
        let ticks = 0;
        const roller = setInterval(() => {
            setDice(1 + Math.floor(Math.random() * 6));
            if (++ticks >= 7) {
                clearInterval(roller);
                const value = 1 + Math.floor(Math.random() * 6);
                setDice(value);
                setRolling(false);
                walkSteps(value);
            }
        }, 90);
    };

    const walkSteps = (steps) => {
        setPhase("moving");
        const target = Math.min(SNAKE_BOARD_N, pos + steps);
        let step = pos;
        playGameTone(700, 0.1);
        const walker = setInterval(() => {
            step++;
            setPos(step);
            playGameTone(600 + step * 8, 0.07);
            if (step >= target) {
                clearInterval(walker);
                setTimeout(() => landOn(step), 350);
            }
        }, 280);
    };

    const landOn = (step) => {
        let final = step;
        if (SNAKE_LADDERS[step]) {
            final = SNAKE_LADDERS[step];
            setMessage(`🪜 Yeay! Naik tangga ke ${final}!`);
            playGameTone(920, 0.15);
            setTimeout(() => playGameTone(1150, 0.2, "triangle"), 160);
        } else if (SNAKE_HEADS[step]) {
            final = SNAKE_HEADS[step];
            setMessage(`🐍 Aduh! Digigit ular, merosot ke ${final}!`);
            playGameTone(220, 0.3, "sawtooth");
        } else {
            setMessage(`Berhenti di ${step}. Jawab soalnya! 📝`);
        }
        setPos(final);
        if (final >= SNAKE_BOARD_N) {
            setMessage("🏁 FINIS! Kamu menang!");
            setTimeout(() => setFinished(true), 900);
            return;
        }
        setQuiz(buildQuiz(final));
        setPicked(null);
        setPhase("quiz");
    };

    const answerQuiz = (opt) => {
        if (finished || phase !== "quiz" || picked !== null || !quiz) return;
        setPicked(opt);
        if (opt === quiz.answer) {
            setBenar(v => v + 1);
            setMessage("✅ Betul! Tetap di sini, lempar lagi! 🎲");
            playGameTone(880, 0.15);
            setTimeout(() => { setQuiz(null); setPhase("roll"); }, 900);
        } else {
            const back = Math.max(1, pos - 2);
            setSalah(v => v + 1);
            setMessage(`❌ Kurang tepat! Mundur ke ${back}.`);
            playGameTone(170, 0.25, "sawtooth");
            setTimeout(() => { setPos(back); setQuiz(null); setPhase("roll"); }, 1100);
        }
    };

    const handleExit = () => {
        if (!finished && (benar + salah) > 0 && !window.confirm("Keluar dari game? Progres tidak akan disimpan.")) return;
        onExit();
    };

    // Papan zigzag: baris bawah ke atas, arah bolak-balik.
    const rows = [];
    for (let r = 0; r < 6; r++) {
        const base = r * 6;
        let nums = [1, 2, 3, 4, 5, 6].map(c => base + c);
        if (r % 2 === 1) nums = nums.reverse();
        rows.unshift(nums);
    }

    return (
        <div className="min-h-screen bg-[#ecfdf5] flex flex-col select-none relative overflow-hidden">
            <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-emerald-300/40 blur-3xl"></div>
            <div className="pointer-events-none absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-teal-300/40 blur-3xl"></div>

            <GameHud theme={{ ...theme, label: "Ular Tangga", emoji: "🐍" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />

            <main className="relative flex-1 max-w-2xl mx-auto w-full p-3 sm:p-5 space-y-3">
                <div className="bg-white/90 backdrop-blur rounded-3xl border border-white shadow-lg px-4 py-3 text-center">
                    <p className="text-sm font-black text-slate-800">📣 {message}</p>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">Posisi {pos}/{SNAKE_BOARD_N} · ✅ {benar} · ❌ {salah}</p>
                </div>

                {/* Papan */}
                <div className="bg-gradient-to-b from-amber-100 to-amber-50 rounded-[1.75rem] border-4 border-amber-300 shadow-xl p-2.5 sm:p-3">
                    {rows.map((nums, ri) => (
                        <div key={ri} className="grid grid-cols-6 gap-1 sm:gap-1.5">
                            {nums.map(n => {
                                const isHere = pos === n;
                                const isSnake = SNAKE_HEADS[n];
                                const isLadder = SNAKE_LADDERS[n];
                                const isFinish = n === SNAKE_BOARD_N;
                                return (
                                    <div key={n} className={`aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-[10px] sm:text-xs font-black border-2 relative
                                        ${isHere ? "bg-slate-900 text-white border-slate-900 shadow-lg scale-105 z-10"
                                        : isFinish ? "bg-gradient-to-br from-amber-400 to-yellow-500 border-amber-500 text-white"
                                        : (Math.floor((n - 1) / 6) % 2 === 0 ? "bg-white border-emerald-100 text-slate-600" : "bg-emerald-50 border-emerald-100 text-slate-600")}`}>
                                        <span className="opacity-60">{n}</span>
                                        <span className="text-base sm:text-xl leading-none">
                                            {isHere ? "🧑‍🎓" : isSnake ? "🐍" : isLadder ? "🪜" : isFinish ? "🏁" : ""}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Dadu / Kuis */}
                {phase === "quiz" && quiz ? (
                    <div key={`q-${pos}-${benar + salah}`} className="game-card-in bg-white rounded-[1.75rem] border border-white shadow-xl p-4 sm:p-5">
                        <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">📝 Soal di petak {pos}</p>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 mb-3">{quiz.q}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {quiz.options.map((opt, i) => {
                                const isAns = picked !== null && opt === quiz.answer;
                                const isWrong = picked === opt && opt !== quiz.answer;
                                return (
                                    <button key={i} onClick={() => answerQuiz(opt)}
                                        className={`px-3.5 py-3 rounded-2xl border-2 text-sm font-bold text-left transition-all active:scale-95 cursor-pointer
                                            ${isAns ? "bg-emerald-500 border-emerald-500 text-white game-pop"
                                            : isWrong ? "bg-rose-50 border-rose-400 text-rose-700 game-shake"
                                            : "bg-slate-50 border-slate-200 hover:border-emerald-300 text-slate-700"}`}>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <button onClick={rollDice} disabled={phase !== "roll" || rolling || finished}
                        className={`w-full py-4 rounded-[1.75rem] text-white font-black text-lg shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-3
                            ${phase !== "roll" || rolling ? "bg-slate-300 shadow-none" : `bg-gradient-to-r ${theme.grad} shadow-emerald-500/30 hover:brightness-110`}`}>
                        <span className={`text-4xl inline-block ${rolling ? "animate-spin" : ""}`}>{DICE_FACES[dice - 1]}</span>
                        {rolling ? "Mengocok..." : phase === "moving" ? "Berjalan..." : "🎲 LEMPAR DADU"}
                    </button>
                )}
            </main>

            {finished && <GameResultModal score={score} benar={benar} salah={salah} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel={pos >= SNAKE_BOARD_N ? "Kamu mencapai finis! 🏁" : "Waktu habis! ⏰"} onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
