import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/Dashboard/DashboardLayout';
import { isAuthenticated, getCurrentUser } from '../utils/authApi';

interface UserData {
    id: number;
    name: string;
    email: string;
    profile_picture?: string;
}

interface ProtectedDashboardProps {
    children: React.ReactNode;
}

const ProtectedDashboard: React.FC<ProtectedDashboardProps> = ({ children }) => {
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
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#5865F2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-600 font-medium">Failed to load user data</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-6 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4F46E5]"
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
            {children}
        </DashboardLayout>
    );
};

export default ProtectedDashboard;
