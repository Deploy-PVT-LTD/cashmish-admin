import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { mobileApi } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Loader2, ArrowRight } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function Requests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await mobileApi.getRequests();
            setRequests(data);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (requestId) => {
        try {
            await mobileApi.approveRequest(requestId);
            toast.success('Request approved successfully');
            fetchRequests();
        } catch (error) {
            console.error('Error approving request:', error);
            toast.error('Failed to approve request');
        }
    };

    const openRejectModal = (request) => {
        setSelectedRequest(request);
        setRejectionReason('');
        setRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!selectedRequest) return;
        try {
            await mobileApi.rejectRequest(selectedRequest._id, rejectionReason);
            toast.success('Request rejected');
            setRejectModalOpen(false);
            fetchRequests();
        } catch (error) {
            console.error('Error rejecting request:', error);
            toast.error('Failed to reject request');
        }
    };

    // Helper to render value differences
    const renderValueDiff = (label, oldValue, newValue) => {
        if (oldValue === newValue) return null;
        return (
            <div className="grid grid-cols-2 gap-4 text-sm border-b py-2 last:border-0">
                <div className="text-muted-foreground">
                    <span className="font-semibold block mb-1">{label}</span>
                    <div className="bg-red-50 text-red-700 p-2 rounded line-through decoration-red-500/50">
                        {oldValue?.toString() || 'N/A'}
                    </div>
                </div>
                <div>
                    <span className="font-semibold block mb-1">&nbsp;</span>
                    <div className="bg-green-50 text-green-700 p-2 rounded">
                        {newValue?.toString() || 'N/A'}
                    </div>
                </div>
            </div>
        );
    };

    // Helper to render deduction rules
    const renderDeductionRules = (rules) => {
        if (!rules) return null;
        return (
            <div className="mt-3 space-y-3 bg-muted/30 p-3 rounded-lg border border-border">
                <h5 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Deduction Rules (% Deduction)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Screen Rules */}
                    {rules.screen && (
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Screen</span>
                            <div className="bg-card p-2 rounded border text-xs space-y-1">
                                <div className="flex justify-between"><span>Perfect:</span> <span>{rules.screen.perfect}%</span></div>
                                <div className="flex justify-between"><span>Scratched:</span> <span>{rules.screen.scratched}%</span></div>
                                <div className="flex justify-between"><span>Cracked:</span> <span>{rules.screen.cracked}%</span></div>
                            </div>
                        </div>
                    )}
                    {/* Body Rules */}
                    {rules.body && (
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Body</span>
                            <div className="bg-card p-2 rounded border text-xs space-y-1">
                                <div className="flex justify-between"><span>Perfect:</span> <span>{rules.body.perfect}%</span></div>
                                <div className="flex justify-between"><span>Scratched:</span> <span>{rules.body.scratched}%</span></div>
                                <div className="flex justify-between"><span>Damaged:</span> <span>{rules.body.damaged}%</span></div>
                            </div>
                        </div>
                    )}
                    {/* Battery Rules */}
                    {rules.battery && (
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Battery</span>
                            <div className="bg-card p-2 rounded border text-xs space-y-1">
                                <div className="flex justify-between"><span>Good:</span> <span>{rules.battery.good}%</span></div>
                                <div className="flex justify-between"><span>Average:</span> <span>{rules.battery.average}%</span></div>
                                <div className="flex justify-between"><span>Poor:</span> <span>{rules.battery.poor}%</span></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderRequestContent = (req) => {
        // Handle Status Change (Activation/Deactivation) specially
        if (req.type === 'UPDATE' && 'isActive' in req.data) {
            const isActivating = req.data.isActive;
            return (
                <div className={cn(
                    "p-4 rounded-lg border-l-4 flex flex-col gap-2",
                    isActivating ? "bg-green-50 border-green-500 text-green-800" : "bg-red-50 border-red-500 text-red-800"
                )}>
                    <p className="font-bold text-lg">
                        Admin wants to {isActivating ? 'ACTIVATE' : 'DEACTIVATE'} this phone
                    </p>
                    <p className="text-sm opacity-90">
                        {isActivating
                            ? "This mobile will be visible to users for selling."
                            : "This mobile will be hidden from users."}
                    </p>
                </div>
            );
        }

        if (req.type === 'CREATE') {
            return (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-muted-foreground">New Mobile Details</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Basic Info */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-muted/50 p-2 rounded">
                                    <span className="font-semibold block text-xs uppercase text-muted-foreground">Brand</span>
                                    {req.data.brand}
                                </div>
                                <div className="bg-muted/50 p-2 rounded">
                                    <span className="font-semibold block text-xs uppercase text-muted-foreground">Model</span>
                                    {req.data.phoneModel}
                                </div>
                                <div className="bg-muted/50 p-2 rounded col-span-2">
                                    <span className="font-semibold block text-xs uppercase text-muted-foreground">Base Price</span>
                                    <span className="text-lg font-bold text-primary">${req.data.basePrice}</span>
                                </div>
                            </div>
                        </div>

                        {/* Image */}
                        {req.data.image && (
                            <div className="flex items-center justify-center bg-muted/20 rounded p-2">
                                <div className="text-center">
                                    <span className="font-semibold block text-xs uppercase text-muted-foreground mb-1">Device Image</span>
                                    <img src={req.data.image} alt="Device" className="h-24 object-contain rounded-md border bg-white" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Deduction Rules */}
                    {req.data.deductionRules && renderDeductionRules(req.data.deductionRules)}
                </div>
            );
        }

        if (req.type === 'UPDATE') {
            return (
                <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Modified Fields</h4>
                    <div className="bg-card border rounded-lg overflow-hidden">
                        {Object.entries(req.data).map(([key, value]) => {
                            if (key === 'deductionRules') {
                                return (
                                    <div key={key} className="p-3 border-b last:border-0">
                                        <span className="font-bold text-primary capitalize text-sm block mb-2">
                                            Requested New {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                        {renderDeductionRules(value)}
                                    </div>
                                );
                            }
                            return (
                                <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b last:border-0 p-3 hover:bg-muted/10 transition-colors">
                                    <span className="font-medium capitalize text-sm text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    <div className="font-medium text-foreground mt-1 sm:mt-0 bg-secondary/50 px-2 py-1 rounded">
                                        {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        if (req.type === 'DELETE') {
            return (
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-start gap-3">
                    <div className="p-2 bg-destructive/10 rounded-full text-destructive">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-bold text-destructive">Request to DELETE Mobile</p>
                        <p className="text-sm text-destructive/80 mt-1">
                            This action will permanently remove <span className="font-semibold">{req.mobileId?.brand} {req.mobileId?.phoneModel}</span> from the system.
                        </p>
                    </div>
                </div>
            )
        }
    };


    return (
        <AdminLayout title="Requests" subtitle="Manage pending changes">
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-20 bg-muted/10 rounded-lg border border-dashed">
                    <p className="text-muted-foreground">No pending requests found.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {requests.map((req) => (
                        <div key={req._id} className="bg-card border rounded-lg shadow-sm overflow-hidden">
                            <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        "px-2.5 py-0.5 rounded-full text-xs font-bold border",
                                        req.type === 'CREATE' ? 'bg-green-100 text-green-700 border-green-200' :
                                            req.type === 'UPDATE' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                'bg-red-100 text-red-700 border-red-200'
                                    )}>
                                        {req.type}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{req.requestedBy?.name || 'Unknown User'}</span>
                                        <span className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                                {req.mobileId && (
                                    <div className="text-right hidden sm:block">
                                        <span className="text-xs text-muted-foreground block">Target Mobile</span>
                                        <span className="text-sm font-medium">{req.mobileId.phoneModel}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-5">
                                {renderRequestContent(req)}
                            </div>

                            <div className="px-5 py-3 bg-muted/30 border-t flex justify-end gap-3">
                                <Button variant="outline" size="sm" onClick={() => openRejectModal(req)}>
                                    Reject
                                </Button>
                                <Button size="sm" onClick={() => handleApprove(req._id)} className="bg-green-600 hover:bg-green-700 text-white">
                                    Approve
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Request</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject}>Confirm Rejection</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
