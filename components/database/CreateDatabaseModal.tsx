import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

import { Database as DatabaseIcon, User, Lock, RefreshCw, X, CheckCircle2 } from "lucide-react"

interface CreateDatabaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => Promise<void>;
    newDatabase: any;
    setNewDatabase: (data: any) => void;
    generatePassword: () => string;
}

const CreateDatabaseModal: React.FC<CreateDatabaseModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    newDatabase,
    setNewDatabase,
    generatePassword
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[550px] bg-white text-gray-900 border-none p-0 overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-gray-100">
                {/* Header */}
                <div className="p-8 pb-2 flex items-center justify-between">
                    <div>
                        <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Deploy Instance</DialogTitle>
                        <p className="text-gray-500 font-medium mt-1">Select your engine and configure.</p>
                    </div>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 h-10 w-10"
                    >
                        <X className="w-6 h-6" />
                    </Button>
                </div>

                <div className="px-8 py-4 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    
                    {/* Database Engine Selection */}
                    <div>
                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Engine Architecture</Label>
                        <div className="grid grid-cols-2 gap-4">
                            {/* MySQL Card */}
                            <div 
                                onClick={() => setNewDatabase({ ...newDatabase, databaseType: 'mysql' })}
                                className={`relative p-5 rounded-3xl border transition-all duration-300 cursor-pointer group hover:shadow-xl ${
                                    newDatabase.databaseType === 'mysql' 
                                    ? 'border-[#00758F]/20 bg-[#00758F]/5 ring-1 ring-[#00758F] shadow-lg shadow-[#00758F]/10' 
                                    : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100 p-2">
                                        {/* CDN Logo for MySQL */}
                                        <img 
                                            src="https://upload.wikimedia.org/wikipedia/en/d/dd/MySQL_logo.svg" 
                                            alt="MySQL" 
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    {newDatabase.databaseType === 'mysql' && (
                                        <Badge className="bg-[#00758F] hover:bg-[#00758F] text-white border-0 h-6 px-2 rounded-lg text-[10px] font-bold">
                                            SELECTED
                                        </Badge>
                                    )}
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-0.5">MySQL</h3>
                                <p className="text-xs text-gray-500 font-medium">8.0 Stable</p>
                            </div>

                            {/* PostgreSQL Card */}
                             <div 
                                onClick={() => setNewDatabase({ ...newDatabase, databaseType: 'postgresql' })}
                                className={`relative p-5 rounded-3xl border transition-all duration-300 cursor-pointer group hover:shadow-xl ${
                                    newDatabase.databaseType === 'postgresql' 
                                    ? 'border-[#336791]/20 bg-[#336791]/5 ring-1 ring-[#336791] shadow-lg shadow-[#336791]/10' 
                                    : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100 p-2">
                                        {/* CDN Logo for PostgreSQL */}
                                        <img 
                                            src="https://upload.wikimedia.org/wikipedia/commons/2/29/Postgresql_elephant.svg" 
                                            alt="PostgreSQL" 
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    {newDatabase.databaseType === 'postgresql' && (
                                        <Badge className="bg-[#336791] hover:bg-[#336791] text-white border-0 h-6 px-2 rounded-lg text-[10px] font-bold">
                                            SELECTED
                                        </Badge>
                                    )}
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-0.5">PostgreSQL</h3>
                                <p className="text-xs text-gray-500 font-medium">v15+ Latest</p>
                            </div>
                        </div>
                    </div>

                    {/* Configuration Form */}
                    <div className="space-y-4">
                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Instance Details</Label>
                        
                        <div className="space-y-4 bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
                             {/* Instance Name */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700 ml-1">Identifier</Label>
                                <Input
                                    value={newDatabase.databaseName}
                                    onChange={(e) => setNewDatabase({ ...newDatabase, databaseName: e.target.value })}
                                    placeholder="production-db"
                                    className="bg-white border-gray-200 text-gray-900 focus:border-[#5865F2] focus:ring-[#5865F2]/20 h-11 rounded-xl font-medium shadow-sm transition-all"
                                />
                            </div>

                             {/* Username & Password */}
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700 ml-1">Username</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            value={newDatabase.databaseUser}
                                            onChange={(e) => setNewDatabase({ ...newDatabase, databaseUser: e.target.value })}
                                            placeholder="user"
                                            className="pl-9 bg-white border-gray-200 text-gray-900 focus:border-[#5865F2] focus:ring-[#5865F2]/20 h-11 rounded-xl font-medium shadow-sm transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700 ml-1">Password</Label>
                                    <div className="relative flex group">
                                         <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-[#5865F2] transition-colors" />
                                        <Input
                                            value={newDatabase.databasePassword}
                                            onChange={(e) => setNewDatabase({ ...newDatabase, databasePassword: e.target.value })}
                                            placeholder="Key"
                                            className="pl-9 pr-10 bg-white border-gray-200 text-gray-900 focus:border-[#5865F2] focus:ring-[#5865F2]/20 h-11 rounded-xl font-medium shadow-sm transition-all"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setNewDatabase({ ...newDatabase, databasePassword: generatePassword() })}
                                            className="absolute right-1 top-1 h-9 w-9 text-gray-400 hover:text-[#5865F2] rounded-lg"
                                            title="Generate"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 pt-4 flex gap-3">
                    <Button 
                        variant="ghost" 
                        onClick={onClose} 
                        className="flex-1 hover:bg-gray-100 text-gray-600 font-bold rounded-xl h-12"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={onSubmit} 
                        className="flex-[2] bg-gray-900 hover:bg-black text-white shadow-xl shadow-gray-900/20 font-bold rounded-xl h-12 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Deploy Database
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateDatabaseModal;
