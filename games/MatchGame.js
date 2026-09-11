// =====================================================================
// GAME MENCOCOKKAN (DRAG & DROP) — modern playful theme.
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

    const theme = (typeof gameTheme === "function" ? gameTheme("match") : { grad: "from-violet-500 to-fuchsia-500" });
    const timeWarning = timeLeft <= 15 && !finished;

    return (
        <div className="min-h-screen bg-[#f3f0ff] flex flex-col select-none relative overflow-hidden">
            <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-fuchsia-300/40 blur-3xl"></div>
            <div className="pointer-events-none absolute top-40 -right-24 w-80 h-80 rounded-full bg-violet-300/40 blur-3xl"></div>
            <div className="pointer-events-none absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-amber-200/50 blur-3xl"></div>

            <GameHud theme={{ ...theme, label: "Mencocokkan", emoji: "🧩" }} mapel={game.mapel} title={game.title} score={score} timeLeft={timeLeft} timeWarning={timeWarning} onExit={handleExit} />

            {/* PROGRESS */}
            <div className="relative max-w-5xl mx-auto w-full px-3 sm:px-5 pt-4">
                <div className="rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg shadow-violet-900/5 p-3.5 sm:p-4">
                    <div className="flex items-center justify-between gap-2 text-xs font-black">
                        <span className="px-2.5 py-1.5 rounded-full bg-violet-100 text-violet-700">🧩 Cocok {matchedCount}/{total}</span>
                        <span className="font-black text-slate-400">{progress}%</span>
                        <span className={`px-2.5 py-1.5 rounded-full ${wrongCount > 0 ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-400"}`}>❌ {wrongCount}</span>
                    </div>
                    <div className="mt-2.5 h-3.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/70">
                        <div className={`h-full rounded-full bg-gradient-to-r ${theme.grad} transition-all duration-500`} style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 text-center font-semibold">
                        👆 Seret kartu kiri ke kotak yang cocok di kanan <span className="text-slate-300">•</span> atau ketuk kartu lalu ketuk kotaknya
                    </p>
                </div>
            </div>

            {/* PAPAN PERMAINAN */}
            <main className="relative flex-1 max-w-5xl mx-auto w-full p-3 sm:p-5 grid grid-cols-2 gap-3 sm:gap-5 items-start">
                {/* KOLOM KIRI: kartu yang diseret */}
                <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-violet-500 mb-2 px-1">🎴 Kartu Pilihan</p>
                    <div className="space-y-2.5">
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
                                    className={`game-card-in relative overflow-hidden rounded-3xl px-3 py-3.5 sm:px-4 sm:py-4 text-sm sm:text-base font-black text-center border-2 transition-all duration-200
                                        ${isMatched
                                            ? "bg-emerald-50/80 border-emerald-200 text-emerald-400 line-through opacity-60"
                                            : isSelected
                                                ? `bg-white border-transparent text-slate-900 shadow-xl shadow-amber-400/30 scale-[1.04] cursor-grab ring-4 ring-amber-300 game-glow`
                                                : "bg-white/90 backdrop-blur border-white text-slate-800 shadow-lg shadow-slate-900/5 hover:-translate-y-0.5 hover:shadow-xl hover:border-violet-300 cursor-grab active:cursor-grabbing"}
                                        ${isDragging ? "opacity-30 scale-95" : ""}`}
                                >
                                    {!isMatched && <span className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${theme.grad}`}></span>}
                                    {isMatched ? "✓ " : ""}{item.text}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* KOLOM KANAN: kotak tujuan */}
                <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-fuchsia-500 mb-2 px-1">🎯 Kotak Pasangan</p>
                    <div className="space-y-2.5">
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
                                    className={`rounded-3xl px-3 py-3.5 sm:px-4 sm:py-4 text-xs sm:text-sm border-2 min-h-[62px] flex flex-col justify-center transition-all duration-200
                                        ${isMatched
                                            ? `bg-gradient-to-r ${theme.grad} border-transparent text-white shadow-lg`
                                            : isHover
                                                ? "bg-white border-violet-500 shadow-xl scale-[1.04] ring-4 ring-violet-200 cursor-pointer"
                                                : (selected !== null)
                                                    ? "bg-violet-50/80 border-violet-300 border-dashed text-slate-700 cursor-pointer"
                                                    : "bg-white/60 backdrop-blur border-dashed border-slate-300 text-slate-600"}
                                        ${isShake ? "game-shake border-rose-400 bg-rose-50" : ""}
                                        ${isPop ? "game-pop" : ""}`}
                                >
                                    {isMatched && <span className="text-[10px] font-black uppercase tracking-widest text-white/85 mb-0.5">✓ {leftText}</span>}
                                    <span className={isMatched ? "font-bold" : "font-semibold"}>{item.text}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* KARTU BAYANGAN SAAT DISERET */}
            {drag && (
                <div
                    className={`fixed z-[90] pointer-events-none rounded-3xl px-4 py-4 text-sm sm:text-base font-black text-center text-white shadow-2xl rotate-3 bg-gradient-to-r ${theme.grad} border-2 border-white/60`}
                    style={{ left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.w }}
                >
                    {drag.text}
                </div>
            )}

            {finished && (
                <GameResultModal score={score} benar={matchedCount} salah={wrongCount} durasiDetik={Math.round((Date.now() - startedAt.current) / 1000)} playerName={currentUser.name} finishedLabel={matchedCount === total ? "Hebat, semua cocok! 🎉" : "Waktu habis! ⏰"} onExit={onExit} onReplay={onReplay} />
            )}
        </div>
    );
}
