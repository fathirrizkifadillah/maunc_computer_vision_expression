# Arsitektur Teknis — MAUNC AI: Robotic Tiger

**MAUNC — Mechanical Autonomous Navigation Control**  
**Universitas Siliwangi**

Dokumen ini mendokumentasikan keputusan arsitektur sistem, alur pemrosesan Computer Vision, mekanisme Face Tracking persisten, dan siklus hidup kamera pada website MAUNC AI.

---

## 1. Diagram Alur Pipeline Computer Vision

Kedua mode (**AI Expression Scanner** dan **Expression Battle**) ditenagai oleh fondasi Computer Vision tunggal yang terpadu:

```
                  ┌──────────────────────────────┐
                  │      Webcam User Input       │
                  │ (navigator.mediaDevices.gUM) │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    CameraManager Singleton   │
                  │  (Single stream, 0 leak)     │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │  MediaPipe Face Landmarker   │
                  │ (Max 3 faces, 468 landmarks) │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │      Face Bounding Boxes     │
                  │   (Expanded + Normalized)    │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │   IoU & Centroid Tracker     │
                  │   - Stable Face ID 01-03     │
                  │   - Grace period handling    │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ Offscreen 224x224 Face Crop  │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ Pretrained ViT ONNX Model    │
                  │ (@huggingface/transformers)  │
                  │  FER2013: LABEL_0 - LABEL_6  │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │  Expression Mapping & Filter │
                  │  - Happy   -> Senang         │
                  │  - Angry   -> Marah          │
                  │  - Sad     -> Sedih          │
                  │  - Fear    -> Takut          │
                  │  - Disgust -> Sebal          │
                  │  - Neutral -> Netral         │
                  │  (Surprise -> Belum Dikenali)│
                  └───────┬──────────────┬───────┘
                          │              │
         ┌────────────────┘              └────────────────┐
         ▼                                                ▼
┌──────────────────────────────┐         ┌──────────────────────────────┐
│  Mode 1: Expression Scanner  │         │   Mode 2: Expression Battle  │
│  - Bounding Box + Face ID    │         │  - Zone Split (P1 / P2)      │
│  - Right Sidebar Details     │         │  - Multi-frame Match (>=3)   │
│  - Mascot Dynamic Reaction   │         │  - Win / Loss / Draw Logic   │
└──────────────────────────────┘         └──────────────────────────────┘
```

---

## 2. Face Tracking dan Stabilitas Face ID

### Masalah Tracking Tradisional
Jika sorting koordinat kiri-ke-kanan dilakukan setiap frame, Face ID akan bertukar seketika saat orang menggerakkan kepala atau melintas.

### Solusi MAUNC FaceTracker
1. **IoU (Intersection over Union)**: Menghitung persentase tumpang tindih area wajah antara frame $t-1$ dan frame $t$.
2. **Centroid Proximity**: Menghitung jarak Euclidean pusat bounding box untuk menangani pergerakan cepat saat IoU turun.
3. **Combined Greedy Matching**: Memadukan bobot IoU (60%) dan kedekatan posisi (40%).
4. **Grace Period**: Jika wajah tertutup atau menghilang sesaat (misalnya menoleh atau terhalang tangan), Face ID tidak langsung dihapus melainkan diberi status `lost` selama 18 frame (~1.2 detik). Jika wajah kembali, status kembali `active`. Jika wajah tidak kembali setelah grace period, slot dilepas dan dapat didaur ulang.

---

## 3. Manajemen Siklus Hidup Kamera (Camera Lifecycle)

`CameraManager` diimplementasikan sebagai **Singleton** (`src/features/vision/camera/CameraManager.ts`):
- Memastikan hanya satu `MediaStream` aktif kapan pun.
- Menghindari browser crash atau tab lock akibat dua stream berebut webcam.
- Saat berpindah antar-mode atau menekan tombol reset, seluruh audio/video tracks dihentikan secara eksplisit via `track.stop()`.

---

## 4. Klasifikasi Emosi On-Device

- Model: `onnx-community/face-emotion-detection-ONNX` (Vision Transformer ViT-Base hasil fine-tuning FER2013).
- Runtime: `@huggingface/transformers` v3 dengan ONNX Runtime Web.
- Preprocessing: Crop wajah pada kanvas offscreen, normalisasi piksel, konversi RGB format 224x224.
- Smoothing: Menggunakan pembobotan eksponensial (Exponential Moving Average) dalam rentang 1200ms untuk mencegah efek flickering pada antarmuka pengguna.
- Privasi: Seluruh komputasi berjalan 100% lokal pada peramban pengguna, tanpa pengiriman data biometrik ke server luar.
