import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useGetEvent, useScanBarcode } from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, ClipboardList, CheckCircle2, AlertCircle, RefreshCw, ArrowLeftRight } from 'lucide-react';
import { useScanner } from '@/hooks/use-scanner';
import { useAudioFeedback } from '@/hooks/use-audio-feedback';
import { AssignDialog } from '@/components/assign-dialog';
import { cn } from '@/lib/utils';

const LAST_EVENT_KEY = 'proseattendtrack_last_event_id';

type ScanStatus = 'idle' | 'success' | 'duplicate' | 'error';

export function AttendanceScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const [, setLocation] = useLocation();
  const numericEventId = parseInt(eventId || '0', 10);
  
  const { data: event, isLoading: isLoadingEvent, isError } = useGetEvent(numericEventId);
  const scanMutation = useScanBarcode();
  const { playSuccessBeep, playErrorBeep } = useAudioFeedback();

  // Remember this event so the app can resume it after a refresh
  useEffect(() => {
    if (numericEventId) {
      localStorage.setItem(LAST_EVENT_KEY, String(numericEventId));
    }
  }, [numericEventId]);

  const handleChangeEvent = () => {
    sessionStorage.setItem('proseattendtrack_choosing', '1');
    setLocation('/');
  };

  // State
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Ready to scan');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null);

  const handleScan = async (barcodeData: string) => {
    if (isAssignDialogOpen || scanMutation.isPending) return;

    try {
      const res = await scanMutation.mutateAsync({
        data: { barcodeId: barcodeData, eventId: numericEventId }
      });

      if (res.status === 'not_found') {
        playErrorBeep();
        setPendingBarcode(barcodeData);
        setIsAssignDialogOpen(true);
        setScanStatus('error');
        setStatusMessage('New ID detected. Assignment required.');
      } else if (res.status === 'already_checked_in') {
        playErrorBeep();
        setScanStatus('duplicate');
        setStatusMessage(`Already checked in: ${res.staff?.name || 'Staff'}`);
        resetStatusDelay();
      } else {
        // success ('found' or 'recorded')
        playSuccessBeep();
        setScanStatus('success');
        setStatusMessage(`Recorded: ${res.staff?.name || 'Staff'}`);
        resetStatusDelay();
      }
    } catch (err: any) {
      playErrorBeep();
      setScanStatus('error');
      setStatusMessage(err.message || 'Error processing scan');
      resetStatusDelay();
    }
  };

  const resetStatusDelay = () => {
    setTimeout(() => {
      setScanStatus('idle');
      setStatusMessage('Ready to scan');
    }, 2500);
  };

  const { videoRef, error: scannerError, hasCamera, isReady } = useScanner({
    onScan: handleScan,
    paused: isAssignDialogOpen || scanStatus !== 'idle',
    cooldownMs: 2500
  });

  const handleAssignSuccess = (name: string) => {
    playSuccessBeep();
    setScanStatus('success');
    setStatusMessage(`Assigned & Recorded: ${name}`);
    resetStatusDelay();
    setPendingBarcode(null);
  };

  if (isError) {
    return (
      <Layout>
        <Card className="p-8 text-center max-w-md mx-auto mt-12">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-muted-foreground mb-6">The event you are trying to access does not exist.</p>
          <Button onClick={() => setLocation('/')}>Return Home</Button>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        {/* Header Section */}
        <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-xl font-bold text-slate-900 line-clamp-1">
              {isLoadingEvent ? 'Loading...' : event?.name}
            </h1>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
              Scanning Active
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-2 bg-slate-50" onClick={handleChangeEvent}>
              <ArrowLeftRight className="w-4 h-4" />
              <span className="hidden sm:inline">Change Event</span>
            </Button>
            <Link href={`/event/${numericEventId}/log`}>
              <Button variant="outline" size="sm" className="gap-2 bg-slate-50">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">View Log</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Camera Viewfinder Area */}
        <div className="relative flex-1 rounded-3xl overflow-hidden bg-slate-900 shadow-2xl flex items-center justify-center border-4 border-slate-800">
          {!hasCamera ? (
            <div className="text-center text-slate-400 p-6">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Camera access required</p>
              <p className="text-sm mt-2">{scannerError}</p>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
              />
              
              {/* Targeting Overlay */}
              <div className="absolute inset-0 pointer-events-none border-[40px] border-slate-900/60 transition-all duration-300">
                <div className="w-full h-full relative border-2 border-white/30 rounded-lg overflow-hidden">
                  <div className="absolute top-0 w-full h-0.5 bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-scanline" />
                  
                  {/* Corner marks */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                </div>
              </div>

              {!isReady && !scannerError && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center z-10 text-white">
                  <RefreshCw className="w-8 h-8 animate-spin mb-4 text-primary" />
                  <p>Initializing Camera...</p>
                </div>
              )}
            </>
          )}

          {/* Status Banner Overlay */}
          <div className={cn(
            "absolute bottom-6 left-6 right-6 p-4 rounded-2xl shadow-xl transition-all duration-300 transform translate-y-0 flex items-center gap-3 backdrop-blur-md",
            scanStatus === 'idle' ? "bg-slate-900/80 text-white border border-slate-700" :
            scanStatus === 'success' ? "bg-success/90 text-white border-2 border-success-foreground/20 scale-105" :
            scanStatus === 'duplicate' ? "bg-amber-500/90 text-white border-2 border-amber-200/20 scale-105" :
            "bg-destructive/90 text-white border-2 border-destructive-foreground/20 scale-105"
          )}>
            {scanStatus === 'success' ? <CheckCircle2 className="w-8 h-8 shrink-0" /> :
             scanStatus === 'duplicate' ? <AlertCircle className="w-8 h-8 shrink-0" /> :
             scanStatus === 'error' ? <AlertCircle className="w-8 h-8 shrink-0" /> :
             <Camera className="w-6 h-6 shrink-0 opacity-70" />}
            <div className="flex-1">
              <p className="font-semibold text-lg leading-tight">{statusMessage}</p>
              {scanStatus === 'idle' && <p className="text-sm opacity-70">Align barcode within the frame</p>}
            </div>
          </div>
        </div>
      </div>

      <AssignDialog 
        isOpen={isAssignDialogOpen} 
        onClose={() => setIsAssignDialogOpen(false)}
        barcodeId={pendingBarcode || ''}
        eventId={numericEventId}
        onSuccess={handleAssignSuccess}
      />
    </Layout>
  );
}
