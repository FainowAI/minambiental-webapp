import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { approveUser, rejectUser, getAllUsers } from '@/services/userService';
import {
  Home as HomeIcon,
  FileText,
  Users as UsersIcon,
  LogOut,
  User,
  Eye,
  Edit,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Check,
  XCircle,
  Loader2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Users = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showNoResultsDialog, setShowNoResultsDialog] = useState(false);
  const itemsPerPage = 10;

  // Filter states
  const [filters, setFilters] = useState({
    cpfCnpj: '',
    name: '',
    profile: '',
    status: '',
    statusAprovacao: '',
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
      icon: UsersIcon,
      url: '/users',
      isActive: location.pathname === '/users',
    },
  ];

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logout clicked');
    navigate('/');
  };

  // Load users from database
  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsers();
      setUsers(usersData || []);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle user approval
  const handleApprove = async (userId: string) => {
    try {
      setActionLoading(userId);
      await approveUser(userId);
      toast.success('Usuário aprovado com sucesso!');
      await loadUsers(); // Reload users
    } catch (error) {
      toast.error('Erro ao aprovar usuário');
      console.error('Error approving user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle user rejection
  const handleReject = async (userId: string) => {
    try {
      setActionLoading(userId);
      await rejectUser(userId);
      toast.success('Usuário rejeitado');
      await loadUsers(); // Reload users
    } catch (error) {
      toast.error('Erro ao rejeitar usuário');
      console.error('Error rejecting user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users based on current filters
  const filteredUsers = users.filter((user) => {
    const matchesCpf = !filters.cpfCnpj || 
      user.cpf?.toLowerCase().includes(filters.cpfCnpj.toLowerCase().replace(/[^\d]/g, ''));
    const matchesName = !filters.name || 
      user.nome?.toLowerCase().includes(filters.name.toLowerCase());
    const matchesProfile = !filters.profile || 
      user.perfil?.toLowerCase() === filters.profile.toLowerCase();
    const matchesStatus = !filters.status || 
      user.status?.toLowerCase() === filters.status.toLowerCase();
    const matchesStatusAprovacao = !filters.statusAprovacao || 
      user.status_aprovacao?.toLowerCase() === filters.statusAprovacao.toLowerCase();
    
    return matchesCpf && matchesName && matchesProfile && matchesStatus && matchesStatusAprovacao;
  });

  // Get paginated users
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleClearFilters = () => {
    setFilters({
      cpfCnpj: '',
      name: '',
      profile: '',
      status: '',
      statusAprovacao: '',
    });
    setCurrentPage(1);
  };

  const handleSearch = () => {
    console.log('Search with filters:', filters);
    setCurrentPage(1); // Reset to first page when searching
    
    // Check if search returns no results
    if (filteredUsers.length === 0) {
      setShowNoResultsDialog(true);
    }
  };

  // Format CPF/CNPJ for display
  const formatCpfCnpj = (cpf: string) => {
    if (!cpf) return '';
    const cleaned = cpf.replace(/[^\d]/g, '');
    
    if (cleaned.length === 11) {
      // CPF format: 000.000.000-00
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (cleaned.length === 14) {
      // CNPJ format: 00.000.000/0000-00
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cpf;
  };

  // Format phone number for display
  const formatPhone = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/[^\d]/g, '');
    
    if (cleaned.length === 11) {
      // Format: (00) 00000-0000
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      // Format: (00) 0000-0000
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  return (
    <SidebarProvider>
      <TooltipProvider>
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
                <h1 className="text-lg font-semibold">Usuários</h1>
              </div>

              {/* User Avatar Button (Mobile/Desktop alternative position) */}
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
            <main className="flex flex-1 flex-col gap-6 p-6 md:p-8">
              {/* Search/Filter Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-6">Buscar Usuários</h2>

                {/* Primeira linha: CPF/CNPJ e Nome */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* CPF/CNPJ Field */}
                  <div className="space-y-2">
                    <Label htmlFor="cpfCnpj" className="text-sm font-medium text-gray-700">
                      CPF/CNPJ
                    </Label>
                    <Input
                      id="cpfCnpj"
                      placeholder="99.999.999/9999-99"
                      value={filters.cpfCnpj}
                      onChange={(e) =>
                        setFilters({ ...filters, cpfCnpj: e.target.value })
                      }
                      className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Nome Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Nome
                    </Label>
                    <Input
                      id="name"
                      placeholder="Digite o nome"
                      value={filters.name}
                      onChange={(e) =>
                        setFilters({ ...filters, name: e.target.value })
                      }
                      className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Segunda linha: Perfil, Status e Status Aprovação */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Perfil Select */}
                  <div className="space-y-2">
                    <Label htmlFor="profile" className="text-sm font-medium text-gray-700">
                      Perfil
                    </Label>
                    <Select
                      value={filters.profile}
                      onValueChange={(value) =>
                        setFilters({ ...filters, profile: value })
                      }
                    >
                      <SelectTrigger
                        id="profile"
                        className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      >
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corpo técnico">Corpo Técnico</SelectItem>
                        <SelectItem value="técnico">Técnico</SelectItem>
                        <SelectItem value="requerente">Requerente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Select */}
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                      Status
                    </Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) =>
                        setFilters({ ...filters, status: value })
                      }
                    >
                      <SelectTrigger
                        id="status"
                        className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      >
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Aprovação Select */}
                  <div className="space-y-2">
                    <Label htmlFor="statusAprovacao" className="text-sm font-medium text-gray-700">
                      Status Aprovação
                    </Label>
                    <Select
                      value={filters.statusAprovacao}
                      onValueChange={(value) =>
                        setFilters({ ...filters, statusAprovacao: value })
                      }
                    >
                      <SelectTrigger
                        id="statusAprovacao"
                        className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      >
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="aprovado">Aprovado</SelectItem>
                        <SelectItem value="rejeitado">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  <Button
                    onClick={() => navigate('/create-user')}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar Usuário
                  </Button>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleClearFilters}
                      variant="outline"
                      className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Limpar Filtros
                    </Button>
                    <Button
                      onClick={handleSearch}
                      className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Buscar
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Table Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-emerald-50 hover:bg-emerald-50">
                        <TableHead className="text-gray-700 font-medium">CPF/CNPJ</TableHead>
                        <TableHead className="text-gray-700 font-medium">Nome</TableHead>
                        <TableHead className="text-gray-700 font-medium">Email</TableHead>
                        <TableHead className="text-gray-700 font-medium">Celular</TableHead>
                        <TableHead className="text-gray-700 font-medium">Perfil</TableHead>
                        <TableHead className="text-gray-700 font-medium">Status</TableHead>
                        <TableHead className="text-gray-700 font-medium">Status Aprovação</TableHead>
                        <TableHead className="text-gray-700 font-medium text-right">
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                            <p className="text-gray-600">Carregando usuários...</p>
                          </TableCell>
                        </TableRow>
                      ) : paginatedUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <p className="text-gray-600">Nenhum usuário encontrado</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedUsers.map((user, index) => (
                        <TableRow
                            key={user.id || index}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="font-medium text-gray-800">
                            {formatCpfCnpj(user.cpf)}
                          </TableCell>
                            <TableCell className="text-gray-600">{user.nome}</TableCell>
                          <TableCell className="text-gray-600">{user.email}</TableCell>
                            <TableCell className="text-gray-600">{formatPhone(user.celular)}</TableCell>
                            <TableCell className="text-gray-600">{user.perfil}</TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
                                {user.status || 'Ativo'}
                            </Badge>
                          </TableCell>
                            <TableCell>
                              {user.status_aprovacao ? (
                                <Badge
                                  className={`${
                                    user.status_aprovacao === 'Aprovado'
                                      ? 'bg-green-600 hover:bg-green-600'
                                      : user.status_aprovacao === 'Pendente'
                                      ? 'bg-yellow-500 hover:bg-yellow-500'
                                      : 'bg-red-600 hover:bg-red-600'
                                  } text-white`}
                                >
                                  {user.status_aprovacao}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                {/* Approval buttons for Corpo Técnico with pending status */}
                                {(user.perfil === 'Corpo Técnico' || user.perfil === 'corpo_tecnico') && user.status_aprovacao === 'Pendente' && (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => user.auth_user_id ? handleApprove(user.auth_user_id) : toast.error('Usuário sem auth_user_id')}
                                          disabled={actionLoading === user.id || !user.auth_user_id}
                                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                          {actionLoading === user.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Check className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{user.auth_user_id ? 'Aprovar usuário' : 'Usuário sem auth_user_id - não pode ser aprovado'}</p>
                                      </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => user.auth_user_id ? handleReject(user.auth_user_id) : toast.error('Usuário sem auth_user_id')}
                                          disabled={actionLoading === user.id || !user.auth_user_id}
                                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                          {actionLoading === user.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <XCircle className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{user.auth_user_id ? 'Rejeitar usuário' : 'Usuário sem auth_user_id - não pode ser rejeitado'}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </>
                                )}

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      navigate(`/view-user/${user.id}`);
                                    }}
                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hover:scale-110 transition-all duration-200"
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
                                    onClick={() => navigate(`/edit-user/${user.id}`)}
                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hover:scale-110 transition-all duration-200"
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
                </div>

                {/* Pagination */}
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Results info */}
                    <div className="text-sm text-gray-600">
                      Mostrando {(currentPage - 1) * itemsPerPage + 1}-
                      {Math.min(currentPage * itemsPerPage, filteredUsers.length)} de {filteredUsers.length}{' '}
                      resultados
                    </div>

                    {/* Pagination controls */}
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="h-9 w-9 border-gray-300"
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
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'border-gray-300 text-gray-700'
                          }
                        >
                          {page}
                        </Button>
                      ))}

                      <span className="text-gray-500">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(20)}
                        className="border-gray-300 text-gray-700"
                      >
                        20
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="h-9 w-9 border-gray-300"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>

                      <Select value={String(itemsPerPage)}>
                        <SelectTrigger className="w-[130px] h-9 border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 / página</SelectItem>
                          <SelectItem value="20">20 / página</SelectItem>
                          <SelectItem value="50">50 / página</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Ir para</span>
                        <Input
                          type="number"
                          min="1"
                          max={totalPages}
                          value={currentPage}
                          onChange={(e) => {
                            const page = Number(e.target.value);
                            if (page >= 1 && page <= totalPages) {
                              setCurrentPage(page);
                            }
                          }}
                          className="w-16 h-9 text-center border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </main>
          </SidebarInset>
        </div>

        {/* No Results Dialog */}
        <AlertDialog open={showNoResultsDialog} onOpenChange={setShowNoResultsDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Nenhum registro encontrado</AlertDialogTitle>
              <AlertDialogDescription>
                Nenhum registro foi encontrado para a busca realizada. Tente ajustar os filtros de busca.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowNoResultsDialog(false)}>
                Ok
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>
    </SidebarProvider>
  );
};

export default Users;
