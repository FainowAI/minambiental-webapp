import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { getUserById, updateUser } from '@/services/userService';
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
}

const EditUser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  // Form state management
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    perfil: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      isActive: location.pathname === '/users' || location.pathname.startsWith('/edit-user'),
    },
  ];

  const handleLogout = () => {
    console.log('Logout clicked');
    navigate('/');
  };

  const handleCancel = () => {
    navigate('/users');
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
        const userData = await getUserById(id);

        setFormData({
          name: userData.nome || '',
          cpf: maskCPFOrCNPJ(userData.cpf || ''),
          email: userData.email || '',
          phone: maskPhone(userData.celular || ''),
          perfil: userData.perfil || '',
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

  const handleSave = async () => {
    setErrors({});
    setSaving(true);

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

      // Validar email e celular (apenas para perfis Corpo Técnico e Técnico)
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

      if (Object.keys(customErrors).length > 0) {
        setErrors(customErrors);
        toast.error('Por favor, corrija os campos destacados.');
        setSaving(false);
        return;
      }

      // Preparar dados para atualização
      const userData: any = {
        nome: formData.name,
        cpf: formData.cpf,
        perfil: formData.perfil,
      };

      // Adicionar email e celular apenas para outros perfis
      if (formData.perfil !== 'Requerente') {
        userData.email = formData.email;
        userData.celular = formData.phone;
      }

      await updateUser(id!, userData);

      toast.success('Usuário atualizado com sucesso');
      navigate('/users');

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('CPF já cadastrado')) {
          setErrors({ cpf: 'CPF já cadastrado no sistema' });
          toast.error('CPF já cadastrado no sistema');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Erro ao atualizar usuário');
      }
    } finally {
      setSaving(false);
    }
  };

  // Update form data
  const updateFormField = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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

  if (loading) {
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
                    <BreadcrumbPage>Editar Usuário</BreadcrumbPage>
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Editar Usuário
                </h1>
                <p className="text-sm md:text-base text-gray-600 mt-2">
                  Atualize os dados do usuário no sistema
                </p>
              </div>

              {/* Form Content */}
              <div className="px-6 md:px-8 py-8">
                <div className="max-w-2xl mx-auto">
                  {/* Form Section Header */}
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">
                      Informações do Usuário
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
                        onValueChange={(value) => updateFormField('perfil', value as 'Corpo Técnico' | 'Requerente' | 'Técnico')}
                      >
                        <SelectTrigger className="h-11 border-gray-300 focus:border-emerald-500">
                          <SelectValue placeholder="Selecione o perfil" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Corpo Técnico">Corpo Técnico</SelectItem>
                          <SelectItem value="Técnico">Técnico</SelectItem>
                          <SelectItem value="Requerente">Requerente</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.perfil && <p className="text-xs text-red-500">{errors.perfil}</p>}
                    </div>

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
                    </div>

                    {/* Email Input - Apenas para perfis Corpo Técnico e Técnico */}
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
                      </div>
                    )}

                    {/* Celular Input - Apenas para perfis Corpo Técnico e Técnico */}
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
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-11 px-6 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Alterar
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

export default EditUser;
