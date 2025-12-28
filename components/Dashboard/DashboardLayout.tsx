import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { removeToken, isAuthenticated } from '../../utils/authApi';
import ThemeToggle from '../ThemeToggle';


interface DashboardLayoutProps {
    children: React.ReactNode;
    userName?: string;
    userEmail?: string;
    userPicture?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    userName = 'User',
    userEmail = '',
    userPicture
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navigate = useNavigate();
    const location = useLocation();
    const activeMenu = location.pathname === '/dashboard' ? 'dashboard' : location.pathname.split('/')[1];

    const handleLogout = () => {
        removeToken();
        window.location.href = '/';
    };

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
            path: '/dashboard'
        },
        {
            id: 'hosting',
            label: 'Hosting',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2-2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>,
            path: '/hosting',

        },
        {
            id: 'domains',
            label: 'Domains',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
            path: '/domains'
        },
        {
            id: 'email',
            label: 'Email',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
            path: '/email'
        },
        {
            id: 'files',
            label: 'File Manager',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
            path: '/files'
        },
        {
            id: 'databases',
            label: 'Databases',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
            path: '/databases'
        },
        {
            id: 'ssl',
            label: 'SSL Certificate',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
            path: '/ssl'
        },
        {
            id: 'billing',
            label: 'Billing',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
            path: '/billing'
        },
        {
            id: 'support',
            label: 'Support',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
            path: '/support'
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation Bar - Enhanced */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo & Menu Toggle */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-[#5865F2] to-[#4F46E5] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <span className="text-white font-bold text-lg">H</span>
                                </div>
                                <div className="hidden sm:block">
                                    <div className="font-bold text-lg text-gray-900">HostModern</div>
                                    <div className="text-xs text-gray-500 -mt-0.5">Control Panel</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side Menu */}
                        <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="text-sm text-gray-500">Search...</span>
                                <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs text-gray-600">⌘K</kbd>
                            </div>

                            {/* Notifications */}
                            <button className="relative p-2.5 rounded-lg hover:bg-gray-100 transition-colors">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                            </button>

                            {/* Dark Mode Toggle */}
                            <ThemeToggle />

                            {/* User Profile */}
                            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                                <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                                    {userPicture ? (
                                        <img
                                            src={userPicture}
                                            alt={userName}
                                            className="w-8 h-8 rounded-lg ring-2 ring-blue-100 object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5865F2] to-[#4F46E5] flex items-center justify-center ring-2 ring-blue-100">
                                            <span className="text-white font-semibold text-sm">
                                                {userName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="hidden lg:block">
                                        <div className="text-sm font-semibold text-gray-900">{userName}</div>
                                        <div className="text-xs text-gray-500 -mt-0.5">{userEmail}</div>
                                    </div>
                                    <svg className="w-4 h-4 text-gray-400 hidden lg:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex">
                {/* Sidebar - Enhanced */}
                <aside className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 
          transition-transform duration-300 ease-in-out mt-16 lg:mt-0
          overflow-y-auto
        `}>
                    <div className="p-4 space-y-6">
                        {/* Plan Card - More Professional */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-[#5865F2] via-[#4F46E5] to-[#3B3DBF] rounded-2xl p-5 text-white shadow-xl shadow-blue-500/20">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8"></div>
                            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full -ml-4 -mb-4"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-medium text-blue-100 uppercase tracking-wider">Current Plan</span>
                                    <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs font-bold">Active</span>
                                </div>
                                <div className="text-2xl font-bold mb-1">Premium</div>
                                <div className="text-xs text-blue-100 mb-4">Expires: Dec 27, 2025</div>
                                <button className="w-full py-2.5 bg-white text-[#5865F2] rounded-xl text-sm font-semibold hover:bg-blue-50 transition-all shadow-lg">
                                    Upgrade Now
                                </button>
                            </div>
                        </div>

                        {/* Navigation Menu - Enhanced */}
                        <nav className="space-y-1">
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
                                Main Menu
                            </div>
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => navigate(item.path)}
                                    className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group
                    ${activeMenu === item.id
                                            ? 'bg-blue-50 text-[#5865F2] font-semibold shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }
                  `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`${activeMenu === item.id ? 'text-[#5865F2]' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`}>
                                            {item.icon}
                                        </div>
                                        <span className="text-sm">{item.label}</span>
                                    </div>
                                    {item.badge && (
                                        <span className="px-2 py-0.  bg-[#10B981] text-white text-[10px] font-bold rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>

                        {/* Help Card - Enhanced */}
                        <div className="pt-4 border-t border-gray-200">
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm text-gray-900 mb-1">
                                            Need Help?
                                        </div>
                                        <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                                            Our support team is available 24/7 to assist you
                                        </p>
                                        <button className="text-xs font-semibold text-[#5865F2] hover:text-[#4F46E5] flex items-center gap-1">
                                            Contact Support
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 lg:p-8 min-h-screen bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default DashboardLayout;
