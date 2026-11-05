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
        return <Smile className="w-6 h-6 text-emerald-600" />;
      case 'marah':
        return <Flame className="w-6 h-6 text-red-600" />;
      case 'sedih':
        return <Frown className="w-6 h-6 text-blue-600" />;
      case 'takut':
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      case 'sebal':
        return <ShieldAlert className="w-6 h-6 text-purple-600" />;
      case 'netral':
      default:
        return <Meh className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className="w-full bg-white rounded-[2rem] p-6 shadow-card border border-gray-100 flex flex-col h-full min-h-[460px]">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-maunc-black tracking-tight">
            Detected Faces
          </h2>
          {/* Yellow decorative accent bar */}
          <div className="h-1 w-10 bg-maunc-yellow rounded-full mt-1.5" />
        </div>

        {/* Counter Badge */}
        <div className="flex items-center space-x-1.5 bg-amber-100/70 border border-amber-200/50 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-bold text-amber-900 shadow-sm">
          <Users className="w-4 h-4 text-amber-700" />
          <span>
            {activeCount} / 3
          </span>
        </div>
      </div>

      {/* Face Cards Container */}
      <div className="flex-1 mt-5 space-y-3.5 overflow-y-auto pr-1">
        {faces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
            <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mb-3 text-gray-400">
              <Users className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">Menunggu Deteksi Wajah</p>
            <p className="text-xs text-gray-400 max-w-xs">
              Posisikan wajah Anda di depan kamera untuk memulai pemindaian otomatis.
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
                className={`relative flex items-center justify-between p-4 rounded-2xl transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/50 border-2 border-maunc-yellow shadow-md ring-2 ring-maunc-yellow/20'
                    : 'bg-white hover:bg-gray-50/80 border border-gray-100 shadow-sm'
                }`}
              >
                {/* Left section: Icon + Yellow Vertical Bar + Face ID Info */}
                <div className="flex items-center space-x-3.5">
                  {/* Outline Emotion Icon inside circle */}
                  <div className="w-11 h-11 rounded-full bg-gray-100/80 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    {renderExpressionIcon(face.expression)}
                  </div>

                  {/* Yellow vertical accent divider */}
                  <div className="w-1 h-8 bg-maunc-yellow rounded-full flex-shrink-0" />

                  {/* Face ID & Expression Name */}
                  <div className="flex flex-col">
                    <span className="text-sm md:text-base font-bold text-maunc-black tracking-tight">
                      {face.faceId}
                    </span>
                    <span className="text-xs font-semibold text-gray-600">
                      {face.expressionLabel || 'Menganalisis'}
                    </span>
                  </div>
                </div>

                {/* Right section: Confidence Pill Badge */}
                <div className="flex items-center space-x-2">
                  <div className="bg-maunc-yellow text-maunc-black font-extrabold text-xs md:text-sm px-3.5 py-1.5 rounded-full shadow-sm">
                    {confidencePercent}%
                  </div>
                </div>

                {/* Status indicator tag if temporarily lost */}
                {face.status === 'lost' && (
                  <div className="absolute -top-2 right-4 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    Hilang Sementara
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info inside Sidebar */}
      <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
        <span>Klik kartu untuk mengaitkan ekspresi maskot</span>
        <span className="font-semibold text-maunc-black">Maks. 3 Wajah</span>
      </div>
    </div>
  );
};
