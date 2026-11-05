import React from 'react';
import { ScanFace, Gamepad2, ArrowRight, ShieldCheck, Zap, Users } from 'lucide-react';
import { AppMode } from '../components/layout/Header';

interface HomePageProps {
  onSelectMode: (mode: AppMode) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectMode }) => {
  return (
    <div className="w-full max-w-[1540px] mx-auto px-4 lg:px-8 py-10 md:py-16 relative">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center space-x-2 bg-amber-100/70 border border-amber-300/60 px-4 py-1.5 rounded-full text-xs font-bold text-amber-900 mb-6">
          <Zap className="w-3.5 h-3.5 text-maunc-yellow-dark" />
          <span>Computer Vision & Robotics Demo</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-maunc-black tracking-tight leading-tight mb-4">
          MAUNC AI <br />
          <span className="text-maunc-yellow-dark">Robotic Tiger</span>
        </h1>

        <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
          Eksplorasi visi komputer interaktif berbasis deteksi wajah dan pengenalan ekspresi emosi secara real-time
          menggunakan model kecerdasan buatan langsung di peramban web.
        </p>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
        {/* Card 1: Expression Scanner */}
        <div
          onClick={() => onSelectMode('scanner')}
          className="group relative bg-white rounded-3xl p-8 border border-gray-200/90 shadow-card hover:shadow-card-hover hover:border-maunc-yellow transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-6 text-maunc-yellow-dark group-hover:bg-maunc-yellow group-hover:text-maunc-black transition-colors">
              <ScanFace className="w-8 h-8" />
            </div>

            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-mono font-bold uppercase text-gray-400">Mode 01</span>
              <span className="h-1 w-1 rounded-full bg-gray-300" />
              <span className="text-xs font-semibold text-amber-600">Maks. 3 Wajah</span>
            </div>

            <h3 className="text-2xl font-bold text-maunc-black tracking-tight mb-3 group-hover:text-maunc-yellow-dark transition-colors">
              AI Expression Scanner
            </h3>

            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              Pindai hingga tiga wajah sekaligus. Sistem melacak Face ID secara stabil, memprediksi ekspresi emosi,
              dan menggerakkan respons wajah maskot harimau robot MAUNC.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-sm font-bold text-maunc-black group-hover:translate-x-1 transition-transform">
            <span>Buka Scanner</span>
            <ArrowRight className="w-4 h-4 text-maunc-yellow-dark" />
          </div>
        </div>

        {/* Card 2: Expression Battle */}
        <div
          onClick={() => onSelectMode('battle')}
          className="group relative bg-white rounded-3xl p-8 border border-gray-200/90 shadow-card hover:shadow-card-hover hover:border-maunc-yellow transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-6 text-maunc-yellow-dark group-hover:bg-maunc-yellow group-hover:text-maunc-black transition-colors">
              <Gamepad2 className="w-8 h-8" />
            </div>

            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-mono font-bold uppercase text-gray-400">Mode 02</span>
              <span className="h-1 w-1 rounded-full bg-gray-300" />
              <span className="text-xs font-semibold text-amber-600">2 Pemain</span>
            </div>

            <h3 className="text-2xl font-bold text-maunc-black tracking-tight mb-3 group-hover:text-maunc-yellow-dark transition-colors">
              Expression Battle
            </h3>

            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              Adu ketangkasan mimik wajah antara dua pemain menggunakan satu webcam. Tirukan ekspresi acak dari
              maskot secepat mungkin untuk meraih kemenangan.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-sm font-bold text-maunc-black group-hover:translate-x-1 transition-transform">
            <span>Mulai Pertandingan</span>
            <ArrowRight className="w-4 h-4 text-maunc-yellow-dark" />
          </div>
        </div>
      </div>

      {/* Feature Pills */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 font-medium">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>100% On-Device / Pemrosesan Lokal</span>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-maunc-yellow-dark" />
          <span>Face Landmarker & ViT Emotion Detection</span>
        </div>
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-blue-600" />
          <span>Zero Server Upload</span>
        </div>
      </div>
    </div>
  );
};
