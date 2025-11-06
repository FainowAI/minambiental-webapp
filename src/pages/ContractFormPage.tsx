import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
  Loader2,
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { maskCEP, maskCPF, maskCurrency, maskPhone, removeMask, unmaskCurrency } from '@/utils/masks';
import { validateCEP, validateCPF, validatePhone, validateContractDates } from '@/utils/validators';
import { getLicenseById } from '@/services/licenseService';
import {
  createContract,
  getContractById,
  mapContractDataToFormValues,
  ContractFormValues,
  updateContract,
  updateRequerenteContatoMedicao,
  type CreateContractPayload,
} from '@/services/contractService';
import { lookupCEP } from '@/services/cepService';
import { getUserById } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';

type ContractFormMode = 'create' | 'edit';

interface ContractFormPageProps {
  mode: ContractFormMode;
}

const createDefaultFormData = (): ContractFormValues => ({
  numero: '',
  celebradoEm: '',
  valor: '',
  tipoContratante: '',
  vinculoArt: '',
  acaoInstitucional: '',

  cepContrato: '',
  ruaContrato: '',
  bairroContrato: '',
  numeroContrato: '',
  cidadeContrato: '',
  estadoContrato: '',
  paisContrato: 'Brasil',

  cepObra: '',
  ruaObra: '',
  bairroObra: '',
  numeroObra: '',
  cidadeObra: '',
  estadoObra: '',
  paisObra: 'Brasil',
  coordenadas: '',
  dataInicio: '',
  previsaoTermino: '',
  codigo: '',
  finalidade: 'OUTRO - OUTRO - MONITORAMENTO DE OUTORGA SUBTERRÂNEA',

  cpfContato: '',
  nomeContato: '',
  telefoneContato: '',
  periodoMedicaoInicio: '',
  periodoMedicaoFim: '',

  cpfTecnico: '',
  nomeTecnico: '',
  rnp: '',
  tituloProfissional: '',
  registroEmpresaContratada: 'MINAMBIENTAL PERFURAÇÕES E PROJETOS LTDA',
  registro: '',

  observacao: '',
});

