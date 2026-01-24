
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Smartphone, Share, Plus, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isStandalone: boolean;
  canInstall: boolean;
}

const EnhancedPWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isStandalone: false,
    canInstall: false,
  });
  const isMobile = useIsMobile();

  useEffect(() => {
    // Detect device and browser info
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;

    const info: DeviceInfo = {
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      isStandalone,
      canInstall: false,
    };

    setDeviceInfo(info);

    // Don't show if already installed
    if (isStandalone) {
      return;
    }

    // Handle beforeinstallprompt event (Chrome/Edge Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      info.canInstall = true;
      setDeviceInfo({ ...info });
      
      // Show prompt after a short delay for better UX
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS and other browsers, show manual installation after user engagement
    if ((isIOS || !isChrome) && isMobile) {
      const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
      const lastPromptTime = localStorage.getItem('pwa-install-prompt-time');
      const now = Date.now();
      const daysSinceLastPrompt = lastPromptTime ? 
        (now - parseInt(lastPromptTime)) / (1000 * 60 * 60 * 24) : 7;

      // Show prompt if not seen before or if it's been more than 7 days
      if (!hasSeenPrompt || daysSinceLastPrompt > 7) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 5000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isMobile]);

  const handleInstallClick = async () => {
    if (deferredPrompt && deviceInfo.canInstall) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
        localStorage.setItem('pwa-install-success', 'true');
      }
      setDeferredPrompt(null);
    } else {
      // Show manual instructions for iOS and other browsers
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setShowInstructions(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
    localStorage.setItem('pwa-install-prompt-time', Date.now().toString());
  };

  const getInstallInstructions = () => {
    if (deviceInfo.isIOS) {
      return {
        title: 'Install NutriWealth on iOS',
        steps: [
          'Tap the Share button',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to confirm',
        ],
        icon: <Share className="h-5 w-5" />,
      };
    } else if (deviceInfo.isAndroid) {
      return {
        title: 'Install NutriWealth on Android',
        steps: [
          'Tap the menu button (⋮) in your browser',
          'Select "Add to Home screen" or "Install app"',
          'Tap "Add" or "Install" to confirm',
        ],
        icon: <Download className="h-5 w-5" />,
      };
    } else {
      return {
        title: 'Install NutriWealth',
        steps: [
          'Look for the install icon in your browser address bar',
          'Click it and follow the prompts',
          'Or check your browser menu for "Install" option',
        ],
        icon: <Download className="h-5 w-5" />,
      };
    }
  };

  if (!showInstallPrompt || deviceInfo.isStandalone) {
    return null;
  }

  const instructions = getInstallInstructions();

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm bg-white shadow-lg border-green-200 animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-green-600" />
            </div>
            <CardTitle className="text-sm">Install NutriWealth</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          Get quick access and offline features
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {!showInstructions ? (
          <Button
            onClick={handleInstallClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            {deviceInfo.canInstall ? (
              <>
                <Download className="h-4 w-4 mr-2" />
                Install App
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                See Instructions
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              {instructions.icon}
              {instructions.title}
            </div>
            <div className="space-y-2">
              {instructions.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 font-medium text-xs">{index + 1}</span>
                  </div>
                  <span className="text-gray-700">{step}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => setShowInstructions(false)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Got it
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedPWAInstallPrompt;
