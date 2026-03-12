import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { v4 as uuidv4 } from 'uuid';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [peers, setPeers] = useState({});
  const [itPlayerId, setItPlayerId] = useState(null);
  const [localPos, setLocalPos] = useState({ x: 50, y: 50 });
  const [gameMode, setGameMode] = useState('standard'); // 'standard', 'teams', 'battle-royale'
  const [gameState, setGameState] = useState('playing'); // 'waiting', 'playing', 'finished'
  const localId = useMemo(() => uuidv4(), []);
  
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const sharedStateRef = useRef(null);

  useEffect(() => {
    // Isolated rooms per mode
    const roomName = `global-cursor-tag-v2-${gameMode}`;
    const ydoc = new Y.Doc();
    const provider = new WebrtcProvider(roomName, ydoc);
    const sharedState = ydoc.getMap('state');
    
    ydocRef.current = ydoc;
    providerRef.current = provider;
    sharedStateRef.current = sharedState;

    const awareness = provider.awareness;

    const handleAwarenessChange = () => {
      const states = awareness.getStates();
      const newPeers = {};
      const now = Date.now();
      
      states.forEach((state, clientID) => {
        // Filter out peers that haven't seen for > 15s (ghosts)
        if (state.id && (!state.lastUpdate || now - state.lastUpdate < 15000)) {
          newPeers[state.id] = { ...state, clientID };
        }
      });
      setPeers(newPeers);
    };

    awareness.on('change', handleAwarenessChange);

    // Initial state with mode-specific fields
    const initialTeam = Math.random() > 0.5 ? 'red' : 'blue';
    awareness.setLocalState({
      id: localId,
      x: 50,
      y: 50,
      team: initialTeam,
      isDead: false,
      drawing: [], // Array of {x, y} points
      status: { type: null, until: 0, clicksNeeded: 0 }, // Status effects
      lastUpdate: Date.now(),
      lastActivity: Date.now()
    });

    // Immediate update for local visibility
    handleAwarenessChange();

    const handleSharedStateChange = () => {
      setItPlayerId(sharedState.get('itPlayerId'));
      setGameState(sharedState.get('gameState') || (gameMode === 'standard' || gameMode === 'zen' ? 'playing' : 'waiting'));
    };

    sharedState.observe(handleSharedStateChange);
    setItPlayerId(sharedState.get('itPlayerId'));
    setGameState(sharedState.get('gameState') || (gameMode === 'standard' || gameMode === 'zen' ? 'playing' : 'waiting'));

    const checkGameStatus = () => {
      const states = Array.from(awareness.getStates().values());
      const now = Date.now();
      const activePeers = states.filter(s => s.id && (now - s.lastUpdate < 15000));
      const activePeerCount = activePeers.length;

      const clientIDs = Array.from(awareness.getStates().keys());
      const minClientID = Math.min(...clientIDs);
      
      if (ydoc.clientID === minClientID) {
        // Lobby Start Logic
        const currentGameState = sharedState.get('gameState') || (gameMode === 'standard' ? 'playing' : 'waiting');
        
        if (currentGameState === 'waiting') {
          const threshold = gameMode === 'teams' ? 20 : 50;
          if (activePeerCount >= threshold) {
            sharedState.set('gameState', 'playing');
            if (gameMode === 'battle-royale') {
              sharedState.set('zoneSize', 150);
            }
          }
        }

        // Standard Tag Logic
        if (gameMode === 'standard') {
          const currentItId = sharedState.get('itPlayerId');
          const currentTaggerState = states.find(s => s.id === currentItId);
          const isTaggerInactive = currentTaggerState && (now - currentTaggerState.lastActivity > 15000);
          const activeIds = activePeers.map(p => p.id);

          if (!currentItId || !activeIds.includes(currentItId) || isTaggerInactive) {
            if (activeIds.length > 0) {
              const movingIds = activePeers.filter(s => now - s.lastActivity < 15000).map(s => s.id);
              const candidates = movingIds.length > 0 ? movingIds : activeIds;
              const targetId = candidates.length > 1 ? candidates.find(id => id !== currentItId) : candidates[0];
              if (targetId && targetId !== currentItId) sharedState.set('itPlayerId', targetId);
              else if (!currentItId && targetId) sharedState.set('itPlayerId', targetId);
            }
          }
        }
      }
    };

    const heartbeat = setInterval(() => {
      provider.awareness.setLocalStateField('lastUpdate', Date.now());
    }, 5000);

    const interval = setInterval(checkGameStatus, 1000);

    return () => {
      awareness.off('change', handleAwarenessChange);
      sharedState.unobserve(handleSharedStateChange);
      clearInterval(interval);
      clearInterval(heartbeat); // Clear heartbeat interval
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
      sharedStateRef.current = null;
    };
  }, [localId, gameMode]);

  const updatePosition = (x, y) => {
    setLocalPos({ x, y });
    if (providerRef.current) {
      const currentState = providerRef.current.awareness.getLocalState();
      if (!currentState?.isDead) {
        providerRef.current.awareness.setLocalState({
          ...currentState,
          x,
          y,
          lastActivity: Date.now()
        });
      }
    }
  };

  const setDead = (dead) => {
    if (providerRef.current) {
      providerRef.current.awareness.setLocalStateField('isDead', dead);
    }
  };

  const updateDrawing = (points) => {
    if (providerRef.current) {
      providerRef.current.awareness.setLocalStateField('drawing', points);
    }
  };

  const setStatus = (status) => {
    if (providerRef.current) {
      providerRef.current.awareness.setLocalStateField('status', status);
    }
  };

  const tagPlayer = (playerId) => {
    if (gameMode === 'standard' && itPlayerId === localId && sharedStateRef.current) {
      sharedStateRef.current.set('itPlayerId', playerId);
    }
  };

  const value = {
    localId,
    peers,
    itPlayerId,
    localPos,
    gameMode,
    setGameMode,
    gameState,
    updatePosition,
    tagPlayer,
    setDead,
    updateDrawing,
    setStatus,
    sharedState: sharedStateRef.current
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
