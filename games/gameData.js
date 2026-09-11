// =====================================================================
// DATA CONTOH GAME (fallback)
// Dipakai jika backend belum mengirim `games` lewat action getInitData.
// Format ini juga bisa dipindah ke sheet "Games" di Spreadsheet dengan kolom:
//   id | type | mapel | title | duration | isActive | linkedExamId | pairs (JSON string)
// linkedExamId (opsional): id tugas di sheet Soal agar game muncul sebagai
// latihan BONUS di kartu tugas & materi. Kosong = bebas di Zona Game saja.
// type: match | memory | quizrush | balloon | scramble | snake | truefalse | hangman | boss | sort | fillblank | race (semuanya memakai pairs yang sama).
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
    },
    {
        id: "memory-ipas-01",
        type: "memory",
        mapel: "IPAS",
        title: "Memori: Planet Tata Surya",
        duration: 3,
        pairs: [
            { left: "Merkurius", right: "Planet terdekat Matahari" },
            { left: "Venus", right: "Planet terpanas" },
            { left: "Bumi", right: "Planet tempat tinggal kita" },
            { left: "Mars", right: "Planet merah" },
            { left: "Jupiter", right: "Planet terbesar" },
            { left: "Saturnus", right: "Planet bercincin" }
        ]
    },
    {
        id: "memory-eng-01",
        type: "memory",
        mapel: "Bahasa Inggris",
        title: "Memori: Warna & Animals",
        duration: 2,
        pairs: [
            { left: "Red", right: "Merah" },
            { left: "Blue", right: "Biru" },
            { left: "Cat", right: "Kucing" },
            { left: "Bird", right: "Burung" },
            { left: "Fish", right: "Ikan" },
            { left: "Green", right: "Hijau" }
        ]
    },
    {
        id: "quizrush-mtk-01",
        type: "quizrush",
        mapel: "Matematika",
        title: "Kuis Cepat: Penjumlahan",
        duration: 2,
        pairs: [
            { left: "5 + 7 = ...", right: "12" },
            { left: "9 + 6 = ...", right: "15" },
            { left: "12 + 8 = ...", right: "20" },
            { left: "15 + 9 = ...", right: "24" },
            { left: "7 + 13 = ...", right: "20" },
            { left: "20 + 11 = ...", right: "31" }
        ]
    },
    {
        id: "quizrush-ipas-01",
        type: "quizrush",
        mapel: "IPAS",
        title: "Kuis Cepat: Tubuh Manusia",
        duration: 2,
        pairs: [
            { left: "Organ untuk memompa darah?", right: "Jantung" },
            { left: "Organ untuk bernapas?", right: "Paru-paru" },
            { left: "Tulang melindungi otak?", right: "Tengkorak" },
            { left: "Indra penglihat?", right: "Mata" },
            { left: "Makanan jadi energi di?", right: "Usus" },
            { left: "Penopang tubuh?", right: "Tulang" }
        ]
    },
    {
        id: "balloon-mtk-01",
        type: "balloon",
        mapel: "Matematika",
        title: "Balon Meletus: Perkalian",
        duration: 2,
        pairs: [
            { left: "4 × 5 = ...", right: "20" },
            { left: "3 × 9 = ...", right: "27" },
            { left: "6 × 6 = ...", right: "36" },
            { left: "8 × 7 = ...", right: "56" },
            { left: "5 × 9 = ...", right: "45" },
            { left: "7 × 4 = ...", right: "28" }
        ]
    },
    {
        id: "scramble-eng-01",
        type: "scramble",
        mapel: "Bahasa Inggris",
        title: "Acak Kata: Benda Sekitar",
        duration: 3,
        pairs: [
            { left: "Benda untuk menulis? ✏️", right: "PENCIL" },
            { left: "Benda untuk dibaca? 📖", right: "BOOK" },
            { left: "Hewan berkaki empat yang menggonggong? 🐶", right: "DOG" },
            { left: "Benda untuk duduk? 🪑", right: "CHAIR" },
            { left: "Buah berwarna merah? 🍎", right: "APPLE" },
            { left: "Minuman paling sehat? 💧", right: "WATER" }
        ]
    },
    {
        id: "snake-ipas-01",
        type: "snake",
        mapel: "IPAS",
        title: "Ular Tangga: Tata Surya",
        duration: 5,
        pairs: [
            { left: "Planet terdekat Matahari?", right: "Merkurius" },
            { left: "Planet tempat tinggal kita?", right: "Bumi" },
            { left: "Planet terbesar?", right: "Jupiter" },
            { left: "Planet bercincin?", right: "Saturnus" },
            { left: "Planet merah?", right: "Mars" },
            { left: "Satelit alami Bumi?", right: "Bulan" }
        ]
    },
    {
        id: "truefalse-ppkn-01",
        type: "truefalse",
        mapel: "Pendidikan Pancasila",
        title: "Benar atau Salah: Pancasila",
        duration: 2,
        pairs: [
            { left: "Sila ke-1", right: "Ketuhanan Yang Maha Esa" },
            { left: "Sila ke-2", right: "Kemanusiaan yang adil dan beradab" },
            { left: "Sila ke-3", right: "Persatuan Indonesia" },
            { left: "Lambang sila ke-1", right: "Bintang" },
            { left: "Lambang sila ke-2", right: "Rantai" },
            { left: "Lambang sila ke-3", right: "Pohon beringin" }
        ]
    },
    {
        id: "hangman-eng-01",
        type: "hangman",
        mapel: "Bahasa Inggris",
        title: "Tebak Kata: Animals",
        duration: 3,
        pairs: [
            { left: "Hewan yang menggonggong 🐶", right: "DOG" },
            { left: "Hewan yang mengeong 🐱", right: "CAT" },
            { left: "Hewan yang bisa terbang 🐦", right: "BIRD" },
            { left: "Hewan yang berenang 🐟", right: "FISH" },
            { left: "Buah berwarna merah 🍎", right: "APPLE" },
            { left: "Benda untuk dibaca 📖", right: "BOOK" }
        ]
    },
    {
        id: "boss-mtk-01",
        type: "boss",
        mapel: "Matematika",
        title: "Boss Battle: Perkalian Sakti",
        duration: 3,
        pairs: [
            { left: "7 × 8 = ...", right: "56" },
            { left: "9 × 7 = ...", right: "63" },
            { left: "8 × 8 = ...", right: "64" },
            { left: "6 × 7 = ...", right: "42" },
            { left: "9 × 9 = ...", right: "81" },
            { left: "5 × 8 = ...", right: "40" }
        ]
    },
    {
        id: "sort-ipas-01",
        type: "sort",
        mapel: "IPAS",
        title: "Sortir: Golongan Hewan",
        duration: 3,
        pairs: [
            { left: "Sapi", right: "Herbivora" },
            { left: "Kambing", right: "Herbivora" },
            { left: "Kelinci", right: "Herbivora" },
            { left: "Harimau", right: "Karnivora" },
            { left: "Singa", right: "Karnivora" },
            { left: "Buaya", right: "Karnivora" },
            { left: "Ayam", right: "Omnivora" },
            { left: "Bebek", right: "Omnivora" },
            { left: "Beruang", right: "Omnivora" }
        ]
    },
    {
        id: "fillblank-indo-01",
        type: "fillblank",
        mapel: "Bahasa Indonesia",
        title: "Isian: Kata Baku & Imbuhan",
        duration: 3,
        pairs: [
            { left: "Penulisan yang baku: ___ (apotik)", right: "apotek" },
            { left: "Lawan kata 'rajin' adalah ___", right: "malas" },
            { left: "Ibu ___ (sapu) halaman setiap pagi", right: "menyapu" },
            { left: "Tulis nama dengan huruf kapital: ___ (budi santoso)", right: "Budi Santoso" },
            { left: "Sinonim kata 'bahagia' adalah ___", right: "senang" },
            { left: "Kami ___ (main) bola di lapangan", right: "bermain" }
        ]
    },
    {
        id: "race-mtk-01",
        type: "race",
        mapel: "Matematika",
        title: "Balapan: Pengurangan Kilat",
        duration: 2,
        pairs: [
            { left: "15 − 7 = ...", right: "8" },
            { left: "20 − 9 = ...", right: "11" },
            { left: "30 − 12 = ...", right: "18" },
            { left: "25 − 8 = ...", right: "17" },
            { left: "40 − 15 = ...", right: "25" },
            { left: "50 − 23 = ...", right: "27" }
        ]
    }
];
