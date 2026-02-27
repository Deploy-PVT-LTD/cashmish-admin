import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Mobiles from "./pages/Mobiles";
import Requests from "./pages/Requests";
import ConditionRules from "./pages/ConditionRules";
import Submissions from "./pages/Submissions";
import Bids from "./pages/Bids";
import Users from "./pages/Users";
import Analytics from "./pages/Analytics";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";
import PriceConfiguration from "./pages/PriceConfiguration";
import BankDetails from "./pages/BankDetails";
import Coupons from './pages/Coupons';
import Reviews from './pages/Reviews';
import Blogs from './pages/Blogs';
import SupportChats from './pages/SupportChats';
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Common Routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />

            {/* Admin & Super Admin */}
            <Route path="/mobiles" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><Mobiles /></ProtectedRoute>} />
            <Route path="/price-configuration" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><PriceConfiguration /></ProtectedRoute>} />
            <Route path="/conditions" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><ConditionRules /></ProtectedRoute>} />
            <Route path="/submissions" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><Submissions /></ProtectedRoute>} />
            <Route path="/bids" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><Bids /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'accountant']}><Inventory /></ProtectedRoute>} />
            <Route path="/bank-details" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'accountant']}><BankDetails /></ProtectedRoute>} />
            <Route path="/coupons" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><Coupons /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'accountant']}><Settings /></ProtectedRoute>} />
            <Route path="/reviews" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><Reviews /></ProtectedRoute>} />
            <Route path="/blogs" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><Blogs /></ProtectedRoute>} />
            <Route path="/support-chats" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><SupportChats /></ProtectedRoute>} />
            {/* Super Admin Only */}
            <Route path="/users" element={<ProtectedRoute allowedRoles={['superadmin']}><Users /></ProtectedRoute>} />
            <Route path="/requests" element={<ProtectedRoute allowedRoles={['superadmin']}><Requests /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={['superadmin']}><Analytics /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
