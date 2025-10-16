import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Eye, EyeOff, X, Loader2 } from 'lucide-react';
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
  perfil: z.enum(['user', 'gestor', 'admin']).default('user'),
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
    perfil: 'user' as 'user' | 'gestor' | 'admin',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
            nome: validatedData.nome,
            cpf: validatedData.cpf.replace(/\D/g, ''),
            celular: validatedData.celular?.replace(/\D/g, ''),
            perfil: validatedData.perfil,
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
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Verifique seu email para confirmar o cadastro.',
        });
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md border-[rgba(0,0,0,0.18)] shadow-sm">
        <CardHeader className="bg-[rgba(0,0,0,0.03)] border-b border-[rgba(0,0,0,0.18)] px-4 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-normal text-[#212529]">Definir Senha</h1>
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="px-0 py-5">
          <div className="flex flex-col items-center gap-8 px-10">
            {/* Header */}
            <div className="flex flex-col items-center gap-6 w-full">
              {/* Logo */}
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img
                  src="http://localhost:3845/assets/17cd82d0b53defa48d0db5a8b3c90b892efc24fe.png"
                  alt="MinAmbiental Logo"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Título e Subtítulo */}
              <div className="flex flex-col items-center gap-3 w-full">
                <h2 className="text-[32px] leading-[1.2] font-normal">
                  <span className="text-[#a5d625]">M</span>
                  <span className="text-[#16b2e8]">i</span>
                  <span className="text-[#61381d]">n</span>
                  <span className="text-[#029c58]">A</span>
                  <span className="text-[#aa7850]">m</span>
                  <span className="text-[#212529]">b</span>
                  <span className="text-[#cab29f]">i</span>
                  <span className="text-[#a5d625]">e</span>
                  <span className="text-[#16b2e8]">n</span>
                  <span className="text-[#61381d]">t</span>
                  <span className="text-[#029c58]">a</span>
                  <span className="text-[#aa7850]">l</span>
                </h2>
                <p className="text-base text-[#6c757d] text-center leading-[1.5]">
                  Bem-vindo de volta! Por favor, insira sua senha.
                </p>
              </div>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
              {/* Nome */}
              <div className="flex flex-col gap-2 pb-4">
                <Label htmlFor="nome" className="text-base text-[#212529] font-normal">
                  Nome Completo *
                </Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Informe seu nome completo"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  className={`border-[#ced4da] text-base placeholder:text-[#6c757d] h-auto py-[7px] px-[13px] ${
                    errors.nome ? 'border-red-500' : ''
                  }`}
                  required
                />
                {errors.nome && (
                  <p className="text-sm text-red-500">{errors.nome}</p>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2 pb-4">
                <Label htmlFor="email" className="text-base text-[#212529] font-normal">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Informe seu email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`border-[#ced4da] text-base placeholder:text-[#6c757d] h-auto py-[7px] px-[13px] ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                  required
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* CPF */}
              <div className="flex flex-col gap-2 pb-4">
                <Label htmlFor="cpf" className="text-base text-[#212529] font-normal">
                  CPF *
                </Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  className={`border-[#ced4da] text-base placeholder:text-[#6c757d] h-auto py-[7px] px-[13px] ${
                    errors.cpf ? 'border-red-500' : ''
                  }`}
                  maxLength={14}
                  required
                />
                {errors.cpf && (
                  <p className="text-sm text-red-500">{errors.cpf}</p>
                )}
              </div>

              {/* Celular */}
              <div className="flex flex-col gap-2 pb-4">
                <Label htmlFor="celular" className="text-base text-[#212529] font-normal">
                  Celular
                </Label>
                <Input
                  id="celular"
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={formData.celular}
                  onChange={(e) => handleInputChange('celular', e.target.value)}
                  className={`border-[#ced4da] text-base placeholder:text-[#6c757d] h-auto py-[7px] px-[13px] ${
                    errors.celular ? 'border-red-500' : ''
                  }`}
                  maxLength={15}
                />
                {errors.celular && (
                  <p className="text-sm text-red-500">{errors.celular}</p>
                )}
              </div>

              {/* Senha */}
              <div className="flex flex-col gap-2 pb-4">
                <Label htmlFor="password" className="text-base text-[#212529] font-normal">
                  Senha *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`border-[#ced4da] text-base placeholder:text-[#6c757d] h-auto py-[7px] px-[13px] pr-10 ${
                      errors.password ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Confirme a senha */}
              <div className="flex flex-col gap-2 pb-4">
                <Label htmlFor="confirmPassword" className="text-base text-[#212529] font-normal">
                  Confirme a senha *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Informe novamente a senha"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`border-[#ced4da] text-base placeholder:text-[#6c757d] h-auto py-[7px] px-[13px] pr-10 ${
                      errors.confirmPassword ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Botão Criar Conta */}
              <div className="flex flex-col gap-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#029c58] hover:bg-[#028a4d] border border-[#029c58] text-white text-base font-normal py-[7px] px-[13px] h-auto rounded-md disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Criar Conta'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>

        <CardFooter className="bg-[rgba(0,0,0,0.03)] border-t border-[rgba(0,0,0,0.18)] px-4 py-2">
          <p className="text-base text-[#212529]">&nbsp;</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FirstAccess;
