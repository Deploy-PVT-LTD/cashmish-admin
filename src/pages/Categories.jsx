import { useState, useEffect, Fragment } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { categoryApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash2, LayoutGrid, Check, X, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
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

const slugify = (str) =>
    String(str || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

const emptyFormData = () => ({
    name: '',
    icon: '',
    order: 0,
    isActive: true,
    hasCarrierStep: false,
    carrierOptions: [],
    hasStorageStep: false,
    storageOptions: [],
    assessmentQuestions: [],
});

// Simple add/remove list of plain strings — used for carrier options and storage options.
function TagListEditor({ items, onChange, placeholder }) {
    const [draft, setDraft] = useState('');

    const addItem = () => {
        const value = draft.trim();
        if (!value || items.includes(value)) return;
        onChange([...items, value]);
        setDraft('');
    };

    const removeItem = (value) => onChange(items.filter((i) => i !== value));

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <Input
                    placeholder={placeholder}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addItem();
                        }
                    }}
                />
                <Button type="button" variant="outline" onClick={addItem}>Add</Button>
            </div>
            {items.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                        <span key={item} className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-xs font-medium">
                            {item}
                            <button type="button" onClick={() => removeItem(item)} className="hover:text-destructive">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// Builder for the fully custom device-condition questions (e.g. "Controller Included?"
// with options like Yes/No, each carrying a default price-deduction %).
function AssessmentQuestionsEditor({ questions, onChange }) {
    const updateQuestion = (index, patch) => {
        const next = [...questions];
        next[index] = { ...next[index], ...patch };
        onChange(next);
    };

    const addQuestion = () => {
        onChange([...questions, { key: '', label: '', options: [] }]);
    };

    const removeQuestion = (index) => {
        onChange(questions.filter((_, i) => i !== index));
    };

    const updateOption = (qIndex, oIndex, patch) => {
        const next = [...questions];
        const options = [...next[qIndex].options];
        options[oIndex] = { ...options[oIndex], ...patch };
        next[qIndex] = { ...next[qIndex], options };
        onChange(next);
    };

    const addOption = (qIndex) => {
        const next = [...questions];
        next[qIndex] = {
            ...next[qIndex],
            options: [...next[qIndex].options, { key: '', label: '', description: '', deduction: 0 }]
        };
        onChange(next);
    };

    const removeOption = (qIndex, oIndex) => {
        const next = [...questions];
        next[qIndex] = { ...next[qIndex], options: next[qIndex].options.filter((_, i) => i !== oIndex) };
        onChange(next);
    };

    return (
        <div className="space-y-4">
            {questions.map((q, qIndex) => (
                <div key={qIndex} className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
                    <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs">Question</Label>
                            <Input
                                placeholder="e.g. Controller Included?"
                                value={q.label}
                                onChange={(e) => updateQuestion(qIndex, { label: e.target.value, key: slugify(e.target.value) })}
                            />
                            {q.key && <p className="text-[10px] text-muted-foreground font-mono">key: {q.key}</p>}
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(qIndex)} className="text-destructive hover:text-destructive mt-5">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="space-y-2 pl-2 border-l-2 border-border">
                        {q.options.map((opt, oIndex) => (
                            <div key={oIndex} className="grid grid-cols-12 gap-2 items-start">
                                <div className="col-span-4">
                                    <Input
                                        placeholder="Option label (e.g. Yes)"
                                        value={opt.label}
                                        onChange={(e) => updateOption(qIndex, oIndex, { label: e.target.value, key: slugify(e.target.value) })}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="col-span-4">
                                    <Input
                                        placeholder="Description (optional)"
                                        value={opt.description}
                                        onChange={(e) => updateOption(qIndex, oIndex, { description: e.target.value })}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="% off"
                                        value={opt.deduction}
                                        onChange={(e) => updateOption(qIndex, oIndex, { deduction: Number(e.target.value) })}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(qIndex, oIndex)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => addOption(qIndex)} className="mt-1">
                            <Plus className="w-3 h-3 mr-1" /> Add Option
                        </Button>
                    </div>
                </div>
            ))}
            <Button type="button" variant="outline" onClick={addQuestion} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Question
            </Button>
        </div>
    );
}

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [formData, setFormData] = useState(emptyFormData());
    const [submitting, setSubmitting] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await categoryApi.getAllAdmin();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleOpenModal = (category = null) => {
        if (category) {
            setFormData({
                _id: category._id,
                name: category.name,
                icon: category.icon || '',
                order: category.order ?? 0,
                isActive: category.isActive,
                hasCarrierStep: category.hasCarrierStep || false,
                carrierOptions: category.carrierOptions || [],
                hasStorageStep: category.hasStorageStep || false,
                storageOptions: category.storageOptions || [],
                assessmentQuestions: category.assessmentQuestions || [],
            });
            setIsEditing(true);
        } else {
            setFormData({ ...emptyFormData(), order: categories.length });
            setIsEditing(false);
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            if (isEditing) {
                await categoryApi.update(formData._id, formData);
                toast.success('Category updated successfully');
            } else {
                await categoryApi.create(formData);
                toast.success('Category created successfully');
            }
            setModalOpen(false);
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            toast.error(error.response?.data?.message || 'Failed to save category');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;
        try {
            await categoryApi.delete(categoryToDelete._id);
            toast.success('Category deleted successfully');
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error(error.response?.data?.message || 'Failed to delete category');
        }
    };

    const toggleActive = async (category) => {
        try {
            await categoryApi.update(category._id, { isActive: !category.isActive });
            toast.success(`Category ${category.isActive ? 'deactivated' : 'activated'}`);
            fetchCategories();
        } catch (error) {
            console.error('Error toggling category:', error);
            toast.error('Failed to update category');
        }
    };

    return (
        <AdminLayout
            title="Categories"
            subtitle="Manage the product categories customers can sell (Mobile Phones, Laptops, Gaming Consoles, etc.)"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Product Categories</h2>
                    <p className="text-sm text-muted-foreground">
                        These show up as the first step on the customer site, before brand selection. Each category can define its own carrier step, storage sizes, and device-condition questions.
                    </p>
                </div>
                <Button onClick={() => handleOpenModal()} className="gap-2 self-start sm:self-auto">
                    <Plus className="w-4 h-4" /> Add Category
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-20 bg-muted/10 rounded-lg border border-dashed text-muted-foreground">
                    <LayoutGrid className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    No categories found. Create your first one!
                </div>
            ) : (
                <div className="data-table">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="w-8"></th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Icon</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Name</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Slug</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Sell-Flow Steps</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Order</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Status</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((category) => {
                                    const isExpanded = expandedRow === category._id;
                                    const questionCount = category.assessmentQuestions?.length || 0;
                                    return (
                                        <Fragment key={category._id}>
                                            <tr className="border-t border-border hover:bg-muted/30 transition-colors">
                                                <td className="px-2">
                                                    <button onClick={() => setExpandedRow(isExpanded ? null : category._id)} className="text-muted-foreground">
                                                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {category.icon ? (
                                                        category.icon.startsWith('http') ? (
                                                            <img src={category.icon} alt={category.name} className="w-8 h-8 object-contain" />
                                                        ) : (
                                                            <span className="text-2xl leading-none">{category.icon}</span>
                                                        )
                                                    ) : (
                                                        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                                                            <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-medium">{category.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className="font-mono bg-muted px-2 py-1 rounded text-xs text-muted-foreground">
                                                        {category.slug}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-muted-foreground space-y-0.5">
                                                    <div>{category.hasCarrierStep ? `✓ Carrier (${category.carrierOptions?.length || 0})` : '— No carrier step'}</div>
                                                    <div>{category.hasStorageStep ? `✓ Storage (${category.storageOptions?.length || 0})` : '— No storage step'}</div>
                                                    <div>{questionCount > 0 ? `✓ ${questionCount} condition question${questionCount === 1 ? '' : 's'}` : '⚠ No condition questions yet'}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground flex items-center gap-1">
                                                    <GripVertical className="w-3 h-3 opacity-40" /> {category.order}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button onClick={() => toggleActive(category)}>
                                                        {category.isActive ? (
                                                            <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full border border-green-100 uppercase">
                                                                <Check className="w-3 h-3" /> Active
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-full border border-red-100 uppercase">
                                                                <X className="w-3 h-3" /> Inactive
                                                            </span>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleOpenModal(category)}
                                                            className="text-primary hover:text-primary hover:bg-primary/10"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setCategoryToDelete(category);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-muted/10">
                                                    <td></td>
                                                    <td colSpan={7} className="px-6 py-4 text-sm">
                                                        <div className="grid md:grid-cols-3 gap-6">
                                                            <div>
                                                                <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Carrier Options</p>
                                                                {category.carrierOptions?.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {category.carrierOptions.map((c) => <span key={c} className="bg-muted px-2 py-0.5 rounded text-xs">{c}</span>)}
                                                                    </div>
                                                                ) : <p className="text-xs text-muted-foreground italic">None configured</p>}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Storage Options</p>
                                                                {category.storageOptions?.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {category.storageOptions.map((s) => <span key={s} className="bg-muted px-2 py-0.5 rounded text-xs">{s}</span>)}
                                                                    </div>
                                                                ) : <p className="text-xs text-muted-foreground italic">None configured</p>}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Condition Questions</p>
                                                                {questionCount > 0 ? (
                                                                    <ul className="space-y-1">
                                                                        {category.assessmentQuestions.map((q) => (
                                                                            <li key={q.key} className="text-xs">
                                                                                <strong>{q.label}</strong> — {q.options?.map(o => o.label).join(' / ') || 'no options'}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                ) : <p className="text-xs text-destructive italic">Products in this category can't be priced yet — add at least one question.</p>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="bg-card max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Category' : 'Create New Category'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Category Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Gaming Consoles"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="icon">Icon</Label>
                            <Input
                                id="icon"
                                placeholder="An emoji (🎮) or an image URL"
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Shown on the customer site's category tile. Leave blank to use a default icon.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="order">Display Order</Label>
                            <Input
                                id="order"
                                type="number"
                                placeholder="0"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                            />
                            <p className="text-xs text-muted-foreground">Lower numbers show first.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="isActive">Active (visible to customers)</Label>
                        </div>

                        <div className="border-t pt-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="hasCarrierStep"
                                    checked={formData.hasCarrierStep}
                                    onChange={(e) => setFormData({ ...formData, hasCarrierStep: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="hasCarrierStep" className="font-semibold">Carrier / lock-status step</Label>
                            </div>
                            <p className="text-xs text-muted-foreground">Only relevant for phones (financed, blacklisted, or activation-locked check). Leave off for most other categories.</p>
                            {formData.hasCarrierStep && (
                                <TagListEditor
                                    items={formData.carrierOptions}
                                    onChange={(carrierOptions) => setFormData({ ...formData, carrierOptions })}
                                    placeholder="e.g. AT&T"
                                />
                            )}
                        </div>

                        <div className="border-t pt-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="hasStorageStep"
                                    checked={formData.hasStorageStep}
                                    onChange={(e) => setFormData({ ...formData, hasStorageStep: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="hasStorageStep" className="font-semibold">Storage step</Label>
                            </div>
                            <p className="text-xs text-muted-foreground">Sizes shown to the customer for this category, e.g. Gaming Consoles: 500GB, 825GB, 1TB, 2TB.</p>
                            {formData.hasStorageStep && (
                                <TagListEditor
                                    items={formData.storageOptions}
                                    onChange={(storageOptions) => setFormData({ ...formData, storageOptions })}
                                    placeholder="e.g. 1TB"
                                />
                            )}
                        </div>

                        <div className="border-t pt-4 space-y-3">
                            <Label className="font-semibold">Device Condition Questions</Label>
                            <p className="text-xs text-muted-foreground">
                                These replace the generic Screen/Body/Battery questions for this category. Each option's % is the default price deduction — pre-fills new products, still editable per-product on the Mobiles page.
                            </p>
                            <AssessmentQuestionsEditor
                                questions={formData.assessmentQuestions}
                                onChange={(assessmentQuestions) => setFormData({ ...formData, assessmentQuestions })}
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {isEditing ? 'Update Category' : 'Create Category'}
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
                            This will permanently delete the category <strong>{categoryToDelete?.name}</strong>.
                            Products already assigned to it will keep their data but won't be reachable from the customer site until reassigned.
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
