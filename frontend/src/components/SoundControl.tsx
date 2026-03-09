'use client';

import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sounds } from '@/lib/sounds';

export default function SoundControl({ className = '' }: { className?: string }) {
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    sounds.loadPrefs();
    setMuted(sounds.muted);
    setVolume(sounds.volume);
  }, []);

  const toggleMute = () => {
    const next = !muted;
    sounds.setMuted(next);
    setMuted(next);
    if (!next) sounds.click();
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    sounds.setVolume(v);
    if (!muted) sounds.click();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleMute}
        className="transition-colors"
        title={muted ? 'Unmute' : 'Mute'}
        style={{ color: muted ? '#6e7681' : '#3caff6' }}
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={muted ? 0 : volume}
        onChange={handleVolume}
        className="w-20 accent-[#3caff6] cursor-pointer"
        style={{ height: 4 }}
      />
    </div>
  );
}
