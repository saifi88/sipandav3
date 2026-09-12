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
    race: { label: "Balapan Kuis", emoji: "🏎️", desc: "Jawab cepat dan salip komputer sampai finis", grad: "from-fuchsia-500 via-purple-500 to-indigo-600", soft: "bg-fuchsia-100 text-fuchsia-700", ring: "ring-fuchsia-200" },
    tower: { label: "Menara Logika", emoji: "🗼", desc: "Panjat menara, jaga nyawa & combo beruntun", grad: "from-indigo-500 via-violet-500 to-purple-600", soft: "bg-indigo-100 text-indigo-700", ring: "ring-indigo-200" },
    sequence: { label: "Susun Kalimat", emoji: "📜", desc: "Susun kata acak jadi kalimat yang benar", grad: "from-teal-500 via-emerald-500 to-green-600", soft: "bg-teal-100 text-teal-700", ring: "ring-teal-200" },
    maze: { label: "Labirin Harta", emoji: "🗺️", desc: "Jelajahi labirin, kumpulkan kunci, hindari jebakan", grad: "from-amber-500 via-orange-500 to-red-500", soft: "bg-amber-100 text-amber-700", ring: "ring-amber-200" },
    defense: { label: "Invasi Robot", emoji: "🤖", desc: "Hancurkan robot sebelum mencapai markas", grad: "from-rose-500 via-red-500 to-orange-500", soft: "bg-rose-100 text-rose-700", ring: "ring-rose-200" },
    feed: { label: "Monster Lapar", emoji: "👾", desc: "Suapi Mochi dengan jawaban yang benar", grad: "from-orange-400 via-pink-500 to-purple-500", soft: "bg-orange-100 text-orange-700", ring: "ring-orange-200" }
};

const GAME_TYPES = ["match", "memory", "quizrush", "balloon", "scramble", "snake", "truefalse", "hangman", "boss", "sort", "fillblank", "race", "tower", "sequence", "maze", "defense", "feed"];

const gameTheme = (type) => GAME_TYPE_META[type] || { label: type, emoji: "🎲", desc: "", grad: "from-slate-500 to-slate-700", soft: "bg-slate-100 text-slate-600", ring: "ring-slate-200" };

const formatGameTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

// Anti-farm: maksimal 1 penyimpanan per game per level per 30 detik per siswa.
const canSaveGameResult = (nisn, gameId, level) => {
    try {
        const key = `game_last_${nisn}_${gameId}_${level || "sedang"}`;
        const last = Number(localStorage.getItem(key) || 0);
        if (Date.now() - last < 30000) return false;
        localStorage.setItem(key, String(Date.now()));
        return true;
    } catch (e) { return true; }
};

// =====================================================================
// SISTEM LEVEL KESULITAN (berlaku untuk semua game lama).
// 🌱 Mudah  = 1x putaran bank soal, penalti kecil, tanpa timer per soal.
// 🔥 Sedang = 2x putaran (soal diacak ulang), penalti sedang + timer 20 dtk.
// ⚡ Sulit  = 3x putaran, penalti besar + timer 12 dtk per soal.
// Total waktu tetap = durasi game, jadi makin tinggi level makin sempit
// waktu per soal. Skor 100 jauh lebih sulit didapat.
// =====================================================================

const GAME_DIFFICULTY = {
    mudah: { key: "mudah", label: "Mudah", emoji: "🌱", desc: "Santai · 1 putaran soal", rounds: 1, penalty: 3, timePerQ: 0 },
    sedang: { key: "sedang", label: "Sedang", emoji: "🔥", desc: "Menantang · 2 putaran soal", rounds: 2, penalty: 6, timePerQ: 20 },
    sulit: { key: "sulit", label: "Sulit", emoji: "⚡", desc: "Ekstrem · 3 putaran + waktu ketat", rounds: 3, penalty: 10, timePerQ: 12 }
};
const GAME_DIFFICULTY_ORDER = ["mudah", "sedang", "sulit"];

const diffSettings = (level) => GAME_DIFFICULTY[level] || GAME_DIFFICULTY.sedang;

