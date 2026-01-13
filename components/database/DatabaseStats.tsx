import React from 'react';
import { DatabaseStatsType } from '../../types';
import { Card, CardContent } from "@/components/ui/card"
import { Database, Layers, TrendingUp, HardDrive } from "lucide-react"

interface DatabaseStatsProps {
    stats: DatabaseStatsType;
}

const DatabaseStats: React.FC<DatabaseStatsProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Databases */}
            <Card className="bg-white border-0 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] rounded-[20px] hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-[18px] bg-[#F4F1FF] flex items-center justify-center text-[#7B5CFF]">
                            <Database className="w-6 h-6" />
                        </div>
                        <div className="bg-[#EFFFF6] text-[#00B96B] text-xs font-bold px-2.5 py-1 rounded-full">
                            +4%
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-500 font-medium text-sm mb-1">Total Databases</p>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalDatabases}</h3>
                        <p className="text-xs text-gray-400 font-medium">Across all clusters</p>
                    </div>
                </CardContent>
            </Card>

            {/* MySQL Engines */}
            <Card className="bg-white border-0 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] rounded-[20px] hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-[18px] bg-[#EEF5FF] flex items-center justify-center text-[#2D7EF8]">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div className="bg-[#EFFFF6] text-[#00B96B] text-xs font-bold px-2.5 py-1 rounded-full">
                            +2%
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-500 font-medium text-sm mb-1">MySQL Engines</p>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.mysqlCount}</h3>
                        <p className="text-xs text-gray-400 font-medium">Instances v8.0+</p>
                    </div>
                </CardContent>
            </Card>

            {/* Postgres Engines */}
            <Card className="bg-white border-0 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] rounded-[20px] hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-[18px] bg-[#F9F0FF] flex items-center justify-center text-[#C026D3]">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div className="bg-[#EFFFF6] text-[#00B96B] text-xs font-bold px-2.5 py-1 rounded-full">
                            +1%
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-500 font-medium text-sm mb-1">Postgres Engines</p>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.postgresCount}</h3>
                        <p className="text-xs text-gray-400 font-medium">Instances v15+</p>
                    </div>
                </CardContent>
            </Card>

            {/* Storage Usage */}
            <Card className="bg-white border-0 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] rounded-[20px] hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-[18px] bg-[#FFF8E6] flex items-center justify-center text-[#F59E0B]">
                            <HardDrive className="w-6 h-6" />
                        </div>
                        <div className="bg-[#EFFFF6] text-[#00B96B] text-xs font-bold px-2.5 py-1 rounded-full">
                            +12%
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-500 font-medium text-sm mb-1">Storage Usage</p>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalSizeMB.toFixed(1)} <span className="text-xl text-gray-400 font-semibold">MB</span></h3>
                        <p className="text-xs text-gray-400 font-medium">85% total capacity</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DatabaseStats;
