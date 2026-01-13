import React from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus } from "lucide-react"

interface DatabaseControlsProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterType: string;
    setFilterType: (type: string) => void;
    onAddClick: () => void;
}

const DatabaseControls: React.FC<DatabaseControlsProps> = ({
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    onAddClick
}) => {
    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full md:w-auto relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-gray-900"
                    placeholder="Search databases..."
                />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full md:w-[140px] text-gray-900">
                        <SelectValue placeholder="Filter Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    </SelectContent>
                </Select>
                
                <Button 
                    onClick={onAddClick}
                    className="bg-gradient-to-r from-[#5865F2] to-[#4F46E5] text-white hover:from-[#4752C4] hover:to-[#4338CA] shadow-md hover:shadow-lg transition-all"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Database
                </Button>
            </div>
        </div>
    );
};

export default DatabaseControls;
