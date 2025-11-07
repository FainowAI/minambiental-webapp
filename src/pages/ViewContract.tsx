import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home as HomeIcon,
  FileText,
  Users,
  LogOut,
  User,
  ArrowLeft,
  Edit,
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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getContractById, mapContractDataToFormValues, type ContractFormValues } from '@/services/contractService';
import { getLicenseById } from '@/services/licenseService';
import { maskCPF, maskPhone, maskCurrency, maskCEP } from '@/utils/masks';

interface LicenseData {
  id: string;
  numero_licenca: string;
}

const ViewContract = () => {
  const navigate = useNavigate();
  const { licenseId, contractId } = useParams<{ licenseId: string; contractId: string }>();
  const { toast } = useToast();

  const [contractData, setContractData] = useState<ContractFormValues | null>(null);
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);
  const [isLoadingContract, setIsLoadingContract] = useState(true);
  const [isLoadingLicense, setIsLoadingLicense] = useState(true);

  // Fetch contract data
  useEffect(() => {
    const fetchContract = async () => {
      if (!contractId) {
        console.log('ViewContract: contractId is missing');
        return;
      }

      console.log('ViewContract: Fetching contract with ID:', contractId);

      try {
        setIsLoadingContract(true);
        const contract = await getContractById(contractId);
        console.log('ViewContract: Contract fetched:', contract);
        const formValues = mapContractDataToFormValues(contract);
        console.log('ViewContract: Form values mapped:', formValues);
        setContractData(formValues);
      } catch (error) {
        console.error('ViewContract: Error fetching contract:', error);
        toast({
          title: 'Erro ao carregar contrato',
          description: 'Não foi possível carregar os dados do contrato.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingContract(false);
      }
    };

    fetchContract();
  }, [contractId, toast]);

  // Fetch license data
  useEffect(() => {
    const fetchLicense = async () => {
      if (!licenseId) {
        console.log('ViewContract: licenseId is missing');
        return;
      }

      console.log('ViewContract: Fetching license with ID:', licenseId);

      try {
        setIsLoadingLicense(true);
        const license = await getLicenseById(licenseId);
        console.log('ViewContract: License fetched:', license);
        setLicenseData(license);
      } catch (error) {
        console.error('ViewContract: Error fetching license:', error);
      } finally {
        setIsLoadingLicense(false);
      }
    };

    fetchLicense();
  }, [licenseId]);

  const handleSignOut = () => {
    navigate('/');
  };

  const handleEditContract = () => {
    navigate(`/edit-contract/${licenseId}/${contractId}`);
  };

  const isLoading = isLoadingContract || isLoadingLicense;

  console.log('ViewContract render:', {
    isLoading,
    isLoadingContract,
    isLoadingLicense,
    contractData: contractData ? 'exists' : 'null',
    licenseData: licenseData ? 'exists' : 'null',
    contractId,
    licenseId,
  });

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-screen">
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-3 px-4 py-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">MinaAmbiental</h2>
                  <p className="text-xs text-gray-500">Sistema de Gestão</p>
                </div>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2">
                  Menu Principal
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => navigate('/home')}>
                        <HomeIcon className="h-4 w-4" />
                        <span>Início</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => navigate('/licenses')}>
                        <FileText className="h-4 w-4" />
                        <span>Licenças e Contratos</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => navigate('/users')}>
                        <Users className="h-4 w-4" />
                        <span>Usuários</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton className="w-full">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs">
                            U
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start text-left flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900 truncate w-full">
                            Usuário
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>

          <SidebarInset className="flex-1 overflow-auto">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-white px-6">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2 flex-1">
                <Skeleton className="h-4 w-[300px]" />
              </div>
            </header>

            <div className="p-8">
              <div className="max-w-7xl mx-auto">
                <Skeleton className="h-10 w-48 mb-6" />
                <Skeleton className="h-[600px] w-full rounded-xl" />
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (!contractData) {
    console.log('ViewContract: Returning "Contrato não encontrado" because contractData is null');
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Contrato não encontrado</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-3 px-4 py-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">MinaAmbiental</h2>
                <p className="text-xs text-gray-500">Sistema de Gestão</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2">
                Menu Principal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => navigate('/home')}>
                      <HomeIcon className="h-4 w-4" />
                      <span>Início</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => navigate('/licenses')}>
                      <FileText className="h-4 w-4" />
                      <span>Licenças e Contratos</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => navigate('/users')}>
                      <Users className="h-4 w-4" />
                      <span>Usuários</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="w-full">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs">
                          U
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start text-left flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate w-full">
                          Usuário
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-white px-6">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => navigate('/home')} className="cursor-pointer hover:text-emerald-600">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => navigate('/licenses')} className="cursor-pointer hover:text-emerald-600">
                    Licenças e Contratos
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => navigate(`/view-license/${licenseId}`)}
                    className="cursor-pointer hover:text-emerald-600"
                  >
                    Visualizar Licença
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-emerald-600 font-medium">Visualizar Contrato</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-8"
          >
            <div className="max-w-7xl mx-auto">
              {/* Back Button */}
              <Button
                variant="ghost"
                onClick={() => navigate(`/view-license/${licenseId}`)}
                className="mb-6 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Licença
              </Button>

              {/* Contract Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header with gradient */}
                <div className="rounded-t-xl bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100 px-8 py-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Visualizar Contrato
                      </h1>
                      <p className="text-sm text-gray-600">
                        Licença: {licenseData?.numero_licenca || 'Carregando...'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Contrato Nº: {contractData.numero}
                      </p>
                    </div>
                    <Button
                      onClick={handleEditContract}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>

                {/* Contract Details */}
                <div className="p-8 space-y-8">
                  {/* Section 1: Dados do Contrato */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-emerald-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Dados do Contrato</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Número do Contrato *</Label>
                        <Input
                          value={contractData.numero}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Celebrado Em *</Label>
                        <Input
                          value={contractData.celebradoEm}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Valor *</Label>
                        <Input
                          value={maskCurrency(contractData.valor)}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Tipo de Contratante *</Label>
                        <Input
                          value={contractData.tipoContratante}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Vínculo ART</Label>
                        <Input
                          value={contractData.vinculoArt || 'Não informado'}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Ação Institucional</Label>
                        <Input
                          value={contractData.acaoInstitucional || 'Não informado'}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <h3 className="text-lg font-semibold text-gray-900">Endereço do Contrato</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">CEP *</Label>
                        <Input
                          value={maskCEP(contractData.cepContrato)}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-medium text-gray-700">Rua *</Label>
                        <Input
                          value={contractData.ruaContrato}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Bairro *</Label>
                        <Input
                          value={contractData.bairroContrato}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Número *</Label>
                        <Input
                          value={contractData.numeroContrato}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Cidade *</Label>
                        <Input
                          value={contractData.cidadeContrato}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Estado *</Label>
                        <Input
                          value={contractData.estadoContrato}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">País *</Label>
                        <Input
                          value={contractData.paisContrato}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Section 2: Dados da Obra/Serviço */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-emerald-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Dados da Obra/Serviço</h2>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900">Endereço da Obra</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">CEP *</Label>
                        <Input
                          value={maskCEP(contractData.cepObra)}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-medium text-gray-700">Rua *</Label>
                        <Input
                          value={contractData.ruaObra}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Bairro *</Label>
                        <Input
                          value={contractData.bairroObra}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Número *</Label>
                        <Input
                          value={contractData.numeroObra}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Cidade *</Label>
                        <Input
                          value={contractData.cidadeObra}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Estado *</Label>
                        <Input
                          value={contractData.estadoObra}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">País *</Label>
                        <Input
                          value={contractData.paisObra}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <h3 className="text-lg font-semibold text-gray-900">Informações da Obra</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Coordenadas *</Label>
                        <Input
                          value={contractData.coordenadas}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Data de Início *</Label>
                        <Input
                          value={contractData.dataInicio}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Previsão de Término *</Label>
                        <Input
                          value={contractData.previsaoTermino}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Código</Label>
                        <Input
                          value={contractData.codigo || 'Não informado'}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-medium text-gray-700">Finalidade *</Label>
                        <Input
                          value={contractData.finalidade}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Section 3: Contato para Medição */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-emerald-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Contato para Medição de Hidrômetro e Horímetro</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">CPF *</Label>
                        <Input
                          value={maskCPF(contractData.cpfContato)}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Nome *</Label>
                        <Input
                          value={contractData.nomeContato}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Telefone *</Label>
                        <Input
                          value={maskPhone(contractData.telefoneContato)}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Período de Medição - Início *</Label>
                        <Input
                          value={contractData.periodoMedicaoInicio}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Período de Medição - Fim *</Label>
                        <Input
                          value={contractData.periodoMedicaoFim}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Section 4: Técnico Responsável */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-emerald-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Técnico Responsável</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">CPF *</Label>
                        <Input
                          value={maskCPF(contractData.cpfTecnico)}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Nome *</Label>
                        <Input
                          value={contractData.nomeTecnico}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">RNP *</Label>
                        <Input
                          value={contractData.rnp}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Título Profissional *</Label>
                        <Input
                          value={contractData.tituloProfissional}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Registro Empresa Contratada *</Label>
                        <Input
                          value={contractData.registroEmpresaContratada || 'Não informado'}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Registro *</Label>
                        <Input
                          value={contractData.registro || 'Não informado'}
                          disabled
                          className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Section 5: Observações */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-emerald-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Observações</h2>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Observações</Label>
                      <Textarea
                        value={contractData.observacao || 'Nenhuma observação registrada'}
                        disabled
                        className="min-h-[100px] bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed resize-none"
                      />
                    </div>
                  </div>

                </div>

                {/* Footer with action buttons */}
                <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/view-license/${licenseId}`)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ViewContract;
