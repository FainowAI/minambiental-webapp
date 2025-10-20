import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Leaf, CheckCircle2, Mail } from 'lucide-react';

const PasswordResetConfirmation = () => {
  const navigate = useNavigate();

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
            <Mail className="w-16 h-16" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-5xl font-bold mb-6"
          >
            Email Enviado!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-xl text-white/90 leading-relaxed"
          >
            Verifique sua caixa de entrada e siga as instruções para redefinir sua senha
          </motion.p>
        </div>
      </motion.div>

      {/* Right Side - Confirmation */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="flex-1 flex items-center justify-center p-8 bg-white"
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:hidden text-center mb-8"
          >
            <div className="inline-block p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4">
              <Leaf className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">MinAmbiental</h1>
            <p className="text-gray-600 mt-2">Email enviado com sucesso</p>
          </motion.div>

          {/* Confirmation Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
          >
            <div className="mb-8 text-center">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="inline-block mb-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-100 rounded-full animate-pulse" />
                  <div className="relative p-4 bg-emerald-100 rounded-full">
                    <CheckCircle2 className="w-16 h-16 text-emerald-600" />
                  </div>
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-2xl font-bold text-gray-800 mb-4"
              >
                Email enviado com sucesso!
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-3"
              >
                <p className="text-gray-600">
                  Enviamos um link para redefinir sua senha no seu e-mail.
                </p>
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <Mail className="w-5 h-5" />
                  <span className="font-medium">Confira sua caixa de entrada</span>
                </div>
              </motion.div>
            </div>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
            >
              <p className="text-sm text-blue-800">
                <strong>Dica:</strong> Se não encontrar o email, verifique sua pasta de spam ou lixo eletrônico.
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="space-y-3"
            >
              <Button
                onClick={() => navigate('/')}
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Voltar para Login
              </Button>

              <Button
                onClick={() => navigate('/forgot-password')}
                variant="outline"
                className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-all duration-200"
              >
                Reenviar Email
              </Button>
            </motion.div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-sm text-gray-500 mt-8"
          >
            © 2024 MinAmbiental. Todos os direitos reservados.
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default PasswordResetConfirmation;
