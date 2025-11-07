import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Droplets } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NDNEModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
}

interface Tecnico {
  id: string;
  nome: string;
}

const NDNEModal = ({ isOpen, onClose, contractId }: NDNEModalProps) => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    periodo: '',
    tecnicoId: '',
    nd: '',
    ne: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar técnicos aprovados ao abrir o modal
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
  }, [isOpen, toast]);

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.periodo) {
      newErrors.periodo = 'Selecione o período';
    }

    if (!formData.tecnicoId) {
      newErrors.tecnicoId = 'Selecione o técnico responsável';
    }

    if (!formData.ne) {
      newErrors.ne = 'NE é obrigatório';
    } else if (isNaN(Number(formData.ne)) || Number(formData.ne) < 0) {
      newErrors.ne = 'Deve ser um número positivo';
    }

    if (!formData.nd) {
      newErrors.nd = 'ND é obrigatório';
    } else if (isNaN(Number(formData.nd)) || Number(formData.nd) < 0) {
      newErrors.nd = 'Deve ser um número positivo';
    }

    // ND deve ser >= NE
    const ne = Number(formData.ne);
    const nd = Number(formData.nd);
    if (!isNaN(ne) && !isNaN(nd) && nd < ne) {
      newErrors.nd = 'ND deve ser maior ou igual a NE';
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

      const { error } = await (supabase as any)
        .from('contrato_nd_ne')
        .insert({
          contrato_id: contractId,
          periodo: formData.periodo,
          nivel_estatico: Number(formData.ne),
          nivel_dinamico: Number(formData.nd),
          responsavel: tecnicoSelecionado?.nome || '',
          data_medicao: new Date().toISOString().split('T')[0],
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: 'Níveis registrados com sucesso!',
        description: `ND: ${formData.nd}m | NE: ${formData.ne}m | Período: ${formData.periodo === 'seca' ? 'Seca' : 'Chuva'}`,
      });

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
    });
    setErrors({});
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
              <DialogTitle className="text-xl">Informar Nd(m) e Ne(m)</DialogTitle>
              <DialogDescription>
                Registre os níveis dinâmico e estático para o período selecionado
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

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
                  <SelectItem value="seca">Seca</SelectItem>
                  <SelectItem value="chuva">Chuva</SelectItem>
                </SelectContent>
              </Select>
              {errors.periodo && (
                <p className="text-xs text-red-500">{errors.periodo}</p>
              )}
            </div>

            {/* Dropdown Técnico */}
            <div className="space-y-2">
              <Label htmlFor="tecnico" className="text-sm font-medium">
                Técnico *
              </Label>
              <Select
                value={formData.tecnicoId}
                onValueChange={(value) => handleInputChange('tecnicoId', value)}
                disabled={loadingTecnicos}
              >
                <SelectTrigger
                  className={`h-11 ${errors.tecnicoId ? 'border-red-500' : ''}`}
                >
                  <SelectValue
                    placeholder={loadingTecnicos ? 'Carregando...' : 'Selecione'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {tecnicos.map((tecnico) => (
                    <SelectItem key={tecnico.id} value={tecnico.id}>
                      {tecnico.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NDNEModal;
