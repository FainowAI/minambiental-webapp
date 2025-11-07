import { useEffect, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';

interface UseUnsavedChangesPromptOptions {
  when: boolean;
  message?: string;
  onNavigate?: () => void;
}

/**
 * Hook para avisar sobre alterações não salvas
 * - Bloqueia reload/close com window.beforeunload
 * - Bloqueia navegação interna com react-router blocker
 */
export function useUnsavedChangesPrompt({
  when,
  message = 'Você tem alterações não salvas. Deseja realmente sair?',
  onNavigate,
}: UseUnsavedChangesPromptOptions) {
  // Prevenir reload/close do navegador
  useEffect(() => {
    if (!when) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [when, message]);

  // Bloquear navegação interna do React Router
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) => {
        if (!when) return false;
        return currentLocation.pathname !== nextLocation.pathname;
      },
      [when]
    )
  );

  // Handler para confirmar navegação
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const shouldProceed = window.confirm(message);
      if (shouldProceed) {
        if (onNavigate) {
          onNavigate();
        }
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, message, onNavigate]);

  return { blocker };
}
