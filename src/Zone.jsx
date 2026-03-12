import React, { useEffect, useState } from 'react';
import { useGame } from './GameContext';

const Zone = () => {
  const { gameMode, sharedState, localPos, setDead } = useGame();
  const [size, setSize] = useState(150);

  useEffect(() => {
    if (gameMode !== 'battle-royale' || !sharedState) return;

    let interval;
    const updateZone = () => {
      const currentSize = sharedState.get('zoneSize') ?? 150;
      setSize(currentSize);

      // Check if local player is outside zone
      const centerX = 50;
      const centerY = 50;
      const dx = localPos.x - centerX;
      const dy = localPos.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Zone radius is size/2. Using slightly smaller radius for safety.
      if (distance > (currentSize / 2)) {
        setDead(true);
      }
    };

    interval = setInterval(updateZone, 500);

    // Only one person should reduce the zone size (smallest clientID)
    // For simplicity, we'll let each client check if they should update the shared state
    // but really we already have takeover logic in GameContext.
    
    return () => clearInterval(interval);
  }, [gameMode, sharedState, localPos, setDead]);

  if (gameMode !== 'battle-royale') return null;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      width: `${size}vw`,
      height: `${size}vw`, // Proportional to width for circle
      maxWidth: `${size}vh`,
      maxHeight: `${size}vh`,
      border: '2px dashed rgba(255,0,0,0.2)',
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: 5,
      transition: 'width 0.5s linear, height 0.5s linear'
    }}>
      <div style={{
        position: 'absolute',
        top: '-25px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '10px',
        color: 'red',
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        Zone Shrinking
      </div>
    </div>
  );
};

export default Zone;
