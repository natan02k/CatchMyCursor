import React, { useEffect, useState } from 'react';

const LoadingScreen = ({ onFinished }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(onFinished, 400); // Faster fade out
    }, 1000);

    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      opacity: fade ? 0 : 1,
      transition: 'opacity 0.5s ease-in-out',
      pointerEvents: 'none'
    }}>
      <div style={{
        fontSize: '42px',
        fontWeight: '200',
        letterSpacing: '8px',
        color: '#000000',
        marginBottom: '20px',
        fontFamily: "'Inter', sans-serif",
        textTransform: 'uppercase'
      }}>
        Catch My Cursor
      </div>
      <div style={{
        width: '40px',
        height: '2px',
        backgroundColor: '#FF0000',
        animation: 'expand 1.5s ease-in-out infinite'
      }} />
      <style>{`
        @keyframes expand {
          0% { width: 0; opacity: 0; }
          50% { width: 60px; opacity: 1; }
          100% { width: 0; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
