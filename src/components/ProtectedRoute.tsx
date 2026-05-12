import { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PendingApproval from '@/pages/PendingApproval';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isCorpoTecnico, isApproved, isLoading } = useAuth();
  const navigate = useNavigate();

  // A session exists if Supabase Auth has a user, even before the `usuarios`
  // row has been loaded — that lets us keep the user on the protected route
  // tree (showing a fallback) while approval checks run, instead of bouncing
  // them back to /.
  const hasSession = Boolean(user);

  // 1. Loading state
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

  // 2. No session → redirect to login
  if (!hasSession) {
    return <Navigate to="/" replace />;
  }

  // 3. Not Corpo Técnico → access denied (Técnicos never log in)
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

  // 4. Corpo Técnico but not yet approved → pending approval page
  if (!isApproved) {
    return <PendingApproval />;
  }

  // 5. Authenticated, Corpo Técnico, approved → render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
