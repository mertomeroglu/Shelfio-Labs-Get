const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Pool } = require('pg');

// Resolve and load environment variables from backend/.env
const envPath = path.join(__dirname, '../../backend/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...values] = trimmed.split('=');
    if (key) {
      process.env[key.trim()] = values.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  });
}

// Check arguments
const isApply = process.argv.includes('--apply');

// Configuration
const MAIN_LICENSE_KEY = 'SHELFIO-MAIN-2026';
const pepper = process.env.LICENSE_KEY_PEPPER || process.env.SESSION_SECRET || 'development-only-change-me';

function hashLicenseKey(key, secretPepper) {
  return crypto.createHmac('sha256', secretPepper).update(key.trim().toUpperCase()).digest('hex');
}

const mainLicenseHash = hashLicenseKey(MAIN_LICENSE_KEY, pepper);

async function run() {
  console.log('==================================================================');
  console.log('         SHELFIO DATABASE CLEANUP & ARCHIVE TOOL');
  console.log('==================================================================');
  
  if (!isApply) {
    console.log('NOTE: Currently running in DRY-RUN mode. No data will be modified.');
    console.log('To apply the cleanup, run with the --apply flag:\n');
    console.log('  node scripts/cleanup/cleanupNonMainLicenseData.js --apply\n');
    console.log('IMPORTANT: Please take a database backup BEFORE running with --apply:');
    console.log('  pg_dump -U getshelfio_user -h localhost getshelfio_control > backup.sql\n');
  } else {
    console.log('ATTENTION: RUNNING IN ACTIVE APPLY MODE. DATA WILL BE REMOVED.');
    console.log('==================================================================\n');
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL not found in env configuration.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  const client = await pool.connect();

  try {
    // 1. Locate the main license key
    const licenseRes = await client.query(
      'SELECT l.*, p.name as plan_name, p.slug as plan_slug FROM licenses l JOIN plans p ON p.id = l.plan_id WHERE l.license_key_hash = $1',
      [mainLicenseHash]
    );

    const mainLicense = licenseRes.rows[0];
    if (!mainLicense) {
      console.error(`ERROR: Main license key "${MAIN_LICENSE_KEY}" was not found in the database.`);
      console.error('Cleanup aborted to prevent deleting necessary records.');
      client.release();
      await pool.end();
      process.exit(1);
    }

    const mainLicenseId = mainLicense.id;
    const mainTenantId = mainLicense.tenant_id;
    
    // Find customers under main tenant
    let mainUserEmails = [];
    let mainUserIds = [];
    if (mainTenantId) {
      const usersRes = await client.query('SELECT id, email FROM users WHERE tenant_id = $1', [mainTenantId]);
      mainUserIds = usersRes.rows.map(r => r.id);
      mainUserEmails = usersRes.rows.map(r => r.email);
    }

    console.log('------------------------------------------------------------------');
    console.log('                     PROTECTED / KEPT RECORDS');
    console.log('------------------------------------------------------------------');
    console.log(`- Protected License ID:   ${mainLicenseId}`);
    console.log(`- Protected Masked Key:   ${mainLicense.masked_license_key || mainLicense.masked_key}`);
    console.log(`- Protected Plan:         ${mainLicense.plan_name} (${mainLicense.plan_slug})`);
    console.log(`- Protected Tenant ID:     ${mainTenantId || 'Not claimed yet'}`);
    console.log(`- Protected Customer Users: ${mainUserEmails.length > 0 ? mainUserEmails.join(', ') : 'None yet'}`);
    
    // Get all admin users
    const adminsRes = await client.query("SELECT id, email FROM users WHERE role = 'admin'");
    const adminEmails = adminsRes.rows.map(r => r.email);
    console.log(`- Protected Admin Users:    ${adminEmails.join(', ')}`);
    console.log('------------------------------------------------------------------\n');

    // 2. Query target records to be deleted
    // Licenses
    const licensesToDelete = await client.query(
      'SELECT id, masked_key, issued_to_email FROM licenses WHERE id <> $1',
      [mainLicenseId]
    );
    // Tenants
    const tenantsToDelete = mainTenantId 
      ? await client.query('SELECT id, name FROM tenants WHERE id <> $1 AND deleted_at IS NULL', [mainTenantId])
      : await client.query('SELECT id, name FROM tenants WHERE deleted_at IS NULL');
    // Users (exclude main users and admins)
    const usersToDeleteQuery = mainTenantId
      ? "SELECT id, email, role FROM users WHERE tenant_id <> $1 AND role <> 'admin' AND deleted_at IS NULL"
      : "SELECT id, email, role FROM users WHERE role <> 'admin' AND deleted_at IS NULL";
    const usersToDeleteParams = mainTenantId ? [mainTenantId] : [];
    const usersToDelete = await client.query(usersToDeleteQuery, usersToDeleteParams);

    // Support tickets/messages
    const ticketsToDelete = await client.query('SELECT id, subject, customer_email FROM support_tickets');
    const messagesToDelete = await client.query('SELECT id FROM support_messages');
    
    // Demo Requests
    const demosToDelete = await client.query('SELECT id, business_name, email FROM demo_requests');

    // Panel access codes (exclude main tenant/license)
    const codesToDeleteQuery = mainLicenseId
      ? 'SELECT id FROM panel_access_codes WHERE license_id <> $1'
      : 'SELECT id FROM panel_access_codes';
    const codesToDeleteParams = mainLicenseId ? [mainLicenseId] : [];
    const codesToDelete = await client.query(codesToDeleteQuery, codesToDeleteParams);

    // Audit logs (exclude main tenant)
    const auditsToDeleteQuery = mainTenantId
      ? 'SELECT id FROM audit_logs WHERE tenant_id <> $1 OR tenant_id IS NULL'
      : 'SELECT id FROM audit_logs';
    const auditsToDeleteParams = mainTenantId ? [mainTenantId] : [];
    const auditsToDelete = await client.query(auditsToDeleteQuery, auditsToDeleteParams);

    console.log('------------------------------------------------------------------');
    console.log('                 TARGET RECORDS FOR DELETION');
    console.log('------------------------------------------------------------------');
    console.log(`- Licenses to delete:       ${licensesToDelete.rowCount}`);
    if (licensesToDelete.rowCount > 0) {
      console.log('  Examples:');
      licensesToDelete.rows.slice(0, 3).forEach(r => {
        console.log(`    * ID: ${r.id} | Masked Key: ${r.masked_key} | Assigned to: ${r.issued_to_email || 'N/A'}`);
      });
    }
    
    console.log(`- Tenants to delete:        ${tenantsToDelete.rowCount}`);
    if (tenantsToDelete.rowCount > 0) {
      console.log('  Examples:');
      tenantsToDelete.rows.slice(0, 3).forEach(r => {
        console.log(`    * ID: ${r.id} | Name: ${r.name}`);
      });
    }

    console.log(`- Customer Users to delete: ${usersToDelete.rowCount}`);
    if (usersToDelete.rowCount > 0) {
      console.log('  Examples:');
      usersToDelete.rows.slice(0, 3).forEach(r => {
        console.log(`    * ID: ${r.id} | Email: ${r.email} | Role: ${r.role}`);
      });
    }

    console.log(`- Support Tickets to delete: ${ticketsToDelete.rowCount}`);
    if (ticketsToDelete.rowCount > 0) {
      console.log('  Examples:');
      ticketsToDelete.rows.slice(0, 3).forEach(r => {
        console.log(`    * ID: ${r.id} | Subject: ${r.subject} | Contact: ${r.customer_email}`);
      });
    }

    console.log(`- Support Messages to delete: ${messagesToDelete.rowCount}`);
    console.log(`- Demo Requests to delete:   ${demosToDelete.rowCount}`);
    if (demosToDelete.rowCount > 0) {
      console.log('  Examples:');
      demosToDelete.rows.slice(0, 3).forEach(r => {
        console.log(`    * ID: ${r.id} | Business: ${r.business_name} | Email: ${r.email}`);
      });
    }

    console.log(`- Panel Access Codes:       ${codesToDelete.rowCount}`);
    console.log(`- Audit Logs to delete:     ${auditsToDelete.rowCount}`);
    console.log('------------------------------------------------------------------\n');

    if (isApply) {
      console.log('Executing transactional cleanup...');
      await client.query('BEGIN');

      // 1. Delete support messages and tickets
      await client.query('DELETE FROM support_messages');
      await client.query('DELETE FROM support_tickets');
      console.log('✔ Deleted support_messages and support_tickets');

      // 2. Delete demo requests
      await client.query('DELETE FROM demo_requests');
      console.log('✔ Deleted demo_requests');

      // 3. Delete panel access codes
      if (mainLicenseId) {
        await client.query('DELETE FROM panel_access_codes WHERE license_id <> $1', [mainLicenseId]);
      } else {
        await client.query('DELETE FROM panel_access_codes');
      }
      console.log('✔ Deleted panel_access_codes');

      // 4. Delete payments and invoices
      if (mainTenantId) {
        await client.query('DELETE FROM payments WHERE tenant_id <> $1', [mainTenantId]);
        await client.query('DELETE FROM invoices WHERE tenant_id <> $1', [mainTenantId]);
        await client.query('DELETE FROM subscriptions WHERE tenant_id <> $1', [mainTenantId]);
      } else {
        await client.query('DELETE FROM payments');
        await client.query('DELETE FROM invoices');
        await client.query('DELETE FROM subscriptions');
      }
      console.log('✔ Deleted subscriptions, invoices, and payments');

      // 5. Delete audit logs
      if (mainTenantId) {
        await client.query('DELETE FROM audit_logs WHERE tenant_id <> $1 OR tenant_id IS NULL', [mainTenantId]);
      } else {
        await client.query('DELETE FROM audit_logs');
      }
      console.log('✔ Deleted audit_logs');

      // 6. Delete licenses (except mainLicenseId)
      await client.query('DELETE FROM licenses WHERE id <> $1', [mainLicenseId]);
      console.log('✔ Deleted licenses');

      // 7. Delete users (except main user and admin)
      if (mainTenantId) {
        await client.query("DELETE FROM users WHERE tenant_id <> $1 AND role <> 'admin'", [mainTenantId]);
      } else {
        await client.query("DELETE FROM users WHERE role <> 'admin'");
      }
      console.log('✔ Deleted users');

      // 8. Delete tenants (except mainTenantId)
      if (mainTenantId) {
        await client.query('DELETE FROM tenants WHERE id <> $1', [mainTenantId]);
      } else {
        await client.query('DELETE FROM tenants');
      }
      console.log('✔ Deleted tenants');

      await client.query('COMMIT');
      console.log('\n==================================================================');
      console.log('SUCCESS: Transaction committed successfully. Cleanup complete.');
      console.log('==================================================================');
    } else {
      console.log('==================================================================');
      console.log('DRY-RUN COMPLETE: No changes were applied.');
      console.log('==================================================================');
    }
  } catch (error) {
    if (isApply) {
      console.error('ERROR ENCOUNTERED during transaction. Rolling back changes...');
      await client.query('ROLLBACK');
    }
    console.error('Error Details:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
