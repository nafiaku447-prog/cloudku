import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/Dashboard/DashboardLayout';
import DashboardHome from '../components/Dashboard/DashboardHome';
import { isAuthenticated, getCurrentUser } from '../utils/authApi';

interface UserData {
    id: number;
    name: string;
    email: string;
    profile_picture?: string;
}

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            if (!isAuthenticated()) {
                navigate('/');
                return;
            }

            try {
                const userData = await getCurrentUser();
                if (userData.data?.user) {
                    setUser(userData.data.user);
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error);
                // Optionally redirect to login on error
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
                <div className="text-center">
                    <p className="text-slate-600 font-medium">Failed to load user data</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout
            userName={user.name}
            userEmail={user.email}
            userPicture={user.profile_picture}
        >
            <DashboardHome />
        </DashboardLayout>
    );
};

export default DashboardPage;
