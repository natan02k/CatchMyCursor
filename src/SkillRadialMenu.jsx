import React, { useState, useEffect } from 'react';

const SkillRadialMenu = ({ x, y, onSelect, onClose }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const skills = [
    { id: 'freeze', name: 'FREEZE', color: '#00ccff', icon: '❄️' },
    { id: 'slow', name: 'SLOW', color: '#99ff33', icon: '💧' },
    { id: 'burn', name: 'BURN', color: '#ff6600', icon: '🔥' },
    { id: 'confuse', name: 'CONFUSE', color: '#cc33ff', icon: '🌀' }
  ];

  useEffect(() => {
    const handleMouseUp = () => {
      if (hoveredIdx !== null) {
        onSelect(skills[hoveredIdx].id);
      }
      onClose();
    };

    const handleMouseMove = (e) => {
      const dx = e.clientX - x;
      const dy = e.clientY - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 20) {
        setHoveredIdx(null);
        return;
      }

      // Calculate angle
      let angle = Math.atan2(dy, dx); // -PI to PI
      if (angle < 0) angle += 2 * Math.PI;

      // Map angle to skill index (0-3)
      // 4 skills, each 90 degrees. Offset to align centers.
      const sector = Math.floor(((angle + Math.PI / 4) % (2 * Math.PI)) / (Math.PI / 2));
      setHoveredIdx(sector);
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [x, y, hoveredIdx, onSelect, onClose]);

  return (
    <div style={{
      position: 'fixed',
      left: x,
      top: y,
      transform: 'translate(-50%, -50%)',
      width: '180px',
      height: '180px',
      zIndex: 10000,
      pointerEvents: 'none'
    }}>
      {/* Background Circle */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.95)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0,0,0,0.05)'
      }} />

      {skills.map((skill, i) => {
        const isHovered = hoveredIdx === i;
        const angle = (i * 90) * (Math.PI / 180);
        const radius = 55;
        const sx = Math.cos(angle) * radius;
        const sy = Math.sin(angle) * radius;

        return (
          <div
            key={skill.id}
            style={{
              position: 'absolute',
              left: `calc(50% + ${sx}px)`,
              top: `calc(50% + ${sy}px)`,
              transform: `translate(-50%, -50%) scale(${isHovered ? 1.2 : 1})`,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: isHovered ? 1 : 0.4
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{skill.icon}</div>
            <div style={{ 
              fontSize: '8px', 
              fontFamily: "'Inter', sans-serif", 
              fontWeight: '900', 
              letterSpacing: '2px',
              color: skill.color
            }}>{skill.name}</div>
          </div>
        );
      })}

      {/* Center dot */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '4px',
        height: '4px',
        backgroundColor: '#000',
        borderRadius: '50%',
        opacity: 0.2
      }} />
    </div>
  );
};

export default SkillRadialMenu;
