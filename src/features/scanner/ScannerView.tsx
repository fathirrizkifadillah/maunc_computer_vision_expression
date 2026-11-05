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
    <div className="w-full max-w-[1540px] mx-auto px-4 lg:px-8 py-6 relative pb-28">
      {/* 2-Column Main Layout: Camera Viewport on Left, Detected Faces Sidebar on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Camera Viewport (Col 1-8, ~67%) */}
        <div className="lg:col-span-8 flex flex-col">
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

        {/* Right Column: Detected Faces List (Col 9-12, ~33%) */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <DetectedFacesSidebar
            faces={faces}
            selectedFaceId={selectedFaceId}
            onSelectFace={setSelectedFaceId}
          />
        </div>
      </div>

      {/* Mascot Follower in bottom-right corner */}
      <MascotFollower expression={activeExpression} selectedFaceId={selectedFace?.faceId ?? null} />
    </div>
  );
};
