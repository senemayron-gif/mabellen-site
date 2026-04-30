'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function ClientInit() {
  useEffect(() => {
    // Inicialização simplificada para evitar erros de TypeScript
    OneSignal.init({
      appId: "a3fa67c1-8318-4252-9fea-319342e41628",
      allowLocalhostAsSecureOrigin: true,
    });
  }, []);

  return null;
}