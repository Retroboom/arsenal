/**
 * Ko-fi webhook — Cloudflare Pages Function
 * URL: https://arsenal.retroboomgames.com/kofi-webhook  (POST)
 *
 * Env secrets required:
 *   FIREBASE_SERVICE_ACCOUNT  — service account JSON (stringified)
 *   KOFI_VERIFICATION_TOKEN   — Ko-fi webhook verification token
 */

import { getFirebaseToken, fbSet } from './_firebase.js';

function emailToKey(email) {
  return email.toLowerCase().replace(/\./g, ',');
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const raw = params.get('data');
    if (!raw) return new Response('Missing data field', { status: 400 });

    const payload = JSON.parse(raw);

    const verifyToken = env.KOFI_VERIFICATION_TOKEN;
    if (verifyToken && payload.verification_token !== verifyToken) {
      console.error('Invalid Ko-fi verification token');
      return new Response('Unauthorized', { status: 401 });
    }

    const email = payload.email;
    if (!email) return new Response('No email in payload', { status: 400 });

    const fbToken = await getFirebaseToken(env.FIREBASE_SERVICE_ACCOUNT);
    const key  = emailToKey(email);
    const type = payload.type;
    const isSubscription = payload.is_subscription_payment;

    if (type === 'Subscription' && isSubscription) {
      await fbSet(fbToken, `subscribers/${key}`, {
        email,
        status: 'active',
        since: payload.timestamp || new Date().toISOString(),
        kofi_transaction_id: payload.kofi_transaction_id || null,
      });
      console.log(`Subscriber added/renewed: ${email}`);
    } else if (type === 'Subscription' && !isSubscription) {
      await fbSet(fbToken, `subscribers/${key}/status`, 'inactive');
      console.log(`Subscriber cancelled: ${email}`);
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
