import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Smartphone,
  Settings2,
  FileText,
  Gavel,
  Users,
  BarChart3,
  Package,
  Settings,
  Landmark,
  LogOut,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Menu,
  X,
  Ticket, // Added Ticket icon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', allowedRoles: ['superadmin', 'admin', 'accountant'] },
  { icon: Smartphone, label: 'Mobiles', path: '/mobiles', allowedRoles: ['superadmin', 'admin'] },
  { icon: RefreshCw, label: 'Requests', path: '/requests', allowedRoles: ['superadmin'] },
  // { icon: Settings2, label: 'Price Config', path: '/price-configuration', allowedRoles: ['superadmin', 'admin'] },
  // { icon: Settings2, label: 'Condition Rules', path: '/conditions' },
  { icon: FileText, label: 'Submissions', path: '/submissions', allowedRoles: ['superadmin', 'admin'] },
  { icon: Gavel, label: 'Bids', path: '/bids', allowedRoles: ['superadmin', 'admin'] },
  { icon: Package, label: 'Inventory', path: '/inventory', allowedRoles: ['superadmin', 'admin', 'accountant'] },
  { icon: Landmark, label: 'Bank Details', path: '/bank-details', allowedRoles: ['superadmin', 'admin', 'accountant'] },
  { icon: Ticket, label: 'Coupons', path: '/coupons', allowedRoles: ['superadmin', 'admin'] },
  { icon: Users, label: 'Users', path: '/users', allowedRoles: ['superadmin'] },
  // { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings', allowedRoles: ['superadmin', 'admin', 'accountant'] },
];

export function AdminSidebar({ collapsed, setCollapsed }) {
  // const [collapsed, setCollapsed] = useState(false); // Removed local state
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth(); // Get user from auth context

  // Filter nav items based on role
  const filteredNavItems = navItems.filter(item =>
    !item.allowedRoles || (user && item.allowedRoles.includes(user.role))
  );

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile Menu Button - positioned in sidebar area, not over content */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed top-3 left-3 z-40 w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-primary-foreground" />
        </button>
      )}

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-sidebar transition-all duration-300 z-50 flex flex-col',
          // Desktop
          'hidden lg:flex',
          collapsed ? 'lg:w-20' : 'lg:w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sidebar-accent-foreground truncate">Cashmish</span>
              <span className="text-xs text-sidebar-muted truncate">Admin Panel</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'nav-item',
                  isActive && 'active',
                  collapsed && 'justify-center px-3'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className={cn(
              'nav-item w-full text-sidebar-muted hover:text-destructive',
              collapsed && 'justify-center px-3'
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-md hover:bg-secondary transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed left-0 top-0 h-screen bg-sidebar transition-transform duration-300 z-50 flex flex-col w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center"
          aria-label="Close menu"
        >
          <X className="w-4 h-4 text-sidebar-foreground" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sidebar-accent-foreground truncate">Cashmish</span>
            <span className="text-xs text-sidebar-muted truncate">Admin Panel</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'nav-item',
                  isActive && 'active'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="nav-item w-full text-sidebar-muted hover:text-destructive"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
