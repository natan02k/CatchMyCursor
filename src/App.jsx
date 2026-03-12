import React, { useEffect, useCallback, useState } from 'react';
import { useGame } from './GameContext';
import Cursor from './Cursor';
import LoadingScreen from './LoadingScreen';

import Menu from './Menu';
import Zone from './Zone';

import DrawingCanvas from './DrawingCanvas';
import SkillRadialMenu from './SkillRadialMenu';

function App() {
  const { localId, peers, itPlayerId, localPos, gameMode, gameState, updatePosition, tagPlayer, setDead, setStatus, updateDrawing, sharedState } = useGame();
  const [isLoading, setIsLoading] = useState(true);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [localDrawing, setLocalDrawing] = useState([]);
  const [radialMenu, setRadialMenu] = useState({ isOpen: false, x: 0, y: 0 });
  const [selectedSkill, setSelectedSkill] = useState(null);

  const localState = peers[localId];
  const isDead = localState?.isDead;
  const localStatus = localState?.status;
  const activePeerCount = Object.keys(peers).length;
  const threshold = gameMode === 'teams' ? 20 : 50;
  const isWaiting = gameState === 'waiting';

  // Handle context menu
  const handleContextMenu = useCallback((e) => {
    if (gameMode !== 'zen' || isDead) return;
    e.preventDefault();
    setRadialMenu({ isOpen: true, x: e.clientX, y: e.clientY });
  }, [gameMode, isDead]);

  // Handle status timers
  useEffect(() => {
    if (!localStatus?.type || localStatus.type === 'freeze') return;
    const duration = localStatus.type === 'burn' ? 5000 : (localStatus.type === 'slow' ? 7000 : 8000);
    const timer = setTimeout(() => setStatus({ type: null }), duration);
    return () => clearTimeout(timer);
  }, [localStatus?.type, setStatus]);

  // Skill hit listener
  useEffect(() => {
    if (!sharedState) return;
    const handleSkillHit = () => {
      const hit = sharedState.get(`skill-${localId}`);
      if (hit && Date.now() - hit.t < 2000) {
        if (hit.type === 'freeze') setStatus({ type: 'freeze', clicksNeeded: 3 });
        else setStatus({ type: hit.type });
        sharedState.delete(`skill-${localId}`);
      }
    };
    sharedState.observe(handleSkillHit);
    return () => sharedState.unobserve(handleSkillHit);
  }, [sharedState, localId, setStatus]);

  // Handle Drawing Logic
  useEffect(() => {
    if (isDead || isWaiting || localStatus?.type === 'freeze') return;
    const canDraw = gameMode === 'zen' || (gameMode === 'standard' && itPlayerId === localId);
    if (!canDraw) {
      if (localDrawing.length > 0) {
        setLocalDrawing([]);
        updateDrawing([]);
      }
      return;
    }

    if (isMouseDown) {
      const newPoint = { x: localPos.x, y: localPos.y, t: Date.now() };
      const updated = [...localDrawing, newPoint];
      setLocalDrawing(updated);
      updateDrawing(updated);
    }
  }, [localPos, isMouseDown, gameMode, itPlayerId, localId, isDead, isWaiting, localStatus]);

  // Prune drawing points
  useEffect(() => {
    const interval = setInterval(() => {
      if (localDrawing.length === 0) return;
      const now = Date.now();
      const maxAge = gameMode === 'zen' ? 60000 : 1500;
      const filtered = localDrawing.filter(p => now - p.t < maxAge);
      if (filtered.length !== localDrawing.length) {
        setLocalDrawing(filtered);
        updateDrawing(filtered);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [localDrawing, gameMode]);

  const handleMouseMove = useCallback((e) => {
    if (isDead || radialMenu.isOpen || localStatus?.type === 'freeze') return;
    
    let clientX = e.clientX;
    let clientY = e.clientY;

    if (localStatus?.type === 'confuse') {
      clientX = window.innerWidth - e.clientX;
      clientY = window.innerHeight - e.clientY;
    }

    const x = (clientX / window.innerWidth) * 100;
    const y = (clientY / window.innerHeight) * 100;
    updatePosition(x, y);
  }, [updatePosition, isDead, radialMenu.isOpen, localStatus]);

  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) setIsMouseDown(true);
  }, []);
  
  const handleMouseUp = useCallback((e) => {
    if (e.button === 0) setIsMouseDown(false);
  }, []);

  const handleClick = useCallback(() => {
    if (isDead || isWaiting || radialMenu.isOpen) return;

    if (localStatus?.type === 'freeze') {
      const remaining = localStatus.clicksNeeded - 1;
      if (remaining <= 0) setStatus({ type: null });
      else setStatus({ ...localStatus, clicksNeeded: remaining });
      return;
    }

    const canHit = gameMode === 'standard' ? (itPlayerId === localId) : true;
    if (!canHit && !selectedSkill) return;

    const states = Object.values(peers);
    let nearestPlayer = null;
    let minDistance = 30;

    states.forEach((peer) => {
      if (peer.id === localId || peer.isDead) return;
      if (gameMode === 'teams' && peer.team === localState?.team) return;

      const pxX = (peer.x / 100) * window.innerWidth;
      const pxY = (peer.y / 100) * window.innerHeight;
      const localPxX = (localPos.x / 100) * window.innerWidth;
      const localPxY = (localPos.y / 100) * window.innerHeight;

      const distance = Math.sqrt(Math.pow(pxX - localPxX, 2) + Math.pow(pxY - localPxY, 2));
      if (distance < minDistance) {
        minDistance = distance;
        nearestPlayer = peer;
      }
    });

    if (nearestPlayer) {
      if (gameMode === 'standard') tagPlayer(nearestPlayer.id);
      else if (gameMode === 'zen' && selectedSkill) {
        sharedState.set(`skill-${nearestPlayer.id}`, { type: selectedSkill, from: localId, t: Date.now() });
        setSelectedSkill(null);
      } else {
        sharedState.set(`kill-${nearestPlayer.id}`, true);
      }
    }
  }, [itPlayerId, localId, peers, localPos, tagPlayer, gameMode, isDead, isWaiting, localState, sharedState, radialMenu.isOpen, localStatus, setStatus, selectedSkill]);

  // Zone Logic
  useEffect(() => {
    if (gameMode !== 'battle-royale' || !sharedState || isWaiting) return;
    const interval = setInterval(() => {
      const states = Array.from(Object.values(peers));
      const myClientID = localState?.clientID;
      const minClientID = Math.min(...states.map(s => s.clientID));
      if (myClientID === minClientID) {
        let currentSize = sharedState.get('zoneSize') ?? 150;
        if (currentSize > 10) sharedState.set('zoneSize', currentSize - 1.5);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameMode, sharedState, peers, localState, isWaiting]);

  // Kills listener
  useEffect(() => {
    if (!sharedState) return;
    const handleKill = () => { if (sharedState.get(`kill-${localId}`)) setDead(true); };
    sharedState.observe(handleKill);
    return () => sharedState.unobserve(handleKill);
  }, [sharedState, localId, setDead]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('click', handleClick);
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp, handleClick, handleContextMenu]);

  return (
    <>
      {isLoading && <LoadingScreen onFinished={() => setIsLoading(false)} />}
      <div className="game-canvas" style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.4s ease-in' }}>
        <Menu />
        <DrawingCanvas />
        <Zone />
        
        {radialMenu.isOpen && (
          <SkillRadialMenu 
            x={radialMenu.x} 
            y={radialMenu.y} 
            onSelect={(s) => setSelectedSkill(s)} 
            onClose={() => setRadialMenu({ ...radialMenu, isOpen: false })} 
          />
        )}

        {/* Info Overlay */}
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          padding: '8px 12px',
          fontSize: '11px',
          fontWeight: 'bold',
          fontFamily: "'Inter', sans-serif",
          pointerEvents: 'none',
          color: '#888',
          zIndex: 1000,
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Mode: {gameMode} | 
          Players: {activePeerCount}{(gameMode === 'standard' || gameMode === 'zen') ? '' : `/${threshold}`} | 
          Status: {isDead ? 'ELIMINATED' : (isWaiting && gameMode !== 'zen' ? 'WAITING' : (localStatus?.type ? localStatus.type.toUpperCase() : 'ACTIVE'))}
          {selectedSkill && ` | Skill: ${selectedSkill.toUpperCase()}`}
        </div>

        {/* Lobby Overlay */}
        {isWaiting && gameMode !== 'zen' && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 50,
            pointerEvents: 'none'
          }}>
            <h1 style={{ 
              fontFamily: "'Inter', sans-serif", 
              fontSize: '24px', 
              letterSpacing: '10px', 
              fontWeight: '200',
              color: '#333'
            }}>WAITING FOR PLAYERS</h1>
            <div style={{ 
              fontFamily: "'Inter', sans-serif", 
              fontSize: '12px', 
              color: '#888',
              marginTop: '10px' 
            }}>{activePeerCount} / {threshold} joined</div>
          </div>
        )}

        {/* Local Player */}
        <Cursor
          x={localPos.x}
          y={localPos.y}
          isIt={gameMode === 'standard' && itPlayerId === localId}
          isLocal={true}
          team={localState?.team}
          isDead={isDead}
          mode={gameMode}
          status={localStatus}
        />

        {/* Peers */}
        {Object.values(peers).map((peer) => (
          peer.id !== localId && (
            <Cursor
              key={peer.id}
              x={peer.x}
              y={peer.y}
              isIt={gameMode === 'standard' && itPlayerId === peer.id}
              isLocal={false}
              team={peer.team}
              isDead={peer.isDead}
              mode={gameMode}
              status={peer.status}
            />
          )
        ))}

        {isDead && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', sans-serif",
            fontSize: '40px',
            fontWeight: '900',
            color: 'rgba(0,0,0,0.1)',
            pointerEvents: 'none',
            letterSpacing: '20px',
            textTransform: 'uppercase',
            zIndex: 100
          }}>
            Game Over
          </div>
        )}
      </div>
    </>
  );
}

export default App;
