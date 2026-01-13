import React from 'react';
import { Database } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => Promise<void>;
    selectedDatabase: Database | null;
    newPassword: string;
    setNewPassword: (password: string) => void;
    generatePassword: () => string;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    selectedDatabase,
    newPassword,
    setNewPassword,
    generatePassword
}) => {
    // If not open or no database selected, we can return null (or render Dialog with open=false, but needing selectedDatabase info inside)
    if (!selectedDatabase) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-white text-gray-900 border-gray-200">
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Enter a new password for the selected database user.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-gray-600 mb-4 text-sm">
                        Database: <span className="font-semibold text-gray-900">{selectedDatabase.database_name}</span>
                    </p>

                    <div className="grid gap-2">
                        <Label>New Password</Label>
                        <div className="flex gap-2">
                            <Input
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="text-gray-900"
                            />
                            <Button 
                                variant="outline" 
                                onClick={() => setNewPassword(generatePassword())}
                                type="button"
                                className="bg-white text-gray-900 hover:bg-gray-100"
                            >
                                Generate
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-end gap-2">
                    <Button variant="outline" onClick={onClose} className="bg-white text-gray-900 hover:bg-gray-100">
                        Cancel
                    </Button>
                    <Button 
                        onClick={onSubmit} 
                        className="bg-[#5865F2] hover:bg-[#4F46E5] text-white"
                    >
                        Change Password
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ChangePasswordModal;
