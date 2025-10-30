import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home as HomeIcon,
  FileText,
  Users,
  LogOut,
  User,
  X,
  Save,
  ArrowLeft,
  Search,
  Upload,
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
import { maskCNPJ, maskDMS, maskDecimalTwoPlaces } from '@/utils/masks';
import { validateCNPJ, validateDMS, validatePdfFile } from '@/utils/validators';
import { createLicense, getUsuarioByCNPJ } from '@/services/licenseService';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LicenseFormData {
  licenseNumber: string;
  cnpj: string;
  requesterName: string;
  act: string;
  actObject: string;
  interferenceType: string;
  useFinality: string;
  municipality: string;
  state: string;
  planningUnit: string;
  aquiferSystem: string;
  latitude: string;
  longitude: string;
  annualVolume: string;
  validityStart: string;
  validityEnd: string;
  pdfFile: File | null;
  priority: string;
}

const CreateLicense = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState<LicenseFormData>({
    licenseNumber: '',
    cnpj: '',
    requesterName: '',
    act: '',
    actObject: '',
    interferenceType: '',
    useFinality: '',
    municipality: '',
    state: 'MS',
    planningUnit: '',
    aquiferSystem: '',
    latitude: '',
    longitude: '',
    annualVolume: '',
    validityStart: '',
    validityEnd: '',
    pdfFile: null,
    priority: '',
  });

  const [fileName, setFileName] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Municípios de Mato Grosso do Sul (CA 08)
  const MS_MUNICIPIOS = [
    'Água Clara','Alcinópolis','Amambai','Anastácio','Anaurilândia','Angélica','Antônio João','Aparecida do Taboado','Aquidauana','Aral Moreira','Bandeirantes','Bataguassu','Bataiporã','Bela Vista','Bodoquena','Bonito','Brasilândia','Caarapó','Camapuã','Campo Grande','Caracol','Cassilândia','Chapadão do Sul','Corguinho','Coronel Sapucaia','Corumbá','Costa Rica','Coxim','Deodápolis','Dois Irmãos do Buriti','Douradina','Dourados','Eldorado','Fátima do Sul','Figueirão','Glória de Dourados','Guia Lopes da Laguna','Iguatemi','Inocência','Itaporã','Itaquiraí','Ivinhema','Japorã','Jaraguari','Jardim','Jateí','Juti','Ladário','Laguna Carapã','Maracaju','Miranda','Mundo Novo','Naviraí','Nioaque','Nova Alvorada do Sul','Nova Andradina','Novo Horizonte do Sul','Paranaíba','Paranhos','Pedro Gomes','Ponta Porã','Porto Murtinho','Ribas do Rio Pardo','Rio Brilhante','Rio Negro','Rio Verde de Mato Grosso','Rochedo','Santa Rita do Pardo','São Gabriel do Oeste','Selvíria','Sete Quedas','Sidrolândia','Sonora','Tacuru','Taquarussu','Terenos','Três Lagoas','Vicentina'
  ];

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
      isActive: location.pathname === '/licenses' || location.pathname === '/create-license',
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

  const handleCancel = () => {
    navigate('/licenses');
  };

  const handleSave = async () => {
    // Validações básicas
    const newErrors: Record<string, string> = {};
    if (!formData.licenseNumber) newErrors.licenseNumber = 'Campo obrigatório';
    if (!formData.cnpj || !validateCNPJ(formData.cnpj)) newErrors.cnpj = 'CNPJ inválido';
    if (!formData.act) newErrors.act = 'Campo obrigatório';
    if (!formData.actObject) newErrors.actObject = 'Campo obrigatório';
    if (!formData.municipality) newErrors.municipality = 'Campo obrigatório';
    if (!formData.validityStart) newErrors.validityStart = 'Campo obrigatório';
    if (!formData.validityEnd) newErrors.validityEnd = 'Campo obrigatório';
    if (!formData.pdfFile) newErrors.pdfFile = 'Arquivo PDF obrigatório';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos marcados com *',
        variant: 'destructive'
      });
      return;
    }

    // Estado de loading
    const loadingToastId = toast({
      title: 'Salvando licença...',
      description: 'Enviando dados e arquivo PDF. Aguarde.',
      duration: Infinity,
    });

    try {
      const payload: any = {
        numeroLicenca: formData.licenseNumber,
        cnpj: formData.cnpj,
        tipoAto: formData.act,
        objetoAto: formData.actObject,
        tipoPontoInterferencia: formData.interferenceType,
        finalidadeUso: formData.useFinality,
        municipio: formData.municipality,
        estado: formData.state,
        unidadePlanejamento: formData.planningUnit,
        sistemaAquifero: formData.aquiferSystem,
        latitudeDms: formData.latitude,
        longitudeDms: formData.longitude,
        volumeAnual: formData.annualVolume,
        dataInicio: formData.validityStart,
        dataFim: formData.validityEnd,
        prioridadeUi: formData.priority as 'urgente' | 'alta' | 'media' | 'baixa',
        pdfFile: formData.pdfFile,
      };

      await createLicense(payload);

      // Sucesso
      toast({
        title: 'Licença cadastrada com sucesso!',
        description: 'A licença foi salva e o PDF foi enviado.',
      });

      // Redirecionar após 1.5s
      setTimeout(() => {
        navigate('/licenses');
      }, 1500);

    } catch (error: any) {
      // Tratamento de erros específicos
      let errorMessage = 'Ocorreu um erro ao salvar a licença. Tente novamente.';
      
      if (error.message?.includes('Requerente não encontrado')) {
        errorMessage = 'CNPJ não encontrado. Cadastre o requerente antes de criar a licença.';
      } else if (error.message?.includes('upload')) {
        errorMessage = 'Erro ao fazer upload do PDF. Verifique o arquivo e tente novamente.';
      } else if (error.message?.includes('criar licença')) {
        errorMessage = 'Erro ao salvar os dados da licença no banco de dados.';
      }

      toast({
        title: 'Erro ao salvar',
        description: errorMessage,
        variant: 'destructive',
      });

      console.error('Error saving license:', error);
    }
  };

  const updateFormField = (field: keyof LicenseFormData, value: string | File | null) => {
    setErrors((e) => ({ ...e, [field as string]: '' }));
    // Máscaras e efeitos colaterais
    if (field === 'cnpj' && typeof value === 'string') {
      value = maskCNPJ(value);
    }
    if ((field === 'latitude' || field === 'longitude') && typeof value === 'string') {
      value = maskDMS(value);
    }
    if (field === 'annualVolume' && typeof value === 'string') {
      value = maskDecimalTwoPlaces(value);
    }
    if (field === 'validityStart' && typeof value === 'string' && value) {
      const start = new Date(value);
      const end = new Date(start);
      end.setFullYear(start.getFullYear() + 10); // CA09
      setFormData((prev) => ({ ...prev, validityStart: value, validityEnd: end.toISOString().slice(0, 10) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      updateFormField('pdfFile', file);
    }
  };

  const handleLookupRequester = async () => {
    if (!formData.cnpj || !validateCNPJ(formData.cnpj)) {
      setErrors((e) => ({ ...e, cnpj: 'dos os municípios do Estado de Mato Grosso do Sul' }));
      toast({ title: 'CNPJ inválido', description: 'Verifique o CNPJ informado.', variant: 'destructive' });
      return;
    }
  try {
    const usuario = await getUsuarioByCNPJ(formData.cnpj);
    if (!usuario) {
      toast({ title: 'Usuário não encontrado', description: 'Cadastre o usuário antes de prosseguir.', variant: 'destructive' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      requesterName: usuario.nome || prev.requesterName,
    }));
    toast({ title: 'Usuário localizado', description: 'Nome preenchido automaticamente.' });
  } catch (err) {
    toast({ title: 'Erro ao buscar usuário', description: 'Tente novamente mais tarde.', variant: 'destructive' });
  }
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
                    <BreadcrumbPage>Cadastrar Licença e Contrato</BreadcrumbPage>
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
                onClick={() => navigate('/licenses')}
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
                <h2 className="text-2xl font-bold text-gray-800 md:text-3xl">
                  Cadastrar Licença e Contrato
                </h2>
                <p className="mt-2 text-gray-600">
                  Preencha os dados da nova licença ambiental
                </p>
              </div>

              {/* Form Content */}
              <div className="p-6 md:p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Licença</h3>
                  <p className="text-sm text-gray-600">Informações da licença ambiental</p>
                </div>

                <form className="space-y-6">
                  {/* Grid de 4 colunas */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* Número da Licença */}
                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber" className="text-sm font-medium text-gray-700">
                        Número da Licença <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="licenseNumber"
                        placeholder="0000/AAAA"
                        value={formData.licenseNumber}
                        onChange={(e) => updateFormField('licenseNumber', e.target.value)}
                        className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                      {errors.licenseNumber && <p className="text-xs text-red-600">{errors.licenseNumber}</p>}
                    </div>
                    {/* CNPJ do Requerente */}
                    <div className="space-y-2">
                      <Label htmlFor="cnpj" className="text-sm font-medium text-gray-700">
                        CNPJ do Requerente <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="cnpj"
                          placeholder="99.999.999/9999-99"
                          value={formData.cnpj}
                          onChange={(e) => updateFormField('cnpj', e.target.value)}
                          className="h-11 flex-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                        {errors.cnpj && <p className="text-xs text-red-600">{errors.cnpj}</p>}
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 shrink-0"
                          onClick={handleLookupRequester}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Nome do Requerente */}
                    <div className="space-y-2">
                      <Label htmlFor="requesterName" className="text-sm font-medium text-gray-700">
                        Nome do Requerente <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="requesterName"
                        placeholder="xxxxxxxxxxxxxxxxxxx"
                        value={formData.requesterName}
                        onChange={(e) => updateFormField('requesterName', e.target.value)}
                        className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                      {errors.requesterName && <p className="text-xs text-red-600">{errors.requesterName}</p>}
                    </div>

                    {/* Ato */}
                    <div className="space-y-2">
                      <Label htmlFor="act" className="text-sm font-medium text-gray-700">
                        Ato <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.act} onValueChange={(value) => updateFormField('act', value)}>
                        <SelectTrigger className="h-11 border-gray-300">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Outorga de Direito de Uso de Recursos Hídricos">Outorga de Direito de Uso de Recursos Hídricos</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.act && <p className="text-xs text-red-600">{errors.act}</p>}
                    </div>

                    {/* Objeto de Ato */}
                    <div className="space-y-2">
                      <Label htmlFor="actObject" className="text-sm font-medium text-gray-700">
                        Objeto de Ato <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.actObject} onValueChange={(value) => updateFormField('actObject', value)}>
                        <SelectTrigger className="h-11 border-gray-300">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Recursos Hídricos">Recursos Hídricos</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.actObject && <p className="text-xs text-red-600">{errors.actObject}</p>}
                    </div>

                    {/* Tipo de Ponto de Interferência */}
                    <div className="space-y-2">
                      <Label htmlFor="interferenceType" className="text-sm font-medium text-gray-700">
                        Tipo de Ponto de Interferência <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.interferenceType} onValueChange={(value) => updateFormField('interferenceType', value)}>
                        <SelectTrigger className="h-11 border-gray-300">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Captação Subterrânea">Captação Subterrânea</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.interferenceType && <p className="text-xs text-red-600">{errors.interferenceType}</p>}
                    </div>

                    {/* Finalidade de Uso */}
                    <div className="space-y-2">
                      <Label htmlFor="useFinality" className="text-sm font-medium text-gray-700">
                        Finalidade de Uso <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.useFinality} onValueChange={(value) => updateFormField('useFinality', value)}>
                        <SelectTrigger className="h-11 border-gray-300">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Outras Finalidades de Uso">Outras Finalidades de Uso</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.useFinality && <p className="text-xs text-red-600">{errors.useFinality}</p>}
                    </div>

                    {/* Município */}
                    <div className="space-y-2">
                      <Label htmlFor="municipality" className="text-sm font-medium text-gray-700">
                        Município
                      </Label>
                      <Select value={formData.municipality} onValueChange={(value) => updateFormField('municipality', value)}>
                        <SelectTrigger className="h-11 border-gray-300">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {MS_MUNICIPIOS.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.municipality && <p className="text-xs text-red-600">{errors.municipality}</p>}
                    </div>

                    {/* Estado */}
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                        Estado <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.state} onValueChange={(value) => updateFormField('state', value)}>
                        <SelectTrigger className="h-11 border-gray-300">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.state && <p className="text-xs text-red-600">{errors.state}</p>}
                    </div>

                    {/* Unidade de Planejamento e Gerenciamento */}
                    <div className="space-y-2">
                      <Label htmlFor="planningUnit" className="text-sm font-medium text-gray-700">
                        Unidade de Planejamento e Gerenciamento <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.planningUnit} onValueChange={(value) => updateFormField('planningUnit', value)}>
                        <SelectTrigger className="h-11 border-gray-300">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PARDO-XXXXX">PARDO, xxxxx</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.planningUnit && <p className="text-xs text-red-600">{errors.planningUnit}</p>}
                    </div>

                    {/* Sistema Aquífero */}
                    <div className="space-y-2">
                      <Label htmlFor="aquiferSystem" className="text-sm font-medium text-gray-700">
                        Sistema Aquífero <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.aquiferSystem} onValueChange={(value) => updateFormField('aquiferSystem', value)}>
                        <SelectTrigger className="h-11 border-gray-300">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Serra Geral">Serra Geral</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.aquiferSystem && <p className="text-xs text-red-600">{errors.aquiferSystem}</p>}
                    </div>

                    {/* Latitude */}
                    <div className="space-y-2">
                      <Label htmlFor="latitude" className="text-sm font-medium text-gray-700">
                        Latitude <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="latitude"
                        placeholder="-20°xx xx.xx"
                        value={formData.latitude}
                        onChange={(e) => updateFormField('latitude', e.target.value)}
                        className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                      {errors.latitude && <p className="text-xs text-red-600">{errors.latitude}</p>}
                    </div>

                    {/* Longitude */}
                    <div className="space-y-2">
                      <Label htmlFor="longitude" className="text-sm font-medium text-gray-700">
                        Longitude <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="longitude"
                        placeholder="-54°xx xx.xx"
                        value={formData.longitude}
                        onChange={(e) => updateFormField('longitude', e.target.value)}
                        className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                      {errors.longitude && <p className="text-xs text-red-600">{errors.longitude}</p>}
                    </div>

                    {/* Volume Anual Captado */}
                    <div className="space-y-2">
                      <Label htmlFor="annualVolume" className="text-sm font-medium text-gray-700">
                        Volume Anual Captado (m³) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="annualVolume"
                        placeholder="0"
                        value={formData.annualVolume}
                        onChange={(e) => updateFormField('annualVolume', e.target.value)}
                        className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                      {errors.annualVolume && <p className="text-xs text-red-600">{errors.annualVolume}</p>}
                    </div>

                    {/* Validade da Licença */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Validade da Licença <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          placeholder="Data Inicial"
                          value={formData.validityStart}
                          onChange={(e) => updateFormField('validityStart', e.target.value)}
                          className="h-11 flex-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                        <Input
                          type="date"
                          placeholder="Data Fim"
                          value={formData.validityEnd}
                          onChange={(e) => updateFormField('validityEnd', e.target.value)}
                          className="h-11 flex-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                        {/* CA09: usuário pode editar a data final */}
                      </div>
                      {(errors.validityStart || errors.validityEnd) && (
                        <p className="text-xs text-red-600">{errors.validityStart || errors.validityEnd}</p>
                      )}
                    </div>

                    {/* PDF da Licença */}
                    <div className="space-y-2">
                      <Label htmlFor="pdfFile" className="text-sm font-medium text-gray-700">
                        PDF da Licença <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Selecionar Arquivo"
                          value={fileName}
                          readOnly
                          className="h-11 flex-1 border-gray-300 bg-gray-50"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Selecione
                        </Button>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>
                      <p className="text-xs text-gray-500">Apenas arquivos PDF são aceitos</p>
                      {errors.pdfFile && <p className="text-xs text-red-600">{errors.pdfFile}</p>}
                    </div>

                    {/* Prioridade */}
                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                        Prioridade <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.priority} onValueChange={(value) => updateFormField('priority', value)}>
                        <SelectTrigger className="h-11 border-gray-300">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgente">Urgente</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="baixa">Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.priority && <p className="text-xs text-red-600">{errors.priority}</p>}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      className="min-w-[120px]"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSave}
                      className="min-w-[120px] bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Salvar
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CreateLicense;
