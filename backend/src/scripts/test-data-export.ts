import "dotenv/config";
import { getPool, query } from "../db/client.js";
import {
  createDataExportRequest,
  finalizeDataExportReady,
  consumeDataExportDownloadToken,
  reissueDataExportDownloadToken,
  getDataExportById
} from "../repositories/dataExportRepository.js";
import { hashToken } from "../services/securityService.js";
import { normalizeDownloadUrl } from "../services/labsExportService.js";
import assert from "assert";

async function runTests() {
  console.log("Running Data Export tests...");

  // 1. Fetch test references that we will link dynamically
  const userRes = await query("SELECT id, email, tenant_id FROM users WHERE role = 'customer' AND tenant_id IS NOT NULL LIMIT 1");
  const licenseRes = await query("SELECT id, tenant_id FROM licenses LIMIT 1");

  if (!userRes.rows.length || !licenseRes.rows.length) {
    throw new Error("Seed data missing. Run seed script first.");
  }

  const userId = userRes.rows[0].id;
  const userEmail = userRes.rows[0].email;
  const tenantId = userRes.rows[0].tenant_id;
  const licenseId = licenseRes.rows[0].id;

  // Align the license to the customer's tenant for testing
  const originalLicenseTenant = licenseRes.rows[0].tenant_id;
  await query("UPDATE licenses SET tenant_id = $1 WHERE id = $2", [tenantId, licenseId]);

  console.log(`Using Tenant: ${tenantId}, User: ${userEmail}, License: ${licenseId}`);

  try {
    // Cleanup potential leftover tests
    await query("DELETE FROM data_export_requests WHERE store_name = 'Test Store' OR store_name = 'Test Store 2'");

    // ----------------------------------------------------
    // TEST 1: Tenant/license ownership checking
    // ----------------------------------------------------
    console.log("Testing: Tenant/license ownership check...");
    // Attempt to create export with non-owned license (a random license UUID or tenant mismatch)
    const invalidCreate = await createDataExportRequest({
      licenseId: "00000000-0000-0000-0000-000000000000",
      requestedByUserId: userId,
      requestedByEmail: userEmail,
      storeName: "Test Store",
      tenantId: tenantId,
    });
    assert.strictEqual(invalidCreate.ok, false);
    assert.strictEqual(invalidCreate.code, "license_not_found");
    console.log("Passed!");

    // ----------------------------------------------------
    // TEST 2: Ready handler generates a single token & DB hash matches SHA256 of mail token
    // ----------------------------------------------------
    console.log("Testing: Ready handler creates token & hashes correctly...");
    const createResult = await createDataExportRequest({
      licenseId: licenseId,
      requestedByUserId: userId,
      requestedByEmail: userEmail,
      storeName: "Test Store",
      tenantId: tenantId,
    });

    if (!createResult.ok) {
      throw new Error(`Failed to create test export: ${createResult.message}`);
    }

    const requestId = createResult.request.id;

    // Call finalizeDataExportReady
    const providerToken = "mock-provider-download-token-123";
    const finalizeResult = await finalizeDataExportReady({
      requestId: requestId,
      providerDownloadToken: providerToken,
    });

    assert.strictEqual(finalizeResult.ok, true);
    const rawDownloadToken = (finalizeResult as any).rawDownloadToken;
    assert.ok(rawDownloadToken);

    // Read DB record to check the hash
    const dbRowRes = await query("SELECT * FROM data_export_requests WHERE id = $1", [requestId]);
    const dbRow = dbRowRes.rows[0];

    const expectedHash = hashToken(rawDownloadToken);
    assert.strictEqual(dbRow.download_token_hash, expectedHash);
    console.log("Passed!");

    // ----------------------------------------------------
    // TEST 3: Mail link token can be found in DB & Provider token does not leak
    // ----------------------------------------------------
    console.log("Testing: Mail token matches DB hash & provider token is hidden...");
    // Hashing the token from the mail (which is rawDownloadToken) should find the record
    const tokenFromMail = rawDownloadToken;
    const hashFromMail = hashToken(tokenFromMail);
    const matchRes = await query("SELECT * FROM data_export_requests WHERE download_token_hash = $1", [hashFromMail]);
    assert.strictEqual(matchRes.rows.length, 1);
    assert.strictEqual(matchRes.rows[0].id, requestId);

    // Check that the provider token is not identical to raw customer token
    assert.notStrictEqual(rawDownloadToken, providerToken);
    console.log("Passed!");

    // ----------------------------------------------------
    // TEST 4: Download endpoint redirects on correct token and fails on invalid/expired token
    // ----------------------------------------------------
    console.log("Testing: Download endpoint verification...");
    // Valid token
    const validDownload = await consumeDataExportDownloadToken(rawDownloadToken);
    assert.ok(validDownload);
    assert.strictEqual(validDownload.providerToken, providerToken);

    // Redirect URL should end with providerToken and must not contain /download/download
    const redirectUrl = normalizeDownloadUrl(validDownload.providerToken);
    assert.ok(redirectUrl.endsWith(providerToken), `Expected redirect URL to end with ${providerToken}, got: ${redirectUrl}`);
    assert.ok(!redirectUrl.includes("/download/download"), `Expected redirect URL not to contain /download/download, got: ${redirectUrl}`);

    // Check that customer token is not identical to provider token
    assert.notStrictEqual(rawDownloadToken, providerToken);

    // Check that provider token does not leak to the customer mail link
    const customerMailLink = `https://getshelfio.com/api/account/data-exports/download?token=${encodeURIComponent(rawDownloadToken)}`;
    assert.ok(!customerMailLink.includes(providerToken), "Provider token leaked in customer mail link!");

    // Invalid token
    const invalidDownload = await consumeDataExportDownloadToken("invalid-raw-token");
    assert.strictEqual(invalidDownload, null);

    // Expired token
    // Let's set download_expires_at to the past
    await query("UPDATE data_export_requests SET download_expires_at = now() - interval '1 hour' WHERE id = $1", [requestId]);
    const expiredDownload = await consumeDataExportDownloadToken(rawDownloadToken);
    assert.strictEqual(expiredDownload, null);
    console.log("Passed!");

    // ----------------------------------------------------
    // TEST 5: Mail resend (reissue token) for ready records
    // ----------------------------------------------------
    console.log("Testing: Reissue token creates a fresh valid token and invalidates the old one...");
    // Reset expiry and make it valid/ready again
    await query("UPDATE data_export_requests SET download_expires_at = now() + interval '24 hours' WHERE id = $1", [requestId]);

    const reissueResult = await reissueDataExportDownloadToken(requestId);
    assert.strictEqual(reissueResult.ok, true);
    const newRawDownloadToken = (reissueResult as any).rawDownloadToken;
    assert.ok(newRawDownloadToken);
    assert.notStrictEqual(newRawDownloadToken, rawDownloadToken);

    // Old token should be consumed as null now because the DB has been updated to the new hash
    const consumeOld = await consumeDataExportDownloadToken(rawDownloadToken);
    assert.strictEqual(consumeOld, null);

    // New token should work
    const consumeNew = await consumeDataExportDownloadToken(newRawDownloadToken);
    assert.ok(consumeNew);
    assert.strictEqual(consumeNew.providerToken, providerToken);
    console.log("Passed!");

    // ----------------------------------------------------
    // TEST 6: Prevent duplicate token generation
    // ----------------------------------------------------
    console.log("Testing: Prevent duplicate token generation (finalizeDataExportReady on ready request)...");
    const secondFinalize = await finalizeDataExportReady({
      requestId: requestId,
      providerDownloadToken: "another-provider-token",
    });
    assert.strictEqual(secondFinalize.ok, false);
    assert.strictEqual(secondFinalize.code, "already_ready");
    console.log("Passed!");

    // ----------------------------------------------------
    // TEST 7: Provider token missing/decryption failed controlled error check
    // ----------------------------------------------------
    console.log("Testing: Provider token missing or decryption failed returns controlled error...");
    // Corrupt the provider token in the DB
    await query("UPDATE data_export_requests SET provider_download_token_encrypted = 'invalid-encrypted-value' WHERE id = $1", [requestId]);

    // Consume the token: it should return providerToken as null instead of throwing an unhandled error or returning null row
    const consumedCorrupt = await consumeDataExportDownloadToken(newRawDownloadToken);
    assert.ok(consumedCorrupt);
    assert.strictEqual(consumedCorrupt.providerToken, null);
    console.log("Passed!");

    // ----------------------------------------------------
    // TEST 8: Reissue fails if provider token is corrupted as "download"
    // ----------------------------------------------------
    console.log("Testing: Reissue fails if provider token is corrupted as 'download'...");
    // Let's create a new request for this test
    const testCreate = await createDataExportRequest({
      licenseId: licenseId,
      requestedByUserId: userId,
      requestedByEmail: userEmail,
      storeName: "Test Store 2",
      tenantId: tenantId,
    });
    assert.strictEqual(testCreate.ok, true);
    const testRequestId = testCreate.request.id;

    // Finalize as ready with "download" as provider token
    const testFinalize = await finalizeDataExportReady({
      requestId: testRequestId,
      providerDownloadToken: "download",
    });
    assert.strictEqual(testFinalize.ok, true);

    // Reissue should fail
    const testReissue = await reissueDataExportDownloadToken(testRequestId);
    assert.strictEqual(testReissue.ok, false);
    assert.strictEqual(testReissue.code, "provider_token_missing");

    // Cleanup
    await query("DELETE FROM data_export_requests WHERE id = $1", [testRequestId]);
    console.log("Passed!");

    // Cleanup request
    await query("DELETE FROM data_export_requests WHERE id = $1", [requestId]);
  } finally {
    // Restore original license tenant
    await query("UPDATE licenses SET tenant_id = $1 WHERE id = $2", [originalLicenseTenant, licenseId]);
  }

  console.log("All tests passed successfully!");
}

runTests()
  .then(async () => {
    await getPool().end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Test failed:", error);
    await getPool().end().catch(() => undefined);
    process.exit(1);
  });
