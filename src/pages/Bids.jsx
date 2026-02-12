import { useState, useEffect } from 'react';
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
import { Search, Gavel, Loader2, RefreshCw, Pencil, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formApi } from '@/lib/api';

export default function Bids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBid, setSelectedBid] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch forms/submissions from API
  const fetchBids = async () => {
    try {
      setLoading(true);
      const response = await formApi.getAll();
      console.log('Bids API response:', response);
      const formsData = Array.isArray(response) ? response : response.forms || [];
      console.log('Forms data:', formsData);
      setBids(formsData);
    } catch (error) {
      console.error('Error fetching bids:', error);
      toast.error('Failed to fetch bids');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, []);

  const filteredBids = bids.filter(
    (b) =>
      b.pickUpDetails?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.mobileId?.phoneModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.mobileId?.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (bid) => {
    // Determine status based on bidPrice
    if (bid.bidPrice && bid.bidPrice > 0) {
      return <span className="badge-active">Bid Placed</span>;
    }
    return <span className="badge-pending">Awaiting Bid</span>;
  };

  // Check if bid is valid
  const isBidValid = bidAmount && parseFloat(bidAmount) > 0;
  const showBidError = bidAmount !== '' && parseFloat(bidAmount) <= 0;

  const handlePlaceBid = async () => {
    if (!selectedBid || !bidAmount) return;

    const amount = parseFloat(bidAmount);
    if (amount <= 0) {
      toast.error('Bid amount must be greater than 0');
      return;
    }

    try {
      setSubmitting(true);

      await formApi.placeBid(selectedBid._id, {
        bidPrice: amount,
        status: 'bid_placed'
      });

      // Refresh bids list
      await fetchBids();

      toast.success(isEditing ? 'Bid updated successfully!' : `Bid of $${amount.toLocaleString()} placed successfully!`);
      setSelectedBid(null);
      setBidAmount('');
      setIsEditing(false);
    } catch (error) {
      console.error('Error placing bid:', error);
      toast.error('Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBid = async () => {
    if (!selectedBid) return;

    try {
      setSubmitting(true);

      await formApi.placeBid(selectedBid._id, {
        bidPrice: 0,
        status: 'pending'
      });

      // Refresh bids list
      await fetchBids();

      toast.success('Bid cancelled successfully!');
      setSelectedBid(null);
      setBidAmount('');
      setIsEditing(false);
    } catch (error) {
      console.error('Error cancelling bid:', error);
      toast.error('Failed to cancel bid');
    } finally {
      setSubmitting(false);
    }
  };

  const openBidModal = (bid, isEdit = false) => {
    setSelectedBid(bid);
    setBidAmount(bid.bidPrice > 0 ? bid.bidPrice.toString() : (bid.estimatedPrice || 0).toString());
    setIsEditing(isEdit);
  };

  if (loading) {
    return (
      <AdminLayout title="Bids" subtitle="Place and manage final price bids">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Bids" subtitle="Place and manage final price bids">
      {/* Search & Refresh */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={fetchBids}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {bids.length === 0 ? (
        <div className="stat-card text-center py-12">
          <p className="text-muted-foreground">No submissions found. Make sure your backend is running.</p>
        </div>
      ) : (
        /* Bids Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredBids.map((bid) => (
            <div key={bid._id} className="stat-card">
              <div className="flex items-start justify-between mb-4 gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-foreground truncate">
                    {bid.mobileId?.brand} {bid.mobileId?.phoneModel}
                  </h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {bid.storage} • {bid.pickUpDetails?.fullName}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(bid)}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">System Price:</span>
                  <span className="text-foreground font-medium">
                    ${(bid.estimatedPrice || 0).toLocaleString()}
                  </span>
                </div>
                {bid.bidPrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Your Bid:</span>
                    <span className="text-primary font-semibold">
                      ${bid.bidPrice.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Condition:</span>
                  <span className="text-foreground">{bid.screenCondition || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Submitted:</span>
                  <span className="text-foreground">
                    {new Date(bid.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-border">
                {bid.bidPrice === 0 || !bid.bidPrice ? (
                  <Button
                    className="w-full bg-primary hover:bg-primary-hover text-primary-foreground text-sm"
                    onClick={() => openBidModal(bid)}
                  >
                    <Gavel className="w-4 h-4 mr-2" />
                    Place Bid
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 text-sm"
                      onClick={() => openBidModal(bid, true)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="text-sm border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => {
                        setSelectedBid(bid);
                        setIsEditing(true);
                        handleCancelBid();
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bid Modal */}
      <Dialog open={!!selectedBid} onOpenChange={(open) => {
        if (!open) {
          setSelectedBid(null);
          setIsEditing(false);
          setBidAmount('');
        }
      }}>
        <DialogContent className="bg-card max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Your Bid' : 'Place Your Bid'}</DialogTitle>
          </DialogHeader>
          {selectedBid && (
            <div className="space-y-6 mt-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-foreground truncate">
                  {selectedBid.mobileId?.brand} {selectedBid.mobileId?.phoneModel}
                </h4>
                <p className="text-sm text-muted-foreground truncate">
                  {selectedBid.storage} • {selectedBid.pickUpDetails?.fullName}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-secondary rounded-lg gap-2">
                <span className="text-muted-foreground">System Estimated Price</span>
                <span className="text-xl font-bold text-foreground">
                  ${(selectedBid.estimatedPrice || 0).toLocaleString()}
                </span>
              </div>

              {isEditing && selectedBid.bidPrice > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-info/10 border border-info/20 rounded-lg gap-2">
                  <span className="text-muted-foreground">Current Bid</span>
                  <span className="text-xl font-bold text-info">
                    ${selectedBid.bidPrice.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label>Your Final Bid ($)</Label>
                <Input
                  type="number"
                  min="1"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Enter your bid amount"
                  className={`text-lg font-semibold ${showBidError ? 'border-destructive' : ''}`}
                />
                {showBidError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Bid amount must be greater than 0
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  This is the final price you're willing to pay for this device
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handlePlaceBid}
                  className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground"
                  disabled={!isBidValid || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isEditing ? 'Updating...' : 'Placing Bid...'}
                    </>
                  ) : (
                    <>
                      <Gavel className="w-4 h-4 mr-2" />
                      {isEditing ? 'Update Bid' : 'Confirm Bid'}
                    </>
                  )}
                </Button>
                {isEditing && selectedBid.bidPrice > 0 && (
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={handleCancelBid}
                    disabled={submitting}
                  >
                    Cancel Bid
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Info Note */}
      {/* <div className="mt-6 p-4 bg-info/10 border border-info/20 rounded-lg">
        <p className="text-sm text-info">
          <strong>API Connected:</strong> Bids fetched from <code className="bg-muted px-1 rounded">http://localhost:5000/api/forms</code>
        </p>
      </div> */}
    </AdminLayout>
  );
}
