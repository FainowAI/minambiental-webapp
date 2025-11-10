import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFormAutosave } from '@/hooks/useFormAutosave';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Gauge, Upload, Eye, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MeterReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
}

interface ImageData {
  file: File;
  preview: string;
  id: string;
}

const MeterReadingModal = ({ isOpen, onClose, contractId }: MeterReadingModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    leituraDeclarada: '',
    horaDeclarada: '',
    leituraApurada: '',
    horaApurada: '',
  });

  const [images, setImages] = useState<ImageData[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [licenseId, setLicenseId] = useState<string | null>(null);
  const [previousReading, setPreviousReading] = useState<{
    hidrometro: number | null;
    horimetro: number | null;
  } | null>(null);

  // Buscar licenca_id do contrato e leitura anterior
  useEffect(() => {
    if (isOpen && contractId) {
      const fetchContractData = async () => {
        try {
          // Buscar licenca_id do contrato
          const { data: contract, error: contractError } = await supabase
            .from('contratos')
            .select('licenca_id')
            .eq('id', contractId)
            .single();

          if (contractError) {
            console.error('Error fetching contract:', contractError);
            return;
          }

          if (contract?.licenca_id) {
            setLicenseId(contract.licenca_id);

            // Buscar última leitura do mês anterior
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();
            
            // Buscar leitura do mês anterior
            let previousMonth = currentMonth - 1;
            let previousYear = currentYear;
            if (previousMonth === 0) {
              previousMonth = 12;
              previousYear = currentYear - 1;
            }

            const { data: previousMonitoramento } = await supabase
              .from('monitoramentos')
              .select('hidrometro_leitura_atual, horimetro_leitura_atual')
              .eq('licenca_id', contract.licenca_id)
              .eq('mes', previousMonth)
              .eq('ano', previousYear)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (previousMonitoramento) {
              setPreviousReading({
                hidrometro: previousMonitoramento.hidrometro_leitura_atual,
                horimetro: previousMonitoramento.horimetro_leitura_atual,
              });
            }
          }
        } catch (error) {
          console.error('Error fetching contract data:', error);
        }
      };

      fetchContractData();
    }
  }, [isOpen, contractId]);

  // Autosave hook
  const autosaveKey = useMemo(() => `meter_draft_${contractId}`, [contractId]);
  const { restoreDraft, clearDraft } = useFormAutosave(autosaveKey, formData, {
    enabled: isOpen,
  });

  // Restaurar rascunho ao abrir o modal
  useEffect(() => {
    if (!isOpen) return;

    const draft = restoreDraft();
    if (draft) {
      setFormData(draft);
      toast({
        title: 'Rascunho restaurado',
        description: 'Os dados do formulário foram recuperados.',
      });
    }
  }, [isOpen, restoreDraft, toast]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const newImages: ImageData[] = [];

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Formato inválido',
          description: `${file.name}: Por favor, envie uma imagem (PNG, JPG, JPEG).`,
          variant: 'destructive',
        });
        return;
      }

      // Validate file size
      if (file.size > maxSize) {
        toast({
          title: 'Arquivo muito grande',
          description: `${file.name}: A imagem deve ter no máximo 10MB.`,
          variant: 'destructive',
        });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData: ImageData = {
          file,
          preview: reader.result as string,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        setImages((prev) => [...prev, imageData]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleViewImage = (imagePreview: string) => {
    window.open(imagePreview, '_blank');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Leitura Apurada é obrigatória
    if (!formData.leituraApurada) {
      newErrors.leituraApurada = 'Leitura Apurada é obrigatória';
    } else if (isNaN(Number(formData.leituraApurada)) || Number(formData.leituraApurada) < 0) {
      newErrors.leituraApurada = 'Deve ser um número positivo';
    }

    // Hora Apurada é obrigatória
    if (!formData.horaApurada) {
      newErrors.horaApurada = 'Hora Apurada é obrigatória';
    } else if (isNaN(Number(formData.horaApurada)) || Number(formData.horaApurada) < 0) {
      newErrors.horaApurada = 'Deve ser um número positivo';
    }

    // Validate optional numeric fields
    if (formData.leituraDeclarada && isNaN(Number(formData.leituraDeclarada))) {
      newErrors.leituraDeclarada = 'Deve ser um número válido';
    }

    if (formData.horaDeclarada && isNaN(Number(formData.horaDeclarada))) {
      newErrors.horaDeclarada = 'Deve ser um número válido';
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

    if (!licenseId || !user) {
      toast({
        title: 'Erro',
        description: 'Não foi possível identificar a licença ou o usuário.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const now = new Date();
      const mes = now.getMonth() + 1;
      const ano = now.getFullYear();
      const dataLeitura = now.toISOString().split('T')[0];

      // Calcular consumo e horas de operação
      const hidrometroLeituraAtual = parseFloat(formData.leituraApurada);
      const horimetroLeituraAtual = parseFloat(formData.horaApurada);
      
      const hidrometroLeituraAnterior = previousReading?.hidrometro || 
        (formData.leituraDeclarada ? parseFloat(formData.leituraDeclarada) : null);
      const horimetroLeituraAnterior = previousReading?.horimetro || 
        (formData.horaDeclarada ? parseFloat(formData.horaDeclarada) : null);

      const hidrometroConsumo = hidrometroLeituraAnterior !== null 
        ? hidrometroLeituraAtual - hidrometroLeituraAnterior 
        : null;
      const horimetroHorasOperacao = horimetroLeituraAnterior !== null 
        ? horimetroLeituraAtual - horimetroLeituraAnterior 
        : null;

      // Inserir monitoramento
      // IMPORTANTE: usuario_id deve ser auth.uid() (user.id) para satisfazer a RLS policy
      // A RLS policy espera: usuario_id = auth.uid()
      const { error: insertError } = await supabase
        .from('monitoramentos')
        .insert({
          licenca_id: licenseId,
          usuario_id: user.id, // Usar auth.uid() diretamente, não o ID da tabela usuarios
          mes,
          ano,
          data_leitura: dataLeitura,
          hidrometro_leitura_anterior: hidrometroLeituraAnterior,
          hidrometro_leitura_atual: hidrometroLeituraAtual,
          hidrometro_consumo: hidrometroConsumo,
          horimetro_leitura_anterior: horimetroLeituraAnterior,
          horimetro_leitura_atual: horimetroLeituraAtual,
          horimetro_horas_operacao: horimetroHorasOperacao,
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: 'Leituras registradas com sucesso!',
        description: `As leituras foram registradas para o contrato ${contractId}.`,
        variant: 'default',
      });

      handleClose();
    } catch (error: any) {
      console.error('Error saving meter reading:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar as leituras. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
    // Limpar rascunho
    clearDraft();
    handleClose();
  };

  const handleRequestNewMeasurement = () => {
    toast({
      title: 'Nova medição solicitada',
      description: 'Uma solicitação de nova medição foi enviada.',
      variant: 'default',
    });
    clearDraft();
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      leituraDeclarada: '',
      horaDeclarada: '',
      leituraApurada: '',
      horaApurada: '',
    });
    setImages([]);
    setErrors({});
    setLicenseId(null);
    setPreviousReading(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center">
              <Gauge className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Apurar Hidrômetro e Horímetro do Mês de Agosto</DialogTitle>
              <DialogDescription>Registre as leituras e envie as imagens comprobatórias</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Upload de Imagens */}
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleImageChange}
              multiple
              className="hidden"
              id="images-upload"
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-16 border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50"
            >
              <Upload className="h-5 w-5 mr-2 text-gray-400" />
              <span className="text-gray-600">
                {images.length === 0
                  ? 'Selecionar imagens (clique ou arraste)'
                  : `${images.length} ${images.length === 1 ? 'imagem selecionada' : 'imagens selecionadas'} - Clique para adicionar mais`}
              </span>
            </Button>

            {/* Lista de Imagens */}
            {images.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={image.preview}
                        alt={`Preview ${index + 1}`}
                        className="h-12 w-12 object-cover rounded"
                      />
                      <span className="text-sm text-gray-700 font-medium">{image.file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewImage(image.preview)}
                        className="h-8 w-8 p-0"
                        title="Visualizar imagem"
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveImage(image.id)}
                        className="h-8 w-8 p-0"
                        title="Remover imagem"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leituras */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Leitura Declarada */}
            <div className="space-y-2">
              <Label htmlFor="leituraDeclarada" className="text-sm font-medium">
                Leitura Declarada
              </Label>
              <Input
                id="leituraDeclarada"
                type="number"
                step="0.01"
                value={formData.leituraDeclarada}
                onChange={(e) => handleInputChange('leituraDeclarada', e.target.value)}
                placeholder="110239"
                className={`h-11 ${errors.leituraDeclarada ? 'border-red-500' : ''}`}
              />
              {errors.leituraDeclarada && (
                <p className="text-xs text-red-500">{errors.leituraDeclarada}</p>
              )}
            </div>

            {/* Hora Declarada */}
            <div className="space-y-2">
              <Label htmlFor="horaDeclarada" className="text-sm font-medium">
                Hora Declarada
              </Label>
              <Input
                id="horaDeclarada"
                type="number"
                step="0.01"
                value={formData.horaDeclarada}
                onChange={(e) => handleInputChange('horaDeclarada', e.target.value)}
                placeholder="4271.46"
                className={`h-11 ${errors.horaDeclarada ? 'border-red-500' : ''}`}
              />
              {errors.horaDeclarada && (
                <p className="text-xs text-red-500">{errors.horaDeclarada}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Leitura Apurada */}
            <div className="space-y-2">
              <Label htmlFor="leituraApurada" className="text-sm font-medium">
                Leitura Apurada *
              </Label>
              <Input
                id="leituraApurada"
                type="number"
                step="0.01"
                value={formData.leituraApurada}
                onChange={(e) => handleInputChange('leituraApurada', e.target.value)}
                placeholder="110239"
                className={`h-11 ${errors.leituraApurada ? 'border-red-500' : ''}`}
                required
              />
              {errors.leituraApurada && (
                <p className="text-xs text-red-500">{errors.leituraApurada}</p>
              )}
            </div>

            {/* Hora Apurada */}
            <div className="space-y-2">
              <Label htmlFor="horaApurada" className="text-sm font-medium">
                Hora Apurada *
              </Label>
              <Input
                id="horaApurada"
                type="number"
                step="0.01"
                value={formData.horaApurada}
                onChange={(e) => handleInputChange('horaApurada', e.target.value)}
                placeholder="4271.46"
                className={`h-11 ${errors.horaApurada ? 'border-red-500' : ''}`}
                required
              />
              {errors.horaApurada && (
                <p className="text-xs text-red-500">{errors.horaApurada}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleRequestNewMeasurement}
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            >
              Solicitar Nova Medição
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MeterReadingModal;
