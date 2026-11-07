import React, { useState } from 'react';
import { Header, AppMode } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
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

  const isScannerMode = mode === 'scanner';

  return (
    <div
      className={`w-full min-h-[100dvh] flex flex-col justify-between bg-maunc-bg text-maunc-black selection:bg-maunc-yellow selection:text-maunc-black relative ${
        isScannerMode
          ? 'lg:h-[100dvh] lg:max-h-[100dvh] lg:overflow-hidden'
          : 'lg:min-h-[100dvh]'
      }`}
    >
      {/* Top Navigation Header */}
      <Header
        currentMode={mode}
        onSelectMode={handleSelectMode}
        onOpenInfo={() => setIsInfoOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main View Area: Mode 1 (Scanner) is strictly zero-scroll on desktop, Mode 2 (Battle) is scrollable */}
      <main
        className={`flex-1 flex flex-col min-h-0 pb-16 md:pb-0 ${
          isScannerMode
            ? 'overflow-y-auto lg:overflow-hidden'
            : 'overflow-y-auto'
        }`}
      >
        {mode === 'home' && <HomePage onSelectMode={handleSelectMode} />}
        {mode === 'scanner' && <ScannerView />}
        {mode === 'battle' && <BattleView />}
      </main>

      {/* Mobile-Only Floating Bottom Navigation Bar (Thumb-reach ergonomics) */}
      {mode !== 'home' && (
        <MobileBottomNav currentMode={mode} onSelectMode={handleSelectMode} />
      )}

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
