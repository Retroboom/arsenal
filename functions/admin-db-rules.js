/**
 * Admin database-rules inspector/editor — Cloudflare Pages Function (admin tooling).
 *
 * GET  https://arsenal.retroboomgames.com/admin-db-rules?token=<ADMIN_SEED_TOKEN>
 *   Returns the current Realtime Database security rules as JSON.
 *
 * POST https://arsenal.retroboomgames.com/admin-db-rules?token=<ADMIN_SEED_TOKEN>
 *   body: { "rules": { ...full rules tree... } }
 *   Replaces the database's security rules wholesale. There is no partial
 *   merge — always GET first, edit the full tree, then POST it back.
 *
 * Uses the same FIREBASE_SERVICE_ACCOUNT / ADMIN_SEED_TOKEN secrets as
 * admin-content.js. This exists purely as a one-off tool to inspect and fix
 * the content/forces read-access gap; not meant to be a routine editing path.
 */

import { getFirebaseToken } from './_firebase.js';

const DB = 'https://hailoffire-campaign-default-rtdb.firebaseio.com';

export async function onRequest(context) {
  const { request, env } = context;
  const url   = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!env.ADMIN_SEED_TOKEN || token !== env.ADMIN_SEED_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

  const fbToken = await getFirebaseToken(env.FIREBASE_SERVICE_ACCOUNT);

  if (request.method === 'GET') {
    const res = await fetch(`${DB}/.settings/rules.json`, {
      headers: { Authorization: `Bearer ${fbToken}` },
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (request.method === 'POST') {
    let payload;
    try { payload = await request.json(); }
    catch { return new Response('Bad JSON body', { status: 400 }); }

    if (!payload || typeof payload.rules !== 'object') {
      return new Response('Body must be { rules: {...} }', { status: 400 });
    }

    const res = await fetch(`${DB}/.settings/rules.json`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${fbToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    return new Response(text || JSON.stringify({ ok: res.ok }), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method not allowed', { status: 405 });
}
