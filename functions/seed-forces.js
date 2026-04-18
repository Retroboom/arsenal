/**
 * Seed example forces — Cloudflare Pages Function
 * URL: https://arsenal.retroboomgames.com/seed-forces?token=<KOFI_VERIFICATION_TOKEN>
 *      Add &check=true to read without writing.
 *
 * Env secrets required:
 *   FIREBASE_SERVICE_ACCOUNT  — service account JSON (stringified)
 *   KOFI_VERIFICATION_TOKEN   — used as the admin token for this endpoint
 */

import { getFirebaseToken, fbGet, fbPush, fbPatch, fbDelete } from './_firebase.js';

const forces = [

  // ── UNITED STATES ────────────────────────────────────────────────────────────

  {
    name: 'US Rifle Company (1944–45)',
    notes: 'Standard US infantry company as organized in NW Europe and Italy. Three rifle platoons supported by organic anti-tank, tank, mortar, and artillery assets. Versatile and well-supported.',
    nations: ['United States'],
    platoons: [
      { name: '1st Rifle Platoon', teams: [{ unitId: 'us-leader', qty: 1 }, { unitId: 'us-inf-bazooka', qty: 1 }, { unitId: 'us-inf-rifle-mg', qty: 6 }] },
      { name: '2nd Rifle Platoon', teams: [{ unitId: 'us-leader', qty: 1 }, { unitId: 'us-inf-bazooka', qty: 1 }, { unitId: 'us-inf-rifle-mg', qty: 6 }] },
      { name: '3rd Rifle Platoon', teams: [{ unitId: 'us-leader', qty: 1 }, { unitId: 'us-inf-bazooka', qty: 1 }, { unitId: 'us-inf-rifle-mg', qty: 6 }] },
      { name: 'Anti-Tank Platoon', teams: [{ unitId: 'us-leader', qty: 1 }, { unitId: 'us-gun-57mm', qty: 3 }] },
      { name: 'Tank Platoon', teams: [{ unitId: 'us-tank-m4-sherman', qty: 3 }] },
      { name: 'Mortar Platoon', teams: [{ unitId: 'us-leader', qty: 1 }, { unitId: 'us-fo', qty: 1 }, { unitId: 'us-gun-81mm-mortar', qty: 3 }] },
      { name: 'Artillery Battery', teams: [{ unitId: 'us-leader', qty: 1 }, { unitId: 'us-fo', qty: 1 }, { unitId: 'us-gun-155mm-howitzer', qty: 3 }] },
    ],
  },

  {
    name: 'US Tank Company (1944–45)',
    notes: 'Combined arms tank company from NW Europe. Two Sherman platoons with an armored rifle platoon riding halftracks, a Stuart recon element, and M7 Priest artillery support.',
    nations: ['United States'],
    platoons: [
      { name: '1st Tank Platoon', teams: [{ unitId: 'us-tank-m4-sherman', qty: 3 }] },
      { name: '2nd Tank Platoon', teams: [{ unitId: 'us-tank-m4-sherman', qty: 3 }] },
      { name: 'Armored Rifle Platoon', teams: [{ unitId: 'us-leader', qty: 1 }, { unitId: 'us-inf-bazooka', qty: 2 }, { unitId: 'us-gun-60mm-mortar', qty: 1 }, { unitId: 'us-inf-mg', qty: 6 }, { unitId: 'us-transport-halftrack', qty: 4 }] },
      { name: 'Recon Platoon', teams: [{ unitId: 'us-tank-m5-stuart', qty: 3 }] },
      { name: 'Artillery Battery', teams: [{ unitId: 'us-fo', qty: 1 }, { unitId: 'us-spa-m7-priest', qty: 3 }] },
    ],
  },

  // ── GERMANY ───────────────────────────────────────────────────────────────────

  {
    name: 'German Grenadier Company (1944–45)',
    notes: 'Late-war German infantry company. Grenadier platoons are armed with Panzerfausts giving every team a real anti-tank capability. Backed by PaK40 guns, StuG assault guns, mortars, and the fearsome 88mm FlaK.',
    nations: ['Germany'],
    platoons: [
      { name: '1st Grenadier Platoon', teams: [{ unitId: 'de-leader', qty: 1 }, { unitId: 'de-inf-rifle-mg', qty: 6 }, { unitId: 'de-inf-panzerfaust', qty: 2 }] },
      { name: '2nd Grenadier Platoon', teams: [{ unitId: 'de-leader', qty: 1 }, { unitId: 'de-inf-rifle-mg', qty: 6 }, { unitId: 'de-inf-panzerfaust', qty: 2 }] },
      { name: '3rd Grenadier Platoon', teams: [{ unitId: 'de-leader', qty: 1 }, { unitId: 'de-inf-rifle-mg', qty: 6 }, { unitId: 'de-inf-panzerfaust', qty: 2 }] },
      { name: 'Anti-Tank Platoon', teams: [{ unitId: 'de-leader', qty: 1 }, { unitId: 'de-gun-pak40', qty: 2 }] },
      { name: 'Panzer Platoon', teams: [{ unitId: 'de-tank-stug', qty: 3 }] },
      { name: 'Mortar Platoon', teams: [{ unitId: 'de-leader', qty: 1 }, { unitId: 'de-fo', qty: 1 }, { unitId: 'de-gun-8cm-mortar', qty: 3 }] },
      { name: 'Heavy AA Platoon', teams: [{ unitId: 'de-leader', qty: 1 }, { unitId: 'de-gun-88mm-flak', qty: 1 }] },
    ],
  },

  {
    name: 'German Panzer Company (1944–45)',
    notes: 'Late-war Panzer company built around Panzer IV platoons. Panzergrenadiers ride Sd Kfz 251 halftracks. Puma armored cars provide recon and Wespes deliver mobile artillery support.',
    nations: ['Germany'],
    platoons: [
      { name: '1st Panzer Platoon', teams: [{ unitId: 'de-tank-pz4h', qty: 3 }] },
      { name: '2nd Panzer Platoon', teams: [{ unitId: 'de-tank-pz4h', qty: 3 }] },
      { name: 'Panzergrenadier Platoon', teams: [{ unitId: 'de-leader', qty: 1 }, { unitId: 'de-inf-panzerschreck', qty: 1 }, { unitId: 'de-inf-mg', qty: 6 }, { unitId: 'de-transport-sdkfz251', qty: 4 }] },
      { name: 'Recon Platoon', teams: [{ unitId: 'de-ac-puma', qty: 2 }] },
      { name: 'Artillery Battery', teams: [{ unitId: 'de-fo', qty: 1 }, { unitId: 'de-spa-wespe', qty: 3 }] },
    ],
  },

  // ── SOVIET UNION ──────────────────────────────────────────────────────────────

  {
    name: 'Soviet Strelkovy Company (1944)',
    notes: 'Soviet rifle company at full strength. Large platoons include organic HMG and AT rifle teams. Backed by 82mm mortars, 45mm anti-tank guns, T-34/85s, and the massive 152mm howitzer.',
    nations: ['Soviet Union'],
    platoons: [
      { name: '1st Rifle Platoon', teams: [{ unitId: 'sv-leader', qty: 1 }, { unitId: 'sv-gun-maksim', qty: 1 }, { unitId: 'sv-gun-ptrd', qty: 1 }, { unitId: 'sv-inf-rifle-mg', qty: 6 }] },
      { name: '2nd Rifle Platoon', teams: [{ unitId: 'sv-leader', qty: 1 }, { unitId: 'sv-gun-maksim', qty: 1 }, { unitId: 'sv-gun-ptrd', qty: 1 }, { unitId: 'sv-inf-rifle-mg', qty: 6 }] },
      { name: '3rd Rifle Platoon', teams: [{ unitId: 'sv-leader', qty: 1 }, { unitId: 'sv-gun-maksim', qty: 1 }, { unitId: 'sv-gun-ptrd', qty: 1 }, { unitId: 'sv-inf-rifle-mg', qty: 6 }] },
      { name: 'Mortar Platoon', teams: [{ unitId: 'sv-leader', qty: 1 }, { unitId: 'sv-fo', qty: 1 }, { unitId: 'sv-gun-82mm-mortar', qty: 4 }] },
      { name: 'Anti-Tank Platoon', teams: [{ unitId: 'sv-leader', qty: 1 }, { unitId: 'sv-gun-45mm', qty: 3 }] },
      { name: 'Tank Platoon', teams: [{ unitId: 'sv-tank-t34-85', qty: 3 }] },
      { name: 'Artillery Battery', teams: [{ unitId: 'sv-leader', qty: 1 }, { unitId: 'sv-fo', qty: 1 }, { unitId: 'sv-gun-152mm-howitzer', qty: 3 }] },
    ],
  },

  {
    name: 'Soviet Tankovy Company (1944)',
    notes: 'Soviet armored company at the height of tank warfare on the Eastern Front. Two T-34 platoons, SU-85 tank destroyers, motorized infantry in ZIS trucks, BA-64 recon, and Katyusha rocket artillery.',
    nations: ['Soviet Union'],
    platoons: [
      { name: '1st Tank Platoon', teams: [{ unitId: 'sv-tank-t34-85', qty: 3 }] },
      { name: '2nd Tank Platoon', teams: [{ unitId: 'sv-tank-t34-85', qty: 3 }] },
      { name: 'Rifle Platoon', teams: [{ unitId: 'sv-leader', qty: 1 }, { unitId: 'sv-gun-maksim', qty: 1 }, { unitId: 'sv-gun-ptrd', qty: 1 }, { unitId: 'sv-inf-rifle-mg', qty: 6 }, { unitId: 'sv-transport-zis-truck', qty: 4 }] },
      { name: 'SU-85 Platoon', teams: [{ unitId: 'sv-spg-su85', qty: 3 }] },
      { name: 'Recon Platoon', teams: [{ unitId: 'sv-ac-ba64', qty: 2 }] },
      { name: 'Artillery Battery', teams: [{ unitId: 'sv-fo', qty: 1 }, { unitId: 'sv-spa-katyusha', qty: 3 }] },
    ],
  },

  // ── BRITISH & COMMONWEALTH ────────────────────────────────────────────────────

  {
    name: 'British Rifle Company (1944–45)',
    notes: 'Standard British infantry company from NW Europe. Each rifle platoon carries a PIAT and 2" mortar as organic support. Backed by 6-pounder anti-tank guns, Churchill tanks, 3" mortars, and BL 5.5" artillery.',
    nations: ['Britain'],
    platoons: [
      { name: '1st Rifle Platoon', teams: [{ unitId: 'br-leader', qty: 1 }, { unitId: 'br-inf-piat', qty: 1 }, { unitId: 'br-inf-2in-mortar', qty: 1 }, { unitId: 'br-inf-rifle-mg', qty: 6 }] },
      { name: '2nd Rifle Platoon', teams: [{ unitId: 'br-leader', qty: 1 }, { unitId: 'br-inf-piat', qty: 1 }, { unitId: 'br-inf-2in-mortar', qty: 1 }, { unitId: 'br-inf-rifle-mg', qty: 6 }] },
      { name: '3rd Rifle Platoon', teams: [{ unitId: 'br-leader', qty: 1 }, { unitId: 'br-inf-piat', qty: 1 }, { unitId: 'br-inf-2in-mortar', qty: 1 }, { unitId: 'br-inf-rifle-mg', qty: 6 }] },
      { name: 'Anti-Tank Platoon', teams: [{ unitId: 'br-leader', qty: 1 }, { unitId: 'br-gun-6pdr', qty: 3 }] },
      { name: 'Tank Platoon', teams: [{ unitId: 'br-tank-churchill34', qty: 3 }] },
      { name: 'Mortar Platoon', teams: [{ unitId: 'br-leader', qty: 1 }, { unitId: 'br-fo', qty: 1 }, { unitId: 'br-gun-3in-mortar', qty: 3 }] },
      { name: 'Artillery Battery', teams: [{ unitId: 'br-leader', qty: 1 }, { unitId: 'br-fo', qty: 1 }, { unitId: 'br-gun-55in', qty: 3 }] },
    ],
  },

  {
    name: 'British Tank Company (1944–45)',
    notes: 'British armoured squadron from NW Europe. Each troop pairs two Cromwells with a Sherman Firefly for long-range AT punch. Motor platoon provides infantry support in halftracks. Stuart recon and Sexton SP artillery complete the force.',
    nations: ['Britain'],
    platoons: [
      { name: '1st Tank Troop', teams: [{ unitId: 'br-tank-cromwell4', qty: 2 }, { unitId: 'br-tank-firefly', qty: 1 }] },
      { name: '2nd Tank Troop', teams: [{ unitId: 'br-tank-cromwell4', qty: 2 }, { unitId: 'br-tank-firefly', qty: 1 }] },
      { name: 'Motor Platoon', teams: [{ unitId: 'br-leader', qty: 1 }, { unitId: 'br-inf-piat', qty: 1 }, { unitId: 'br-inf-2in-mortar', qty: 1 }, { unitId: 'br-inf-mg', qty: 6 }, { unitId: 'br-transport-m5-halftrack', qty: 4 }] },
      { name: 'Recon Platoon', teams: [{ unitId: 'br-tank-stuart', qty: 3 }] },
      { name: 'Artillery Battery', teams: [{ unitId: 'br-fo', qty: 1 }, { unitId: 'br-spa-sexton', qty: 3 }] },
    ],
  },

];