// Ulangi bank soal sebanyak `rounds` putaran, tiap putaran diacak ulang.
// (Dipakai sebagai fallback bila game masih memakai format lama: satu array
// untuk semua level.)
const buildRounds = (pairs, rounds) => {
    const out = [];
    const n = Math.max(1, rounds || 1);
    for (let r = 0; r < n; r++) {
        const sh = (typeof shuffleArray === "function" ? shuffleArray : (a) => a)(pairs.map(p => ({ left: p.left, right: p.right })));
        sh.forEach(o => out.push({ left: o.left, right: o.right, round: r + 1 }));
    }
    return out;
};

// =====================================================================
// BANK SOAL PER LEVEL: game.pairs boleh berupa:
//   - array (format lama): satu bank untuk semua level (fallback putaran).
//   - objek { mudah:[...], sedang:[...], sulit:[...] }: tiap level punya
//     soal yang benar-benar berbeda. Kolom Sheet TIDAK berubah (tetap JSON).
// =====================================================================

const isPerLevelPairs = (pairs) => (
    pairs && typeof pairs === "object" && !Array.isArray(pairs) &&
    (Array.isArray(pairs.mudah) || Array.isArray(pairs.sedang) || Array.isArray(pairs.sulit))
);

const isPerLevelGame = (game) => isPerLevelPairs(game && game.pairs);

// Semua pasangan dalam satu array datar (untuk pengecoh & fallback).
const flatPairs = (game) => {
    const p = game && game.pairs;
    if (!p) return [];
    if (Array.isArray(p)) return p.filter(x => x && x.left !== undefined && x.right !== undefined);
    if (isPerLevelPairs(p)) {
        return ["mudah", "sedang", "sulit"]
            .flatMap(k => (Array.isArray(p[k]) ? p[k] : []))
            .filter(x => x && x.left !== undefined && x.right !== undefined);
    }
    return [];
};

// Bank soal untuk level tertentu. Fallback: ulangi bank tunggal per putaran.
const bankForLevel = (game, level, rounds) => {
    const p = game && game.pairs;
    if (isPerLevelPairs(p)) {
        const bank = Array.isArray(p[level]) ? p[level] : [];
        if (bank.length > 0) return bank.map(o => ({ left: o.left, right: o.right, round: 1 }));
        // Level kosong → pakai bank level lain yang ada.
        const other = ["mudah", "sedang", "sulit"].map(k => p[k]).find(a => Array.isArray(a) && a.length > 0) || [];
        return other.map(o => ({ left: o.left, right: o.right, round: 1 }));
    }
    const arr = Array.isArray(p) ? p : [];
    return buildRounds(arr, rounds || 1);
};

// Jumlah soal per level (untuk layar pilih level & kartu game).
const levelBankCounts = (game) => {
    const p = game && game.pairs;
    if (isPerLevelPairs(p)) {
        return {
            mudah: (p.mudah || []).length,
            sedang: (p.sedang || []).length,
            sulit: (p.sulit || []).length,
            perLevel: true
        };
    }
    const n = Array.isArray(p) ? p.length : 0;
    return { mudah: n, sedang: n * 2, sulit: n * 3, perLevel: false };
};

// Bangun opsi pilihan ganda dari daftar putaran (1 benar + 3 pengecoh).
const buildMCQ = (roundsArr, pairs) => roundsArr.map((r) => {
    const others = (typeof shuffleArray === "function" ? shuffleArray : (a) => a)(
        pairs.filter(p => String(p.right) !== String(r.right))
    ).slice(0, 3).map(o => o.right);
    const opts = (typeof shuffleArray === "function" ? shuffleArray : (a) => a)([r.right, ...others]);
    return { q: r.left, answer: r.right, options: opts, round: r.round };
});

// Skor tantangan: penalti per level, makin sulit makin perih.
const calcChallengeScore = (benar, total, salah, level) => {
    if (!total) return 0;
    return Math.max(0, Math.round((benar / total) * 100 - salah * diffSettings(level).penalty));
};

const levelLabel = (level) => {
    const d = diffSettings(level);
    return `${d.emoji} ${d.label}`;
};

// Lencana level kecil untuk HUD / kartu.
function DifficultyBadge({ level }) {
    const d = diffSettings(level);
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-black shrink-0">{d.emoji} {d.label}</span>
    );
}

