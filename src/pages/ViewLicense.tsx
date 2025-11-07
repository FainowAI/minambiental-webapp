import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home as HomeIcon,
  FileText,
  Users,
  LogOut,
  User,
  ArrowLeft,
  Edit,
  ExternalLink,
  Loader2,
  Plus,
  Eye,
  Pencil,
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { maskCNPJ, maskDecimalTwoPlaces, decimalToDMS } from '@/utils/masks';
import { getLicenseById } from '@/services/licenseService';
import { getContractsByLicenseId } from '@/services/contractService';
import { useToast } from '@/hooks/use-toast';

interface LicenseData {
  id: string;
  numero_licenca: string;
  tipo_ato: string;
  objeto_ato: string | null;
  tipo_ponto_interferencia: string | null;
  finalidade_uso: string | null;
  municipio: string;
  estado: string;
  unidade_planejamento: string | null;
  sistema_aquifero: string | null;
  latitude: number | null;
  longitude: number | null;
  volume_anual_captado: number | null;
  data_inicio: string;
  data_fim: string;
  status: string;
  pdf_licenca: string | null;
  requerente: {
    cpf_cnpj: string;
    nome_razao_social: string;
  } | null;
}

const ViewLicense = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);

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
      isActive: location.pathname === '/licenses' || location.pathname.startsWith('/view-license'),
    },
    {
      title: 'Usuários',
      icon: Users,
      url: '/users',
      isActive: location.pathname === '/users',
    },
  ];

  // Query to fetch contracts for this license
  const {
    data: contracts = [],
    isLoading: isLoadingContracts,
    error: contractsError,
  } = useQuery({
    queryKey: ['contracts', id],
    queryFn: () => getContractsByLicenseId(id!),
    enabled: !!id, // Only run query if id exists
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Load license data
  useEffect(() => {
    const loadLicense = async () => {
      if (!id) {
        toast({
          title: 'Erro',
          description: 'ID da licença não fornecido',
          variant: 'destructive',
        });
        navigate('/licenses');
        return;
      }

      try {
        setIsLoading(true);
        const license = await getLicenseById(id);

        if (!license) {
          toast({
            title: 'Licença não encontrada',
            description: 'A licença que você está tentando visualizar não existe.',
            variant: 'destructive',
          });
          navigate('/licenses');
          return;
        }

        setLicenseData(license);
      } catch (error) {
        console.error('Error loading license:', error);
        toast({
          title: 'Erro ao carregar licença',
          description: 'Não foi possível carregar os dados da licença.',
          variant: 'destructive',
        });
        navigate('/licenses');
      } finally {
        setIsLoading(false);
      }
    };

    loadLicense();
  }, [id, navigate, toast]);

  const handleLogout = () => {
    console.log('Logout clicked');
    navigate('/');
  };

  const handleBack = () => {
    navigate('/licenses');
  };

  const handleEdit = () => {
    navigate(`/edit-license/${id}`);
  };

  const handleViewPDF = () => {
    if (licenseData?.pdf_licenca) {
      window.open(licenseData.pdf_licenca, '_blank');
    } else {
      toast({
        title: 'PDF não disponível',
        description: 'Esta licença não possui um PDF cadastrado.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ativa':
      case 'ativo':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'vencida':
      case 'vencido':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar collapsible="icon">
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

          <SidebarInset>
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        onClick={() => navigate('/licenses')}
                        className="cursor-pointer hover:text-emerald-600"
                      >
                        Licenças e Contratos
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Visualizar Licença</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>

            <main className="flex flex-1 flex-col gap-6 p-6">
              <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-md">
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
                    <p className="text-gray-600">Carregando dados da licença...</p>
                  </div>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (!licenseData) {
    return null;
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
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      onClick={() => navigate('/licenses')}
                      className="cursor-pointer hover:text-emerald-600"
                    >
                      Licenças e Contratos
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Visualizar Licença</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex flex-1 flex-col gap-6 p-6">
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="ghost"
                onClick={handleBack}
                className="gap-2 text-emerald-600 hover:text-emerald-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Licenças
              </Button>
            </motion.div>

            {/* Form Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-xl border border-gray-100 bg-white shadow-md"
            >
              {/* Header */}
              <div className="rounded-t-xl bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 md:text-3xl">
                      Visualizar Licença
                    </h2>
                    <p className="mt-2 text-gray-600">
                      Informações detalhadas da licença ambiental
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {licenseData.pdf_licenca && (
                      <Button
                        onClick={handleViewPDF}
                        variant="outline"
                        className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Visualizar PDF
                      </Button>
                    )}
                    <Button
                      onClick={() => navigate(`/create-contract/${id}`)}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Cadastrar Contrato
                    </Button>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6 md:p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Licença</h3>
                  <p className="text-sm text-gray-600">Informações da licença ambiental</p>
                </div>

                <div className="space-y-6">
                  {/* Grid de 4 colunas */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* Número da Licença */}
                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber" className="text-sm font-medium text-gray-700">
                        Número da Licença
                      </Label>
                      <Input
                        id="licenseNumber"
                        value={licenseData.numero_licenca || ''}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* CNPJ do Requerente */}
                    <div className="space-y-2">
                      <Label htmlFor="cnpj" className="text-sm font-medium text-gray-700">
                        CNPJ do Requerente
                      </Label>
                      <Input
                        id="cnpj"
                        value={maskCNPJ(licenseData.requerente?.cpf_cnpj || '')}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* Nome do Requerente */}
                    <div className="space-y-2">
                      <Label htmlFor="requesterName" className="text-sm font-medium text-gray-700">
                        Nome do Requerente
                      </Label>
                      <Input
                        id="requesterName"
                        value={licenseData.requerente?.nome_razao_social || ''}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                        Status
                      </Label>
                      <div className="flex items-center h-11">
                        <Badge className={`${getStatusBadgeColor(licenseData.status)} px-3 py-1.5 text-sm font-medium`}>
                          {licenseData.status || 'N/A'}
                        </Badge>
                      </div>
                    </div>

                    {/* Tipo de Ato */}
                    <div className="space-y-2">
                      <Label htmlFor="act" className="text-sm font-medium text-gray-700">
                        Tipo de Ato
                      </Label>
                      <Input
                        id="act"
                        value={licenseData.tipo_ato || ''}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* Objeto do Ato */}
                    <div className="space-y-2">
                      <Label htmlFor="actObject" className="text-sm font-medium text-gray-700">
                        Objeto do Ato
                      </Label>
                      <Input
                        id="actObject"
                        value={licenseData.objeto_ato || ''}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* Tipo de Ponto de Interferência */}
                    <div className="space-y-2">
                      <Label htmlFor="interferenceType" className="text-sm font-medium text-gray-700">
                        Tipo de Ponto de Interferência
                      </Label>
                      <Input
                        id="interferenceType"
                        value={licenseData.tipo_ponto_interferencia || ''}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* Finalidade de Uso */}
                    <div className="space-y-2">
                      <Label htmlFor="useFinality" className="text-sm font-medium text-gray-700">
                        Finalidade de Uso
                      </Label>
                      <Input
                        id="useFinality"
                        value={licenseData.finalidade_uso || ''}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* Município */}
                    <div className="space-y-2">
                      <Label htmlFor="municipality" className="text-sm font-medium text-gray-700">
                        Município
                      </Label>
                      <Input
                        id="municipality"
                        value={licenseData.municipio || ''}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* Estado */}
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                        Estado
                      </Label>
                      <Input
                        id="state"
                        value={licenseData.estado === 'MS' ? 'Mato Grosso do Sul' : licenseData.estado}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* Unidade de Planejamento e Gerenciamento */}
                    <div className="space-y-2">
                      <Label htmlFor="planningUnit" className="text-sm font-medium text-gray-700">
                        Unidade de Planejamento e Gerenciamento
                      </Label>
                      <Input
                        id="planningUnit"
                        value={licenseData.unidade_planejamento || ''}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* Sistema Aquífero */}
                    <div className="space-y-2">
                      <Label htmlFor="aquiferSystem" className="text-sm font-medium text-gray-700">
                        Sistema Aquífero
                      </Label>
                      <Input
                        id="aquiferSystem"
                        value={licenseData.sistema_aquifero || ''}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* Latitude */}
                    <div className="space-y-2">
                      <Label htmlFor="latitude" className="text-sm font-medium text-gray-700">
                        Latitude
                      </Label>
                      <Input
                        id="latitude"
                        value={licenseData.latitude ? decimalToDMS(licenseData.latitude, 'lat') : ''}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* Longitude */}
                    <div className="space-y-2">
                      <Label htmlFor="longitude" className="text-sm font-medium text-gray-700">
                        Longitude
                      </Label>
                      <Input
                        id="longitude"
                        value={licenseData.longitude ? decimalToDMS(licenseData.longitude, 'lon') : ''}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* Volume Anual Captado */}
                    <div className="space-y-2">
                      <Label htmlFor="annualVolume" className="text-sm font-medium text-gray-700">
                        Volume Anual Captado (m³)
                      </Label>
                      <Input
                        id="annualVolume"
                        value={
                          licenseData.volume_anual_captado
                            ? maskDecimalTwoPlaces(licenseData.volume_anual_captado.toString())
                            : ''
                        }
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* Data de Início da Validade */}
                    <div className="space-y-2">
                      <Label htmlFor="validityStart" className="text-sm font-medium text-gray-700">
                        Data de Início da Validade
                      </Label>
                      <Input
                        id="validityStart"
                        value={formatDate(licenseData.data_inicio)}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* Data de Fim da Validade */}
                    <div className="space-y-2">
                      <Label htmlFor="validityEnd" className="text-sm font-medium text-gray-700">
                        Data de Fim da Validade
                      </Label>
                      <Input
                        id="validityEnd"
                        value={formatDate(licenseData.data_fim)}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    {/* PDF da Licença */}
                    <div className="space-y-2">
                      <Label htmlFor="pdfFile" className="text-sm font-medium text-gray-700">
                        PDF da Licença
                      </Label>
                      <Input
                        id="pdfFile"
                        value={
                          licenseData.pdf_licenca
                            ? licenseData.pdf_licenca.split('/').pop() || 'PDF disponível'
                            : 'Sem PDF cadastrado'
                        }
                        disabled
                        className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Contratos Vinculados Section */}
                  <Separator className="my-8" />

                  <div>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">Contratos Vinculados</h3>
                      <p className="text-sm text-gray-600">
                        Lista de contratos associados a esta licença
                      </p>
                    </div>

                    {isLoadingContracts ? (
                      <div className="space-y-3">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : contracts.length === 0 ? (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-gray-600 font-medium mb-1">
                          Nenhum contrato vinculado
                        </p>
                        <p className="text-sm text-gray-500">
                          Clique em "Cadastrar Contrato" para vincular um novo contrato a esta
                          licença.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold">Número do Contrato</TableHead>
                              <TableHead className="font-semibold">Celebrado em</TableHead>
                              <TableHead className="font-semibold">Valor</TableHead>
                              <TableHead className="font-semibold">Data Início</TableHead>
                              <TableHead className="font-semibold">Previsão Término</TableHead>
                              <TableHead className="font-semibold">Status</TableHead>
                              <TableHead className="font-semibold text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contracts.map((contract: any) => (
                              <TableRow key={contract.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium">
                                  {contract.numero || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {contract.celebrado_em
                                    ? formatDate(contract.celebrado_em)
                                    : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {contract.valor
                                    ? new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                      }).format(contract.valor)
                                    : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {contract.data_inicio
                                    ? formatDate(contract.data_inicio)
                                    : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {contract.previsao_termino
                                    ? formatDate(contract.previsao_termino)
                                    : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      contract.status === 'Ativo'
                                        ? 'bg-green-100 text-green-800 border-green-300'
                                        : 'bg-gray-100 text-gray-800 border-gray-300'
                                    }
                                  >
                                    {contract.status || 'N/A'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                      onClick={() => navigate(`/view-contract/${id}/${contract.id}`)}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Visualizar
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                                      onClick={() => navigate(`/edit-contract/${id}/${contract.id}`)}
                                      title="Editar contrato"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 mt-8">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="min-w-[120px] bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleEdit}
                      className="min-w-[120px] bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ViewLicense;
