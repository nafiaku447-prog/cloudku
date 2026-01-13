import React from 'react';
import { Database } from '../../types';
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Settings, ExternalLink, ShieldCheck, Activity, Terminal } from "lucide-react"

interface DatabaseListProps {
    databases: Database[];
    searchTerm: string;
    onDelete: (id: number, dbName: string) => void;
    onChangePasswordClick: (db: Database) => void;
    onAddClick: () => void;
    onTerminalClick: (db: Database) => void;
}

const DatabaseList: React.FC<DatabaseListProps> = ({
    databases,
    searchTerm,
    onDelete,
    onChangePasswordClick,
    onAddClick,
    onTerminalClick
}) => {
    if (databases.length === 0) {
        return (
            <Card className="border-dashed border-2 p-16 text-center shadow-none bg-white rounded-[2rem]">
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-6">
                        <Activity className="w-12 h-12 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {searchTerm ? 'No results found' : 'Ready to create?'}
                    </h3>
                    <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">
                        {searchTerm
                            ? `No database matches "${searchTerm}". Try a different search term.`
                            : "You haven't created any databases yet. Start by creating your first MySQL or PostgreSQL database now."}
                    </p>
                    {!searchTerm && (
                        <Button
                            onClick={onAddClick}
                            className="px-10 py-6 text-lg bg-gradient-to-r from-[#5865F2] to-[#4F46E5] text-white rounded-2xl font-bold hover:shadow-2xl shadow-blue-500/40 transition-all hover:scale-105 active:scale-95 h-auto"
                        >
                            Create Your First Database
                        </Button>
                    )}
                </div>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6">
            {databases.map((db) => (
                <Card key={db.id} className="bg-white border-0 shadow-sm rounded-[24px] p-6 hover:shadow-lg transition-all duration-300 ring-1 ring-gray-100">
                    {/* Header: Icon, Name, Badge, Subtext */}
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-center p-2.5 shrink-0">
                                <img 
                                    src={db.database_type === 'mysql' 
                                        ? "https://upload.wikimedia.org/wikipedia/en/d/dd/MySQL_logo.svg" 
                                        : "https://upload.wikimedia.org/wikipedia/commons/2/29/Postgresql_elephant.svg"
                                    }
                                    alt={db.database_type}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-lg font-bold text-gray-900">{db.database_name}</h3>
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold border-none uppercase text-[10px] tracking-wider px-2">
                                        {db.database_type} {db.database_type === 'mysql' ? '8.0' : '15+'}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                    <div className="flex items-center gap-1.5 text-blue-600/80 bg-blue-50/50 px-2 py-0.5 rounded-md">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        <span>SSL Encrypted</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-emerald-600/80 bg-emerald-50/50 px-2 py-0.5 rounded-md">
                                        <Activity className="w-3.5 h-3.5" />
                                        <span>User: {db.database_user}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* More Menu Placeholder (if needed, currently empty or could be action) */}
                    </div>

                    {/* Storage Progress */}
                    <div className="mb-8">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-semibold text-gray-500">Storage Usage</span>
                            <span className="text-sm font-bold text-gray-900">
                                {((db.current_size_mb ?? 0) / (db.max_size_mb || 100) * 100).toFixed(0)}% <span className="text-gray-400 font-medium ml-1">of {db.max_size_mb || 100} MB (Free Tier)</span>
                            </span>
                        </div>
                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                    db.database_type === 'mysql' 
                                    ? 'bg-gradient-to-r from-orange-400 to-orange-600' 
                                    : 'bg-gradient-to-r from-blue-400 to-blue-600'
                                }`}
                                style={{ width: `${Math.min(((db.current_size_mb ?? 0) / (db.max_size_mb || 100)) * 100, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Footer: Status & Actions */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-sm font-bold text-emerald-700">Active</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => onChangePasswordClick(db)}
                                className="h-9 w-9 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                                title="Change Password"
                            >
                                <Settings className="w-4.5 h-4.5" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                            >
                                <ExternalLink className="w-4.5 h-4.5" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => onDelete(db.id, db.database_name)}
                                className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Database"
                            >
                                <Trash2 className="w-4.5 h-4.5" />
                            </Button>
                            <div className="w-px h-6 bg-gray-200 mx-2"></div>
                            <Button 
                                onClick={() => onTerminalClick(db)}
                                className="bg-gray-900 text-white hover:bg-black font-bold h-9 px-4 rounded-lg shadow-lg shadow-gray-200 flex items-center gap-2"
                            >
                                <Terminal className="w-4 h-4" />
                                SQL Console
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default DatabaseList;
