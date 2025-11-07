import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Droplets, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NDNEModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
}

const NDNEModal = ({ isOpen, onClose, contractId }: NDNEModalProps) => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    neSecaMetros: '',
    neChuvaMetros: '',
    ndSecaMetros: '',
    ndChuvaMetros: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

    // All fields are required
    if (!formData.neSecaMetros) {
      newErrors.neSecaMetros = 'NE no período de seca é obrigatório';
    } else if (isNaN(Number(formData.neSecaMetros)) || Number(formData.neSecaMetros) < 0) {
      newErrors.neSecaMetros = 'Deve ser um número positivo';
    }

    if (!formData.neChuvaMetros) {
      newErrors.neChuvaMetros = 'NE no período de chuva é obrigatório';
    } else if (isNaN(Number(formData.neChuvaMetros)) || Number(formData.neChuvaMetros) < 0) {
      newErrors.neChuvaMetros = 'Deve ser um número positivo';
    }

    if (!formData.ndSecaMetros) {
      newErrors.ndSecaMetros = 'ND no período de seca é obrigatório';
    } else if (isNaN(Number(formData.ndSecaMetros)) || Number(formData.ndSecaMetros) < 0) {
      newErrors.ndSecaMetros = 'Deve ser um número positivo';
    }

    if (!formData.ndChuvaMetros) {
      newErrors.ndChuvaMetros = 'ND no período de chuva é obrigatório';
    } else if (isNaN(Number(formData.ndChuvaMetros)) || Number(formData.ndChuvaMetros) < 0) {
      newErrors.ndChuvaMetros = 'Deve ser um número positivo';
    }

    // Validate that ND >= NE (Nível Dinâmico deve ser maior ou igual ao Estático)
    const neSeca = Number(formData.neSecaMetros);
    const ndSeca = Number(formData.ndSecaMetros);
    const neChuva = Number(formData.neChuvaMetros);
    const ndChuva = Number(formData.ndChuvaMetros);

    if (!isNaN(neSeca) && !isNaN(ndSeca) && ndSeca < neSeca) {
      newErrors.ndSecaMetros = 'ND deve ser maior ou igual a NE';
    }

    if (!isNaN(neChuva) && !isNaN(ndChuva) && ndChuva < neChuva) {
      newErrors.ndChuvaMetros = 'ND deve ser maior ou igual a NE';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, corrija os erros no formulário.',
        variant: 'destructive',
      });
      return;
    }

    // Simulate success (no Supabase integration yet)
    toast({
      title: 'Níveis registrados com sucesso!',
      description: `Os valores de ND e NE foram registrados para o contrato ${contractId}.`,
      variant: 'default',
    });

    // Reset form and close
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      neSecaMetros: '',
      neChuvaMetros: '',
      ndSecaMetros: '',
      ndChuvaMetros: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center">
              <Droplets className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Informar ND e NE</DialogTitle>
              <DialogDescription>
                Registre os níveis dinâmico e estático nos períodos de seca e chuva
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Info Alert */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-gray-700">
              <strong>NE (Nível Estático):</strong> Profundidade do nível da água quando o poço está em
              repouso (bomba desligada).
              <br />
              <strong>ND (Nível Dinâmico):</strong> Profundidade do nível da água quando o poço está
              bombeando água.
            </AlertDescription>
          </Alert>

          {/* Período de Seca */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                <Droplets className="h-4 w-4 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Período de Seca</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neSecaMetros" className="text-sm font-medium">
                  Nível Estático (NE) - Metros *
                </Label>
                <div className="relative">
                  <Input
                    id="neSecaMetros"
                    type="number"
                    step="0.01"
                    value={formData.neSecaMetros}
                    onChange={(e) => handleInputChange('neSecaMetros', e.target.value)}
                    placeholder="Ex: 15.50"
                    className={`h-11 pr-12 ${errors.neSecaMetros ? 'border-red-500' : ''}`}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    m
                  </span>
                </div>
                {errors.neSecaMetros && (
                  <p className="text-xs text-red-500">{errors.neSecaMetros}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ndSecaMetros" className="text-sm font-medium">
                  Nível Dinâmico (ND) - Metros *
                </Label>
                <div className="relative">
                  <Input
                    id="ndSecaMetros"
                    type="number"
                    step="0.01"
                    value={formData.ndSecaMetros}
                    onChange={(e) => handleInputChange('ndSecaMetros', e.target.value)}
                    placeholder="Ex: 20.75"
                    className={`h-11 pr-12 ${errors.ndSecaMetros ? 'border-red-500' : ''}`}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    m
                  </span>
                </div>
                {errors.ndSecaMetros && (
                  <p className="text-xs text-red-500">{errors.ndSecaMetros}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Período de Chuva */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <Droplets className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Período de Chuva</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neChuvaMetros" className="text-sm font-medium">
                  Nível Estático (NE) - Metros *
                </Label>
                <div className="relative">
                  <Input
                    id="neChuvaMetros"
                    type="number"
                    step="0.01"
                    value={formData.neChuvaMetros}
                    onChange={(e) => handleInputChange('neChuvaMetros', e.target.value)}
                    placeholder="Ex: 10.25"
                    className={`h-11 pr-12 ${errors.neChuvaMetros ? 'border-red-500' : ''}`}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    m
                  </span>
                </div>
                {errors.neChuvaMetros && (
                  <p className="text-xs text-red-500">{errors.neChuvaMetros}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ndChuvaMetros" className="text-sm font-medium">
                  Nível Dinâmico (ND) - Metros *
                </Label>
                <div className="relative">
                  <Input
                    id="ndChuvaMetros"
                    type="number"
                    step="0.01"
                    value={formData.ndChuvaMetros}
                    onChange={(e) => handleInputChange('ndChuvaMetros', e.target.value)}
                    placeholder="Ex: 18.50"
                    className={`h-11 pr-12 ${errors.ndChuvaMetros ? 'border-red-500' : ''}`}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    m
                  </span>
                </div>
                {errors.ndChuvaMetros && (
                  <p className="text-xs text-red-500">{errors.ndChuvaMetros}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white hover:from-cyan-700 hover:to-cyan-800"
            >
              Salvar Níveis
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NDNEModal;