// Layar pilih level yang ramah anak SD. dipakai di awal tiap game.
// `banks` (opsional): { mudah, sedang, sulit, perLevel } dari levelBankCounts().
function DifficultySelect({ theme, mapel, title, pairCount, banks, typeLabel, onPick, onExit }) {
    const soalFor = (key) => {
        if (banks) return banks[key] || 0;
        const d = GAME_DIFFICULTY[key];
        return (pairCount || 0) * d.rounds;
    };
    const distinct = banks ? !!banks.perLevel : false;
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-900 flex flex-col select-none relative overflow-hidden">
            <div className="pointer-events-none absolute top-10 left-8 text-3xl game-float">🎮</div>
            <div className="pointer-events-none absolute top-24 right-10 text-2xl game-float" style={{ animationDelay: "1s" }}>⭐</div>
            <GameHud theme={theme} mapel={mapel} title={title} score={0} timeLeft={(3 * 60)} timeWarning={false} onExit={onExit} />
            <main className="relative flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-3">
                <div className="text-center pt-2">
                    <div className="text-5xl game-float inline-block">{theme.emoji}</div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-2">Pilih Level Tantanganmu!</h2>
                    <p className="text-white/70 text-sm font-semibold mt-1">{typeLabel} · {distinct ? "bank soal berbeda tiap level!" : `${pairCount} soal dasar`} · makin tinggi level, makin menantang!</p>
                </div>
                {GAME_DIFFICULTY_ORDER.map((key) => {
                    const d = GAME_DIFFICULTY[key];
                    const soal = soalFor(key);
                    return (
                        <button key={key} onClick={() => onPick(key)}
                            className="w-full text-left bg-white rounded-[1.75rem] p-4 sm:p-5 shadow-xl hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden group">
                            <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${theme.grad}`}></div>
                            <div className="flex items-center gap-3">
                                <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform">{d.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-900 text-base sm:text-lg">Level {d.label}</p>
                                    <p className="text-xs text-slate-500 font-semibold">{distinct ? `${soal} soal khusus level ini` : d.desc}</p>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        <span className="px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-[11px] font-black">📝 {soal} soal</span>
                                        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-600 text-[11px] font-black">−{d.penalty}/salah</span>
                                        {d.timePerQ > 0
                                            ? <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[11px] font-black">⏱ {d.timePerQ} dtk/soal</span>
                                            : <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-black">⏱ santai</span>}
                                    </div>
                                </div>
                                <span className={`px-4 py-2.5 rounded-2xl bg-gradient-to-r ${theme.grad} text-white text-xs font-black shadow-lg shrink-0`}>Main ▶</span>
                            </div>
                        </button>
                    );
                })}
                <p className="text-center text-[11px] font-bold text-white/50">💡 Skor 100 di level ⚡ Sulit = bintang sejati! Skor tersimpan per level.</p>
            </main>
        </div>
    );
}

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

// Layar penuh untuk game (nyaman di HP): sembunyikan address bar browser.
// iOS Safari tidak mendukung fullscreen elemen → gagal diam-diam (aman).
const requestGameFullscreen = () => {
    try {
        const el = document.documentElement;
        if (document.fullscreenElement || document.webkitFullscreenElement) return;
        if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } catch (e) {}
};

const exitGameFullscreen = () => {
    try {
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
        else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
    } catch (e) {}
};

const toggleGameFullscreen = () => {
    try {
        if (document.fullscreenElement || document.webkitFullscreenElement) exitGameFullscreen();
        else requestGameFullscreen();
    } catch (e) {}
};

function GameHud({ theme, mapel, title, score, timeLeft, timeWarning, onExit }) {
    return (
        <header className="sticky top-0 z-40 px-3 sm:px-5 pt-3">
            <div className="max-w-5xl mx-auto flex items-center gap-2 sm:gap-3 rounded-3xl border border-white/50 bg-white/75 backdrop-blur-xl shadow-lg shadow-violet-900/10 px-3 sm:px-4 py-2.5">
                <button onClick={onExit} className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0" title="Kembali">
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
                <button onClick={() => { if (typeof toggleGameFullscreen === "function") toggleGameFullscreen(); }} className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0" title="Layar penuh">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>
                </button>
            </div>
        </header>
    );
}

function GameResultModal({ score, benar, salah, durasiDetik, playerName, finishedLabel, onExit, onReplay, level }) {
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
                        {level && (
                            <div className="mt-1.5"><span className="text-[11px] font-black text-slate-700 bg-slate-100 inline-block px-3 py-1 rounded-full">Level: {levelLabel(level)}</span></div>
                        )}
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
