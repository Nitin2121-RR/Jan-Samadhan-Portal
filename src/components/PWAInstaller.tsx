import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <Card className="fixed bottom-28 sm:bottom-32 md:bottom-24 left-4 right-4 mx-auto max-w-md p-4 bg-card border-border shadow-lg z-40" style={{ marginBottom: 'env(safe-area-inset-bottom, 0)' }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
          🏛️
        </div>
        <div className="flex-1">
          <h3 className="text-foreground mb-1">Install Jan-Samadhan Portal</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Install the app for quick access and offline support
          </p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleInstallClick}
              variant="saffron"
            >
              <Download className="w-4 h-4 mr-1" />
              Install
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleDismiss}
            >
              Not Now
            </Button>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          className="shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