const ContractFormPage = ({ mode }: ContractFormPageProps) => {
  const isEditMode = mode === 'edit';
  const navigate = useNavigate();
  const location = useLocation();
  const { licenseId, contractId } = useParams<{ licenseId: string; contractId: string }>();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [licenseData, setLicenseData] = useState<any>(null);
  const [formData, setFormData] = useState<ContractFormValues>(() => createDefaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTechnicianNotFoundDialog, setShowTechnicianNotFoundDialog] = useState(false);

  const navItems = useMemo(
    () => [
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
        isActive:
          location.pathname === '/licenses' ||
          location.pathname.startsWith('/create-contract') ||
          location.pathname.startsWith('/edit-contract'),
      },
      {
        title: 'Usuários',
        icon: Users,
        url: '/users',
        isActive: location.pathname === '/users',
      },
    ],
    [location.pathname]
  );

  useEffect(() => {
    const loadData = async () => {
      if (!licenseId) {
        toast({
          title: 'Erro',
          description: 'ID da licença não fornecido',
          variant: 'destructive',
        });
        navigate('/licenses');
        return;
      }

      if (isEditMode && !contractId) {
        toast({
          title: 'Erro',
          description: 'ID do contrato não fornecido',
          variant: 'destructive',
        });
        navigate(`/view-license/${licenseId}`);
        return;
      }

      try {
        setIsLoading(true);
        const license = await getLicenseById(licenseId);

        if (!license) {
          toast({
            title: 'Licença não encontrada',
            description: 'A licença especificada não existe.',
            variant: 'destructive',
          });
          navigate('/licenses');
          return;
        }

        setLicenseData(license);

        if (isEditMode) {
          const contract = await getContractById(contractId!);
          const valuesFromContract = mapContractDataToFormValues(contract);
          const defaults = createDefaultFormData();

          setFormData(() => ({
            ...defaults,
            ...valuesFromContract,
            paisContrato: valuesFromContract.paisContrato || 'Brasil',
            paisObra: valuesFromContract.paisObra || 'Brasil',
            registroEmpresaContratada:
              valuesFromContract.registroEmpresaContratada || defaults.registroEmpresaContratada,
            finalidade: valuesFromContract.finalidade || defaults.finalidade,
          }));
        } else {
          const defaults = createDefaultFormData();
          setFormData(defaults);

          if (license.requerente?.id) {
            try {
              const requerenteData: any = await getUserById(license.requerente.id);
              if (requerenteData.contato_medicao_cpf) {
                setFormData((prev) => ({
                  ...prev,
                  cpfContato: maskCPF(requerenteData.contato_medicao_cpf),
                  telefoneContato: requerenteData.contato_medicao_celular
                    ? maskPhone(requerenteData.contato_medicao_celular)
                    : '',
                }));
              }
            } catch (error) {
              console.log('Não foi possível carregar contato do requerente:', error);
            }
          }
        }

        setErrors({});
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar os dados necessários para o formulário.',
          variant: 'destructive',
        });
        navigate('/licenses');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [licenseId, contractId, isEditMode, navigate, toast]);

  const updateFormField = (field: keyof ContractFormValues, value: string) => {
    setErrors((e) => ({ ...e, [field]: '' }));

    if (field === 'cepContrato' || field === 'cepObra') {
      value = maskCEP(value);
    } else if (field === 'valor') {
      value = maskCurrency(value);
    } else if (field === 'cpfContato' || field === 'cpfTecnico') {
      value = maskCPF(value);
    } else if (field === 'telefoneContato') {
      value = maskPhone(value);
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLookupCEP = async (fieldPrefix: 'Contrato' | 'Obra') => {
    const cepField = fieldPrefix === 'Contrato' ? 'cepContrato' : 'cepObra';
    const cepValue = formData[cepField as keyof ContractFormValues];

    if (!validateCEP(cepValue)) {
      setErrors((e) => ({ ...e, [cepField]: 'CEP inválido' }));
      toast({
        title: 'CEP inválido',
        description: 'Verifique o CEP informado.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const addressData = await lookupCEP(cepValue);

      if (addressData.erro) {
        toast({
          title: 'CEP não encontrado',
          description: 'Preencha o endereço manualmente.',
          variant: 'destructive',
        });
        return;
      }

      if (fieldPrefix === 'Contrato') {
        setFormData((prev) => ({
          ...prev,
          ruaContrato: addressData.rua,
          bairroContrato: addressData.bairro,
          cidadeContrato: addressData.cidade,
          estadoContrato: addressData.estado,
          paisContrato: addressData.pais,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          ruaObra: addressData.rua,
          bairroObra: addressData.bairro,
          cidadeObra: addressData.cidade,
          estadoObra: addressData.estado,
          paisObra: addressData.pais,
        }));
      }

      toast({
        title: 'Endereço encontrado',
        description: 'Campos preenchidos automaticamente.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao buscar CEP',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  };

  const handleLookupTechnician = async () => {
    if (!validateCPF(formData.cpfTecnico)) {
      setErrors((e) => ({ ...e, cpfTecnico: 'CPF inválido' }));
      toast({
        title: 'CPF inválido',
        description: 'Verifique o CPF informado.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const cleanCPF = removeMask(formData.cpfTecnico);

      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, cpf, perfil')
        .eq('cpf', cleanCPF)
        .eq('perfil', 'Técnico')
        .single();

      if (error || !data) {
        setShowTechnicianNotFoundDialog(true);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        nomeTecnico: data.nome,
      }));

      toast({
        title: 'Técnico encontrado',
        description: 'Nome preenchido automaticamente.',
      });
    } catch (error) {
      setShowTechnicianNotFoundDialog(true);
    }
  };

  const handleCancel = () => {
    navigate(`/view-license/${licenseId}`);
  };

  const buildPayload = (): ReturnType<typeof createContractPayload> => {
    if (!licenseId) {
      throw new Error('Licença não identificada.');
    }
    return createContractPayload(formData, licenseId);
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.numero) newErrors.numero = 'Campo obrigatório';
    if (!formData.celebradoEm) newErrors.celebradoEm = 'Campo obrigatório';
    if (!formData.valor) newErrors.valor = 'Campo obrigatório';
    if (!formData.tipoContratante) newErrors.tipoContratante = 'Campo obrigatório';
    if (!formData.cepContrato) newErrors.cepContrato = 'Campo obrigatório';
    if (!formData.ruaContrato) newErrors.ruaContrato = 'Campo obrigatório';
    if (!formData.bairroContrato) newErrors.bairroContrato = 'Campo obrigatório';
    if (!formData.numeroContrato) newErrors.numeroContrato = 'Campo obrigatório';
    if (!formData.cidadeContrato) newErrors.cidadeContrato = 'Campo obrigatório';
    if (!formData.estadoContrato) newErrors.estadoContrato = 'Campo obrigatório';
    if (!formData.paisContrato) newErrors.paisContrato = 'Campo obrigatório';

    if (!formData.cepObra) newErrors.cepObra = 'Campo obrigatório';
    if (!formData.ruaObra) newErrors.ruaObra = 'Campo obrigatório';
    if (!formData.bairroObra) newErrors.bairroObra = 'Campo obrigatório';
    if (!formData.numeroObra) newErrors.numeroObra = 'Campo obrigatório';
    if (!formData.cidadeObra) newErrors.cidadeObra = 'Campo obrigatório';
    if (!formData.estadoObra) newErrors.estadoObra = 'Campo obrigatório';
    if (!formData.paisObra) newErrors.paisObra = 'Campo obrigatório';
    if (!formData.coordenadas) newErrors.coordenadas = 'Campo obrigatório';
    if (!formData.dataInicio) newErrors.dataInicio = 'Campo obrigatório';
    if (!formData.previsaoTermino) newErrors.previsaoTermino = 'Campo obrigatório';

    if (!formData.cpfContato) newErrors.cpfContato = 'Campo obrigatório';
    if (!validateCPF(formData.cpfContato)) newErrors.cpfContato = 'CPF inválido';
    if (!formData.nomeContato) newErrors.nomeContato = 'Campo obrigatório';
    if (!formData.telefoneContato) newErrors.telefoneContato = 'Campo obrigatório';
    if (!validatePhone(formData.telefoneContato)) newErrors.telefoneContato = 'Telefone inválido';
    if (!formData.periodoMedicaoInicio) newErrors.periodoMedicaoInicio = 'Campo obrigatório';
    if (!formData.periodoMedicaoFim) newErrors.periodoMedicaoFim = 'Campo obrigatório';

    if (!formData.cpfTecnico) newErrors.cpfTecnico = 'Campo obrigatório';
    if (!validateCPF(formData.cpfTecnico)) newErrors.cpfTecnico = 'CPF inválido';
    if (!formData.nomeTecnico) newErrors.nomeTecnico = 'Campo obrigatório';
    if (!formData.rnp) newErrors.rnp = 'Campo obrigatório';
    if (!formData.tituloProfissional) newErrors.tituloProfissional = 'Campo obrigatório';
    if (!formData.registroEmpresaContratada)
      newErrors.registroEmpresaContratada = 'Campo obrigatório';
    if (!formData.registro) newErrors.registro = 'Campo obrigatório';

    if (formData.dataInicio && formData.previsaoTermino && licenseData) {
      const dateValidation = validateContractDates(
        formData.dataInicio,
        formData.previsaoTermino,
        licenseData.data_inicio,
        licenseData.data_fim
      );

      if (!dateValidation.valid) {
        dateValidation.errors.forEach((error) => {
          if (error.includes('data de início')) {
            newErrors.dataInicio = error;
          } else if (error.includes('previsão de término')) {
            newErrors.previsaoTermino = error;
          }
        });
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos marcados com *',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      const payload = buildPayload();

      if (isEditMode) {
        const { licencaId: _ignored, ...updatePayload } = payload;

        await updateContract(contractId!, updatePayload);

        if (licenseData?.requerente?.id) {
          await updateRequerenteContatoMedicao(
            licenseData.requerente.id,
            payload.cpfContato,
            payload.telefoneContato
          );
        }

        toast({
          title: 'Contrato atualizado com sucesso.',
          description: 'As alterações foram aplicadas ao contrato.',
        });
      } else {
        await createContract(payload);

        if (licenseData?.requerente?.id) {
          await updateRequerenteContatoMedicao(
            licenseData.requerente.id,
            payload.cpfContato,
            payload.telefoneContato
          );
        }

        toast({
          title: 'Contrato criado com sucesso!',
          description: 'O contrato foi vinculado à licença.',
        });
      }

      setTimeout(() => {
        navigate(`/view-license/${licenseId}`);
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao salvar contrato:', error);
      toast({
        title: 'Erro ao salvar contrato',
        description:
          error?.message || 'Ocorreu um erro ao salvar o contrato. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
            <p className="text-gray-600">Carregando dados...</p>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const pageTitle = isEditMode ? 'Editar Contrato' : 'Cadastrar Contrato';
  const PrimaryButtonIcon = isEditMode ? Pencil : Save;
  const pageDescription = isEditMode
    ? `Atualize as informações do contrato vinculado à licença ${licenseData?.numero_licenca}`
    : `Vincule um novo contrato à licença ${licenseData?.numero_licenca}`;
  const breadcrumbLabel = isEditMode ? 'Editar Contrato' : 'Cadastrar Contrato';
  const primaryButtonLabel = isEditMode ? 'Salvar Alterações' : 'Salvar Contrato';

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
                    <DropdownMenuItem
                      onClick={() => {
                        navigate('/');
                      }}
                      className="cursor-pointer"
                    >
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
                    <BreadcrumbLink
                      onClick={() => navigate(`/view-license/${licenseId}`)}
                      className="cursor-pointer hover:text-emerald-600"
                    >
                      Visualizar Licença
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{breadcrumbLabel}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <main className="flex flex-1 flex-col gap-6 p-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="ghost"
                onClick={() => navigate(`/view-license/${licenseId}`)}
                className="gap-2 text-emerald-600 hover:text-emerald-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Licença
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-xl border border-gray-100 bg-white shadow-md"
            >
              <div className="rounded-t-xl bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100 px-8 py-6">
                <h2 className="text-2xl font-bold text-gray-800 md:text-3xl">{pageTitle}</h2>
                <p className="mt-2 text-gray-600">{pageDescription}</p>
              </div>

              <div className="p-6 md:p-8">
                <form className="space-y-8">
                  <section>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">Dados do Contrato</h3>
                      <p className="text-sm text-gray-600">Informações gerais do contrato</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-2">
                        <Label htmlFor="numero" className="text-sm font-medium text-gray-700">
                          Número do Contrato <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="numero"
                          placeholder="000/AAAA"
                          value={formData.numero}
                          onChange={(e) => updateFormField('numero', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.numero && <p className="text-xs text-red-600">{errors.numero}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="celebradoEm" className="text-sm font-medium text-gray-700">
                          Celebrado em <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="celebradoEm"
                          type="date"
                          value={formData.celebradoEm}
                          onChange={(e) => updateFormField('celebradoEm', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.celebradoEm && (
                          <p className="text-xs text-red-600">{errors.celebradoEm}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="valor" className="text-sm font-medium text-gray-700">
                          Valor (R$) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="valor"
                          placeholder="0,00"
                          value={formData.valor}
                          onChange={(e) => updateFormField('valor', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.valor && <p className="text-xs text-red-600">{errors.valor}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tipoContratante" className="text-sm font-medium text-gray-700">
                          Tipo de Contratante <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.tipoContratante}
                          onValueChange={(value: any) => updateFormField('tipoContratante', value)}
                        >
                          <SelectTrigger className="h-11 border-gray-300">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pessoa Física">Pessoa Física</SelectItem>
                            <SelectItem value="Pessoa Jurídica">Pessoa Jurídica</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.tipoContratante && (
                          <p className="text-xs text-red-600">{errors.tipoContratante}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vinculoArt" className="text-sm font-medium text-gray-700">
                          Vínculo à ART
                        </Label>
                        <Input
                          id="vinculoArt"
                          placeholder="Opcional"
                          value={formData.vinculoArt}
                          onChange={(e) => updateFormField('vinculoArt', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="acaoInstitucional" className="text-sm font-medium text-gray-700">
                          Ação Institucional
                        </Label>
                        <Input
                          id="acaoInstitucional"
                          placeholder="Opcional"
                          value={formData.acaoInstitucional}
                          onChange={(e) => updateFormField('acaoInstitucional', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cepContrato" className="text-sm font-medium text-gray-700">
                          CEP <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="cepContrato"
                            placeholder="00000-000"
                            value={formData.cepContrato}
                            onChange={(e) => updateFormField('cepContrato', e.target.value)}
                            className="h-11 flex-1 border-gray-300"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 shrink-0"
                            onClick={() => handleLookupCEP('Contrato')}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                        {errors.cepContrato && (
                          <p className="text-xs text-red-600">{errors.cepContrato}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ruaContrato" className="text-sm font-medium text-gray-700">
                          Rua <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="ruaContrato"
                          placeholder="Nome da rua"
                          value={formData.ruaContrato}
                          onChange={(e) => updateFormField('ruaContrato', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.ruaContrato && (
                          <p className="text-xs text-red-600">{errors.ruaContrato}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bairroContrato" className="text-sm font-medium text-gray-700">
                          Bairro <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="bairroContrato"
                          placeholder="Nome do bairro"
                          value={formData.bairroContrato}
                          onChange={(e) => updateFormField('bairroContrato', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.bairroContrato && (
                          <p className="text-xs text-red-600">{errors.bairroContrato}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="numeroContrato" className="text-sm font-medium text-gray-700">
                          Número <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="numeroContrato"
                          placeholder="123"
                          value={formData.numeroContrato}
                          onChange={(e) => updateFormField('numeroContrato', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.numeroContrato && (
                          <p className="text-xs text-red-600">{errors.numeroContrato}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cidadeContrato" className="text-sm font-medium text-gray-700">
                          Cidade <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="cidadeContrato"
                          placeholder="Nome da cidade"
                          value={formData.cidadeContrato}
                          onChange={(e) => updateFormField('cidadeContrato', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.cidadeContrato && (
                          <p className="text-xs text-red-600">{errors.cidadeContrato}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="estadoContrato" className="text-sm font-medium text-gray-700">
                          Estado <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="estadoContrato"
                          placeholder="MS"
                          value={formData.estadoContrato}
                          onChange={(e) => updateFormField('estadoContrato', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.estadoContrato && (
                          <p className="text-xs text-red-600">{errors.estadoContrato}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paisContrato" className="text-sm font-medium text-gray-700">
                          País <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="paisContrato"
                          placeholder="Brasil"
                          value={formData.paisContrato}
                          onChange={(e) => updateFormField('paisContrato', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.paisContrato && (
                          <p className="text-xs text-red-600">{errors.paisContrato}</p>
                        )}
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">Dados da Obra/Serviço</h3>
                      <p className="text-sm text-gray-600">
                        Localização e informações da obra/serviço
                      </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-2">
                        <Label htmlFor="cepObra" className="text-sm font-medium text-gray-700">
                          CEP <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="cepObra"
                            placeholder="00000-000"
                            value={formData.cepObra}
                            onChange={(e) => updateFormField('cepObra', e.target.value)}
                            className="h-11 flex-1 border-gray-300"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 shrink-0"
                            onClick={() => handleLookupCEP('Obra')}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                        {errors.cepObra && <p className="text-xs text-red-600">{errors.cepObra}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ruaObra" className="text-sm font-medium text-gray-700">
                          Rua <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="ruaObra"
                          placeholder="Nome da rua"
                          value={formData.ruaObra}
                          onChange={(e) => updateFormField('ruaObra', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.ruaObra && <p className="text-xs text-red-600">{errors.ruaObra}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bairroObra" className="text-sm font-medium text-gray-700">
                          Bairro <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="bairroObra"
                          placeholder="Nome do bairro"
                          value={formData.bairroObra}
                          onChange={(e) => updateFormField('bairroObra', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.bairroObra && (
                          <p className="text-xs text-red-600">{errors.bairroObra}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="numeroObra" className="text-sm font-medium text-gray-700">
                          Número <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="numeroObra"
                          placeholder="123"
                          value={formData.numeroObra}
                          onChange={(e) => updateFormField('numeroObra', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.numeroObra && (
                          <p className="text-xs text-red-600">{errors.numeroObra}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cidadeObra" className="text-sm font-medium text-gray-700">
                          Cidade <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="cidadeObra"
                          placeholder="Nome da cidade"
                          value={formData.cidadeObra}
                          onChange={(e) => updateFormField('cidadeObra', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.cidadeObra && (
                          <p className="text-xs text-red-600">{errors.cidadeObra}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="estadoObra" className="text-sm font-medium text-gray-700">
                          Estado <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="estadoObra"
                          placeholder="MS"
                          value={formData.estadoObra}
                          onChange={(e) => updateFormField('estadoObra', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.estadoObra && (
                          <p className="text-xs text-red-600">{errors.estadoObra}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paisObra" className="text-sm font-medium text-gray-700">
                          País <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="paisObra"
                          placeholder="Brasil"
                          value={formData.paisObra}
                          onChange={(e) => updateFormField('paisObra', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.paisObra && <p className="text-xs text-red-600">{errors.paisObra}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="coordenadas" className="text-sm font-medium text-gray-700">
                          Coordenadas <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="coordenadas"
                          placeholder="-20.123456, -54.123456"
                          value={formData.coordenadas}
                          onChange={(e) => updateFormField('coordenadas', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.coordenadas && (
                          <p className="text-xs text-red-600">{errors.coordenadas}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dataInicio" className="text-sm font-medium text-gray-700">
                          Data de Início <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="dataInicio"
                          type="date"
                          value={formData.dataInicio}
                          onChange={(e) => updateFormField('dataInicio', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.dataInicio && (
                          <p className="text-xs text-red-600">{errors.dataInicio}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="previsaoTermino" className="text-sm font-medium text-gray-700">
                          Previsão de Término <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="previsaoTermino"
                          type="date"
                          value={formData.previsaoTermino}
                          onChange={(e) => updateFormField('previsaoTermino', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.previsaoTermino && (
                          <p className="text-xs text-red-600">{errors.previsaoTermino}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="codigo" className="text-sm font-medium text-gray-700">
                          Código
                        </Label>
                        <Input
                          id="codigo"
                          placeholder="Opcional"
                          value={formData.codigo}
                          onChange={(e) => updateFormField('codigo', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                      </div>

                      <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="finalidade" className="text-sm font-medium text-gray-700">
                          Finalidade <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.finalidade}
                          onValueChange={(value) => updateFormField('finalidade', value)}
                        >
                          <SelectTrigger className="h-11 border-gray-300">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OUTRO - OUTRO - MONITORAMENTO DE OUTORGA SUBTERRÂNEA">
                              OUTRO - OUTRO - MONITORAMENTO DE OUTORGA SUBTERRÂNEA
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.finalidade && (
                          <p className="text-xs text-red-600">{errors.finalidade}</p>
                        )}
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Contato para Medição de Hidrômetro e Horímetro
                      </h3>
                      <p className="text-sm text-gray-600">
                        Dados do contato responsável pela medição
                      </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-2">
                        <Label htmlFor="cpfContato" className="text-sm font-medium text-gray-700">
                          CPF <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="cpfContato"
                          placeholder="000.000.000-00"
                          value={formData.cpfContato}
                          onChange={(e) => updateFormField('cpfContato', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.cpfContato && (
                          <p className="text-xs text-red-600">{errors.cpfContato}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nomeContato" className="text-sm font-medium text-gray-700">
                          Nome <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nomeContato"
                          placeholder="Nome completo"
                          value={formData.nomeContato}
                          onChange={(e) => updateFormField('nomeContato', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.nomeContato && (
                          <p className="text-xs text-red-600">{errors.nomeContato}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telefoneContato" className="text-sm font-medium text-gray-700">
                          Telefone <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="telefoneContato"
                          placeholder="(00) 00000-0000"
                          value={formData.telefoneContato}
                          onChange={(e) => updateFormField('telefoneContato', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.telefoneContato && (
                          <p className="text-xs text-red-600">{errors.telefoneContato}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="periodoMedicaoInicio"
                          className="text-sm font-medium text-gray-700"
                        >
                          Período de Medição - Início <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="periodoMedicaoInicio"
                          type="date"
                          value={formData.periodoMedicaoInicio}
                          onChange={(e) => updateFormField('periodoMedicaoInicio', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.periodoMedicaoInicio && (
                          <p className="text-xs text-red-600">{errors.periodoMedicaoInicio}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="periodoMedicaoFim"
                          className="text-sm font-medium text-gray-700"
                        >
                          Período de Medição - Fim <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="periodoMedicaoFim"
                          type="date"
                          value={formData.periodoMedicaoFim}
                          onChange={(e) => updateFormField('periodoMedicaoFim', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.periodoMedicaoFim && (
                          <p className="text-xs text-red-600">{errors.periodoMedicaoFim}</p>
                        )}
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">Técnico Responsável</h3>
                      <p className="text-sm text-gray-600">
                        Dados do técnico responsável pelo contrato
                      </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-2">
                        <Label htmlFor="cpfTecnico" className="text-sm font-medium text-gray-700">
                          CPF <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="cpfTecnico"
                            placeholder="000.000.000-00"
                            value={formData.cpfTecnico}
                            onChange={(e) => updateFormField('cpfTecnico', e.target.value)}
                            className="h-11 flex-1 border-gray-300"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 shrink-0"
                            onClick={handleLookupTechnician}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                        {errors.cpfTecnico && (
                          <p className="text-xs text-red-600">{errors.cpfTecnico}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nomeTecnico" className="text-sm font-medium text-gray-700">
                          Nome <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nomeTecnico"
                          placeholder="Nome completo"
                          value={formData.nomeTecnico}
                          disabled
                          className="h-11 border-gray-300 bg-gray-100 cursor-not-allowed"
                        />
                        {errors.nomeTecnico && (
                          <p className="text-xs text-red-600">{errors.nomeTecnico}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rnp" className="text-sm font-medium text-gray-700">
                          RNP <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="rnp"
                          placeholder="Número RNP"
                          value={formData.rnp}
                          onChange={(e) => updateFormField('rnp', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.rnp && <p className="text-xs text-red-600">{errors.rnp}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tituloProfissional" className="text-sm font-medium text-gray-700">
                          Título Profissional <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="tituloProfissional"
                          placeholder="Ex: Engenheiro Civil"
                          value={formData.tituloProfissional}
                          onChange={(e) => updateFormField('tituloProfissional', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.tituloProfissional && (
                          <p className="text-xs text-red-600">{errors.tituloProfissional}</p>
                        )}
                      </div>

                      <div className="space-y-2 lg:col-span-2">
                        <Label
                          htmlFor="registroEmpresaContratada"
                          className="text-sm font-medium text-gray-700"
                        >
                          Registro da Empresa Contratada <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.registroEmpresaContratada}
                          onValueChange={(value) =>
                            updateFormField('registroEmpresaContratada', value)
                          }
                        >
                          <SelectTrigger className="h-11 border-gray-300">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MINAMBIENTAL PERFURAÇÕES E PROJETOS LTDA">
                              MINAMBIENTAL PERFURAÇÕES E PROJETOS LTDA
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.registroEmpresaContratada && (
                          <p className="text-xs text-red-600">{errors.registroEmpresaContratada}</p>
                        )}
                      </div>

                      <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="registro" className="text-sm font-medium text-gray-700">
                          Registro <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="registro"
                          placeholder="Número de registro profissional"
                          value={formData.registro}
                          onChange={(e) => updateFormField('registro', e.target.value)}
                          className="h-11 border-gray-300"
                        />
                        {errors.registro && (
                          <p className="text-xs text-red-600">{errors.registro}</p>
                        )}
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">Observações</h3>
                      <p className="text-sm text-gray-600">Informações adicionais (opcional)</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observacao" className="text-sm font-medium text-gray-700">
                        Observação
                      </Label>
                      <Textarea
                        id="observacao"
                        placeholder="Digite observações sobre o contrato..."
                        value={formData.observacao}
                        onChange={(e) => updateFormField('observacao', e.target.value)}
                        className="min-h-[120px] border-gray-300"
                      />
                    </div>
                  </section>

                  <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      className="min-w-[120px]"
                      disabled={isSaving}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSave}
                      className="min-w-[160px] bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <PrimaryButtonIcon className="mr-2 h-4 w-4" />
                          {primaryButtonLabel}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </main>
        </SidebarInset>
      </div>

      <AlertDialog open={showTechnicianNotFoundDialog} onOpenChange={setShowTechnicianNotFoundDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Técnico não encontrado</AlertDialogTitle>
            <AlertDialogDescription>
              O CPF informado não foi encontrado no sistema ou não possui perfil de Técnico. Por favor,
              realize o cadastro do técnico antes de vinculá-lo como responsável no contrato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/create-user')}>
              Cadastrar Técnico
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

function createContractPayload(
  formData: ContractFormValues,
  licenseId: string
): CreateContractPayload {
  return {
    numero: formData.numero.trim(),
    celebradoEm: formData.celebradoEm,
    valor: unmaskCurrency(formData.valor),
    tipoContratante: formData.tipoContratante as 'Pessoa Física' | 'Pessoa Jurídica',
    vinculoArt: formData.vinculoArt.trim() || undefined,
    acaoInstitucional: formData.acaoInstitucional.trim() || undefined,

    cepContrato: removeMask(formData.cepContrato),
    ruaContrato: formData.ruaContrato.trim(),
    bairroContrato: formData.bairroContrato.trim(),
    numeroContrato: formData.numeroContrato.trim(),
    cidadeContrato: formData.cidadeContrato.trim(),
    estadoContrato: formData.estadoContrato.trim(),
    paisContrato: formData.paisContrato.trim(),

    cepObra: removeMask(formData.cepObra),
    ruaObra: formData.ruaObra.trim(),
    bairroObra: formData.bairroObra.trim(),
    numeroObra: formData.numeroObra.trim(),
    cidadeObra: formData.cidadeObra.trim(),
    estadoObra: formData.estadoObra.trim(),
    paisObra: formData.paisObra.trim(),
    coordenadas: formData.coordenadas.trim(),
    dataInicio: formData.dataInicio,
    previsaoTermino: formData.previsaoTermino,
    codigo: formData.codigo.trim() || undefined,
    finalidade: formData.finalidade.trim(),

    cpfContato: removeMask(formData.cpfContato),
    nomeContato: formData.nomeContato.trim(),
    telefoneContato: removeMask(formData.telefoneContato),
    periodoMedicaoInicio: formData.periodoMedicaoInicio,
    periodoMedicaoFim: formData.periodoMedicaoFim,

    cpfTecnico: removeMask(formData.cpfTecnico),
    nomeTecnico: formData.nomeTecnico.trim(),
    rnp: formData.rnp.trim(),
    tituloProfissional: formData.tituloProfissional.trim(),
    registroEmpresaContratada: formData.registroEmpresaContratada.trim(),
    registro: formData.registro.trim(),

    observacao: formData.observacao.trim() || undefined,

    licencaId: licenseId,
  };
}

export default ContractFormPage;

