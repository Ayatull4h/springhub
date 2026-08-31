/**
 * Sync Epicollect data from staging to prod
 * Copies 199 reports (clientCorrelationId) + 551 photos + springs + uploads
 * Guard: must have STAGING_DATABASE_URL and PROD_DATABASE_URL containing staging/prod
 * Usage: STAGING_DATABASE_URL=... PROD_DATABASE_URL=... npx tsx scripts/sync-epicollect-to-prod.ts [--apply]
 */
import pg from "pg";

const stagingUrl = process.env.STAGING_DATABASE_URL || "postgresql://springhub:113703263d726321244ae06cdf471cd7257b894838b8e7c0@localhost:5433/springhub_staging?connection_limit=3";
const prodUrl = process.env.PROD_DATABASE_URL || "postgresql://springhub:SpringHub2026!@localhost:5432/springhub?connection_limit=3";
const apply = process.argv.includes("--apply");

if (!stagingUrl.includes("5433") || !prodUrl.includes("5432")) {
  console.error("Guard: STAGING must be 5433, PROD 5432");
  process.exit(1);
}
console.log(apply ? "🔥 APPLY" : "🔍 DRY-RUN", `staging ${stagingUrl.replace(/\/\/[^@]+@/,"//***@").split("?")[0]} -> prod ${prodUrl.replace(/\/\/[^@]+@/,"//***@").split("?")[0]}`);

const staging = new pg.Pool({ connectionString: stagingUrl, max: 3 });
const prod = new pg.Pool({ connectionString: prodUrl, max: 3 });

