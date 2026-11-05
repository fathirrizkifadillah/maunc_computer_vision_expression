import React from 'react';
import { X, ShieldCheck, Cpu, Eye, Sparkles } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-3">
            <img
              src="/assets/brand/maunc-logo.png"
              alt="MAUNC Emblem"
              className="w-8 h-8 object-contain"
            />
            <div>
              <h2 className="text-lg font-bold text-maunc-black">MAUNC AI — Robotic Tiger</h2>
              <p className="text-xs text-gray-500">Mechanical Autonomous Navigation Control • Universitas Siliwangi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm text-gray-700">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">Tentang Sistem</h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Website interaktif Computer Vision ini dirancang khusus untuk demonstrasi kecerdasan buatan dan
                robotika, menampilkan kemampuan estimasi ekspresi wajah secara lokal dan real-time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/70">
              <div className="flex items-center space-x-2 text-maunc-black font-semibold mb-2">
                <Eye className="w-4 h-4 text-maunc-yellow" />
                <span>Mode 1: Expression Scanner</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Mendeteksi hingga 3 wajah sekaligus dengan pelacakan Face ID yang stabil, mengklasifikasikan emosi,
                dan menggerakkan respons wajah maskot harimau robot secara langsung.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/70">
              <div className="flex items-center space-x-2 text-maunc-black font-semibold mb-2">
                <Cpu className="w-4 h-4 text-maunc-yellow" />
                <span>Mode 2: Expression Battle</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Pertandingan ekspresi 2 pemain menggunakan satu webcam yang dibagi menjadi dua zona. Pemain menirukan
                target ekspresi acak dari maskot secepat dan seakurat mungkin.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-maunc-black mb-2">6 Kategori Ekspresi Resmi:</h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              {['Senang', 'Marah', 'Sedih', 'Takut', 'Sebal', 'Netral'].map((expr) => (
                <div key={expr} className="py-2 px-1 bg-gray-100 font-medium rounded-xl border border-gray-200">
                  {expr}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-emerald-900 text-xs">Komitmen Privasi & Keamanan</h4>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                Seluruh pemrosesan Computer Vision berjalan 100% di browser pengguna secara lokal (on-device). Tidak
                ada gambar, video, atau data biometrik yang disimpan maupun dikirim ke server luar.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-maunc-yellow hover:bg-maunc-yellow-dark text-maunc-black font-semibold rounded-full text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
