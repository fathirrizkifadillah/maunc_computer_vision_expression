import React from 'react';
import { X, ShieldCheck, Cpu, Eye } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center space-x-3">
            <img
              src="/assets/brand/maunc-logo.png"
              alt="MAUNC Emblem"
              className="w-7 h-7 object-contain"
            />
            <div>
              <h2 className="text-base font-bold text-maunc-black tracking-tight">
                MAUNC AI — Robotic Tiger
              </h2>
              <p className="text-[11px] text-gray-500 font-medium">
                Mechanical Autonomous Navigation Control • Universitas Siliwangi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-maunc-black hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Clean, High-Craft Editorial Typography (Zero AI Slop Pastel Boxes) */}
        <div className="p-6 space-y-5 text-sm text-gray-700 max-h-[75vh] overflow-y-auto">
          {/* Tentang Sistem: Pure Minimalist Tech Presentation */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-maunc-yellow-dark">
              Tentang Sistem
            </h3>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
              Website Computer Vision interaktif ini dibangun untuk demonstrasi teknologi visi komputer real-time
              dan robotika. Seluruh inferensi ekspresi emosi dieksekusi secara instan dan mandiri di perangkat peramban web.
            </p>
          </div>

          {/* Mode Operasi: Sleek Neutral Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/70">
              <div className="flex items-center space-x-2 text-maunc-black font-bold text-xs mb-1.5">
                <Eye className="w-4 h-4 text-maunc-black" />
                <span>Mode 1: Expression Scanner</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Mendeteksi hingga 3 wajah sekaligus dengan pelacakan Face ID stabil, estimasi ekspresi, dan respons wajah maskot robot.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/70">
              <div className="flex items-center space-x-2 text-maunc-black font-bold text-xs mb-1.5">
                <Cpu className="w-4 h-4 text-maunc-black" />
                <span>Mode 2: Expression Battle</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Pertandingan 2 pemain menggunakan 1 webcam bersama. Pemain menirukan target ekspresi acak secepat mungkin.
              </p>
            </div>
          </div>

          {/* 6 Kategori Ekspresi Resmi */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-maunc-black">
              6 Kategori Ekspresi Resmi:
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              {['Senang', 'Marah', 'Sedih', 'Takut', 'Sebal', 'Netral'].map((expr) => (
                <div
                  key={expr}
                  className="py-1.5 px-1 bg-white font-semibold text-gray-800 rounded-xl border border-gray-200 shadow-sm text-[11px]"
                >
                  {expr}
                </div>
              ))}
            </div>
          </div>

          {/* Privasi & Keamanan: Minimalist Tech Notice */}
          <div className="pt-2 border-t border-gray-100 flex items-start space-x-3">
            <ShieldCheck className="w-4 h-4 text-maunc-black flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="font-bold text-xs text-maunc-black">
                Privasi & Keamanan Lokal (On-Device)
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                100% pemrosesan citra kamera berjalan lokal di browser. Tidak ada foto, video, atau data biometrik yang
                disimpan atau dikirim ke server luar.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-gray-50/80 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-maunc-black hover:bg-zinc-800 text-white font-bold rounded-full text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
