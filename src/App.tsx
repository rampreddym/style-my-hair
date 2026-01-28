import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import CustomerProfile from "./pages/customer/CustomerProfile";
import CustomerStyle from "./pages/customer/CustomerStyle";
import CustomerBooking from "./pages/customer/CustomerBooking";
import CustomerBookingDetails from "./pages/customer/CustomerBookingDetails";
import CustomerAppointments from "./pages/customer/CustomerAppointments";
import CustomerStylistProfile from "./pages/customer/StylistProfile";
import StylistOnboarding from "./pages/stylist/StylistOnboarding";
import StylistHome from "./pages/stylist/StylistHome";
import StylistProfile from "./pages/stylist/StylistProfile";
import StylistServices from "./pages/stylist/StylistServices";
import StylistAppointments from "./pages/stylist/StylistAppointments";
import StylistPayments from "./pages/stylist/StylistPayments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            
            {/* Customer Routes */}
            <Route path="/customer" element={<CustomerProfile />} />
            <Route path="/customer/style" element={<CustomerStyle />} />
            <Route path="/customer/booking" element={<CustomerBooking />} />
            <Route path="/customer/booking/:stylistId" element={<CustomerBookingDetails />} />
            <Route path="/customer/appointments" element={<CustomerAppointments />} />
            <Route path="/customer/stylist/:stylistId" element={<CustomerStylistProfile />} />
            
            {/* Stylist Routes */}
            <Route path="/stylist" element={<StylistHome />} />
            <Route path="/stylist/onboarding" element={<StylistOnboarding />} />
            <Route path="/stylist/profile" element={<StylistProfile />} />
            <Route path="/stylist/services" element={<StylistServices />} />
            <Route path="/stylist/appointments" element={<StylistAppointments />} />
            <Route path="/stylist/payments" element={<StylistPayments />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;