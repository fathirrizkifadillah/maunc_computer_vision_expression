/**
 * CameraManager: Singleton Webcam Stream Controller
 * Supports Single Stream (Split View) and Dual Independent Streams (1 Laptop + 1 Webcam, or 2 Webcams).
 */

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'stopped' | 'error';
export type CameraMode = 'single' | 'dual';

export interface CameraSettings {
  mode: CameraMode;
  singleDeviceId: string;
  p1DeviceId: string;
  p2DeviceId: string;
}

export interface CameraState {
  status: CameraStatus;
  stream: MediaStream | null;
  streamP1: MediaStream | null;
  streamP2: MediaStream | null;
  error: string | null;
  availableDevices: MediaDeviceInfo[];
  settings: CameraSettings;
  width: number;
  height: number;
}

type CameraListener = (state: CameraState) => void;

const SETTINGS_STORAGE_KEY = 'maunc_camera_settings';

class CameraManagerClass {
  private static instance: CameraManagerClass;
  private stream: MediaStream | null = null;
  private streamP1: MediaStream | null = null;
  private streamP2: MediaStream | null = null;

  private videoElement: HTMLVideoElement | null = null;
  private videoP1Element: HTMLVideoElement | null = null;
  private videoP2Element: HTMLVideoElement | null = null;

  private status: CameraStatus = 'idle';
  private errorMessage: string | null = null;
  private listeners: Set<CameraListener> = new Set();
  private availableDevices: MediaDeviceInfo[] = [];

  private settings: CameraSettings = {
    mode: 'single',
    singleDeviceId: '',
    p1DeviceId: '',
    p2DeviceId: '',
  };

  private width = 1280;
  private height = 720;
  private activeConsumerCount = 0;

  private constructor() {
    this.loadSettings();
  }

  public static getInstance(): CameraManagerClass {
    if (!CameraManagerClass.instance) {
      CameraManagerClass.instance = new CameraManagerClass();
    }
    return CameraManagerClass.instance;
  }

  private loadSettings() {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch {
      // Use defaults
    }
  }

  public saveSettings(newSettings: Partial<CameraSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore storage errors
    }
    this.notify();
  }

  public getSettings(): CameraSettings {
    return { ...this.settings };
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
      streamP1: this.streamP1,
      streamP2: this.streamP2,
      error: this.errorMessage,
      availableDevices: this.availableDevices,
      settings: { ...this.settings },
      width: this.width,
      height: this.height,
    };
  }

  /**
   * Enumerate all connected video input devices
   */
  public async enumerateDevices(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.availableDevices = devices.filter((d) => d.kind === 'videoinput');

      // Set initial defaults if unselected
      if (this.availableDevices.length > 0) {
        if (!this.settings.singleDeviceId) {
          this.settings.singleDeviceId = this.availableDevices[0].deviceId;
        }
        if (!this.settings.p1DeviceId) {
          this.settings.p1DeviceId = this.availableDevices[0].deviceId;
        }
        if (!this.settings.p2DeviceId) {
          this.settings.p2DeviceId =
            this.availableDevices.length > 1
              ? this.availableDevices[1].deviceId
              : this.availableDevices[0].deviceId;
        }
      }

      this.notify();
      return this.availableDevices;
    } catch (err) {
      console.warn('Failed to enumerate media devices:', err);
      return [];
    }
  }

  /**
   * Starts a single webcam stream (used in Scanner mode or Single Camera Battle mode)
   */
  public async startCamera(deviceId?: string): Promise<MediaStream> {
    this.activeConsumerCount++;

    const targetDeviceId = deviceId || this.settings.singleDeviceId;

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

      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        frameRate: { ideal: 30, min: 15 },
      };

      if (targetDeviceId) {
        videoConstraints.deviceId = { exact: targetDeviceId };
      } else {
        videoConstraints.facingMode = 'user';
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      this.stream = mediaStream;
      this.status = 'active';

      // Update available devices list with accurate labels now that permission is granted
      await this.enumerateDevices();

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
          message = 'Perangkat kamera tidak ditemukan.';
        } else if (err.name === 'OverconstrainedError') {
          // Fallback to any default camera if specific deviceId was disconnected
          return this.startCamera();
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

  /**
   * Starts two independent webcam streams (1 Laptop + 1 Webcam, or 2 Webcams)
   */
  public async startDualCameras(
    deviceIdP1?: string,
    deviceIdP2?: string
  ): Promise<{ streamP1: MediaStream; streamP2: MediaStream }> {
    const targetP1 = deviceIdP1 || this.settings.p1DeviceId;
    const targetP2 = deviceIdP2 || this.settings.p2DeviceId;

    this.status = 'requesting';
    this.errorMessage = null;
    this.notify();

    try {
      // 1. Start Player 1 Camera
      const p1Constraints: MediaTrackConstraints = {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        frameRate: { ideal: 30, min: 15 },
      };
      if (targetP1) {
        p1Constraints.deviceId = { exact: targetP1 };
      }

      const mediaStreamP1 = await navigator.mediaDevices.getUserMedia({
        video: p1Constraints,
        audio: false,
      });
      this.streamP1 = mediaStreamP1;

      // 2. Start Player 2 Camera (separate physical camera device)
      const p2Constraints: MediaTrackConstraints = {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        frameRate: { ideal: 30, min: 15 },
      };
      if (targetP2 && targetP2 !== targetP1) {
        p2Constraints.deviceId = { exact: targetP2 };
      }

      const mediaStreamP2 = await navigator.mediaDevices.getUserMedia({
        video: p2Constraints,
        audio: false,
      });
      this.streamP2 = mediaStreamP2;

      this.status = 'active';
      await this.enumerateDevices();
      this.notify();

      return { streamP1: mediaStreamP1, streamP2: mediaStreamP2 };
    } catch (err) {
      this.status = 'error';
      const msg = err instanceof Error ? err.message : 'Gagal mengakses dua kamera sekaligus.';
      this.errorMessage = msg;
      this.notify();
      throw new Error(msg);
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
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.streamP1) {
      this.streamP1.getTracks().forEach((track) => track.stop());
      this.streamP1 = null;
    }

    if (this.streamP2) {
      this.streamP2.getTracks().forEach((track) => track.stop());
      this.streamP2 = null;
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

  public attachP1Video(video: HTMLVideoElement): void {
    this.videoP1Element = video;
    if (this.streamP1 && video.srcObject !== this.streamP1) {
      video.srcObject = this.streamP1;
      video.play().catch(() => {});
    }
  }

  public attachP2Video(video: HTMLVideoElement): void {
    this.videoP2Element = video;
    if (this.streamP2 && video.srcObject !== this.streamP2) {
      video.srcObject = this.streamP2;
      video.play().catch(() => {});
    }
  }

  public detachVideo(): void {
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    if (this.videoP1Element) {
      this.videoP1Element.srcObject = null;
      this.videoP1Element = null;
    }
    if (this.videoP2Element) {
      this.videoP2Element.srcObject = null;
      this.videoP2Element = null;
    }
  }

  public isStreaming(): boolean {
    return (
      this.status === 'active' &&
      ((!!this.stream && this.stream.active) ||
        (!!this.streamP1 && this.streamP1.active && !!this.streamP2 && this.streamP2.active))
    );
  }
}

export const CameraManager = CameraManagerClass.getInstance();
