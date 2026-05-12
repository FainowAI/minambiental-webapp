import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type RoleV2 = 'corpo_tecnico' | 'tecnico';

export type Usuario = Tables<'usuarios'>;

interface UseAuthReturn {
  user: User | null;
  usuario: Usuario | null;
  /**
   * @deprecated Use `usuario` instead. Kept temporarily for backward compatibility
   * with call sites that still read `userData`. Does NOT include a `perfil` field.
   */
  userData: Usuario | null;
  roles: RoleV2[];
  isApproved: boolean;
  isCorpoTecnico: boolean;
  isTecnico: boolean;
  isLoading: boolean;
  authError: string | null;
  checkApprovalStatus: () => Promise<void>;
}

const normalize = (s: string | null | undefined): string =>
  (s ?? '').toString().trim().toLowerCase();

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [roles, setRoles] = useState<RoleV2[]>([]);
  const [isApproved, setIsApproved] = useState(false);
  const [isCorpoTecnico, setIsCorpoTecnico] = useState(false);
  const [isTecnico, setIsTecnico] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const resetAuthState = useCallback(() => {
    setUsuario(null);
    setRoles([]);
    setIsApproved(false);
    setIsCorpoTecnico(false);
    setIsTecnico(false);
  }, []);

  const signOutWithError = useCallback(async (message: string) => {
    setAuthError(message);
    resetAuthState();
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error signing out after failed auth check:', e);
    }
    throw new Error(message);
  }, [resetAuthState]);

  const checkApprovalStatus = useCallback(async () => {
    if (!user) {
      resetAuthState();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(
          'id, nome, email, cpf, celular, status, status_aprovacao, auth_user_id, user_roles(role_v2)'
        )
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading usuario row:', error);
        await signOutWithError('Não foi possível carregar seus dados. Tente novamente.');
        return;
      }

      if (!data) {
        await signOutWithError(
          'Seu acesso ainda não foi configurado. Por favor, entre em contato com o administrador.'
        );
        return;
      }

      const userRolesRaw = (data as any).user_roles;
      const userRolesArray = Array.isArray(userRolesRaw)
        ? userRolesRaw
        : userRolesRaw
        ? [userRolesRaw]
        : [];
      const resolvedRoles = userRolesArray
        .map((r: any) => r?.role_v2)
        .filter(Boolean) as RoleV2[];

      const corpoTecnico = resolvedRoles.includes('corpo_tecnico');
      const tecnico = resolvedRoles.includes('tecnico');

      // No role assigned at all
      if (resolvedRoles.length === 0) {
        await signOutWithError(
          'Seu acesso ainda não foi configurado. Por favor, entre em contato com o administrador.'
        );
        return;
      }

      // Técnico-only users must use the ChatBot, not the webapp
      if (!corpoTecnico && tecnico) {
        await signOutWithError(
          'Acesso restrito ao Corpo Técnico. Técnicos devem usar o ChatBot.'
        );
        return;
      }

      // Has roles but none is corpo_tecnico (e.g., unknown future role)
      if (!corpoTecnico) {
        await signOutWithError(
          'Acesso restrito ao Corpo Técnico. Técnicos devem usar o ChatBot.'
        );
        return;
      }

      const statusNorm = normalize((data as any).status);
      const aprovacaoNorm = normalize((data as any).status_aprovacao);

      // Pending approval
      if (aprovacaoNorm === 'pendente') {
        await signOutWithError('Cadastro pendente de aprovação.');
        return;
      }

      // Rejected or inactive
      if (aprovacaoNorm !== 'aprovado' || statusNorm !== 'ativo') {
        await signOutWithError('Acesso bloqueado.');
        return;
      }

      // Strip nested relation off the persisted row; expose usuario without
      // any role/perfil-style fields beyond what the table provides.
      const { user_roles: _ignored, ...usuarioRow } = data as any;

      setUsuario(usuarioRow as Usuario);
      setRoles(resolvedRoles);
      setIsCorpoTecnico(corpoTecnico);
      setIsTecnico(tecnico);
      setIsApproved(true);
      setAuthError(null);
    } catch (error) {
      // signOutWithError throws after setting state; swallow here so the
      // hook does not crash React's effect runner.
      if (error instanceof Error) {
        console.warn('Auth check rejected session:', error.message);
      } else {
        console.error('Error checking approval status:', error);
        resetAuthState();
      }
    }
  }, [user, resetAuthState, signOutWithError]);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (!session?.user) {
          resetAuthState();
          setAuthError(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [resetAuthState]);

  // Check approval status when user changes
  useEffect(() => {
    if (user) {
      checkApprovalStatus();
    }
  }, [user, checkApprovalStatus]);

  return {
    user,
    usuario,
    userData: usuario,
    roles,
    isApproved,
    isCorpoTecnico,
    isTecnico,
    isLoading,
    authError,
    checkApprovalStatus,
  };
}