export async function onRequestGet(context) {
  const { request, env } = context;
  const url    = new URL(request.url);
  const token  = url.searchParams.get('token');
  const check  = url.searchParams.get('check') === 'true';

  if (token !== env.KOFI_VERIFICATION_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

  const fbToken = await getFirebaseToken(env.FIREBASE_SERVICE_ACCOUNT);

  if (check) {
    const all = await fbGet(fbToken, 'forces');
    const found = all
      ? Object.entries(all).map(([k, v]) => `[${k}] ${v.name} | author:${v.author} | published:${v.published}`)
      : [];
    return new Response(`${found.length} force(s) in Firebase:\n${found.join('\n') || '(none)'}`, { status: 200 });
  }

  try {
    const now = Date.now();
    const log = [];

    // Delete previously seeded example forces
    const existing = await fbGet(fbToken, 'forces');
    const deleteOps = [];
    if (existing) {
      for (const [key, force] of Object.entries(existing)) {
        if (force.author === 'Hail of Fire') {
          deleteOps.push(fbDelete(fbToken, `forces/${key}`));
          log.push(`Deleted: ${force.name}`);
        }
      }
    }
    await Promise.all(deleteOps);

    // Write all forces, then patch in the auto-generated push ID
    const writeOps = forces.map(async force => {
      const platoonCount = force.platoons.length;
      const entry = {
        name: force.name,
        notes: force.notes,
        author: 'Hail of Fire',
        authorUid: null,
        authorEmail: null,
        nations: force.nations,
        platoonCount,
        breakLimit: 5 + platoonCount * 2,
        platoons: force.platoons,
        created: now,
        published: true,
      };
      const result = await fbPush(fbToken, 'forces', entry);
      const pushId = result.name;
      await fbPatch(fbToken, `forces/${pushId}`, { id: pushId });
      log.push(`Wrote: ${force.name} [${pushId}]`);
    });
    await Promise.all(writeOps);

    return new Response(`Done. ${forces.length} forces seeded.\n\n${log.join('\n')}`, { status: 200 });
  } catch (err) {
    console.error('Seed error:', err);
    return new Response(`Error: ${err.message}\n${err.stack}`, { status: 500 });
  }
}
