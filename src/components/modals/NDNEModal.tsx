import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFormAutosave } from '@/hooks/useFormAutosave';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Droplets, ChevronsUpDown, Check, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { NDNERecord } from '@/services/ndneService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NDNEModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  editMode?: boolean;
  existingRecord?: NDNERecord;
  onSaveSuccess?: () => void;
}

interface Tecnico {
  id: string;
  nome: string;
}

const NDNEModal = ({
  isOpen,
  onClose,
  contractId,
  editMode = false,
  existingRecord,
  onSaveSuccess,
}: NDNEModalProps) => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    periodo: '',
    tecnicoId: '',
    nd: '',
    ne: '',
    dataMedicao: new Date().toISOString().split('T')[0], // Data atual como padrão
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openTecnicoCombobox, setOpenTecnicoCombobox] = useState(false);
  const [isEditMode, setIsEditMode] = useState(editMode);
  const [existingRecordId, setExistingRecordId] = useState<string | null>(
    existingRecord?.id || null
  );

  // Autosave hook
  const autosaveKey = useMemo(() => `ndne_draft_${contractId}`, [contractId]);
  const { restoreDraft, clearDraft } = useFormAutosave(autosaveKey, formData, {
    enabled: isOpen,
  });

  // Carregar dados do registro existente ao abrir em modo edição
  useEffect(() => {
    if (isOpen && editMode && existingRecord) {
      setFormData({
        periodo: existingRecord.periodo,
        tecnicoId: existingRecord.tecnico_id || '',
        nd: existingRecord.nivel_dinamico.toString(),
        ne: existingRecord.nivel_estatico.toString(),
        dataMedicao: existingRecord.data_medicao,
      });
      setIsEditMode(true);
      setExistingRecordId(existingRecord.id);
    }
  }, [isOpen, editMode, existingRecord]);

  // Buscar técnicos aprovados e restaurar rascunho ao abrir o modal
  useEffect(() => {
    const fetchTecnicos = async () => {
      if (!isOpen) return;

      setLoadingTecnicos(true);
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, nome')
          .eq('perfil', 'Corpo Técnico')
          .eq('status_aprovacao', 'Aprovado')
          .order('nome');

        if (error) throw error;
        setTecnicos(data || []);

        // Apenas restaurar rascunho se NÃO estiver em modo edição
        if (!editMode) {
          const draft = restoreDraft();
          if (draft) {
            setFormData(draft);
            toast({
              title: 'Rascunho restaurado',
              description: 'Os dados do formulário foram recuperados.',
            });
          }
        }
      } catch (error) {
        console.error('Erro ao buscar técnicos:', error);
        toast({
          title: 'Erro ao carregar técnicos',
          description: 'Não foi possível carregar a lista de técnicos.',
          variant: 'destructive',
        });
      } finally {
        setLoadingTecnicos(false);
      }
    };

    fetchTecnicos();
  }, [isOpen, toast, restoreDraft, editMode]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Função para validar se a data corresponde ao período (CA05)
  const validateDataPeriodo = (periodo: string, dataMedicao: string): boolean => {
    const data = new Date(dataMedicao);
    const mes = data.getMonth() + 1; // getMonth() retorna 0-11
    
    if (periodo === 'chuvoso') {
      // Chuvoso: outubro a março (meses 10, 11, 12, 1, 2, 3)
      return mes >= 10 || mes <= 3;
    } else if (periodo === 'seco') {
      // Seco: abril a setembro (meses 4, 5, 6, 7, 8, 9)
      return mes >= 4 && mes <= 9;
    }
    
    return false;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // CA02 - Validação de campos obrigatórios
    if (!formData.periodo) {
      newErrors.periodo = 'Campo obrigatório não informado.';
    }

    if (!formData.tecnicoId) {
      newErrors.tecnicoId = 'Campo obrigatório não informado.';
    }

    if (!formData.dataMedicao) {
      newErrors.dataMedicao = 'Campo obrigatório não informado.';
    }

    if (!formData.ne) {
      newErrors.ne = 'Campo obrigatório não informado.';
    } else if (isNaN(Number(formData.ne)) || Number(formData.ne) < 0) {
      newErrors.ne = 'Deve ser um número positivo';
    }

    if (!formData.nd) {
      newErrors.nd = 'Campo obrigatório não informado.';
    } else if (isNaN(Number(formData.nd)) || Number(formData.nd) < 0) {
      newErrors.nd = 'Deve ser um número positivo';
    }

    // ND deve ser >= NE
    const ne = Number(formData.ne);
    const nd = Number(formData.nd);
    if (!isNaN(ne) && !isNaN(nd) && nd < ne) {
      newErrors.nd = 'ND deve ser maior ou igual a NE';
    }

    // CA05 - Validação de período vs data de medição
    if (formData.periodo && formData.dataMedicao) {
      if (!validateDataPeriodo(formData.periodo, formData.dataMedicao)) {
        newErrors.dataMedicao = 'Não é permitido alterar o cadastro, pois a data informada não corresponde ao período de medição.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, corrija os erros no formulário.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Buscar nome do técnico selecionado
      const tecnicoSelecionado = tecnicos.find((t) => t.id === formData.tecnicoId);

      // Buscar usuário autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isEditMode && existingRecordId) {
        // Modo de edição - atualizar registro existente

        // Buscar origem original do registro
        const { data: originalRecord } = await supabase
          .from('contrato_nd_ne')
          .select('origem_cadastro, original_origem_cadastro')
          .eq('id', existingRecordId)
          .single();

        const updateData = {
          periodo: formData.periodo as 'chuvoso' | 'seco',
          nivel_estatico: Number(formData.ne),
          nivel_dinamico: Number(formData.nd),
          responsavel: tecnicoSelecionado?.nome || '',
          tecnico_id: formData.tecnicoId,
          data_medicao: formData.dataMedicao,
          origem_cadastro: 'sistema' as 'chatbot' | 'sistema',
          // Preservar origem original se já existir, senão usar origem atual
          original_origem_cadastro: originalRecord?.original_origem_cadastro || originalRecord?.origem_cadastro,
          edited_at: new Date().toISOString(),
          edited_by: user?.id,
        };

        const { error } = await supabase
          .from('contrato_nd_ne')
          .update(updateData)
          .eq('id', existingRecordId);

        if (error) throw error;

        toast({
          title: 'Registro atualizado com sucesso!',
          description: `ND: ${formData.nd}m | NE: ${formData.ne}m | Período: ${formData.periodo === 'seco' ? 'Seco' : 'Chuvoso'}`,
        });
      } else {
        // Modo de cadastro - inserir novo registro
        // CA02 - Verificar se já existe registro cadastrado via chatbot para este período
        const { data: existingChatbotRecord } = await supabase
          .from('contrato_nd_ne')
          .select('id')
          .eq('contrato_id', contractId)
          .eq('periodo', formData.periodo as 'chuvoso' | 'seco')
          .eq('origem_cadastro', 'chatbot')
          .maybeSingle();

        if (existingChatbotRecord) {
          toast({
            title: 'Registro já existe',
            description: 'Já existe um cadastro via chatbot para este período. Use o botão "Editar" na lista de registros para atualizá-lo.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }

        const insertData = {
          contrato_id: contractId,
          periodo: formData.periodo as 'chuvoso' | 'seco',
          nivel_estatico: Number(formData.ne),
          nivel_dinamico: Number(formData.nd),
          responsavel: tecnicoSelecionado?.nome || '',
          tecnico_id: formData.tecnicoId,
          data_medicao: formData.dataMedicao,
          origem_cadastro: 'sistema' as 'chatbot' | 'sistema',
          created_by: user?.id,
        };

        const { error } = await supabase
          .from('contrato_nd_ne')
          .insert(insertData);

        if (error) throw error;

        toast({
          title: 'Níveis registrados com sucesso!',
          description: `ND: ${formData.nd}m | NE: ${formData.ne}m | Período: ${formData.periodo === 'seco' ? 'Seco' : 'Chuvoso'}`,
        });
      }

      clearDraft();
      if (onSaveSuccess) onSaveSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Erro ao salvar ND/NE:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      periodo: '',
      tecnicoId: '',
      nd: '',
      ne: '',
      dataMedicao: new Date().toISOString().split('T')[0],
    });
    setErrors({});
    setIsEditMode(false);
    setExistingRecordId(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center">
              <Droplets className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {isEditMode ? 'Editar Nd(m) e Ne(m)' : 'Informar Nd(m) e Ne(m)'}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? 'Edite os níveis dinâmico e estático cadastrados anteriormente'
                  : 'Registre os níveis dinâmico e estático para o período selecionado'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Indicadores visuais para modo edição */}
        {isEditMode && existingRecord && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-600 text-white">MODO EDIÇÃO</Badge>
              {existingRecord.original_origem_cadastro === 'chatbot' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Bot className="h-3 w-3" />
                  Originalmente criado via Chatbot
                </Badge>
              )}
            </div>
            <p className="text-sm text-blue-700">
              Criado em: {format(new Date(existingRecord.created_at || ''), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              {existingRecord.edited_at && (
                <span className="ml-2">
                  • Última edição: {format(new Date(existingRecord.edited_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </span>
              )}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Linha 1: Período e Técnico */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dropdown Período */}
            <div className="space-y-2">
              <Label htmlFor="periodo" className="text-sm font-medium">
                Período *
              </Label>
              <Select
                value={formData.periodo}
                onValueChange={(value) => handleInputChange('periodo', value)}
              >
                <SelectTrigger
                  className={`h-11 ${errors.periodo ? 'border-red-500' : ''}`}
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seco">Seco</SelectItem>
                  <SelectItem value="chuvoso">Chuvoso</SelectItem>
                </SelectContent>
              </Select>
              {errors.periodo && (
                <p className="text-xs text-red-500">{errors.periodo}</p>
              )}
            </div>

            {/* Dropdown Técnico com Busca */}
            <div className="space-y-2">
              <Label htmlFor="tecnico" className="text-sm font-medium">
                Técnico *
              </Label>
              <Popover open={openTecnicoCombobox} onOpenChange={setOpenTecnicoCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openTecnicoCombobox}
                    className={cn(
                      'h-11 w-full justify-between',
                      errors.tecnicoId && 'border-red-500',
                      !formData.tecnicoId && 'text-muted-foreground'
                    )}
                    disabled={loadingTecnicos}
                  >
                    {loadingTecnicos
                      ? 'Carregando...'
                      : formData.tecnicoId
                      ? tecnicos.find((t) => t.id === formData.tecnicoId)?.nome
                      : 'Selecione'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-popover z-50" align="start">
                  <Command className="bg-popover">
                    <CommandInput placeholder="Pesquisar técnico..." className="h-9" />
                    <CommandList className="bg-popover">
                      <CommandEmpty>Nenhum técnico encontrado.</CommandEmpty>
                      <CommandGroup className="bg-popover">
                        {tecnicos.map((tecnico) => (
                          <CommandItem
                            key={tecnico.id}
                            value={tecnico.nome}
                            onSelect={() => {
                              handleInputChange('tecnicoId', tecnico.id);
                              setOpenTecnicoCombobox(false);
                            }}
                            className="bg-popover hover:bg-accent"
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                formData.tecnicoId === tecnico.id
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            {tecnico.nome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.tecnicoId && (
                <p className="text-xs text-red-500">{errors.tecnicoId}</p>
              )}
            </div>
          </div>

          {/* Linha 2: ND e NE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campo ND */}
            <div className="space-y-2">
              <Label htmlFor="nd" className="text-sm font-medium">
                Nd (m) *
              </Label>
              <Input
                id="nd"
                type="number"
                step="0.01"
                value={formData.nd}
                onChange={(e) => handleInputChange('nd', e.target.value)}
                placeholder="0"
                className={`h-11 ${errors.nd ? 'border-red-500' : ''}`}
                required
              />
              {errors.nd && <p className="text-xs text-red-500">{errors.nd}</p>}
            </div>

            {/* Campo NE */}
            <div className="space-y-2">
              <Label htmlFor="ne" className="text-sm font-medium">
                Ne (m) *
              </Label>
              <Input
                id="ne"
                type="number"
                step="0.01"
                value={formData.ne}
                onChange={(e) => handleInputChange('ne', e.target.value)}
                placeholder="0"
                className={`h-11 ${errors.ne ? 'border-red-500' : ''}`}
                required
              />
              {errors.ne && <p className="text-xs text-red-500">{errors.ne}</p>}
            </div>
          </div>

          {/* Linha 3: Data de Medição */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataMedicao" className="text-sm font-medium">
                Data de Medição *
              </Label>
              <Input
                id="dataMedicao"
                type="date"
                value={formData.dataMedicao}
                onChange={(e) => handleInputChange('dataMedicao', e.target.value)}
                className={`h-11 ${errors.dataMedicao ? 'border-red-500' : ''}`}
                required
              />
              {errors.dataMedicao && <p className="text-xs text-red-500">{errors.dataMedicao}</p>}
            </div>
          </div>

          {/* Botões de Ação */}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
            >
              {isSubmitting ? 'Salvando...' : isEditMode ? 'Atualizar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NDNEModal;
