import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Package,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Eye,
  Pencil,
  Trash2,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { inventoryApi, formApi } from '@/lib/api';

// Exchange rate (can be changed in settings)
const USD_TO_PKR = 278;

// Form component moved OUTSIDE to prevent re-renders
function InventoryForm({ formData, setFormData, onSubmit, isEdit, submitting }) {
  return (
    <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phone Model</Label>
          <Input
            placeholder="e.g., iPhone 15 Pro"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Storage</Label>
          <Select value={formData.storage} onValueChange={(value) => setFormData(prev => ({ ...prev, storage: value }))}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select storage" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              <SelectItem value="64GB">64GB</SelectItem>
              <SelectItem value="128GB">128GB</SelectItem>
              <SelectItem value="256GB">256GB</SelectItem>
              <SelectItem value="512GB">512GB</SelectItem>
              <SelectItem value="1TB">1TB</SelectItem>
              <SelectItem value="2TB">2TB</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>IMEI Number</Label>
        <Input
          placeholder="15-digit IMEI"
          value={formData.imei}
          onChange={(e) => setFormData(prev => ({ ...prev, imei: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Purchase Price (USD)</Label>
          <Input
            type="number"
            placeholder="e.g., 650"
            value={formData.purchasePriceUSD}
            onChange={(e) => setFormData(prev => ({ ...prev, purchasePriceUSD: e.target.value }))}
          />
          {formData.purchasePriceUSD && (
            <p className="text-xs text-muted-foreground">
              ≈ PKR {(parseFloat(formData.purchasePriceUSD) * USD_TO_PKR).toLocaleString()}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Purchase Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.purchaseDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.purchaseDate ? format(formData.purchaseDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card" align="start">
              <Calendar
                mode="single"
                selected={formData.purchaseDate}
                onSelect={(date) => date && setFormData(prev => ({ ...prev, purchaseDate: date }))}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Supplier / Source</Label>
        <Input
          placeholder="e.g., US Dealer - John"
          value={formData.supplier}
          onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Condition</Label>
        <Select value={formData.condition} onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}>
          <SelectTrigger className="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border z-50">
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Like New">Like New</SelectItem>
            <SelectItem value="Good">Good</SelectItem>
            <SelectItem value="Fair">Fair</SelectItem>
            <SelectItem value="Poor">Poor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Notes (Optional)</Label>
        <Textarea
          placeholder="Any additional notes about the device..."
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
        />
      </div>

      <Button
        onClick={onSubmit}
        className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
        disabled={!formData.phone || !formData.storage || !formData.purchasePriceUSD || submitting}
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEdit ? 'Save Changes' : 'Add to Inventory')}
      </Button>
    </div>
  );
}

// Sell Form component moved OUTSIDE
function SellForm({ sellFormData, setSellFormData, sellingItem, onSubmit, USD_TO_PKR, submitting }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-semibold text-foreground truncate">{sellingItem.phone}</h4>
        <p className="text-sm text-muted-foreground">{sellingItem.storage} • Purchased at ${sellingItem.purchasePriceUSD}</p>
        <p className="text-xs text-muted-foreground">(≈ PKR {(sellingItem.purchasePriceUSD * USD_TO_PKR).toLocaleString()})</p>
      </div>

      <div className="space-y-2">
        <Label>Sale Price (PKR)</Label>
        <Input
          type="number"
          placeholder="e.g., 200000"
          value={sellFormData.salePricePKR}
          onChange={(e) => setSellFormData(prev => ({ ...prev, salePricePKR: e.target.value }))}
        />
        {sellFormData.salePricePKR && (
          <p className={cn(
            "text-sm font-medium",
            parseFloat(sellFormData.salePricePKR) > sellingItem.purchasePriceUSD * USD_TO_PKR ? "text-success" : "text-destructive"
          )}>
            Expected Profit: PKR {(parseFloat(sellFormData.salePricePKR) - sellingItem.purchasePriceUSD * USD_TO_PKR).toLocaleString()}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Buyer Name</Label>
        <Input
          placeholder="Customer name"
          value={sellFormData.buyer}
          onChange={(e) => setSellFormData(prev => ({ ...prev, buyer: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Buyer Phone</Label>
        <Input
          placeholder="+92 xxx xxxxxxx"
          value={sellFormData.buyerPhone}
          onChange={(e) => setSellFormData(prev => ({ ...prev, buyerPhone: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Sale Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(sellFormData.saleDate, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card" align="start">
            <Calendar
              mode="single"
              selected={sellFormData.saleDate}
              onSelect={(date) => date && setSellFormData(prev => ({ ...prev, saleDate: date }))}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button
        onClick={onSubmit}
        className="w-full bg-success hover:bg-success/90 text-success-foreground"
        disabled={!sellFormData.salePricePKR || !sellFormData.buyer || submitting}
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mark as Sold'}
      </Button>
    </div>
  );
}

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellingItem, setSellingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    storage: '',
    imei: '',
    purchasePriceUSD: '',
    supplier: '',
    purchaseDate: new Date(),
    condition: 'New',
    notes: '',
  });

  const [sellFormData, setSellFormData] = useState({
    salePricePKR: '',
    buyer: '',
    buyerPhone: '',
    saleDate: new Date(),
  });

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Fetch Inventory & Submissions
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [invData, formsData] = await Promise.all([
        inventoryApi.getAll({ page, limit: ITEMS_PER_PAGE, search: debouncedSearch }).catch(() => ({ inventory: [], pagination: { total: 0, pages: 0 } })),
        formApi.getAll({ page, limit: ITEMS_PER_PAGE, search: debouncedSearch }).catch(() => ({ forms: [], pagination: { total: 0, pages: 0 } })),
      ]);

      // Handle Inventory Data
      const manualInventoryData = invData.inventory || (Array.isArray(invData) ? invData : []);
      const manualInventory = manualInventoryData.map(item => ({
        ...item,
        phone: item.phoneModel,
        imei: item.imeiNumber,
        purchasePriceUSD: item.purchasePrice,
        supplier: item.source,
        salePricePKR: item.salePrice !== undefined ? item.salePrice : item.salePricePKR,
        saleDate: item.saleDate ? format(new Date(item.saleDate), 'yyyy-MM-dd') : null,
        buyer: item.buyer,
      }));

      const invTotal = invData.pagination?.total || manualInventory.length;
      const invPages = invData.pagination?.pages || 1;

      // Handle Submissions Data
      const submissions = formsData.forms || (Array.isArray(formsData) ? formsData : []);
      const formsTotal = formsData.pagination?.total || submissions.length;
      const formsPages = formsData.pagination?.pages || 1;

      // Process accepted submissions into inventory items
      const submissionInventory = submissions
        .filter(sub => sub.status === 'accepted')
        .map(sub => ({
          _id: `sub_${sub._id}`,
          isSubmission: true,
          originalId: sub._id,
          phone: `${sub.mobileId?.brand || ''} ${sub.mobileId?.phoneModel || ''}`,
          storage: sub.storage,
          imei: '',
          purchasePriceUSD: sub.bidPrice || 0,
          salePricePKR: null,
          purchaseDate: sub.createdAt ? format(new Date(sub.createdAt), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          saleDate: null,
          supplier: `Submitted by: ${sub.pickUpDetails?.fullName || 'Unknown'}`,
          buyer: null,
          buyerPhone: null,
          status: 'In Stock',
          condition: sub.bodyCondition === 'perfect' ? 'New' : sub.bodyCondition === 'scratched' ? 'Good' : 'Fair',
          notes: `From Submission. Pickup: ${sub.pickUpDetails?.address?.addressText || 'N/A'}`,
        }));

      setInventory([...manualInventory, ...submissionInventory]);
      setTotalItems(invTotal + formsTotal); // Approximation
      setTotalPages(Math.max(invPages, formsPages));

    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error(error.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [page, debouncedSearch]);

  // Calculate stats
  const totalPurchaseCost = inventory.reduce((sum, item) => sum + (item.purchasePriceUSD || 0), 0);
  const totalSalesRevenue = inventory.filter(i => i.status === 'Sold' || i.status === 'sold').reduce((sum, item) => sum + (item.salePricePKR || 0), 0);
  const totalPurchaseCostSold = inventory.filter(i => i.status === 'Sold' || i.status === 'sold').reduce((sum, item) => sum + (item.purchasePriceUSD || 0), 0);
  const totalPurchaseCostSoldPKR = totalPurchaseCostSold * USD_TO_PKR;
  const totalProfit = totalSalesRevenue - totalPurchaseCostSoldPKR;
  const profitMargin = totalSalesRevenue > 0 ? ((totalProfit / totalSalesRevenue) * 100).toFixed(1) : 0;
  const inStockCount = inventory.filter(i => i.status === 'In Stock' || i.status === 'in_stock').length;
  const count = inventory.length;

  const filteredInventory = inventory.filter((item) => {
    // Normalize status for filtering
    const itemStatus = item.status === 'in_stock' ? 'In Stock' : item.status === 'sold' ? 'Sold' : item.status;
    const matchesStatus = statusFilter === 'all' || itemStatus === statusFilter;

    return matchesStatus;
  });

  const calculateProfit = (item) => {
    if (!item.salePricePKR) return null;
    const purchasePKR = (item.purchasePriceUSD || 0) * USD_TO_PKR;
    return item.salePricePKR - purchasePKR;
  };

  const resetForm = () => {
    setFormData({
      phone: '',
      storage: '',
      imei: '',
      purchasePriceUSD: '',
      supplier: '',
      purchaseDate: new Date(),
      condition: 'Good',
      notes: '',
    });
  };

  const handleAddItem = async () => {
    try {
      setSubmitting(true);
      const newItem = {
        phoneModel: formData.phone,
        storage: formData.storage,
        imeiNumber: formData.imei,
        purchasePrice: parseFloat(formData.purchasePriceUSD),
        purchaseDate: format(formData.purchaseDate, 'yyyy-MM-dd'),
        source: formData.supplier,
        condition: formData.condition,
        notes: formData.notes,
        status: 'In Stock',
      };
      await inventoryApi.create(newItem);
      await fetchInventory();
      resetForm();
      setIsAddModalOpen(false);
      toast.success('Item added to inventory!');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditItem = async () => {
    if (!editingItem) return;
    try {
      setSubmitting(true);
      const itemData = {
        phoneModel: formData.phone,
        storage: formData.storage,
        imeiNumber: formData.imei,
        purchasePrice: parseFloat(formData.purchasePriceUSD),
        purchaseDate: format(formData.purchaseDate, 'yyyy-MM-dd'),
        source: formData.supplier,
        condition: formData.condition,
        notes: formData.notes,
        salePrice: editingItem.salePricePKR,
        saleDate: editingItem.saleDate,
        buyer: editingItem.buyer,
      };

      if (editingItem.isSubmission) {
        // If editing a submission, create a NEW inventory item (effectively 'importing' it)
        // Optionally we could mark the submission as 'processed' via API if endpoint existed
        await inventoryApi.create({
          ...itemData,
          status: editingItem.status || 'In Stock'
        });
        toast.success('Submission converted to Inventory Item!');
      } else {
        // Normal update
        await inventoryApi.update(editingItem._id, itemData);
        toast.success('Item updated successfully!');
      }

      await fetchInventory();
      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSellItem = async () => {
    if (!sellingItem) return;
    try {
      setSubmitting(true);
      const saleData = {
        salePrice: parseFloat(sellFormData.salePricePKR),
        buyer: sellFormData.buyer,
        saleDate: format(sellFormData.saleDate, 'yyyy-MM-dd'),
        status: 'Sold',
      };

      if (sellingItem.isSubmission) {
        // If selling a submission directly, create it as a sold inventory item
        await inventoryApi.create({
          phoneModel: sellingItem.phone,
          storage: sellingItem.storage,
          imeiNumber: sellingItem.imei || '', // Ask user for IMEI? For now empty
          purchasePrice: sellingItem.purchasePriceUSD,
          purchaseDate: sellingItem.purchaseDate ? format(new Date(sellingItem.purchaseDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          source: sellingItem.supplier,
          condition: sellingItem.condition,
          notes: sellingItem.notes,
          ...saleData
        });
        toast.success('Submission sold and added to records!');
      } else {
        await inventoryApi.update(sellingItem._id, saleData);
        toast.success('Item marked as sold!');
      }

      await fetchInventory();
      setSellingItem(null);
      setIsSellModalOpen(false);
      setSellFormData({ salePricePKR: '', buyer: '', buyerPhone: '', saleDate: new Date() });
    } catch (error) {
      console.error('Error selling item:', error);
      toast.error('Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  };

  const [itemToDelete, setItemToDelete] = useState(null);

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete?.isSubmission) {
        // "Delete" for submission means rejecting it so it doesn't show up here
        await formApi.update(itemToDelete.originalId, { status: 'rejected' });
        toast.success('Submission rejected and removed from view');
      } else {
        await inventoryApi.delete(itemToDelete._id || itemToDelete.id);
        toast.success('Item removed from inventory');
      }
      await fetchInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    } finally {
      setItemToDelete(null);
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      phone: item.phone || '',
      storage: item.storage || '',
      imei: item.imei || '',
      purchasePriceUSD: (item.purchasePriceUSD || 0).toString(),
      supplier: item.supplier || '',
      purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : new Date(),
      condition: item.condition || 'Good',
      notes: item.notes || '',
    });
  };

  const openSellModal = (item) => {
    setSellingItem(item);
    setSellFormData({
      salePricePKR: '',
      buyer: '',
      buyerPhone: '',
      saleDate: new Date(),
    });
    setIsSellModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In Stock':
      case 'in_stock': // legacy support
        return <span className="badge-active">In Stock</span>;
      case 'Sold':
      case 'sold': // legacy support
        return <span className="badge-accepted">Sold</span>;
      default:
        return null;
    }
  };

  return (
    <AdminLayout title="Inventory" subtitle="Track purchases, sales & profit/loss">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          title="Total Investment"
          value={`$${totalPurchaseCost.toLocaleString()}`}
          icon={DollarSign}
          iconBgColor="bg-info/10"
          iconColor="text-info"
        />
        <StatCard
          title="Total Sales (PKR)"
          value={`PKR ${totalSalesRevenue.toLocaleString()}`}
          icon={ShoppingCart}
          iconBgColor="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          title="Total Profit (PKR)"
          value={`PKR ${totalProfit.toLocaleString()}`}
          change={totalProfit > 0 ? parseFloat(profitMargin) : -parseFloat(profitMargin)}
          icon={totalProfit >= 0 ? TrendingUp : TrendingDown}
          iconBgColor={totalProfit >= 0 ? "bg-success/10" : "bg-destructive/10"}
          iconColor={totalProfit >= 0 ? "text-success" : "text-destructive"}
        />
        <StatCard
          title="Stock Status"
          value={`${inStockCount} / ${inventory.length}`}
          icon={Package}
          iconBgColor="bg-warning/10"
          iconColor="text-warning"
        />
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by phone, IMEI, supplier..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-card">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="In Stock">In Stock</SelectItem>
              <SelectItem value="Sold">Sold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary-hover text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Purchase
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card max-w-md max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Add New Purchase</DialogTitle>
            </DialogHeader>
            <InventoryForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleAddItem}
              isEdit={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile Cards View */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-card rounded-lg border border-border">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading inventory...</span>
        </div>
      ) : (
        <div className="block lg:hidden space-y-3">
          {filteredInventory.map((item) => {
            const profit = calculateProfit(item);
            return (
              <div key={item._id || item.id} className="stat-card">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-foreground truncate">{item.phone}</h4>
                    <p className="text-xs text-muted-foreground">{item.storage} • {item.condition}</p>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchase:</span>
                    <span className="text-foreground font-medium">${item.purchasePriceUSD.toLocaleString()}</span>
                  </div>
                  {(item.status === 'Sold' || item.status === 'sold') && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sale:</span>
                        <span className="text-foreground font-medium">PKR {item.salePricePKR?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Profit:</span>
                        <span className={cn("font-bold", profit >= 0 ? "text-success" : "text-destructive")}>
                          PKR {profit?.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplier:</span>
                    <span className="text-foreground truncate ml-2 max-w-[150px]">{item.supplier}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setViewingItem(item)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  {(item.status === 'In Stock' || item.status === 'in_stock') && (
                    <>
                      <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => openSellModal(item)}>
                        Sell
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => setItemToDelete(item)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Desktop Table */}
      {
        !loading && (
          <div className="data-table hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Phone</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Purchase (USD)</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Sale (PKR)</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Profit (PKR)</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Supplier</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Status</th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => {
                    const profit = calculateProfit(item);
                    return (
                      <tr key={item._id || item.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{item.phone}</p>
                            <p className="text-xs text-muted-foreground">{item.storage} • {item.condition}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-foreground">${item.purchasePriceUSD.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{item.purchaseDate}</p>
                        </td>
                        <td className="px-6 py-4">
                          {(item.salePricePKR !== null && item.salePricePKR !== undefined) ? (
                            <>
                              <p className="text-sm font-medium text-foreground">PKR {Number(item.salePricePKR).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">{item.saleDate}</p>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {profit !== null ? (
                            <span className={cn("text-sm font-bold", profit >= 0 ? "text-success" : "text-destructive")}>
                              PKR {profit.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-foreground truncate max-w-[150px]">{item.supplier}</p>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setViewingItem(item)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {(item.status === 'In Stock' || item.status === 'in_stock') && (
                              <>
                                <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => openSellModal(item)}>
                                  Sell
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setItemToDelete(item)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalItems}
              itemsPerPage={ITEMS_PER_PAGE} // Note: Actual items might be double if both streams return full pages
              itemName="items"
            />
          </div>
        )
      }

      {/* View Detail Modal */}
      <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
        <DialogContent className="bg-card max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inventory Details</DialogTitle>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-6 mt-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-foreground truncate">{viewingItem.phone}</h4>
                    <p className="text-sm text-muted-foreground">{viewingItem.storage} • {viewingItem.condition}</p>
                  </div>
                  {getStatusBadge(viewingItem.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">IMEI</p>
                  <p className="text-foreground font-mono text-xs">{viewingItem.imei}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Purchase Date</p>
                  <p className="text-foreground">{viewingItem.purchaseDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Purchase Price (USD)</p>
                  <p className="text-foreground font-medium">${viewingItem.purchasePriceUSD.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Purchase (PKR Equiv.)</p>
                  <p className="text-foreground">PKR {(viewingItem.purchasePriceUSD * USD_TO_PKR).toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Supplier</p>
                  <p className="text-foreground">{viewingItem.supplier}</p>
                </div>
              </div>

              {viewingItem.status === 'sold' && (
                <div className="p-4 bg-success/10 rounded-lg space-y-3">
                  <h5 className="font-semibold text-foreground">Sale Details</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Sale Price</p>
                      <p className="text-foreground font-medium">PKR {viewingItem.salePricePKR?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sale Date</p>
                      <p className="text-foreground">{viewingItem.saleDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Buyer</p>
                      <p className="text-foreground">{viewingItem.buyer}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Buyer Phone</p>
                      <p className="text-foreground">{viewingItem.buyerPhone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Profit</p>
                      <p className={cn("text-xl font-bold", calculateProfit(viewingItem) >= 0 ? "text-success" : "text-destructive")}>
                        PKR {calculateProfit(viewingItem)?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {viewingItem.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg">{viewingItem.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="bg-card max-w-md max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <InventoryForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleEditItem}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* Sell Modal */}
      <Dialog open={isSellModalOpen} onOpenChange={setIsSellModalOpen}>
        <DialogContent className="bg-card max-w-md">
          <DialogHeader>
            <DialogTitle>Sell Item</DialogTitle>
          </DialogHeader>
          {sellingItem && (
            <SellForm
              sellFormData={sellFormData}
              setSellFormData={setSellFormData}
              sellingItem={sellingItem}
              onSubmit={handleSellItem}
              USD_TO_PKR={USD_TO_PKR}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Summary Card */}
      <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <h3 className="font-semibold text-foreground mb-3">💰 Profit Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Invested (USD)</p>
            <p className="text-lg font-bold text-foreground">${totalPurchaseCost.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Sales (PKR)</p>
            <p className="text-lg font-bold text-foreground">PKR {totalSalesRevenue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Net Profit (PKR)</p>
            <p className={cn("text-lg font-bold", totalProfit >= 0 ? "text-success" : "text-destructive")}>
              PKR {totalProfit.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.isSubmission
                ? "This will reject the submission and remove it from Inventory. Continue?"
                : "This will permanently delete this item from inventory. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem} className="bg-destructive hover:bg-destructive/90">
              {itemToDelete?.isSubmission ? "Reject & Remove" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
