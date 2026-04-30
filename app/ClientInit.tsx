'use client'; // Continua sendo de cliente

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function ClientInit() {
  useEffect(() => {
    // Nova forma corrigida de inicializar o OneSignal
    OneSignal.init({
      appId: "a3fa67c1-8318-4252-9fea-319342e41628",
      allowLocalhostAsSecureOrigin: true,
    }).then(() => {
        // Depois que inicializou, mostramos o botão de notificação (o sino)
        OneSignal.Slidedown.promptTrigger({
            type: "category",
            text: {
                actionMessage: "Gostaria de receber novidades e ofertas da Mabellen?",
                acceptButton: "Sim!",
                cancelButton: "Não, obrigado."
            }
        });
    });
  }, []);

  return null; 
}