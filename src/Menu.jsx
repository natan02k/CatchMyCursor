import React, { useState } from 'react';
import { useGame } from './GameContext';

const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { gameMode, setGameMode } = useGame();

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.cursor = 'default';
    } else {
      document.body.style.cursor = 'none';
    }
    return () => {
      document.body.style.cursor = 'none';
    };
  }, [isOpen]);

  const modes = [
    { id: 'standard', name: 'STANDARD', desc: 'TAG' },
    { id: 'teams', name: 'TEAMS', desc: '10 VS 10' },
    { id: 'battle-royale', name: 'ROYALE', desc: 'SURVIVAL' },
    { id: 'zen', name: 'ZEN', desc: 'CREATIVE' }
  ];

  return (
    <>
      {/* Menu Trigger Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '25px',
          padding: '8px 12px',
          backgroundColor: isOpen ? '#000' : 'transparent',
          color: isOpen ? '#fff' : '#888',
          fontSize: '10px',
          fontFamily: "'Inter', sans-serif",
          fontWeight: '900',
          letterSpacing: '3px',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 3000,
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          border: isOpen ? 'none' : '1px solid rgba(0,0,0,0.05)'
        }}
      >
        MENU
      </div>

      {/* Slide-down Top Bar Menu */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100px',
        backgroundColor: '#fff',
        boxShadow: '0 10px 40px rgba(0,0,0,0.02)',
        zIndex: 2500,
        transform: isOpen ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '80px',
        padding: '0 40px',
        boxSizing: 'border-box',
        borderBottom: '1px solid #f9f9f9'
      }}>
        {modes.map((m) => (
          <div 
            key={m.id}
            onClick={() => {
              setGameMode(m.id);
              setIsOpen(false);
            }}
            style={{
              textAlign: 'center',
              cursor: 'pointer',
              opacity: gameMode === m.id ? 1 : 0.2,
              transition: 'opacity 0.2s ease, transform 0.2s ease',
              position: 'relative',
              transform: gameMode === m.id ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            <div style={{ 
              fontFamily: "'Inter', sans-serif", 
              fontSize: '14px', 
              fontWeight: '900', 
              letterSpacing: '5px'
            }}>{m.name}</div>
            <div style={{ 
              fontFamily: "'Inter', sans-serif", 
              fontSize: '8px', 
              color: '#888',
              letterSpacing: '2px',
              marginTop: '6px'
            }}>{m.desc}</div>
            {gameMode === m.id && (
              <div style={{
                position: 'absolute',
                bottom: '-25px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '3px',
                height: '3px',
                backgroundColor: '#000',
                borderRadius: '50%'
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Minimalist Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 2400,
            backgroundColor: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(3px)',
            transition: 'all 0.4s ease'
          }}
        />
      )}
    </>
  );
};

export default Menu;
