// =====================================================================
// GAME SHELL: kontrak & helper bersama semua tipe game (bonus-only).
// Setiap game memanggil onFinish({gameId,title,mapel,type,skor,benar,salah,durasiDetik}).
// Tema modern: gradient per tipe + HUD kaca + modal hasil meriah.
// =====================================================================

const GAME_TYPE_META = {
    match: { label: "Mencocokkan", emoji: "🧩", desc: "Seret kartu ke pasangan yang tepat", grad: "from-violet-500 via-purple-500 to-fuchsia-500", soft: "bg-violet-100 text-violet-700", ring: "ring-violet-200" },
    memory: { label: "Memori", emoji: "🃏", desc: "Buka kartu dan temukan pasangannya", grad: "from-cyan-500 via-sky-500 to-indigo-500", soft: "bg-cyan-100 text-cyan-700", ring: "ring-cyan-200" },
    quizrush: { label: "Kuis Cepat", emoji: "⚡", desc: "Jawab benar secepat mungkin", grad: "from-amber-500 via-orange-500 to-pink-500", soft: "bg-amber-100 text-amber-700", ring: "ring-amber-200" },
    balloon: { label: "Balon Meletus", emoji: "🎈", desc: "Letuskan balon jawaban yang benar", grad: "from-sky-400 via-blue-500 to-indigo-600", soft: "bg-sky-100 text-sky-700", ring: "ring-sky-200" },
    scramble: { label: "Acak Kata", emoji: "🔤", desc: "Susun huruf acak jadi kata yang benar", grad: "from-lime-500 via-emerald-500 to-teal-600", soft: "bg-lime-100 text-lime-700", ring: "ring-lime-200" },
    snake: { label: "Ular Tangga", emoji: "🐍", desc: "Lempar dadu, jawab soal, kejar finis", grad: "from-green-500 via-emerald-500 to-teal-600", soft: "bg-green-100 text-green-700", ring: "ring-green-200" },
    truefalse: { label: "Benar atau Salah", emoji: "🤔", desc: "Nilai pernyataan dengan cepat dan tepat", grad: "from-rose-500 via-red-500 to-orange-500", soft: "bg-rose-100 text-rose-700", ring: "ring-rose-200" },
    hangman: { label: "Tebak Kata", emoji: "🕵️", desc: "Tebak huruf demi huruf sebelum balon habis", grad: "from-violet-500 via-purple-500 to-indigo-600", soft: "bg-violet-100 text-violet-700", ring: "ring-violet-200" },
    boss: { label: "Boss Battle", emoji: "👹", desc: "Kalahkan Raja Monster dengan jawaban benar", grad: "from-red-600 via-rose-600 to-orange-500", soft: "bg-red-100 text-red-700", ring: "ring-red-200" },
    sort: { label: "Sortir Cepat", emoji: "🧺", desc: "Kelompokkan benda ke keranjang yang benar", grad: "from-teal-500 via-emerald-500 to-green-600", soft: "bg-teal-100 text-teal-700", ring: "ring-teal-200" },
    fillblank: { label: "Isian Singkat", emoji: "✍️", desc: "Lengkapi kalimat dengan mengetik jawaban", grad: "from-indigo-500 via-blue-500 to-sky-500", soft: "bg-indigo-100 text-indigo-700", ring: "ring-indigo-200" },
    race: { label: "Balapan Kuis", emoji: "🏎️", desc: "Jawab cepat dan salip komputer sampai finis", grad: "from-fuchsia-500 via-purple-500 to-indigo-600", soft: "bg-fuchsia-100 text-fuchsia-700", ring: "ring-fuchsia-200" }
};

const GAME_TYPES = ["match", "memory", "quizrush", "balloon", "scramble", "snake", "truefalse", "hangman", "boss", "sort", "fillblank", "race"];

const gameTheme = (type) => GAME_TYPE_META[type] || { label: type, emoji: "🎲", desc: "", grad: "from-slate-500 to-slate-700", soft: "bg-slate-100 text-slate-600", ring: "ring-slate-200" };

const formatGameTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

// Anti-farm: maksimal 1 penyimpanan per game per 30 detik per siswa.
const canSaveGameResult = (nisn, gameId) => {
    try {
        const key = `game_last_${nisn}_${gameId}`;
        const last = Number(localStorage.getItem(key) || 0);
        if (Date.now() - last < 30000) return false;
        localStorage.setItem(key, String(Date.now()));
        return true;
    } catch (e) { return true; }
};

const bestScoreForGame = (gameResults, nisn, gameId) => {
    const mine = (gameResults || []).filter(r => String(r.nisn) === String(nisn) && r.gameId === gameId);
    if (mine.length === 0) return null;
    return Math.max(...mine.map(r => Number(r.skor) || 0));
};

// Game latihan yang terhubung ke tugas formal (linkedExamId) atau mapel yang sama.
const gamesForExam = (games, exam) => {
    if (!exam || !games) return [];
    return games.filter(g =>
        (g.linkedExamId && String(g.linkedExamId) === String(exam.id)) ||
        (!g.linkedExamId && g.mapel && exam.title && String(exam.title).toLowerCase().includes(String(g.mapel).toLowerCase()))
    );
};

