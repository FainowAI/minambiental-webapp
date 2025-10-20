import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, ChevronLeft, ChevronRight } from 'lucide-react';

const Users = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const totalItems = 85;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Dados mockados para a tabela
  const users = [
    {
      cpf: '999.999-999-99',
      name: 'xxxxxxxxxxxxxxxxxxx',
      email: 'teste@gmail.com',
      phone: '(99) 99999-99999',
      profile: 'Corpo Técnico',
      status: 'Ativo',
    },
    {
      cpf: '999.999-999-99',
      name: 'xxxxxxxxxxxxxxxxxxx',
      email: 'teste@gmail.com',
      phone: '(99) 99999-99999',
      profile: 'Corpo Técnico',
      status: 'Ativo',
    },
    {
      cpf: '999.999-999-99',
      name: 'xxxxxxxxxxxxxxxxxxx',
      email: 'teste@gmail.com',
      phone: '(99) 99999-99999',
      profile: 'Corpo Técnico',
      status: 'Ativo',
    },
    {
      cpf: '999.999-999-99',
      name: 'xxxxxxxxxxxxxxxxxxx',
      email: 'teste@gmail.com',
      phone: '(99) 99999-99999',
      profile: 'Técnico',
      status: 'Ativo',
    },
    {
      cpf: '999.999-999-99',
      name: 'xxxxxxxxxxxxxxxxxxx',
      email: 'teste@gmail.com',
      phone: '(99) 99999-99999',
      profile: 'Técnico',
      status: 'Ativo',
    },
    {
      cpf: '999.999-999-99',
      name: 'xxxxxxxxxxxxxxxxxxx',
      email: 'teste@gmail.com',
      phone: '(99) 99999-99999',
      profile: 'Técnico',
      status: 'Ativo',
    },
    {
      cpf: '99.999.999/9999-99',
      name: 'xxxxxxxxxxxxxxxxxxx',
      email: 'teste@gmail.com',
      phone: '(99) 99999-99999',
      profile: 'Requerente',
      status: 'Ativo',
    },
    {
      cpf: '99.999.999/9999-99',
      name: 'xxxxxxxxxxxxxxxxxxx',
      email: 'teste@gmail.com',
      phone: '(99) 99999-99999',
      profile: 'Requerente',
      status: 'Ativo',
    },
    {
      cpf: '99.999.999/9999-99',
      name: 'xxxxxxxxxxxxxxxxxxx',
      email: 'teste@gmail.com',
      phone: '(99) 99999-99999',
      profile: 'Requerente',
      status: 'Ativo',
    },
  ];

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
      <div className="flex-1 px-[44px] py-[32px]">
        {/* Header com título verde */}
        <div className="bg-[#029c58] rounded-t-md px-6 py-4 mb-0">
          <h1 className="text-[16px] text-white font-['Roboto'] font-normal leading-[1.5]">
            Pessoas
          </h1>
        </div>

        {/* Formulário de Busca */}
        <div className="bg-white border-x border-[rgba(0,0,0,0.18)] px-6 py-8">
          <div className="flex gap-[77px] items-end flex-wrap">
            {/* CPF/CNPJ */}
            <div className="flex flex-col gap-2 w-[400px]">
              <Label htmlFor="cpf" className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">
                CPF/CNPJ
              </Label>
              <Input
                id="cpf"
                placeholder="99.999.999/9999-99"
                className="border-[#ced4da] text-[16px] font-['Roboto'] h-[38px]"
              />
            </div>

            {/* Nome */}
            <div className="flex flex-col gap-2 w-[400px]">
              <Label htmlFor="name" className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">
                Nome
              </Label>
              <Input
                id="name"
                placeholder="xxxxxxxxxxxxxxxxxxx"
                className="border-[#ced4da] text-[16px] font-['Roboto'] h-[38px]"
              />
            </div>

            {/* Perfil */}
            <div className="flex flex-col gap-2 w-[400px]">
              <Label htmlFor="profile" className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">
                Perfil
              </Label>
              <Select>
                <SelectTrigger id="profile" className="border-[#ced4da] text-[16px] font-['Roboto'] h-[38px]">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corpo-tecnico">Corpo Técnico</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="requerente">Requerente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-2 w-[400px]">
              <Label htmlFor="status" className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">
                Status
              </Label>
              <Select>
                <SelectTrigger id="status" className="border-[#ced4da] text-[16px] font-['Roboto'] h-[38px]">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4 mt-8">
            <Button className="bg-[#029c58] hover:bg-[#028a4d] text-white text-[16px] font-['Roboto'] px-4 py-2 h-auto rounded-md">
              Buscar
            </Button>
            <Button
              onClick={() => navigate('/create-user')}
              className="bg-[#029c58] hover:bg-[#028a4d] text-white text-[16px] font-['Roboto'] px-4 py-2 h-auto rounded-[40px] flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3V13M3 8H13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Cadastrar Usuário
            </Button>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white border border-[rgba(0,0,0,0.18)] rounded-b-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[rgba(0,0,0,0.03)] hover:bg-[rgba(0,0,0,0.03)]">
                <TableHead className="text-[16px] text-[#212529] font-['Roboto'] font-normal leading-[1.5]">
                  CPF/CNPJ
                </TableHead>
                <TableHead className="text-[16px] text-[#212529] font-['Roboto'] font-normal leading-[1.5]">
                  Nome
                </TableHead>
                <TableHead className="text-[16px] text-[#212529] font-['Roboto'] font-normal leading-[1.5]">
                  Email
                </TableHead>
                <TableHead className="text-[16px] text-[#212529] font-['Roboto'] font-normal leading-[1.5]">
                  Celular
                </TableHead>
                <TableHead className="text-[16px] text-[#212529] font-['Roboto'] font-normal leading-[1.5]">
                  Perfil
                </TableHead>
                <TableHead className="text-[16px] text-[#212529] font-['Roboto'] font-normal leading-[1.5]">
                  Status
                </TableHead>
                <TableHead className="text-[16px] text-[#212529] font-['Roboto'] font-normal leading-[1.5] text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={index} className="hover:bg-[rgba(0,0,0,0.02)]">
                  <TableCell className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">
                    {user.cpf}
                  </TableCell>
                  <TableCell className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">
                    {user.name}
                  </TableCell>
                  <TableCell className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">
                    {user.phone}
                  </TableCell>
                  <TableCell className="text-[16px] text-[#212529] font-['Roboto'] leading-[1.5]">
                    {user.profile}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-[#029c58] hover:bg-[#029c58] text-white text-[12px] font-['Roboto'] px-2 py-1 rounded-md">
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="text-[#029c58] hover:text-[#028a4d] flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span className="text-[14px] font-['Roboto']">Visualizar</span>
                      </button>
                      <button className="text-[#029c58] hover:text-[#028a4d] flex items-center gap-1">
                        <Edit className="w-4 h-4" />
                        <span className="text-[14px] font-['Roboto']">Editar</span>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Paginação */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[rgba(0,0,0,0.18)]">
            <div className="text-[14px] text-[#212529] font-['Roboto']">
              Total {totalItems} items
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {[1, 2, 3, 4, 5, 6, 7, 8].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded text-[14px] font-['Roboto'] ${
                    currentPage === page
                      ? 'bg-[#029c58] text-white'
                      : 'hover:bg-gray-100 text-[#212529]'
                  }`}
                >
                  {page}
                </button>
              ))}

              <span className="px-2">...</span>
              <button className="px-3 py-1 rounded text-[14px] font-['Roboto'] hover:bg-gray-100 text-[#212529]">
                20
              </button>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <Select value={String(itemsPerPage)}>
                <SelectTrigger className="w-[100px] h-[30px] text-[14px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>

              <span className="text-[14px] text-[#212529] font-['Roboto']">Go to</span>
              <Input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="w-[60px] h-[30px] text-[14px] text-center"
              />
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

export default Users;
