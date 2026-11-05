/**
 * CameraManager: Singleton Webcam Stream Controller
 * Guarantees a single shared MediaStream, safe lifecycle, and zero camera leaks.
 */

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'stopped' | 'error';

export interface CameraState {
  status: CameraStatus;
  stream: MediaStream | null;
  error: string | null;
  deviceId?: string;
  width: number;
  height: number;
}

type CameraListener = (state: CameraState) => void;

class CameraManagerClass {
  private static instance: CameraManagerClass;
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private status: CameraStatus = 'idle';
  private errorMessage: string | null = null;
  private listeners: Set<CameraListener> = new Set();
  private width = 1280;
  private height = 720;
  private activeConsumerCount = 0;

  private constructor() {}

  public static getInstance(): CameraManagerClass {
    if (!CameraManagerClass.instance) {
      CameraManagerClass.instance = new CameraManagerClass();
    }
    return CameraManagerClass.instance;
  }

  public subscribe(listener: CameraListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }

  public getState(): CameraState {
    return {
      status: this.status,
      stream: this.stream,
      error: this.errorMessage,
      width: this.width,
      height: this.height,
    };
  }

  public async startCamera(preferredFacing: 'user' | 'environment' = 'user'): Promise<MediaStream> {
    this.activeConsumerCount++;

    if (this.stream && this.stream.active) {
      return this.stream;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = 'Browser tidak mendukung akses kamera (WebRTC tidak tersedia).';
      this.status = 'error';
      this.errorMessage = err;
      this.notify();
      throw new Error(err);
    }

    try {
      this.status = 'requesting';
      this.errorMessage = null;
      this.notify();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: preferredFacing,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.stream = mediaStream;
      this.status = 'active';

      // Read real track settings
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.width) this.width = settings.width;
        if (settings.height) this.height = settings.height;

        videoTrack.onended = () => {
          this.stopCamera(true);
        };
      }

      this.notify();
      return mediaStream;
    } catch (err: unknown) {
      this.status = 'error';
      let message = 'Gagal mengakses kamera.';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          message = 'Izin kamera ditolak oleh pengguna.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          message = 'Tidak ada perangkat kamera yang ditemukan.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          message = 'Kamera sedang digunakan oleh aplikasi lain.';
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      this.errorMessage = message;
      this.notify();
      throw new Error(message);
    }
  }

  public stopCamera(force: boolean = false): void {
    if (!force) {
      this.activeConsumerCount = Math.max(0, this.activeConsumerCount - 1);
      if (this.activeConsumerCount > 0) {
        return;
      }
    } else {
      this.activeConsumerCount = 0;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
      this.stream = null;
    }

    this.status = 'stopped';
    this.notify();
  }

  public attachToVideo(video: HTMLVideoElement): void {
    this.videoElement = video;
    if (this.stream && video.srcObject !== this.stream) {
      video.srcObject = this.stream;
      video.play().catch(() => {});
    }
  }

  public detachVideo(): void {
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  public isStreaming(): boolean {
    return this.status === 'active' && !!this.stream && this.stream.active;
  }
}

export const CameraManager = CameraManagerClass.getInstance();
