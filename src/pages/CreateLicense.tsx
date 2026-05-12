import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useFormAutosave } from '@/hooks/useFormAutosave';
import { useUnsavedChangesPrompt } from '@/hooks/useUnsavedChangesPrompt';
import {
  Home as HomeIcon,
  FileText,
  Users,
  LogOut,
  User,
  X,
  Save,
  ArrowLeft,
  Upload,
  CheckCircle2,
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
import { maskCPFOrCNPJ, maskDMS, maskDecimalTwoPlaces } from '@/utils/masks';
import { validateCPFOrCNPJ, validateDMS, validatePdfFile, validateEmail, validatePhone } from '@/utils/validators';
import {
  createLicense,
  getRefTiposAto,
  getRefFinalidadesUso,
  getRefMunicipiosMs,
  getRefSistemasAquiferos,
  getRefUnidadesPlanejamento,
} from '@/services/licenseService';
import { findRequerenteByCpfCnpj } from '@/services/requerenteService';
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
  cpfCnpj: string;
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
}

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const CreateLicense = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Lookups (ref_*) — alimentam os <Select>
  const { data: tiposAto = [] } = useQuery({
    queryKey: ['ref_tipos_ato'],
    queryFn: getRefTiposAto,
  });
  const { data: finalidadesUso = [] } = useQuery({
    queryKey: ['ref_finalidades_uso'],
    queryFn: getRefFinalidadesUso,
  });
  const { data: municipios = [] } = useQuery({
    queryKey: ['ref_municipios_ms'],
    queryFn: getRefMunicipiosMs,
  });
  const { data: sistemasAquiferos = [] } = useQuery({
    queryKey: ['ref_sistemas_aquiferos'],
    queryFn: getRefSistemasAquiferos,
  });
  const { data: unidadesPlanejamento = [] } = useQuery({
    queryKey: ['ref_unidades_planejamento'],
    queryFn: getRefUnidadesPlanejamento,
  });

  const [formData, setFormData] = useState<LicenseFormData>({
    licenseNumber: '',
    cpfCnpj: '',
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
  });

  const [fileName, setFileName] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requesterEmail, setRequesterEmail] = useState<string>('');
  const [requesterPhone, setRequesterPhone] = useState<string>('');

  // Estado do Requerente (lookup por CPF/CNPJ)
  const [existingRequerenteId, setExistingRequerenteId] = useState<string | null>(null);
  const [requerenteFound, setRequerenteFound] = useState<boolean>(false);
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);

  // Ref para saber se o usuário editou manualmente a data fim
  const manuallyEditedDataFimRef = useRef<boolean>(false);

  // Autosave hook
  const autosaveKey = 'create_license_draft';
  const { restoreDraft, clearDraft } = useFormAutosave(autosaveKey, formData, {
    enabled: true,
    debounceMs: 400,
  });

  // Função para verificar se há alterações
  const isDirty = () => {
    return (
      formData.licenseNumber.trim() !== '' ||
      formData.cpfCnpj.trim() !== '' ||
      formData.act.trim() !== '' ||
      formData.actObject.trim() !== '' ||
      formData.municipality.trim() !== '' ||
      formData.validityStart.trim() !== '' ||
      formData.validityEnd.trim() !== '' ||
      formData.pdfFile !== null
    );
  };

  // Aviso de alterações não salvas
  useUnsavedChangesPrompt({
    when: isDirty(),
    message: 'Você tem alterações não salvas. Deseja realmente sair?',
  });

  // Restaurar rascunho ao montar componente
  useEffect(() => {
    const draft = restoreDraft();
    if (draft) {
      setFormData({ ...draft, pdfFile: null }); // Arquivo não pode ser restaurado
      if (draft.pdfFile) {
        toast({
          title: 'Rascunho restaurado',
          description: 'Atenção: você precisará selecionar o arquivo PDF novamente.',
        });
      } else {
        toast({
          title: 'Rascunho restaurado',
          description: 'Continue de onde parou.',
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-calcular data_fim = data_inicio + 10 anos (CA09) salvo se o usuário editou manualmente
  useEffect(() => {
    if (formData.validityStart && !manuallyEditedDataFimRef.current) {
      const start = new Date(formData.validityStart);
      if (!Number.isNaN(start.getTime())) {
        const end = new Date(start);
        end.setFullYear(end.getFullYear() + 10);
        const iso = end.toISOString().slice(0, 10);
        setFormData((prev) => (prev.validityEnd === iso ? prev : { ...prev, validityEnd: iso }));
      }
    }
  }, [formData.validityStart]);

  // Lookup do Requerente por CPF/CNPJ — com debounce
  useEffect(() => {
    const digits = onlyDigits(formData.cpfCnpj);
    if (digits.length !== 11 && digits.length !== 14) {
      setRequerenteFound(false);
      setExistingRequerenteId(null);
      return;
    }
    const { valid } = validateCPFOrCNPJ(digits);
    if (!valid) {
      setRequerenteFound(false);
      setExistingRequerenteId(null);
      return;
    }

    let cancelled = false;
    setIsLookingUp(true);
    const handle = setTimeout(async () => {
      try {
        const row = await findRequerenteByCpfCnpj(digits);
        if (cancelled) return;
        if (row) {
          setExistingRequerenteId(row.id);
          setRequerenteFound(true);
          setFormData((prev) => ({
            ...prev,
            requesterName: row.nome_razao_social ?? prev.requesterName,
          }));
          setRequesterEmail(row.email ?? '');
          setRequesterPhone(row.celular ?? '');
        } else {
          setExistingRequerenteId(null);
          setRequerenteFound(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Erro ao buscar Requerente:', err);
        }
      } finally {
        if (!cancelled) setIsLookingUp(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(handle);
      setIsLookingUp(false);
    };
  }, [formData.cpfCnpj]);

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
    clearDraft();
    navigate('/licenses');
  };

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!formData.licenseNumber.trim()) newErrors.licenseNumber = 'Campo obrigatório';

    const cpfCnpjDigits = onlyDigits(formData.cpfCnpj);
    if (!cpfCnpjDigits) {
      newErrors.cpfCnpj = 'Campo obrigatório';
    } else {
      const { valid } = validateCPFOrCNPJ(cpfCnpjDigits);
      if (!valid) newErrors.cpfCnpj = 'CPF/CNPJ inválido';
    }

    if (!formData.requesterName.trim()) newErrors.requesterName = 'Campo obrigatório';
    if (!formData.act) newErrors.act = 'Campo obrigatório';
    if (!formData.actObject.trim()) newErrors.actObject = 'Campo obrigatório';
    if (!formData.useFinality) newErrors.useFinality = 'Campo obrigatório';
    if (!formData.municipality) newErrors.municipality = 'Campo obrigatório';
    if (!formData.state.trim()) newErrors.state = 'Campo obrigatório';
    if (!formData.validityStart) newErrors.validityStart = 'Campo obrigatório';
    if (!formData.validityEnd) newErrors.validityEnd = 'Campo obrigatório';

    if (formData.validityStart && formData.validityEnd) {
      if (new Date(formData.validityEnd) <= new Date(formData.validityStart)) {
        newErrors.validityEnd = 'A data fim deve ser posterior à data de início';
      }
    }

    if (formData.latitude && !validateDMS(formData.latitude)) {
      newErrors.latitude = 'Formato DMS inválido';
    }
    if (formData.longitude && !validateDMS(formData.longitude)) {
      newErrors.longitude = 'Formato DMS inválido';
    }

    if (requesterEmail && !validateEmail(requesterEmail)) {
      newErrors.requesterEmail = 'E-mail inválido';
    }
    if (requesterPhone && !validatePhone(requesterPhone)) {
      newErrors.requesterPhone = 'Celular inválido';
    }

    if (!formData.pdfFile) {
      newErrors.pdfFile = 'Arquivo PDF obrigatório';
    } else if (!validatePdfFile(formData.pdfFile)) {
      newErrors.pdfFile = 'Apenas arquivos PDF são aceitos';
    }

    return newErrors;
  };

  const handleSave = async () => {
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: 'Verifique os campos',
        description: 'Preencha corretamente todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setErrors({});

    toast({
      title: 'Salvando licença...',
      description: 'Enviando dados e arquivo PDF. Aguarde.',
    });

    try {
      const cpfCnpjDigits = onlyDigits(formData.cpfCnpj);

      await createLicense({
        numeroLicenca: formData.licenseNumber,
        cnpj: cpfCnpjDigits,
        nomeRazaoSocial: formData.requesterName,
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
        pdfFile: formData.pdfFile as File,
      });

      clearDraft();
      toast({
        title: 'Licença cadastrada com sucesso!',
        description: 'A licença foi salva e o PDF foi enviado.',
      });

      setTimeout(() => {
        navigate('/licenses');
      }, 1500);
    } catch (error: any) {
      const errorMessage =
        error?.message || 'Ocorreu um erro ao salvar a licença. Tente novamente.';

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

    // Máscaras
    if (field === 'cpfCnpj' && typeof value === 'string') {
      value = maskCPFOrCNPJ(value);
    }
    if ((field === 'latitude' || field === 'longitude') && typeof value === 'string') {
      value = maskDMS(value);
    }
    if (field === 'annualVolume' && typeof value === 'string') {
      value = maskDecimalTwoPlaces(value);
    }

    // Detecta edição manual da data fim
    if (field === 'validityEnd') {
      manuallyEditedDataFimRef.current = true;
    }
    // Mudar a data início "destrava" o auto-cálculo (volta a sincronizar)
    if (field === 'validityStart') {
      manuallyEditedDataFimRef.current = false;
    }

    setFormData((prev) => ({ ...prev, [field]: value as any }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validatePdfFile(file)) {
        setErrors((e) => ({ ...e, pdfFile: 'Apenas arquivos PDF são aceitos' }));
        return;
      }
      setFileName(file.name);
      updateFormField('pdfFile', file);
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

                    {/* CPF/CNPJ do Requerente */}
                    <div className="space-y-2">
                      <Label htmlFor="cpfCnpj" className="text-sm font-medium text-gray-700">
                        CPF/CNPJ do Requerente <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="cpfCnpj"
                          placeholder="000.000.000-00 ou 00.000.000/0000-00"
                          value={formData.cpfCnpj}
                          onChange={(e) => updateFormField('cpfCnpj', e.target.value)}
                          className="h-11 border-gray-300 pr-9 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                        {isLookingUp && (
                          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                        )}
                        {!isLookingUp && requerenteFound && (
                          <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                        )}
                      </div>
                      {errors.cpfCnpj && <p className="text-xs text-red-600">{errors.cpfCnpj}</p>}
                    </div>

                    {/* Nome do Requerente */}
                    <div className="space-y-2">
                      <Label htmlFor="requesterName" className="text-sm font-medium text-gray-700">
                        Nome/Razão Social do Requerente <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="requesterName"
                        placeholder="Nome ou Razão Social"
                        value={formData.requesterName}
                        onChange={(e) => updateFormField('requesterName', e.target.value)}
                        readOnly={requerenteFound}
                        className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${requerenteFound ? 'bg-gray-50' : ''}`}
                      />
                      {requerenteFound && (
                        <p className="text-xs text-emerald-700">Requerente já cadastrado</p>
                      )}
                      {errors.requesterName && <p className="text-xs text-red-600">{errors.requesterName}</p>}
                    </div>

                    {/* Ato (Tipo de Ato) — lookup */}
                    <div className="space-y-2">
                      <Label htmlFor="act" className="text-sm font-medium text-gray-700">
                        Tipo de Ato <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.act} onValueChange={(value) => updateFormField('act', value)}>
                        <SelectTrigger className="h-11 border-gray-300">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposAto.map((t) => (
                            <SelectItem key={t.codigo} value={t.nome}>{t.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.act && <p className="text-xs text-red-600">{errors.act}</p>}
                    </div>

                    {/* Objeto de Ato (texto livre) */}
                    <div className="space-y-2">
                      <Label htmlFor="actObject" className="text-sm font-medium text-gray-700">
                        Objeto de Ato <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="actObject"
                        placeholder="Ex.: Recursos Hídricos"
                        value={formData.actObject}
                        onChange={(e) => updateFormField('actObject', e.target.value)}
                        className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                      {errors.actObject && <p className="text-xs text-red-600">{errors.actObject}</p>}
                    </div>

                    {/* Tipo de Ponto de Interferência (texto livre) */}
                    <div className="space-y-2">
                      <Label htmlFor="interferenceType" className="text-sm font-medium text-gray-700">
                        Tipo de Ponto de Interferência
                      </Label>
                      <Input
                        id="interferenceType"
                        placeholder="Ex.: Captação Subterrânea"
                        value={formData.interferenceType}
                        onChange={(e) => updateFormField('interferenceType', e.target.value)}
                        className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                      {errors.interferenceType && <p className="text-xs text-red-600">{errors.interferenceType}</p>}
                    </div>

                    {/* Finalidade de Uso — lookup */}
                    <div className="space-y-2">
                      <Label htmlFor="useFinality" className="text-sm font-medium text-gray-700">
                        Finalidade de Uso <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.useFinality} onValueChange={(value) => updateFormField('useFinality', value)}>
                        <SelectTrigger className="h-11 border-gray-300">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {finalidadesUso.map((f) => (
                            <SelectItem key={f.codigo} value={f.nome}>{f.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.useFinality && <p className="text-xs text-red-600">{errors.useFinality}</p>}
                    </div>

                    {/* Município — lookup */}
                    <div className="space-y-2">
                      <Label htmlFor="municipality" className="text-sm font-medium text-gray-700">
                        Município <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.municipality} onValueChange={(value) => updateFormField('municipality', value)}>
                        <SelectTrigger className="h-11 border-gray-300">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {municipios.map((m) => (
                            <SelectItem key={m.codigo} value={m.nome}>{m.nome}</SelectItem>
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

                    {/* Unidade de Planejamento e Gerenciamento — lookup */}
                    <div className="space-y-2">
                      <Label htmlFor="planningUnit" className="text-sm font-medium text-gray-700">
                        Unidade de Planejamento e Gerenciamento
                      </Label>
                      <Select value={formData.planningUnit} onValueChange={(value) => updateFormField('planningUnit', value)}>
                        <SelectTrigger className="h-11 border-gray-300">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {unidadesPlanejamento.map((u) => (
                            <SelectItem key={u.codigo} value={u.nome}>{u.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.planningUnit && <p className="text-xs text-red-600">{errors.planningUnit}</p>}
                    </div>

                    {/* Sistema Aquífero — lookup */}
                    <div className="space-y-2">
                      <Label htmlFor="aquiferSystem" className="text-sm font-medium text-gray-700">
                        Sistema Aquífero
                      </Label>
                      <Select value={formData.aquiferSystem} onValueChange={(value) => updateFormField('aquiferSystem', value)}>
                        <SelectTrigger className="h-11 border-gray-300">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {sistemasAquiferos.map((s) => (
                            <SelectItem key={s.codigo} value={s.nome}>{s.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.aquiferSystem && <p className="text-xs text-red-600">{errors.aquiferSystem}</p>}
                    </div>

                    {/* Latitude */}
                    <div className="space-y-2">
                      <Label htmlFor="latitude" className="text-sm font-medium text-gray-700">
                        Latitude
                      </Label>
                      <Input
                        id="latitude"
                        placeholder="-20° 00’ 00.00"
                        value={formData.latitude}
                        onChange={(e) => updateFormField('latitude', e.target.value)}
                        className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                      {errors.latitude && <p className="text-xs text-red-600">{errors.latitude}</p>}
                    </div>

                    {/* Longitude */}
                    <div className="space-y-2">
                      <Label htmlFor="longitude" className="text-sm font-medium text-gray-700">
                        Longitude
                      </Label>
                      <Input
                        id="longitude"
                        placeholder="-54° 00’ 00.00"
                        value={formData.longitude}
                        onChange={(e) => updateFormField('longitude', e.target.value)}
                        className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                      {errors.longitude && <p className="text-xs text-red-600">{errors.longitude}</p>}
                    </div>

                    {/* Volume Anual Captado */}
                    <div className="space-y-2">
                      <Label htmlFor="annualVolume" className="text-sm font-medium text-gray-700">
                        Volume Anual Captado (m³)
                      </Label>
                      <Input
                        id="annualVolume"
                        placeholder="0,00"
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
                      </div>
                      <p className="text-xs text-gray-500">Data fim calculada automaticamente como início + 10 anos. Você pode editá-la.</p>
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
