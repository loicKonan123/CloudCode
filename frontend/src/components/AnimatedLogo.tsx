'use client';

/**
 * AnimatedLogo — CSS 3D spinning wireframe cube
 * Used as the main CloudCode logo in all navigation headers.
 */
export default function AnimatedLogo({ size = 28 }: { size?: number }) {
  const s = size;          // face dimension (px)
  const h = Math.round(s / 2); // half = translateZ distance

  const face: React.CSSProperties = {
    position: 'absolute',
    width: s,
    height: s,
    border: '1.5px solid rgba(60,175,246,0.8)',
    background: 'rgba(60,175,246,0.07)',
    boxShadow: 'inset 0 0 8px rgba(60,175,246,0.12)',
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        perspective: s * 4,
        perspectiveOrigin: '50% 50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <style>{`
        @keyframes _cc3d {
          0%   { transform: rotateX(22deg) rotateY(0deg); }
          100% { transform: rotateX(22deg) rotateY(360deg); }
        }
        @keyframes _ccPulse {
          0%,100% { filter: drop-shadow(0 0 3px rgba(60,175,246,.4)); }
          50%     { filter: drop-shadow(0 0 10px rgba(60,175,246,.9)); }
        }
      `}</style>

      {/* Glow wrapper */}
      <div style={{ animation: '_ccPulse 3s ease-in-out infinite' }}>
        {/* 3D cube */}
        <div
          style={{
            width: s,
            height: s,
            position: 'relative',
            transformStyle: 'preserve-3d',
            animation: '_cc3d 6s linear infinite',
          }}
        >
          {/* Front  */} <div style={{ ...face, transform: `translateZ(${h}px)` }} />
          {/* Back   */} <div style={{ ...face, transform: `rotateY(180deg) translateZ(${h}px)` }} />
          {/* Right  */} <div style={{ ...face, transform: `rotateY(90deg) translateZ(${h}px)` }} />
          {/* Left   */} <div style={{ ...face, transform: `rotateY(-90deg) translateZ(${h}px)` }} />
          {/* Top    */} <div style={{ ...face, transform: `rotateX(90deg) translateZ(${h}px)` }} />
          {/* Bottom */} <div style={{ ...face, transform: `rotateX(-90deg) translateZ(${h}px)` }} />
        </div>
      </div>
    </div>
  );
}
