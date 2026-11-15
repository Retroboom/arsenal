/**
 * Admin generic path read/write — Cloudflare Pages Function (admin tooling).
 *
 * GET  https://arsenal.retroboomgames.com/admin-write-path?token=<ADMIN_SEED_TOKEN>&path=<db/path>
 *   Returns the current value at that RTDB path.
 *
 * POST https://arsenal.retroboomgames.com/admin-write-path?token=<ADMIN_SEED_TOKEN>
 *   body: { "path": "<db/path>", "value": <any JSON value> }
 *   Overwrites that path (PUT semantics — replaces whatever is there).
 *
 * One-off tool for admin tasks that don't have a dedicated endpoint yet
 * (e.g. manually whitelisting a supporter). Uses the same service-account
 * bypass as admin-content.js / admin-db-rules.js, so it ignores RTDB rules
 * entirely — the ADMIN_SEED_TOKEN check is the only gate.
 */

import { getFirebaseToken, fbGet, fbSet } from './_firebase.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url   = new URL(request.url);
  const token = url.searchParams.get('token');
  const path  = url.searchParams.get('path');

  if (!env.ADMIN_SEED_TOKEN || token !== env.ADMIN_SEED_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (!path) return new Response('Missing ?path=', { status: 400 });

  const fbToken = await getFirebaseToken(env.FIREBASE_SERVICE_ACCOUNT);
  const value = await fbGet(fbToken, path);
  return new Response(JSON.stringify({ path, value }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}

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

  const { path, value } = payload || {};
  if (!path || value === undefined) {
    return new Response('Body must be { path, value }', { status: 400 });
  }

  const fbToken = await getFirebaseToken(env.FIREBASE_SERVICE_ACCOUNT);
  await fbSet(fbToken, path, value);

  return new Response(JSON.stringify({ ok: true, path, value }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
