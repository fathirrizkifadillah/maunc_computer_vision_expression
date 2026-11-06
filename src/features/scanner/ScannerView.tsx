import React from 'react';
import { useVisionPipeline } from '../vision/hooks/useVisionPipeline';
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

  // Get current active face expression for mascot reaction
  const selectedFace = faces.find((f) => f.faceId === selectedFaceId);
  const activeExpression = selectedFace?.expression ?? (faces[0]?.expression || 'netral');

  return (
    <div className="w-full max-w-[1540px] mx-auto px-3 sm:px-4 lg:px-8 py-3 min-h-0 h-auto lg:h-[calc(100dvh-57px-41px)] lg:max-h-[calc(100dvh-57px-41px)] lg:overflow-hidden flex flex-col justify-start lg:justify-center">
      {/* 2-Column Layout on Desktop, Fluid Stack on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch lg:h-full lg:max-h-full min-h-0">
        {/* Left Column: Camera Viewport (Col 1-8, ~67%) */}
        <div className="lg:col-span-8 h-[280px] xs:h-[340px] sm:h-[420px] lg:h-full max-h-full flex flex-col justify-center min-h-0">
          <CameraViewport
            faces={faces}
            selectedFaceId={selectedFaceId}
            onSelectFace={setSelectedFaceId}
            cameraStatus={cameraStatus}
            isMaxCapacityReached={pipelineStatus.isMaxCapacityReached}
            videoRef={videoRef}
            onStartCamera={startCamera}
            onStopCamera={stopCamera}
            error={error}
          />
        </div>

        {/* Right Column: Detected Faces List + Half Body Mascot (Col 9-12, ~33%) */}
        <div className="lg:col-span-4 flex flex-col gap-3 justify-between min-h-0 lg:h-full lg:max-h-full">
          {/* Top: Detected Faces Sidebar (Flexible & non-overflowing) */}
          <DetectedFacesSidebar
            faces={faces}
            selectedFaceId={selectedFaceId}
            onSelectFace={setSelectedFaceId}
          />

          {/* Bottom: Dedicated Half-Body Mascot Card (Zero Collision, Never Obstructs) */}
          <MascotFollower
            expression={activeExpression}
            selectedFaceId={selectedFace?.faceId ?? null}
          />
        </div>
      </div>
    </div>
  );
};
