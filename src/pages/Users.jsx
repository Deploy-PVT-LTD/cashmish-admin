import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Search, Mail, ChevronLeft, ChevronRight, Plus, Loader2, UserPlus, RefreshCw, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { Checkbox } from '@/components/ui/checkbox';

// Define available pages for permissions
const AVAILABLE_PAGES = [
  { id: '/dashboard', label: 'Dashboard' },
  { id: '/mobiles', label: 'Mobiles' },
  { id: '/requests', label: 'Requests' },
  { id: '/submissions', label: 'Submissions' },
  { id: '/inventory', label: 'Inventory' },
  { id: '/bank-details', label: 'Payment Details' },
  { id: '/reviews', label: 'Reviews' },
  { id: '/blogs', label: 'Blogs' },
  { id: '/settings', label: 'Settings' },
];

// Form component moved OUTSIDE to prevent re-renders
function AddUserForm({ formData, setFormData, onSubmit, submitting }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label>Full Name</Label>
        <Input
          placeholder="Enter full name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          placeholder="Enter email address"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Password</Label>
        <Input
          type="password"
          placeholder="Enter password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
        />
      </div>

      <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
        <div className="space-y-2">
          <Label>Role</Label>
          <div className="flex gap-2 mb-2 flex-wrap">
            <Button
              type="button"
              variant={formData.role === 'admin' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, role: 'admin', permissions: AVAILABLE_PAGES.map(p => p.id) }))}
            >
              Admin (All Access)
            </Button>
            <Button
              type="button"
              variant={formData.role === 'superadmin' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, role: 'superadmin', permissions: ['*'] }))}
            >
              Super Admin
            </Button>
            <Button
              type="button"
              variant={!['admin', 'superadmin', 'user'].includes(formData.role) && formData.role !== '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, role: 'Editor', permissions: [] }))}
            >
              Custom Role
            </Button>
          </div>
          <Input
            placeholder="Type role name (e.g. Sales, Content Editor)"
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
          />
        </div>

        {formData.role !== 'superadmin' && (
          <div className="space-y-3 pt-2">
            <Label>Page Permissions</Label>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_PAGES.map((page) => (
                <div key={page.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`add-${page.id}`}
                    checked={formData.permissions.includes(page.id)}
                    onCheckedChange={(checked) => {
                      setFormData(prev => {
                        const newPerms = checked
                          ? [...prev.permissions, page.id]
                          : prev.permissions.filter(p => p !== page.id);
                        return { ...prev, permissions: newPerms };
                      });
                    }}
                  />
                  <label
                    htmlFor={`add-${page.id}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {page.label}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note: Dashboard is always accessible. Superadmin has access to everything including Users management.
            </p>
          </div>
        )}
      </div>

      <Button
        onClick={onSubmit}
        className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
        disabled={submitting || !formData.name || !formData.email || !formData.password || !formData.role}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating User...
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </>
        )}
      </Button>
    </div>
  );
}

// Edit User Form Component
function EditUserForm({ formData, setFormData, onSubmit, submitting }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label>Full Name</Label>
        <Input
          placeholder="Enter full name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          placeholder="Enter email address"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />
      </div>

      <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
        <div className="space-y-2">
          <Label>Role</Label>
          <div className="flex gap-2 mb-2 flex-wrap">
            <Button
              type="button"
              variant={formData.role === 'admin' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, role: 'admin', permissions: AVAILABLE_PAGES.map(p => p.id) }))}
            >
              Admin
            </Button>
            <Button
              type="button"
              variant={formData.role === 'superadmin' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, role: 'superadmin', permissions: ['*'] }))}
            >
              Super Admin
            </Button>
            <Button
              type="button"
              variant={formData.role === 'user' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, role: 'user', permissions: [] }))}
            >
              User
            </Button>
          </div>
          <Input
            placeholder="Type custom role name (e.g. Sales)"
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
          />
        </div>

        {formData.role !== 'superadmin' && (
          <div className="space-y-3 pt-2">
            <Label>Page Permissions</Label>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_PAGES.map((page) => (
                <div key={page.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-${page.id}`}
                    checked={formData.permissions?.includes(page.id) || false}
                    onCheckedChange={(checked) => {
                      setFormData(prev => {
                        const currentPerms = prev.permissions || [];
                        const newPerms = checked
                          ? [...currentPerms, page.id]
                          : currentPerms.filter(p => p !== page.id);
                        return { ...prev, permissions: newPerms };
                      });
                    }}
                  />
                  <label
                    htmlFor={`edit-${page.id}`}
                    className="text-sm leading-none cursor-pointer"
                  >
                    {page.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={onSubmit}
        className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
        disabled={submitting || !formData.name || !formData.email || !formData.role}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Updating User...
          </>
        ) : (
          <>
            <Pencil className="w-4 h-4 mr-2" />
            Update User
          </>
        )}
      </Button>
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    permissions: AVAILABLE_PAGES.map(p => p.id), // Default admin has all permissions
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    permissions: [],
  });

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authApi.getAll({
        page,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch
      });

      if (response.pagination) {
        setUsers(response.users || []);
        setTotalItems(response.pagination.total);
        setTotalPages(response.pagination.pages);
      } else {
        const usersData = Array.isArray(response) ? response : response.users || [];
        setUsers(usersData);
        setTotalItems(usersData.length);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, debouncedSearch]);

  const filteredUsers = users;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleBadge = (role) => {
    const roleStyles = {
      user: 'bg-muted text-muted-foreground',
      admin: 'bg-primary/10 text-primary',
      accountant: 'bg-warning/10 text-warning',
      superadmin: 'bg-destructive/10 text-destructive',
    };
    const roleLabels = {
      user: 'User',
      admin: 'Admin',
      accountant: 'Accountant',
      superadmin: 'Super Admin',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleStyles[role] || roleStyles.user}`}>
        {roleLabels[role] || role || 'User'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleAddUser = async () => {
    try {
      setSubmitting(true);

      // Call the API
      await authApi.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        permissions: formData.permissions,
      });

      // Refresh users list
      await fetchUsers();

      // Reset form
      setFormData({ name: '', email: '', password: '', role: 'user' });
      setIsAddModalOpen(false);
      toast.success('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      setSubmitting(true);

      await authApi.update(editingUser._id || editingUser.id, {
        name: editFormData.name,
        email: editFormData.email,
        role: editFormData.role,
        permissions: editFormData.permissions,
      });

      await fetchUsers();

      setEditingUser(null);
      setEditFormData({ name: '', email: '', role: 'user', permissions: [] });
      setIsEditModalOpen(false);
      toast.success('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const [userToDelete, setUserToDelete] = useState(null);

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await authApi.delete(userToDelete._id || userToDelete.id);
      await fetchUsers();
      toast.success('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setUserToDelete(null);
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      permissions: user.permissions || [],
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'admin', permissions: AVAILABLE_PAGES.map(p => p.id) });
  };

  // Loading check moved inside render to keep inputs mounted

  return (
    <AdminLayout title="Users" subtitle="Manage registered users">
      {/* Search & Add User */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-primary hover:bg-primary-hover text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <AddUserForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAddUser}
                submitting={submitting}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="stat-card text-center py-12">
          <p className="text-muted-foreground">No users found. Make sure your backend is running.</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="block lg:hidden space-y-3">
            {filteredUsers.map((user) => (
              <div key={user._id || user.id} className="stat-card">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  {getRoleBadge(user.role)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined:</span>
                    <span className="text-foreground">{formatDate(user.createdAt)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(user)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDeleteUser(user)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4" />
                  </Button>
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
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">User</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Email</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Role</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Joined</th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id || user.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground truncate max-w-[150px]">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground truncate max-w-[180px]">{user.email}</td>
                      <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(user.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(user)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setUserToDelete(user)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          {/* <Button variant="ghost" size="sm">
                            <Mail className="w-4 h-4" />
                          </Button> */}
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
              itemName="users"
            />
          </div>
        </>
      )}

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open);
        if (!open) {
          setEditingUser(null);
          setEditFormData({ name: '', email: '', role: 'user', permissions: [] });
        }
      }}>
        <DialogContent className="bg-card max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <EditUserForm
            formData={editFormData}
            setFormData={setEditFormData}
            onSubmit={handleEditUser}
            submitting={submitting}
          />
        </DialogContent>
      </Dialog>

      {/* Info Note */}
      {/* <div className="mt-6 p-4 bg-info/10 border border-info/20 rounded-lg">
        <p className="text-sm text-info">
          <strong>API Connected:</strong> Users fetched from <code className="bg-muted px-1 rounded">https://cashmish-backend.onrender.com/api/auth/users</code>
        </p>
      </div> */}
      {/* Delete Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user <strong>{userToDelete?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
