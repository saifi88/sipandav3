// =====================================================================
// DATA CONTOH GAME (fallback)
// Dipakai jika backend belum mengirim `games` lewat action getInitData.
// Format ini juga bisa dipindah ke sheet "Games" di Spreadsheet dengan kolom:
//   id | type | mapel | title | duration | isActive | linkedExamId | pairs (JSON string)
// linkedExamId (opsional): id tugas di sheet Soal agar game muncul sebagai
// latihan BONUS di kartu tugas & materi. Kosong = bebas di Zona Game saja.
// type: match | memory | quizrush | balloon | scramble | snake | truefalse |
//       hangman | boss | sort | fillblank | race | tower | sequence | maze | defense.
// pairs: array (format lama, satu bank untuk semua level) ATAU objek
//   { mudah: [...], sedang: [...], sulit: [...] } — tiap level punya soal
//   yang benar-benar berbeda (🌱 ingatan dasar, 🔥 pemahaman, ⚡ HOTS).
// Skor game bersifat bonus dan TIDAK mengubah nilai formal di sheet Hasil.
// =====================================================================

const SAMPLE_GAMES = [
    {
        id: "match-ipas-01",
        type: "match",
        mapel: "IPAS",
        title: "Bagian Tumbuhan & Fungsinya",
        duration: 3,
        pairs: {
            mudah: [
                { left: "Akar", right: "Menyerap air dari tanah" },
                { left: "Daun", right: "Tempat fotosintesis" },
                { left: "Bunga", right: "Alat perkembangbiakan" },
                { left: "Buah", right: "Melindungi biji" }
            ],
            sedang: [
                { left: "Batang", right: "Mengangkut air ke daun" },
                { left: "Klorofil", right: "Zat hijau daun" },
                { left: "Stomata", right: "Lubang pertukaran gas" },
                { left: "Biji", right: "Calon tumbuhan baru" },
                { left: "Kelopak bunga", right: "Menarik serangga" }
            ],
            sulit: [
                { left: "Hasil fotosintesis", right: "Gula dan oksigen" },
                { left: "Tumbuhan tanpa bunga berkembang biak dengan", right: "Spora" },
                { left: "Akar serabut contohnya pada", right: "Padi dan jagung" },
                { left: "Tumbuhan insektivora contohnya", right: "Kantong semar" },
                { left: "Fungsi rambut akar", right: "Memperluas penyerapan air" }
            ]
        }
    },
    {
        id: "match-mtk-01",
        type: "match",
        mapel: "Matematika",
        title: "Perkalian Cepat",
        duration: 2,
        pairs: {
            mudah: [
                { left: "2 × 7", right: "14" },
                { left: "3 × 4", right: "12" },
                { left: "5 × 5", right: "25" },
                { left: "10 × 6", right: "60" }
            ],
            sedang: [
                { left: "6 × 7", right: "42" },
                { left: "8 × 9", right: "72" },
                { left: "7 × 8", right: "56" },
                { left: "9 × 9", right: "81" },
                { left: "12 × 4", right: "48" }
            ],
            sulit: [
                { left: "13 × 6", right: "78" },
                { left: "15 × 7", right: "105" },
                { left: "12 × 12", right: "144" },
                { left: "25 × 8", right: "200" },
                { left: "11 × 14", right: "154" }
            ]
        }
    },
    {
        id: "match-eng-01",
        type: "match",
        mapel: "Bahasa Inggris",
        title: "Kosakata Benda Sehari-hari",
        duration: 2,
        pairs: {
            mudah: [
                { left: "Book", right: "Buku" },
                { left: "Dog", right: "Anjing" },
                { left: "Water", right: "Air" },
                { left: "Chair", right: "Kursi" }
            ],
            sedang: [
                { left: "Apple", right: "Apel" },
                { left: "Pencil", right: "Pensil" },
                { left: "Bird", right: "Burung" },
                { left: "Fish", right: "Ikan" },
                { left: "Door", right: "Pintu" }
            ],
            sulit: [
                { left: "Library", right: "Perpustakaan" },
                { left: "Butterfly", right: "Kupu-kupu" },
                { left: "Umbrella", right: "Payung" },
                { left: "Strawberry", right: "Stroberi" },
                { left: "Elephant", right: "Gajah" }
            ]
        }
    },
    {
        id: "match-jawa-01",
        type: "match",
        mapel: "Bahasa Jawa",
        title: "Angka dalam Bahasa Jawa",
        duration: 2,
        pairs: {
            mudah: [
                { left: "Siji", right: "Satu" },
                { left: "Loro", right: "Dua" },
                { left: "Telu", right: "Tiga" },
                { left: "Papat", right: "Empat" }
            ],
            sedang: [
                { left: "Lima", right: "Lima" },
                { left: "Enem", right: "Enam" },
                { left: "Pitu", right: "Tujuh" },
                { left: "Wolu", right: "Delapan" },
                { left: "Sanga", right: "Sembilan" }
            ],
            sulit: [
                { left: "Sepuluh", right: "Sepuluh" },
                { left: "Rolas", right: "Dua belas" },
                { left: "Selikur", right: "Dua puluh satu" },
                { left: "Telung puluh", right: "Tiga puluh" },
                { left: "Satus", right: "Seratus" }
            ]
        }
    },
    {
        id: "match-pancasila-01",
        type: "match",
        mapel: "Pendidikan Pancasila",
        title: "Sila-Sila Pancasila",
        duration: 3,
        pairs: {
            mudah: [
                { left: "Sila ke-1", right: "Ketuhanan Yang Maha Esa" },
                { left: "Sila ke-3", right: "Persatuan Indonesia" },
                { left: "Sila ke-5", right: "Keadilan sosial" },
                { left: "Lambang sila ke-1", right: "Bintang" }
            ],
            sedang: [
                { left: "Sila ke-2", right: "Kemanusiaan yang adil dan beradab" },
                { left: "Sila ke-4", right: "Kerakyatan yang dipimpin hikmat kebijaksanaan" },
                { left: "Lambang sila ke-2", right: "Rantai" },
                { left: "Lambang sila ke-3", right: "Pohon beringin" },
                { left: "Lambang sila ke-5", right: "Padi dan kapas" }
            ],
            sulit: [
                { left: "Lambang sila ke-4", right: "Kepala banteng" },
                { left: "Contoh sila ke-2 di sekolah", right: "Menolong teman yang jatuh" },
                { left: "Contoh sila ke-4 di kelas", right: "Musyawarah memilih ketua kelas" },
                { left: "Contoh sila ke-5 di rumah", right: "Berbagi tugas membersihkan rumah" },
                { left: "Dasar negara Indonesia", right: "Pancasila" }
            ]
        }
    },
    {
        id: "memory-ipas-01",
        type: "memory",
        mapel: "IPAS",
        title: "Memori: Planet Tata Surya",
        duration: 3,
        pairs: {
            mudah: [
                { left: "Bumi", right: "Tempat tinggal kita" },
                { left: "Mars", right: "Planet merah" },
                { left: "Saturnus", right: "Planet bercincin" },
                { left: "Bulan", right: "Satelit Bumi" }
            ],
            sedang: [
                { left: "Merkurius", right: "Terdekat Matahari" },
                { left: "Venus", right: "Planet terpanas" },
                { left: "Jupiter", right: "Planet terbesar" },
                { left: "Neptunus", right: "Terjauh dari Matahari" },
                { left: "Uranus", right: "Berputar miring" }
            ],
            sulit: [
                { left: "Revolusi Bumi", right: "365 hari" },
                { left: "Rotasi Bumi", right: "24 jam" },
                { left: "Planet kerdil", right: "Pluto" },
                { left: "Sabuk asteroid", right: "Antara Mars dan Jupiter" },
                { left: "Satelit Jupiter terbesar", right: "Ganymede" }
            ]
        }
    },
    {
        id: "memory-eng-01",
        type: "memory",
        mapel: "Bahasa Inggris",
        title: "Memori: Warna & Animals",
        duration: 2,
        pairs: {
            mudah: [
                { left: "Red", right: "Merah" },
                { left: "Blue", right: "Biru" },
                { left: "Cat", right: "Kucing" },
                { left: "Fish", right: "Ikan" }
            ],
            sedang: [
                { left: "Green", right: "Hijau" },
                { left: "Yellow", right: "Kuning" },
                { left: "Bird", right: "Burung" },
                { left: "Dog", right: "Anjing" },
                { left: "Duck", right: "Bebek" }
            ],
            sulit: [
                { left: "Purple", right: "Ungu" },
                { left: "Orange", right: "Oranye" },
                { left: "Butterfly", right: "Kupu-kupu" },
                { left: "Rabbit", right: "Kelinci" },
                { left: "Turtle", right: "Kura-kura" }
            ]
        }
    },
    {
        id: "quizrush-mtk-01",
        type: "quizrush",
        mapel: "Matematika",
        title: "Kuis Cepat: Penjumlahan",
        duration: 2,
        pairs: {
            mudah: [
                { left: "5 + 7 = ...", right: "12" },
                { left: "9 + 6 = ...", right: "15" },
                { left: "10 + 10 = ...", right: "20" },
                { left: "8 + 5 = ...", right: "13" }
            ],
            sedang: [
                { left: "27 + 15 = ...", right: "42" },
                { left: "36 + 28 = ...", right: "64" },
                { left: "59 + 34 = ...", right: "93" },
                { left: "125 + 75 = ...", right: "200" },
                { left: "348 + 152 = ...", right: "500" }
            ],
            sulit: [
                { left: "1.250 + 3.750 = ...", right: "5.000" },
                { left: "2/4 + 1/4 = ...", right: "3/4" },
                { left: "0,5 + 0,75 = ...", right: "1,25" },
                { left: "999 + 1.001 = ...", right: "2.000" },
                { left: "45 + 55 + 100 = ...", right: "200" }
            ]
        }
    },
    {
        id: "quizrush-ipas-01",
        type: "quizrush",
        mapel: "IPAS",
        title: "Kuis Cepat: Tubuh Manusia",
        duration: 2,
        pairs: {
            mudah: [
                { left: "Organ untuk memompa darah?", right: "Jantung" },
                { left: "Organ untuk bernapas?", right: "Paru-paru" },
                { left: "Indra penglihat?", right: "Mata" },
                { left: "Penopang tubuh?", right: "Tulang" }
            ],
            sedang: [
                { left: "Tulang melindungi otak?", right: "Tengkorak" },
                { left: "Makanan dicerna pertama di?", right: "Mulut" },
                { left: "Indra pendengar?", right: "Telinga" },
                { left: "Otot menempel pada?", right: "Tulang" },
                { left: "Darah dipompa ke seluruh tubuh oleh?", right: "Jantung" }
            ],
            sulit: [
                { left: "Tempat penyerapan sari makanan?", right: "Usus halus" },
                { left: "Sel darah merah dibuat di?", right: "Sumsum tulang" },
                { left: "Organ penyaring darah?", right: "Ginjal" },
                { left: "Bagian otak pengatur keseimbangan?", right: "Otak kecil" },
                { left: "Vitamin untuk tulang?", right: "Vitamin D" }
            ]
        }
    },
    {
        id: "balloon-mtk-01",
        type: "balloon",
        mapel: "Matematika",
        title: "Balon Meletus: Perkalian",
        duration: 2,
        pairs: {
            mudah: [
                { left: "2 × 5 = ...", right: "10" },
                { left: "3 × 3 = ...", right: "9" },
                { left: "4 × 4 = ...", right: "16" },
                { left: "5 × 6 = ...", right: "30" }
            ],
            sedang: [
                { left: "4 × 5 = ...", right: "20" },
                { left: "3 × 9 = ...", right: "27" },
                { left: "6 × 6 = ...", right: "36" },
                { left: "8 × 7 = ...", right: "56" },
                { left: "7 × 4 = ...", right: "28" }
            ],
            sulit: [
                { left: "12 × 7 = ...", right: "84" },
                { left: "15 × 6 = ...", right: "90" },
                { left: "13 × 8 = ...", right: "104" },
                { left: "25 × 6 = ...", right: "150" },
                { left: "14 × 9 = ...", right: "126" }
            ]
        }
    },
    {
        id: "scramble-eng-01",
        type: "scramble",
        mapel: "Bahasa Inggris",
        title: "Acak Kata: Benda Sekitar",
        duration: 3,
        pairs: {
            mudah: [
                { left: "Hewan yang menggonggong? 🐶", right: "DOG" },
                { left: "Hewan yang mengeong? 🐱", right: "CAT" },
                { left: "Benda untuk dibaca? 📖", right: "BOOK" },
                { left: "Buah berwarna merah? 🍎", right: "APPLE" }
            ],
            sedang: [
                { left: "Benda untuk menulis? ✏️", right: "PENCIL" },
                { left: "Benda untuk duduk? 🪑", right: "CHAIR" },
                { left: "Minuman paling sehat? 💧", right: "WATER" },
                { left: "Hewan yang bisa terbang? 🐦", right: "BIRD" },
                { left: "Benda pembuka pintu? 🚪", right: "DOOR" }
            ],
            sulit: [
                { left: "Tempat meminjam buku? 📚", right: "LIBRARY" },
                { left: "Benda pelindung dari hujan? ☂️", right: "UMBRELLA" },
                { left: "Hewan berbelalai? 🐘", right: "ELEPHANT" },
                { left: "Serangga bersayap indah? 🦋", right: "BUTTERFLY" },
                { left: "Benda untuk melihat waktu? ⌚", right: "WATCH" }
            ]
        }
    },
    {
        id: "snake-ipas-01",
        type: "snake",
        mapel: "IPAS",
        title: "Ular Tangga: Tata Surya",
        duration: 5,
        pairs: {
            mudah: [
                { left: "Planet tempat tinggal kita?", right: "Bumi" },
                { left: "Planet merah?", right: "Mars" },
                { left: "Satelit alami Bumi?", right: "Bulan" },
                { left: "Bintang terdekat Bumi?", right: "Matahari" }
            ],
            sedang: [
                { left: "Planet terdekat Matahari?", right: "Merkurius" },
                { left: "Planet terbesar?", right: "Jupiter" },
                { left: "Planet bercincin?", right: "Saturnus" },
                { left: "Planet terpanas?", right: "Venus" },
                { left: "Planet terjauh?", right: "Neptunus" }
            ],
            sulit: [
                { left: "Waktu revolusi Bumi?", right: "365 hari" },
                { left: "Planet kerdil?", right: "Pluto" },
                { left: "Satelit terbesar Jupiter?", right: "Ganymede" },
                { left: "Planet yang berputar miring?", right: "Uranus" },
                { left: "Sabuk asteroid terletak di antara?", right: "Mars dan Jupiter" }
            ]
        }
    },
    {
        id: "truefalse-ppkn-01",
        type: "truefalse",
        mapel: "Pendidikan Pancasila",
        title: "Benar atau Salah: Pancasila",
        duration: 2,
        pairs: {
            mudah: [
                { left: "Sila ke-1", right: "Ketuhanan Yang Maha Esa" },
                { left: "Sila ke-3", right: "Persatuan Indonesia" },
                { left: "Lambang sila ke-1", right: "Bintang" },
                { left: "Dasar negara kita", right: "Pancasila" }
            ],
            sedang: [
                { left: "Sila ke-2", right: "Kemanusiaan yang adil dan beradab" },
                { left: "Lambang sila ke-2", right: "Rantai" },
                { left: "Lambang sila ke-3", right: "Pohon beringin" },
                { left: "Lambang sila ke-5", right: "Padi dan kapas" },
                { left: "Sila ke-5", right: "Keadilan sosial bagi seluruh rakyat Indonesia" }
            ],
            sulit: [
                { left: "Lambang sila ke-4", right: "Kepala banteng" },
                { left: "Sila ke-4", right: "Kerakyatan yang dipimpin oleh hikmat kebijaksanaan" },
                { left: "Pengamalan sila ke-2", right: "Menolong teman tanpa membedakan" },
                { left: "Pengamalan sila ke-4", right: "Musyawarah mufakat" },
                { left: "Jumlah sila Pancasila", right: "Lima" }
            ]
        }
    },
    {
        id: "hangman-eng-01",
        type: "hangman",
        mapel: "Bahasa Inggris",
        title: "Tebak Kata: Animals",
        duration: 3,
        pairs: {
            mudah: [
                { left: "Hewan yang menggonggong 🐶", right: "DOG" },
                { left: "Hewan yang mengeong 🐱", right: "CAT" },
                { left: "Hewan yang berenang 🐟", right: "FISH" },
                { left: "Buah berwarna merah 🍎", right: "APPLE" }
            ],
            sedang: [
                { left: "Hewan yang bisa terbang 🐦", right: "BIRD" },
                { left: "Benda untuk dibaca 📖", right: "BOOK" },
                { left: "Hewan berleher panjang 🦒", right: "GIRAFFE" },
                { left: "Hewan melompat berkantung 🦘", right: "KANGAROO" },
                { left: "Serangga penghasil madu 🐝", right: "BEE" }
            ],
            sulit: [
                { left: "Hewan berbelalai 🐘", right: "ELEPHANT" },
                { left: "Hewan tercepat di darat 🐆", right: "CHEETAH" },
                { left: "Reptil berganti kulit 🐍", right: "SNAKE" },
                { left: "Hewan malam bermata besar 🦉", right: "OWL" },
                { left: "Ikan bergigi tajam 🦈", right: "SHARK" }
            ]
        }
    },
    {
        id: "boss-mtk-01",
        type: "boss",
        mapel: "Matematika",
        title: "Boss Battle: Perkalian Sakti",
        duration: 3,
        pairs: {
            mudah: [
                { left: "2 × 8 = ...", right: "16" },
                { left: "3 × 5 = ...", right: "15" },
                { left: "4 × 4 = ...", right: "16" },
                { left: "5 × 7 = ...", right: "35" }
            ],
            sedang: [
                { left: "7 × 8 = ...", right: "56" },
                { left: "9 × 7 = ...", right: "63" },
                { left: "8 × 8 = ...", right: "64" },
                { left: "6 × 7 = ...", right: "42" },
                { left: "5 × 8 = ...", right: "40" }
            ],
            sulit: [
                { left: "12 × 8 = ...", right: "96" },
                { left: "15 × 7 = ...", right: "105" },
                { left: "16 × 6 = ...", right: "96" },
                { left: "25 × 8 = ...", right: "200" },
                { left: "11 × 13 = ...", right: "143" }
            ]
        }
    },
    {
        id: "sort-ipas-01",
        type: "sort",
        mapel: "IPAS",
        title: "Sortir: Golongan Hewan",
        duration: 3,
        pairs: {
            mudah: [
                { left: "Sapi", right: "Herbivora" },
                { left: "Kambing", right: "Herbivora" },
                { left: "Harimau", right: "Karnivora" },
                { left: "Singa", right: "Karnivora" }
            ],
            sedang: [
                { left: "Kelinci", right: "Herbivora" },
                { left: "Buaya", right: "Karnivora" },
                { left: "Ayam", right: "Omnivora" },
                { left: "Bebek", right: "Omnivora" },
                { left: "Beruang", right: "Omnivora" },
                { left: "Gajah", right: "Herbivora" }
            ],
            sulit: [
                { left: "Paus", right: "Mamalia" },
                { left: "Kelelawar", right: "Mamalia" },
                { left: "Elang", right: "Burung" },
                { left: "Kadal", right: "Reptil" },
                { left: "Katak", right: "Amfibi" },
                { left: "Hiu", right: "Ikan" }
            ]
        }
    },
    {
        id: "fillblank-indo-01",
        type: "fillblank",
        mapel: "Bahasa Indonesia",
        title: "Isian: Kata Baku & Imbuhan",
        duration: 3,
        pairs: {
            mudah: [
                { left: "Lawan kata 'rajin' adalah ___", right: "malas" },
                { left: "Sinonim kata 'bahagia' adalah ___", right: "senang" },
                { left: "Kami ___ (main) bola di lapangan", right: "bermain" },
                { left: "Burung ___ (terbang) di langit", right: "terbang" }
            ],
            sedang: [
                { left: "Penulisan yang baku: ___ (apotik)", right: "apotek" },
                { left: "Ibu ___ (sapu) halaman setiap pagi", right: "menyapu" },
                { left: "Tulis nama dengan huruf kapital: ___ (budi santoso)", right: "Budi Santoso" },
                { left: "Ayah ___ (baca) koran pagi ini", right: "membaca" },
                { left: "Anak itu ___ (tulis) surat untuk gurunya", right: "menulis" }
            ],
            sulit: [
                { left: "Bentuk baku 'photo' adalah ___", right: "foto" },
                { left: "Imbuhan yang tepat: ___ (sedia) payung sebelum hujan", right: "menyediakan" },
                { left: "Kata ulang: anak-anak ___ (lari) di taman", right: "berlari-lari" },
                { left: "Penggunaan tanda baca: Hari Senin ___ Selasa libur", right: "koma" },
                { left: "Antonim kata 'abstrak' adalah ___", right: "konkret" }
            ]
        }
    },
    {
        id: "race-mtk-01",
        type: "race",
        mapel: "Matematika",
        title: "Balapan: Pengurangan Kilat",
        duration: 2,
        pairs: {
            mudah: [
                { left: "10 − 4 = ...", right: "6" },
                { left: "15 − 7 = ...", right: "8" },
                { left: "20 − 10 = ...", right: "10" },
                { left: "12 − 5 = ...", right: "7" }
            ],
            sedang: [
                { left: "20 − 9 = ...", right: "11" },
                { left: "30 − 12 = ...", right: "18" },
                { left: "25 − 8 = ...", right: "17" },
                { left: "40 − 15 = ...", right: "25" },
                { left: "50 − 23 = ...", right: "27" }
            ],
            sulit: [
                { left: "100 − 47 = ...", right: "53" },
                { left: "250 − 135 = ...", right: "115" },
                { left: "1.000 − 625 = ...", right: "375" },
                { left: "3/4 − 1/4 = ...", right: "2/4" },
                { left: "5,5 − 2,75 = ...", right: "2,75" }
            ]
        }
    },
    {
        id: "tower-mtk-01",
        type: "tower",
        mapel: "Matematika",
        title: "Menara Logika: Pola Bilangan",
        duration: 3,
        pairs: {
            mudah: [
                { left: "2, 4, 6, 8, ... (berikutnya?)", right: "10" },
                { left: "5, 10, 15, 20, ... (berikutnya?)", right: "25" },
                { left: "10 + 5 × 2 = ...", right: "20" },
                { left: "20 − 4 × 3 = ...", right: "8" }
            ],
            sedang: [
                { left: "2, 4, 8, 16, ... (berikutnya?)", right: "32" },
                { left: "3, 6, 12, 24, ... (berikutnya?)", right: "48" },
                { left: "1, 4, 9, 16, ... (berikutnya?)", right: "25" },
                { left: "81 : 9 + 6 × 2 = ...", right: "21" },
                { left: "(12 + 8) : 4 × 3 = ...", right: "15" }
            ],
            sulit: [
                { left: "1, 1, 2, 3, 5, 8, ... (berikutnya?)", right: "13" },
                { left: "2, 6, 12, 20, 30, ... (berikutnya?)", right: "42" },
                { left: "100 : (2 + 3) × 4 − 50 = ...", right: "30" },
                { left: "FPB dari 24 dan 36?", right: "12" },
                { left: "KPK dari 6 dan 8?", right: "24" }
            ]
        }
    },
    {
        id: "tower-ipas-01",
        type: "tower",
        mapel: "IPAS",
        title: "Menara Logika: Rantai Makanan",
        duration: 3,
        pairs: {
            mudah: [
                { left: "Padi dimakan belalang, belalang dimakan ...", right: "Katak" },
                { left: "Katak dimakan ...", right: "Ular" },
                { left: "Hewan pemakan tumbuhan disebut ...", right: "Herbivora" },
                { left: "Hewan pemakan daging disebut ...", right: "Karnivora" }
            ],
            sedang: [
                { left: "Tumbuhan yang membuat makanan sendiri disebut ...", right: "Produsen" },
                { left: "Hewan pemakan tumbuhan dan hewan disebut ...", right: "Omnivora" },
                { left: "Pengurai sisa makhluk hidup contohnya ...", right: "Jamur" },
                { left: "Energi terbesar rantai makanan berasal dari ...", right: "Matahari" },
                { left: "Elang berperan sebagai ...", right: "Konsumen puncak" }
            ],
            sulit: [
                { left: "Jika katak punah, populasi belalang akan ...", right: "Bertambah" },
                { left: "Jika ular punah, populasi katak akan ...", right: "Bertambah" },
                { left: "Daur yang mengembalikan unsur hara ke tanah?", right: "Penguraian" },
                { left: "Simbiosis jamur dan alga (lichen) disebut ...", right: "Mutualisme" },
                { left: "Jaring-jaring makanan lebih ... dibanding rantai makanan", right: "Kompleks" }
            ]
        }
    },
    {
        id: "sequence-indo-01",
        type: "sequence",
        mapel: "Bahasa Indonesia",
        title: "Susun Kalimat: Fakta Seru",
        duration: 3,
        pairs: {
            mudah: [
                { left: "Susun: kalimat tentang air", right: "Air mengalir ke laut" },
                { left: "Susun: kalimat tentang kucing", right: "Kucing minum susu pagi" },
                { left: "Susun: kalimat tentang sekolah", right: "Aku pergi ke sekolah" },
                { left: "Susun: kalimat tentang bunga", right: "Bunga mekar di pagi" }
            ],
            sedang: [
                { left: "Susun: kalimat tentang fotosintesis", right: "Daun membuat makanan saat ada cahaya" },
                { left: "Susun: kalimat tentang kupu-kupu", right: "Kupu kupu berasal dari kepompong yang indah" },
                { left: "Susun: kalimat tentang gotong royong", right: "Warga membersihkan lingkungan setiap hari Minggu" },
                { left: "Susun: kalimat tentang Pancasila", right: "Persatuan Indonesia adalah sila ketiga Pancasila" },
                { left: "Susun: kalimat tentang hujan", right: "Hujan turun membasahi sawah yang kering" }
            ],
            sulit: [
                { left: "Susun: kalimat tentang daur air", right: "Air menguap dari laut lalu turun sebagai hujan" },
                { left: "Susun: kalimat tentang pahlawan", right: "Pahlawan berjuang dengan gagah berani demi bangsa" },
                { left: "Susun: kalimat tentang perpustakaan", right: "Siswa membaca buku cerita dengan tertib di perpustakaan" },
                { left: "Susun: kalimat tentang kesehatan", right: "Olahraga teratur membuat tubuh sehat dan kuat" },
                { left: "Susun: kalimat tentang petani", right: "Petani menanam padi dengan tekun sejak pagi hari" }
            ]
        }
    },
    {
        id: "sequence-eng-01",
        type: "sequence",
        mapel: "Bahasa Inggris",
        title: "Arrange Words: Daily Sentences",
        duration: 3,
        pairs: {
            mudah: [
                { left: "Arrange: greeting", right: "Good morning teacher" },
                { left: "Arrange: about cat", right: "The cat drinks milk" },
                { left: "Arrange: about book", right: "I read a book" },
                { left: "Arrange: about ball", right: "Kick the ball now" }
            ],
            sedang: [
                { left: "Arrange: about cat", right: "The cat drinks milk every morning" },
                { left: "Arrange: about school", right: "I go to school by bicycle" },
                { left: "Arrange: about bird", right: "The bird flies high in the sky" },
                { left: "Arrange: about mother", right: "My mother cooks delicious fried rice" }
            ],
            sulit: [
                { left: "Arrange: about library", right: "The students borrow interesting books from the library" },
                { left: "Arrange: about holiday", right: "We visited beautiful beaches during school holiday" },
                { left: "Arrange: about farmer", right: "The diligent farmer plants rice in the green field" },
                { left: "Arrange: about rain", right: "Heavy rain falls on the dry rice fields today" }
            ]
        }
    },
    {
        id: "maze-ipas-01",
        type: "maze",
        mapel: "IPAS",
        title: "Labirin Harta: Tata Surya",
        duration: 4,
        pairs: {
            mudah: [
                { left: "Planet tempat tinggal kita?", right: "Bumi" },
                { left: "Planet merah?", right: "Mars" },
                { left: "Satelit alami Bumi?", right: "Bulan" },
                { left: "Planet bercincin?", right: "Saturnus" }
            ],
            sedang: [
                { left: "Planet terdekat Matahari?", right: "Merkurius" },
                { left: "Planet terbesar?", right: "Jupiter" },
                { left: "Planet terpanas?", right: "Venus" },
                { left: "Planet terjauh?", right: "Neptunus" },
                { left: "Planet berputar miring?", right: "Uranus" }
            ],
            sulit: [
                { left: "Waktu satu revolusi Bumi?", right: "365 hari" },
                { left: "Planet kerdil?", right: "Pluto" },
                { left: "Satelit terbesar Jupiter?", right: "Ganymede" },
                { left: "Sabuk asteroid ada di antara?", right: "Mars dan Jupiter" },
                { left: "Satelit alami Mars?", right: "Phobos" }
            ]
        }
    },
    {
        id: "maze-mtk-01",
        type: "maze",
        mapel: "Matematika",
        title: "Labirin Harta: Operasi Hitung",
        duration: 4,
        pairs: {
            mudah: [
                { left: "7 + 8 = ...", right: "15" },
                { left: "20 − 9 = ...", right: "11" },
                { left: "3 × 4 = ...", right: "12" },
                { left: "20 : 4 = ...", right: "5" }
            ],
            sedang: [
                { left: "12 × 8 = ...", right: "96" },
                { left: "100 : 4 = ...", right: "25" },
                { left: "7 × 9 − 13 = ...", right: "50" },
                { left: "Keliling persegi sisi 9 cm?", right: "36 cm" },
                { left: "1/2 + 1/4 = ...", right: "3/4" }
            ],
            sulit: [
                { left: "FPB dari 12 dan 18?", right: "6" },
                { left: "KPK dari 4 dan 6?", right: "12" },
                { left: "Volume kubus sisi 5 cm?", right: "125 cm3" },
                { left: "15% dari 200?", right: "30" },
                { left: "(48 : 6) + (7 × 5) = ...", right: "43" }
            ]
        }
    },
    {
        id: "defense-indo-01",
        type: "defense",
        mapel: "Bahasa Indonesia",
        title: "Invasi Robot: Kata Baku",
        duration: 3,
        pairs: {
            mudah: [
                { left: "Lawan kata 'rajin'?", right: "malas" },
                { left: "Sinonim 'bahagia'?", right: "senang" },
                { left: "Awal kalimat memakai huruf ...", right: "kapital" },
                { left: "Akhir kalimat berita memakai tanda ...", right: "titik" }
            ],
            sedang: [
                { left: "Bentuk baku dari 'apotik'?", right: "apotek" },
                { left: "Bentuk baku dari 'photo'?", right: "foto" },
                { left: "Bentuk baku dari 'ijin'?", right: "izin" },
                { left: "Bentuk baku dari 'karir'?", right: "karier" },
                { left: "Bentuk baku dari 'aktifitas'?", right: "aktivitas" }
            ],
            sulit: [
                { left: "Bentuk baku dari 'cidera'?", right: "cedera" },
                { left: "Bentuk baku dari 'resiko'?", right: "risiko" },
                { left: "Imbuhan 'me- + sapu' menjadi ...", right: "menyapu" },
                { left: "Imbuhan 'me- + tulis' menjadi ...", right: "menulis" },
                { left: "Kata ulang dari 'anak'?", right: "anak-anak" }
            ]
        }
    },
    {
        id: "defense-mtk-01",
        type: "defense",
        mapel: "Matematika",
        title: "Invasi Robot: Perkalian Kilat",
        duration: 3,
        pairs: {
            mudah: [
                { left: "2 × 9 = ...", right: "18" },
                { left: "3 × 6 = ...", right: "18" },
                { left: "4 × 5 = ...", right: "20" },
                { left: "10 × 10 = ...", right: "100" }
            ],
            sedang: [
                { left: "8 × 7 = ...", right: "56" },
                { left: "9 × 6 = ...", right: "54" },
                { left: "12 × 6 = ...", right: "72" },
                { left: "15 × 4 = ...", right: "60" },
                { left: "11 × 11 = ...", right: "121" }
            ],
            sulit: [
                { left: "13 × 7 = ...", right: "91" },
                { left: "16 × 5 = ...", right: "80" },
                { left: "12 × 12 = ...", right: "144" },
                { left: "25 × 12 = ...", right: "300" },
                { left: "99 × 9 = ...", right: "891" }
            ]
        }
    },
    {
        id: "feed-mtk-01",
        type: "feed",
        mapel: "Matematika",
        title: "Mochi Lapar: Berhitung",
        duration: 3,
        pairs: {
            mudah: [
                { left: "5 + 8 = ...", right: "13" },
                { left: "12 − 5 = ...", right: "7" },
                { left: "3 × 4 = ...", right: "12" },
                { left: "20 : 5 = ...", right: "4" }
            ],
            sedang: [
                { left: "25 + 37 = ...", right: "62" },
                { left: "50 − 18 = ...", right: "32" },
                { left: "7 × 8 = ...", right: "56" },
                { left: "72 : 8 = ...", right: "9" },
                { left: "100 − 45 + 5 = ...", right: "60" }
            ],
            sulit: [
                { left: "125 + 375 = ...", right: "500" },
                { left: "12 × 12 = ...", right: "144" },
                { left: "3/5 + 1/5 = ...", right: "4/5" },
                { left: "(20 + 30) : 5 = ...", right: "10" },
                { left: "10% dari 150?", right: "15" }
            ]
        }
    },
    {
        id: "feed-indo-01",
        type: "feed",
        mapel: "Bahasa Indonesia",
        title: "Mochi Lapar: Kata Seru",
        duration: 3,
        pairs: {
            mudah: [
                { left: "Lawan kata 'besar'?", right: "kecil" },
                { left: "Sinonim 'senang'?", right: "gembira" },
                { left: "Hewan bersuara 'meong'?", right: "kucing" },
                { left: "Warna bendera Indonesia?", right: "merah putih" }
            ],
            sedang: [
                { left: "Bentuk baku 'apotik'?", right: "apotek" },
                { left: "Sinonim 'pintar'?", right: "cerdas" },
                { left: "Antonim 'jujur'?", right: "bohong" },
                { left: "Awal kalimat memakai huruf ...", right: "kapital" },
                { left: "Penutup surat untuk guru?", right: "hormat saya" }
            ],
            sulit: [
                { left: "Imbuhan 'me- + masak'?", right: "memasak" },
                { left: "Bentuk baku 'resiko'?", right: "risiko" },
                { left: "Makna 'buah tangan'?", right: "oleh-oleh" },
                { left: "Lawan kata 'abstrak'?", right: "konkret" },
                { left: "Kalimat ajakan memakai tanda ...", right: "seru" }
            ]
        }
    }
];
