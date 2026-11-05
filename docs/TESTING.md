# Panduan dan Hasil Pengujian (Testing Documentation)

**MAUNC AI — Robotic Tiger**  
**Tanggal Pengujian:** 2026-11-05

Dokumen ini memuat rangkuman hasil pengujian unit (Vitest), pengujian tipe (TypeScript), pengujian build produksi, serta protokol verifikasi visual dan fungsional.

---

## 1. Hasil Pengujian Unit (Vitest)

Pengujian dijalankan melalui perintah `npm run test` (`vitest run`). Seluruh 20 test case berhasil lulus 100%.

```
 RUN  v3.2.7 C:/CODING/maunc_cv_expression

 ✓ src/features/vision/classification/__tests__/expressionMapping.test.ts (5 tests)
   ✓ should only contain the 6 official MAUNC expressions
   ✓ should correctly map raw model and english labels to final indonesian expressions
   ✓ should NOT map Surprise or other non-standard expressions to valid categories
   ✓ should return correct human-readable Indonesian display names
   ✓ should map config with official asset paths
 ✓ src/features/vision/tracking/__tests__/faceTracker.test.ts (6 tests)
   ✓ calculates IoU correctly for identical, overlapping, and disjoint boxes
   ✓ calculates center distance correctly
   ✓ creates Face ID 01 when first face is detected
   ✓ maintains the same Face ID when the face moves across frames
   ✓ assigns unique sequential Face IDs to multiple faces (up to max 3)
   ✓ retains Face ID during grace period and only releases after grace expires
 ✓ src/features/battle/logic/__tests__/battleEngine.test.ts (9 tests)
   ✓ always selects one of the 6 official expressions
   ✓ can optionally exclude previous target to prevent consecutive repetition
   ✓ correctly assigns faces to left zone (P1) or right zone (P2) with mirroring
   ✓ enforces exactly 1 face per player zone
   ✓ detects multiple faces in same zone
   ✓ fails if detected expression differs from target
   ✓ fails if confidence is below threshold
   ✓ accumulates consecutive frames when matching and only triggers win when threshold reached
   ✓ resets consecutive frames if player expression flickers or drops

 Test Files  3 passed (3)
      Tests  20 passed (20)
```

---

## 2. Hasil Pemeriksaan Tipe (TypeScript Typecheck)

Pengujian dijalankan melalui perintah `npm run typecheck` (`tsc --noEmit`).

```
> tsc --noEmit
Exit code: 0 (Zero errors)
```

---

## 3. Hasil Build Produksi (Vite Production Build)

Pengujian dijalankan melalui perintah `npm run build` (`tsc && vite build`).

```
✓ 1631 modules transformed.
dist/index.html                                             0.89 kB │ gzip:     0.49 kB
dist/assets/ort-wasm-simd-threaded.jsep-B0T3yYHD.wasm  21,596.02 kB │ gzip: 5,087.10 kB
dist/assets/index-BO9yG7P3.css                             33.40 kB │ gzip:     6.45 kB
dist/assets/index-BuF6UB0b.js                           1,233.80 kB │ gzip:   340.16 kB
✓ built in 14.36s
Exit code: 0
```

---

## 4. Protokol Verifikasi Fungsional

### Mode 1 — AI Expression Scanner
1. Buka halaman scanner.
2. Klik tombol **Aktifkan Kamera**.
3. Pastikan izin kamera muncul dan video stream tampil dengan badge `● LIVE`.
4. Dekatkan wajah ke kamera:
   - Kotak bounding box kuning muncul dengan tag `FACE ID 01`.
   - Di sidebar kanan, kartu `Face ID 01` muncul dengan persentase confidence dan nama ekspresi bahasa Indonesia.
   - Maskot di pojok kanan bawah bergerak mengikuti ekspresi wajah yang terdeteksi.
5. Coba dengan 2 dan 3 orang:
   - Terbit `FACE ID 02` dan `FACE ID 03`.
   - Saat orang ke-4 masuk, muncul notifikasi `Kapasitas Maksimal (3 Wajah)`.
6. Klik kartu Face ID lain di sidebar:
   - Maskot berpindah fokus mengikuti ekspresi Face ID yang baru dipilih.
7. Klik tombol hentikan kamera atau beralih mode:
   - Stream kamera mati sepenuhnya (lampu indikator webcam laptop mati).

### Mode 2 — Expression Battle
1. Buka halaman battle.
2. Kondisi awal: Kedua sisi terkunci dengan tombol **Daftar / Ganti Nama**.
3. Registrasi Pemain 1 (misal "Budi") dan Pemain 2 (misal "Fathir").
4. Stream webcam menyala dengan pembatas garis kuning vertikal di tengah.
5. Pemain 1 berdiri di sisi kiri dan Pemain 2 di sisi kanan.
6. Status kedua pemain berubah menjadi `Siap` ketika masing-masing area mendeteksi tepat 1 wajah.
7. Tombol **Start Battle** menjadi aktif.
8. Tekan **Start Battle**:
   - Sistem memilih 1 dari 6 ekspresi secara acak (misal: "Senang").
   - Hitung mundur berjalan: 3, 2, 1, GO!
   - Maskot menampilkan gambar ekspresi target.
9. Pemain yang menirukan ekspresi dengan benar dan stabil selama 3 frame pertama kali dinobatkan sebagai pemenang (`MENANG!`) dengan efek selebrasi konfeti.
10. Tombol **Main Lagi** mengulang ronde baru dengan pemain yang sama.
11. Tombol **Reset Pemain** membersihkan nama dan menghentikan kamera.
