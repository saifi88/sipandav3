// =====================================================================
// GAME SHELL: kontrak & helper bersama semua tipe game (bonus-only).
// Setiap game memanggil onFinish({gameId,title,mapel,type,skor,benar,salah,durasiDetik}).
// =====================================================================

const GAME_TYPE_META = {
    match: { label: "Mencocokkan", emoji: "🧩", desc: "Seret kartu ke pasangan yang tepat" },
    memory: { label: "Memori", emoji: "🃏", desc: "Buka kartu dan temukan pasangannya" },
    quizrush: { label: "Kuis Cepat", emoji: "⚡", desc: "Jawab benar secepat mungkin" }
};

const GAME_TYPES = ["match", "memory", "quizrush"];

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

function GameResultModal({ score, benar, salah, durasiDetik, playerName, finishedLabel, onExit, onReplay }) {
    const stars = scoreToStars(score);
    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center animate-in">
                <div className="text-5xl mb-2">🎉</div>
                <h2 className="text-xl font-black text-slate-800">{finishedLabel || "Hebat!"}</h2>
                <p className="text-xs text-slate-500 mt-1">{playerName}</p>
                <p className="text-[11px] text-violet-600 font-bold mt-1 bg-violet-50 inline-block px-3 py-1 rounded-full">✨ Nilai bonus latihan — tidak mengubah nilai tugas</p>
                <div className="flex justify-center gap-1 my-4 text-3xl">
                    {[1, 2, 3].map(i => <span key={i} className={i <= stars ? "" : "grayscale opacity-30"}>⭐</span>)}
                </div>
                <div className="text-5xl font-black text-violet-600 mb-4">{score}</div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-6">
                    <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-100">
                        <p className="text-emerald-600 font-bold text-lg">{benar}</p>
                        <p className="text-slate-500">Benar</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-2 border border-red-100">
                        <p className="text-red-500 font-bold text-lg">{salah}</p>
                        <p className="text-slate-500">Salah</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                        <p className="text-slate-700 font-bold text-lg">{formatGameTime(durasiDetik)}</p>
                        <p className="text-slate-500">Waktu</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onExit} className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors cursor-pointer">
                        Kembali
                    </button>
                    <button onClick={onReplay} className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors shadow-sm cursor-pointer">
                        🔁 Main Lagi
                    </button>
                </div>
            </div>
        </div>
    );
}
