/**
 * SSL Auto-Renewal Cron Job
 * Runs daily to check and renew SSL certificates expiring soon
 */

import cron from 'node-cron';
import SSLService from '../services/sslService';
import pool from '../db/pool';

/**
 * Check and renew expiring certificates
 */
async function renewExpiringCertificates() {
    try {
        console.log('🔄 [SSL Renewal] Starting daily SSL renewal check...');

        // Get certificates expiring in next 30 days
        const expiring = await SSLService.getExpiringCertificates(30);

        if (expiring.length === 0) {
            console.log('✅ [SSL Renewal] No certificates expiring soon');
            return;
        }

        console.log(`⚠️  [SSL Renewal] Found ${expiring.length} certificate(s) expiring soon`);

        let renewed = 0;
        let failed = 0;

        // Renew each expiring certificate
        for (const domain of expiring) {
            try {
                console.log(`🔒 [SSL Renewal] Renewing certificate for ${domain}...`);

                const success = await SSLService.renewCertificate(domain);

                if (success) {
                    // Get updated certificate info
                    const certInfo = await SSLService.getCertificateInfo(domain);

                    if (certInfo) {
                        // Update expiry date in database
                        await pool.query(
                            'UPDATE domains SET ssl_expires_at = $1 WHERE domain_name = $2',
                            [certInfo.expiresAt, domain]
                        );
                    }

                    renewed++;
                    console.log(`✅ [SSL Renewal] Successfully renewed ${domain}`);
                } else {
                    failed++;
                    console.error(`❌ [SSL Renewal] Failed to renew ${domain}`);
                }
            } catch (error) {
                failed++;
                console.error(`❌ [SSL Renewal] Error renewing ${domain}:`, error);
            }
        }

        console.log(`✅ [SSL Renewal] Renewal complete: ${renewed} renewed, ${failed} failed`);

        // Send notification email to admin if there are failures
        if (failed > 0) {
            // TODO: Implement email notification
            console.warn(`⚠️  [SSL Renewal] ${failed} certificate(s) failed to renew`);
        }
    } catch (error) {
        console.error('❌ [SSL Renewal] Fatal error during renewal:', error);
    }
}

/**
 * Start SSL renewal cron job
 * Runs daily at 2:00 AM
 */
export function startSSLRenewalCron() {
    // Run daily at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
        await renewExpiringCertificates();
    });

    console.log('✅ SSL auto-renewal cron job started (runs daily at 2:00 AM)');
}

/**
 * Manual trigger for testing
 */
export async function triggerSSLRenewal() {
    await renewExpiringCertificates();
}
