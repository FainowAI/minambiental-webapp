import { useState, useRef, useEffect, useMemo } from 'react';
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
import { checkRequerenteReading, type RequerenteReading } from '@/services/monitoringService';
import { createNotificationForRequerente } from '@/services/notificationService';

interface MeterReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenseId: string;
  existingApuracaoId?: string | null;
}

interface ImageData {
  file: File;
  preview: string;
  id: string;
}

const MeterReadingModal = ({ isOpen, onClose, licenseId, existingApuracaoId }: MeterReadingModalProps) => {
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
  const [requerenteImages, setRequerenteImages] = useState<string[]>([]);
  const [existingApuracaoImages, setExistingApuracaoImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [requerenteReading, setRequerenteReading] = useState<RequerenteReading | null>(null);
  const [requerenteReadingId, setRequerenteReadingId] = useState<string | null>(null);
  const [previousReading, setPreviousReading] = useState<{
    hidrometro: number | null;
    horimetro: number | null;
  } | null>(null);

  // Buscar leitura do requerente e leitura anterior
  useEffect(() => {
    if (isOpen && licenseId) {
      const fetchReadingData = async () => {
        setIsLoadingData(true);
        try {
          // Buscar leitura do requerente do mês atual
          const requerenteReadingData = await checkRequerenteReading(licenseId);
          if (requerenteReadingData) {
            setRequerenteReading(requerenteReadingData);
            setRequerenteReadingId(requerenteReadingData.id);
            
            // Preencher campos declarados com dados do requerente
            setFormData((prev) => ({
              ...prev,
              leituraDeclarada: requerenteReadingData.hidrometro_leitura_atual?.toFixed(2) || '',
              horaDeclarada: requerenteReadingData.horimetro_leitura_atual?.toFixed(2) || '',
            }));

            // Buscar imagens do requerente (se houver campo de imagem)
            // Por enquanto, vamos usar o campo observacoes se contiver URLs de imagens
            // ou podemos criar uma tabela separada para imagens
            if (requerenteReadingData.observacoes) {
              try {
                const parsed = JSON.parse(requerenteReadingData.observacoes);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  // Verificar se são URLs válidas
                  const validUrls = parsed.filter((url: any) => 
                    typeof url === 'string' && (url.startsWith('http') || url.startsWith('data:'))
                  );
                  if (validUrls.length > 0) {
                    setRequerenteImages(validUrls);
                  }
                }
              } catch {
                // Se não for JSON, verificar se é uma URL única
                if (requerenteReadingData.observacoes.startsWith('http') || 
                    requerenteReadingData.observacoes.startsWith('data:')) {
                  setRequerenteImages([requerenteReadingData.observacoes]);
                }
              }
            }
          }

          // Buscar última leitura do mês anterior (para cálculo de consumo)
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
            .eq('licenca_id', licenseId)
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

          // Se existir apuração, carregar seus dados
          if (existingApuracaoId) {
            const { data: apuracaoData, error: apuracaoError } = await supabase
              .from('monitoramentos')
              .select('hidrometro_leitura_atual, horimetro_leitura_atual, observacoes')
              .eq('id', existingApuracaoId)
              .single();

            if (apuracaoError) {
              console.error('Error fetching existing apuracao:', apuracaoError);
            } else if (apuracaoData) {
              // Preencher campos apurados com valores existentes
              setFormData((prev) => ({
                ...prev,
                leituraApurada: apuracaoData.hidrometro_leitura_atual?.toFixed(2) || '',
                horaApurada: apuracaoData.horimetro_leitura_atual?.toFixed(2) || '',
              }));

              // Carregar imagens da apuração existente
              if (apuracaoData.observacoes) {
                try {
                  const parsed = JSON.parse(apuracaoData.observacoes);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    const validUrls = parsed.filter((url: any) => 
                      typeof url === 'string' && (url.startsWith('http') || url.startsWith('data:'))
                    );
                    if (validUrls.length > 0) {
                      setExistingApuracaoImages(validUrls);
                    }
                  }
                } catch {
                  if (apuracaoData.observacoes.startsWith('http') || 
                      apuracaoData.observacoes.startsWith('data:')) {
                    setExistingApuracaoImages([apuracaoData.observacoes]);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching reading data:', error);
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar os dados da leitura.',
            variant: 'destructive',
          });
        } finally {
          setIsLoadingData(false);
        }
      };

      fetchReadingData();
    }
  }, [isOpen, licenseId, existingApuracaoId, toast]);

  // Autosave hook
  const autosaveKey = useMemo(() => `meter_draft_${licenseId}`, [licenseId]);
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
    if (!formData.leituraApurada || formData.leituraApurada.trim() === '') {
      newErrors.leituraApurada = 'Campo Obrigatório';
    } else if (isNaN(Number(formData.leituraApurada)) || Number(formData.leituraApurada) < 0) {
      newErrors.leituraApurada = 'Deve ser um número positivo';
    }

    // Hora Apurada é obrigatória
    if (!formData.horaApurada || formData.horaApurada.trim() === '') {
      newErrors.horaApurada = 'Campo Obrigatório';
    } else if (isNaN(Number(formData.horaApurada)) || Number(formData.horaApurada) < 0) {
      newErrors.horaApurada = 'Deve ser um número positivo';
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
      
      // Usar leitura do requerente como anterior, ou leitura do mês anterior
      const hidrometroLeituraAnterior = requerenteReading?.hidrometro_leitura_atual || 
        previousReading?.hidrometro || null;
      const horimetroLeituraAnterior = requerenteReading?.horimetro_leitura_atual || 
        previousReading?.horimetro || null;

      const hidrometroConsumo = hidrometroLeituraAnterior !== null 
        ? hidrometroLeituraAtual - hidrometroLeituraAnterior 
        : null;
      const horimetroHorasOperacao = horimetroLeituraAnterior !== null 
        ? horimetroLeituraAtual - horimetroLeituraAnterior 
        : null;

      // Preparar imagens para salvar (novas imagens + imagens existentes da apuração)
      const newImageUrls: string[] = images.map((img) => img.preview);
      const allImageUrls = existingApuracaoId 
        ? [...existingApuracaoImages, ...newImageUrls]
        : newImageUrls;

      if (existingApuracaoId) {
        // Modo edição: UPDATE na apuração existente
        const { error: updateError } = await supabase
          .from('monitoramentos')
          .update({
            data_leitura: dataLeitura,
            hidrometro_leitura_anterior: hidrometroLeituraAnterior,
            hidrometro_leitura_atual: hidrometroLeituraAtual,
            hidrometro_consumo: hidrometroConsumo,
            horimetro_leitura_anterior: horimetroLeituraAnterior,
            horimetro_leitura_atual: horimetroLeituraAtual,
            horimetro_horas_operacao: horimetroHorasOperacao,
            status: 'finalizado',
            observacoes: allImageUrls.length > 0 ? JSON.stringify(allImageUrls) : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingApuracaoId);

        if (updateError) {
          throw updateError;
        }

        toast({
          title: 'Apuração atualizada com sucesso!',
          description: `As leituras foram atualizadas para a licença.`,
          variant: 'default',
        });
      } else {
        // Modo criação: INSERT novo monitoramento
        // IMPORTANTE: usuario_id deve ser auth.uid() (user.id) para satisfazer a RLS policy
        const { error: insertError } = await supabase
          .from('monitoramentos')
          .insert({
            licenca_id: licenseId,
            usuario_id: user.id,
            mes,
            ano,
            data_leitura: dataLeitura,
            hidrometro_leitura_anterior: hidrometroLeituraAnterior,
            hidrometro_leitura_atual: hidrometroLeituraAtual,
            hidrometro_consumo: hidrometroConsumo,
            horimetro_leitura_anterior: horimetroLeituraAnterior,
            horimetro_leitura_atual: horimetroLeituraAtual,
            horimetro_horas_operacao: horimetroHorasOperacao,
            status: 'finalizado',
            observacoes: allImageUrls.length > 0 ? JSON.stringify(allImageUrls) : null,
          });

        if (insertError) {
          throw insertError;
        }

        // Atualizar status da leitura do requerente para "aprovado"
        if (requerenteReadingId) {
          await supabase
            .from('monitoramentos')
            .update({ status: 'aprovado' })
            .eq('id', requerenteReadingId);
        }

        toast({
          title: 'Leituras registradas com sucesso!',
          description: `As leituras foram registradas para a licença.`,
          variant: 'default',
        });
      }

      // Limpar rascunho
      clearDraft();
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
  };

  const handleRequestNewMeasurement = async () => {
    if (!requerenteReadingId || !licenseId) {
      toast({
        title: 'Erro',
        description: 'Não foi possível identificar a leitura do requerente.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Atualizar status da leitura do requerente para "pendente_edicao"
      const { error: updateError } = await supabase
        .from('monitoramentos')
        .update({ status: 'pendente_edicao' })
        .eq('id', requerenteReadingId);

      if (updateError) {
        throw updateError;
      }

      // Criar notificação para o requerente
      // Buscar auth_user_id do requerente através da leitura
      const { data: monitoramento } = await supabase
        .from('monitoramentos')
        .select('usuario_id')
        .eq('id', requerenteReadingId)
        .single();

      if (monitoramento?.usuario_id) {
        await createNotificationForRequerente(
          monitoramento.usuario_id,
          licenseId,
          'Nova edição solicitada',
          'O corpo técnico solicitou uma nova edição da leitura mensal. Por favor, revise e atualize os dados.'
        );
      }

      toast({
        title: 'Nova edição solicitada',
        description: 'A solicitação foi enviada ao requerente via notificação.',
        variant: 'default',
      });

      handleClose();
    } catch (error: any) {
      console.error('Error requesting new measurement:', error);
      toast({
        title: 'Erro ao solicitar nova edição',
        description: error.message || 'Não foi possível solicitar a nova edição.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      leituraDeclarada: '',
      horaDeclarada: '',
      leituraApurada: '',
      horaApurada: '',
    });
    setImages([]);
    setRequerenteImages([]);
    setExistingApuracaoImages([]);
    setErrors({});
    setRequerenteReading(null);
    setRequerenteReadingId(null);
    setPreviousReading(null);
    setIsLoading(false);
    setIsLoadingData(false);
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
              <DialogTitle className="text-2xl">
                {existingApuracaoId 
                  ? `Editar Apuração - Mês de ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
                  : `Apurar Hidrômetro e Horímetro do Mês de ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
                }
              </DialogTitle>
              <DialogDescription>
                Revise os dados declarados pelo requerente e registre as leituras apuradas
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <span className="ml-3 text-gray-600">Carregando dados da leitura...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Imagens do Requerente */}
            {requerenteImages.length > 0 && (
              <div className="space-y-4">
                <Label className="text-sm font-medium">Imagens da Leitura do Requerente</Label>
                <div className="grid grid-cols-2 gap-4">
                  {requerenteImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Leitura requerente ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(imageUrl, '_blank')}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Imagens da Apuração Existente (somente em modo edição) */}
            {existingApuracaoId && existingApuracaoImages.length > 0 && (
              <div className="space-y-4">
                <Label className="text-sm font-medium">Imagens da Apuração Atual</Label>
                <div className="grid grid-cols-2 gap-4">
                  {existingApuracaoImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Apuração atual ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-emerald-200"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(imageUrl, '_blank')}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload de Imagens Adicionais */}
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

            <Label className="text-sm font-medium">Adicionar Imagens Comprobatórias (Opcional)</Label>
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

          {/* Leituras Declaradas (Somente Leitura) */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Leituras Declaradas pelo Requerente</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Leitura Declarada */}
              <div className="space-y-2">
                <Label htmlFor="leituraDeclarada" className="text-sm font-medium">
                  Leitura Declarada (Hidrômetro)
                </Label>
                <Input
                  id="leituraDeclarada"
                  type="number"
                  step="0.01"
                  value={formData.leituraDeclarada}
                  disabled
                  placeholder="Não informado"
                  className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                />
              </div>

              {/* Hora Declarada */}
              <div className="space-y-2">
                <Label htmlFor="horaDeclarada" className="text-sm font-medium">
                  Hora Declarada (Horímetro)
                </Label>
                <Input
                  id="horaDeclarada"
                  type="number"
                  step="0.01"
                  value={formData.horaDeclarada}
                  disabled
                  placeholder="Não informado"
                  className="h-11 bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Leituras Apuradas (Preenchimento Obrigatório) */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Leituras Apuradas pelo Corpo Técnico</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Leitura Apurada */}
              <div className="space-y-2">
                <Label htmlFor="leituraApurada" className="text-sm font-medium">
                  Leitura Apurada (Hidrômetro) *
                </Label>
                <Input
                  id="leituraApurada"
                  type="number"
                  step="0.01"
                  value={formData.leituraApurada}
                  onChange={(e) => handleInputChange('leituraApurada', e.target.value)}
                  placeholder="0.00"
                  className={`h-11 ${errors.leituraApurada ? 'border-red-500' : ''}`}
                  required
                />
                {errors.leituraApurada && (
                  <p className="text-xs text-red-500 font-medium">{errors.leituraApurada}</p>
                )}
              </div>

              {/* Hora Apurada */}
              <div className="space-y-2">
                <Label htmlFor="horaApurada" className="text-sm font-medium">
                  Hora Apurada (Horímetro) *
                </Label>
                <Input
                  id="horaApurada"
                  type="number"
                  step="0.01"
                  value={formData.horaApurada}
                  onChange={(e) => handleInputChange('horaApurada', e.target.value)}
                  placeholder="0.00"
                  className={`h-11 ${errors.horaApurada ? 'border-red-500' : ''}`}
                  required
                />
                {errors.horaApurada && (
                  <p className="text-xs text-red-500 font-medium">{errors.horaApurada}</p>
                )}
              </div>
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
              disabled={isLoading || !requerenteReadingId}
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Solicitando...
                </>
              ) : (
                'Solicitar Nova Edição'
              )}
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MeterReadingModal;
