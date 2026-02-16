import { useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { TopNavbar } from './TopNavbar';

export function AdminLayout({ children, title, subtitle, actions }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setCollapsed(false); // Reset on mobile
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // w-64 = 256px, w-20 = 80px
  const sidebarWidth = isMobile ? 0 : (collapsed ? 80 : 256);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        className="transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        <TopNavbar title={title} subtitle={subtitle} actions={actions} />
        <main className="p-4 sm:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
