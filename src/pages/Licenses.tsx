import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home as HomeIcon,
  FileText,
  Users,
  LogOut,
  User,
  Eye,
  Edit,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  FileDown,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const Licenses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const totalItems = 85;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Filter state
  const [filters, setFilters] = useState({
    cnpj: '',
    requester: '',
    priority: '',
    status: '',
    actType: '',
    technician: '',
    municipality: '',
    validityStart: '',
    validityEnd: '',
  });

  // Navigation items for the sidebar
  const navItems = [
    {
      title: 'Home',
      icon: HomeIcon,
      url: '/home',
      isActive: location.pathname === '/home',
    },
    {
      title: 'Licenças e Contratos',
      icon: FileText,
      url: '/licenses',
      isActive: location.pathname === '/licenses',
    },
    {
      title: 'Usuários',
      icon: Users,
      url: '/users',
      isActive: location.pathname === '/users',
    },
  ];

  // Mock data for licenses
  const licenses = [
    {
      cnpj: '99.999.999/9999-99',
      requester: 'xxxxxxxxxxxxxxxxxxx',
      act: 'Uso de recursos hídricos',
      municipality: 'Campo Grande',
      priority: 'URGENTE',
      status: 'Ativo',
    },
    {
      cnpj: '99.999.999/9999-99',
      requester: 'xxxxxxxxxxxxxxxxxxx',
      act: 'Uso de recursos hídricos',
      municipality: 'Campo Grande',
      priority: 'URGENTE',
      status: 'Ativo',
    },
    {
      cnpj: '99.999.999/9999-99',
      requester: 'xxxxxxxxxxxxxxxxxxx',
      act: 'Uso de recursos hídricos',
      municipality: 'Campo Grande',
      priority: 'ALTA',
      status: 'Ativo',
    },
    {
      cnpj: '99.999.999/9999-99',
      requester: 'xxxxxxxxxxxxxxxxxxx',
      act: 'Uso de recursos hídricos',
      municipality: 'Campo Grande',
      priority: 'ALTA',
      status: 'Ativo',
    },
    {
      cnpj: '99.999.999/9999-99',
      requester: 'xxxxxxxxxxxxxxxxxxx',
      act: 'Uso de recursos hídricos',
      municipality: 'Bonito',
      priority: 'ALTA',
      status: 'Ativo',
    },
    {
      cnpj: '99.999.999/9999-99',
      requester: 'xxxxxxxxxxxxxxxxxxx',
      act: 'Uso de recursos hídricos',
      municipality: 'Bonito',
      priority: 'MÉDIA',
      status: 'Ativo',
    },
    {
      cnpj: '99.999.999/9999-99',
      requester: 'xxxxxxxxxxxxxxxxxxx',
      act: 'Uso de recursos hídricos',
      municipality: 'Bonito',
      priority: 'MÉDIA',
      status: 'Ativo',
    },
    {
      cnpj: '99.999.999/9999-99',
      requester: 'xxxxxxxxxxxxxxxxxxx',
      act: 'Uso de recursos hídricos',
      municipality: 'Aquidauana',
      priority: 'BAIXA',
      status: 'Ativo',
    },
    {
      cnpj: '99.999.999/9999-99',
      requester: 'xxxxxxxxxxxxxxxxxxx',
      act: 'Uso de recursos hídricos',
      municipality: 'Aquidauana',
      priority: 'BAIXA',
      status: 'Ativo',
    },
    {
      cnpj: '99.999.999/9999-99',
      requester: 'xxxxxxxxxxxxxxxxxxx',
      act: 'Uso de recursos hídricos',
      municipality: 'Aquidauana',
      priority: 'BAIXA',
      status: 'Ativo',
    },
  ];

  const handleLogout = () => {
    console.log('Logout clicked');
    navigate('/');
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      URGENTE: 'bg-red-500 hover:bg-red-500',
      ALTA: 'bg-red-500 hover:bg-red-500',
      MÉDIA: 'bg-yellow-500 hover:bg-yellow-500',
      BAIXA: 'bg-emerald-600 hover:bg-emerald-600',
    };
    return badges[priority as keyof typeof badges] || 'bg-gray-500';
  };

  const clearFilters = () => {
    setFilters({
      cnpj: '',
      requester: '',
      priority: '',
      status: '',
      actType: '',
      technician: '',
      municipality: '',
      validityStart: '',
      validityEnd: '',
    });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <Sidebar collapsible="icon">
          {/* Sidebar Header with Logo */}
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center gap-2 px-2 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 via-teal-600 to-green-700">
                <span className="text-lg font-bold text-white">M</span>
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="text-sm font-semibold">
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
                </span>
                <span className="text-xs text-sidebar-foreground/70">Monitoramento</span>
              </div>
            </div>
          </SidebarHeader>

          {/* Sidebar Content */}
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navegação</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.url)}
                        isActive={item.isActive}
                        tooltip={item.title}
                        className={
                          item.isActive
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white'
                            : ''
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* Sidebar Footer */}
          <SidebarFooter className="border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src="" alt="Usuário" />
                        <AvatarFallback className="rounded-lg bg-emerald-600 text-white">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">Usuário</span>
                        <span className="truncate text-xs text-sidebar-foreground/70">
                          usuario@email.com
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    side="bottom"
                    align="end"
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage src="" alt="Usuário" />
                          <AvatarFallback className="rounded-lg bg-emerald-600 text-white">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">Usuário</span>
                          <span className="truncate text-xs text-muted-foreground">
                            usuario@email.com
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        {/* Main Content Area */}
        <SidebarInset>
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <h1 className="text-lg font-semibold">Licenças e Contratos</h1>
            </div>

            {/* User Avatar Button */}
            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt="Usuário" />
                      <AvatarFallback className="bg-emerald-600 text-white">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Usuário</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        usuario@email.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex flex-1 flex-col gap-6 p-6">
            {/* Search/Filter Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-xl border border-gray-100 bg-white p-6 shadow-md"
            >
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* CNPJ do Requerente */}
                <div className="space-y-2">
                  <Label htmlFor="cnpj" className="text-sm font-medium text-gray-700">
                    CNPJ do Requerente
                  </Label>
                  <Input
                    id="cnpj"
                    placeholder="99.999.999/9999-99"
                    value={filters.cnpj}
                    onChange={(e) => setFilters({ ...filters, cnpj: e.target.value })}
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                {/* Requerente */}
                <div className="space-y-2">
                  <Label htmlFor="requester" className="text-sm font-medium text-gray-700">
                    Requerente
                  </Label>
                  <Input
                    id="requester"
                    placeholder="xxxxxxxxxxxxxxxxxxx"
                    value={filters.requester}
                    onChange={(e) => setFilters({ ...filters, requester: e.target.value })}
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                {/* Tipo do Ato */}
                <div className="space-y-2">
                  <Label htmlFor="actType" className="text-sm font-medium text-gray-700">
                    Tipo do Ato
                  </Label>
                  <Select value={filters.actType} onValueChange={(value) => setFilters({ ...filters, actType: value })}>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recursos-hidricos">Uso de recursos hídricos</SelectItem>
                      <SelectItem value="supressao-vegetal">Supressão vegetal</SelectItem>
                      <SelectItem value="licenciamento">Licenciamento ambiental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Município */}
                <div className="space-y-2">
                  <Label htmlFor="municipality" className="text-sm font-medium text-gray-700">
                    Município
                  </Label>
                  <Select value={filters.municipality} onValueChange={(value) => setFilters({ ...filters, municipality: value })}>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="campo-grande">Campo Grande</SelectItem>
                      <SelectItem value="bonito">Bonito</SelectItem>
                      <SelectItem value="aquidauana">Aquidauana</SelectItem>
                      <SelectItem value="dourados">Dourados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Prioridade */}
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                    Prioridade
                  </Label>
                  <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgente">Urgente</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                    Status
                  </Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Técnico Responsável */}
                <div className="space-y-2">
                  <Label htmlFor="technician" className="text-sm font-medium text-gray-700">
                    Técnico Responsável
                  </Label>
                  <Select value={filters.technician} onValueChange={(value) => setFilters({ ...filters, technician: value })}>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="joao-silva">João Silva</SelectItem>
                      <SelectItem value="maria-santos">Maria Santos</SelectItem>
                      <SelectItem value="pedro-oliveira">Pedro Oliveira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Validade da Licença */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Validade da Licença
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      placeholder="Data de Início"
                      value={filters.validityStart}
                      onChange={(e) => setFilters({ ...filters, validityStart: e.target.value })}
                      className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                    <Input
                      type="date"
                      placeholder="Data Fim"
                      value={filters.validityEnd}
                      onChange={(e) => setFilters({ ...filters, validityEnd: e.target.value })}
                      className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                <Button
                  variant="secondary"
                  className="bg-gray-600 text-white hover:bg-gray-700"
                  onClick={clearFilters}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Gerar Relatório Anual
                </Button>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpar Filtros
                </Button>
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700">
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
                <Button
                  onClick={() => navigate('/create-license')}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Contrato e Licença
                </Button>
              </div>
            </motion.div>

            {/* Table Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-xl border border-gray-100 bg-white shadow-md"
            >
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-emerald-50 hover:bg-emerald-50">
                      <TableHead className="font-medium text-gray-700">CNPJ do Requerente</TableHead>
                      <TableHead className="font-medium text-gray-700">Requerente</TableHead>
                      <TableHead className="font-medium text-gray-700">Ato</TableHead>
                      <TableHead className="font-medium text-gray-700">Município</TableHead>
                      <TableHead className="font-medium text-gray-700">Prioridade</TableHead>
                      <TableHead className="font-medium text-gray-700">Status</TableHead>
                      <TableHead className="text-right font-medium text-gray-700">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenses.map((license, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="text-sm text-gray-600">{license.cnpj}</TableCell>
                        <TableCell className="text-sm text-gray-600">{license.requester}</TableCell>
                        <TableCell className="text-sm text-gray-600">{license.act}</TableCell>
                        <TableCell className="text-sm text-gray-600">{license.municipality}</TableCell>
                        <TableCell>
                          <Badge
                            className={`${getPriorityBadge(license.priority)} text-white text-xs font-medium`}
                          >
                            {license.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-xs font-medium">
                            {license.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Visualizar</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TooltipProvider>

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-6 py-4">
                <div className="text-sm text-gray-600">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} resultados
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {[1, 2, 3, 4, 5, 6, 7, 8].map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={
                        currentPage === page
                          ? 'h-8 w-8 bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'h-8 w-8'
                      }
                    >
                      {page}
                    </Button>
                  ))}

                  <span className="text-sm text-gray-600">...</span>
                  <Button variant="outline" size="sm" className="h-8 w-8">
                    20
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Select value={String(itemsPerPage)}>
                    <SelectTrigger className="h-8 w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 / página</SelectItem>
                      <SelectItem value="20">20 / página</SelectItem>
                      <SelectItem value="50">50 / página</SelectItem>
                    </SelectContent>
                  </Select>

                  <span className="text-sm text-gray-600">Ir para</span>
                  <Input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => setCurrentPage(Number(e.target.value))}
                    className="h-8 w-16 text-center"
                  />
                </div>
              </div>
            </motion.div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Licenses;
