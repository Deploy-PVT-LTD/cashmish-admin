import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { bankDetailsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

export default function BankDetails() {
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detailToDelete, setDetailToDelete] = useState(null);

    const fetchBankDetails = async () => {
        try {
            setLoading(true);
            const data = await bankDetailsApi.getAll();
            setDetails(data);
        } catch (error) {
            console.error('Error fetching bank details:', error);
            toast.error('Failed to load bank details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBankDetails();
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        try {
            await bankDetailsApi.update(id, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
            fetchBankDetails();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async () => {
        if (!detailToDelete) return;
        try {
            await bankDetailsApi.delete(detailToDelete._id);
            toast.success('Bank details deleted');
            setDetailToDelete(null);
            fetchBankDetails();
        } catch (error) {
            console.error('Error deleting bank details:', error);
            toast.error('Failed to delete bank details');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            paid: 'bg-green-100 text-green-700 border-green-200',
            rejected: 'bg-red-100 text-red-700 border-red-200',
        };
        return (
            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold border", styles[status] || styles.pending)}>
                {status.toUpperCase()}
            </span>
        );
    };

    return (
        <AdminLayout title="Bank Details" subtitle="View and manage user bank details for payments">
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : details.length === 0 ? (
                <div className="text-center py-20 bg-muted/10 rounded-lg border border-dashed text-muted-foreground">
                    No bank details requests found.
                </div>
            ) : (
                <div className="data-table">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">User</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Bank Info</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Account Details</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Status</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {details.map((item) => (
                                    <tr key={item._id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{item.userId?.name || 'N/A'}</span>
                                                <span className="text-xs text-muted-foreground">{item.userId?.email || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{item.bankName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{item.accountNumber}</span>
                                                <span className="text-xs text-muted-foreground">{item.accountHolderName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(item.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {item.status !== 'paid' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleStatusChange(item._id, 'paid')}
                                                        title="Mark as Paid"
                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {item.status !== 'pending' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleStatusChange(item._id, 'pending')}
                                                        title="Mark as Pending"
                                                        className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                                    >
                                                        <Clock className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {item.status !== 'rejected' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleStatusChange(item._id, 'rejected')}
                                                        title="Mark as Rejected"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDetailToDelete(item)}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!detailToDelete} onOpenChange={() => setDetailToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the bank details for <strong>{detailToDelete?.accountHolderName}</strong>.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
}
