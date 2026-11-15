/**
 * Admin content read/patch — Cloudflare Pages Function (admin tooling).
 *
 * GET  https://arsenal.retroboomgames.com/admin-content?token=<TOKEN>&id=<id>
 *   Returns content/<id> merged with its content_bodies/<id>.body, bypassing
 *   the normal read rules (draft/unpublished/subscriber-only all readable) —
 *   for inspecting current state before patching it.
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

import { getFirebaseToken, fbGet, fbPatch } from './_firebase.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url   = new URL(request.url);
  const token = url.searchParams.get('token');
  const id    = url.searchParams.get('id');

  if (!env.ADMIN_SEED_TOKEN || token !== env.ADMIN_SEED_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (!id) return new Response('Missing ?id=', { status: 400 });

  const fbToken = await getFirebaseToken(env.FIREBASE_SERVICE_ACCOUNT);
  const [meta, bodyNode] = await Promise.all([
    fbGet(fbToken, `content/${id}`),
    fbGet(fbToken, `content_bodies/${id}`),
  ]);

  return new Response(
    JSON.stringify({ id, ...meta, body: bodyNode ? bodyNode.body : null }, null, 2),
    { headers: { 'Content-Type': 'application/json' } },
  );
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

  const { id, patch } = payload || {};
  if (!id || !patch || typeof patch !== 'object') {
    return new Response('Body must be { id, patch }', { status: 400 });
  }

  // body lives in content_bodies/{id}, not content/{id} — the database rules
  // gate that node independently so draft/subscriber-only text can't leak
  // through the public metadata read. Route it there instead of letting it
  // land back on content/{id}, which would quietly reopen that hole.
  const { body, ...metaPatch } = patch;

  const fbToken = await getFirebaseToken(env.FIREBASE_SERVICE_ACCOUNT);
  if (Object.keys(metaPatch).length) await fbPatch(fbToken, `content/${id}`, metaPatch);
  if (body !== undefined) await fbPatch(fbToken, `content_bodies/${id}`, { body });

  return new Response(
    JSON.stringify({ ok: true, id, fields: Object.keys(patch) }),
    { headers: { 'Content-Type': 'application/json' } },
  );
}
