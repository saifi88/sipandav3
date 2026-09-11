// =====================================================================
// GAME MENCOCOKKAN (DRAG & DROP)
// Menggunakan Pointer Events agar berjalan di mouse maupun layar sentuh.
// Mode alternatif: ketuk item kiri lalu ketuk kotak kanan (untuk HP kecil).
// Catatan: helper `Icon` dan `shuffleArray` berasal dari index.html dan
// tersedia saat runtime karena semua script dimuat di halaman yang sama.
// =====================================================================

let sipandaAudioCtx = null;
const playGameTone = (freq, duration, type = "sine") => {
    try {
        sipandaAudioCtx = sipandaAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const osc = sipandaAudioCtx.createOscillator();
        const gain = sipandaAudioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, sipandaAudioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, sipandaAudioCtx.currentTime + duration);
        osc.connect(gain).connect(sipandaAudioCtx.destination);
        osc.start();
        osc.stop(sipandaAudioCtx.currentTime + duration);
    } catch (e) { /* audio tidak wajib */ }
};

const WRONG_PENALTY = 5; // poin dikurangi setiap salah pasang

const calcMatchScore = (benar, salah, total) => {
    if (total === 0) return 0;
    const raw = (benar / total) * 100 - salah * WRONG_PENALTY;
    return Math.max(0, Math.round(raw));
};

const scoreToStars = (score) => (score >= 90 ? 3 : score >= 70 ? 2 : score > 0 ? 1 : 0);

