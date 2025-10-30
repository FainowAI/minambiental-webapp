import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { getUserById, toggleUserStatus, hasActiveContracts } from '@/services/userService';
import { maskCPFOrCNPJ, maskPhone } from '@/utils/masks';
import {
  Home as HomeIcon,
  FileText,
  Users,
  LogOut,
  User,
  ArrowLeft,
  Loader2,
  Edit,
  X as XIcon,
  Check,
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Type for user data
interface UserData {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  celular: string;
  perfil: 'Corpo Técnico' | 'Requerente' | 'Técnico';
  status: string;
  // Campos de contato para medição (Requerente)
  contato_medicao_cpf?: string;
  contato_medicao_email?: string;
  contato_medicao_celular?: string;
}

const ViewUser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showConfirmInactivateDialog, setShowConfirmInactivateDialog] = useState(false);
  const [showConfirmActivateDialog, setShowConfirmActivateDialog] = useState(false);
  const [showBlockedDialog, setShowBlockedDialog] = useState(false);

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
      isActive: location.pathname === '/users' || location.pathname.startsWith('/view-user'),
    },
  ];

  const handleLogout = () => {
    console.log('Logout clicked');
    navigate('/');
  };

  const handleBack = () => {
    navigate('/users');
  };

  const handleEdit = () => {
    navigate(`/edit-user/${id}`);
  };

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      if (!id) {
        toast.error('ID do usuário não fornecido');
        navigate('/users');
        return;
      }

      try {
        setLoading(true);
        const user = await getUserById(id);
        const userAny = user as any;
        setUserData({
          ...user,
          perfil: user.perfil as 'Corpo Técnico' | 'Requerente' | 'Técnico',
          contato_medicao_cpf: userAny.contato_medicao_cpf,
          contato_medicao_email: userAny.contato_medicao_email,
          contato_medicao_celular: userAny.contato_medicao_celular,
        });
      } catch (error) {
        toast.error('Erro ao carregar dados do usuário');
        console.error('Error loading user:', error);
        navigate('/users');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id, navigate]);

  const handleToggleStatusClick = async () => {
    if (!userData) return;

    // CA 01 (Inativação): Permitir inativação apenas se estiver ativo
    if (userData.status === 'Ativo') {
      // CA 03 (Inativação): Verificar se é Requerente com contratos ativos
      if (userData.perfil === 'Requerente') {
        const hasContracts = await hasActiveContracts(id!);
        if (hasContracts) {
          setShowBlockedDialog(true);
          return;
        }
      }

      // CA 02 (Inativação): Mostrar dialog de confirmação para inativação
      setShowConfirmInactivateDialog(true);
    } else {
      // CA 01 (Ativação): Permitir ativação apenas se estiver inativo
      // CA 02 (Ativação): Mostrar dialog de confirmação para ativação
      setShowConfirmActivateDialog(true);
    }
  };

  const handleConfirmInactivate = async () => {
    if (!userData) return;

    try {
      setToggling(true);
      setShowConfirmInactivateDialog(false);

      await toggleUserStatus(id!, userData.status);

      // Update local state - CA 03 (Inativação)
      setUserData({
        ...userData,
        status: 'Inativo',
      });

      // CA 02 (Inativação): Mensagem de sucesso
      toast.success('Perfil inativado com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar status do usuário');
      console.error('Error toggling status:', error);
    } finally {
      setToggling(false);
    }
  };

  const handleConfirmActivate = async () => {
    if (!userData) return;

    try {
      setToggling(true);
      setShowConfirmActivateDialog(false);

      await toggleUserStatus(id!, userData.status);

      // Update local state - CA 03 (Ativação)
      setUserData({
        ...userData,
        status: 'Ativo',
      });

      // CA 02 (Ativação): Mensagem de sucesso
      toast.success('Perfil ativado com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar status do usuário');
      console.error('Error toggling status:', error);
    } finally {
      setToggling(false);
    }
  };

  if (loading || !userData) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
            <p className="text-gray-600">Carregando dados do usuário...</p>
          </div>
        </div>
      </SidebarProvider>
    );
  }

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
          {/* Header with Breadcrumb */}
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 flex-1">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      onClick={() => navigate('/users')}
                      className="cursor-pointer hover:text-emerald-600"
                    >
                      Usuários
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Visualizar Usuário</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
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
          <main className="flex flex-1 flex-col gap-6 p-6 md:p-8">
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="ghost"
                onClick={() => navigate('/users')}
                className="text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Usuários
              </Button>
            </motion.div>

            {/* Form Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
            >
              {/* Card Header */}
              <div className="border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 md:px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                      Visualizar Usuário
                    </h1>
                    <p className="text-sm md:text-base text-gray-600 mt-2">
                      Informações detalhadas do usuário
                    </p>
                  </div>

                  {/* Toggle Status Button */}
                  <Button
                    onClick={handleToggleStatusClick}
                    disabled={toggling}
                    className={`${
                      userData.status === 'Ativo'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    } text-white h-10 px-4 font-medium shadow-md hover:shadow-lg transition-all duration-200`}
                  >
                    {toggling ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Atualizando...
                      </>
                    ) : userData.status === 'Ativo' ? (
                      <>
                        <XIcon className="w-4 h-4 mr-2" />
                        Inativar
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Ativar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Form Content */}
              <div className="px-6 md:px-8 py-8">
                <div className="max-w-2xl mx-auto">
                  {/* Form Section Header */}
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">
                      Usuário
                    </h2>
                  </div>

                  {/* Form Fields - Read Only */}
                  <div className="space-y-6">
                    {/* Perfil Field */}
                    <div className="space-y-2">
                      <Label htmlFor="perfil" className="text-sm font-medium text-gray-700">
                        Perfil <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="perfil"
                        type="text"
                        value={userData.perfil}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* Nome Field */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Nome <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={userData.nome}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* CPF Field */}
                    <div className="space-y-2">
                      <Label htmlFor="cpf" className="text-sm font-medium text-gray-700">
                        CPF <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="cpf"
                        type="text"
                        value={maskCPFOrCNPJ(userData.cpf)}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* Email Field */}
                    {userData.perfil !== 'Requerente' && (
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={userData.email}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>
                    )}

                    {/* Celular Field */}
                    {userData.perfil !== 'Requerente' && (
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          Celular
                        </Label>
                        <Input
                          id="phone"
                          type="text"
                          value={maskPhone(userData.celular || '')}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>
                    )}
                  </div>

                  {/* Seção de Contato para Medição - Apenas para Requerente */}
                  {userData.perfil === 'Requerente' && (
                    <>
                      {/* Divider */}
                      <Separator className="my-8" />
                      
                      {/* Section Header */}
                      <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-1">
                          Contato para medição de Hidrômetro e Horímetro
                        </h2>
                      </div>

                      {/* CPF do Contato */}
                      <div className="space-y-2">
                        <Label htmlFor="contato_medicao_cpf" className="text-sm font-medium text-gray-700">
                          CPF
                        </Label>
                        <Input
                          id="contato_medicao_cpf"
                          type="text"
                          value={maskCPFOrCNPJ(userData.contato_medicao_cpf || '')}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      {/* Email do Contato */}
                      <div className="space-y-2">
                        <Label htmlFor="contato_medicao_email" className="text-sm font-medium text-gray-700">
                          Email
                        </Label>
                        <Input
                          id="contato_medicao_email"
                          type="email"
                          value={userData.contato_medicao_email || ''}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      {/* Celular do Contato */}
                      <div className="space-y-2">
                        <Label htmlFor="contato_medicao_celular" className="text-sm font-medium text-gray-700">
                          Celular
                        </Label>
                        <Input
                          id="contato_medicao_celular"
                          type="text"
                          value={maskPhone(userData.contato_medicao_celular || '')}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      onClick={handleBack}
                      variant="outline"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 h-11 px-6 font-medium"
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleEdit}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-11 px-6 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </main>
        </SidebarInset>
      </div>

      {/* Confirmation Dialog for Inactivation - CA 02 (Inativação) */}
      <AlertDialog open={showConfirmInactivateDialog} onOpenChange={setShowConfirmInactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Inativação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja inativar este usuário?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmInactivate}
              className="bg-red-600 hover:bg-red-700"
            >
              Sim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Activation - CA 02 (Ativação) */}
      <AlertDialog open={showConfirmActivateDialog} onOpenChange={setShowConfirmActivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Ativação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja ativar este usuário?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmActivate}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Sim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Blocked Dialog - CA 03 (Inativação) */}
      <AlertDialog open={showBlockedDialog} onOpenChange={setShowBlockedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativação Bloqueada</AlertDialogTitle>
            <AlertDialogDescription>
              Não é possível inativar o Requerente, pois existe um contrato ativo vinculado a ele.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowBlockedDialog(false)}>
              Ok
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default ViewUser;
