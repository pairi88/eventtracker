import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

interface UseScannerProps {
  onScan: (result: string) => void;
  cooldownMs?: number;
  paused?: boolean;
}

export function useScanner({ onScan, cooldownMs = 2000, paused = false }: UseScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastScanTime = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const reader = new BrowserMultiFormatReader();

    const startScanning = async () => {
      if (!videoRef.current || paused) return;
      
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (devices.length === 0) {
          if (mounted) {
            setHasCamera(false);
            setError('No camera found on this device.');
          }
          return;
        }

        // Prefer back camera if available
        let deviceId = devices[0].deviceId;
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
        if (backCamera) {
          deviceId = backCamera.deviceId;
        }

        controlsRef.current = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, err) => {
            if (!mounted || paused) return;
            
            if (result) {
              const now = Date.now();
              if (now - lastScanTime.current > cooldownMs) {
                lastScanTime.current = now;
                onScan(result.getText());
              }
            }
          }
        );
        
        if (mounted) setIsReady(true);
        
      } catch (err: any) {
        if (mounted) {
          console.error('Scanner init error:', err);
          setError(err.message || 'Failed to start camera. Please check permissions.');
        }
      }
    };

    if (!paused) {
      startScanning();
    }

    return () => {
      mounted = false;
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, [onScan, cooldownMs, paused]);

  return { videoRef, error, hasCamera, isReady };
}
