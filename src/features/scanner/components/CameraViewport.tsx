import React, { useRef, useState } from 'react';
import { Camera, CameraOff, RefreshCw, Maximize2, AlertCircle } from 'lucide-react';
import { DetectedFace } from '../../vision/types';
import { CameraStatus } from '../../vision/camera/CameraManager';

interface CameraViewportProps {
  faces: DetectedFace[];
  selectedFaceId: string | null;
  onSelectFace: (faceId: string) => void;
  cameraStatus: CameraStatus;
  isMaxCapacityReached: boolean;
  videoRef: (node: HTMLVideoElement | null) => void;
  onStartCamera: () => void;
  onStopCamera: () => void;
  error: string | null;
}

export const CameraViewport: React.FC<CameraViewportProps> = ({
  faces,
  selectedFaceId,
  onSelectFace,
  cameraStatus,
  isMaxCapacityReached,
  videoRef,
  onStartCamera,
  onStopCamera,
  error,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const isLive = cameraStatus === 'active';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[320px] max-h-full bg-[#121316] rounded-3xl overflow-hidden shadow-xl border border-gray-200/20 flex items-center justify-center select-none"
    >
      {/* Video Stream Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-transform duration-300 ${
          isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
        } ${isLive ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Top Left LIVE Badge */}
      {isLive && (
        <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <span className="text-white text-xs font-bold tracking-wider">LIVE</span>
        </div>
      )}

      {/* Max Capacity Warning Banner */}
      {isMaxCapacityReached && (
        <div className="absolute top-4 right-4 z-20 flex items-center space-x-2 bg-amber-500/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-maunc-black text-xs font-bold shadow-lg animate-fade-in">
          <AlertCircle className="w-4 h-4 text-maunc-black" />
          <span>Kapasitas Maksimal (3 Wajah)</span>
        </div>
      )}

      {/* Face Bounding Box Overlays */}
      {isLive &&
        faces.map((face) => {
          // Compensate for video mirroring: mirrored x = 1 - box.x - box.width
          const renderX = isMirrored ? (1 - face.box.x - face.box.width) * 100 : face.box.x * 100;
          const renderY = face.box.y * 100;
          const renderWidth = face.box.width * 100;
          const renderHeight = face.box.height * 100;

          const isSelected = selectedFaceId === face.faceId;

          return (
            <div
              key={face.trackId}
              onClick={() => onSelectFace(face.faceId)}
              className={`absolute cursor-pointer transition-all duration-75 z-10 pointer-events-auto ${
                isSelected
                  ? 'border-[3px] border-maunc-yellow ring-4 ring-maunc-yellow/30'
                  : 'border-2 border-maunc-yellow/80 hover:border-maunc-yellow'
              } rounded-2xl`}
              style={{
                left: `${renderX}%`,
                top: `${renderY}%`,
                width: `${renderWidth}%`,
                height: `${renderHeight}%`,
              }}
            >
              {/* Face ID Pill Label */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/85 text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase whitespace-nowrap border border-white/20 shadow-md flex items-center space-x-1">
                <span>{face.faceId}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-maunc-yellow" />}
              </div>
            </div>
          );
        })}

      {/* Camera Inactive State */}
      {!isLive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-gradient-to-b from-[#181A20] to-[#121316] z-10">
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-maunc-yellow">
            <Camera className="w-7 h-7" />
          </div>
          <h3 className="text-lg md:text-xl font-bold mb-1">Kamera Belum Aktif</h3>
          <p className="text-gray-400 text-xs max-w-sm mb-5">
            Aktifkan kamera untuk mulai mendeteksi ekspresi wajah secara lokal dan real-time.
          </p>

          {error && (
            <div className="mb-4 px-4 py-2 rounded-xl bg-red-900/40 border border-red-500/50 text-red-200 text-xs max-w-md">
              {error}
            </div>
          )}

          <button
            onClick={onStartCamera}
            className="flex items-center space-x-2 px-6 py-2.5 bg-maunc-yellow hover:bg-maunc-yellow-dark text-maunc-black font-bold rounded-full text-xs md:text-sm transition-all shadow-glow-yellow active:scale-95 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Aktifkan Kamera</span>
          </button>
        </div>
      )}

      {/* Floating Bottom Left Camera Controls */}
      {isLive && (
        <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-white/10 shadow-lg">
          <button
            onClick={onStopCamera}
            className="p-1.5 text-white hover:text-red-400 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Hentikan Kamera"
            aria-label="Hentikan Kamera"
          >
            <CameraOff className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className="p-1.5 text-white hover:text-maunc-yellow hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Mirror Kamera"
            aria-label="Mirror Kamera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Bottom Right Fullscreen Button */}
      {isLive && (
        <div className="absolute bottom-4 right-4 z-20">
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-black/60 backdrop-blur-md text-white hover:text-maunc-yellow hover:bg-black/80 rounded-xl border border-white/10 shadow-lg transition-colors cursor-pointer"
            title="Layar Penuh"
            aria-label="Layar Penuh"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
