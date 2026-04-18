/**
 * Firebase helper for Cloudflare Workers / Pages Functions.
 * Uses the Firebase REST API with a service-account JWT — no firebase-admin SDK needed.
 */

const DB = 'https://hailoffire-campaign-default-rtdb.firebaseio.com';

function b64url(obj) {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Exchange a service account JSON string for a short-lived Google OAuth2 access token.
 * @param {string} serviceAccountJson - value of FIREBASE_SERVICE_ACCOUNT env secret
 */
export async function getFirebaseToken(serviceAccountJson) {
  const sa = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);

  const header = b64url({ alg: 'RS256', typ: 'JWT' });
  const claim  = b64url({
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/cloud-platform',
  });

  const signingInput = `${header}.${claim}`;

  // Import RSA private key
  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const keyBuffer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', keyBuffer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  );

  const sigBytes = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey,
    new TextEncoder().encode(signingInput),
  );
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const jwt = `${signingInput}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Firebase token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function fbGet(token, path) {
  const res = await fetch(`${DB}/${path}.json`, { headers: authHeaders(token) });
  return res.json();
}

export async function fbSet(token, path, data) {
  await fetch(`${DB}/${path}.json`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

/** Returns { name: '-NxyzPushId' } */
export async function fbPush(token, path, data) {
  const res = await fetch(`${DB}/${path}.json`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fbPatch(token, path, data) {
  await fetch(`${DB}/${path}.json`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function fbDelete(token, path) {
  await fetch(`${DB}/${path}.json`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}
