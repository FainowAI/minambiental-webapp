import { useEffect, useCallback, useRef } from 'react';

interface UseFormAutosaveOptions {
  debounceMs?: number;
  enabled?: boolean;
}

/**
 * Hook genérico para autosave de formulários usando localStorage
 * @param key - Chave única para identificar o rascunho no localStorage
 * @param data - Dados do formulário a serem salvos
 * @param options - Opções de configuração (debounce, enabled)
 */
export function useFormAutosave<T>(
  key: string,
  data: T,
  options: UseFormAutosaveOptions = {}
) {
  const { debounceMs = 500, enabled = true } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(false);

  // Função para salvar no localStorage (debounced)
  useEffect(() => {
    if (!enabled || !initialLoadRef.current) {
      initialLoadRef.current = true;
      return;
    }

    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Criar novo timeout
    timeoutRef.current = setTimeout(() => {
      try {
        const dataToSave = JSON.stringify(data);
        localStorage.setItem(key, dataToSave);
        console.log(`[Autosave] Rascunho salvo: ${key}`);
      } catch (error) {
        console.error('[Autosave] Erro ao salvar rascunho:', error);
      }
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, key, debounceMs, enabled]);

  // Função para restaurar rascunho
  const restoreDraft = useCallback((): T | null => {
    try {
      const savedData = localStorage.getItem(key);
      if (savedData) {
        console.log(`[Autosave] Rascunho restaurado: ${key}`);
        return JSON.parse(savedData) as T;
      }
    } catch (error) {
      console.error('[Autosave] Erro ao restaurar rascunho:', error);
    }
    return null;
  }, [key]);

  // Função para limpar rascunho
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
      console.log(`[Autosave] Rascunho removido: ${key}`);
    } catch (error) {
      console.error('[Autosave] Erro ao remover rascunho:', error);
    }
  }, [key]);

  return { restoreDraft, clearDraft };
}
