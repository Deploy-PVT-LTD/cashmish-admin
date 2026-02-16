import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { couponApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash2, Ticket, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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

export default function Coupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [couponToDelete, setCouponToDelete] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        amount: '',
        isActive: true
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const data = await couponApi.getAll();
            setCoupons(data);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            toast.error('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleOpenModal = (coupon = null) => {
        if (coupon) {
            setFormData({
                _id: coupon._id,
                name: coupon.name,
                code: coupon.code,
                amount: coupon.amount,
                isActive: coupon.isActive
            });
            setIsEditing(true);
        } else {
            setFormData({
                name: '',
                code: '',
                amount: '',
                isActive: true
            });
            setIsEditing(false);
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            if (isEditing) {
                await couponApi.update(formData._id, formData);
                toast.success('Coupon updated successfully');
            } else {
                await couponApi.create(formData);
                toast.success('Coupon created successfully');
            }
            setModalOpen(false);
            fetchCoupons();
        } catch (error) {
            console.error('Error saving coupon:', error);
            toast.error(error.response?.data?.message || 'Failed to save coupon');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!couponToDelete) return;
        try {
            await couponApi.delete(couponToDelete._id);
            toast.success('Coupon deleted successfully');
            setDeleteDialogOpen(false);
            setCouponToDelete(null);
            fetchCoupons();
        } catch (error) {
            console.error('Error deleting coupon:', error);
            toast.error('Failed to delete coupon');
        }
    };

    return (
        <AdminLayout
            title="Coupon Management"
            subtitle="Create and manage your promotional discount codes"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Active Coupons</h2>
                    <p className="text-sm text-muted-foreground">Manage your promotional offers and discounts</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="gap-2 self-start sm:self-auto">
                    <Plus className="w-4 h-4" /> Add Coupon
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : coupons.length === 0 ? (
                <div className="text-center py-20 bg-muted/10 rounded-lg border border-dashed text-muted-foreground">
                    <Ticket className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    No coupons found. Create your first one!
                </div>
            ) : (
                <div className="data-table">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Name</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Code</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Amount</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Status</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map((coupon) => (
                                    <tr key={coupon._id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-medium">{coupon.name}</td>
                                        <td className="px-6 py-4 pb-1">
                                            <span className="font-mono bg-primary/10 text-primary px-2 py-1 rounded text-sm font-bold tracking-wider">
                                                {coupon.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold">
                                            $ {coupon.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {coupon.isActive ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full border border-green-100 uppercase">
                                                    <Check className="w-3 h-3" /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-full border border-red-100 uppercase">
                                                    <X className="w-3 h-3" /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenModal(coupon)}
                                                    className="text-primary hover:text-primary hover:bg-primary/10"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setCouponToDelete(coupon);
                                                        setDeleteDialogOpen(true);
                                                    }}
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

            {/* Add/Edit Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Coupon Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Summer Sale 2024"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code">Coupon Code</Label>
                            <Input
                                id="code"
                                placeholder="e.g. SUMMER50"
                                className="font-mono uppercase"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount ($)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="isActive">Active</Label>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {isEditing ? 'Update Coupon' : 'Create Coupon'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the coupon <strong>{couponToDelete?.code}</strong>.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-white">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
}
