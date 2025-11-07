import { useEffect } from 'react';

interface UseUnsavedChangesPromptOptions {
  when: boolean;
  message?: string;
}

/**
 * Hook para avisar sobre alterações não salvas
 * - Bloqueia reload/close com window.beforeunload
 * - Protege contra perda de dados ao trocar de aba ou minimizar janela
 */
export function useUnsavedChangesPrompt({
  when,
  message = 'Você tem alterações não salvas. Deseja realmente sair?',
}: UseUnsavedChangesPromptOptions) {
  // Prevenir reload/close do navegador e mudança de foco
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
}
