import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { X } from 'lucide-react';

const PasswordResetConfirmation = () => {
  const navigate = useNavigate();

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
                <div className="text-base text-[#6c757d] text-center leading-[1.5]">
                  <p className="mb-0">Enviamos um link para redefinir sua senha no seu e-mail. ✉️</p>
                  <p>Confira sua caixa de entrada.</p>
                </div>
              </div>
            </div>

            {/* Botão Ok */}
            <div className="flex flex-col gap-4 w-full">
              <Button
                onClick={() => navigate('/')}
                className="w-full bg-[#029c58] hover:bg-[#028a4d] border border-[#029c58] text-white text-base font-normal py-[7px] px-[13px] h-auto rounded-md"
              >
                Ok
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-[rgba(0,0,0,0.03)] border-t border-[rgba(0,0,0,0.18)] px-4 py-2">
          <p className="text-base text-[#212529]">&nbsp;</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PasswordResetConfirmation;
