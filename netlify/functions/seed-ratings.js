const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://hailoffire-campaign-default-rtdb.firebaseio.com'
  });
}

const db = admin.database();

// Seeded Elo ratings derived from a stat-based simulation.
// Starting values were computed from team stats (firepower, AT, armor, etc.),
// then refined via 6 rounds of ~81,000 pairwise Elo comparisons (K=12),
// normalized to 800–1550. Quality differences emerge from real user votes.
const SEEDED = {
  'de-td-jagdtiger':                     1550,
  'de-spa-hummel':                       1547,
  'br-gun-55in':                         1533,
  'sv-tank-is2':                         1514,
  'de-spa-grille':                       1513,
  'us-spa-m12':                          1512,
  'de-gun-150mm-sfh18':                  1512,
  'sv-tank-ot34':                        1511,
  'br-tank-churchill-croc':              1491,
  'de-td-jagdpanther':                   1487,
  'sv-spg-isu122':                       1473,
  'us-tank-m26-pershing':                1470,
  'br-tank-challenger':                  1470,
  'sv-spg-isu152':                       1460,
  'de-tank-tiger2':                      1448,
  'de-tank-tiger1':                      1448,
  'de-tank-panther':                     1447,
  'de-tank-brummbar':                    1447,
  'sv-spg-su152':                        1431,
  'de-gun-150mm-sig':                    1426,
  'br-tank-cromwell4':                   1419,
  'de-td-elefant':                       1418,
  'us-spg-105mm-sherman':                1416,
  'us-tank-m4a3e8':                      1415,
  'br-spa-priest':                       1392,
  'br-gun-25pdr':                        1392,
  'sv-tank-t34-85':                      1390,
  'sv-tank-kv8s':                        1388,
  'us-gun-155mm-howitzer':               1387,
  'sv-gun-152mm-howitzer':               1386,
  'us-tank-m4a3e2-jumbo':                1384,
  'de-tank-pz4h':                        1372,
  'de-td-hornisse':                      1367,
  'br-tank-firefly':                     1363,
  'sv-tank-t34-41':                      1344,
  'de-tank-stuh42':                      1343,
  'sv-spg-su122':                        1343,
  'de-spa-wespe':                        1342,
  'us-tank-m24-chaffee':                 1342,
  'us-tank-m4-sherman-76':               1342,
  'us-td-m36':                           1338,
  'br-spa-sexton':                       1338,
  'br-tank-churchill7':                  1335,
  'us-spa-m7-priest':                    1317,
  'br-td-m10c':                          1316,
  'us-gun-105mm-howitzer':               1313,
  'sv-tank-kv1s':                        1309,
  'sv-tank-kv85':                        1299,
  'de-td-jagdpanzer4':                   1299,
  'de-tank-stug':                        1296,
  'br-tank-cromwell6cs':                 1295,
  'br-td-m10':                           1295,
  'de-gun-75mm-gebg36':                  1283,
  'sv-spg-su85':                         1281,
  'de-gun-105mm-lefh18':                 1277,
  'us-tank-m4-sherman':                  1277,
  'br-tank-churchill6':                  1271,
  'sv-gun-zis2':                         1264,
  'de-gun-pak43':                        1260,
  'de-gun-88mm-flak':                    1259,
  'us-td-m18-hellcat':                   1253,
  'de-gun-88mm-launcher':                1245,
  'br-tank-churchill34':                 1244,
  'br-tank-sherman':                     1243,
  'de-gun-pak40':                        1243,
  'de-tank-pz3n':                        1240,
  'br-gun-37in-aa':                      1238,
  'us-spg-m8-scott':                     1220,
  'de-inf-panzerschreck':                1218,
  'us-td-m10':                           1218,
  'sv-gun-zis3':                         1217,
  'sv-gun-85mm-aa':                      1216,
  'us-tank-m5-stuart':                   1207,
  'sv-spg-su76m':                        1205,
  'de-gun-pak38':                        1205,
  'de-gun-75mm-leig':                    1203,
  'br-gun-6pdr':                         1203,
  'us-gun-105mm-light':                  1194,
  'de-tank-pz3m':                        1181,
  'br-tank-stuart':                      1176,
  'us-inf-bazooka':                      1176,
  'br-inf-piat':                         1176,
  'br-gun-17pdr':                        1176,
  'de-td-marder':                        1171,
  'sv-gun-122mm-howitzer':               1171,
  'br-ac-aec3':                          1169,
  'de-transport-sdkfz251-75cm':          1158,
  'br-gun-2pdr':                         1155,
  'de-gun-2cm-flak':                     1145,
  'br-gun-75mm-pack':                    1143,
  'sv-tank-t70':                         1140,
  'br-gun-42in-mortar':                  1139,
  'br-recon-universal-carrier-piat':     1138,
  'us-gun-3in':                          1132,
  'de-ac-puma':                          1131,
  'sv-gun-45mm':                         1131,
  'de-spaa-sdkfz7':                      1131,
  'de-spa-sdkfz251-75cm':                1111,
  'us-gun-57mm':                         1109,
  'de-spaa-wirbelwind':                  1106,
  'de-spaa-sdkfz251-15mm':               1106,
  'br-spaa-bofors-sp':                   1104,
  'de-ac-sdkfz231':                      1103,
  'de-gun-12cm-mortar':                  1101,
  'de-ft-flammpanzer3':                  1098,
  'us-gun-37mm':                         1078,
  'us-ac-m8':                            1076,
  'de-spaa-sdkfz251-2cm':                1076,
  'br-ac-daimler1':                      1076,
  'br-ac-humber4':                       1076,
  'de-ac-sdkfz250':                      1072,
  'de-spaa-sdkfz10':                     1071,
  'us-spaa-m15-cgmc':                    1070,
  'de-ft-sdkfz251-flame':                1049,
  'br-gun-3in-mortar':                   1048,
  'sv-gun-120mm-mortar':                 1047,
  'us-gun-81mm-mortar':                  1046,
  'de-gun-8cm-mortar':                   1046,
  'br-ac-humber23':                      1046,
  'de-spa-panzerwerfer':                 1045,
  'sv-gun-82mm-mortar':                  1020,
  'de-ac-sdkfz222':                      1018,
  'br-ac-aec1':                          1018,
  'us-gun-50cal-aa':                     1017,
  'br-gun-bofors-40mm':                  1015,
  'sv-gun-37mm-aa':                      1015,
  'us-gun-bofors':                       1012,
  'sv-ac-ba64':                           996,
  'br-inf-2in-mortar':                    995,
  'de-gun-hmg':                           990,
  'us-gun-quad-50cal-aa':                 989,
  'br-recon-universal-carrier-mg':        983,
  'us-spa-m4-81mm':                       979,
  'sv-gun-ptrd':                          976,
  'br-recon-universal-carrier-boys':      971,
  'sv-gun-maksim':                        971,
  'sv-inf-smg':                           954,
  'sv-inf-rifle-mg':                      953,
  'br-recon-otter-lrc':                   952,
  'us-spaa-m16-mgmc':                     952,
  'us-gun-hmg':                           951,
  'us-gun-60mm-mortar':                   936,
  'br-recon-humber-lrc':                  932,
  'de-inf-mg':                            924,
  'sv-spaa-zsu-m17':                      917,
  'us-inf-rifle-mg':                      917,
  'br-gun-vickers':                       916,
  'us-spaa-m13-mgmc':                     916,
  'us-inf-mg':                            894,
  'br-inf-mg':                            892,
  'de-inf-assault-rifle':                 891,
  'br-inf-rifle-mg':                      891,
  'de-spa-sdkfz251-8cm':                  889,
  'de-inf-rifle-mg':                      875,
  'us-transport-halftrack':               845,
  'de-transport-sdkfz251':                845,
  'br-recon-daimler-dingo':               845,
  'us-ac-m20':                            845,
  'sv-spaa-dshk':                         844,
  'br-transport-humber-scout':            844,
  'br-transport-m5-halftrack':            844,
  'br-recon-universal-carrier':           843,
  'br-ac-m20':                            807,
  'br-transport-white-marmon':            803,
  'br-recon-indian-carrier':              800,
};

const QUALITIES = ['Regular', 'Elite', 'Poor'];

exports.handler = async (event) => {
  const token = event.queryStringParameters && event.queryStringParameters.token;
  if (token !== process.env.KOFI_VERIFICATION_TOKEN) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const check = event.queryStringParameters.check === 'true';

  if (check) {
    const snap = await db.ref('ratings').once('value');
    const existing = snap.val() || {};
    return {
      statusCode: 200,
      body: JSON.stringify({
        existingKeys: Object.keys(existing).length,
        seedKeys: Object.keys(SEEDED).length * QUALITIES.length,
        sample: Object.entries(existing).slice(0, 5)
      }, null, 2)
    };
  }

  // Build all rating entries
  const writes = {};
  for (const [teamId, rating] of Object.entries(SEEDED)) {
    for (const quality of QUALITIES) {
      const key = `${teamId}_${quality}`;
      writes[key] = { rating, wins: 0, losses: 0, comparisons: 0, seeded: true };
    }
  }

  // Write all in parallel
  await Promise.all(
    Object.entries(writes).map(([key, val]) =>
      db.ref(`ratings/${key}`).set(val)
    )
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ seeded: Object.keys(writes).length, teams: Object.keys(SEEDED).length })
  };
};
