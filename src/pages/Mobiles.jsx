import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { useAuth } from '@/contexts/AuthContext';
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
import { Plus, Pencil, Power, Search, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { mobileApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// Form component moved OUTSIDE to prevent re-renders
function MobileForm({ formData, setFormData, onSubmit, isEdit, submitting }) {
  const handleRuleChange = (category, condition, value) => {
    // Allow empty string to let user clear input
    if (value === '') {
      setFormData(prev => ({
        ...prev,
        deductionRules: {
          ...prev.deductionRules,
          [category]: {
            ...prev.deductionRules?.[category],
            [condition]: ''
          }
        }
      }));
      return;
    }

    const numValue = Math.min(100, Math.max(0, Number(value)));
    setFormData(prev => ({
      ...prev,
      deductionRules: {
        ...prev.deductionRules,
        [category]: {
          ...prev.deductionRules?.[category],
          [condition]: numValue
        }
      }
    }));
  };

  return (
    <div className="space-y-4 mt-4 h-[60vh] overflow-y-auto pr-2">
      <div className="space-y-2">
        <Label>Brand</Label>
        <Select value={formData.brand} onValueChange={(value) => setFormData(prev => ({ ...prev, brand: value }))}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select brand" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border z-50">
            <SelectItem value="Apple">Apple</SelectItem>
            <SelectItem value="Samsung">Samsung</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Model Name</Label>
        <Input
          placeholder="e.g., iPhone 15 Pro"
          value={formData.phoneModel}
          onChange={(e) => setFormData(prev => ({ ...prev, phoneModel: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label>Base Price ($)</Label>
        <Input
          type="number"
          min="0"
          placeholder="e.g., 799"
          value={formData.basePrice}
          onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
        />
        {formData.basePrice && Number(formData.basePrice) < 1 && (
          <p className="text-xs text-destructive">Price must be at least $1</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Image URL</Label>
        <Input
          placeholder="https://..."
          value={formData.image}
          onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
        />
      </div>

      <div className="border-t pt-4 mt-4">
        <Label className="text-base font-semibold">Deduction Rules (%)</Label>
        <p className="text-xs text-muted-foreground mb-4">Override global rules for this mobile.</p>

        {/* Screen */}
        <div className="space-y-3 mb-4">
          <Label className="text-sm font-medium text-primary">Screen</Label>
          <div className="grid grid-cols-3 gap-2">
            {['perfect', 'scratched', 'cracked'].map(cond => (
              <div key={cond}>
                <Label className="text-xs capitalize">{cond}</Label>
                <Input
                  type="number"
                  className="h-8"
                  value={formData.deductionRules?.screen?.[cond] ?? ''}
                  onChange={(e) => handleRuleChange('screen', cond, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="space-y-3 mb-4">
          <Label className="text-sm font-medium text-primary">Body</Label>
          <div className="grid grid-cols-3 gap-2">
            {['perfect', 'scratched', 'damaged'].map(cond => (
              <div key={cond}>
                <Label className="text-xs capitalize">{cond}</Label>
                <Input
                  type="number"
                  className="h-8"
                  value={formData.deductionRules?.body?.[cond] ?? ''}
                  onChange={(e) => handleRuleChange('body', cond, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Battery */}
        <div className="space-y-3 mb-4">
          <Label className="text-sm font-medium text-primary">Battery</Label>
          <div className="grid grid-cols-3 gap-2">
            {['good', 'average', 'poor'].map(cond => (
              <div key={cond}>
                <Label className="text-xs capitalize">{cond}</Label>
                <Input
                  type="number"
                  className="h-8"
                  value={formData.deductionRules?.battery?.[cond] ?? ''}
                  onChange={(e) => handleRuleChange('battery', cond, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button
        onClick={onSubmit}
        className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
        disabled={
          submitting ||
          !formData.brand ||
          !formData.phoneModel ||
          !formData.basePrice ||
          Number(formData.basePrice) < 0 ||
          !formData.image
        }
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isEdit ? 'Saving...' : 'Adding...'}
          </>
        ) : (
          isEdit ? 'Save Changes' : 'Add Mobile'
        )}
      </Button>
    </div>
  );
}

export default function Mobiles() {
  // console.log('Mobiles component rendered - debugging HMR');
  const [mobiles, setMobiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [brandFilter, setBrandFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMobile, setEditingMobile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 10;
  const [formData, setFormData] = useState({
    brand: '',
    phoneModel: '',
    basePrice: '',
    image: '',
    deductionRules: {
      screen: { perfect: 0, scratched: 10, cracked: 25 },
      body: { perfect: 0, scratched: 10, damaged: 20 },
      battery: { good: 0, average: 10, poor: 20 }
    }
  });

  // Fetch mobiles from API
  // Fetch mobiles from API
  const fetchMobiles = async () => {
    try {
      setLoading(true);
      const data = await mobileApi.getAll({
        includeInactive: true,
        page,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch,
        brand: brandFilter
      });

      if (data.pagination) {
        setMobiles(data.mobiles || []);
        setTotalItems(data.pagination.total);
        setTotalPages(data.pagination.pages);
      } else {
        // Fallback for legacy response
        setMobiles(data.mobiles || data || []);
        setTotalItems((data.mobiles || data || []).length);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching mobiles:', error);
      toast.error(error.response?.data?.message || 'Failed to load mobiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMobiles();
  }, [page, debouncedSearch, brandFilter]);

  const filteredMobiles = mobiles;

  const handleAddMobile = async () => {
    try {
      setSubmitting(true);
      const newMobile = {
        brand: formData.brand,
        phoneModel: formData.phoneModel,
        basePrice: parseInt(formData.basePrice),
        image: formData.image || undefined,
        deductionRules: formData.deductionRules
      };
      const response = await mobileApi.create(newMobile);
      if (response.message && response.message.includes('approval')) {
        toast.info(response.message);
        setIsAddModalOpen(false); // Close modal for admin too
      } else {
        await fetchMobiles();
        toast.success('Mobile added successfully!');
        setIsAddModalOpen(false);
      }
    } catch (error) {
      console.error('Error adding mobile:', error);
      toast.error(error.response?.data?.message || 'Failed to add mobile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMobile = async () => {
    if (!editingMobile) return;
    try {
      setSubmitting(true);
      const updatedData = {
        brand: formData.brand,
        phoneModel: formData.phoneModel,
        basePrice: parseInt(formData.basePrice),
        image: formData.image || undefined,
        deductionRules: formData.deductionRules
      };
      const response = await mobileApi.update(editingMobile._id, updatedData);
      if (response.message && response.message.includes('approval')) {
        toast.info(response.message);
        setEditingMobile(null); // Close modal for admin too
      } else {
        await fetchMobiles();
        toast.success('Mobile updated successfully!');
        setEditingMobile(null);
      }
    } catch (error) {
      console.error('Error updating mobile:', error);
      toast.error(error.response?.data?.message || 'Failed to update mobile');
    } finally {
      setSubmitting(false);
    }
  };



  const [mobileToDelete, setMobileToDelete] = useState(null);
  const [mobileToToggle, setMobileToToggle] = useState(null);

  const confirmToggleStatus = async () => {
    if (!mobileToToggle) return;
    try {
      const response = await mobileApi.update(mobileToToggle._id, { isActive: !mobileToToggle.isActive });
      if (response.message && response.message.includes('approval')) {
        toast.info(response.message);
      } else {
        await fetchMobiles();
        toast.success(`Mobile ${mobileToToggle.isActive ? 'deactivated' : 'activated'}`);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    } finally {
      setMobileToToggle(null);
    }
  };

  const confirmDelete = async () => {
    if (!mobileToDelete) return;
    try {
      const response = await mobileApi.delete(mobileToDelete._id);
      if (response.message && response.message.includes('approval')) {
        toast.info(response.message);
      } else {
        await fetchMobiles();
        toast.success('Mobile deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting mobile:', error);
      toast.error('Failed to delete mobile');
    } finally {
      setMobileToDelete(null);
    }
  };

  const openEditModal = (mobile) => {
    setEditingMobile(mobile);
    setFormData({
      brand: mobile.brand,
      phoneModel: mobile.phoneModel,
      basePrice: mobile.basePrice.toString(),
      image: mobile.image || '',
      deductionRules: mobile.deductionRules || {
        screen: { perfect: 0, scratched: 10, cracked: 25 },
        body: { perfect: 0, scratched: 10, damaged: 20 },
        battery: { good: 0, average: 10, poor: 20 }
      }
    });
  };

  const openAddModal = () => {
    setFormData({
      brand: '', phoneModel: '', basePrice: '', image: '',
      deductionRules: {
        screen: { perfect: 0, scratched: 10, cracked: 25 },
        body: { perfect: 0, scratched: 10, damaged: 20 },
        battery: { good: 0, average: 10, poor: 20 }
      }
    });
    setIsAddModalOpen(true);
  };

  // Loading check moved inside render to keep inputs mounted

  return (
    <AdminLayout title="Mobiles" subtitle="Manage mobile phones & prices">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by brand or model..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select value={brandFilter} onValueChange={(val) => { setBrandFilter(val); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40 bg-card">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              <SelectItem value="all">All Brands</SelectItem>
              <SelectItem value="Apple">Apple</SelectItem>
              <SelectItem value="Samsung">Samsung</SelectItem>
              <SelectItem value="Google">Google</SelectItem>
              <SelectItem value="Xiaomi">Xiaomi</SelectItem>
              <SelectItem value="OnePlus">OnePlus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">


          <Button variant="outline" onClick={fetchMobiles}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddModal} className="bg-primary hover:bg-primary-hover text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Mobile
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Mobile</DialogTitle>
              </DialogHeader>
              <MobileForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAddMobile}
                isEdit={false}
                submitting={submitting}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading mobiles...</span>
        </div>
      ) : mobiles.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">No mobiles found. Add your first mobile!</p>
          <Button onClick={openAddModal} className="bg-primary hover:bg-primary-hover text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Add Mobile
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile Cards for small screens */}
          <div className="block lg:hidden space-y-3">
            {filteredMobiles.map((mobile) => (
              <div key={mobile._id} className="stat-card">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground truncate">{mobile.brand}</p>
                    <h4 className="font-semibold text-foreground truncate">{mobile.phoneModel}</h4>
                  </div>
                  <span className={mobile.isActive ? 'badge-active' : 'badge-inactive'}>
                    {mobile.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-foreground">
                    ${mobile.basePrice?.toLocaleString()}
                    {mobile.deductionRules && (
                      <span className="ml-2 px-2 py-0.5 text-[10px] bg-primary/10 text-primary rounded-full border border-primary/20 align-middle">
                        Rules
                      </span>
                    )}
                  </span>
                  <div className="flex gap-1">
                    {/* Edit */}
                    <Dialog open={editingMobile?._id === mobile._id} onOpenChange={(open) => !open && setEditingMobile(null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(mobile)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit Mobile</DialogTitle>
                        </DialogHeader>
                        <MobileForm
                          formData={formData}
                          setFormData={setFormData}
                          onSubmit={handleEditMobile}
                          isEdit={true}
                          submitting={submitting}
                        />
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMobileToToggle(mobile)}
                      className={mobile.isActive ? 'text-destructive hover:text-destructive' : 'text-success hover:text-success'}
                    >
                      <Power className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMobileToDelete(mobile)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table for larger screens */}
          <div className="data-table hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Image</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Brand</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Model</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Base Price</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Status</th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMobiles.map((mobile) => (
                    <tr key={mobile._id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        {mobile.image ? (
                          <img src={mobile.image} alt={mobile.phoneModel} className="w-12 h-12 object-cover rounded-lg" />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">No img</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{mobile.brand}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{mobile.phoneModel}</td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        ${mobile.basePrice?.toLocaleString()}
                        {mobile.deductionRules && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] bg-primary/10 text-primary rounded-full border border-primary/20">
                            Custom Rules
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={mobile.isActive ? 'badge-active' : 'badge-inactive'}>
                          {mobile.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {/* Edit */}
                        <Dialog open={editingMobile?._id === mobile._id} onOpenChange={(open) => !open && setEditingMobile(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(mobile)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit Mobile</DialogTitle>
                            </DialogHeader>
                            <MobileForm
                              formData={formData}
                              setFormData={setFormData}
                              onSubmit={handleEditMobile}
                              isEdit={true}
                              submitting={submitting}
                            />
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMobileToToggle(mobile)}
                          className={mobile.isActive ? 'text-destructive hover:text-destructive' : 'text-success hover:text-success'}
                        >
                          <Power className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMobileToDelete(mobile)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            itemName="mobiles"
          />
        </>
      )}

      {/* Info Note */}
      {/* <div className="mt-6 p-4 bg-info/10 border border-info/20 rounded-lg">
        <p className="text-sm text-info">
          <strong>API Connected:</strong> Mobiles are now fetched from your backend at <code className="bg-muted px-1 rounded">http://localhost:5000/api/mobiles</code>
        </p>
      </div> */}
      {/* Delete Confirmation */}
      <AlertDialog open={!!mobileToDelete} onOpenChange={() => setMobileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the mobile <strong>{mobileToDelete?.phoneModel}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Toggle Confirmation */}
      <AlertDialog open={!!mobileToToggle} onOpenChange={() => setMobileToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {mobileToToggle?.isActive ? 'deactivate' : 'activate'} <strong>{mobileToToggle?.phoneModel}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleStatus}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
