import { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PendingApproval from '@/pages/PendingApproval';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isApproved, isCorpoTecnico, isLoading } = useAuth();
  const navigate = useNavigate();

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Block access if user is not Corpo Técnico
  if (!isCorpoTecnico) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">
            Apenas usuários do <strong>Corpo Técnico</strong> podem acessar esta plataforma.
          </p>
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Voltar ao Login
          </Button>
        </div>
      </div>
    );
  }

  // Check if corpo tecnico is approved
  if (!isApproved) {
    return <PendingApproval />;
  }

  // User is authenticated and approved (or not corpo tecnico), render children
  return <>{children}</>;
};

export default ProtectedRoute;