function MatchGame({ game, currentUser, onFinish, onExit, onReplay }) {
    const pairs = game.pairs || [];
    const total = pairs.length;

    const [leftItems] = React.useState(() => shuffleArray(pairs.map((p, i) => ({ id: i, text: p.left }))));
    const [rightItems] = React.useState(() => shuffleArray(pairs.map((p, i) => ({ id: i, text: p.right }))));
    const [matched, setMatched] = React.useState({});
    const [wrongCount, setWrongCount] = React.useState(0);
    const [selected, setSelected] = React.useState(null);
    const [drag, setDrag] = React.useState(null);
    const [hoverTarget, setHoverTarget] = React.useState(null);
    const [shakeId, setShakeId] = React.useState(null);
    const [popId, setPopId] = React.useState(null);
    const [timeLeft, setTimeLeft] = React.useState((game.duration || 3) * 60);
    const [finished, setFinished] = React.useState(false);

    const dragRef = React.useRef(null);
    const startedAt = React.useRef(Date.now());
    const reported = React.useRef(false);

    const matchedCount = Object.keys(matched).length;
    const score = calcMatchScore(matchedCount, wrongCount, total);
    const progress = total > 0 ? Math.round((matchedCount / total) * 100) : 0;

    // Timer
    React.useEffect(() => {
        if (finished) return;
        const t = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
        return () => clearInterval(t);
    }, [finished]);

    // Selesai jika semua cocok atau waktu habis
    React.useEffect(() => {
        if (finished) return;
        if ((total > 0 && matchedCount === total) || timeLeft === 0) {
            setFinished(true);
        }
    }, [matchedCount, timeLeft, total, finished]);

    // Laporkan hasil sekali saja
    React.useEffect(() => {
        if (!finished || reported.current) return;
        reported.current = true;
        if (matchedCount === total) playGameTone(1046, 0.35, "triangle");
        onFinish && onFinish({
            gameId: game.id,
            title: game.title,
            mapel: game.mapel,
            type: "match",
            skor: score,
            benar: matchedCount,
            salah: wrongCount,
            durasiDetik: Math.round((Date.now() - startedAt.current) / 1000)
        });
    }, [finished]);

    const attemptMatch = (leftId, rightId) => {
        if (finished || matched[leftId] || matched[rightId]) return;
        if (leftId === rightId) {
            setMatched(m => ({ ...m, [leftId]: true }));
            setPopId(rightId);
            playGameTone(880, 0.15);
            setTimeout(() => setPopId(null), 600);
        } else {
            setWrongCount(c => c + 1);
            setShakeId(rightId);
            playGameTone(160, 0.25, "sawtooth");
            setTimeout(() => setShakeId(null), 500);
        }
        setSelected(null);
    };

    const findDropTarget = (x, y) => {
        const el = document.elementFromPoint(x, y);
        const t = el && el.closest("[data-drop-id]");
        return t ? Number(t.dataset.dropId) : null;
    };

    const handlePointerDown = (e, item) => {
        if (finished || matched[item.id]) return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        dragRef.current = {
            id: item.id, text: item.text,
            startX: e.clientX, startY: e.clientY, moved: false,
            dx: e.clientX - rect.left, dy: e.clientY - rect.top, w: rect.width
        };
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    };

    const handlePointerMove = (e) => {
        const d = dragRef.current;
        if (!d) return;
        if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 6) return;
        d.moved = true;
        setDrag({ ...d, x: e.clientX, y: e.clientY });
        setHoverTarget(findDropTarget(e.clientX, e.clientY));
    };

    const handlePointerUp = (e) => {
        const d = dragRef.current;
        if (!d) return;
        dragRef.current = null;
        setDrag(null);
        setHoverTarget(null);
        if (!d.moved) {
            // Mode ketuk: pilih / batal pilih item kiri
            setSelected(prev => (prev === d.id ? null : d.id));
            return;
        }
        const targetId = findDropTarget(e.clientX, e.clientY);
        if (targetId !== null) attemptMatch(d.id, targetId);
    };

    const handleExit = () => {
        if (!finished && matchedCount > 0 && !window.confirm("Keluar dari game? Progres tidak akan disimpan.")) return;
        onExit();
    };

    const formatTime = s => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
    const stars = scoreToStars(score);
    const timeWarning = timeLeft <= 15 && !finished;

    return (
        <div className="min-h-screen bg-gradient-to-b from-violet-100 via-slate-100 to-slate-100 flex flex-col select-none">
            {/* HEADER */}
            <header className="bg-violet-700 text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-40">
                <div className="flex items-center gap-3 min-w-0">
                    <button onClick={handleExit} className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors cursor-pointer" title="Kembali">
                        <Icon name="chevron-left" size={20} />
                    </button>
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-violet-200">🎮 Mencocokkan · {game.mapel}</p>
                        <h1 className="font-bold text-sm sm:text-base truncate">{game.title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="bg-violet-600 px-3 py-1.5 rounded-lg text-xs font-bold">⭐ {score}</div>
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono ${timeWarning ? "bg-red-500 animate-pulse" : "bg-violet-600"}`}>
                        ⏱ {formatTime(timeLeft)}
                    </div>
                </div>
            </header>

            {/* PROGRESS */}
            <div className="max-w-5xl mx-auto w-full px-4 pt-4">
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                    <span>Cocok: {matchedCount}/{total}</span>
                    <span className={wrongCount > 0 ? "text-red-500" : ""}>Salah: {wrongCount}</span>
                </div>
                <div className="w-full bg-white rounded-full h-3 border border-slate-200 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 text-center">
                    Seret kartu di kiri ke kotak yang cocok di kanan, atau ketuk kartu lalu ketuk kotaknya.
                </p>
            </div>

            {/* PAPAN PERMAINAN */}
            <main className="flex-1 max-w-5xl mx-auto w-full p-4 grid grid-cols-2 gap-3 sm:gap-6 items-start">
                {/* KOLOM KIRI: kartu yang diseret */}
                <div className="space-y-3">
                    {leftItems.map(item => {
                        const isMatched = !!matched[item.id];
                        const isSelected = selected === item.id;
                        const isDragging = drag && drag.id === item.id;
                        return (
                            <div
                                key={item.id}
                                onPointerDown={(e) => handlePointerDown(e, item)}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                                style={{ touchAction: "none" }}
                                className={`rounded-2xl px-3 py-3 sm:px-4 sm:py-4 text-sm sm:text-base font-bold text-center border-2 shadow-sm transition-all
                                    ${isMatched
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-400 line-through opacity-60"
                                        : isSelected
                                            ? "bg-amber-100 border-amber-400 text-amber-900 ring-4 ring-amber-200 scale-[1.03] cursor-grab"
                                            : "bg-white border-violet-200 text-slate-800 hover:border-violet-400 hover:shadow-md cursor-grab active:cursor-grabbing"}
                                    ${isDragging ? "opacity-30" : ""}`}
                            >
                                {isMatched ? "✓ " : ""}{item.text}
                            </div>
                        );
                    })}
                </div>

                {/* KOLOM KANAN: kotak tujuan */}
                <div className="space-y-3">
                    {rightItems.map(item => {
                        const isMatched = !!matched[item.id];
                        const isHover = hoverTarget === item.id && !isMatched;
                        const isShake = shakeId === item.id;
                        const isPop = popId === item.id;
                        const leftText = isMatched ? pairs[item.id].left : null;
                        return (
                            <div
                                key={item.id}
                                data-drop-id={item.id}
                                onClick={() => selected !== null && attemptMatch(selected, item.id)}
                                className={`rounded-2xl px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm border-2 border-dashed min-h-[56px] flex flex-col justify-center transition-all
                                    ${isMatched
                                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md"
                                        : isHover || (selected !== null)
                                            ? "bg-violet-50 border-violet-500 text-slate-700 cursor-pointer"
                                            : "bg-white/70 border-slate-300 text-slate-700"}
                                    ${isHover ? "scale-[1.03] ring-4 ring-violet-200" : ""}
                                    ${isShake ? "game-shake border-red-400 bg-red-50" : ""}
                                    ${isPop ? "game-pop" : ""}`}
                            >
                                {isMatched && <span className="text-[10px] font-black uppercase tracking-wide text-emerald-100 mb-0.5">{leftText}</span>}
                                <span className={isMatched ? "font-semibold" : ""}>{item.text}</span>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* KARTU BAYANGAN SAAT DISERET */}
            {drag && (
                <div
                    className="fixed z-[90] pointer-events-none rounded-2xl px-4 py-4 text-sm sm:text-base font-bold text-center bg-violet-600 text-white shadow-2xl border-2 border-violet-300 rotate-2"
                    style={{ left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.w }}
                >
                    {drag.text}
                </div>
            )}

            {/* HASIL */}
            {finished && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center animate-in">
                        <div className="text-5xl mb-2">{matchedCount === total ? "🎉" : "⏰"}</div>
                        <h2 className="text-xl font-black text-slate-800">
                            {matchedCount === total ? "Hebat, semua cocok!" : "Waktu habis!"}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">{currentUser.name}</p>

                        <div className="flex justify-center gap-1 my-4 text-3xl">
                            {[1, 2, 3].map(i => <span key={i} className={i <= stars ? "" : "grayscale opacity-30"}>⭐</span>)}
                        </div>

                        <div className="text-5xl font-black text-violet-600 mb-4">{score}</div>

                        <div className="grid grid-cols-3 gap-2 text-xs mb-6">
                            <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-100">
                                <p className="text-emerald-600 font-bold text-lg">{matchedCount}</p>
                                <p className="text-slate-500">Cocok</p>
                            </div>
                            <div className="bg-red-50 rounded-xl p-2 border border-red-100">
                                <p className="text-red-500 font-bold text-lg">{wrongCount}</p>
                                <p className="text-slate-500">Salah</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                                <p className="text-slate-700 font-bold text-lg">{formatTime(Math.round((Date.now() - startedAt.current) / 1000))}</p>
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
            )}
        </div>
    );
}
