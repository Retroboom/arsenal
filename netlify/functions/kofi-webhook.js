const admin = require('firebase-admin');

// Initialize Firebase Admin (once per cold start)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://hailoffire-campaign-default-rtdb.firebaseio.com'
  });
}

const db = admin.database();

// Sanitize email for use as Firebase key (replace . with ,)
function emailToKey(email) {
  return email.toLowerCase().replace(/\./g, ',');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Ko-fi sends a URL-encoded body with a 'data' field containing JSON
    const params = new URLSearchParams(event.body);
    const raw = params.get('data');
    if (!raw) return { statusCode: 400, body: 'Missing data field' };

    const payload = JSON.parse(raw);

    // Verify this came from Ko-fi
    const token = process.env.KOFI_VERIFICATION_TOKEN;
    if (token && payload.verification_token !== token) {
      console.error('Invalid verification token');
      return { statusCode: 401, body: 'Unauthorized' };
    }

    const email = payload.email;
    if (!email) return { statusCode: 400, body: 'No email in payload' };

    const key = emailToKey(email);
    const type = payload.type; // 'Subscription', 'Donation', etc.
    const isSubscription = payload.is_subscription_payment;

    if (type === 'Subscription' && isSubscription) {
      // New or recurring subscription — mark as active
      await db.ref(`subscribers/${key}`).set({
        email: email,
        status: 'active',
        since: payload.timestamp || new Date().toISOString(),
        kofi_transaction_id: payload.kofi_transaction_id || null
      });
      console.log(`Subscriber added/renewed: ${email}`);
    } else if (type === 'Subscription' && !isSubscription) {
      // Cancellation — mark as inactive
      await db.ref(`subscribers/${key}/status`).set('inactive');
      console.log(`Subscriber cancelled: ${email}`);
    }

    return { statusCode: 200, body: 'OK' };

  } catch (err) {
    console.error('Webhook error:', err);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
