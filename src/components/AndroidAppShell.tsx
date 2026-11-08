import React, { useEffect, useState } from 'react';
import {
  BatteryCharging,
  Check,
  Code2,
  Copy,
  Download,
  Smartphone,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline Mode — All 10,000 levels available locally</span>
    </div>
  );
};

export const PWAInstallButton: React.FC<{ onOpenAndroidModal?: () => void }> = ({
  onOpenAndroidModal,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {isInstallable && (
        <button
          type="button"
          onClick={install}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      )}

      {isIOS && (
        <>
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            Install on iOS
          </button>
          {showIOSGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
              <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Install Cerebra on iOS
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  1. Tap the <strong>Share</strong> button in Safari.<br />
                  2. Select <strong>Add to Home Screen</strong> for standalone offline play.
                </p>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="mt-4 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <a
        href="/cerebra-release.apk"
        download="cerebra-release.apk"
        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Download Release APK</span>
      </a>

      {onOpenAndroidModal && (
        <button
          type="button"
          onClick={onOpenAndroidModal}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>APK Guide</span>
        </button>
      )}
    </div>
  );
};

export const AndroidSystemStatusBar: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [timeStr, setTimeStr] = useState('09:45');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateClock();
    const timer = window.setInterval(updateClock, 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="h-7 px-5 flex items-center justify-between text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 bg-stone-100/90 dark:bg-slate-950/90 select-none shrink-0">
      <span>{timeStr}</span>
      <div className="w-3 h-3 rounded-full bg-slate-900 dark:bg-slate-800 border border-slate-700/50" />
      <div className="flex items-center gap-2">
        {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3 text-amber-500" />}
        <span className="text-[10px]">5G</span>
        <BatteryCharging className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};

export const AndroidProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { isInstallable, install } = usePWAInstall();
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const buildCommands = `cd android
./gradlew testDebugUnitTest assembleDebug assembleRelease`;

  const handleCopyCmd = () => {
    navigator.clipboard?.writeText(buildCommands).catch(() => {});
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Android Application & Native Kotlin Build Guide
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Standalone WebAPK PWA + Native Kotlin / Jetpack Compose Architecture
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          {/* Option 1: Direct Signed Release APK */}
          <div className="p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/35 border border-indigo-200 dark:border-indigo-800/70 space-y-3">
            <div className="font-bold text-indigo-950 dark:text-indigo-200 text-sm">
              1. Signed Android Release APK (`cerebra-release.apk`)
            </div>
            <p className="text-xs text-indigo-900/90 dark:text-indigo-200/85 leading-relaxed">
              Ready-to-install <strong>Signed Android Release APK</strong> (v1/v2 RSA-2048 signed) containing all 10 cognitive games and 10,000 offline levels. Download directly below or from GitHub Releases and tap to install on any Android 7.0+ device.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <a
                href="/cerebra-release.apk"
                download="cerebra-release.apk"
                className="min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Signed Release APK (cerebra-release.apk)</span>
              </a>
              <a
                href="https://github.com/bhaktaji/cerebra/releases/download/v1.0.0/cerebra-release.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] px-4 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 hover:border-indigo-500 text-indigo-700 dark:text-indigo-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>GitHub Release Mirror (v1.0.0)</span>
              </a>
            </div>
          </div>

          {/* Option 2: Standalone WebAPK Installation */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2.5">
            <div className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">
              2. Standalone Android WebAPK Installation
            </div>
            <p className="text-xs text-emerald-900/90 dark:text-emerald-200/85 leading-relaxed">
              When deployed or opened in Chrome on Android, tap <strong>Install App / Add to Home Screen</strong>. Android Chrome packages the manifest, maskable adaptive icons, and offline Workbox service worker into a signed standalone application with 100% offline access to all 10,000 levels.
            </p>
            {isInstallable && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={install}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Standalone App Now</span>
                </button>
              </div>
            )}
          </div>

          {/* Option 3: Native Kotlin + Jetpack Compose Project */}
          <div className="p-5 rounded-2xl bg-stone-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              3. Native Android Project (`/android/`) & CI/CD APK Pipeline
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              The repository contains a complete native Android project in <code className="font-mono text-indigo-600 dark:text-indigo-400">/android</code> built with Kotlin 2.0, Jetpack Compose, Material 3, Room, and a Gradle Version Catalog, plus a GitHub Actions workflow (<code className="font-mono">.github/workflows/build-apk.yml</code>) that automatically builds and uploads <code className="font-mono">app-debug.apk</code> on every push.
            </p>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                  Local Gradle Build Commands:
                </span>
                <button
                  type="button"
                  onClick={handleCopyCmd}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium inline-flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {copiedCmd ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedCmd ? 'Copied' : 'Copy Commands'}</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
                {buildCommands}
              </pre>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
