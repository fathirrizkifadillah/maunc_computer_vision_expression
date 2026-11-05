import React from 'react';
import { Users, Smile, Meh, Frown, AlertTriangle, Flame, ShieldAlert } from 'lucide-react';
import { DetectedFace, FinalExpression } from '../../vision/types';

interface DetectedFacesSidebarProps {
  faces: DetectedFace[];
  selectedFaceId: string | null;
  onSelectFace: (faceId: string) => void;
}

export const DetectedFacesSidebar: React.FC<DetectedFacesSidebarProps> = ({
  faces,
  selectedFaceId,
  onSelectFace,
}) => {
  const activeCount = faces.filter((f) => f.status === 'active').length;

  const renderExpressionIcon = (expr: FinalExpression | null) => {
    switch (expr) {
      case 'senang':
        return <Smile className="w-5 h-5 text-emerald-600" />;
      case 'marah':
        return <Flame className="w-5 h-5 text-red-600" />;
      case 'sedih':
        return <Frown className="w-5 h-5 text-blue-600" />;
      case 'takut':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'sebal':
        return <ShieldAlert className="w-5 h-5 text-purple-600" />;
      case 'netral':
      default:
        return <Meh className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-4 shadow-card border border-gray-100 flex flex-col flex-shrink-0 max-h-[56%] overflow-hidden">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-base md:text-lg font-bold text-maunc-black tracking-tight">
            Detected Faces
          </h2>
          <div className="h-0.5 w-7 bg-maunc-yellow rounded-full mt-0.5" />
        </div>

        {/* Counter Badge */}
        <div className="flex items-center space-x-1.5 bg-amber-100/70 border border-amber-200/50 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-900 shadow-sm">
          <Users className="w-3.5 h-3.5 text-amber-700" />
          <span>{activeCount} / 3</span>
        </div>
      </div>

      {/* Face Cards Container */}
      <div className="flex-1 mt-2.5 space-y-2 overflow-y-auto pr-1">
        {faces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
            <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mb-1.5 text-gray-400">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-gray-600">Menunggu Deteksi Wajah</p>
            <p className="text-[10px] text-gray-400 max-w-[200px] mt-0.5">
              Posisikan wajah Anda di depan kamera.
            </p>
          </div>
        ) : (
          faces.map((face) => {
            const isSelected = selectedFaceId === face.faceId;
            const confidencePercent = Math.round((face.confidence || 0.85) * 100);

            return (
              <div
                key={face.trackId}
                onClick={() => onSelectFace(face.faceId)}
                className={`relative flex items-center justify-between p-2.5 rounded-2xl transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/50 border-2 border-maunc-yellow shadow-sm ring-2 ring-maunc-yellow/20'
                    : 'bg-white hover:bg-gray-50/80 border border-gray-100 shadow-sm'
                }`}
              >
                {/* Left section: Icon + Yellow Vertical Bar + Face ID Info */}
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-gray-100/80 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    {renderExpressionIcon(face.expression)}
                  </div>

                  <div className="w-0.5 h-6 bg-maunc-yellow rounded-full flex-shrink-0" />

                  <div className="flex flex-col">
                    <span className="text-xs md:text-sm font-bold text-maunc-black tracking-tight">
                      {face.faceId}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-600">
                      {face.expressionLabel || 'Menganalisis'}
                    </span>
                  </div>
                </div>

                {/* Right section: Confidence Pill Badge */}
                <div className="flex items-center space-x-1.5">
                  <div className="bg-maunc-yellow text-maunc-black font-extrabold text-[11px] md:text-xs px-2.5 py-0.5 rounded-full shadow-sm">
                    {confidencePercent}%
                  </div>
                </div>

                {/* Status indicator tag if temporarily lost */}
                {face.status === 'lost' && (
                  <div className="absolute -top-1.5 right-3 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                    Hilang Sementara
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info inside Sidebar */}
      <div className="mt-1.5 pt-1.5 border-t border-gray-100 text-[10px] text-gray-400 flex items-center justify-between flex-shrink-0">
        <span>Klik kartu untuk mengaitkan ke maskot</span>
        <span className="font-semibold text-maunc-black">Maks. 3 Wajah</span>
      </div>
    </div>
  );
};
