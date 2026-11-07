import React, { useState } from 'react';
import { Bot, Users } from 'lucide-react';
import { useVisionPipeline } from '../vision/hooks/useVisionPipeline';
import { CameraManager } from '../vision/camera/CameraManager';
import { CameraViewport } from './components/CameraViewport';
import { DetectedFacesSidebar } from './components/DetectedFacesSidebar';
import { MascotFollower } from './components/MascotFollower';

export const ScannerView: React.FC = () => {
  const {
    faces,
    selectedFaceId,
    setSelectedFaceId,
    pipelineStatus,
    cameraStatus,
    error,
    videoRef,
    startCamera,
    stopCamera,
  } = useVisionPipeline({ autoStart: false, classificationIntervalMs: 200 });

  // Mobile segmented tab: 'mascot' by default for immediate feedback
  const [mobileTab, setMobileTab] = useState<'mascot' | 'faces'>('mascot');

  // Get current active face expression for mascot reaction
  const selectedFace = faces.find((f) => f.faceId === selectedFaceId);
  const activeExpression = selectedFace?.expression ?? (faces[0]?.expression || 'netral');

  const handleCycleCamera = () => {
    CameraManager.cycleCamera().catch(() => {});
  };

  const availableDevicesCount = CameraManager.getState().availableDevices.length;

  return (
    <div className="w-full max-w-[1540px] mx-auto px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 min-h-0 h-auto lg:h-[calc(100dvh-57px-41px)] lg:max-h-[calc(100dvh-57px-41px)] lg:overflow-hidden flex flex-col justify-start lg:justify-center">
      {/* 2-Column Layout on Desktop, Ergonomic Mobile Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-stretch lg:h-full lg:max-h-full min-h-0">
        {/* Left Column: Camera Viewport (Col 1-8, ~67%) */}
        <div className="lg:col-span-8 flex flex-col min-h-0">
          <div className="h-[320px] sm:h-[440px] lg:h-full max-h-full flex flex-col justify-center min-h-0">
            <CameraViewport
              faces={faces}
              selectedFaceId={selectedFaceId}
              onSelectFace={setSelectedFaceId}
              cameraStatus={cameraStatus}
              isMaxCapacityReached={pipelineStatus.isMaxCapacityReached}
              videoRef={videoRef}
              onStartCamera={startCamera}
              onStopCamera={stopCamera}
              onCycleCamera={handleCycleCamera}
              canCycleCamera={availableDevicesCount > 1}
              error={error}
            />
          </div>

          {/* Mobile-Only Segmented Control (Thumb-Friendly, Ergonomic Switcher) */}
          <div className="flex lg:hidden items-center p-1 bg-white rounded-2xl border border-gray-200/90 shadow-sm mt-2.5 mb-1 select-none">
            <button
              onClick={() => setMobileTab('mascot')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer active:scale-95 ${
                mobileTab === 'mascot'
                  ? 'bg-maunc-yellow text-maunc-black shadow-sm'
                  : 'text-gray-600 hover:text-maunc-black hover:bg-gray-50'
              }`}
            >
              <Bot className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Maskot Harimau</span>
              {selectedFace && (
                <span className="bg-maunc-black text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold uppercase">
                  {selectedFace.expressionLabel || 'Netral'}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileTab('faces')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer active:scale-95 ${
                mobileTab === 'faces'
                  ? 'bg-maunc-yellow text-maunc-black shadow-sm'
                  : 'text-gray-600 hover:text-maunc-black hover:bg-gray-50'
              }`}
            >
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Wajah Terdeteksi</span>
              <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">
                {faces.length}/3
              </span>
            </button>
          </div>

          {/* Mobile-Only Active Tab Content */}
          <div className="block lg:hidden mt-1 min-h-[220px]">
            {mobileTab === 'mascot' ? (
              <div className="bg-white rounded-3xl p-3 border border-gray-100 shadow-card flex flex-col items-center justify-center">
                <MascotFollower
                  expression={activeExpression}
                  selectedFaceId={selectedFace?.faceId ?? null}
                />
              </div>
            ) : (
              <DetectedFacesSidebar
                faces={faces}
                selectedFaceId={selectedFaceId}
                onSelectFace={setSelectedFaceId}
              />
            )}
          </div>
        </div>

        {/* Right Column: Desktop Only Sidebar (Stacked Faces + Mascot, 100% Fit) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col gap-3 justify-between min-h-0 lg:h-full lg:max-h-full">
          {/* Top: Detected Faces Sidebar */}
          <DetectedFacesSidebar
            faces={faces}
            selectedFaceId={selectedFaceId}
            onSelectFace={setSelectedFaceId}
          />

          {/* Bottom: Dedicated Half-Body Mascot Card */}
          <MascotFollower
            expression={activeExpression}
            selectedFaceId={selectedFace?.faceId ?? null}
          />
        </div>
      </div>
    </div>
  );
};
