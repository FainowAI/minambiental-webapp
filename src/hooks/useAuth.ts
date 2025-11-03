import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getUserApprovalStatus, UserApprovalStatus } from '@/services/userService';

interface UseAuthReturn {
  user: User | null;
  userData: any | null;
  isApproved: boolean;
  isCorpoTecnico: boolean;
  isActive: boolean;
  isLoading: boolean;
  checkApprovalStatus: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isCorpoTecnico, setIsCorpoTecnico] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkApprovalStatus = async () => {
    if (!user) {
      setUserData(null);
      setIsApproved(false);
      setIsCorpoTecnico(false);
      setIsActive(false);
      return;
    }

    try {
      const approvalStatus = await getUserApprovalStatus(user.id);
      setIsApproved(approvalStatus.isApproved);
      setIsCorpoTecnico(approvalStatus.isCorpoTecnico);
      setIsActive(approvalStatus.isActive);

      // Get full user data if approved and active
      if (approvalStatus.isApproved && approvalStatus.isActive) {
        const { data } = await supabase
          .from('usuarios')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();
        
        setUserData(data);
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
      setIsApproved(false);
      setIsCorpoTecnico(false);
      setIsActive(false);
      setUserData(null);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkApprovalStatus();
      } else {
        setUserData(null);
        setIsApproved(false);
        setIsCorpoTecnico(false);
        setIsActive(false);
      }
      
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);
        setUser(session?.user ?? null);
        
        // Check approval status when user changes
        if (session?.user) {
          await checkApprovalStatus();
        } else {
          setUserData(null);
          setIsApproved(false);
          setIsCorpoTecnico(false);
          setIsActive(false);
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Check approval status when user changes
  useEffect(() => {
    if (user) {
      checkApprovalStatus();
    }
  }, [user]);

  return {
    user,
    userData,
    isApproved,
    isCorpoTecnico,
    isActive,
    isLoading,
    checkApprovalStatus,
  };
}

