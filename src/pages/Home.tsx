import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home as HomeIcon, FileText, Users, LogOut, User } from 'lucide-react';
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

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
      isActive: location.pathname === '/users',
    },
  ];

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logout clicked');
    navigate('/');
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
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <h1 className="text-lg font-semibold">Home</h1>
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
          <main className="flex flex-1 flex-col gap-8 p-8">
            {/* Welcome Section with Motion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-4"
            >
              <h2 className="text-3xl font-bold text-gray-800">
                Bem-vindo ao{' '}
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
                !
              </h2>
              <p className="text-base text-gray-600 leading-relaxed max-w-3xl">
                Sistema de monitoramento ambiental integrado. Gerencie licenças, contratos, usuários
                e visualize dashboards em tempo real.
              </p>
            </motion.div>

            {/* Quick Access Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {/* Licenças e Contratos Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-gray-800">Licenças e Contratos</h3>
                    <p className="text-sm text-gray-600">
                      Gerencie suas licenças ambientais e contratos de forma centralizada.
                    </p>
                    <Button
                      onClick={() => navigate('/licenses')}
                      className="mt-2 w-fit bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                    >
                      Acessar
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Usuários Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-gray-800">Usuários</h3>
                    <p className="text-sm text-gray-600">
                      Gerencie usuários, permissões e controle de acesso ao sistema.
                    </p>
                    <Button
                      onClick={() => navigate('/users')}
                      className="mt-2 w-fit bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                    >
                      Acessar
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Statistics Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="rounded-2xl border border-gray-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8"
            >
              <h3 className="mb-6 text-xl font-semibold text-gray-800">Visão Geral</h3>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-gray-600">Licenças Ativas</p>
                  <p className="text-3xl font-bold text-emerald-600">24</p>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-gray-600">Contratos Vigentes</p>
                  <p className="text-3xl font-bold text-teal-600">12</p>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-gray-600">Usuários Ativos</p>
                  <p className="text-3xl font-bold text-green-700">48</p>
                </div>
              </div>
            </motion.div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Home;
