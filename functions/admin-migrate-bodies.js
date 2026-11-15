/**
 * One-off migration: split content/{id}.body out into content_bodies/{id}.body.
 *
 * Why: Realtime Database rules can only grant/deny a whole node, and grants
 * cascade down from any ancestor — so as long as body lives inside the same
 * node as public metadata (title, published, subscriberOnly...), there is no
 * rule that can expose the metadata (for teaser cards) while still gating the
 * body. Moving body to its own top-level node lets each be governed
 * independently.
 *
 * GET https://arsenal.retroboomgames.com/admin-migrate-bodies?token=<ADMIN_SEED_TOKEN>
 *   Dry run: reports what would move, changes nothing.
 * POST same URL, body {}:
 *   Performs the move for every content/{id} that still has an inline body.
 */

import { getFirebaseToken, fbGet } from './_firebase.js';

const DB = 'https://hailoffire-campaign-default-rtdb.firebaseio.com';

export async function onRequest(context) {
  const { request, env } = context;
  const url   = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!env.ADMIN_SEED_TOKEN || token !== env.ADMIN_SEED_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

  const fbToken = await getFirebaseToken(env.FIREBASE_SERVICE_ACCOUNT);
  const content = await fbGet(fbToken, 'content');
  if (!content) return new Response(JSON.stringify({ moved: [], note: 'content/ empty' }), { headers: { 'Content-Type': 'application/json' } });

  const toMove = Object.entries(content).filter(([id, v]) => v && typeof v.body === 'string');

  if (request.method === 'GET') {
    return new Response(JSON.stringify({
      dryRun: true,
      wouldMove: toMove.map(([id, v]) => ({ id, title: v.title, bodyLength: v.body.length })),
    }, null, 2), { headers: { 'Content-Type': 'application/json' } });
  }

  if (request.method === 'POST') {
    const results = [];
    for (const [id, v] of toMove) {
      // Multi-path update: write the body to its new home and null it out of
      // the old one in a single atomic PATCH at the database root.
      const patch = {
        [`content_bodies/${id}/body`]: v.body,
        [`content/${id}/body`]: null,
      };
      const res = await fetch(`${DB}/.json`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${fbToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      results.push({ id, title: v.title, ok: res.ok, status: res.status });
    }
    return new Response(JSON.stringify({ moved: results }, null, 2), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response('Method not allowed', { status: 405 });
}
