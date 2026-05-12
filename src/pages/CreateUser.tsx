import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { z } from 'zod';
import { createUserWithInvite } from '@/services/userService';
import { createRequerente } from '@/services/requerenteService';
import { validateCPFOrCNPJ, validateEmail, validatePhone, validateName, validateCPF } from '@/utils/validators';
import { maskCPFOrCNPJ, maskCPF, maskPhone } from '@/utils/masks';
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// =============================================================================
// Tipos
// =============================================================================

// Perfil selecionado no topo do formulário. Mapeia 1-para-1 para o destino
// (funcionario com role corpo_tecnico/tecnico, ou requerente).
type PerfilOption = 'corpo_tecnico' | 'tecnico' | 'requerente' | '';

// Modo do formulário derivado do perfil escolhido.
type FormMode = 'funcionario' | 'requerente';

// Estado unificado do formulário. Os campos variam conforme o modo.
interface UserFormData {
  perfil: PerfilOption;

  // Campos de Funcionário (corpo_tecnico / tecnico)
  nome: string;
  cpf: string;
  email: string;
  celular: string;

  // Campos de Requerente
  tipo_pessoa: 'PF' | 'PJ' | '';
  cpf_cnpj: string;
  nome_razao_social: string;
  requerente_email: string;
  requerente_celular: string;
  contato_medicao_nome: string;
  contato_medicao_cpf: string;
  contato_medicao_email: string;
  contato_medicao_celular: string;
}

const initialFormData: UserFormData = {
  perfil: '',
  nome: '',
  cpf: '',
  email: '',
  celular: '',
  tipo_pessoa: '',
  cpf_cnpj: '',
  nome_razao_social: '',
  requerente_email: '',
  requerente_celular: '',
  contato_medicao_nome: '',
  contato_medicao_cpf: '',
  contato_medicao_email: '',
  contato_medicao_celular: '',
};

const getFormMode = (perfil: PerfilOption): FormMode | null => {
  if (perfil === 'corpo_tecnico' || perfil === 'tecnico') return 'funcionario';
  if (perfil === 'requerente') return 'requerente';
  return null;
};

// =============================================================================
// Schemas Zod — um por modo. Validações finas continuam no submit.
// =============================================================================

const funcionarioSchema = z.object({
  perfil: z.enum(['corpo_tecnico', 'tecnico']),
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(255),
  cpf: z.string().min(1, 'Campo obrigatório'),
  email: z.string().email('Email inválido'),
  celular: z.string().optional().or(z.literal('')),
});

const requerenteSchema = z.object({
  perfil: z.literal('requerente'),
  tipo_pessoa: z.enum(['PF', 'PJ'], { required_error: 'Campo obrigatório' }),
  cpf_cnpj: z.string().min(1, 'Campo obrigatório'),
  nome_razao_social: z
    .string()
    .min(3, 'Informe pelo menos 3 caracteres')
    .max(255),
  requerente_email: z.string().email('Email inválido').optional().or(z.literal('')),
  requerente_celular: z.string().optional().or(z.literal('')),
  contato_medicao_nome: z.string().optional().or(z.literal('')),
  contato_medicao_cpf: z.string().optional().or(z.literal('')),
  contato_medicao_email: z.string().email('Email inválido').optional().or(z.literal('')),
  contato_medicao_celular: z.string().optional().or(z.literal('')),
});

