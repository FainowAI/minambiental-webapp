import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFormAutosave } from '@/hooks/useFormAutosave';
import { useUnsavedChangesPrompt } from '@/hooks/useUnsavedChangesPrompt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Leaf, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const signupSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(255),
  email: z.string().email('Email inválido'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF inválido'),
  celular: z.string().regex(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$|^\d{10,11}$/, 'Celular inválido').optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

const FirstAccess = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    celular: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dados do formulário sem senhas para autosave (segurança)
  const formDataForAutosave = {
    nome: formData.nome,
    email: formData.email,
    cpf: formData.cpf,
    celular: formData.celular,
  };

  // Autosave hook (excluindo senhas por segurança)
  const autosaveKey = 'first_access_draft';
  const { restoreDraft, clearDraft } = useFormAutosave(autosaveKey, formDataForAutosave, {
    enabled: true,
    debounceMs: 400,
  });

  // Função para verificar se há alterações
  const isDirty = () => {
    return (
      formData.nome.trim() !== '' ||
      formData.email.trim() !== '' ||
      formData.cpf.trim() !== '' ||
      formData.celular.trim() !== ''
    );
  };

  // Aviso de alterações não salvas
  useUnsavedChangesPrompt({
    when: isDirty(),
    message: 'Você tem alterações não salvas. Deseja realmente sair?',
  });

  // Restaurar rascunho ao montar componente
  useEffect(() => {
    const draft = restoreDraft();
    if (draft) {
      setFormData(prev => ({
        ...prev,
        nome: draft.nome || '',
        email: draft.email || '',
        cpf: draft.cpf || '',
        celular: draft.celular || '',
      }));
      toast({
        title: 'Rascunho restaurado',
        description: 'Seus dados foram recuperados.',
      });
    }
  }, [restoreDraft]);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const formatCelular = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      if (numbers.length === 11) {
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      } else if (numbers.length === 10) {
        return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      }
    }
    return value;
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (field === 'celular') {
      formattedValue = formatCelular(value);
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const validatedData = signupSchema.parse(formData);

      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nome: validatedData.nome.trim(),
            cpf: validatedData.cpf.replace(/\D/g, ''),
            celular: validatedData.celular?.replace(/\D/g, '') || '',
            perfil: 'Corpo Técnico',
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            variant: 'destructive',
            title: 'Erro no cadastro',
            description: 'Este email já está registrado. Tente fazer login.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro no cadastro',
            description: error.message,
          });
        }
        return;
      }

      if (data.user) {
        // O trigger handle_new_user já insere automaticamente em usuarios
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Verifique seu email para confirmar o cadastro. Após confirmação, aguarde aprovação de um administrador.',
        });

        clearDraft();
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);

        toast({
          variant: 'destructive',
          title: 'Erro de validação',
          description: 'Por favor, corrija os campos destacados.',
        });
      }
    } finally {
      setLoading(false);
    }
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
            <Leaf className="w-16 h-16" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-5xl font-bold mb-6"
          >
            Bem-vindo!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-xl text-white/90 leading-relaxed"
          >
            Crie sua conta e comece a monitorar sua mina ambiental
          </motion.p>
        </div>
      </motion.div>

      {/* Right Side - Signup Form */}
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

          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para login
          </motion.button>

          {/* Signup Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Criar conta</h2>
              <p className="text-gray-600">Preencha seus dados para começar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
                  Nome Completo *
                </Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                    errors.nome ? 'border-red-500' : ''
                  }`}
                  required
                />
                {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                  required
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              {/* CPF */}
              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-sm font-medium text-gray-700">
                  CPF *
                </Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                    errors.cpf ? 'border-red-500' : ''
                  }`}
                  maxLength={14}
                  required
                />
                {errors.cpf && <p className="text-xs text-red-500">{errors.cpf}</p>}
              </div>

              {/* Celular */}
              <div className="space-y-2">
                <Label htmlFor="celular" className="text-sm font-medium text-gray-700">
                  Celular
                </Label>
                <Input
                  id="celular"
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={formData.celular}
                  onChange={(e) => handleInputChange('celular', e.target.value)}
                  className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                    errors.celular ? 'border-red-500' : ''
                  }`}
                  maxLength={15}
                />
                {errors.celular && <p className="text-xs text-red-500">{errors.celular}</p>}
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`h-11 pr-10 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                      errors.password ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirmar Senha *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`h-11 pr-10 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                      errors.confirmPassword ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>
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

export default FirstAccess;
