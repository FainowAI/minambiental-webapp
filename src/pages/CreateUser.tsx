import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { z } from 'zod';
import { createUserWithInvite } from '@/services/userService';
import { createRequerente } from '@/services/requerenteService';
import { validateCPFOrCNPJ, validateEmail, validatePhone, validateName } from '@/utils/validators';
import { maskCPFOrCNPJ, maskPhone } from '@/utils/masks';
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

// Type for form data
interface UserFormData {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  perfil: 'Corpo Técnico' | 'Requerente' | 'Técnico' | '';
  // Campos específicos para perfil Requerente
  contato_medicao_cpf?: string;
  contato_medicao_email?: string;
  contato_medicao_celular?: string;
}

// Validation schema
const userSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(255),
  cpf: z.string().min(1, 'Campo obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  perfil: z.enum(['Corpo Técnico', 'Requerente', 'Técnico'], {
    required_error: 'Campo obrigatório'
  }),
  contato_medicao_cpf: z.string().optional(),
  contato_medicao_email: z.string().email('Email inválido').optional().or(z.literal('')),
  contato_medicao_celular: z.string().optional(),
});

const CreateUser = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Form state management
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    perfil: '', // Inicialmente vazio
    contato_medicao_cpf: '',
    contato_medicao_email: '',
    contato_medicao_celular: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFields, setShowFields] = useState(false);

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
      isActive: location.pathname === '/users' || location.pathname === '/create-user',
    },
  ];

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logout clicked');
    navigate('/');
  };

  const handleCancel = () => {
    navigate('/users');
  };

  const handleSave = async () => {
    setErrors({});
    setLoading(true);

    try {
      // Validações customizadas
      const customErrors: Record<string, string> = {};

      // Validar perfil
      if (!formData.perfil) {
        customErrors.perfil = 'Campo obrigatório';
      }

      // Validar nome
      if (!formData.name.trim()) {
        customErrors.name = 'Campo obrigatório';
      } else if (!validateName(formData.name)) {
        customErrors.name = 'Nome deve conter pelo menos nome e sobrenome';
      }

      // Validar CPF/CNPJ
      if (!formData.cpf.trim()) {
        customErrors.cpf = 'Campo obrigatório';
      } else {
        const cpfValidation = validateCPFOrCNPJ(formData.cpf);
        if (!cpfValidation.valid) {
          customErrors.cpf = 'Campo inválido';
        }
      }

      // Validar email (apenas para outros perfis)
      if (formData.perfil !== 'Requerente') {
        if (!formData.email.trim()) {
          customErrors.email = 'Campo obrigatório';
        } else if (!validateEmail(formData.email)) {
          customErrors.email = 'Campo inválido';
        }

        // Validar celular se preenchido
        if (formData.phone && !validatePhone(formData.phone)) {
          customErrors.phone = 'Campo inválido';
        }
      }

      // Validações específicas para perfil Requerente
      if (formData.perfil === 'Requerente') {
        // Validar contato de medição se preenchido
        if (formData.contato_medicao_cpf && formData.contato_medicao_cpf.trim() && !validateCPFOrCNPJ(formData.contato_medicao_cpf).valid) {
          customErrors.contato_medicao_cpf = 'Campo inválido';
        }
        if (formData.contato_medicao_email && formData.contato_medicao_email.trim() && !validateEmail(formData.contato_medicao_email)) {
          customErrors.contato_medicao_email = 'Campo inválido';
        }
        if (formData.contato_medicao_celular && formData.contato_medicao_celular.trim() && !validatePhone(formData.contato_medicao_celular)) {
          customErrors.contato_medicao_celular = 'Campo inválido';
        }
      }

      if (Object.keys(customErrors).length > 0) {
        setErrors(customErrors);
        toast.error('Por favor, corrija os campos destacados.');
        setLoading(false);
        return;
      }

      // Preparar dados baseados no perfil
      const userData: any = {
        nome: formData.name,
        cpf: formData.cpf.replace(/\D/g, ''),
      };

      if (formData.perfil === 'Requerente') {
        // Rota específica para Requerente
        userData.email = formData.email || undefined;
        userData.celular = formData.phone?.replace(/\D/g, '') || undefined;
        userData.contato_medicao_cpf = formData.contato_medicao_cpf?.replace(/\D/g, '');
        userData.contato_medicao_email = formData.contato_medicao_email;
        userData.contato_medicao_celular = formData.contato_medicao_celular?.replace(/\D/g, '');

        await createRequerente(userData);
        toast.success('Usuário Requerente criado com sucesso!', { duration: 5000 });
      } else {
        // Rota original para Corpo Técnico e Técnico
        userData.perfil = formData.perfil;
        userData.email = formData.email;
        userData.celular = formData.phone?.replace(/\D/g, '');

        const result = await createUserWithInvite(userData);
        
        if (result.requiresApproval) {
          const emailMessage = `Usuário ${formData.perfil} criado! Email de convite enviado para ${formData.email}`;
          toast.success(emailMessage, { duration: 5000 });
        } else {
          toast.success(`Usuário ${formData.perfil} criado e aprovado automaticamente!`);
        }
      }
      
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

  // Update form data
  const updateFormField = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle profile change
  const handleProfileChange = (value: string) => {
    if (value) {
      updateFormField('perfil', value as 'Corpo Técnico' | 'Requerente' | 'Técnico');
      setShowFields(true);
    } else {
      updateFormField('perfil', '');
      setShowFields(false);
    }
  };

  // Apply masks to input values
  const handleCPFChange = (value: string) => {
    const maskedValue = maskCPFOrCNPJ(value);
    updateFormField('cpf', maskedValue);
  };

  const handlePhoneChange = (value: string) => {
    const maskedValue = maskPhone(value);
    updateFormField('phone', maskedValue);
  };

  const handleContatoCPFChange = (value: string) => {
    const maskedValue = maskCPFOrCNPJ(value);
    updateFormField('contato_medicao_cpf', maskedValue);
  };

  const handleContatoPhoneChange = (value: string) => {
    const maskedValue = maskPhone(value);
    updateFormField('contato_medicao_celular', maskedValue);
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Cadastrar Usuário
                </h1>
                <p className="text-sm md:text-base text-gray-600 mt-2">
                  Preencha os dados do novo usuário no sistema
                </p>
              </div>

              {/* Form Content */}
              <div className="px-6 md:px-8 py-8">
                <div className="max-w-2xl mx-auto">
                  {/* Form Section Header */}
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">
                      Informações Básicas
                    </h2>
                    <p className="text-sm text-gray-600">
                      Os campos marcados com <span className="text-red-500">*</span> são
                      obrigatórios
                    </p>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-6">
                    {/* Perfil Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="perfil" className="text-sm font-medium text-gray-700">
                        Perfil <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.perfil || undefined}
                        onValueChange={handleProfileChange}
                      >
                        <SelectTrigger className="h-11 border-gray-300 focus:border-emerald-500">
                          <SelectValue placeholder="Selecione o perfil" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Requerente">Requerente</SelectItem>
                          <SelectItem value="Técnico">Técnico</SelectItem>
                          <SelectItem value="Corpo Técnico">Corpo Técnico</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.perfil && <p className="text-xs text-red-500">{errors.perfil}</p>}
                      
                      {/* Avisos condicionais */}
                      {formData.perfil === 'Corpo Técnico' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                          <p className="text-sm text-blue-800">
                            <strong>Atenção:</strong> Usuários do Corpo Técnico precisarão de aprovação do administrador. Um email com link de convite será enviado.
                          </p>
                        </div>
                      )}
                      
                      {(formData.perfil === 'Requerente' || formData.perfil === 'Técnico') && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                          <p className="text-sm text-green-800">
                            <strong>Info:</strong> Este usuário será aprovado automaticamente e poderá acessar o sistema imediatamente.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Campos condicionais baseados no perfil */}
                    {showFields && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >

                        {/* Nome Input */}
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                            Nome Completo <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            type="text"
                            placeholder="Digite o nome completo"
                            value={formData.name}
                            onChange={(e) => updateFormField('name', e.target.value)}
                            className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                              errors.name ? 'border-red-500' : ''
                            }`}
                          />
                          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                        </div>

                        {/* CPF/CNPJ Input */}
                        <div className="space-y-2">
                          <Label htmlFor="cpf" className="text-sm font-medium text-gray-700">
                            CPF ou CNPJ <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="cpf"
                            type="text"
                            placeholder="000.000.000-00 ou 00.000.000/0000-00"
                            value={formData.cpf}
                            onChange={(e) => handleCPFChange(e.target.value)}
                            className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                              errors.cpf ? 'border-red-500' : ''
                            }`}
                            maxLength={18}
                          />
                          {errors.cpf && <p className="text-xs text-red-500">{errors.cpf}</p>}
                          <p className="text-xs text-gray-500 mt-1">
                            Informe apenas números, a formatação será automática
                          </p>
                        </div>

                        {/* Email Input - Apenas para outros perfis */}
                        {formData.perfil !== 'Requerente' && (
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                              Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="exemplo@exemplo.com"
                              value={formData.email}
                              onChange={(e) => updateFormField('email', e.target.value)}
                              className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                                errors.email ? 'border-red-500' : ''
                              }`}
                            />
                            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                            <p className="text-xs text-gray-500 mt-1">
                              Este email será usado para login e notificações
                            </p>
                          </div>
                        )}

                        {/* Celular Input - Apenas para outros perfis */}
                        {formData.perfil !== 'Requerente' && (
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                              Celular
                            </Label>
                            <Input
                              id="phone"
                              type="text"
                              placeholder="(00) 00000-0000"
                              value={formData.phone}
                              onChange={(e) => handlePhoneChange(e.target.value)}
                              className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                                errors.phone ? 'border-red-500' : ''
                              }`}
                              maxLength={15}
                            />
                            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                            <p className="text-xs text-gray-500 mt-1">Campo opcional</p>
                          </div>
                        )}

                        {/* Campos específicos para perfil Requerente */}
                        {formData.perfil === 'Requerente' && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="space-y-6 border-t border-gray-200 pt-6"
                          >
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                              <h3 className="text-lg font-semibold text-amber-800 mb-2">
                                Contato para Medição
                              </h3>
                              <p className="text-sm text-amber-700">
                                Os campos abaixo são opcionais e referem-se ao contato responsável pela medição de hidrômetro e horímetro.
                              </p>
                            </div>

                            {/* CPF do Contato */}
                            <div className="space-y-2">
                              <Label htmlFor="contato_medicao_cpf" className="text-sm font-medium text-gray-700">
                                CPF do Contato
                              </Label>
                              <Input
                                id="contato_medicao_cpf"
                                type="text"
                                placeholder="000.000.000-00"
                                value={formData.contato_medicao_cpf || ''}
                                onChange={(e) => handleContatoCPFChange(e.target.value)}
                                className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                                  errors.contato_medicao_cpf ? 'border-red-500' : ''
                                }`}
                                maxLength={14}
                              />
                              {errors.contato_medicao_cpf && <p className="text-xs text-red-500">{errors.contato_medicao_cpf}</p>}
                            </div>

                            {/* Email do Contato */}
                            <div className="space-y-2">
                              <Label htmlFor="contato_medicao_email" className="text-sm font-medium text-gray-700">
                                Email do Contato
                              </Label>
                              <Input
                                id="contato_medicao_email"
                                type="email"
                                placeholder="exemplo@exemplo.com"
                                value={formData.contato_medicao_email || ''}
                                onChange={(e) => updateFormField('contato_medicao_email', e.target.value)}
                                className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                                  errors.contato_medicao_email ? 'border-red-500' : ''
                                }`}
                              />
                              {errors.contato_medicao_email && <p className="text-xs text-red-500">{errors.contato_medicao_email}</p>}
                            </div>

                            {/* Celular do Contato */}
                            <div className="space-y-2">
                              <Label htmlFor="contato_medicao_celular" className="text-sm font-medium text-gray-700">
                                Celular do Contato
                              </Label>
                              <Input
                                id="contato_medicao_celular"
                                type="text"
                                placeholder="(00) 00000-0000"
                                value={formData.contato_medicao_celular || ''}
                                onChange={(e) => handleContatoPhoneChange(e.target.value)}
                                className={`h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                                  errors.contato_medicao_celular ? 'border-red-500' : ''
                                }`}
                                maxLength={15}
                              />
                              {errors.contato_medicao_celular && <p className="text-xs text-red-500">{errors.contato_medicao_celular}</p>}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Action Buttons */}
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
                          Criando usuário...
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
