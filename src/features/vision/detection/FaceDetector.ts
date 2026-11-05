import { FilesetResolver, FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { BoundingBox } from '../types';

export class FaceDetector {
  private static instance: FaceDetector;
  private landmarker: FaceLandmarker | null = null;
  private isInitializing = false;
  private initPromise: Promise<FaceLandmarker> | null = null;
  private isReady = false;

  private constructor() {}

  public static getInstance(): FaceDetector {
    if (!FaceDetector.instance) {
      FaceDetector.instance = new FaceDetector();
    }
    return FaceDetector.instance;
  }

  public async initialize(): Promise<FaceLandmarker> {
    if (this.landmarker) return this.landmarker;
    if (this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        // Try local wasm first, fallback to CDN
        let vision;
        try {
          vision = await FilesetResolver.forVisionTasks('/wasm');
        } catch {
          vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
          );
        }

        // Try GPU delegate, fallback to CPU
        try {
          this.landmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: '/models/face_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numFaces: 3, // Max 3 faces per specification
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            outputFaceBlendshapes: true,
          });
        } catch {
          // Fallback to CPU delegate or CDN model
          this.landmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numFaces: 3,
            minFaceDetectionConfidence: 0.45,
            minFacePresenceConfidence: 0.45,
            minTrackingConfidence: 0.45,
            outputFaceBlendshapes: true,
          });
        }

        this.isReady = true;
        this.isInitializing = false;
        return this.landmarker;
      } catch (err) {
        this.isInitializing = false;
        this.initPromise = null;
        throw new Error(`MediaPipe Face Landmarker failed to load: ${err instanceof Error ? err.message : String(err)}`);
      }
    })();

    return this.initPromise;
  }

  public detect(video: HTMLVideoElement, timestamp: number = performance.now()): {
    boxes: BoundingBox[];
    rawResult: FaceLandmarkerResult | null;
  } {
    if (!this.landmarker || !this.isReady || video.readyState < 2) {
      return { boxes: [], rawResult: null };
    }

    try {
      const result = this.landmarker.detectForVideo(video, timestamp);
      const boxes: BoundingBox[] = [];

      if (result && result.faceLandmarks) {
        // Limit strictly to 3 faces
        const faces = result.faceLandmarks.slice(0, 3);

        for (const landmarks of faces) {
          let minX = 1;
          let minY = 1;
          let maxX = 0;
          let maxY = 0;

          for (const pt of landmarks) {
            if (pt.x < minX) minX = pt.x;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.y > maxY) maxY = pt.y;
          }

          const rawWidth = maxX - minX;
          const rawHeight = maxY - minY;

          // Add margin around face (18% horizontal, 24% vertical for hair/chin)
          const marginX = rawWidth * 0.18;
          const marginY = rawHeight * 0.24;

          const x = Math.max(0, minX - marginX);
          const y = Math.max(0, minY - marginY);
          const width = Math.min(1 - x, rawWidth + marginX * 2);
          const height = Math.min(1 - y, rawHeight + marginY * 2);

          boxes.push({ x, y, width, height });
        }
      }

      return { boxes, rawResult: result };
    } catch {
      return { boxes: [], rawResult: null };
    }
  }

  public isStarting(): boolean {
    return this.isInitializing;
  }

  public isLoaded(): boolean {
    return this.isReady;
  }
}

export const FaceDetectorService = FaceDetector.getInstance();
