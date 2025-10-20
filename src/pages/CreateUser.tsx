import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

const CreateUser = () => {
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate('/users');
  };

  const handleSave = () => {
    // Aqui será implementada a lógica de salvamento
    console.log('Salvando usuário...');
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-[#f8f9fa] flex items-center px-3 py-2 h-[73px]">
        <img
          src="http://localhost:3845/assets/17cd82d0b53defa48d0db5a8b3c90b892efc24fe.png"
          alt="MinAmbiental Logo"
          className="w-[30px] h-[30px] object-cover"
        />
        <div className="px-4 py-[5px]">
          <span className="text-[20px] text-black opacity-90 font-['Roboto'] leading-[1.5]">
            MinAmbiental
          </span>
        </div>
        <div className="flex-1 flex items-center">
          <div className="flex items-center">
            <div className="px-4 py-2">
              <span className="text-[16px] text-[rgba(0,0,0,0.55)] font-['Roboto'] leading-[1.5]">
                Home
              </span>
            </div>
            <div className="px-4 py-2">
              <span className="text-[16px] text-[rgba(0,0,0,0.55)] font-['Roboto'] leading-[1.5]">
                Licenças e Contratos
              </span>
            </div>
            <div className="px-4 py-2">
              <span className="text-[16px] text-[rgba(0,0,0,0.9)] font-['Roboto'] leading-[1.5]">
                Usuário
              </span>
            </div>
            <div className="px-4 py-2">
              <span className="text-[16px] text-[rgba(0,0,0,0.55)] font-['Roboto'] leading-[1.5]">
                Dashboard
              </span>
            </div>
          </div>
          <div className="ml-auto">
            <button className="bg-[#029c58] rounded-[30px] w-[77px] h-[38px] flex items-center justify-center">
              <img
                src="http://localhost:3845/assets/1ee65d81e21b78ce7cc2e0afed75dda0f20d3f71.svg"
                alt="User Avatar"
                className="w-full h-full"
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 px-[20px] py-[0px]">
        {/* Container da tela com borda */}
        <div className="mx-auto mt-0 mb-0">
          {/* Header Verde */}
          <div className="bg-[#029c58] rounded-t-md px-6 py-8 mt-0">
            <h1 className="text-[20px] text-[#f8f9fa] font-['Roboto'] font-semibold leading-[1.2]">
              Cadastrar Usuário
            </h1>
          </div>

          {/* Formulário */}
          <div className="bg-white border-x border-b border-[#dee2e6] rounded-b-md px-0 py-0">
            <div className="max-w-[907px] mx-auto px-6 py-10">
              {/* Subtítulo */}
              <h2 className="text-[16px] text-[#212529] font-['Roboto'] font-medium leading-[1.5] mb-8">
                Usuário
              </h2>

              {/* Formulário */}
              <div className="space-y-4">
                {/* Perfil */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="profile" className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">
                    Perfil <span className="text-[#dc3545]">*</span>
                  </Label>
                  <Select>
                    <SelectTrigger
                      id="profile"
                      className="border-[#ced4da] text-[16px] font-['Roboto'] h-[38px] text-[#6c757d]"
                    >
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corpo-tecnico">Corpo Técnico</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="requerente">Requerente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nome */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name" className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">
                    Nome <span className="text-[#dc3545]">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="xxxxxxxxxxxxxxxxxxxx"
                    className="border-[#ced4da] text-[16px] font-['Roboto'] h-[38px] placeholder:text-[#6c757d]"
                  />
                </div>

                {/* CPF */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cpf" className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">
                    CPF <span className="text-[#dc3545]">*</span>
                  </Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    className="border-[#ced4da] text-[16px] font-['Roboto'] h-[38px] placeholder:text-[#6c757d]"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email" className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">
                    Email <span className="text-[#dc3545]">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemplo@exemplo.com"
                    className="border-[#ced4da] text-[16px] font-['Roboto'] h-[38px] placeholder:text-[#6c757d]"
                  />
                </div>

                {/* Celular */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone" className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">
                    Celular
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    className="border-[#ced4da] text-[16px] font-['Roboto'] h-[38px] placeholder:text-[#6c757d]"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-2 mt-12">
                <Button
                  onClick={handleCancel}
                  className="bg-[#6c757d] hover:bg-[#5a6268] border border-[#6c757d] text-white text-[16px] font-['Roboto'] px-4 py-2 h-auto rounded-md"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-[#029c58] hover:bg-[#028a4d] border border-[#029c58] text-white text-[16px] font-['Roboto'] px-4 py-2 h-auto rounded-md"
                >
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[rgba(0,0,0,0.03)] border-t border-[rgba(0,0,0,0.18)] px-4 py-2 mt-auto">
        <p className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">&nbsp;</p>
      </footer>
    </div>
  );
};

export default CreateUser;
