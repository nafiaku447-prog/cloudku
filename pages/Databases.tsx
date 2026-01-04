import React, { useState, useEffect } from 'react';
import ProtectedDashboard from '../components/ProtectedDashboard';
import toast, { Toaster } from 'react-hot-toast';
import { getToken } from '../utils/authApi';

interface Database {
    id: number;
    database_name: string;
    database_type: string;
    database_user: string;
    current_size_mb: number;
    max_size_mb: number;
    status: string;
    created_at: string;
}

interface DatabaseStats {
    total: number;
    mysql: number;
    postgresql: number;
    totalSizeMB: number;
}

const Databases: React.FC = () => {
    const [databases, setDatabases] = useState<Database[]>([]);
    const [stats, setStats] = useState<DatabaseStats>({ total: 0, mysql: 0, postgresql: 0, totalSizeMB: 0 });
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);

    // Form states
    const [newDatabase, setNewDatabase] = useState({
        databaseName: '',
        databaseUser: '',
        databasePassword: '',
        databaseType: 'mysql' as 'mysql' | 'postgresql'
    });
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        loadDatabases();
    }, []);

    const loadDatabases = async () => {
        try {
            const token = getToken();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/databases`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setDatabases(data.databases);
                setStats(data.stats);
            } else {
                toast.error(data.message || 'Failed to load databases');
            }
        } catch (error) {
            toast.error('Failed to load databases');
        } finally {
            setLoading(false);
        }
    };

    const handleAddDatabase = async () => {
        if (!newDatabase.databaseName || !newDatabase.databaseUser || !newDatabase.databasePassword) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            const token = getToken();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/databases`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newDatabase)
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Database created successfully! 🎉');
                setShowAddModal(false);
                setNewDatabase({
                    databaseName: '',
                    databaseUser: '',
                    databasePassword: '',
                    databaseType: 'mysql'
                });
                loadDatabases();
            } else {
                toast.error(data.message || 'Failed to create database');
            }
        } catch (error) {
            toast.error('Failed to create database');
        }
    };

    const handleDeleteDatabase = async (id: number, dbName: string) => {
        if (!confirm(`Are you sure you want to delete database "${dbName}"? This action cannot be undone!`)) return;

        try {
            const token = getToken();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/databases/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Database deleted successfully');
                loadDatabases();
            } else {
                toast.error(data.message || 'Failed to delete database');
            }
        } catch (error) {
            toast.error('Failed to delete database');
        }
    };

    const handleChangePassword = async () => {
        if (!selectedDatabase || !newPassword) {
            toast.error('Please enter a new password');
            return;
        }

        try {
            const token = getToken();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/databases/${selectedDatabase.id}/change-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newPassword })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Password changed successfully');
                setShowPasswordModal(false);
                setNewPassword('');
                setSelectedDatabase(null);
            } else {
                toast.error(data.message || 'Failed to change password');
            }
        } catch (error) {
            toast.error('Failed to change password');
        }
    };

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 16; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    if (loading) {
        return (
            <ProtectedDashboard>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-[#5865F2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading databases...</p>
                    </div>
                </div>
            </ProtectedDashboard>
        );
    }

    return (
        <ProtectedDashboard>
            <Toaster position="top-right" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Database Management</h1>
                        <p className="text-gray-600 mt-1">Manage your MySQL and PostgreSQL databases</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-[#5865F2] to-[#4F46E5] text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Create Database
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Databases</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#5865F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">MySQL</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.mysql}</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <span className="text-xl font-bold text-orange-600">My</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">PostgreSQL</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.postgresql}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-xl font-bold text-blue-600">Pg</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Size</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalSizeMB.toFixed(2)} MB</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Databases Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900">Your Databases</h2>
                    </div>

                    {databases.length === 0 ? (
                        <div className="p-12 text-center">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                            </svg>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No databases yet</h3>
                            <p className="text-gray-600 mb-4">Create your first database to get started</p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-6 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4F46E5] transition-colors"
                            >
                                Create Database
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Database Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Size</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {databases.map((db) => (
                                        <tr key={db.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${db.database_type === 'mysql' ? 'bg-orange-500' : 'bg-blue-500'
                                                        }`}>
                                                        {db.database_type === 'mysql' ? 'My' : 'Pg'}
                                                    </div>
                                                    <div className="font-semibold text-gray-900">{db.database_name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 capitalize">{db.database_type}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{db.database_user}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{db.current_size_mb.toFixed(2)} MB</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
                                                    {db.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(db.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedDatabase(db);
                                                            setShowPasswordModal(true);
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        Change Password
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteDatabase(db.id, db.database_name)}
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
            </div>

            {/* Add Database Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Database</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Database Type</label>
                                <select
                                    value={newDatabase.databaseType}
                                    onChange={(e) => setNewDatabase({ ...newDatabase, databaseType: e.target.value as 'mysql' | 'postgresql' })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
                                >
                                    <option value="mysql">MySQL</option>
                                    <option value="postgresql">PostgreSQL</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Database Name</label>
                                <input
                                    type="text"
                                    value={newDatabase.databaseName}
                                    onChange={(e) => setNewDatabase({ ...newDatabase, databaseName: e.target.value })}
                                    placeholder="my_database"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Database User</label>
                                <input
                                    type="text"
                                    value={newDatabase.databaseUser}
                                    onChange={(e) => setNewDatabase({ ...newDatabase, databaseUser: e.target.value })}
                                    placeholder="db_user"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newDatabase.databasePassword}
                                        onChange={(e) => setNewDatabase({ ...newDatabase, databasePassword: e.target.value })}
                                        placeholder="Strong password"
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
                                    />
                                    <button
                                        onClick={() => setNewDatabase({ ...newDatabase, databasePassword: generatePassword() })}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddDatabase}
                                className="flex-1 px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4F46E5] transition-colors"
                            >
                                Create Database
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showPasswordModal && selectedDatabase && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Change Password</h2>
                        <p className="text-gray-600 mb-4">Database: <strong>{selectedDatabase.database_name}</strong></p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
                                    />
                                    <button
                                        onClick={() => setNewPassword(generatePassword())}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setNewPassword('');
                                    setSelectedDatabase(null);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleChangePassword}
                                className="flex-1 px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4F46E5] transition-colors"
                            >
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ProtectedDashboard>
    );
};

export default Databases;
