
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GhostWindow } from './components/GhostWindow';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SecurityLog } from './components/SecurityLog';
import { AppState, Fingerprint, SecurityEvent, GhostAction } from './types';
import { generateGhostIdentity, calculateHumanDelay, clearIdentityCache } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isActive: false,
    isBurned: false,
    currentUrl: 'https://en.wikipedia.org/wiki/Privacy',
    identity: null,
    history: [],
    securityLog: [],
    stealthConfig: {
      canvasPoisoning: true,
      inputJitter: true,
      networkObfuscation: true,
      autoRotate: false,
      webrtcMasking: true,
      audioPoisoning: true,
      fontMasking: true,
      autoMirror: true
    },
    riskScore: 5
  });

  const [isInitializing, setIsInitializing] = useState(false);
  const [hasSelectedKey, setHasSelectedKey] = useState(true);

  // Initialize key selection state based on Gemini API requirements for paid projects
  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        const has = await aistudio.hasSelectedApiKey();
        setHasSelectedKey(has);
      }
    };
    checkKey();
  }, []);

  // Open the key selection dialog provided by the platform
  const handleOpenSelectKey = useCallback(async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      await aistudio.openSelectKey();
      // Assume success immediately to avoid race conditions with background checks
      setHasSelectedKey(true);
    }
  }, []);

  useEffect(() => {
    if (!state.isActive) return;
    
    const riskInterval = setInterval(() => {
      setState(prev => {
        let baseRisk = 10;
        const config = prev.stealthConfig;
        if (!config.canvasPoisoning) baseRisk += 20;
        if (!config.webrtcMasking) baseRisk += 30;
        if (!config.fontMasking) baseRisk += 15;
        if (!config.audioPoisoning) baseRisk += 10;
        const fluctuation = Math.floor(Math.random() * 8) - 4;
        return { ...prev, riskScore: Math.max(1, Math.min(99, Math.floor(baseRisk + fluctuation))) };
      });

      if (Math.random() > 0.8) {
        const probes = ['Canvas Fingerprinting', 'WebRTC IP Leak', 'AudioContext Sampling', 'Font Enumeration'];
        const target = probes[Math.floor(Math.random() * probes.length)];
        setState(prev => ({
          ...prev,
          securityLog: [{
            id: Math.random().toString(36).substring(2, 11),
            type: 'PROBE_INTERCEPTED' as const,
            source: `Shielded access to: ${target}`,
            severity: 'medium' as const,
            timestamp: new Date().toLocaleTimeString()
          } as SecurityEvent, ...prev.securityLog].slice(0, 50)
        }));
      }
    }, 4000);
    return () => clearInterval(riskInterval);
  }, [state.isActive]);

  const initSession = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsInitializing(true);
    try {
      const { identity } = await generateGhostIdentity();
      setState(prev => ({
        ...prev,
        isActive: true,
        identity: identity,
        securityLog: [{
          id: Math.random().toString(36).substring(2, 11),
          type: 'STEALTH_ENGAGED' as const,
          source: `Identity rotation complete. Active node: ${identity.gpu.split(' ')[0]}`,
          timestamp: new Date().toLocaleTimeString(),
          severity: 'low' as const
        } as SecurityEvent, ...prev.securityLog]
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const handleAction = useCallback(async (action: Omit<GhostAction, 'timestamp' | 'delayApplied'>) => {
    let delay = calculateHumanDelay();
    if (state.stealthConfig.inputJitter) delay += Math.floor(Math.random() * 100);
    await new Promise(resolve => setTimeout(resolve, delay));
    const fullAction: GhostAction = { ...action, timestamp: Date.now(), delayApplied: delay };
    setState(prev => ({ ...prev, history: [fullAction, ...prev.history].slice(0, 50) }));
  }, [state.stealthConfig.inputJitter]);

  const handleBurn = useCallback(() => {
    clearIdentityCache();
    setState(prev => ({
      ...prev,
      isActive: false,
      isBurned: true,
      identity: null,
      history: [],
      riskScore: 0,
      securityLog: [{
        id: 'burn-' + Date.now(),
        type: 'LEAK_PREVENTED' as const,
        source: 'Full System Burn: Identity purged.',
        timestamp: new Date().toLocaleTimeString(),
        severity: 'critical' as const
      } as SecurityEvent]
    }));
    setTimeout(() => setState(prev => ({ ...prev, isBurned: false })), 2000);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-zinc-300 mono relative">
      <div className="scanline"></div>
      <Sidebar 
        state={state} 
        onInit={() => initSession(false)} 
        onBurn={handleBurn}
        isInitializing={isInitializing}
        onConfigChange={(config) => setState(prev => ({ ...prev, stealthConfig: config }))}
        hasSelectedKey={hasSelectedKey}
        onOpenSelectKey={handleOpenSelectKey}
      />
      <main className="flex-1 flex flex-col min-w-0 border-l border-zinc-900 relative z-10">
        <Header state={state} onUrlChange={(url) => setState(prev => ({ ...prev, currentUrl: url }))} />
        <div className="flex-1 flex flex-col xl:flex-row min-h-0">
          <div className="flex-[2] relative overflow-hidden bg-black p-4 border-r border-zinc-900 crt">
            {state.isBurned ? (
              <div className="absolute inset-0 z-50 bg-red-950/90 flex items-center justify-center backdrop-blur-3xl animate-in fade-in">
                <h1 className="text-4xl font-black text-white italic tracking-widest uppercase">Identity_Purged</h1>
              </div>
            ) : (
              <GhostWindow 
                state={state} 
                onAction={handleAction} 
                onSecurityThreat={(threat, type: SecurityEvent['type'] = 'FINGERPRINT_ATTEMPT') => setState(prev => ({
                  ...prev,
                  securityLog: [{
                    id: Math.random().toString(36).substring(2, 11),
                    type,
                    source: threat,
                    severity: (type === 'HEADER_STRIPPED' ? 'low' : 'high') as SecurityEvent['severity'],
                    timestamp: new Date().toLocaleTimeString()
                  } as SecurityEvent, ...prev.securityLog].slice(0, 50)
                }))}
              />
            )}
          </div>
          <div className="flex-1 bg-zinc-950/50 flex flex-col min-w-[360px]">
            <SecurityLog logs={state.securityLog} actions={state.history} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
