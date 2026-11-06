import { useState, useEffect, useRef, useCallback } from 'react';
import { CameraManager, CameraStatus } from '../camera/CameraManager';
import { FaceDetectorService } from '../detection/FaceDetector';
import { ExpressionClassifierService } from '../classification/ExpressionClassifier';
import { BlendshapeClassifierService } from '../classification/BlendshapeClassifier';
import { FaceTracker } from '../tracking/FaceTracker';
import { DetectedFace, VisionPipelineStatus } from '../types';

export interface UseVisionPipelineOptions {
  autoStart?: boolean;
  classificationIntervalMs?: number;
}

export function useVisionPipeline(options: UseVisionPipelineOptions = {}) {
  const { autoStart = false, classificationIntervalMs = 200 } = options;

  const [faces, setFaces] = useState<DetectedFace[]>([]);
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [isDetectorReady, setIsDetectorReady] = useState<boolean>(false);
  const [isClassifierReady, setIsClassifierReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const trackerRef = useRef<FaceTracker>(new FaceTracker({ maxFaces: 3 }));
  const isLoopRunningRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);

  // Initialize AI models
  useEffect(() => {
    let mounted = true;

    async function initModels() {
      try {
        await FaceDetectorService.initialize();
        if (mounted) setIsDetectorReady(true);
      } catch (err) {
        console.error('Failed to init FaceDetector:', err);
      }

      try {
        await ExpressionClassifierService.initialize();
        if (mounted) setIsClassifierReady(true);
      } catch (err) {
        console.error('Failed to init ExpressionClassifier:', err);
      }
    }

    initModels();

    return () => {
      mounted = false;
    };
  }, []);

  // Subscribe to CameraManager
  useEffect(() => {
    const unsubscribe = CameraManager.subscribe((camState) => {
      setCameraStatus(camState.status);
      if (camState.error) {
        setError(camState.error);
      }
    });

    if (autoStart) {
      CameraManager.startCamera().catch((err) => {
        setError(err.message);
      });
    }

    return () => {
      unsubscribe();
    };
  }, [autoStart]);

  // Main vision requestAnimationFrame loop
  const runVisionLoop = useCallback(() => {
    if (!isLoopRunningRef.current) return;

    const video = videoElementRef.current;
    if (video && video.readyState >= 2 && !video.paused && !video.ended) {
      const now = performance.now();

      // 1. Run Face Detection
      const detectionResult = FaceDetectorService.detect(video, now);
      const rawDetections = detectionResult.boxes.map((box, idx) => ({
        box,
        blendshapes: detectionResult.blendshapes[idx],
      }));

      // 2. Update Face Tracker (max 3 faces)
      const trackedFaces = trackerRef.current.update(rawDetections, Date.now());

      // 3. Instant Real-Time Emotion Classification via On-Device Blendshapes
      const activeFaces = trackedFaces.filter((f) => f.status === 'active');
      activeFaces.forEach((face) => {
        const result = BlendshapeClassifierService.classify(face.blendshapes || {}, face.trackId);
        trackerRef.current.updateExpression(
          face.trackId,
          result.expression,
          result.label,
          result.rawLabel,
          result.confidence
        );
      });

      setFaces([...trackedFaces]);
    }

    animationFrameIdRef.current = requestAnimationFrame(runVisionLoop);
  }, [classificationIntervalMs]);

  // Start/Stop vision loop when camera becomes active
  useEffect(() => {
    if (cameraStatus === 'active') {
      isLoopRunningRef.current = true;
      animationFrameIdRef.current = requestAnimationFrame(runVisionLoop);
    } else {
      isLoopRunningRef.current = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      setFaces([]);
    }

    return () => {
      isLoopRunningRef.current = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [cameraStatus, runVisionLoop]);

  // Default selectedFaceId to first active face if none selected or if selected face was lost
  useEffect(() => {
    if (faces.length > 0) {
      const currentExists = faces.some((f) => f.faceId === selectedFaceId);
      if (!currentExists || !selectedFaceId) {
        setSelectedFaceId(faces[0].faceId);
      }
    } else {
      setSelectedFaceId(null);
    }
  }, [faces, selectedFaceId]);

  const bindVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoElementRef.current = node;
    if (node) {
      CameraManager.attachToVideo(node);
    } else {
      CameraManager.detachVideo();
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      await CameraManager.startCamera();
      if (videoElementRef.current) {
        CameraManager.attachToVideo(videoElementRef.current);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memulai kamera.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    CameraManager.stopCamera(true);
    trackerRef.current.reset();
    setFaces([]);
  }, []);

  const pipelineStatus: VisionPipelineStatus = {
    isCameraReady: cameraStatus === 'active',
    isDetectorReady,
    isClassifierReady,
    activeFacesCount: faces.filter((f) => f.status === 'active').length,
    isMaxCapacityReached: faces.length >= 3,
    error,
  };

  return {
    faces,
    selectedFaceId,
    setSelectedFaceId,
    pipelineStatus,
    cameraStatus,
    error,
    videoRef: bindVideoRef,
    startCamera,
    stopCamera,
  };
}
