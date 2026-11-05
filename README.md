# MAUNC AI — Robotic Tiger

Website Computer Vision interaktif dengan identitas resmi **MAUNC (Mechanical Autonomous Navigation Control)** — Universitas Siliwangi.

Website ini menyediakan demonstrasi visi komputer on-device yang berjalan secara real-time langsung di peramban web tanpa memerlukan backend server eksternal, dengan dua mode utama:
1. **AI Expression Scanner** (Kapasitas maks. 3 wajah)
2. **Expression Battle** (Permainan 2 pemain dengan 1 webcam terbagi)

---

## 🐯 Identitas Brand dan Visual

- **Warna Utama**: Hitam (`#121316`), Abu-abu Gelap (`#1E2127`), Putih (`#FFFFFF`)
- **Aksen Resmi**: Kuning MAUNC (`#FDB813`)
- **Pendukung**: Metallic Grey (`#5A6270`), Red eye indicator (`#DC2626`)
- **Arah Desain**: Elegant, Minimal, Premium, Professional, Clean.

---

## 🎭 6 Kategori Ekspresi Resmi

Sistem menggunakan enam kategori ekspresi dengan aset visual maskot resmi:

| Label Model | Label Antarmuka (Bahasa Indonesia) | Aset Maskot |
|---|---|---|
| Happy | Senang | `senang.png` |
| Angry | Marah | `marah.png` |
| Sad | Sedih | `sedih.png` |
| Fear | Takut | `takut.png` |
| Disgust | Sebal | `sebal.png` (`kesal.png`) |
| Neutral | Netral | `netral.png` |

> *Catatan*: Model klasifikasi mungkin mendeteksi `Surprise` pada frame tertentu. Sesuai spesifikasi resmi MAUNC, `Surprise` bukan salah satu dari 6 ekspresi yang didukung sehingga ditampilkan sebagai "Belum Dikenali" dan tidak dihitung sebagai target kemenangan.

---

## ⚡ Fitur Utama

### Mode 1 — AI Expression Scanner
- Deteksi wajah menggunakan **MediaPipe Face Landmarker** (hingga 468 titik landmark per wajah).
- Pembatasan kapasitas maksimal **3 wajah**.
- Pelacakan wajah persisten (**Face ID 01, 02, 03**) menggunakan algoritma IoU + Centroid proximity dengan masa tenggang (*grace period*).
- Klasifikasi ekspresi real-time menggunakan model **Vision Transformer (ViT)** via Transformers.js.
- Sidebar detail wajah dengan skor confidence nyata dan visualisasi emosi.
- Pemilihan Face ID interaktif yang menggerakkan ekspresi maskot harimau robot secara langsung.

### Mode 2 — Expression Battle
- Pertandingan ekspresi 2 pemain menggunakan **satu aliran webcam bersama**.
- Pembagian zona otomatis: Sisi Kiri (Pemain 1) dan Sisi Kanan (Pemain 2).
- Verifikasi kesiapan pemain (*ready check*) memastikan masing-masing zona memiliki tepat satu wajah yang stabil.
- Pemilihan target ekspresi acak yang terkunci selama ronde.
- Hitung mundur 3 detik (3, 2, 1, GO!).
- Evaluasi pemenang berbasis confidence threshold dan kestabilan multi-frame (3 frame berturut-turut).
- Selebrasi pemenang dengan animasi konfeti.
- Kontrol pertandingan: Mulai Pertandingan, Main Lagi, Ganti Pemain 1, Ganti Pemain 2, Reset Pemain.

---

## 🛠️ Tech Stack

- **Frontend Core**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, CSS Custom Properties / Tokens
- **Icons**: Lucide React
- **Computer Vision**:
  - `@mediapipe/tasks-vision` (Face Landmarker, 3 faces max, WASM lokal)
  - `@huggingface/transformers` (ONNX Runtime Web, model `onnx-community/face-emotion-detection-ONNX`)
- **Testing**: Vitest (20 unit tests lulus)
- **Effects**: canvas-confetti

---

## 📁 Struktur Folder

```text
maunc_cv_expression/
├── elements/                          # Aset asli (logo, horizontal, maskot, ekspresi)
├── public/
│   ├── assets/
│   │   ├── brand/                     # Logo emblem dan horizontal MAUNC
│   │   ├── mascot/                    # Maskot full-body MAUNC
│   │   └── expressions/               # 6 ekspresi resmi maskot
│   ├── models/                        # Model lokal face_landmarker.task
│   └── wasm/                          # MediaPipe wasm binaries
├── src/
│   ├── app/
│   │   └── App.tsx                    # Root app & mode switching
│   ├── components/
│   │   ├── layout/                    # Header & Footer resmi MAUNC
│   │   └── common/                    # InfoModal
│   ├── features/
│   │   ├── scanner/                   # Mode 1: Expression Scanner components
│   │   ├── battle/                    # Mode 2: Expression Battle arena & logic
│   │   └── vision/
│   │       ├── camera/                # CameraManager singleton
│   │       ├── detection/             # MediaPipe FaceDetector service
│   │       ├── tracking/              # FaceTracker (IoU + Centroid + Grace)
│   │       ├── classification/        # ViT ExpressionClassifier & mapping
│   │       ├── hooks/                 # useVisionPipeline hook
│   │       └── types/                 # Vision & expression data types
│   ├── pages/
│   │   └── HomePage.tsx               # Landing & mode selection entry point
│   └── styles/
│       ├── tokens.css                 # MAUNC design tokens
│       └── index.css                  # Tailwind & global base
├── docs/
│   ├── ARCHITECTURE.md                # Dokumentasi arsitektur sistem
│   ├── SKILL_USAGE_AUDIT.md           # Bukti audit pembacaan 9 skill lokal
│   └── TESTING.md                     # Rangkuman pengujian unit & build
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Cara Menjalankan Project

### 1. Prasyarat
- Node.js versi 18+ (direkomendasikan Node.js 20 atau 24)
- npm atau pnpm

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Menjalankan Server Pengembangan (Dev)
```bash
npm run dev
```
Buka peramban pada alamat `http://localhost:3000` (atau port yang ditunjukkan di terminal).

### 4. Menjalankan Unit Test
```bash
npm run test
```

### 5. Memeriksa Tipe TypeScript
```bash
npm run typecheck
```

### 6. Membangun Versi Produksi (Build)
```bash
npm run build
```

---

## 🔒 Privasi dan Keamanan Data

Aplikasi ini mengutamakan privasi pengunjung:
1. Tidak menyimpan foto atau video wajah pengguna.
2. Tidak mengunggah frame kamera ke server cloud atau API pihak ketiga mana pun.
3. Seluruh inferensi AI berjalan secara lokal di perangkat peramban pengguna.
4. Aliran kamera dihentikan secara total saat keluar dari mode atau menutup aplikasi.

---

## ⚖️ Keterbatasan Sistem

1. **Akses Kamera**: Memerlukan izin eksplisit dari pengguna dan lingkungan aman (*Secure Context*: `localhost` atau HTTPS).
2. **Pencahayaan**: Kualitas deteksi wajah dan ekspresi bergantung pada pencahayaan ruangan dan kejernihan webcam fisik.
3. **Hardware Acceleration**: Performa inferensi model Vision Transformer optimal pada peramban yang mendukung WebGL / WebGPU / WASM SIMD.
