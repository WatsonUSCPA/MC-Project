import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './InstallPrompt.css';

// Chrome / Edge / Android の beforeinstallprompt イベント
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'mc-pwa-install-dismissed-at';
const DISMISS_DAYS = 14;

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
  (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

const recentlyDismissed = () => {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

// ホーム画面への追加を案内するバナー
// 購入ボタンなどに重ならないよう、トップページでだけ表示する
const InstallPrompt: React.FC = () => {
  const { pathname } = useLocation();
  const isTopPage = pathname === '/';
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const handleInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  // iOS Safari は beforeinstallprompt が無いため、トップページを開いて少ししたら共有メニューからの追加方法を案内する
  useEffect(() => {
    if (!isTopPage || showIosGuide || !isIos() || isStandalone() || recentlyDismissed()) return;
    const timer = setTimeout(() => {
      setShowIosGuide(true);
      setVisible(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isTopPage, showIosGuide]);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage が使えない環境では記録しない
    }
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') {
      setVisible(false);
    } else {
      dismiss();
    }
  };

  if (!visible || !isTopPage) return null;

  return (
    <div className="pwa-install" role="dialog" aria-label="ホーム画面に追加">
      <img className="pwa-install__icon" src={`${process.env.PUBLIC_URL}/logo192.png`} alt="" />
      <div className="pwa-install__body">
        <p className="pwa-install__title">MC Square をアプリとして使う</p>
        {showIosGuide && !deferredPrompt ? (
          <p className="pwa-install__text">
            Safari の共有ボタン（□に↑のアイコン）から「ホーム画面に追加」を選んでください。
          </p>
        ) : (
          <p className="pwa-install__text">ホーム画面に追加して、すぐにアクセスできます。</p>
        )}
      </div>
      <div className="pwa-install__actions">
        {deferredPrompt && (
          <button type="button" className="pwa-install__button" onClick={install}>
            追加
          </button>
        )}
        <button type="button" className="pwa-install__close" onClick={dismiss} aria-label="閉じる">
          ×
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