async function main() {
  // 1. Check counts
  const sCount = await staging.query("SELECT count(*) FROM \"Report\" WHERE \"clientCorrelationId\" IS NOT NULL");
  const pCount = await prod.query("SELECT count(*) FROM \"Report\" WHERE \"clientCorrelationId\" IS NOT NULL");
  console.log(`Staging epicollect reports: ${sCount.rows[0].count}, Prod epicollect: ${pCount.rows[0].count}`);
  const sPhotos = await staging.query("SELECT count(*) FROM \"ReportPhoto\" p JOIN \"Report\" r ON p.\"reportId\"=r.id WHERE r.\"clientCorrelationId\" IS NOT NULL");
  const pPhotos = await prod.query("SELECT count(*) FROM \"ReportPhoto\" p JOIN \"Report\" r ON p.\"reportId\"=r.id WHERE r.\"clientCorrelationId\" IS NOT NULL");
  console.log(`Staging epicollect photos: ${sPhotos.rows[0].count}, Prod: ${pPhotos.rows[0].count}`);
  const sSprings = await staging.query("SELECT count(*) FROM \"Spring\" WHERE id IN (SELECT DISTINCT \"springId\" FROM \"Report\" WHERE \"clientCorrelationId\" IS NOT NULL AND \"springId\" IS NOT NULL)");
  console.log(`Staging springs linked to epicollect: ${sSprings.rows[0].count}`);

  // 2. Find missing reports in prod by id (all staging reports not in prod)
  const prodIds = await prod.query("SELECT id FROM \"Report\"");
  const prodSet = new Set(prodIds.rows.map(r=>r.id));
  const allStaging = await staging.query("SELECT id, \"clientCorrelationId\", \"springId\" FROM \"Report\"");
  const trulyMissing = allStaging.rows.filter(r=>!prodSet.has(r.id));
  console.log(`Staging total: ${allStaging.rows.length}, Prod total: ${prodIds.rows.length}, Missing in prod: ${trulyMissing.length}`);
  // Also check epicollect specifically
  const sEp = await staging.query("SELECT count(*) FROM \"Report\" WHERE \"clientCorrelationId\" IS NOT NULL");
  const pEp = await prod.query("SELECT count(*) FROM \"Report\" WHERE \"clientCorrelationId\" IS NOT NULL");
  console.log(`Epicollect staging: ${sEp.rows[0].count}, prod: ${pEp.rows[0].count}`);
  if (trulyMissing.length === 0) {
    console.log("✅ Prod already has all reports. No DB sync needed. Only uploads may need sync.");
    await staging.end();
    await prod.end();
    return;
  }
  console.log(`Will copy ${trulyMissing.length} missing reports + their springs + photos`);

  if (!apply) {
    console.log("DRY-RUN done. Use --apply to execute.");
    await staging.end();
    await prod.end();
    return;
  }

  // Ensure epicollect user exists in prod
  const sUser = await staging.query("SELECT * FROM \"Profile\" WHERE email='epicollect@springhub.id'");
  if (sUser.rows.length) {
    const u = sUser.rows[0];
    const exists = await prod.query("SELECT id FROM \"Profile\" WHERE email='epicollect@springhub.id'");
    if (exists.rows.length===0) {
      await prod.query(`INSERT INTO "Profile" (id, email, "passwordHash", username, role, region, "trustScore", points, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [u.id, u.email, u.passwordHash, u.username, u.role, u.region, u.trustScore, u.points, u.createdAt, u.updatedAt]);
      console.log(`Created epicollect user in prod ${u.id.slice(0,8)}`);
    } else {
      console.log("Epicollect user already in prod");
    }
  }

  // Copy springs first
  const springIds = [...new Set(trulyMissing.map(r=>r.springId).filter(Boolean))];
  console.log(`Copying ${springIds.length} springs`);
  for (const sid of springIds) {
    const sSpring = await staging.query("SELECT * FROM \"Spring\" WHERE id=$1", [sid]);
    if (!sSpring.rows.length) continue;
    const s = sSpring.rows[0];
    const exists = await prod.query("SELECT id FROM \"Spring\" WHERE id=$1", [sid]);
    if (exists.rows.length) {
      console.log(` spring ${sid.slice(0,8)} exists, skip`);
      continue;
    }
    await prod.query(`INSERT INTO "Spring" (id, name, "snappedLat", "snappedLng", province, regency, village, subdistrict, status, "healthScore", "healthStatus", "lastSurveyedAt", "isDummy", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`, [s.id, s.name, s.snappedLat, s.snappedLng, s.province, s.regency, s.village, s.subdistrict, s.status, s.healthScore, s.healthStatus, s.lastSurveyedAt, s.isDummy, s.createdAt, s.updatedAt]);
    console.log(` spring ${s.name} ${sid.slice(0,8)} created`);
  }

  // Copy reports + photos
  for (const r of trulyMissing) {
    const full = await staging.query("SELECT * FROM \"Report\" WHERE id=$1", [r.id]);
    const report = full.rows[0];
    const photos = await staging.query("SELECT * FROM \"ReportPhoto\" WHERE \"reportId\"=$1", [r.id]);
    // check again not exists (by id)
    const exists = await prod.query("SELECT id FROM \"Report\" WHERE id=$1", [report.id]);
    if (exists.rows.length) {
      console.log(` report ${report.id.slice(0,8)} exists, skip`);
      continue;
    }
    await prod.query(`INSERT INTO "Report" (id, "userId", "guestId", "formSlug", status, "isActive", "isDummy", "fieldData", "preciseLat", "preciseLng", "snappedLat", "snappedLng", "reviewedById", "reviewNote", "featuredPhotoId", "springId", "mapPointId", "clientCorrelationId", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`, [report.id, report.userId, report.guestId, report.formSlug, report.status, report.isActive, report.isDummy, report.fieldData, report.preciseLat, report.preciseLng, report.snappedLat, report.snappedLng, report.reviewedById, report.reviewNote, report.featuredPhotoId, report.springId, report.mapPointId, report.clientCorrelationId, report.createdAt, report.updatedAt]);
    console.log(` report ${(report.clientCorrelationId||"").slice(0,8)} ${report.id.slice(0,8)} created with ${photos.rows.length} photos`);
    for (const p of photos.rows) {
      await prod.query(`INSERT INTO "ReportPhoto" (id, "reportId", "fieldId", "storagePath", "mimeType", width, height, "createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [p.id, p.reportId, p.fieldId, p.storagePath, p.mimeType, p.width, p.height, p.createdAt]);
    }
    // PointsLog for approved? Copy as well if exists
    const points = await staging.query("SELECT * FROM \"PointsLog\" WHERE \"reportId\"=$1", [r.id]);
    for (const pt of points.rows) {
      const existsPt = await prod.query("SELECT id FROM \"PointsLog\" WHERE \"reportId\"=$1 AND \"userId\"=$2", [pt.reportId, pt.userId]);
      if (existsPt.rows.length===0) {
        await prod.query(`INSERT INTO "PointsLog" (id, "userId", "guestId", "reportId", amount, reason, metadata, "createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [pt.id, pt.userId, pt.guestId, pt.reportId, pt.amount, pt.reason, pt.metadata, pt.createdAt]);
      }
    }
  }

  console.log("DB sync done. Now copy uploads via: docker run --rm -v staging_uploads_staging_data:/from -v springhub_uploads_data:/to alpine sh -c 'cp -rn /from/* /to/ && ls /to/reports | wc -l'");
  await staging.end();
  await prod.end();
}

main().catch(e=>{console.error(e); process.exit(1);});