function GameHud({ theme, mapel, title, score, timeLeft, timeWarning, onExit }) {
    return (
        <header className="sticky top-0 z-40 px-3 sm:px-5 pt-3">
            <div className="max-w-5xl mx-auto flex items-center gap-2 sm:gap-3 rounded-3xl border border-white/50 bg-white/75 backdrop-blur-xl shadow-lg shadow-violet-900/10 px-3 sm:px-4 py-2.5">
                <button onClick={onExit} className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0" title="Kembali">
                    <Icon name="chevron-left" size={20} />
                </button>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 truncate">{theme.emoji} {theme.label} · {mapel} · Bonus</p>
                    <h1 className="font-black text-sm sm:text-base text-slate-900 truncate leading-tight">{title}</h1>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-amber-500">
                    <span>★</span><span>★</span><span>★</span>
                </div>
                <div className={`px-3 py-2 rounded-2xl text-xs font-black text-white bg-gradient-to-r ${theme.grad} shadow-md shrink-0`}>⭐ {score}</div>
                <div className={`px-3 py-2 rounded-2xl text-xs font-black font-mono shrink-0 border ${timeWarning ? "bg-red-500 text-white border-red-400 animate-pulse" : "bg-slate-900 text-white border-slate-700"}`}>
                    ⏱ {formatGameTime(timeLeft)}
                </div>
            </div>
        </header>
    );
}

function GameResultModal({ score, benar, salah, durasiDetik, playerName, finishedLabel, onExit, onReplay }) {
    const stars = scoreToStars(score);
    const confetti = React.useMemo(() => (
        Array.from({ length: 18 }).map((_, i) => ({
            left: `${(i * 53) % 100}%`,
            delay: `${(i % 7) * 0.35}s`,
            dur: `${2.4 + (i % 5) * 0.5}s`,
            char: ["🎉", "⭐", "✨", "🎊", "💜", "🍬"][i % 6],
            size: 14 + (i % 4) * 6
        }))
    ), []);
    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                {confetti.map((c, i) => (
                    <span key={i} className="game-confetti-piece" style={{ left: c.left, animationDelay: c.delay, animationDuration: c.dur, fontSize: c.size }}>{c.char}</span>
                ))}
            </div>
            <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-sm w-full overflow-hidden game-card-in">
                <div className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400 px-6 pt-7 pb-10 text-center relative">
                    <div className="absolute -top-8 -left-8 w-28 h-28 rounded-full bg-white/20 blur-2xl"></div>
                    <div className="absolute -bottom-10 -right-6 w-32 h-32 rounded-full bg-white/20 blur-2xl"></div>
                    <div className="text-6xl mb-1 game-float inline-block">🏆</div>
                    <h2 className="text-2xl font-black text-white drop-shadow-sm">{finishedLabel || "Hebat!"}</h2>
                    <p className="text-xs font-bold text-white/85 mt-1">{playerName}</p>
                </div>
                <div className="px-6 pb-6 -mt-6">
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 px-5 py-4 text-center">
                        <div className="flex justify-center gap-1.5 -mt-9 mb-2">
                            {[1, 2, 3].map(i => (
                                <span key={i} className={`text-4xl game-star-pop ${i <= stars ? "" : "grayscale opacity-25"}`} style={{ animationDelay: `${i * 0.12}s` }}>⭐</span>
                            ))}
                        </div>
                        <div className="text-6xl font-black bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent game-gradient-text">{score}</div>
                        <p className="text-[11px] font-bold text-violet-600 bg-violet-50 inline-block px-3 py-1 rounded-full mt-1">✨ Nilai bonus latihan</p>
                        <div className="grid grid-cols-3 gap-2 text-xs mt-4">
                            <div className="rounded-2xl p-2.5 border bg-gradient-to-b from-emerald-50 to-white border-emerald-100">
                                <p className="text-emerald-600 font-black text-xl leading-none">{benar}</p>
                                <p className="text-slate-500 font-bold mt-1">Benar</p>
                            </div>
                            <div className="rounded-2xl p-2.5 border bg-gradient-to-b from-rose-50 to-white border-rose-100">
                                <p className="text-rose-500 font-black text-xl leading-none">{salah}</p>
                                <p className="text-slate-500 font-bold mt-1">Salah</p>
                            </div>
                            <div className="rounded-2xl p-2.5 border bg-gradient-to-b from-slate-50 to-white border-slate-200">
                                <p className="text-slate-800 font-black text-xl leading-none">{formatGameTime(durasiDetik)}</p>
                                <p className="text-slate-500 font-bold mt-1">Waktu</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={onExit} className="flex-1 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-black transition-all active:scale-95 cursor-pointer">
                            Kembali
                        </button>
                        <button onClick={onReplay} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-400 text-white text-sm font-black transition-all shadow-lg shadow-fuchsia-500/30 active:scale-95 cursor-pointer">
                            🔁 Main Lagi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
