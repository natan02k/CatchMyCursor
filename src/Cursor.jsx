import React from 'react';

const Cursor = ({ x, y, isIt, isLocal, team, isDead, mode, status }) => {
  let color = isIt ? '#FF0000' : '#000000';
  
  if (mode === 'teams') {
    color = team === 'red' ? '#FF4444' : '#4444FF';
  } else if (mode === 'battle-royale') {
    color = '#000000';
  }

  if (isDead) color = '#CCCCCC';

  const statusType = status?.type;
  
  return (
    <div
      className="cursor"
      style={{
        left: 0,
        top: 0,
        transform: `translate3d(${x}vw, ${y}vh, 0)`,
        transition: isLocal ? 'none' : 'transform 0.1s linear',
        zIndex: isLocal ? 100 : 10,
        filter: isIt ? 'drop-shadow(0 0 8px rgba(255, 0, 0, 0.4))' : 'none',
        opacity: isDead ? 0.3 : 1
      }}
    >
      <div style={{ position: 'relative' }}>
        {/* Status Effects */}
        {statusType === 'freeze' && (
          <div style={{
            position: 'absolute',
            inset: -4,
            backgroundColor: 'rgba(0, 204, 255, 0.2)',
            border: '2px solid rgba(0, 204, 255, 0.4)',
            borderRadius: '4px',
            backdropFilter: 'blur(2px)',
            zIndex: 5,
            animation: 'pulse 1s infinite alternate'
          }} />
        )}
        {statusType === 'slow' && (
          <div style={{
            position: 'absolute',
            bottom: -5,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '12px',
            zIndex: 5
          }}>💧</div>
        )}
        {statusType === 'burn' && (
          <div style={{
            position: 'absolute',
            top: -15,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '14px',
            zIndex: 5,
            animation: 'wiggle 0.5s infinite alternate'
          }}>🔥</div>
        )}
        {statusType === 'confuse' && (
          <div style={{
            position: 'absolute',
            top: -10,
            left: 5,
            fontSize: '12px',
            zIndex: 5,
            animation: 'spin 2s linear infinite'
          }}>🌀</div>
        )}

        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ 
            transform: 'rotate(-10deg) translate(-2px, -2px)',
            filter: statusType === 'freeze' ? 'hue-rotate(180deg) brightness(1.2)' : 'none'
          }}
        >
          <path
            d="M4 4L20 12L12 14L10 21L4 4Z"
            fill={color}
            stroke={isLocal ? '#000' : '#FFFFFF'}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {isLocal && (
        <div style={{
          position: 'absolute',
          top: '22px',
          left: '0px',
          fontSize: '9px',
          fontWeight: '900',
          color: color,
          fontFamily: "'Inter', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '2px',
          opacity: 0.6
        }}>
          {isDead ? 'DEAD' : (statusType ? statusType : 'YOU')}
        </div>
      )}
    </div>
  );
};

export default Cursor;