const CreateUser = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formMode = getFormMode(formData.perfil);

  // Autosave hook
  const autosaveKey = 'create_user_draft';
  const { restoreDraft, clearDraft } = useFormAutosave(autosaveKey, formData, {
    enabled: true,
    debounceMs: 400,
  });

  const isDirty = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  };

  useUnsavedChangesPrompt({
    when: isDirty(),
    message: 'Você tem alterações não salvas. Deseja realmente sair?',
  });

  useEffect(() => {
    const draft = restoreDraft();
    if (draft) {
      setFormData((prev) => ({ ...prev, ...draft }));
      toast.info('Rascunho restaurado', { duration: 3000 });
    }
  }, [restoreDraft]);

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
      isActive: location.pathname === '/users' || location.pathname === '/create-user',
    },
  ];

  const handleLogout = () => {
    navigate('/');
  };

  const handleCancel = () => {
    clearDraft();
    navigate('/users');
  };

  // ----------------------------------------------------------------------------
  // Helpers de atualização de campo
  // ----------------------------------------------------------------------------

  const updateField = <K extends keyof UserFormData>(field: K, value: UserFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  const handlePerfilChange = (value: string) => {
    const next = (value || '') as PerfilOption;
    setFormData((prev) => ({ ...prev, perfil: next }));
    setErrors({});
  };

  // CPF puro (11 dígitos) — para Funcionário
  const handleCpfFuncionarioChange = (value: string) => {
    updateField('cpf', maskCPF ? maskCPF(value) : (() => {
      const cleaned = value.replace(/\D/g, '').substring(0, 11);
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    })());
  };

  // CPF/CNPJ — para Requerente principal
  const handleCpfCnpjChange = (value: string) => {
    updateField('cpf_cnpj', maskCPFOrCNPJ(value));
  };

  // CPF puro — contato de medição
  const handleContatoCpfChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').substring(0, 11);
    const masked = cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    updateField('contato_medicao_cpf', masked);
  };

  // ----------------------------------------------------------------------------
  // Submit
  // ----------------------------------------------------------------------------

  const submitFuncionario = async () => {
    const customErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      customErrors.nome = 'Campo obrigatório';
    } else if (!validateName(formData.nome)) {
      customErrors.nome = 'Nome deve conter pelo menos nome e sobrenome';
    }

    const cleanCpf = formData.cpf.replace(/\D/g, '');
    if (!cleanCpf) {
      customErrors.cpf = 'Campo obrigatório';
    } else if (cleanCpf.length !== 11 || !validateCPF(cleanCpf)) {
      customErrors.cpf = 'CPF inválido';
    }

    if (!formData.email.trim()) {
      customErrors.email = 'Campo obrigatório';
    } else if (!validateEmail(formData.email)) {
      customErrors.email = 'Email inválido';
    }

    const isCorpoTecnico = formData.perfil === 'corpo_tecnico';
    if (isCorpoTecnico && !formData.celular.trim()) {
      customErrors.celular = 'Campo obrigatório';
    }
    if (formData.celular && !validatePhone(formData.celular)) {
      customErrors.celular = 'Celular inválido';
    }

    if (Object.keys(customErrors).length > 0) {
      setErrors(customErrors);
      toast.error('Por favor, corrija os campos destacados.');
      return false;
    }

    // Valida com Zod (mensagens defensivas extras)
    funcionarioSchema.parse({
      perfil: formData.perfil,
      nome: formData.nome,
      cpf: formData.cpf,
      email: formData.email,
      celular: formData.celular,
    });

    const result = await createUserWithInvite({
      nome: formData.nome.trim(),
      cpf: cleanCpf,
      email: formData.email.trim().toLowerCase(),
      celular: formData.celular.replace(/\D/g, '') || undefined,
      perfil: formData.perfil as 'corpo_tecnico' | 'tecnico',
    });

    if (result.requiresApproval) {
      toast.success(
        `Funcionário criado! Convite enviado para ${formData.email}`,
        { duration: 5000 },
      );
    } else {
      toast.success('Funcionário criado e aprovado automaticamente!');
    }
    return true;
  };

  const submitRequerente = async () => {
    const customErrors: Record<string, string> = {};

    if (!formData.tipo_pessoa) {
      customErrors.tipo_pessoa = 'Campo obrigatório';
    }

    const cleanCpfCnpj = formData.cpf_cnpj.replace(/\D/g, '');
    if (!cleanCpfCnpj) {
      customErrors.cpf_cnpj = 'Campo obrigatório';
    } else {
      const v = validateCPFOrCNPJ(formData.cpf_cnpj);
      if (!v.valid) {
        customErrors.cpf_cnpj = 'CPF/CNPJ inválido';
      } else if (formData.tipo_pessoa === 'PF' && cleanCpfCnpj.length !== 11) {
        customErrors.cpf_cnpj = 'Para Pessoa Física informe um CPF válido';
      } else if (formData.tipo_pessoa === 'PJ' && cleanCpfCnpj.length !== 14) {
        customErrors.cpf_cnpj = 'Para Pessoa Jurídica informe um CNPJ válido';
      }
    }

    if (!formData.nome_razao_social.trim()) {
      customErrors.nome_razao_social = 'Campo obrigatório';
    }

    if (formData.requerente_email && !validateEmail(formData.requerente_email)) {
      customErrors.requerente_email = 'Email inválido';
    }
    if (formData.requerente_celular && !validatePhone(formData.requerente_celular)) {
      customErrors.requerente_celular = 'Celular inválido';
    }

    if (
      formData.contato_medicao_cpf &&
      !validateCPFOrCNPJ(formData.contato_medicao_cpf).valid
    ) {
      customErrors.contato_medicao_cpf = 'CPF inválido';
    }
    if (
      formData.contato_medicao_email &&
      !validateEmail(formData.contato_medicao_email)
    ) {
      customErrors.contato_medicao_email = 'Email inválido';
    }
    if (
      formData.contato_medicao_celular &&
      !validatePhone(formData.contato_medicao_celular)
    ) {
      customErrors.contato_medicao_celular = 'Celular inválido';
    }

    if (Object.keys(customErrors).length > 0) {
      setErrors(customErrors);
      toast.error('Por favor, corrija os campos destacados.');
      return false;
    }

    requerenteSchema.parse({
      perfil: 'requerente',
      tipo_pessoa: formData.tipo_pessoa,
      cpf_cnpj: formData.cpf_cnpj,
      nome_razao_social: formData.nome_razao_social,
      requerente_email: formData.requerente_email,
      requerente_celular: formData.requerente_celular,
      contato_medicao_nome: formData.contato_medicao_nome,
      contato_medicao_cpf: formData.contato_medicao_cpf,
      contato_medicao_email: formData.contato_medicao_email,
      contato_medicao_celular: formData.contato_medicao_celular,
    });

    // O contrato do edge function é "novo" mas a interface TS no service
    // ainda é a antiga — enviamos a forma nova via cast.
    const payload = {
      tipo_pessoa: formData.tipo_pessoa,
      cpf_cnpj: cleanCpfCnpj,
      nome_razao_social: formData.nome_razao_social.trim(),
      email: formData.requerente_email.trim().toLowerCase() || undefined,
      celular: formData.requerente_celular.replace(/\D/g, '') || undefined,
      contato_medicao_nome: formData.contato_medicao_nome.trim() || undefined,
      contato_medicao_cpf: formData.contato_medicao_cpf.replace(/\D/g, '') || undefined,
      contato_medicao_email:
        formData.contato_medicao_email.trim().toLowerCase() || undefined,
      contato_medicao_celular:
        formData.contato_medicao_celular.replace(/\D/g, '') || undefined,
    };

    await createRequerente(payload as any);
    toast.success('Requerente criado com sucesso!', { duration: 5000 });
    return true;
  };

  const handleSave = async () => {
    setErrors({});
    setLoading(true);

    try {
      if (!formData.perfil) {
        setErrors({ perfil: 'Campo obrigatório' });
        toast.error('Selecione um perfil para continuar.');
        return;
      }

      const ok =
        formMode === 'funcionario'
          ? await submitFuncionario()
          : await submitRequerente();

      if (!ok) return;

      clearDraft();
      navigate('/users');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error('Por favor, corrija os campos destacados.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Erro inesperado.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------------

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
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

        {/* Main */}
        <SidebarInset>
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
                    <BreadcrumbPage>Cadastrar Usuário</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

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

          <main className="flex flex-1 flex-col gap-6 p-6 md:p-8">
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
            >
              <div className="border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 md:px-8 py-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Cadastrar Usuário
                </h1>
                <p className="text-sm md:text-base text-gray-600 mt-2">
                  Preencha os dados do novo usuário no sistema
                </p>
              </div>

              <div className="px-6 md:px-8 py-8">
                <div className="max-w-2xl mx-auto">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">
                      Informações Básicas
                    </h2>
                    <p className="text-sm text-gray-600">
                      Os campos marcados com <span className="text-red-500">*</span> são
                      obrigatórios
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Perfil */}
                    <div className="space-y-2">
                      <Label htmlFor="perfil" className="text-sm font-medium text-gray-700">
                        Perfil <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.perfil || undefined}
                        onValueChange={handlePerfilChange}
                      >
                        <SelectTrigger className="h-11 border-gray-300 focus:border-emerald-500">
                          <SelectValue placeholder="Selecione o perfil" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="corpo_tecnico">Funcionário (Corpo Técnico)</SelectItem>
                          <SelectItem value="tecnico">Funcionário (Técnico)</SelectItem>
                          <SelectItem value="requerente">Requerente</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.perfil && <p className="text-xs text-red-500">{errors.perfil}</p>}
                    </div>

                    {/* Formulário de Funcionário */}
                    {formMode === 'funcionario' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
                            Nome Completo <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="nome"
                            type="text"
                            placeholder="Digite o nome completo"
                            value={formData.nome}
                            onChange={(e) => updateField('nome', e.target.value)}
                            className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                              errors.nome ? 'border-red-500' : ''
                            }`}
                          />
                          {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cpf" className="text-sm font-medium text-gray-700">
                            CPF <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="cpf"
                            type="text"
                            placeholder="000.000.000-00"
                            value={formData.cpf}
                            onChange={(e) => handleCpfFuncionarioChange(e.target.value)}
                            className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                              errors.cpf ? 'border-red-500' : ''
                            }`}
                            maxLength={14}
                          />
                          {errors.cpf && <p className="text-xs text-red-500">{errors.cpf}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Email <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="exemplo@exemplo.com"
                            value={formData.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                              errors.email ? 'border-red-500' : ''
                            }`}
                          />
                          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                          <p className="text-xs text-gray-500 mt-1">
                            Este email será usado para login e notificações
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="celular" className="text-sm font-medium text-gray-700">
                            Celular{' '}
                            {formData.perfil === 'corpo_tecnico' && (
                              <span className="text-red-500">*</span>
                            )}
                          </Label>
                          <Input
                            id="celular"
                            type="text"
                            placeholder="(00) 00000-0000"
                            value={formData.celular}
                            onChange={(e) => updateField('celular', maskPhone(e.target.value))}
                            className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                              errors.celular ? 'border-red-500' : ''
                            }`}
                            maxLength={15}
                          />
                          {errors.celular && (
                            <p className="text-xs text-red-500">{errors.celular}</p>
                          )}
                          {formData.perfil === 'tecnico' && (
                            <p className="text-xs text-gray-500 mt-1">Campo opcional</p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Formulário de Requerente */}
                    {formMode === 'requerente' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="tipo_pessoa" className="text-sm font-medium text-gray-700">
                            Tipo de Pessoa <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.tipo_pessoa || undefined}
                            onValueChange={(v) =>
                              updateField('tipo_pessoa', v as 'PF' | 'PJ')
                            }
                          >
                            <SelectTrigger className="h-11 border-gray-300 focus:border-emerald-500">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PF">Pessoa Física</SelectItem>
                              <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.tipo_pessoa && (
                            <p className="text-xs text-red-500">{errors.tipo_pessoa}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cpf_cnpj" className="text-sm font-medium text-gray-700">
                            CPF / CNPJ <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="cpf_cnpj"
                            type="text"
                            placeholder="000.000.000-00 ou 00.000.000/0000-00"
                            value={formData.cpf_cnpj}
                            onChange={(e) => handleCpfCnpjChange(e.target.value)}
                            className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                              errors.cpf_cnpj ? 'border-red-500' : ''
                            }`}
                            maxLength={18}
                          />
                          {errors.cpf_cnpj && (
                            <p className="text-xs text-red-500">{errors.cpf_cnpj}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="nome_razao_social"
                            className="text-sm font-medium text-gray-700"
                          >
                            Nome / Razão Social <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="nome_razao_social"
                            type="text"
                            placeholder="Nome completo ou razão social"
                            value={formData.nome_razao_social}
                            onChange={(e) => updateField('nome_razao_social', e.target.value)}
                            className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                              errors.nome_razao_social ? 'border-red-500' : ''
                            }`}
                          />
                          {errors.nome_razao_social && (
                            <p className="text-xs text-red-500">{errors.nome_razao_social}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="requerente_email"
                            className="text-sm font-medium text-gray-700"
                          >
                            Email
                          </Label>
                          <Input
                            id="requerente_email"
                            type="email"
                            placeholder="exemplo@exemplo.com"
                            value={formData.requerente_email}
                            onChange={(e) => updateField('requerente_email', e.target.value)}
                            className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                              errors.requerente_email ? 'border-red-500' : ''
                            }`}
                          />
                          {errors.requerente_email && (
                            <p className="text-xs text-red-500">{errors.requerente_email}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">Campo opcional</p>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="requerente_celular"
                            className="text-sm font-medium text-gray-700"
                          >
                            Celular
                          </Label>
                          <Input
                            id="requerente_celular"
                            type="text"
                            placeholder="(00) 00000-0000"
                            value={formData.requerente_celular}
                            onChange={(e) =>
                              updateField('requerente_celular', maskPhone(e.target.value))
                            }
                            className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                              errors.requerente_celular ? 'border-red-500' : ''
                            }`}
                            maxLength={15}
                          />
                          {errors.requerente_celular && (
                            <p className="text-xs text-red-500">{errors.requerente_celular}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">Campo opcional</p>
                        </div>

                        {/* Contato de medição */}
                        <div className="border-t border-gray-200 pt-6 space-y-6">
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-amber-800 mb-1">
                              Contato para Medição
                            </h3>
                            <p className="text-sm text-amber-700">
                              Campos opcionais. Referem-se ao contato responsável pela medição
                              de hidrômetro e horímetro.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="contato_medicao_nome"
                              className="text-sm font-medium text-gray-700"
                            >
                              Nome do Contato
                            </Label>
                            <Input
                              id="contato_medicao_nome"
                              type="text"
                              placeholder="Nome do contato"
                              value={formData.contato_medicao_nome}
                              onChange={(e) =>
                                updateField('contato_medicao_nome', e.target.value)
                              }
                              className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="contato_medicao_cpf"
                              className="text-sm font-medium text-gray-700"
                            >
                              CPF do Contato
                            </Label>
                            <Input
                              id="contato_medicao_cpf"
                              type="text"
                              placeholder="000.000.000-00"
                              value={formData.contato_medicao_cpf}
                              onChange={(e) => handleContatoCpfChange(e.target.value)}
                              className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                                errors.contato_medicao_cpf ? 'border-red-500' : ''
                              }`}
                              maxLength={14}
                            />
                            {errors.contato_medicao_cpf && (
                              <p className="text-xs text-red-500">{errors.contato_medicao_cpf}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="contato_medicao_email"
                              className="text-sm font-medium text-gray-700"
                            >
                              Email do Contato
                            </Label>
                            <Input
                              id="contato_medicao_email"
                              type="email"
                              placeholder="exemplo@exemplo.com"
                              value={formData.contato_medicao_email}
                              onChange={(e) =>
                                updateField('contato_medicao_email', e.target.value)
                              }
                              className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                                errors.contato_medicao_email ? 'border-red-500' : ''
                              }`}
                            />
                            {errors.contato_medicao_email && (
                              <p className="text-xs text-red-500">
                                {errors.contato_medicao_email}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="contato_medicao_celular"
                              className="text-sm font-medium text-gray-700"
                            >
                              Celular do Contato
                            </Label>
                            <Input
                              id="contato_medicao_celular"
                              type="text"
                              placeholder="(00) 00000-0000"
                              value={formData.contato_medicao_celular}
                              onChange={(e) =>
                                updateField('contato_medicao_celular', maskPhone(e.target.value))
                              }
                              className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                                errors.contato_medicao_celular ? 'border-red-500' : ''
                              }`}
                              maxLength={15}
                            />
                            {errors.contato_medicao_celular && (
                              <p className="text-xs text-red-500">
                                {errors.contato_medicao_celular}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      onClick={handleCancel}
                      variant="outline"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 h-11 px-6 font-medium"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-11 px-6 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Usuário
                        </>
                      )}
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

export default CreateUser;
