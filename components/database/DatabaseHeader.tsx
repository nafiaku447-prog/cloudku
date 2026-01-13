import React from 'react';
import { DatabaseStatsType } from '../../types';

interface DatabaseHeaderProps {
    stats: DatabaseStatsType;
}

const DatabaseHeader: React.FC<DatabaseHeaderProps> = ({ stats }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-[#1e1e2e] to-[#2d2d44] p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -ml-16 -mb-16"></div>

            <div className="relative z-10">
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    Database Infrastructure
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-black rounded-full border border-green-500/30 uppercase tracking-[0.2em] shadow-lg shadow-green-500/20">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                        All Systems Operational
                    </span>
                </h1>
                <p className="text-gray-400 mt-2 font-medium flex items-center gap-2">
                    Manage your MySQL and PostgreSQL databases from one place.
                    <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
            </div>

            <div className="flex items-center gap-4 relative z-10">
                <div className="px-5 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-4 shadow-xl">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Storage</p>
                        <p className="text-lg font-black text-purple-400">{stats.totalSizeMB.toFixed(2)} MB</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabaseHeader;
