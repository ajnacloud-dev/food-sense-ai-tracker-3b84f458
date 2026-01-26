
import { useState, useEffect } from 'react';

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  installPrompt: any;
  canShowPrompt: boolean;
}

export const usePWAInstall = () => {
  const [state, setState] = useState<PWAInstallState>({
    isInstallable: false,
    isInstalled: false,
    isIOS: false,
    isAndroid: false,
    installPrompt: null,
    canShowPrompt: false,
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;

    // Update initial state
    setState(prev => ({
      ...prev,
      isIOS,
      isAndroid,
      isInstalled,
    }));

    // Don't proceed if already installed
    if (isInstalled) {
      return;
    }

    let installPrompt: any = null;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      installPrompt = e;
      
      setState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: e,
        canShowPrompt: true,
      }));
    };

    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        canShowPrompt: false,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS, check if we should show manual instructions
    if (isIOS) {
      const hasSeenPrompt = localStorage.getItem('ios-install-prompt-seen');
      if (!hasSeenPrompt) {
        setState(prev => ({
          ...prev,
          canShowPrompt: true,
        }));
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    if (state.installPrompt) {
      state.installPrompt.prompt();
      const { outcome } = await state.installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setState(prev => ({
          ...prev,
          isInstallable: false,
          canShowPrompt: false,
        }));
      }
      
      return outcome;
    }
    return null;
  };

  const dismissPrompt = () => {
    setState(prev => ({
      ...prev,
      canShowPrompt: false,
    }));
    
    if (state.isIOS) {
      localStorage.setItem('ios-install-prompt-seen', 'true');
    }
  };

  return {
    ...state,
    installPWA,
    dismissPrompt,
  };
};
