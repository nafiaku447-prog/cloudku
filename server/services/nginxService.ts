/**
 * Nginx Service - Web Server Configuration Management
 * Auto-generates and manages Nginx virtual host configurations
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

interface VHostConfig {
    domainName: string;
    userName: string;
    documentRoot: string;
    phpVersion?: string;
    sslEnabled?: boolean;
    sslCertPath?: string;
    sslKeyPath?: string;
    sslChainPath?: string;
}

export class NginxService {
    private static NGINX_SITES_AVAILABLE = '/etc/nginx/sites-available';
    private static NGINX_SITES_ENABLED = '/etc/nginx/sites-enabled';
    private static TEMPLATE_DIR = path.join(__dirname, '../templates');

    /**
     * Generate Nginx virtual host configuration
     */
    static async generateVHost(config: VHostConfig): Promise<string> {
        try {
            // Select template based on SSL status
            const templateFile = config.sslEnabled ? 'nginx-vhost-ssl.conf' : 'nginx-vhost.conf';
            const templatePath = path.join(this.TEMPLATE_DIR, templateFile);

            // Read template
            let template = await fs.readFile(templatePath, 'utf-8');

            // Replace placeholders
            template = template.replace(/{{DOMAIN_NAME}}/g, config.domainName);
            template = template.replace(/{{USER_NAME}}/g, config.userName);
            template = template.replace(/{{DOCUMENT_ROOT}}/g, config.documentRoot);
            template = template.replace(/{{PHP_VERSION}}/g, config.phpVersion || '8.1');
            template = template.replace(/{{TIMESTAMP}}/g, new Date().toISOString());

            // SSL specific replacements
            if (config.sslEnabled) {
                template = template.replace(/{{SSL_CERT_PATH}}/g, config.sslCertPath || '');
                template = template.replace(/{{SSL_KEY_PATH}}/g, config.sslKeyPath || '');
                template = template.replace(/{{SSL_CHAIN_PATH}}/g, config.sslChainPath || '');
            }

            return template;
        } catch (error) {
            console.error('Generate vhost error:', error);
            throw new Error('Failed to generate Nginx configuration');
        }
    }

    /**
     * Write virtual host configuration to Nginx directory
     */
    static async writeVHost(domainName: string, config: string): Promise<void> {
        try {
            // Skip on Windows (development)
            if (process.platform === 'win32') {
                console.log('ℹ️  Skipping Nginx config write (Windows development mode)');
                // Save to local directory for reference
                const localPath = path.join(__dirname, '../../.nginx-configs');
                await fs.mkdir(localPath, { recursive: true });
                await fs.writeFile(path.join(localPath, `${domainName}.conf`), config);
                console.log(`✅ Nginx config saved to: .nginx-configs/${domainName}.conf`);
                return;
            }

            const configPath = path.join(this.NGINX_SITES_AVAILABLE, domainName);

            // Write configuration file
            await fs.writeFile(configPath, config);
            console.log(`✅ Nginx config written: ${configPath}`);
        } catch (error: any) {
            if (error.code === 'EACCES') {
                throw new Error('Permission denied. Run with sudo or check Nginx directory permissions.');
            }
            throw error;
        }
    }

    /**
     * Enable virtual host (create symlink to sites-enabled)
     */
    static async enableVHost(domainName: string): Promise<void> {
        try {
            // Skip on Windows
            if (process.platform === 'win32') {
                console.log('ℹ️  Skipping Nginx enable (Windows development mode)');
                return;
            }

            const availablePath = path.join(this.NGINX_SITES_AVAILABLE, domainName);
            const enabledPath = path.join(this.NGINX_SITES_ENABLED, domainName);

            // Check if already enabled
            try {
                await fs.access(enabledPath);
                console.log(`ℹ️  Site already enabled: ${domainName}`);
                return;
            } catch {
                // Not enabled yet, create symlink
            }

            // Create symlink
            await fs.symlink(availablePath, enabledPath);
            console.log(`✅ Site enabled: ${domainName}`);
        } catch (error) {
            console.error('Enable vhost error:', error);
            throw new Error('Failed to enable Nginx site');
        }
    }

    /**
     * Disable virtual host (remove symlink from sites-enabled)
     */
    static async disableVHost(domainName: string): Promise<void> {
        try {
            // Skip on Windows
            if (process.platform === 'win32') {
                console.log('ℹ️  Skipping Nginx disable (Windows development mode)');
                return;
            }

            const enabledPath = path.join(this.NGINX_SITES_ENABLED, domainName);

            await fs.unlink(enabledPath);
            console.log(`✅ Site disabled: ${domainName}`);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                console.log(`ℹ️  Site was not enabled: ${domainName}`);
                return;
            }
            throw error;
        }
    }

    /**
     * Delete virtual host configuration
     */
    static async deleteVHost(domainName: string): Promise<void> {
        try {
            // Disable first
            await this.disableVHost(domainName);

            // Skip deletion on Windows (just remove from local)
            if (process.platform === 'win32') {
                const localPath = path.join(__dirname, '../../.nginx-configs', `${domainName}.conf`);
                try {
                    await fs.unlink(localPath);
                    console.log(`✅ Local config deleted: ${domainName}`);
                } catch {
                    // Ignore if doesn't exist
                }
                return;
            }

            // Delete from sites-available
            const availablePath = path.join(this.NGINX_SITES_AVAILABLE, domainName);
            await fs.unlink(availablePath);
            console.log(`✅ Nginx config deleted: ${domainName}`);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                console.log(`ℹ️  Config file not found: ${domainName}`);
                return;
            }
            throw error;
        }
    }

    /**
     * Test Nginx configuration syntax
     */
    static async testConfig(): Promise<{ valid: boolean; output: string }> {
        try {
            // Skip on Windows
            if (process.platform === 'win32') {
                return { valid: true, output: 'Skipped (Windows)' };
            }

            const { stdout, stderr } = await execAsync('nginx -t');
            const output = stdout + stderr;

            return {
                valid: output.includes('syntax is ok') && output.includes('test is successful'),
                output
            };
        } catch (error: any) {
            return {
                valid: false,
                output: error.message
            };
        }
    }

    /**
     * Reload Nginx to apply changes
     */
    static async reload(): Promise<boolean> {
        try {
            // Skip on Windows
            if (process.platform === 'win32') {
                console.log('ℹ️  Skipping Nginx reload (Windows development mode)');
                return true;
            }

            // Test config first
            const test = await this.testConfig();
            if (!test.valid) {
                throw new Error(`Nginx configuration test failed: ${test.output}`);
            }

            // Reload Nginx
            await execAsync('systemctl reload nginx || service nginx reload');
            console.log('✅ Nginx reloaded successfully');
            return true;
        } catch (error) {
            console.error('Nginx reload error:', error);
            return false;
        }
    }

    /**
     * Get Nginx status
     */
    static async getStatus(): Promise<{
        installed: boolean;
        running: boolean;
        version?: string;
    }> {
        try {
            // Check Windows
            if (process.platform === 'win32') {
                return { installed: false, running: false };
            }

            // Check if Nginx is installed
            const { stdout: versionOutput } = await execAsync('nginx -v 2>&1 || echo "not installed"');
            const installed = !versionOutput.includes('not installed');

            if (!installed) {
                return { installed: false, running: false };
            }

            // Check if running
            const { stdout: statusOutput } = await execAsync('systemctl is-active nginx 2>&1 || echo "inactive"');
            const running = statusOutput.trim() === 'active';

            // Extract version
            const versionMatch = versionOutput.match(/nginx\/(\d+\.\d+\.\d+)/);
            const version = versionMatch ? versionMatch[1] : undefined;

            return { installed, running, version };
        } catch (error) {
            return { installed: false, running: false };
        }
    }

    /**
     * Create complete virtual host (all-in-one)
     */
    static async createVirtualHost(config: VHostConfig): Promise<void> {
        try {
            // Generate config
            const vhostConfig = await this.generateVHost(config);

            // Write config
            await this.writeVHost(config.domainName, vhostConfig);

            // Enable site
            await this.enableVHost(config.domainName);

            // Test config
            const test = await this.testConfig();
            if (!test.valid) {
                // Rollback
                await this.deleteVHost(config.domainName);
                throw new Error(`Nginx test failed: ${test.output}`);
            }

            // Reload Nginx
            const reloaded = await this.reload();
            if (!reloaded) {
                console.warn('⚠️  Nginx reload failed, changes may not be applied');
            }

            console.log(`✅ Virtual host created successfully: ${config.domainName}`);
        } catch (error) {
            console.error('Create virtual host error:', error);
            throw error;
        }
    }

    /**
     * Update virtual host (regenerate and reload)
     */
    static async updateVirtualHost(config: VHostConfig): Promise<void> {
        try {
            // Delete old config
            await this.deleteVHost(config.domainName);

            // Create new config
            await this.createVirtualHost(config);

            console.log(`✅ Virtual host updated: ${config.domainName}`);
        } catch (error) {
            console.error('Update virtual host error:', error);
            throw error;
        }
    }
}

export default NginxService;
