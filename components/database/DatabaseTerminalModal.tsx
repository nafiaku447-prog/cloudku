import React, { useState, useEffect, useRef } from 'react';
import { Database } from '../../types';
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Play, Eraser, Loader2, CheckCircle2, Terminal, X } from "lucide-react"

interface DatabaseTerminalModalProps {
    isOpen: boolean;
    onClose: () => void;
    database: Database | null;
}

const DatabaseTerminalModal: React.FC<DatabaseTerminalModalProps> = ({
    isOpen,
    onClose,
    database
}) => {
    const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;');
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    if (!database) return null;

    const handleRun = () => {
        setIsRunning(true);
        setResult(null);
        setError(null);

        setTimeout(() => {
            setIsRunning(false);
            const lowerQuery = query.toLowerCase();
            
            if (lowerQuery.includes('select')) {
                setResult({
                    headers: ['id', 'username', 'email', 'role', 'status', 'created_at'],
                    rows: [
                        [1, 'admin', 'admin@cloudku.com', 'Administrator', 'Active', '2024-01-01'],
                        [2, 'user_john', 'john@example.com', 'User', 'Active', '2024-01-15'],
                        [3, 'dev_team', 'dev@cloudku.com', 'Developer', 'Suspended', '2024-02-10'],
                        [4, 'test_acc', 'test@test.com', 'Viewer', 'Active', '2024-03-05'],
                        [5, 'guest_01', 'guest@temp.com', 'Guest', 'Inactive', '2024-03-10'],
                    ]
                });
            } else if (lowerQuery.includes('show tables')) {
                setResult({
                    headers: [`Tables_in_${database.database_name}`],
                    rows: [['users'], ['orders'], ['products'], ['settings'], ['logs']]
                });
            } else {
                setError(`Error: You have an error in your SQL syntax; check the manual for correct syntax.`);
            }
        }, 800);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-[#1C1C1C] border-[#2E2E2E] p-0 gap-0 sm:max-w-5xl h-[700px] flex flex-col text-gray-300 shadow-2xl overflow-hidden [&>button]:hidden">
                {/* Header / Toolbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#2E2E2E] bg-[#1F1F1F]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[#EDEDED] font-semibold text-sm">
                            <Terminal className="w-4 h-4 text-[#3ECF8E]" />
                            <span>SQL Editor</span>
                        </div>
                        <div className="h-4 w-px bg-[#333]"></div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                             <div className="w-2 h-2 rounded-full bg-[#3ECF8E]"></div>
                             <span>Connected to <span className="text-gray-300 font-mono">{database.database_name}</span></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs font-medium text-gray-400 hover:text-white hover:bg-[#333]"
                            onClick={() => setQuery('')}
                        >
                            <Eraser className="w-3.5 h-3.5 mr-2" />
                            Clear
                        </Button>
                        <Button 
                            size="sm" 
                            className="h-8 bg-[#3ECF8E] hover:bg-[#34b27b] text-[#151515] font-bold text-xs px-4"
                            onClick={handleRun}
                            disabled={isRunning}
                        >
                            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Play className="w-3.5 h-3.5 mr-2 fill-current" />}
                            RUN
                        </Button>
                        <div className="w-4"></div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#333]"
                            onClick={onClose}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Main Split Content */}
                <div className="flex-1 flex flex-col">
                    {/* Editor Area */}
                    <div className="flex-1 min-h-[200px] relative bg-[#1C1C1C] overflow-hidden flex">
                        {/* Line Numbers */}
                        <div className="w-12 bg-[#1C1C1C] text-[#444] text-right pr-3 pt-4 text-xs font-mono select-none border-r border-[#2E2E2E]">
                            {Array.from({ length: 15 }).map((_, i) => (
                                <div key={i} className="leading-6">{i + 1}</div>
                            ))}
                        </div>
                        {/* Text Area */}
                        <textarea 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="flex-1 bg-[#1C1C1C] text-[#EDEDED] font-mono text-sm p-4 outline-none resize-none leading-6 placeholder-gray-600"
                            placeholder="Write your SQL query here..."
                            spellCheck={false}
                        />
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-[#2E2E2E] w-full"></div>

                    {/* Results Area */}
                    <div className="h-[350px] bg-[#181818] overflow-auto flex flex-col">
                        <div className="px-4 py-2 bg-[#1F1F1F] border-b border-[#2E2E2E] flex items-center justify-between sticky top-0">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Results</span>
                            {result && (
                                <span className="text-xs text-[#3ECF8E] flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> 
                                    Query successful ({Math.random().toFixed(3)}ms)
                                </span>
                            )}
                        </div>
                        
                        <div className="flex-1 p-0 overflow-auto">
                            {!result && !error && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600">
                                    <Terminal className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="text-sm">Run a query to see results</p>
                                </div>
                            )}

                            {error && (
                                <div className="p-6 text-red-400 font-mono text-sm">
                                    {error}
                                </div>
                            )}

                            {result && (
                                <table className="w-full text-left border-collapse font-mono text-xs">
                                    <thead>
                                        <tr>
                                            {result.headers.map((h: string, i: number) => (
                                                <th key={i} className="bg-[#252525] text-gray-400 font-medium border-b border-r border-[#333] px-4 py-2 whitespace-nowrap sticky top-0">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.rows.map((row: any[], i: number) => (
                                            <tr key={i} className="hover:bg-[#202020] group">
                                                {row.map((cell: any, j: number) => (
                                                    <td key={j} className="border-b border-r border-[#2E2E2E] px-4 py-2 text-[#D1D1D1] whitespace-nowrap">
                                                        {cell}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="h-8 bg-[#3ECF8E] text-[#151515] flex items-center justify-between px-4 text-[10px] font-bold uppercase tracking-wider">
                     <span>{database.database_type === 'mysql' ? 'MySQL 8.0' : 'PostgreSQL 15'}</span>
                     <span>Ready</span>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DatabaseTerminalModal;
