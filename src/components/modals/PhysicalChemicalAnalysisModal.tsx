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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Beaker } from 'lucide-react';
import {
  TIPOS_COLETA,
  PARAMETROS_FISICO_QUIMICOS,
  PARAMETROS_BACTERIOLOGICOS,
  PARAMETROS_BTEX,
  PARAMETROS_OLEOS_DIESEL,
  type AnalysisParameter,
} from '@/constants/analysisParameters';
import {
  createAnalysis,
  updateAnalysis,
  getAnalysisById,
  mapAnalysisToFormData,
  type AnalysisFormData,
} from '@/services/analysisService';

interface PhysicalChemicalAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  licenseId: string;
  analysisId?: string; // Se fornecido, modo edição
  onSuccess?: () => void;
}

const PhysicalChemicalAnalysisModal = ({
  isOpen,
  onClose,
  contractId,
  licenseId,
  analysisId,
  onSuccess,
}: PhysicalChemicalAnalysisModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState<AnalysisFormData>({
    responsavel_coleta: '',
    identificacao_profissional: '',
    laboratorio: '',
    data_entrada_laboratorio: '',
    data_coleta: '',
    hora_coleta: '',
    temperatura_ambiente: null,
    temperatura_amostra: null,
    tipo_coleta: '',
    codigo_amostra: '',
    observacoes: '',
    parametros: {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carregar dados se for modo edição
  useEffect(() => {
    const loadAnalysis = async () => {
      if (!isOpen || !analysisId) return;

      setIsLoading(true);
      try {
        const analysis = await getAnalysisById(analysisId);
        if (analysis) {
          const mappedData = mapAnalysisToFormData(analysis);
          setFormData(mappedData);
        }
      } catch (error) {
        console.error('Erro ao carregar análise:', error);
        toast({
          title: 'Erro ao carregar análise',
          description: 'Não foi possível carregar os dados da análise.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalysis();
  }, [isOpen, analysisId, toast]);

  const handleInputChange = (field: keyof AnalysisFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpar erro quando usuário começa a digitar
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleParameterChange = (key: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      parametros: {
        ...prev.parametros,
        [key]: numValue,
      },
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Campos obrigatórios (CA 02)
    if (!formData.responsavel_coleta) {
      newErrors.responsavel_coleta = 'Campo obrigatório não preenchido';
    }
    if (!formData.identificacao_profissional) {
      newErrors.identificacao_profissional = 'Campo obrigatório não preenchido';
    }
    if (!formData.laboratorio) {
      newErrors.laboratorio = 'Campo obrigatório não preenchido';
    }
    if (!formData.data_entrada_laboratorio) {
      newErrors.data_entrada_laboratorio = 'Campo obrigatório não preenchido';
    }
    if (!formData.data_coleta) {
      newErrors.data_coleta = 'Campo obrigatório não preenchido';
    }
    if (!formData.hora_coleta) {
      newErrors.hora_coleta = 'Campo obrigatório não preenchido';
    }
    if (formData.temperatura_ambiente === null) {
      newErrors.temperatura_ambiente = 'Campo obrigatório não preenchido';
    }
    if (formData.temperatura_amostra === null) {
      newErrors.temperatura_amostra = 'Campo obrigatório não preenchido';
    }
    if (!formData.tipo_coleta) {
      newErrors.tipo_coleta = 'Campo obrigatório não preenchido';
    }
    if (!formData.codigo_amostra) {
      newErrors.codigo_amostra = 'Campo obrigatório não preenchido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (analysisId) {
        // Modo edição
        await updateAnalysis(analysisId, formData);
        toast({
          title: 'Análise atualizada com sucesso!',
          description: 'Os dados foram salvos.',
        });
      } else {
        // Modo criação
        await createAnalysis(contractId, licenseId, formData);
        toast({
          title: 'Análise registrada com sucesso!',
          description: `A análise físico-química e bacteriológica foi registrada.`,
        });
      }

      if (onSuccess) {
        onSuccess();
      }
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar análise:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a análise. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      responsavel_coleta: '',
      identificacao_profissional: '',
      laboratorio: '',
      data_entrada_laboratorio: '',
      data_coleta: '',
      hora_coleta: '',
      temperatura_ambiente: null,
      temperatura_amostra: null,
      tipo_coleta: '',
      codigo_amostra: '',
      observacoes: '',
      parametros: {},
    });
    setErrors({});
    onClose();
  };

  const renderParameterRow = (param: AnalysisParameter) => {
    return (
      <div key={param.key} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        <div className="space-y-2 md:col-span-1">
          <Label className="text-sm font-medium text-gray-700">{param.nome}</Label>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-gray-500">Valor a Informar</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.parametros[param.key] ?? ''}
            onChange={(e) => handleParameterChange(param.key, e.target.value)}
            placeholder="Informe o valor"
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-gray-500">Valor de Referência {param.unidade && `(${param.unidade})`}</Label>
          <Input
            value={param.valor_referencia}
            disabled
            className="h-10 bg-gray-50 text-gray-600 cursor-not-allowed"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-gray-500">Metodologia</Label>
          <Input
            value={param.metodologia}
            disabled
            className="h-10 bg-gray-50 text-gray-600 cursor-not-allowed"
          />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Carregando...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center">
              <Beaker className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl">
                {analysisId ? 'Editar' : 'Cadastrar'} Análise Físico-Química e Bacteriológica
              </DialogTitle>
              <DialogDescription>
                {analysisId ? 'Atualize' : 'Registre'} os dados da análise de qualidade da água
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Seção: Informações Gerais da Coleta */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-emerald-600" />
              Informações Gerais da Coleta
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responsavel_coleta" className="text-sm font-medium">
                  Responsável pela Coleta *
                </Label>
                <Input
                  id="responsavel_coleta"
                  type="text"
                  value={formData.responsavel_coleta}
                  onChange={(e) => handleInputChange('responsavel_coleta', e.target.value)}
                  placeholder="Nome do responsável"
                  className={`h-11 ${errors.responsavel_coleta ? 'border-red-500' : ''}`}
                />
                {errors.responsavel_coleta && (
                  <p className="text-xs text-red-500">{errors.responsavel_coleta}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="identificacao_profissional" className="text-sm font-medium">
                  Identificação do Profissional *
                </Label>
                <Input
                  id="identificacao_profissional"
                  type="text"
                  value={formData.identificacao_profissional}
                  onChange={(e) => handleInputChange('identificacao_profissional', e.target.value)}
                  placeholder="Registro/identificação"
                  className={`h-11 ${errors.identificacao_profissional ? 'border-red-500' : ''}`}
                />
                {errors.identificacao_profissional && (
                  <p className="text-xs text-red-500">{errors.identificacao_profissional}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="laboratorio" className="text-sm font-medium">
                  Laboratório Responsável *
                </Label>
                <Input
                  id="laboratorio"
                  type="text"
                  value={formData.laboratorio}
                  onChange={(e) => handleInputChange('laboratorio', e.target.value)}
                  placeholder="Nome do laboratório"
                  className={`h-11 ${errors.laboratorio ? 'border-red-500' : ''}`}
                />
                {errors.laboratorio && (
                  <p className="text-xs text-red-500">{errors.laboratorio}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_entrada_laboratorio" className="text-sm font-medium">
                  Data de Entrada no Laboratório *
                </Label>
                <Input
                  id="data_entrada_laboratorio"
                  type="date"
                  value={formData.data_entrada_laboratorio}
                  onChange={(e) => handleInputChange('data_entrada_laboratorio', e.target.value)}
                  className={`h-11 ${errors.data_entrada_laboratorio ? 'border-red-500' : ''}`}
                />
                {errors.data_entrada_laboratorio && (
                  <p className="text-xs text-red-500">{errors.data_entrada_laboratorio}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_coleta" className="text-sm font-medium">
                  Data da Coleta *
                </Label>
                <Input
                  id="data_coleta"
                  type="date"
                  value={formData.data_coleta}
                  onChange={(e) => handleInputChange('data_coleta', e.target.value)}
                  className={`h-11 ${errors.data_coleta ? 'border-red-500' : ''}`}
                />
                {errors.data_coleta && (
                  <p className="text-xs text-red-500">{errors.data_coleta}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hora_coleta" className="text-sm font-medium">
                  Hora da Coleta *
                </Label>
                <Input
                  id="hora_coleta"
                  type="time"
                  value={formData.hora_coleta}
                  onChange={(e) => handleInputChange('hora_coleta', e.target.value)}
                  className={`h-11 ${errors.hora_coleta ? 'border-red-500' : ''}`}
                />
                {errors.hora_coleta && (
                  <p className="text-xs text-red-500">{errors.hora_coleta}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperatura_ambiente" className="text-sm font-medium">
                  Temperatura Ambiente (°C) *
                </Label>
                <Input
                  id="temperatura_ambiente"
                  type="number"
                  step="0.1"
                  value={formData.temperatura_ambiente ?? ''}
                  onChange={(e) => handleInputChange('temperatura_ambiente', e.target.value === '' ? null : parseFloat(e.target.value))}
                  placeholder="Ex: 25.5"
                  className={`h-11 ${errors.temperatura_ambiente ? 'border-red-500' : ''}`}
                />
                {errors.temperatura_ambiente && (
                  <p className="text-xs text-red-500">{errors.temperatura_ambiente}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperatura_amostra" className="text-sm font-medium">
                  Temperatura da Amostra (°C) *
                </Label>
                <Input
                  id="temperatura_amostra"
                  type="number"
                  step="0.1"
                  value={formData.temperatura_amostra ?? ''}
                  onChange={(e) => handleInputChange('temperatura_amostra', e.target.value === '' ? null : parseFloat(e.target.value))}
                  placeholder="Ex: 23.0"
                  className={`h-11 ${errors.temperatura_amostra ? 'border-red-500' : ''}`}
                />
                {errors.temperatura_amostra && (
                  <p className="text-xs text-red-500">{errors.temperatura_amostra}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_coleta" className="text-sm font-medium">
                  Tipo de Coleta *
                </Label>
                <Select
                  value={formData.tipo_coleta}
                  onValueChange={(value) => handleInputChange('tipo_coleta', value)}
                >
                  <SelectTrigger className={`h-11 ${errors.tipo_coleta ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_COLETA.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tipo_coleta && (
                  <p className="text-xs text-red-500">{errors.tipo_coleta}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo_amostra" className="text-sm font-medium">
                  Código da Amostra *
                </Label>
                <Input
                  id="codigo_amostra"
                  type="text"
                  value={formData.codigo_amostra}
                  onChange={(e) => handleInputChange('codigo_amostra', e.target.value)}
                  placeholder="Ex: AMT-2024-001"
                  className={`h-11 ${errors.codigo_amostra ? 'border-red-500' : ''}`}
                />
                {errors.codigo_amostra && (
                  <p className="text-xs text-red-500">{errors.codigo_amostra}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Seção: Parâmetros organizados em Accordion */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-emerald-600" />
              Parâmetros de Análise
            </h3>

            <Accordion type="multiple" className="w-full" defaultValue={['grupo1']}>
              {/* Grupo 1: Parâmetros Físico-Químicos */}
              <AccordionItem value="grupo1">
                <AccordionTrigger className="text-base font-semibold text-gray-800">
                  Grupo 1 - Parâmetros Físico-Químicos ({PARAMETROS_FISICO_QUIMICOS.length} parâmetros)
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    {PARAMETROS_FISICO_QUIMICOS.map((param) => renderParameterRow(param))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Grupo 2: Parâmetros Bacteriológicos */}
              <AccordionItem value="grupo2">
                <AccordionTrigger className="text-base font-semibold text-gray-800">
                  Grupo 2 - Parâmetros Bacteriológicos ({PARAMETROS_BACTERIOLOGICOS.length} parâmetros)
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    {PARAMETROS_BACTERIOLOGICOS.map((param) => renderParameterRow(param))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Grupo 3: Parâmetros Específicos – Grupo BTEX */}
              <AccordionItem value="grupo3">
                <AccordionTrigger className="text-base font-semibold text-gray-800">
                  Grupo 3 - Parâmetros Específicos – Grupo BTEX ({PARAMETROS_BTEX.length} parâmetros)
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    {PARAMETROS_BTEX.map((param) => renderParameterRow(param))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Grupo 4: Parâmetros Específicos – Óleos e Diesel */}
              <AccordionItem value="grupo4">
                <AccordionTrigger className="text-base font-semibold text-gray-800">
                  Grupo 4 - Parâmetros Específicos – Óleos e Diesel ({PARAMETROS_OLEOS_DIESEL.length} parâmetro)
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    {PARAMETROS_OLEOS_DIESEL.map((param) => renderParameterRow(param))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <Separator />

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-sm font-medium">
              Observações
            </Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações adicionais sobre a análise..."
              className="min-h-[100px] resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800"
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar Análise'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PhysicalChemicalAnalysisModal;
