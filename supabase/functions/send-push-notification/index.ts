import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função auxiliar para gerar o token JWT do Firebase Admin usando Web Crypto API nativa do Deno
async function getFirebaseAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const encoder = new TextEncoder();
  
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  const base64UrlEncode = (data: Uint8Array | string) => {
    let str = typeof data === "string" ? data : String.fromCharCode(...data);
    return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  };

  const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;

  // Limpa a chave privada PEM
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  let pemContents = privateKey.replace(/\\n/g, "\n");
  if (pemContents.includes(pemHeader)) {
    pemContents = pemContents.substring(pemContents.indexOf(pemHeader) + pemHeader.length);
  }
  if (pemContents.includes(pemFooter)) {
    pemContents = pemContents.substring(0, pemContents.indexOf(pemFooter));
  }
  const binaryDerString = atob(pemContents.replace(/\s/g, ""));
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(unsignedToken)
  );

  const jwt = `${unsignedToken}.${base64UrlEncode(new Uint8Array(signature))}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const data = await response.json();
  if (!data.access_token) {
    throw new Error(`Falha ao obter access_token do Firebase: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title, body } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: tokensData, error: tokenError } = await supabaseClient
      .from("fcm_tokens")
      .select("token");

    if (tokenError || !tokensData || tokensData.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum token encontrado." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const projectId = Deno.env.get("FIREBASE_PROJECT_ID");
    const clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL");
    const privateKey = Deno.env.get("FIREBASE_PRIVATE_KEY");

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("As variáveis de ambiente do Firebase não estão configuradas na Edge Function.");
    }

    const accessToken = await getFirebaseAccessToken(clientEmail, privateKey);
    const results = [];

    for (const item of tokensData) {
      const fcmToken = item.token;
      const messagePayload = {
        message: {
          token: fcmToken,
          notification: {
            title: title || "Nova Notificação",
            body: body || "Você tem uma nova atualização!",
          },
        },
      };

      const fcmRes = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messagePayload),
        }
      );

      const fcmJson = await fcmRes.json();
      results.push({ token: fcmToken, ok: fcmRes.ok, response: fcmJson });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});