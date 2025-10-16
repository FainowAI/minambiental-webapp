import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar se há um token de recuperação de senha na URL
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Link inválido ou expirado');
        navigate('/');
      }
    };

    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação básica
      if (!password || !confirmPassword) {
        toast.error('Por favor, preencha todos os campos');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        toast.error('As senhas não coincidem');
        setLoading(false);
        return;
      }

      // Atualizar senha usando Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error('Erro ao alterar senha: ' + error.message);
        setLoading(false);
        return;
      }

      // Sucesso - fazer logout para forçar novo login
      await supabase.auth.signOut();

      toast.success('Senha alterada com sucesso! Faça login com sua nova senha.');

      // Redirecionar para página inicial após 2 segundos
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Erro inesperado:', err);
      toast.error('Erro inesperado. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md border-[rgba(0,0,0,0.18)] shadow-sm">
        <CardHeader className="bg-[rgba(0,0,0,0.03)] border-b border-[rgba(0,0,0,0.18)] px-4 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-normal text-[#212529]">Alterar Senha</h1>
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
                  Bem-vindo de volta! Por favor, insira sua nova senha!
                </p>
              </div>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
              {/* Nova senha */}
              <div className="flex flex-col gap-2 pb-4">
                <Label htmlFor="password" className="text-base text-[#212529] font-normal">
                  Nova senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Informe novamente a sua nova senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-[#ced4da] text-base placeholder:text-[#6c757d] h-auto py-[7px] px-[13px] pr-10"
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
              </div>

              {/* Confirme sua nova senha */}
              <div className="flex flex-col gap-2 pb-4">
                <Label htmlFor="confirmPassword" className="text-base text-[#212529] font-normal">
                  Confirme sua nova senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Informe novamente a sua nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-[#ced4da] text-base placeholder:text-[#6c757d] h-auto py-[7px] px-[13px] pr-10"
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
              </div>

              {/* Botão Alterar */}
              <div className="flex flex-col gap-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#029c58] hover:bg-[#028a4d] border border-[#029c58] text-white text-base font-normal py-[7px] px-[13px] h-auto rounded-md disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    'Alterar'
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

export default ResetPassword;
