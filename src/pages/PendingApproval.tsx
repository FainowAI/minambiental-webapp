import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Leaf, Clock, ArrowLeft, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PendingApproval = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se o usuário ainda está pendente
    const checkApprovalStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('status_aprovacao, perfil')
          .eq('auth_user_id', user.id)
          .single();

        if (usuario) {
          if (usuario.status_aprovacao === 'Aprovado') {
            toast.success('Seu acesso foi aprovado! Redirecionando...');
            navigate('/home');
            return;
          } else if (usuario.status_aprovacao === 'Rejeitado') {
            toast.error('Seu acesso foi rejeitado. Entre em contato com o administrador.');
            await supabase.auth.signOut();
            navigate('/');
            return;
          }
        }
      }
    };

    checkApprovalStatus();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Animated Background */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-emerald-500 via-teal-600 to-green-700 items-center justify-center p-12"
      >
        {/* Animated Background Circles */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
        />

        {/* Content */}
        <div className="relative z-10 text-center text-white max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="mb-8 inline-block p-4 bg-white/20 backdrop-blur-sm rounded-full"
          >
            <Clock className="w-16 h-16" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-5xl font-bold mb-6"
          >
            Aguarde...
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-xl text-white/90 leading-relaxed"
          >
            Seu cadastro está sendo analisado por nossa equipe
          </motion.p>
        </div>
      </motion.div>

      {/* Right Side - Pending Content */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto"
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:hidden text-center mb-6"
          >
            <div className="inline-block p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-3">
              <Leaf className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">MinAmbiental</h1>
          </motion.div>

          {/* Pending Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Aprovação Pendente
              </h2>
              <p className="text-gray-600">
                Seu cadastro foi recebido e está sendo analisado por nossa equipe de administradores.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">O que acontece agora?</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Nossa equipe analisará seus dados</li>
                  <li>• Você receberá um email quando for aprovado</li>
                  <li>• Após aprovação, poderá acessar a plataforma</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 mb-2">Tempo de espera</h3>
                <p className="text-sm text-amber-700">
                  O processo de aprovação pode levar até 24 horas. Você será notificado por email assim que sua conta for aprovada.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Clock className="w-4 h-4 mr-2" />
                Verificar Status
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-sm text-gray-500 mt-6"
          >
            © 2024 MinAmbiental. Todos os direitos reservados.
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default PendingApproval;
