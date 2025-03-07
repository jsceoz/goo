'use client';

import { useEffect, useState } from 'react';

export function PWADebug() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    // 检查是否以独立应用方式运行
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    // 检查Service Worker状态
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        setRegistration(reg || null);
        // 检查是否支持安装
        const checkInstallable = async () => {
          try {
            const manifestResponse = await fetch('/manifest.json', {
              credentials: 'include',
              headers: {
                'Accept': 'application/manifest+json'
              }
            });
            const hasManifest = manifestResponse.ok;
            if (!hasManifest) {
              console.error('Manifest response:', await manifestResponse.text());
            }
            setInstallable(hasManifest && !!reg);
          } catch (error) {
            console.error('Manifest check failed:', error);
          }
        };
        checkInstallable();
      });
    }
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg text-sm">
      <h3 className="font-bold mb-2">PWA Debug Info</h3>
      <div>
        <p>Standalone Mode: {isStandalone ? 'Yes' : 'No'}</p>
        <p>Service Worker: {registration ? 'Registered' : 'Not Registered'}</p>
        <p>Installable: {installable ? 'Yes' : 'No'}</p>
        <p>SW Scope: {registration?.scope || 'N/A'}</p>
        {registration && (
          <button
            onClick={() => registration.update()}
            className="mt-2 px-2 py-1 bg-blue-500 text-white rounded"
          >
            Update SW
          </button>
        )}
      </div>
    </div>
  );
} 