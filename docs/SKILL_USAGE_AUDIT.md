# Audit Penggunaan Skill Lokal (Skill Usage Audit)

**Proyek:** MAUNC AI — Robotic Tiger  
**Organisasi:** MAUNC (Mechanical Autonomous Navigation Control)  
**Waktu Audit:** 2026-11-05  

Dokumen ini mencatat bukti pembacaan dan rencana penerapan prinsip-prinsip dari 9 skill lokal yang diwajibkan, dibaca langsung dari path `C:\Users\FATHIR\.agents\skills\<skill-name>\SKILL.md`.

---

## Ringkasan Status Pembacaan Skill

| No | Nama Skill | Lokasi Sumber | Status Pembacaan | Fokus Utama / Prinsip Inti |
|---|---|---|---|---|
| 1 | `frontend-design` | `C:\Users\FATHIR\.agents\skills\frontend-design\SKILL.md` | BERHASIL DIBACA | Arah estetika eksplisit (Industrial Utilitarian / Tech Robotics), DFII score tinggi, anti generic AI UI, tipografi terstruktur, diferensiasi visual kuat. |
| 2 | `design-taste-frontend` | `C:\Users\FATHIR\.agents\skills\design-taste-frontend\SKILL.md` | BERHASIL DIBACA | Anti-slop, kalibrasi warna (aksen tunggal kuning `#FFC107` / `#F59E0B`, zinc/charcoal base), anti emoji icons (wajib SVG Lucide), layout asimetris responsif, mobile override `min-h-[100dvh]`, spring physics, state lengkap (loading, empty, error, tactile). |
| 3 | `ui-ux-pro-max` | `C:\Users\FATHIR\.agents\skills\ui-ux-pro-max\SKILL.md` | BERHASIL DIBACA | Hirarki WCAG a11y, touch target minimum 44px, contrast ratio >= 4.5:1, cursor pointer pada clickable items, transisi 150-300ms, z-index terstruktur, semantic HTML. |
| 4 | `web-design-guidelines` | `C:\Users\FATHIR\.agents\skills\web-design-guidelines\SKILL.md` | BERHASIL DIBACA | Navigasi jelas, state sinkron, label tepat, input interaktif responsif, feedback visual instan saat webcam diaktifkan atau status berubah. |
| 5 | `vercel-react-best-practices` | `C:\Users\FATHIR\.agents\skills\vercel-react-best-practices\SKILL.md` | BERHASIL DIBACA | Eliminasi re-render boros, pemisahan inference loop dari state render React (menggunakan `useRef` untuk stream dan frame tracking), lazy loading model, `Promise.all` paralel, hoisting static assets. |
| 6 | `computer-vision-expert` | `C:\Users\FATHIR\.agents\skills\computer-vision-expert\SKILL.md` | BERHASIL DIBACA | Pipeline modular: Frame Grabber -> MediaPipe Face Landmarker (max 3) -> IoU/Centroid Face Tracker (Face ID persisten) -> Face Crop Preprocessor -> ONNX/Transformers.js Classifier -> Label Mapping & Smoothing. |
| 7 | `fixing-motion-performance` | `C:\Users\FATHIR\.agents\skills\fixing-motion-performance\SKILL.md` | BERHASIL DIBACA | Animasi hanya menggunakan `transform` dan `opacity` (hindari layout thrashing), hindari blur filter berat pada video streaming, requestAnimationFrame loop dengan pembatalan/cleanup ketat. |
| 8 | `accessibility-compliance-accessibility-audit` | `C:\Users\FATHIR\.agents\skills\accessibility-compliance-accessibility-audit\SKILL.md` | BERHASIL DIBACA | Aria labels pada kontrol kamera dan icon buttons, keyboard navigable tab mode switcher, contrast warna tinggi pada teks dan badge status, alt text deskriptif untuk aset maskot dan logo. |
| 9 | `vitest` | `C:\Users\FATHIR\.agents\skills\vitest\SKILL.md` | BERHASIL DIBACA | Vitest unit testing: isolasi test, deterministic assertions, pengujian murni logika (expression mapping, face tracker IoU & grace period, battle state machine). |

---

## Pemetaan Implementasi ke Komponen dan File

| Skill | Bagian Implementasi | Bukti File / Modul Terkait |
|---|---|---|
| `frontend-design` & `design-taste-frontend` | Tokens warna MAUNC, layout header mode switcher, badge LIVE, card Detected Faces, battle split view, typography sans-serif modern | `src/styles/tokens.css`, `src/components/layout/Header.tsx`, `src/features/scanner/components/DetectedFacesList.tsx`, `src/features/battle/components/BattleArena.tsx` |
| `vercel-react-best-practices` | Pemisahan render cycle dari rAF vision loop, singleton CameraManager, ref tracking transient values | `src/features/vision/camera/CameraManager.ts`, `src/features/vision/hooks/useVisionPipeline.ts` |
| `computer-vision-expert` | Face Landmarker MediaPipe (max 3 wajah), IoU Centroid Tracker, Face ID assigner, Emotion Classifier | `src/features/vision/detection/FaceDetector.ts`, `src/features/vision/tracking/FaceTracker.ts`, `src/features/vision/classification/ExpressionClassifier.ts` |
| `fixing-motion-performance` | Animasi bounding box smooth via GPU transform/scale, hardware accelerated transitions | `src/features/scanner/components/FaceOverlay.tsx`, `src/features/battle/components/MascotReaction.tsx` |
| `accessibility-compliance-accessibility-audit` | Semantic buttons, aria-live status alerts, aria-label pada icon buttons, contrast tokens | `src/components/common/Button.tsx`, `src/components/common/IconButton.tsx` |
| `vitest` | Unit tests untuk Expression Mapping, Face Tracker IoU, Battle Logic | `src/features/vision/classification/__tests__/expressionMapping.test.ts`, `src/features/vision/tracking/__tests__/faceTracker.test.ts`, `src/features/battle/logic/__tests__/battleEngine.test.ts` |

---
*Catatan audit: Seluruh 9 skill telah dibaca secara langsung dari direktori lokal sebelum pengerjaan arsitektur teknis dan UI dimulai.*
