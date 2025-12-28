import React, { useEffect, useState } from 'react';
import { getWebsites, getDomains, getEmails, getDatabases } from '../../utils/hostingApi';
import { useNavigate } from 'react-router-dom';

const DashboardHome: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        websites: 0,
        domains: 0,
        emails: 0,
        databases: 0,
        storage: '0 GB',
        bandwidth: '0 GB'
    });
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');

        const fetchStats = async () => {
            try {
                const [websitesRes, domainsRes, emailsRes, databasesRes] = await Promise.all([
                    getWebsites().catch(() => ({ success: false, data: [] })),
                    getDomains().catch(() => ({ success: false, data: [] })),
                    getEmails().catch(() => ({ success: false, data: [] })),
                    getDatabases().catch(() => ({ success: false, data: [] }))
                ]);

                setStats({
                    websites: websitesRes.success ? websitesRes.data.length : 0,
                    domains: domainsRes.success ? domainsRes.data.length : 0,
                    emails: emailsRes.success ? emailsRes.data.length : 0,
                    databases: databasesRes.success ? databasesRes.data.length : 0,
                    storage: '2.4 GB',
                    bandwidth: '48.3 GB'
                });
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-[#5865F2] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-[#5865F2] to-[#4F46E5] rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">{greeting}! 👋</h1>
                        <p className="text-blue-100">Welcome to your hosting control panel</p>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-blue-100">Status</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                <span className="font-semibold">All Systems Operational</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts & Notifications - NEW! */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-orange-900 text-sm">Domain Expiring Soon</p>
                            <p className="text-sm text-orange-700 mt-1">example.com expires in 15 days</p>
                            <button onClick={() => navigate('/domains')} className="text-xs text-orange-600 hover:underline font-medium mt-2">
                                Renew Now →
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-blue-900 text-sm">Storage Reaching Limit</p>
                            <p className="text-sm text-blue-700 mt-1">Using 24% of available storage</p>
                            <button onClick={() => navigate('/files')} className="text-xs text-blue-600 hover:underline font-medium mt-2">
                                Manage Files →
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div
                    onClick={() => navigate('/hosting')}
                    className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            Active
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Websites</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.websites}</p>
                    <p className="text-xs text-gray-500 mt-2">Click to manage</p>
                </div>

                <div
                    onClick={() => navigate('/domains')}
                    className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:border-green-300 transition-all cursor-pointer"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                            </svg>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Secured</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Domains</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.domains}</p>
                    <p className="text-xs text-gray-500 mt-2">All SSL protected</p>
                </div>

                <div
                    onClick={() => navigate('/email')}
                    className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:border-orange-300 transition-all cursor-pointer"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">Connected</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Email Accounts</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.emails}</p>
                    <p className="text-xs text-gray-500 mt-2">Professional emails</p>
                </div>

                <div
                    onClick={() => navigate('/databases')}
                    className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:border-purple-300 transition-all cursor-pointer"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                            </svg>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Optimized</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Databases</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.databases}</p>
                    <p className="text-xs text-gray-500 mt-2">MySQL & PostgreSQL</p>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recommended Actions - NEW! */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Recommended Actions</h2>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">3 pending</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 text-sm">Enable Two-Factor Authentication</p>
                                    <p className="text-xs text-gray-600 mt-1">Secure your account with 2FA for better protection</p>
                                </div>
                                <button className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap">Enable →</button>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer" onClick={() => navigate('/ssl')}>
                                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 text-sm">Install SSL on testsite.com</p>
                                    <p className="text-xs text-gray-600 mt-1">Free Let's Encrypt SSL available now</p>
                                </div>
                                <button className="text-xs text-green-600 hover:underline font-medium whitespace-nowrap">Install →</button>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 text-sm">Enable Automatic Backups</p>
                                    <p className="text-xs text-gray-600 mt-1">Protect your data with daily automated backups</p>
                                </div>
                                <button className="text-xs text-purple-600 hover:underline font-medium whitespace-nowrap">Setup →</button>
                            </div>
                        </div>
                    </div>

                    {/* Server Monitoring - NEW! */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Server Monitoring</h2>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Live
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Server 1 - Cyber-01 (Greencloud) */}
                            <div className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                        <div>
                                            <h3 className="text-gray-900 font-bold text-sm">Cyber-01 (Greencloud)</h3>
                                            <p className="text-gray-500 text-xs">16.28.38.45</p>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* CPU */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700">CPU</span>
                                            </div>
                                            <span className="text-sm font-bold text-green-600">18.30%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                            <div className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full" style={{ width: '18.30%' }}></div>
                                        </div>
                                    </div>

                                    {/* RAM */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700">RAM</span>
                                            </div>
                                            <span className="text-sm font-bold text-blue-600">20.48%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full" style={{ width: '20.48%' }}></div>
                                        </div>
                                    </div>

                                    {/* Disk */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700">Disk</span>
                                            </div>
                                            <span className="text-sm font-bold text-purple-600">51.68%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                            <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full" style={{ width: '51.68%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Server 2 - Kangserver */}
                            <div className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                        <div>
                                            <h3 className="text-gray-900 font-bold text-sm">Kangserver</h3>
                                            <p className="text-gray-500 text-xs">172.16.254.89</p>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* CPU */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700">CPU</span>
                                            </div>
                                            <span className="text-sm font-bold text-green-600">99.92%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                            <div className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full" style={{ width: '99.92%' }}></div>
                                        </div>
                                    </div>

                                    {/* RAM */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700">RAM</span>
                                            </div>
                                            <span className="text-sm font-bold text-blue-600">64.20%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full" style={{ width: '64.20%' }}></div>
                                        </div>
                                    </div>

                                    {/* Disk */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700">Disk</span>
                                            </div>
                                            <span className="text-sm font-bold text-purple-600">81.12%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                            <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full" style={{ width: '81.12%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
                            <span className="text-xs text-gray-500">Most used features</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => navigate('/hosting')}
                                className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Create Website</h3>
                                    <p className="text-xs text-gray-600">Deploy in seconds</p>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/domains')}
                                className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all text-left group"
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Register Domain</h3>
                                    <p className="text-xs text-gray-600">Find perfect name</p>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/ssl')}
                                className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all text-left group"
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Install SSL</h3>
                                    <p className="text-xs text-gray-600">Free Let's Encrypt</p>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/support')}
                                className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-all text-left group"
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Get Support</h3>
                                    <p className="text-xs text-gray-600">24/7 expert help</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                            <button className="text-sm text-[#5865F2] hover:underline font-medium">View All</button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            <div className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">Website deployed successfully</p>
                                        <p className="text-sm text-gray-600 mt-1">example.com is now live and accessible to visitors</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-gray-500">2 hours ago</span>
                                            <span className="text-xs text-gray-300">•</span>
                                            <span className="text-xs font-medium text-green-600">Success</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">SSL certificate installed</p>
                                        <p className="text-sm text-gray-600 mt-1">mywebsite.com secured with Let's Encrypt certificate</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-gray-500">5 hours ago</span>
                                            <span className="text-xs text-gray-300">•</span>
                                            <span className="text-xs font-medium text-blue-600">Security</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">Database backup completed</p>
                                        <p className="text-sm text-gray-600 mt-1">wp_production backed up successfully (2.1 GB)</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-gray-500">1 day ago</span>
                                            <span className="text-xs text-gray-300">•</span>
                                            <span className="text-xs font-medium text-purple-600">Backup</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Upcoming Renewals - NEW! */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Upcoming Renewals</h3>
                        <div className="space-y-3">
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-900">example.com</span>
                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">15 days</span>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">Domain expires Feb 12, 2025</p>
                                <button onClick={() => navigate('/domains')} className="text-xs text-orange-600 hover:underline font-medium">Renew Now →</button>
                            </div>

                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-900">SSL Certificate</span>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">30 days</span>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">Auto-renew enabled</p>
                                <button onClick={() => navigate('/ssl')} className="text-xs text-blue-600 hover:underline font-medium">View Details →</button>
                            </div>

                            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-900">Premium Plan</span>
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">12 days</span>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">Next billing: Feb 9, 2025</p>
                                <button onClick={() => navigate('/billing')} className="text-xs text-purple-600 hover:underline font-medium">Manage Billing →</button>
                            </div>
                        </div>
                    </div>

                    {/* Account Info */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Account Overview</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                                <p className="text-xs text-gray-600 mb-1">Current Plan</p>
                                <p className="text-xl font-bold text-gray-900">Premium</p>
                                <div className="mt-3 pt-3 border-t border-blue-200">
                                    <p className="text-xs text-gray-600 mb-1">Monthly Cost</p>
                                    <p className="text-lg font-bold text-gray-900">$29.99</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/billing')}
                                className="w-full px-4 py-2.5 bg-[#5865F2] text-white text-sm font-semibold rounded-lg hover:bg-[#4F46E5] transition-colors shadow-lg hover:shadow-xl"
                            >
                                Manage Billing
                            </button>
                        </div>
                    </div>

                    {/* Resource Usage */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Resource Usage</h3>
                        <div className="space-y-5">
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-medium text-gray-700">Storage</span>
                                    <span className="text-sm font-bold text-gray-900">{stats.storage}</span>
                                </div>
                                <div className="relative w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full" style={{ width: '24%' }}></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">24% of 10 GB • 7.6 GB available</p>
                            </div>
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-medium text-gray-700">Bandwidth</span>
                                    <span className="text-sm font-bold text-gray-900">{stats.bandwidth}</span>
                                </div>
                                <div className="relative w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full" style={{ width: '48%' }}></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">48% of 100 GB • 52 GB available</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Quick Links</h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => navigate('/files')}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                File Manager
                            </button>
                            <button
                                onClick={() => navigate('/billing')}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Billing & Invoices
                            </button>
                            <button
                                onClick={() => navigate('/support')}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                Support Tickets
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
