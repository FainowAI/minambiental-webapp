import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, EyeOff, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginModal = ({ open, onOpenChange }: LoginModalProps) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação básica
      if (!email || !password) {
        toast.error('Por favor, preencha todos os campos');
        setLoading(false);
        return;
      }

      // Chamada ao Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        // Tratamento de erros específicos do Supabase
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Por favor, confirme seu email antes de fazer login');
        } else {
          toast.error('Erro ao fazer login. Tente novamente.');
        }
        setLoading(false);
        return;
      }

      // Login bem-sucedido
      if (data.user) {
        toast.success('Login realizado com sucesso!');
        onOpenChange(false);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFirstAccess = () => {
    onOpenChange(false);
    navigate('/first-access');
  };

  const handleForgotPassword = () => {
    onOpenChange(false);
    navigate('/forgot-password');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 gap-0 bg-white border-[rgba(0,0,0,0.18)]">
        {/* Header */}
        <DialogHeader className="bg-[rgba(0,0,0,0.03)] border-b border-[rgba(0,0,0,0.18)] px-4 py-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-normal text-[#212529]">
              Realizar Login
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-0 py-5">
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
                  Bem-vindo de volta! Por favor, insira seus dados
                </p>
              </div>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
              {/* Email */}
              <div className="flex flex-col gap-2 pb-4">
                <Label htmlFor="email" className="text-base text-[#212529] font-normal">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Informe seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-[#ced4da] text-base placeholder:text-[#6c757d] h-auto py-[7px] px-[13px]"
                />
              </div>

              {/* Senha */}
              <div className="flex flex-col gap-2 pb-4">
                <Label htmlFor="password" className="text-base text-[#212529] font-normal">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Informe sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-[#ced4da] text-base placeholder:text-[#6c757d] h-auto py-[7px] px-[13px] pr-10"
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
              </div>

              {/* Lembrar Login e Esqueceu a senha */}
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-[#dee2e6] data-[state=checked]:bg-[#029c58] data-[state=checked]:border-[#029c58]"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-base text-[#212529] font-normal cursor-pointer"
                  >
                    Lembrar Login
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-base text-[#16b2e8] underline hover:text-[#1296cc] transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>

              {/* Botão Entrar */}
              <div className="flex flex-col gap-4 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#029c58] hover:bg-[#028a4d] border border-[#029c58] text-white text-base font-normal py-[7px] px-[13px] h-auto rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </div>
            </form>

            {/* Primeiro Acesso */}
            <div className="flex items-center justify-center gap-1">
              <span className="text-base text-[#6c757d]">Primeiro Acesso?</span>
              <button
                type="button"
                onClick={handleFirstAccess}
                className="text-base text-[#16b2e8] underline hover:text-[#1296cc] transition-colors"
              >
                Sim
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[rgba(0,0,0,0.03)] border-t border-[rgba(0,0,0,0.18)] px-4 py-2">
          <p className="text-base text-[#212529]">&nbsp;</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
