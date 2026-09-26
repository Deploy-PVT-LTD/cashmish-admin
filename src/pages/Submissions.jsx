import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Eye, ChevronLeft, ChevronRight, Loader2, MapPin, Phone, Download, X, DollarSign, RefreshCw, Pencil, AlertCircle, Trash2, Landmark, Mail, FileText, Upload, PartyPopper } from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import { formApi } from '@/lib/api';

export default function Submissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 700);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Image viewer state
  const [viewingImage, setViewingImage] = useState(null);

  // Counter offer modal state
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [bidSubmission, setBidSubmission] = useState(null);
  const [bidPrice, setBidPrice] = useState('');
  const [bidding, setBidding] = useState(false);
  const [isEditingBid, setIsEditingBid] = useState(false);
  const [uspsLabelNumber, setUspsLabelNumber] = useState('');
  const [labelFile, setLabelFile] = useState(null);

  // Customer accepted a differing counter offer — pops up once per submission
  // until the admin acknowledges it.
  const [acceptedPopup, setAcceptedPopup] = useState(null);
  const [ackingAcceptance, setAckingAcceptance] = useState(false);

  // Fetch submissions from API
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await formApi.getAll({
        page,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch
      });

      let forms;
      if (data.pagination) {
        forms = data.forms || [];
        setSubmissions(forms);
        setTotalItems(data.pagination.total);
        setTotalPages(data.pagination.pages);
      } else {
        forms = data.forms || data || [];
        setSubmissions(forms);
        setTotalItems(forms.length);
        setTotalPages(1);
      }

      // Surface the first not-yet-seen acceptance — the admin dismisses it,
      // which acknowledges just that one, then the next (if any) shows up on
      // the next refresh.
      const unseen = forms.find((s) => s.counterOfferStatus === 'accepted' && s.acceptanceSeenByAdmin === false);
      if (unseen) setAcceptedPopup(unseen);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error(error.response?.data?.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [page, debouncedSearch]);

  const filteredSubmissions = submissions.filter((s) => {
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesStatus;
  });

  const updateStatus = async (id, newStatus) => {
    try {
      setUpdating(true);
      await formApi.update(id, { status: newStatus });
      await fetchSubmissions();
      setSelectedSubmission(null);
      toast.success(`Submission ${newStatus}!`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleSoftDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete this submission?',
      text: "It will be marked as deleted (strikethrough) but not permanently removed.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });
    if (result.isConfirmed) {
      try {
        await formApi.delete(id);
        await fetchSubmissions();
        Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Submission has been soft-deleted.', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      } catch (error) {
        console.error('Error deleting submission:', error);
        toast.error('Failed to delete submission');
      }
    }
  };

  const handlePlaceBid = async () => {
    if (!bidSubmission || !bidPrice) return;

    const bidAmount = parseFloat(bidPrice);
    if (bidAmount <= 0) {
      toast.error('Counter offer must be greater than 0');
      return;
    }

    if (bidAmount > (bidSubmission?.estimatedPrice || Infinity)) {
      toast.error('Counter offer cannot be higher than the estimated price');
      return;
    }

    const alreadyHasLabel = Boolean(bidSubmission.uspsLabelUrl);
    if (!uspsLabelNumber.trim()) {
      toast.error('USPS label tracking number is required');
      return;
    }
    if (!labelFile && !alreadyHasLabel) {
      toast.error('Please upload the USPS shipping label PDF');
      return;
    }

    try {
      setBidding(true);
      const response = await formApi.setCounterOffer(bidSubmission._id, {
        bidPrice: bidAmount,
        uspsLabelNumber: uspsLabelNumber.trim(),
        labelFile,
      });
      console.log('Counter offer response:', response);
      await fetchSubmissions();
      setIsBidModalOpen(false);
      setBidSubmission(null);
      setBidPrice('');
      setUspsLabelNumber('');
      setLabelFile(null);
      setIsEditingBid(false);
      const matchesEstimate = bidAmount === bidSubmission.estimatedPrice;
      toast.success(
        matchesEstimate
          ? 'Counter offer set — customer notified, no acceptance needed.'
          : 'Counter offer sent — customer will need to accept it by email.'
      );
    } catch (error) {
      console.error('Error setting counter offer:', error);
      toast.error(error.response?.data?.message || 'Failed to set counter offer');
    } finally {
      setBidding(false);
    }
  };

  const handleAckAcceptance = async (id) => {
    try {
      setAckingAcceptance(true);
      await formApi.ackAcceptance(id);
      setAcceptedPopup(null);
      await fetchSubmissions();
    } catch (error) {
      console.error('Error acknowledging acceptance:', error);
      toast.error('Failed to dismiss');
    } finally {
      setAckingAcceptance(false);
    }
  };

  const handleCancelBid = async () => {
    if (!bidSubmission) return;

    try {
      setBidding(true);
      const bidData = {
        bidPrice: 0,
        status: 'pending'
      };
      await formApi.placeBid(bidSubmission._id, bidData);
      await fetchSubmissions();
      setIsBidModalOpen(false);
      setBidSubmission(null);
      setBidPrice('');
      setIsEditingBid(false);
      toast.success('Bid cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling bid:', error);
      toast.error('Failed to cancel bid');
    } finally {
      setBidding(false);
    }
  };

  const openBidModal = (submission, isEdit = false) => {
    setBidSubmission(submission);
    setBidPrice(submission.bidPrice > 0 ? submission.bidPrice.toString() : (submission.estimatedPrice?.toString() || ''));
    setUspsLabelNumber(submission.uspsLabelNumber || '');
    setLabelFile(null);
    setIsEditingBid(isEdit);
    setIsBidModalOpen(true);
  };

  const downloadImage = async (imageUrl, index) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `phone-image-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded!');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge-pending">Pending</span>;
      case 'accepted':
        return <span className="badge-accepted">Accepted</span>;
      case 'rejected':
        return <span className="badge-rejected">Rejected</span>;
      case 'bid_placed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info">Counter Offer Sent</span>;
      default:
        return <span className="badge-pending">{status}</span>;
    }
  };

  const getConditionLabel = (type, value) => {
    const labels = {
      screenCondition: { perfect: 'Perfect', scratched: 'Scratched', cracked: 'Cracked' },
      bodyCondition: { perfect: 'Perfect', scratched: 'Scratched', damaged: 'Damaged' },
      batteryCondition: { good: 'Good', average: 'Average', poor: 'Poor' },
    };
    return labels[type]?.[value] || value;
  };

  // A = best condition ... F = worst. Not shown to the customer — only here, to
  // the admin — so bids/inspection can be judged against the exact grade the
  // system priced the offer at.
  const GRADE_COLORS = {
    A: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    B: 'bg-green-100 text-green-700 border-green-200',
    C: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    D: 'bg-orange-100 text-orange-700 border-orange-200',
    E: 'bg-red-100 text-red-700 border-red-200',
    F: 'bg-red-200 text-red-800 border-red-300',
  };
  const getGradeBadge = (grade) => {
    if (!grade) return <span className="text-xs text-muted-foreground">—</span>;
    return (
      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border ${GRADE_COLORS[grade] || 'bg-muted text-muted-foreground border-border'}`}>
        {grade}
      </span>
    );
  };

  // Check if bid is valid
  const isBidValid = bidPrice && parseFloat(bidPrice) > 0;
  const showBidError = bidPrice !== '' && parseFloat(bidPrice) <= 0;

  // Loading check moved inside render to keep inputs mounted

  return (
    <AdminLayout title="Submissions" subtitle="Review and manage phone submissions">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-card">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border z-50">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="bid_placed">Counter Offer Sent</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchSubmissions}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading submissions...</span>
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No submissions found.</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="block lg:hidden space-y-3">
            {filteredSubmissions.map((submission) => (
              <div key={submission._id} className={`stat-card ${submission.isDeleted ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-xs font-bold text-primary mb-0.5">
                      CM#{submission.submissionId || '?'}
                    </p>
                    <p className={`font-medium text-foreground truncate ${submission.isDeleted ? 'line-through text-muted-foreground' : ''}`}>{submission.pickUpDetails?.fullName}</p>
                    <p className={`text-xs text-muted-foreground truncate ${submission.isDeleted ? 'line-through' : ''}`}>{submission.pickUpDetails?.phoneNumber}</p>
                  </div>
                  {submission.isDeleted ? (
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">Deleted</span>
                  ) : getStatusBadge(submission.status)}
                </div>
                <div className={`space-y-2 text-sm ${submission.isDeleted ? 'line-through text-muted-foreground' : ''}`}>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="text-foreground font-medium truncate ml-2 max-w-[150px]">
                      {submission.mobileId?.phoneModel || submission.mobileId?.brand || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Storage:</span>
                    <span className="text-foreground">{submission.storage}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Grade:</span>
                    {getGradeBadge(submission.grade)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Price:</span>
                    <span className="text-foreground font-bold">${submission.estimatedPrice?.toLocaleString() || 'N/A'}</span>
                  </div>
                  {submission.bidPrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Counter Offer:</span>
                      <span className="text-info font-bold">${submission.bidPrice?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-border flex gap-2">
                  {!submission.isDeleted && (
                    <>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedSubmission(submission)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      {submission.status === 'pending' && (
                        <Button size="sm" className="flex-1 bg-info hover:bg-info/90" onClick={() => openBidModal(submission)}>
                          <DollarSign className="w-4 h-4 mr-2" />
                          Counter Offer
                        </Button>
                      )}
                      {submission.bidPrice > 0 && ['pending', 'bid_placed'].includes(submission.status) && (
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => openBidModal(submission, true)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </>
                  )}
                  {!submission.isDeleted && (
                    <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleSoftDelete(submission._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="data-table hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">ID</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Customer</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Phone</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Storage</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Grade</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Est. Price</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Counter Offer</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Status</th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission._id} className={`border-t border-border transition-colors ${submission.isDeleted ? 'opacity-50 bg-red-50/30' : 'hover:bg-muted/30'}`}>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${submission.isDeleted ? 'bg-red-100 text-red-500 line-through' : 'bg-primary/10 text-primary'}`}>
                          CM#{submission.submissionId || '?'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate max-w-[150px] ${submission.isDeleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{submission.pickUpDetails?.fullName}</p>
                          <p className={`text-xs truncate max-w-[150px] ${submission.isDeleted ? 'line-through' : ''} text-muted-foreground`}>{submission.pickUpDetails?.phoneNumber}</p>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-sm ${submission.isDeleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {submission.mobileId?.brand} {submission.mobileId?.phoneModel}
                      </td>
                      <td className={`px-6 py-4 text-sm ${submission.isDeleted ? 'line-through' : ''} text-muted-foreground`}>{submission.storage}</td>
                      <td className="px-6 py-4">
                        {getGradeBadge(submission.grade)}
                      </td>
                      <td className={`px-6 py-4 text-sm font-medium ${submission.isDeleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>${submission.estimatedPrice?.toLocaleString() || 'N/A'}</td>
                      <td className={`px-6 py-4 text-sm font-bold ${submission.isDeleted ? 'line-through text-muted-foreground' : 'text-info'}`}>{submission.bidPrice > 0 ? `$${submission.bidPrice.toLocaleString()}` : '-'}</td>
                      <td className="px-6 py-4">
                        {submission.isDeleted ? (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">Deleted</span>
                        ) : getStatusBadge(submission.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          {!submission.isDeleted && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedSubmission(submission)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              {submission.status === 'pending' && (
                                <Button variant="ghost" size="sm" className="text-info hover:text-info" onClick={() => openBidModal(submission)}>
                                  <DollarSign className="w-4 h-4" />
                                </Button>
                              )}
                              {submission.bidPrice > 0 && ['pending', 'bid_placed'].includes(submission.status) && (
                                <Button variant="ghost" size="sm" className="text-warning hover:text-warning" onClick={() => openBidModal(submission, true)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleSoftDelete(submission._id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalItems}
              itemsPerPage={ITEMS_PER_PAGE}
              itemName="submissions"
            />
          </div>
        </>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="bg-card max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6 mt-4">
              {/* Customer & Pickup Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Submission ID</p>
                  <p className="text-foreground font-bold text-primary">
                    {selectedSubmission.submissionId ? `CM#${selectedSubmission.submissionId}` : `#${selectedSubmission._id.slice(-4).toUpperCase()}`}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="text-foreground font-medium truncate">{selectedSubmission.pickUpDetails?.fullName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {selectedSubmission.pickUpDetails?.phoneNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-foreground font-medium truncate">{selectedSubmission.pickUpDetails?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  {selectedSubmission.paymentMethod === 'zelle' ? (
                    <p className="text-foreground font-medium flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Zelle — {selectedSubmission.zelleDetails?.contact || 'N/A'}
                    </p>
                  ) : selectedSubmission.paymentMethod === 'bank' ? (
                    <div className="text-foreground text-sm">
                      <p className="font-medium flex items-center gap-1"><Landmark className="w-3 h-3" /> Bank Account</p>
                      <p className="text-muted-foreground mt-1">{selectedSubmission.bankAccountDetails?.accountHolderName}</p>
                      <p className="text-muted-foreground">Routing: {selectedSubmission.bankAccountDetails?.routingNumber}</p>
                      <p className="text-muted-foreground">Account: {selectedSubmission.bankAccountDetails?.accountNumber} ({selectedSubmission.bankAccountDetails?.accountType})</p>
                    </div>
                  ) : (
                    <p className="text-foreground font-medium">Not selected</p>
                  )}
                </div>
              </div>

              {/* USPS Shipping Label */}
              {(selectedSubmission.uspsLabelNumber || selectedSubmission.uspsLabelUrl) && (
                <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                      <FileText className="w-3 h-3" />
                      USPS Shipping Label
                    </p>
                    <p className="text-foreground text-sm font-medium">{selectedSubmission.uspsLabelNumber || 'No tracking number yet'}</p>
                  </div>
                  {selectedSubmission.uspsLabelUrl && (
                    <Button variant="outline" size="sm" onClick={() => window.open(selectedSubmission.uspsLabelUrl, '_blank')}>
                      <Download className="w-4 h-4 mr-2" />
                      View Label PDF
                    </Button>
                  )}
                </div>
              )}

              {/* Address */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3" />
                  Pickup Address
                </p>
                <p className="text-foreground">{selectedSubmission.pickUpDetails?.address?.addressText || 'No address'}</p>
              </div>

              {/* Phone Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-foreground mb-3 truncate">
                  {selectedSubmission.mobileId?.brand} {selectedSubmission.mobileId?.phoneModel} • {selectedSubmission.storage}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carrier:</span>
                    <span className="text-foreground truncate ml-2">{selectedSubmission.carrier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Screen:</span>
                    <span className="text-foreground truncate ml-2">{getConditionLabel('screenCondition', selectedSubmission.screenCondition)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Body:</span>
                    <span className="text-foreground truncate ml-2">{getConditionLabel('bodyCondition', selectedSubmission.bodyCondition)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Battery:</span>
                    <span className="text-foreground">{getConditionLabel('batteryCondition', selectedSubmission.batteryCondition)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    {getStatusBadge(selectedSubmission.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Condition:</span>
                    <span className="text-foreground truncate ml-2">{getConditionLabel('condition', selectedSubmission.condition)}</span>
                  </div>
                </div>
              </div>

              {/* Images with View & Download */}
              {selectedSubmission.images?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Uploaded Images (click to view)</p>
                  <div className="flex gap-3 flex-wrap">
                    {selectedSubmission.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`Phone ${idx + 1}`}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border border-border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setViewingImage(img)}
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute -bottom-2 -right-2 w-7 h-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(img, idx);
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price & Bid */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-foreground font-medium">Estimated Price</span>
                    {getGradeBadge(selectedSubmission.grade)}
                  </div>
                  <span className="text-2xl font-bold text-primary">${selectedSubmission.estimatedPrice?.toLocaleString() || 'N/A'}</span>
                </div>
                {selectedSubmission.bidPrice > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-info/5 border border-info/20 rounded-lg gap-2">
                    <span className="text-foreground font-medium">Counter Offer</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-info">${selectedSubmission.bidPrice?.toLocaleString()}</span>
                      {['pending', 'bid_placed'].includes(selectedSubmission.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-warning hover:text-warning"
                          onClick={() => {
                            setSelectedSubmission(null);
                            openBidModal(selectedSubmission, true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedSubmission.status === 'pending' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1 bg-info hover:bg-info/90"
                    onClick={() => {
                      const sub = selectedSubmission;
                      setSelectedSubmission(null);
                      openBidModal(sub);
                    }}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Set Counter Offer
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => updateStatus(selectedSubmission._id, 'rejected')}
                    disabled={updating}
                  >
                    {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Reject
                  </Button>
                </div>
              )}

              {/* Edit Bid Button for already bid items */}
              {selectedSubmission.bidPrice > 0 && ['pending', 'bid_placed'].includes(selectedSubmission.status) && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const sub = selectedSubmission;
                    setSelectedSubmission(null);
                    openBidModal(sub, true);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Counter Offer
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="bg-card max-w-[95vw] sm:max-w-4xl p-0 overflow-hidden">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
              onClick={() => setViewingImage(null)}
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-12 z-10"
              onClick={() => {
                if (viewingImage) {
                  const idx = selectedSubmission?.images?.indexOf(viewingImage) || 0;
                  downloadImage(viewingImage, idx);
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            {viewingImage && (
              <img
                src={viewingImage}
                alt="Full size"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Counter Offer Modal */}
      <Dialog open={isBidModalOpen} onOpenChange={(open) => {
        setIsBidModalOpen(open);
        if (!open) {
          setIsEditingBid(false);
          setBidPrice('');
          setUspsLabelNumber('');
          setLabelFile(null);
        }
      }}>
        <DialogContent className="bg-card max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditingBid ? 'Edit Counter Offer' : 'Set Counter Offer'}</DialogTitle>
          </DialogHeader>
          {bidSubmission && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-foreground truncate">
                  {bidSubmission.mobileId?.brand} {bidSubmission.mobileId?.phoneModel}
                </h4>
                <p className="text-sm text-muted-foreground">{bidSubmission.storage} • {bidSubmission.pickUpDetails?.fullName}</p>
              </div>

              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-muted-foreground">System Estimated Price</p>
                <p className="text-xl font-bold text-primary">${bidSubmission.estimatedPrice?.toLocaleString() || 'N/A'}</p>
              </div>

              {isEditingBid && bidSubmission.bidPrice > 0 && (
                <div className="p-3 bg-info/5 border border-info/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Counter Offer</p>
                  <p className="text-xl font-bold text-info">${bidSubmission.bidPrice?.toLocaleString()}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Counter Offer Amount ($)</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter the counter offer amount"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  className={showBidError ? 'border-destructive' : ''}
                />
                {showBidError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Counter offer must be greater than 0
                  </p>
                )}
                {isBidValid && bidSubmission.estimatedPrice && (
                  <p className={`text-sm font-medium ${parseFloat(bidPrice) < bidSubmission.estimatedPrice ? 'text-success' : 'text-warning'}`}>
                    {parseFloat(bidPrice) < bidSubmission.estimatedPrice
                      ? `$${(bidSubmission.estimatedPrice - parseFloat(bidPrice)).toLocaleString()} below estimate — customer will need to accept this by email`
                      : parseFloat(bidPrice) > bidSubmission.estimatedPrice
                        ? `$${(parseFloat(bidPrice) - bidSubmission.estimatedPrice).toLocaleString()} above estimate — customer will need to accept this by email`
                        : 'Same as estimate — customer will just be notified, no acceptance needed'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>USPS Label Tracking Number</Label>
                <Input
                  placeholder="e.g. 9400111899223197428490"
                  value={uspsLabelNumber}
                  onChange={(e) => setUspsLabelNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>USPS Label PDF</Label>
                <label className="flex items-center gap-2 border border-dashed border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors">
                  <Upload className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{labelFile ? labelFile.name : (bidSubmission.uspsLabelUrl ? 'Replace uploaded label (optional)' : 'Upload label PDF')}</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setLabelFile(e.target.files?.[0] || null)}
                  />
                </label>
                {bidSubmission.uspsLabelUrl && !labelFile && (
                  <a href={bidSubmission.uspsLabelUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                    <FileText className="w-3 h-3" /> View currently uploaded label
                  </a>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handlePlaceBid}
                  className="flex-1 bg-info hover:bg-info/90"
                  disabled={bidding || !isBidValid}
                >
                  {bidding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isEditingBid ? 'Updating...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      {isEditingBid ? 'Update Counter Offer' : 'Send Counter Offer'}
                    </>
                  )}
                </Button>
                {isEditingBid && bidSubmission.bidPrice > 0 && (
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={handleCancelBid}
                    disabled={bidding}
                  >
                    {bidding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Customer Accepted Counter Offer — popup */}
      <Dialog open={!!acceptedPopup} onOpenChange={(open) => { if (!open) setAcceptedPopup(null); }}>
        <DialogContent className="bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-success" />
              Customer Accepted the Counter Offer
            </DialogTitle>
          </DialogHeader>
          {acceptedPopup && (
            <div className="space-y-4 mt-2">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-foreground truncate">
                  {acceptedPopup.mobileId?.brand} {acceptedPopup.mobileId?.phoneModel}
                </h4>
                <p className="text-sm text-muted-foreground">CM#{acceptedPopup.submissionId} • {acceptedPopup.pickUpDetails?.fullName}</p>
              </div>
              <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Accepted Counter Offer</p>
                <p className="text-xl font-bold text-success">${acceptedPopup.bidPrice?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Details</p>
                {acceptedPopup.paymentMethod === 'zelle' ? (
                  <p className="text-foreground text-sm flex items-center gap-1"><Mail className="w-3 h-3" /> Zelle — {acceptedPopup.zelleDetails?.contact}</p>
                ) : (
                  <div className="text-foreground text-sm space-y-0.5">
                    <p>{acceptedPopup.bankAccountDetails?.accountHolderName}</p>
                    <p className="text-muted-foreground">Routing: {acceptedPopup.bankAccountDetails?.routingNumber}</p>
                    <p className="text-muted-foreground">Account: {acceptedPopup.bankAccountDetails?.accountNumber} ({acceptedPopup.bankAccountDetails?.accountType})</p>
                  </div>
                )}
              </div>
              <Button className="w-full" onClick={() => handleAckAcceptance(acceptedPopup._id)} disabled={ackingAcceptance}>
                {ackingAcceptance ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Got it
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Info Note */}
      {/* <div className="mt-6 p-4 bg-info/10 border border-info/20 rounded-lg">
        <p className="text-sm text-info">
          <strong>API Connected:</strong> Submissions are now fetched from your backend at <code className="bg-muted px-1 rounded">https://cashmish-backend.onrender.com/api/forms</code>
        </p>
      </div> */}
    </AdminLayout>
  );
}
