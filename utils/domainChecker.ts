/**
 * Domain Checker Utility using DNS Lookup (Google DNS API)
 * Free, no API key required, unlimited queries
 * Docs: https://developers.google.com/speed/public-dns/docs/doh/json
 */

export interface DomainCheckResult {
    status: 'available' | 'taken';
    domain: string;
    price: string;
    registrar?: string;
    createdDate?: string;
    expiryDate?: string;
    suggestions: {
        extension: string;
        price: string;
        status: string;
    }[];
}

/**
 * Extension prices in IDR (Indonesian Rupiah)
 */
const EXTENSION_PRICES: { [key: string]: number } = {
    'com': 165000,
    'id': 245000,
    'co.id': 120000,
    'my.id': 25000,
    'net': 185000,
    'org': 175000,
    'xyz': 35000,
    'online': 45000,
    'site': 38000,
    'store': 55000,
    'tech': 58000,
    'io': 450000,
    'dev': 180000,
};

/**
 * Check domain availability using DNS Lookup (Google DNS API)
 * Free, no API key required, unlimited queries
 */
export async function checkDomainWithDNS(domain: string): Promise<DomainCheckResult> {
    try {
        // Google DNS API - checks for A records (IPv4)
        const url = `https://dns.google/resolve?name=${domain}&type=A`;

        const response = await fetch(url);
        const data = await response.json();

        // Parse extension
        const parts = domain.split('.');
        const domainName = parts[0];
        const extension = parts.slice(1).join('.');

        // Check if domain has DNS records
        let status: 'available' | 'taken' = 'available';

        // If DNS query successful and has Answer section = domain is registered
        if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
            status = 'taken';
        }
        // Status 3 (NXDOMAIN) = domain doesn't exist = available
        else if (data.Status === 3) {
            status = 'available';
        }
        // Status 2 (SERVFAIL) or no Answer = likely available
        else {
            status = 'available';
        }

        // Get price
        const basePrice = EXTENSION_PRICES[extension] || 150000;
        const price = `Rp ${basePrice.toLocaleString('id-ID')}/tahun`;

        // Generate suggestions
        const suggestions = generateSuggestions(domainName, extension);

        // For DNS lookup, we don't have registrar info
        return {
            status,
            domain,
            price,
            suggestions,
        };
    } catch (error) {
        console.error('DNS Lookup Error:', error);
        throw error;
    }
}

/**
 * Simulate domain check (fallback when API key not available)
 */
export function checkDomainSimulation(domain: string): DomainCheckResult {
    const parts = domain.split('.');
    const domainName = parts[0];
    const extension = parts.slice(1).join('.');

    // List domain populer yang pasti sudah terdaftar
    const popularDomains = [
        'google', 'facebook', 'instagram', 'twitter', 'youtube', 'amazon',
        'netflix', 'microsoft', 'apple', 'tokopedia', 'bukalapak', 'shopee',
        'gojek', 'grab', 'traveloka', 'tiket', 'blibli', 'lazada'
    ];

    // Tentukan status berdasarkan kriteria realistis
    let status: 'available' | 'taken' = 'available';

    // Domain pendek (< 5 karakter) atau populer = taken
    if (domainName.length < 5 || popularDomains.includes(domainName.toLowerCase())) {
        status = 'taken';
    }

    // Domain dengan kata umum = taken
    const commonWords = ['shop', 'store', 'web', 'net', 'online', 'digital', 'tech'];
    if (commonWords.some(word => domainName.toLowerCase() === word)) {
        status = 'taken';
    }

    const basePrice = EXTENSION_PRICES[extension] || 150000;
    const price = `Rp ${basePrice.toLocaleString('id-ID')}/tahun`;

    const suggestions = generateSuggestions(domainName, extension);

    return {
        status,
        domain,
        price,
        suggestions,
    };
}

/**
 * Generate alternative domain suggestions
 */
function generateSuggestions(
    domainName: string,
    currentExtension: string
): Array<{ extension: string; price: string; status: string }> {
    const alternativeExtensions = ['com', 'id', 'co.id', 'net', 'org', 'xyz', 'online'];

    return alternativeExtensions
        .filter(ext => ext !== currentExtension)
        .slice(0, 3)
        .map(ext => ({
            extension: `${domainName}.${ext}`,
            price: `Rp ${(EXTENSION_PRICES[ext] || 150000).toLocaleString('id-ID')}/tahun`,
            status: Math.random() > 0.5 ? 'available' : 'taken'
        }));
}

/**
 * Main domain checker function with DNS Lookup and fallback to simulation
 */
export async function checkDomain(domain: string): Promise<DomainCheckResult> {
    const useSimulation = import.meta.env.VITE_USE_SIMULATION === 'true';

    // Use simulation if explicitly enabled
    if (useSimulation) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return checkDomainSimulation(domain);
    }

    // Try DNS Lookup first (real domain check)
    try {
        return await checkDomainWithDNS(domain);
    } catch (error) {
        console.warn('DNS Lookup failed, falling back to simulation:', error);
        // Fallback to simulation if DNS fails
        await new Promise(resolve => setTimeout(resolve, 1500));
        return checkDomainSimulation(domain);
    }
}
