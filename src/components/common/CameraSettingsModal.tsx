import React, { useState, useEffect } from 'react';
import { X, Camera, Sliders, RefreshCw, CheckCircle2, SplitSquareVertical } from 'lucide-react';
import { CameraManager, CameraMode, CameraSettings } from '../../features/vision/camera/CameraManager';

interface CameraSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

export const CameraSettingsModal: React.FC<CameraSettingsModalProps> = ({
  isOpen,
  onClose,
  onApplied,
}) => {
  const [mode, setMode] = useState<CameraMode>('single');
  const [singleId, setSingleId] = useState<string>('');
  const [p1Id, setP1Id] = useState<string>('');
  const [p2Id, setP2Id] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentSettings = CameraManager.getSettings();
      setMode(currentSettings.mode);
      setSingleId(currentSettings.singleDeviceId);
      setP1Id(currentSettings.p1DeviceId);
      setP2Id(currentSettings.p2DeviceId);
      loadDevices();
    }
  }, [isOpen]);

  const loadDevices = async () => {
    setIsRefreshing(true);
    try {
      const devs = await CameraManager.enumerateDevices();
      setDevices(devs);
      if (devs.length > 0) {
        if (!singleId) setSingleId(devs[0].deviceId);
        if (!p1Id) setP1Id(devs[0].deviceId);
        if (!p2Id) setP2Id(devs.length > 1 ? devs[1].deviceId : devs[0].deviceId);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    const updatedSettings: CameraSettings = {
      mode,
      singleDeviceId: singleId,
      p1DeviceId: p1Id,
      p2DeviceId: p2Id,
    };

    CameraManager.saveSettings(updatedSettings);

    // If camera is currently active, stop it so new configuration applies seamlessly
    CameraManager.stopCamera(true);

    if (onApplied) onApplied();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-maunc-yellow/20 flex items-center justify-center text-maunc-black">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-maunc-black tracking-tight">
                Pengaturan Kamera
              </h2>
              <p className="text-[11px] text-gray-500 font-medium">
                Pilih mode 1 kamera atau 2 kamera terpisah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-maunc-black hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm text-gray-700 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Mode Kamera Toggle Tabs */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-maunc-black uppercase tracking-wider font-mono">
              Mode Kamera Pertandingan
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: 1 Kamera Split View */}
              <div
                onClick={() => setMode('single')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  mode === 'single'
                    ? 'border-maunc-yellow bg-amber-50/40 ring-2 ring-maunc-yellow/20'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2 text-maunc-black font-bold text-xs">
                    <SplitSquareVertical className="w-4 h-4 text-maunc-yellow-dark" />
                    <span>1 Kamera (Split View)</span>
                  </div>
                  {mode === 'single' && (
                    <CheckCircle2 className="w-4 h-4 text-maunc-yellow-dark" />
                  )}
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Satu webcam dibagi dua zona (Pemain 1 di kiri, Pemain 2 di kanan).
                </p>
              </div>

              {/* Option B: 2 Kamera Terpisah */}
              <div
                onClick={() => setMode('dual')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  mode === 'dual'
                    ? 'border-maunc-yellow bg-amber-50/40 ring-2 ring-maunc-yellow/20'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2 text-maunc-black font-bold text-xs">
                    <Camera className="w-4 h-4 text-maunc-yellow-dark" />
                    <span>2 Kamera Terpisah</span>
                  </div>
                  {mode === 'dual' && (
                    <CheckCircle2 className="w-4 h-4 text-maunc-yellow-dark" />
                  )}
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Dua webcam independen (1 laptop + 1 webcam USB, atau 2 webcam).
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Device Selection Dropdowns */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-maunc-black uppercase tracking-wider font-mono">
                Perangkat Terdeteksi ({devices.length})
              </label>
              <button
                type="button"
                onClick={loadDevices}
                disabled={isRefreshing}
                className="flex items-center space-x-1 text-[11px] font-semibold text-gray-500 hover:text-maunc-black transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>

            {devices.length === 0 ? (
              <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500 text-center">
                Mendeteksi kamera... Pastikan izin kamera telah diberikan di peramban.
              </div>
            ) : mode === 'single' ? (
              /* Single Camera Device Selector */
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Kamera Utama:
                </label>
                <select
                  value={singleId}
                  onChange={(e) => setSingleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-maunc-black focus:outline-none focus:ring-2 focus:ring-maunc-yellow/40 focus:border-maunc-yellow"
                >
                  {devices.map((d, idx) => (
                    <option key={d.deviceId || idx} value={d.deviceId}>
                      {d.label || `Kamera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Dual Camera Device Selectors */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Kamera Pemain 1 (Sisi Kiri):
                  </label>
                  <select
                    value={p1Id}
                    onChange={(e) => setP1Id(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-maunc-black focus:outline-none focus:ring-2 focus:ring-maunc-yellow/40 focus:border-maunc-yellow"
                  >
                    {devices.map((d, idx) => (
                      <option key={d.deviceId || idx} value={d.deviceId}>
                        {d.label || `Kamera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Kamera Pemain 2 (Sisi Kanan):
                  </label>
                  <select
                    value={p2Id}
                    onChange={(e) => setP2Id(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-maunc-black focus:outline-none focus:ring-2 focus:ring-maunc-yellow/40 focus:border-maunc-yellow"
                  >
                    {devices.map((d, idx) => (
                      <option key={d.deviceId || idx} value={d.deviceId}>
                        {d.label || `Kamera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                {devices.length < 2 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-800 text-[11px] leading-relaxed">
                    Saat ini baru 1 kamera terdeteksi di perangkat. Tancapkan webcam USB kedua ke laptop agar Pemain 1 dan Pemain 2 memiliki webcam fisik yang berbeda.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-maunc-yellow hover:bg-maunc-yellow-dark text-maunc-black font-bold rounded-full text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Simpan &amp; Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};
