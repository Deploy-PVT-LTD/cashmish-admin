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
import { mobileApi, categoryApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// Letter grade system — A = best condition, F = worst. Matches
// cashmish-backend/utils/priceCalculator.js GRADES exactly.
const GRADES = ['A', 'B', 'C', 'D', 'E', 'F'];

// Builds an empty gradePricing bucket for one storage key (or 'default').
const emptyGradeBucket = () => ({
  unlockedBase: '',
  lockedBase: '',
  unlocked: Object.fromEntries(GRADES.map((g) => [g, ''])),
  locked: Object.fromEntries(GRADES.map((g) => [g, ''])),
});

// True if this product has at least one storage bucket with a real (numeric)
// Grade A unlocked price set — used to show a "Grade Priced" badge in the list.
const hasGradePricing = (mobile) => {
  const gp = mobile?.gradePricing;
  if (!gp || typeof gp !== 'object') return false;
  return Object.values(gp).some((bucket) => typeof bucket?.unlocked?.A === 'number');
};

// Form component moved OUTSIDE to prevent re-renders
function MobileForm({ formData, setFormData, onSubmit, isEdit, submitting, categories }) {
  const handleGradeChange = (storageKey, field, grade, value) => {
    const numValue = value === '' ? '' : Number(value);
    setFormData(prev => {
      const gradePricing = { ...(prev.gradePricing || {}) };
      const bucket = { ...(gradePricing[storageKey] || emptyGradeBucket()) };
      if (grade === null) {
        bucket[field] = numValue; // unlockedBase / lockedBase
      } else {
        bucket[field] = { ...(bucket[field] || {}), [grade]: numValue };
      }
      gradePricing[storageKey] = bucket;
      return { ...prev, gradePricing };
    });
  };

  return (
    <div className="space-y-4 mt-4 h-[60vh] overflow-y-auto pr-2">
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => {
            // Reset deduction rules to the newly selected category's own defaults —
            // the old category's questions/keys no longer apply.
            const cat = categories.find(c => c.slug === value);
            const rules = {};
            (cat?.assessmentQuestions || []).forEach((q) => {
              rules[q.key] = {};
              q.options.forEach((opt) => { rules[q.key][opt.key] = opt.deduction ?? 0; });
            });
            // Grade pricing is keyed by this category's own storage options (or
            // 'default' if it has no storage step) — start fresh for the new category.
            setFormData(prev => ({ ...prev, category: value, deductionRules: rules, gradePricing: {} }));
          }}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border z-50">
            {categories.map((cat) => (
              <SelectItem key={cat._id} value={cat.slug}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Don't see the category you need? Add it from the Categories page first.</p>
      </div>
      <div className="space-y-2">
        <Label>Brand</Label>
        <Input
          placeholder="e.g., Apple, Xbox, Dell..."
          value={formData.brand}
          onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label>Model Name</Label>
        <Input
          placeholder="e.g., iPhone 15 Pro"
          value={formData.phoneModel}
          onChange={(e) => setFormData(prev => ({ ...prev, phoneModel: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Base Price (Unlocked) ($)</Label>
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
          <Label>Base Price (Locked) ($)</Label>
          <Input
            type="number"
            min="0"
            placeholder="e.g., 699"
            value={formData.basePriceLocked !== undefined ? formData.basePriceLocked : ''}
            onChange={(e) => setFormData(prev => ({ ...prev, basePriceLocked: e.target.value }))}
          />
        </div>
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
        <Label className="text-base font-semibold">Grade Pricing ($)</Label>
        <p className="text-xs text-muted-foreground mb-4">
          Exact payout per condition grade — A (best) through F (worst). Whatever grade the
          customer's answers work out to, this is exactly what they're quoted; no percentage
          math involved. "Base" is just a reference price, not used in the quote itself.
        </p>

        {(() => {
          const selectedCategory = categories.find(c => c.slug === formData.category);
          const hasStorage = Boolean(selectedCategory?.hasStorageStep && selectedCategory?.storageOptions?.length);
          const storageKeys = hasStorage ? selectedCategory.storageOptions : ['default'];

          return storageKeys.map((storageKey) => {
            const bucket = formData.gradePricing?.[storageKey] || {};
            return (
              <div key={storageKey} className="mb-4 border border-border rounded-lg p-3">
                <Label className="text-sm font-medium text-primary mb-2 block">
                  {hasStorage ? storageKey : 'Pricing'}
                </Label>

                <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground uppercase tracking-wide mb-1 px-0.5">
                  <span>Grade</span>
                  <span>Unlocked $</span>
                  <span>Locked $</span>
                </div>

                <div className="grid grid-cols-3 gap-2 items-center mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">Base (ref.)</span>
                  <Input
                    type="number" className="h-8" placeholder="e.g. 755"
                    value={bucket.unlockedBase ?? ''}
                    onChange={(e) => handleGradeChange(storageKey, 'unlockedBase', null, e.target.value)}
                  />
                  <Input
                    type="number" className="h-8" placeholder="e.g. 671"
                    value={bucket.lockedBase ?? ''}
                    onChange={(e) => handleGradeChange(storageKey, 'lockedBase', null, e.target.value)}
                  />
                </div>

                {GRADES.map((g) => (
                  <div key={g} className="grid grid-cols-3 gap-2 items-center mb-1.5">
                    <span className="text-xs font-semibold">{g}</span>
                    <Input
                      type="number" className="h-8"
                      value={bucket.unlocked?.[g] ?? ''}
                      onChange={(e) => handleGradeChange(storageKey, 'unlocked', g, e.target.value)}
                    />
                    <Input
                      type="number" className="h-8"
                      value={bucket.locked?.[g] ?? ''}
                      onChange={(e) => handleGradeChange(storageKey, 'locked', g, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            );
          });
        })()}
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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
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
    category: 'mobile-phones',
    brand: '',
    phoneModel: '',
    basePrice: '',
    basePriceLocked: '',
    image: '',
    deductionRules: {},
    gradePricing: {}
  });

  // Builds a fresh deductionRules object from a category's own default % per option
  // (set on the Categories page) — this is what a brand-new product starts with.
  const buildDefaultDeductionRules = (categorySlug) => {
    const cat = categories.find(c => c.slug === categorySlug);
    const questions = cat?.assessmentQuestions || [];
    const rules = {};
    questions.forEach((q) => {
      rules[q.key] = {};
      q.options.forEach((opt) => {
        rules[q.key][opt.key] = opt.deduction ?? 0;
      });
    });
    return rules;
  };

  // Fetch categories for the dropdown (admin view — includes inactive so existing items still show their category)
  useEffect(() => {
    categoryApi.getAllAdmin()
      .then(setCategories)
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

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
        brand: brandFilter,
        category: categoryFilter
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
  }, [page, debouncedSearch, brandFilter, categoryFilter]);

  const filteredMobiles = mobiles;

  const getCategoryName = (slug) => categories.find(c => c.slug === slug)?.name || slug || 'Mobile Phones';

  const handleAddMobile = async () => {
    try {
      setSubmitting(true);
      const newMobile = {
        category: formData.category,
        brand: formData.brand,
        phoneModel: formData.phoneModel,
        basePrice: parseInt(formData.basePrice),
        basePriceLocked: parseInt(formData.basePriceLocked) || 0,
        image: formData.image || undefined,
        deductionRules: formData.deductionRules,
        gradePricing: formData.gradePricing
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
        category: formData.category,
        brand: formData.brand,
        phoneModel: formData.phoneModel,
        basePrice: parseInt(formData.basePrice),
        basePriceLocked: parseInt(formData.basePriceLocked) || 0,
        image: formData.image || undefined,
        deductionRules: formData.deductionRules,
        gradePricing: formData.gradePricing
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
    const category = mobile.category || 'mobile-phones';
    setFormData({
      category,
      brand: mobile.brand,
      phoneModel: mobile.phoneModel,
      basePrice: mobile.basePrice.toString(),
      basePriceLocked: mobile.basePriceLocked ? mobile.basePriceLocked.toString() : '0',
      image: mobile.image || '',
      deductionRules: (mobile.deductionRules && Object.keys(mobile.deductionRules).length > 0)
        ? mobile.deductionRules
        : buildDefaultDeductionRules(category),
      gradePricing: mobile.gradePricing || {}
    });
  };

  const openAddModal = () => {
    const category = categoryFilter !== 'all' ? categoryFilter : (categories[0]?.slug || 'mobile-phones');
    setFormData({
      category,
      brand: '', phoneModel: '', basePrice: '', basePriceLocked: '', image: '',
      deductionRules: buildDefaultDeductionRules(category),
      gradePricing: {}
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
          <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-44 bg-card">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat._id} value={cat.slug}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={brandFilter} onValueChange={(val) => { setBrandFilter(val); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40 bg-card">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              <SelectItem value="all">All Brands</SelectItem>
              {[...new Set(mobiles.map(m => m.brand))].sort().map((brand) => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
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
                categories={categories}
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
                    <p className="text-xs text-muted-foreground truncate">{getCategoryName(mobile.category)} · {mobile.brand}</p>
                    <h4 className="font-semibold text-foreground truncate">{mobile.phoneModel}</h4>
                  </div>
                  <span className={mobile.isActive ? 'badge-active' : 'badge-inactive'}>
                    {mobile.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-foreground flex flex-col">
                    <span>${mobile.basePrice?.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">(U)</span></span>
                    {mobile.basePriceLocked !== undefined && (
                      <span className="text-sm opacity-80">${mobile.basePriceLocked?.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">(L)</span></span>
                    )}
                    {hasGradePricing(mobile) && (
                      <span className="mt-1 px-2 py-0.5 text-[10px] w-max bg-success/10 text-success rounded-full border border-success/20 align-middle">
                        Grade Priced
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
                          categories={categories}
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
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Category</th>
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
                      <td className="px-6 py-4 text-sm text-muted-foreground">{getCategoryName(mobile.category)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{mobile.brand}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{mobile.phoneModel}</td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        <div className="flex flex-col">
                          <span>${mobile.basePrice?.toLocaleString()} <span className="text-xs text-muted-foreground font-normal ml-1">Unl.</span></span>
                          {mobile.basePriceLocked !== undefined && (
                            <span className="text-xs opacity-70 mt-1">${mobile.basePriceLocked?.toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal">Lck.</span></span>
                          )}
                          {hasGradePricing(mobile) && (
                            <span className="mt-2 w-max px-2 py-0.5 text-[10px] bg-success/10 text-success rounded-full border border-success/20">
                              Grade Priced
                            </span>
                          )}
                        </div>
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
                              categories={categories}
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
          <strong>API Connected:</strong> Mobiles are now fetched from your backend at <code className="bg-muted px-1 rounded">https://cashmish-backend.onrender.com/api/mobiles</code>
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
