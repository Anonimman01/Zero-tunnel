
export interface Fingerprint {
  gpu: string;
  resolution: string;
  battery: number;
  canvasHash: string;
  platform: string;
  userAgent: string;
  ram: number;
}

export interface GhostAction {
  type: 'click' | 'hover' | 'type' | 'scroll';
  coordinates?: { x: number; y: number };
  target?: string;
  timestamp: number;
  delayApplied: number;
}

export interface SecurityEvent {
  id: string;
  type: 'FINGERPRINT_ATTEMPT' | 'TRACKER_DETECTED' | 'LEAK_PREVENTED' | 'STEALTH_ENGAGED' | 'PROBE_INTERCEPTED' | 'HEADER_STRIPPED';
  source: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AppState {
  isActive: boolean;
  isBurned: boolean;
  currentUrl: string;
  identity: Fingerprint | null;
  history: GhostAction[];
  securityLog: SecurityEvent[];
  stealthConfig: {
    canvasPoisoning: boolean;
    inputJitter: boolean;
    networkObfuscation: boolean;
    autoRotate: boolean;
    webrtcMasking: boolean;
    audioPoisoning: boolean;
    fontMasking: boolean;
    autoMirror: boolean;
  };
  riskScore: number;
}
