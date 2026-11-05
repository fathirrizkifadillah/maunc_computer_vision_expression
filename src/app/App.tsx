import React, { useState } from 'react';
import { Header, AppMode } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { InfoModal } from '../components/common/InfoModal';
import { CameraSettingsModal } from '../components/common/CameraSettingsModal';
import { HomePage } from '../pages/HomePage';
import { ScannerView } from '../features/scanner/ScannerView';
import { BattleView } from '../features/battle/BattleView';
import { CameraManager } from '../features/vision/camera/CameraManager';

export const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('scanner');
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSelectMode = (newMode: AppMode) => {
    if (newMode !== mode) {
      // Clean up camera when leaving mode to prevent stream leaks
      CameraManager.stopCamera(true);
      setMode(newMode);
    }
  };

  const isScanner = mode === 'scanner';

  return (
    <div
      className={`w-full ${
        isScanner ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'
      } flex flex-col justify-between bg-maunc-bg text-maunc-black selection:bg-maunc-yellow selection:text-maunc-black`}
    >
      {/* Top Navigation Header */}
      <Header
        currentMode={mode}
        onSelectMode={handleSelectMode}
        onOpenInfo={() => setIsInfoOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-hidden">
        {mode === 'home' && <HomePage onSelectMode={handleSelectMode} />}
        {mode === 'scanner' && <ScannerView />}
        {mode === 'battle' && <BattleView />}
      </main>

      {/* Official Bottom Bar */}
      <Footer />

      {/* System Information Modal */}
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />

      {/* Camera Settings Modal */}
      <CameraSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
