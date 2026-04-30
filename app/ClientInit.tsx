'use client'; // Aqui pode usar sem medo

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function ClientInit() {
  useEffect(() => {
    OneSignal.init({
      appId: "a3fa67c1-8318-4252-9fea-319342e41628",
      notifyButton: { enable: true },
      allowLocalhostAsSecureOrigin: true,
    });
  }, []);

  return null; 
}