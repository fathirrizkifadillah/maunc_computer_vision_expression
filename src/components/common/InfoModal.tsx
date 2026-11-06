import React from 'react';
import { X, ShieldCheck, Cpu, Eye, Sparkles } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXPRESSION_GUIDES = [
  {
    id: 'senang',
    name: 'Senang (Happy)',
    asset: '/assets/expressions/senang.png',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    definisi: 'Ekspresi gembira, antusias, dan bersahabat.',
    panduan: 'Tersenyumlah lebar hingga kedua sudut bibir terangkat simetris dan pipi menyipit.',
  },
  {
    id: 'marah',
    name: 'Marah (Angry)',
    asset: '/assets/expressions/marah.png',
    badgeColor: 'bg-red-50 text-red-800 border-red-200',
    definisi: 'Ekspresi geram, emosi tinggi, atau tatapan tegas.',
    panduan: 'Rapatkan dan turunkan kedua alis ke arah tengah (kerutkan dahi tajam) dengan bibir mengatup kuat.',
  },
  {
    id: 'sedih',
    name: 'Sedih (Sad / Cemberut)',
    asset: '/assets/expressions/sedih.png',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    definisi: 'Ekspresi murung, sedih, atau merajuk / cemberut.',
    panduan: 'Tarik kedua sudut bibir ke bawah atau dorong bibir bawah dan dagu ke atas (cemberut). Pastikan mulut tetap tertutup rapat (jangan membuka mulut/melet).',
  },
  {
    id: 'takut',
    name: 'Takut (Fear / Shock)',
    asset: '/assets/expressions/takut.png',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    definisi: 'Ekspresi terkejut, waspada, atau kaget.',
    panduan: 'Belalakkan kedua mata lebar-lebar dengan menaikkan alis ke atas serta sedikit membuka mulut kaget (gasp).',
  },
  {
    id: 'sebal',
    name: 'Sebal (Disgust / Sneer)',
    asset: '/assets/expressions/sebal.png',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    definisi: 'Ekspresi jijik, sinis, muak, atau enggan.',
    panduan: 'Angkat salah satu sudut bibir atas (senyum sinis / smirk) atau kerutkan batang hidung.',
  },
  {
    id: 'netral',
    name: 'Netral (Neutral)',
    asset: '/assets/expressions/netral.png',
    badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
    definisi: 'Kondisi rileks, tenang, dan siap siaga.',
    panduan: 'Rilekskan seluruh otot wajah tanpa tersenyum, mengernyit, cemberut, atau membuka mulut.',
  },
];

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 bg-gray-50/90 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <img
              src="/assets/brand/maunc-logo.png"
              alt="MAUNC Emblem"
              className="w-7 h-7 object-contain"
            />
            <div>
              <h2 className="text-base font-bold text-maunc-black tracking-tight">
                MAUNC AI — Bantuan & Informasi Sistem
              </h2>
              <p className="text-[11px] text-gray-500 font-medium">
                Mechanical Autonomous Navigation Control • Universitas Siliwangi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-maunc-black hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 text-sm text-gray-700 overflow-y-auto flex-1">
          {/* Tentang Sistem */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-maunc-yellow-dark">
              <Sparkles className="w-3.5 h-3.5" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider">
                Tentang Sistem
              </h3>
            </div>
            <p className="text-xs sm:text-[13px] text-gray-600 leading-relaxed">
              Website Computer Vision interaktif ini dibangun untuk demonstrasi visi komputer real-time
              dan robotika. Seluruh inferensi ekspresi emosi dieksekusi 100% lokal on-device di browser secara instan tanpa mengirim data video ke server.
            </p>
          </div>

          {/* Mode Operasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70">
              <div className="flex items-center space-x-2 text-maunc-black font-bold text-xs mb-1">
                <Eye className="w-4 h-4 text-maunc-black" />
                <span>Mode 1: Expression Scanner</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Mendeteksi hingga 3 wajah sekaligus dengan pelacakan Face ID stabil, estimasi emosi, dan respons wajah maskot harimau robot MAUNC.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70">
              <div className="flex items-center space-x-2 text-maunc-black font-bold text-xs mb-1">
                <Cpu className="w-4 h-4 text-maunc-black" />
                <span>Mode 2: Expression Battle</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Pertandingan 2 pemain menggunakan 1 webcam bersama (atau 2 kamera terpisah). Tirukan target ekspresi acak dari maskot secepat mungkin.
              </p>
            </div>
          </div>

          {/* 6 Kategori Ekspresi Resmi & Panduan Pose Kamera */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-maunc-black uppercase tracking-wider font-mono">
                Definisi 6 Ekspresi & Panduan Wajah di Kamera:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {EXPRESSION_GUIDES.map((guide) => (
                <div
                  key={guide.id}
                  className="p-3 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-start space-x-3 hover:border-maunc-yellow transition-colors"
                >
                  <img
                    src={guide.asset}
                    alt={guide.name}
                    className="w-10 h-10 object-contain flex-shrink-0 mt-0.5 filter drop-shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-maunc-black">
                        {guide.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-700 font-medium leading-snug mb-1">
                      {guide.definisi}
                    </p>
                    <p className="text-[10px] text-gray-500 leading-snug bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                      <strong className="text-gray-700">Panduan: </strong>
                      {guide.panduan}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privasi & Keamanan */}
          <div className="pt-2 border-t border-gray-100 flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="font-bold text-xs text-maunc-black">
                Privasi & Keamanan Lokal (100% On-Device)
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Pemrosesan Computer Vision berjalan langsung di peramban pengguna. Tidak ada rekaman gambar, video, atau data biometrik yang diunggah ke server mana pun.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-gray-50/90 border-t border-gray-100 flex justify-end flex-shrink-0">
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
