import React, { useState } from 'react';
import { Database } from '../../types';
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Play, Eraser, Loader2, CheckCircle2, Terminal, X, Lock } from "lucide-react"
import { getToken } from '../../utils/authApi';

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
    const [query, setQuery] = useState('SHOW TABLES;');
    const [password, setPassword] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [queryTime, setQueryTime] = useState<number>(0);

    if (!database) return null;

    const handleRun = async () => {
        if (!password) {
            setError('Please enter your database password');
            return;
        }
        if (!query.trim()) {
            setError('Please enter a SQL query');
            return;
        }

        setIsRunning(true);
        setResult(null);
        setError(null);

        const startTime = Date.now();

        try {
            const token = getToken();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/databases/${database.id}/query`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query, password })
            });

            const data = await response.json();
            const elapsed = Date.now() - startTime;
            setQueryTime(elapsed);

            if (data.success) {
                setResult({
                    headers: data.columns || [],
                    rows: data.rows || [],
                    message: data.message
                });
            } else {
                setError(data.message || 'Query failed');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setIsRunning(false);
        }
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
                        {/* Password Input */}
                        <div className="flex items-center gap-2 bg-[#252525] rounded-lg px-3 py-1.5 border border-[#333]">
                            <Lock className="w-3.5 h-3.5 text-gray-500" />
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="DB Password"
                                className="bg-transparent text-sm text-white w-24 outline-none placeholder:text-gray-600"
                            />
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs font-medium text-gray-400 hover:text-white hover:bg-[#333]"
                            onClick={() => { setQuery(''); setResult(null); setError(null); }}
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
                                    {result.message} ({queryTime}ms)
                                </span>
                            )}
                        </div>
                        
                        <div className="flex-1 p-0 overflow-auto">
                            {!result && !error && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600">
                                    <Terminal className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="text-sm">Enter your password and run a query</p>
                                </div>
                            )}

                            {error && (
                                <div className="p-6 text-red-400 font-mono text-sm">
                                    {error}
                                </div>
                            )}

                            {result && result.rows && result.rows.length > 0 && (
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
                                                        {cell === null ? <span className="text-gray-600">NULL</span> : String(cell)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {result && result.rows && result.rows.length === 0 && (
                                <div className="p-6 text-gray-500 text-sm">
                                    Query executed successfully. No rows returned.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="h-8 bg-[#3ECF8E] text-[#151515] flex items-center justify-between px-4 text-[10px] font-bold uppercase tracking-wider">
                     <span>{database.database_type === 'mysql' ? 'MySQL 8.0' : 'PostgreSQL 15'}</span>
                     <span>{password ? 'Ready' : 'Enter password to execute'}</span>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DatabaseTerminalModal;
