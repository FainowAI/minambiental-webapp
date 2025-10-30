import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getLicenses, LicenseFilters, LicenseData } from '@/services/licenseService';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
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
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter state
  const [filters, setFilters] = useState<LicenseFilters>({
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

  // Fetch licenses data
  const { data: licensesData, isLoading, isError, refetch } = useQuery({
    queryKey: ['licenses', filters, currentPage, itemsPerPage],
    queryFn: () => getLicenses(filters, currentPage, itemsPerPage),
    staleTime: 30000, // 30 seconds
  });

  const licenses = licensesData?.data || [];
  const totalItems = licensesData?.count || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

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

  const updateFilter = (key: keyof LicenseFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
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
    setCurrentPage(1);
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
                    onChange={(e) => updateFilter('cnpj', e.target.value)}
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
                    placeholder="Digite o nome"
                    value={filters.requester}
                    onChange={(e) => updateFilter('requester', e.target.value)}
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                {/* Tipo do Ato */}
                <div className="space-y-2">
                  <Label htmlFor="actType" className="text-sm font-medium text-gray-700">
                    Tipo do Ato
                  </Label>
                  <Select value={filters.actType} onValueChange={(value) => updateFilter('actType', value)}>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Uso de recursos hídricos">Uso de recursos hídricos</SelectItem>
                      <SelectItem value="Licenciamento ambiental">Licenciamento ambiental</SelectItem>
                      <SelectItem value="Outorga">Outorga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Município */}
                <div className="space-y-2">
                  <Label htmlFor="municipality" className="text-sm font-medium text-gray-700">
                    Município
                  </Label>
                  <Input
                    id="municipality"
                    placeholder="Digite o município"
                    value={filters.municipality}
                    onChange={(e) => updateFilter('municipality', e.target.value)}
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                {/* Prioridade */}
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                    Prioridade
                  </Label>
                  <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="URGENTE">Urgente</SelectItem>
                      <SelectItem value="ALTA">Alta</SelectItem>
                      <SelectItem value="MÉDIA">Média</SelectItem>
                      <SelectItem value="BAIXA">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                    Status
                  </Label>
                  <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Vencido">Vencido</SelectItem>
                      <SelectItem value="Em análise">Em análise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Técnico Responsável */}
                <div className="space-y-2">
                  <Label htmlFor="technician" className="text-sm font-medium text-gray-700">
                    Técnico Responsável
                  </Label>
                  <Input
                    id="technician"
                    placeholder="Em desenvolvimento"
                    value={filters.technician}
                    onChange={(e) => updateFilter('technician', e.target.value)}
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    disabled
                  />
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
                      onChange={(e) => updateFilter('validityStart', e.target.value)}
                      className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                    <Input
                      type="date"
                      placeholder="Data Fim"
                      value={filters.validityEnd}
                      onChange={(e) => updateFilter('validityEnd', e.target.value)}
                      className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                <Button
                  variant="outline"
                  className="h-11 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                  onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Gerar Relatório Mensal
                </Button>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="h-11 border-gray-300 hover:bg-gray-50"
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpar Filtros
                </Button>
                <Button
                  onClick={() => navigate('/create-license')}
                  className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Licença e Contrato
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
                    {isLoading ? (
                      Array.from({ length: itemsPerPage }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                        </TableRow>
                      ))
                    ) : isError ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-red-500">
                          Erro ao carregar licenças. Por favor, tente novamente.
                        </TableCell>
                      </TableRow>
                    ) : licenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Nenhuma licença encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      licenses.map((license: LicenseData) => (
                        <TableRow key={license.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {license.requerente?.cpf_cnpj || '-'}
                          </TableCell>
                          <TableCell>{license.requerente?.nome_razao_social || '-'}</TableCell>
                          <TableCell>{license.tipo_ato}</TableCell>
                          <TableCell>{license.municipio}</TableCell>
                          <TableCell>
                            <Badge className={`${getPriorityBadge(license.prioridade)} text-white`}>
                              {license.prioridade}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={license.status === 'Ativo' ? 'default' : 'secondary'}>
                              {license.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
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
                                    onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                                    className="h-8 w-8 text-blue-600 hover:text-blue-700"
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </TooltipProvider>

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-6 py-4">
                <div className="text-sm text-gray-600">
                  {totalItems > 0 ? (
                    <>
                      Mostrando {(currentPage - 1) * itemsPerPage + 1}-
                      {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} resultados
                    </>
                  ) : (
                    'Nenhum resultado encontrado'
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select 
                    value={String(itemsPerPage)} 
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9 w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 itens</SelectItem>
                      <SelectItem value="20">20 itens</SelectItem>
                      <SelectItem value="50">50 itens</SelectItem>
                      <SelectItem value="100">100 itens</SelectItem>
                    </SelectContent>
                  </Select>

                  <span className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages || 1}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || isLoading || totalPages === 0}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
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
