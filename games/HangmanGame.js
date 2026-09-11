// =====================================================================
// TEBAK KATA (HANGMAN RAMAH ANAK): tebak huruf demi huruf.
// Petunjuk (left) ditampilkan, kata (right) ditebak. 6 balon nyawa —
// tiap salah satu balon meletus. Habis = kata gagal. Bonus-only.
// =====================================================================

const HANGMAN_LIVES = 6;
const HANGMAN_ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function HangmanGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = game.pairs || [];
    const total = pairs.length;

    const [idx, setIdx] = React.useState(0);
    const [benar, setBenar] = React.useState(0);
    const [salah, setSalah] = React.useState(0);
    const [guessed, setGuessed] = React.useState([]);
    const [reveal, setReveal] = React.useState(false);
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 3) * 60);
    const [finished, setFinished] = React.useState(false);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);
    const lock = React.useRef(false);

    const score = total === 0 ? 0 : Math.max(0, Math.round((benar / total) * 100 - salah * 5));
    const theme = (typeof gameTheme === "function" ? gameTheme("hangman") : { grad: "from-violet-500 to-indigo-600" });
    const timeWarning = timeLeft <= 15 && !finished;

    const cur = pairs[idx];
    const word = cur ? String(cur.right).toUpperCase() : "";
    const needLetters = word.split("").filter(ch => HANGMAN_ALPHA.includes(ch));
    const uniqueNeed = [...new Set(needLetters)];
    const wrongLetters = guessed.filter(l => !needLetters.includes(l));
    const livesLeft = HANGMAN_LIVES - wrongLetters.length;
    const solved = uniqueNeed.length > 0 && uniqueNeed.every(l => guessed.includes(l));

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
            gameId: game.id, title: game.title, mapel: game.mapel, type: "hangman",
            skor: score, benar, salah,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    React.useEffect(() => { setGuessed([]); setReveal(false); lock.current = false; }, [idx]);

    const nextWord = () => { setIdx(i => i + 1); };

    const guess = (L) => {
        if (finished || guessed.includes(L) || lock.current || solved || reveal) return;
        const g = [...guessed, L];
        setGuessed(g);
        if (needLetters.includes(L)) {
            playGameTone(760, 0.1);
            const done = uniqueNeed.every(l => g.includes(l));
            if (done) {
                lock.current = true;
                setBenar(v => v + 1);
                playGameTone(880, 0.12);
                setTimeout(() => playGameTone(1174, 0.2, "triangle"), 140);
                setTimeout(nextWord, 900);
            }
        } else {
            playGameTone(180, 0.2, "sawtooth");
            const wrongNow = g.filter(l => !needLetters.includes(l)).length;
            if (wrongNow >= HANGMAN_LIVES) {
                lock.current = true;
                setReveal(true);
                setSalah(v => v + 1);
                setTimeout(nextWord, 1800);
            }
        }
    };

    const handleExit = () => {
        if (!finished && (benar + salah) > 0 && !window.confirm("Keluar dari game? Progres tidak akan disimpan.")) return;
        onExit();
    };

    return (
        <div className="min-h-screen bg-[#f5f3ff] flex flex-col select-none relative overflow-hidden">
            <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-violet-300/40 blur-3xl"></div>
            <div className="pointer-events-none absolute top-1/3 -left-24 w-80 h-80 rounded-full bg-indigo-300/40 blur-3xl"></div>

            <GameHud theme={{ ...theme, label: "Tebak Kata", emoji: "🕵️" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />

            <main className="relative flex-1 max-w-2xl mx-auto w-full p-3 sm:p-5 space-y-3">
                {/* Nyawa balon */}
                <div className="bg-white/90 backdrop-blur rounded-3xl border border-white shadow-lg px-4 py-3 text-center">
                    <div className="text-2xl tracking-wider">
                        {Array.from({ length: HANGMAN_LIVES }).map((_, i) => (
                            <span key={i} className={i < livesLeft ? "" : "grayscale opacity-30"}>{i < livesLeft ? "🎈" : "💥"}</span>
                        ))}
                    </div>
                    <p className="text-[11px] font-black text-slate-500 mt-1">Kata {Math.min(idx + 1, total)}/{total} · ✅ {benar} kata · ❌ {salah} kata</p>
                </div>

                {/* Petunjuk + slot */}
                <div key={idx} className="game-card-in bg-white rounded-[1.75rem] border border-white shadow-xl p-5 text-center relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${theme.grad}`}></div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-violet-500">🕵️ Petunjuk</p>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">{cur ? cur.left : "…"}</h2>
                    <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                        {word.split("").map((ch, i) => {
                            if (!HANGMAN_ALPHA.includes(ch)) return <span key={i} className="w-6 text-lg font-black text-slate-300">{ch}</span>;
                            const open = guessed.includes(ch) || reveal;
                            return (
                                <span key={i} className={`w-9 h-12 sm:w-10 sm:h-13 sm:py-2.5 rounded-2xl border-2 text-lg sm:text-xl font-black flex items-center justify-center transition-all
                                    ${open ? (needLetters.includes(ch) ? "bg-emerald-500 border-emerald-500 text-white game-pop" : "bg-white border-slate-200 text-slate-700") : "bg-slate-100 border-slate-200 text-transparent"}`}>
                                    {open ? ch : "·"}
                                </span>
                            );
                        })}
                    </div>
                    {reveal && <p className="text-sm font-black text-rose-500 mt-3">Yahh, balonnya habis! Jawabannya: {word} 😅</p>}
                    {solved && <p className="text-sm font-black text-emerald-600 mt-3">🎉 Betul! Hebat sekali!</p>}
                </div>

                {/* Papan huruf */}
                <div className="bg-white/70 backdrop-blur rounded-[1.75rem] border border-white shadow-lg p-3.5">
                    <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5">
                        {HANGMAN_ALPHA.map(L => {
                            const used = guessed.includes(L);
                            const good = used && needLetters.includes(L);
                            return (
                                <button key={L} onClick={() => guess(L)} disabled={used || finished}
                                    className={`aspect-square rounded-xl text-sm sm:text-base font-black transition-all active:scale-90 cursor-pointer border-2
                                        ${!used ? "bg-slate-900 border-slate-900 text-white hover:-translate-y-0.5 shadow-md"
                                        : good ? "bg-emerald-500 border-emerald-500 text-white"
                                        : "bg-slate-100 border-slate-200 text-slate-300 line-through"}`}>
                                    {L}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </main>

            {finished && <GameResultModal score={score} benar={benar} salah={salah} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel="Misi detektif selesai! 🕵️" onExit={onExit} onReplay={onReplay} />}
        </div>
    );
}
