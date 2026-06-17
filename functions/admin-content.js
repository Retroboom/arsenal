/**
 * Admin content patch — Cloudflare Pages Function (admin tooling).
 *
 * POST https://arsenal.retroboomgames.com/admin-content?token=<ADMIN_SEED_TOKEN>
 *   body: { "id": "<content push id>", "patch": { ...fields to update... } }
 *
 * PATCHes content/<id> in the RTDB. Used to edit briefings (e.g. the in-app
 * User Guide) from a script so they stay in sync with guide.html.
 *
 * Env secrets required:
 *   FIREBASE_SERVICE_ACCOUNT  — service account JSON (stringified)
 *   ADMIN_SEED_TOKEN          — admin token (same one the seed endpoints use)
 */

import { getFirebaseToken, fbPatch } from './_firebase.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const url   = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!env.ADMIN_SEED_TOKEN || token !== env.ADMIN_SEED_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload;
  try { payload = await request.json(); }
  catch { return new Response('Bad JSON body', { status: 400 }); }

  const { id, patch } = payload || {};
  if (!id || !patch || typeof patch !== 'object') {
    return new Response('Body must be { id, patch }', { status: 400 });
  }

  const fbToken = await getFirebaseToken(env.FIREBASE_SERVICE_ACCOUNT);
  await fbPatch(fbToken, `content/${id}`, patch);

  return new Response(
    JSON.stringify({ ok: true, id, fields: Object.keys(patch) }),
    { headers: { 'Content-Type': 'application/json' } },
  );
}
