import React, { useRef, useEffect } from 'react';
import { useGame } from './GameContext';

const DrawingCanvas = () => {
  const { peers, gameMode, itPlayerId } = useGame();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrame;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now();

      Object.values(peers).forEach((peer) => {
        // In Standard mode, only the tagger draws
        if (gameMode === 'standard' && peer.id !== itPlayerId) return;
        // In Teams/Royale, maybe no drawing for now to keep it clean, 
        // OR let everyone draw. User asked for Standard "laser" and Zen mode.
        if (gameMode !== 'standard' && gameMode !== 'zen') return;

        const points = peer.drawing || [];
        if (points.length < 2) return;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = gameMode === 'zen' ? '#000' : '#FF0000';
        ctx.lineWidth = gameMode === 'zen' ? 1.5 : 3;

        for (let i = 1; i < points.length; i++) {
          const p1 = points[i - 1];
          const p2 = points[i];
          const age = now - p2.t;
          const maxAge = gameMode === 'zen' ? 60000 : 1500;
          
          if (age > maxAge) continue;
          // Skip drawing segment if gap between points is too large (new stroke)
          if (p2.t - p1.t > 200) continue;

          const alpha = 1 - (age / maxAge);
          ctx.beginPath();
          ctx.globalAlpha = alpha;
          
          const startX = (p1.x / 100) * canvas.width;
          const startY = (p1.y / 100) * canvas.height;
          const endX = (p2.x / 100) * canvas.width;
          const endY = (p2.y / 100) * canvas.height;

          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        
        ctx.globalAlpha = 1.0;
      });

      animationFrame = requestAnimationFrame(render);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    render();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, [peers, gameMode, itPlayerId]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 4
      }}
    />
  );
};

export default DrawingCanvas;
