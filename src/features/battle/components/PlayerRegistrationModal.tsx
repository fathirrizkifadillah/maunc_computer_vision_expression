import React, { useState, useEffect } from 'react';
import { X, UserCheck } from 'lucide-react';

interface PlayerRegistrationModalProps {
  isOpen: boolean;
  playerId: 1 | 2;
  currentName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

export const PlayerRegistrationModal: React.FC<PlayerRegistrationModalProps> = ({
  isOpen,
  playerId,
  currentName,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(currentName);
    setError(null);
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Nama pemain wajib diisi.');
      return;
    }
    if (trimmed.length > 20) {
      setError('Maksimal 20 karakter.');
      return;
    }
    onSave(trimmed);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-maunc-yellow" />
            <h3 className="text-base font-bold text-maunc-black">
              Registrasi Pemain {playerId}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor={`player-name-${playerId}`}
              className="block text-xs font-semibold text-gray-700 mb-1.5"
            >
              Nama Pemain:
            </label>
            <input
              id={`player-name-${playerId}`}
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder={`Contoh: Pemain ${playerId}`}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-maunc-yellow/50 focus:border-maunc-yellow text-sm font-medium text-maunc-black transition-all"
            />
            {error && <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>}
          </div>

          <p className="text-xs text-gray-500">
            Nama akan ditampilkan selama sesi pertandingan dan dapat diubah sewaktu-waktu.
          </p>

          <div className="flex items-center justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-6 py-2 bg-maunc-yellow hover:bg-maunc-yellow-dark text-maunc-black font-bold rounded-full text-xs transition-all shadow-sm active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              <span>Simpan Nama</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
