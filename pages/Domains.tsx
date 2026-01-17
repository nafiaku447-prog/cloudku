import React, { useState, useEffect } from 'react';
import ProtectedDashboard from '../components/ProtectedDashboard';
import toast, { Toaster } from 'react-hot-toast';
import { getToken } from '../utils/authApi';
import { getApiUrl } from '../utils/api';

interface Domain {
    id: number;
    domain_name: string;
    status: string;
    document_root: string;
    ssl_enabled: boolean;
    ssl_provider: string | null;
    ssl_expires_at: string | null;
    verified_at: string | null;
    created_at: string;
    dns_records_count: number;
    aliases_count: number;
}

interface DNSRecord {
    id: number;
    record_type: string;
    name: string;
    value: string;
    ttl: number;
    priority: number | null;
}

const Domains: React.FC = () => {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDNSModal, setShowDNSModal] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
    const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);

    // Form states
    const [newDomain, setNewDomain] = useState('');
    const [newDNSRecord, setNewDNSRecord] = useState({
        record_type: 'A',
        name: '@',
        value: '',
        ttl: 3600,
        priority: null as number | null
    });

    useEffect(() => {
        loadDomains();
    }, []);

    const loadDomains = async () => {
        try {
            const token = getToken();
            const response = await fetch(getApiUrl('/domains'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setDomains(data.domains);
            } else {
                toast.error(data.message || 'Failed to load domains');
            }
        } catch (error) {
            toast.error('Failed to load domains');
        } finally {
            setLoading(false);
        }
    };

    const handleAddDomain = async () => {
        if (!newDomain.trim()) {
            toast.error('Please enter a domain name');
            return;
        }

        try {
            const token = getToken();
            const response = await fetch(getApiUrl('/domains'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ domain_name: newDomain.toLowerCase() })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Domain added successfully! 🎉');
                setShowAddModal(false);
                setNewDomain('');
                loadDomains();
            } else {
                toast.error(data.message || 'Failed to add domain');
            }
        } catch (error) {
            toast.error('Failed to add domain');
        }
    };

    const handleDeleteDomain = async (id: number, domainName: string) => {
        if (!confirm(`Are you sure you want to delete ${domainName}?`)) return;

        try {
            const token = getToken();
            const response = await fetch(getApiUrl(`/domains/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Domain deleted successfully');
                loadDomains();
            } else {
                toast.error(data.message || 'Failed to delete domain');
            }
        } catch (error) {
            toast.error('Failed to delete domain');
        }
    };

    const handleVerifyDomain = async (id: number) => {
        try {
            const token = getToken();
            const response = await fetch(getApiUrl(`/domains/${id}/verify`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Domain verified! ✓');
                loadDomains();
            } else {
                toast.error(data.message || 'Verification failed');
            }
        } catch (error) {
            toast.error('Failed to verify domain');
        }
    };

    const loadDNSRecords = async (domainId: number) => {
        try {
            const token = getToken();
            const response = await fetch(getApiUrl(`/domains/${domainId}/dns`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setDnsRecords(data.records);
            }
        } catch (error) {
            toast.error('Failed to load DNS records');
        }
    };

    const handleAddDNSRecord = async () => {
        if (!selectedDomain || !newDNSRecord.value.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const token = getToken();
            const response = await fetch(getApiUrl(`/domains/${selectedDomain.id}/dns`), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newDNSRecord)
            });

            const data = await response.json();

            if (data.success) {
                toast.success('DNS record added!');
                setNewDNSRecord({
                    record_type: 'A',
                    name: '@',
                    value: '',
                    ttl: 3600,
                    priority: null
                });
                loadDNSRecords(selectedDomain.id);
            } else {
                toast.error(data.message || 'Failed to add DNS record');
            }
        } catch (error) {
            toast.error('Failed to add DNS record');
        }
    };

    const handleDeleteDNSRecord = async (recordId: number) => {
        if (!selectedDomain) return;

        try {
            const token = getToken();
            const response = await fetch(getApiUrl(`/domains/${selectedDomain.id}/dns/${recordId}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success) {
                toast.success('DNS record deleted');
                loadDNSRecords(selectedDomain.id);
            }
        } catch (error) {
            toast.error('Failed to delete DNS record');
        }
    };

    const handleToggleSSL = async (domain: Domain) => {
        const action = domain.ssl_enabled ? 'disable' : 'enable';
        if (action === 'disable' && !confirm(`Disable SSL for ${domain.domain_name}?`)) return;

        try {
            const token = getToken();
            const loadingToast = toast.loading(`${action === 'enable' ? 'Enabling' : 'Disabling'} SSL... (This may take a few seconds)`);

            const response = await fetch(getApiUrl(`/ssl/${domain.id}/${action}`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            toast.dismiss(loadingToast);

            if (data.success) {
                toast.success(`SSL ${action}d successfully`);
                loadDomains();
            } else {
                toast.error(data.message || `Failed to ${action} SSL`);
            }
        } catch (error) {
            toast.dismiss();
            toast.error(`Failed to ${action} SSL`);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            active: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            suspended: 'bg-red-100 text-red-700',
            expired: 'bg-gray-100 text-gray-700'
        };
        return styles[status as keyof typeof styles] || styles.pending;
    };

    if (loading) {
        return (
            <ProtectedDashboard>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-[#5865F2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading domains...</p>
                    </div>
                </div>
            </ProtectedDashboard>
        );
    }

    const activeDomains = domains.filter(d => d.status === 'active').length;
    const sslEnabled = domains.filter(d => d.ssl_enabled).length;
    const totalDNSRecords = domains.reduce((acc, d) => acc + (d.dns_records_count || 0), 0);

    return (
        <ProtectedDashboard>
            <Toaster position="top-right" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Domain Management</h1>
                        <p className="text-gray-600 mt-1">Manage your domains, DNS records, and SSL certificates</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-[#5865F2] to-[#4F46E5] text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Domain
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Domains</p>
                                <p className="text-2xl font-bold text-gray-900">{domains.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#5865F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Active Domains</p>
                                <p className="text-2xl font-bold text-gray-900">{activeDomains}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">SSL Enabled</p>
                                <p className="text-2xl font-bold text-gray-900">{sslEnabled}</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">DNS Records</p>
                                <p className="text-2xl font-bold text-gray-900">{totalDNSRecords}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Domains Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900">Your Domains</h2>
                    </div>

                    {domains.length === 0 ? (
                        <div className="p-12 text-center">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No domains yet</h3>
                            <p className="text-gray-600 mb-4">Add your first domain to get started</p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-6 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4F46E5] transition-colors"
                            >
                                Add Domain
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Domain Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">DNS Records</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SSL</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {domains.map((domain) => (
                                        <tr key={domain.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-[#5865F2] to-[#4F46E5] rounded-lg flex items-center justify-center text-white">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                        </svg>
                                                    </div>
                                                    <div className="font-semibold text-gray-900">{domain.domain_name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusBadge(domain.status)}`}>
                                                    {domain.status.charAt(0).toUpperCase() + domain.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{domain.dns_records_count || 0} records</td>
                                            <td className="px-6 py-4">
                                                {domain.ssl_enabled ? (
                                                    <span className="inline-flex items-center gap-1 text-green-700">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                        </svg>
                                                        <span className="text-xs font-medium">Enabled</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-500">Not enabled</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(domain.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleSSL(domain)}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${domain.ssl_enabled
                                                                ? 'text-orange-600 hover:bg-orange-50'
                                                                : 'text-gray-600 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {domain.ssl_enabled ? 'Disable SSL' : 'Enable SSL'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedDomain(domain);
                                                            setShowDNSModal(true);
                                                            loadDNSRecords(domain.id);
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-medium text-[#5865F2] hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        Manage DNS
                                                    </button>
                                                    {domain.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleVerifyDomain(domain.id)}
                                                            className="px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        >
                                                            Verify
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteDomain(domain.id, domain.domain_name)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-[#5865F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">SSL Certificates</h3>
                                <p className="text-sm text-gray-600">Manage SSL/TLS certificates for HTTPS</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">DNS Management</h3>
                                <p className="text-sm text-gray-600">Configure DNS records for your domains</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Subdomains</h3>
                                <p className="text-sm text-gray-600">Create and manage subdomains</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Domain Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Domain</h3>
                            <input
                                type="text"
                                placeholder="example.com"
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-4 text-gray-900 bg-white"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddDomain}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add Domain
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* DNS Modal */}
                {showDNSModal && selectedDomain && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDNSModal(false)}>
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-gray-900">DNS Records - {selectedDomain.domain_name}</h3>
                                    <button onClick={() => setShowDNSModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Add DNS Record Form */}
                                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                    <h4 className="font-semibold text-gray-900 mb-4">Add DNS Record</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <select
                                            value={newDNSRecord.record_type}
                                            onChange={(e) => setNewDNSRecord({ ...newDNSRecord, record_type: e.target.value })}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
                                        >
                                            <option value="A">A</option>
                                            <option value="AAAA">AAAA</option>
                                            <option value="CNAME">CNAME</option>
                                            <option value="MX">MX</option>
                                            <option value="TXT">TXT</option>
                                            <option value="NS">NS</option>
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Name (@ for root)"
                                            value={newDNSRecord.name}
                                            onChange={(e) => setNewDNSRecord({ ...newDNSRecord, name: e.target.value })}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Value (IP or target)"
                                            value={newDNSRecord.value}
                                            onChange={(e) => setNewDNSRecord({ ...newDNSRecord, value: e.target.value })}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none md:col-span-2 text-gray-900 bg-white"
                                        />
                                        <input
                                            type="number"
                                            placeholder="TTL (seconds)"
                                            value={newDNSRecord.ttl}
                                            onChange={(e) => setNewDNSRecord({ ...newDNSRecord, ttl: parseInt(e.target.value) })}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
                                        />
                                        <button
                                            onClick={handleAddDNSRecord}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add Record
                                        </button>
                                    </div>
                                </div>

                                {/* DNS Records Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Value</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">TTL</th>
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dnsRecords.map((record) => (
                                                <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                            {record.record_type}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-900 font-mono">{record.name}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 font-mono truncate max-w-xs">{record.value}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">{record.ttl}s</td>
                                                    <td className="py-3 px-4 text-right">
                                                        <button
                                                            onClick={() => handleDeleteDNSRecord(record.id)}
                                                            className="text-red-600 hover:text-red-700 p-1"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedDashboard>
    );
};

export default Domains;
