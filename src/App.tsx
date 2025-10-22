import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import FirstAccess from "./pages/FirstAccess";
import ForgotPassword from "./pages/ForgotPassword";
import PasswordResetConfirmation from "./pages/PasswordResetConfirmation";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Users from "./pages/Users";
import CreateUser from "./pages/CreateUser";
import Licenses from "./pages/Licenses";
import CreateLicense from "./pages/CreateLicense";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/first-access" element={<FirstAccess />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/password-reset-confirmation" element={<PasswordResetConfirmation />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/home" element={<Home />} />
          <Route path="/licenses" element={<Licenses />} />
          <Route path="/create-license" element={<CreateLicense />} />
          <Route path="/users" element={<Users />} />
          <Route path="/create-user" element={<CreateUser />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
