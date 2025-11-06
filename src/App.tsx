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
import SetPassword from "./pages/SetPassword";
import PendingApproval from "./pages/PendingApproval";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Users from "./pages/Users";
import CreateUser from "./pages/CreateUser";
import EditUser from "./pages/EditUser";
import ViewUser from "./pages/ViewUser";
import Licenses from "./pages/Licenses";
import CreateLicense from "./pages/CreateLicense";
import EditLicense from "./pages/EditLicense";
import ViewLicense from "./pages/ViewLicense";
import CreateContract from "./pages/CreateContract";
import EditContract from "./pages/EditContract";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/first-access" element={<FirstAccess />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/password-reset-confirmation" element={<PasswordResetConfirmation />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          
          {/* Protected Routes */}
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/licenses" element={
            <ProtectedRoute>
              <Licenses />
            </ProtectedRoute>
          } />
          <Route path="/create-license" element={
            <ProtectedRoute>
              <CreateLicense />
            </ProtectedRoute>
          } />
          <Route path="/edit-license/:id" element={
            <ProtectedRoute>
              <EditLicense />
            </ProtectedRoute>
          } />
          <Route path="/view-license/:id" element={
            <ProtectedRoute>
              <ViewLicense />
            </ProtectedRoute>
          } />
          <Route path="/create-contract/:licenseId" element={
            <ProtectedRoute>
              <CreateContract />
            </ProtectedRoute>
          } />
          <Route path="/edit-contract/:licenseId/:contractId" element={
            <ProtectedRoute>
              <EditContract />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="/create-user" element={
            <ProtectedRoute>
              <CreateUser />
            </ProtectedRoute>
          } />
          <Route path="/edit-user/:id" element={
            <ProtectedRoute>
              <EditUser />
            </ProtectedRoute>
          } />
          <Route path="/view-user/:id" element={
            <ProtectedRoute>
              <ViewUser />
            </ProtectedRoute>
          } />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
