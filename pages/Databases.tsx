import React, { useState, useEffect } from 'react';
import ProtectedDashboard from '../components/ProtectedDashboard';
import toast, { Toaster } from 'react-hot-toast';
import { getToken } from '../utils/authApi';
import { Database, DatabaseStatsType } from '../types';
import DatabaseHeader from '../components/database/DatabaseHeader';
import DatabaseStats from '../components/database/DatabaseStats';
import DatabaseControls from '../components/database/DatabaseControls';
import DatabaseList from '../components/database/DatabaseList';
import CreateDatabaseModal from '../components/database/CreateDatabaseModal';
import DatabaseTerminalModal from '../components/database/DatabaseTerminalModal';
import ChangePasswordModal from '../components/database/ChangePasswordModal';

const Databases: React.FC = () => {
    const [databases, setDatabases] = useState<Database[]>([]);
    const [stats, setStats] = useState<DatabaseStatsType>({ totalDatabases: 0, mysqlCount: 0, postgresCount: 0, totalSizeMB: 0 });
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showTerminalModal, setShowTerminalModal] = useState(false);
    const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

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
                setDatabases(data.databases || []);
                setStats(data.stats || { totalDatabases: 0, mysqlCount: 0, postgresCount: 0, totalSizeMB: 0 });
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/databases/${selectedDatabase.id}/password`, {
                method: 'PUT',
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

    const filteredDatabases = databases.filter(db => {
        const matchesSearch = db.database_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || db.database_type === filterType;
        return matchesSearch && matchesFilter;
    });

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

            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <DatabaseHeader stats={stats} />

                <DatabaseStats stats={stats} />

                <DatabaseControls
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filterType={filterType}
                    setFilterType={setFilterType}
                    onAddClick={() => setShowAddModal(true)}
                />

                <DatabaseList
                    databases={filteredDatabases}
                    searchTerm={searchTerm}
                    onDelete={handleDeleteDatabase}
                    onChangePasswordClick={(db) => {
                        setSelectedDatabase(db);
                        setShowPasswordModal(true);
                    }}
                    onAddClick={() => setShowAddModal(true)}
                    onTerminalClick={(db) => {
                         setSelectedDatabase(db);
                         setShowTerminalModal(true);
                    }}
                />

                <CreateDatabaseModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSubmit={handleAddDatabase}
                    newDatabase={newDatabase}
                    setNewDatabase={setNewDatabase}
                    generatePassword={generatePassword}
                />

                <ChangePasswordModal
                    isOpen={showPasswordModal}
                    onClose={() => {
                        setShowPasswordModal(false);
                        setNewPassword('');
                        setSelectedDatabase(null);
                    }}
                    onSubmit={handleChangePassword}
                    selectedDatabase={selectedDatabase}
                    newPassword={newPassword}
                    setNewPassword={setNewPassword}
                    generatePassword={generatePassword}
                />
                
                <DatabaseTerminalModal
                    isOpen={showTerminalModal}
                    onClose={() => {
                        setShowTerminalModal(false);
                        setSelectedDatabase(null);
                    }}
                    database={selectedDatabase}
                />
            </div>
        </ProtectedDashboard>
    );
};

export default Databases;
