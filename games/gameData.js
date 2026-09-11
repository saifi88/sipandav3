// =====================================================================
// DATA CONTOH GAME (fallback)
// Dipakai jika backend belum mengirim `games` lewat action getInitData.
// Format ini juga bisa dipindah ke sheet "Games" di Spreadsheet dengan kolom:
//   id | type | mapel | title | duration | isActive | linkedExamId | pairs (JSON string)
// linkedExamId (opsional): id tugas di sheet Soal agar game muncul sebagai
// latihan BONUS di kartu tugas & materi. Kosong = bebas di Zona Game saja.
// type: match | memory | quizrush (ketiganya memakai pairs yang sama).
// Skor game bersifat bonus dan TIDAK mengubah nilai formal di sheet Hasil.
// =====================================================================

const SAMPLE_GAMES = [
    {
        id: "match-ipas-01",
        type: "match",
        mapel: "IPAS",
        title: "Bagian Tumbuhan & Fungsinya",
        duration: 3,
        pairs: [
            { left: "Akar", right: "Menyerap air dan mineral dari tanah" },
            { left: "Batang", right: "Menopang tumbuhan dan mengangkut air" },
            { left: "Daun", right: "Tempat terjadinya fotosintesis" },
            { left: "Bunga", right: "Alat perkembangbiakan tumbuhan" },
            { left: "Buah", right: "Melindungi biji" }
        ]
    },
    {
        id: "match-mtk-01",
        type: "match",
        mapel: "Matematika",
        title: "Perkalian Cepat",
        duration: 2,
        pairs: [
            { left: "6 × 7", right: "42" },
            { left: "8 × 9", right: "72" },
            { left: "7 × 8", right: "56" },
            { left: "9 × 9", right: "81" },
            { left: "6 × 8", right: "48" },
            { left: "7 × 7", right: "49" }
        ]
    },
    {
        id: "match-eng-01",
        type: "match",
        mapel: "Bahasa Inggris",
        title: "Kosakata Benda Sehari-hari",
        duration: 2,
        pairs: [
            { left: "Apple", right: "Apel" },
            { left: "Book", right: "Buku" },
            { left: "Chair", right: "Kursi" },
            { left: "Dog", right: "Anjing" },
            { left: "Water", right: "Air" },
            { left: "Pencil", right: "Pensil" }
        ]
    },
    {
        id: "match-jawa-01",
        type: "match",
        mapel: "Bahasa Jawa",
        title: "Angka dalam Bahasa Jawa",
        duration: 2,
        pairs: [
            { left: "Siji", right: "Satu" },
            { left: "Loro", right: "Dua" },
            { left: "Telu", right: "Tiga" },
            { left: "Papat", right: "Empat" },
            { left: "Enem", right: "Enam" },
            { left: "Pitu", right: "Tujuh" }
        ]
    },
    {
        id: "match-pancasila-01",
        type: "match",
        mapel: "Pendidikan Pancasila",
        title: "Sila-Sila Pancasila",
        duration: 3,
        pairs: [
            { left: "Sila ke-1", right: "Ketuhanan Yang Maha Esa" },
            { left: "Sila ke-2", right: "Kemanusiaan yang adil dan beradab" },
            { left: "Sila ke-3", right: "Persatuan Indonesia" },
            { left: "Sila ke-4", right: "Kerakyatan yang dipimpin oleh hikmat kebijaksanaan dalam permusyawaratan/perwakilan" },
            { left: "Sila ke-5", right: "Keadilan sosial bagi seluruh rakyat Indonesia" }
        ]
    }
];
