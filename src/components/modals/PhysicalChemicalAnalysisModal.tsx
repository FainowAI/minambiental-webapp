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
import { Beaker } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface PhysicalChemicalAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
}

const PhysicalChemicalAnalysisModal = ({
  isOpen,
  onClose,
  contractId,
}: PhysicalChemicalAnalysisModalProps) => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    // Informações Gerais
    responsavelColeta: '',
    indProfissional: '',
    laboratorio: '',
    dataEntradaLaboratorio: '',
    dataColeta: '',
    horaColeta: '',
    temperaturaAmbiente: '',
    temperaturaAmostra: '',
    condicoesTempo: '',
    codigoAmostra: '',

    // Parâmetros - Temperatura da Água
    resultadoTemperaturaAgua: '',
    valoresRefTemperaturaAgua: '',
    metodologiaTemperaturaAgua: '',

    // Parâmetros - Cor
    resultadoCor: '',
    valoresRefCor: '',
    metodologiaCor: '',

    // Parâmetros - Turbidez
    resultadoTurbidez: '',
    valoresRefTurbidez: '',
    metodologiaTurbidez: '',

    // Parâmetros - pH
    resultadoPh: '',
    valoresRefPh: '',
    metodologiaPh: '',
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

    // Data de coleta é obrigatória
    if (!formData.dataColeta) {
      newErrors.dataColeta = 'Data de coleta é obrigatória';
    }

    // Validate numeric fields
    const numericFields = [
      'temperaturaAmbiente',
      'temperaturaAmostra',
      'resultadoTemperaturaAgua',
      'resultadoCor',
      'resultadoTurbidez',
      'resultadoPh',
    ];

    numericFields.forEach((field) => {
      const value = formData[field as keyof typeof formData];
      if (value && isNaN(Number(value))) {
        newErrors[field] = 'Deve ser um número válido';
      }
    });

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
      title: 'Análise registrada com sucesso!',
      description: `A análise físico-química foi registrada para o contrato ${contractId}.`,
      variant: 'default',
    });

    // Reset form and close
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      responsavelColeta: '',
      indProfissional: '',
      laboratorio: '',
      dataEntradaLaboratorio: '',
      dataColeta: '',
      horaColeta: '',
      temperaturaAmbiente: '',
      temperaturaAmostra: '',
      condicoesTempo: '',
      codigoAmostra: '',
      resultadoTemperaturaAgua: '',
      valoresRefTemperaturaAgua: '',
      metodologiaTemperaturaAgua: '',
      resultadoCor: '',
      valoresRefCor: '',
      metodologiaCor: '',
      resultadoTurbidez: '',
      valoresRefTurbidez: '',
      metodologiaTurbidez: '',
      resultadoPh: '',
      valoresRefPh: '',
      metodologiaPh: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center">
              <Beaker className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Informar análise físico-química e bacteriológica</DialogTitle>
              <DialogDescription>Registre os dados da análise de qualidade da água</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Informações Gerais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Informações Gerais</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responsavelColeta" className="text-sm font-medium">
                  Responsável pela Coleta
                </Label>
                <Input
                  id="responsavelColeta"
                  type="text"
                  value={formData.responsavelColeta}
                  onChange={(e) => handleInputChange('responsavelColeta', e.target.value)}
                  placeholder="Selecione ou digite o nome"
                  className="h-11"
                  list="responsaveis-list"
                />
                <datalist id="responsaveis-list">
                  <option value="Técnico 1" />
                  <option value="Técnico 2" />
                  <option value="Técnico 3" />
                </datalist>
              </div>

              <div className="space-y-2">
                <Label htmlFor="indProfissional" className="text-sm font-medium">
                  Ind. do Profissional
                </Label>
                <Input
                  id="indProfissional"
                  type="text"
                  value={formData.indProfissional}
                  onChange={(e) => handleInputChange('indProfissional', e.target.value)}
                  placeholder="Informe o Ind. do Profissional"
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="laboratorio" className="text-sm font-medium">
                  Laboratório
                </Label>
                <Input
                  id="laboratorio"
                  type="text"
                  value={formData.laboratorio}
                  onChange={(e) => handleInputChange('laboratorio', e.target.value)}
                  placeholder="Informe o laboratório"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataEntradaLaboratorio" className="text-sm font-medium">
                  Data de Entrada no Laboratório
                </Label>
                <Input
                  id="dataEntradaLaboratorio"
                  type="date"
                  value={formData.dataEntradaLaboratorio}
                  onChange={(e) => handleInputChange('dataEntradaLaboratorio', e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataColeta" className="text-sm font-medium">
                  Data da Coleta *
                </Label>
                <Input
                  id="dataColeta"
                  type="date"
                  value={formData.dataColeta}
                  onChange={(e) => handleInputChange('dataColeta', e.target.value)}
                  className={`h-11 ${errors.dataColeta ? 'border-red-500' : ''}`}
                  required
                />
                {errors.dataColeta && (
                  <p className="text-xs text-red-500">{errors.dataColeta}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="horaColeta" className="text-sm font-medium">
                  Hora da Coleta
                </Label>
                <Input
                  id="horaColeta"
                  type="time"
                  value={formData.horaColeta}
                  onChange={(e) => handleInputChange('horaColeta', e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperaturaAmbiente" className="text-sm font-medium">
                  Temperatura Ambiente (°C)
                </Label>
                <Input
                  id="temperaturaAmbiente"
                  type="number"
                  step="0.1"
                  value={formData.temperaturaAmbiente}
                  onChange={(e) => handleInputChange('temperaturaAmbiente', e.target.value)}
                  placeholder="Informe a temperatura ambiente (°C)"
                  className={`h-11 ${errors.temperaturaAmbiente ? 'border-red-500' : ''}`}
                />
                {errors.temperaturaAmbiente && (
                  <p className="text-xs text-red-500">{errors.temperaturaAmbiente}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperaturaAmostra" className="text-sm font-medium">
                  Temperatura da Amostra (°C)
                </Label>
                <Input
                  id="temperaturaAmostra"
                  type="number"
                  step="0.1"
                  value={formData.temperaturaAmostra}
                  onChange={(e) => handleInputChange('temperaturaAmostra', e.target.value)}
                  placeholder="Informe a temperatura ambiente (°C)"
                  className={`h-11 ${errors.temperaturaAmostra ? 'border-red-500' : ''}`}
                />
                {errors.temperaturaAmostra && (
                  <p className="text-xs text-red-500">{errors.temperaturaAmostra}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="condicoesTempo" className="text-sm font-medium">
                  Condições do Tempo
                </Label>
                <Input
                  id="condicoesTempo"
                  type="text"
                  value={formData.condicoesTempo}
                  onChange={(e) => handleInputChange('condicoesTempo', e.target.value)}
                  placeholder="Informe as condições do tempo"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigoAmostra" className="text-sm font-medium">
                  Código da Amostra
                </Label>
                <Input
                  id="codigoAmostra"
                  type="text"
                  value={formData.codigoAmostra}
                  onChange={(e) => handleInputChange('codigoAmostra', e.target.value)}
                  placeholder="Informe o código da Amostra"
                  className="h-11"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Parâmetros */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Parâmetros</h3>

            {/* Temperatura da Água */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resultadoTemperaturaAgua" className="text-sm font-medium">
                  Resultado Analítico da Temperatura da Água (°C)
                </Label>
                <Input
                  id="resultadoTemperaturaAgua"
                  type="number"
                  step="0.1"
                  value={formData.resultadoTemperaturaAgua}
                  onChange={(e) => handleInputChange('resultadoTemperaturaAgua', e.target.value)}
                  placeholder="Informe"
                  className={`h-11 ${errors.resultadoTemperaturaAgua ? 'border-red-500' : ''}`}
                />
                {errors.resultadoTemperaturaAgua && (
                  <p className="text-xs text-red-500">{errors.resultadoTemperaturaAgua}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="valoresRefTemperaturaAgua" className="text-sm font-medium">
                  Valores de Referência (°C)
                </Label>
                <Input
                  id="valoresRefTemperaturaAgua"
                  type="text"
                  value={formData.valoresRefTemperaturaAgua}
                  onChange={(e) => handleInputChange('valoresRefTemperaturaAgua', e.target.value)}
                  placeholder="-"
                  className="h-11 bg-gray-100"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodologiaTemperaturaAgua" className="text-sm font-medium">
                  Metodologia
                </Label>
                <Input
                  id="metodologiaTemperaturaAgua"
                  type="text"
                  value={formData.metodologiaTemperaturaAgua}
                  onChange={(e) => handleInputChange('metodologiaTemperaturaAgua', e.target.value)}
                  placeholder="SM 2580 B"
                  className="h-11 bg-gray-100"
                  disabled
                />
              </div>
            </div>

            {/* Cor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resultadoCor" className="text-sm font-medium">
                  Resultado Analítico da Cor (UC)
                </Label>
                <Input
                  id="resultadoCor"
                  type="number"
                  step="0.01"
                  value={formData.resultadoCor}
                  onChange={(e) => handleInputChange('resultadoCor', e.target.value)}
                  placeholder="Informe"
                  className={`h-11 ${errors.resultadoCor ? 'border-red-500' : ''}`}
                />
                {errors.resultadoCor && (
                  <p className="text-xs text-red-500">{errors.resultadoCor}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="valoresRefCor" className="text-sm font-medium">
                  Valores de Referência (UC)
                </Label>
                <Input
                  id="valoresRefCor"
                  type="text"
                  value={formData.valoresRefCor}
                  onChange={(e) => handleInputChange('valoresRefCor', e.target.value)}
                  placeholder="15"
                  className="h-11 bg-gray-100"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodologiaCor" className="text-sm font-medium">
                  Metodologia
                </Label>
                <Input
                  id="metodologiaCor"
                  type="text"
                  value={formData.metodologiaCor}
                  onChange={(e) => handleInputChange('metodologiaCor', e.target.value)}
                  placeholder="SM 23ª Ed. 2120 B"
                  className="h-11 bg-gray-100"
                  disabled
                />
              </div>
            </div>

            {/* Turbidez */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resultadoTurbidez" className="text-sm font-medium">
                  Resultado Analítico da Turbidez (NTU)
                </Label>
                <Input
                  id="resultadoTurbidez"
                  type="number"
                  step="0.01"
                  value={formData.resultadoTurbidez}
                  onChange={(e) => handleInputChange('resultadoTurbidez', e.target.value)}
                  placeholder="Informe"
                  className={`h-11 ${errors.resultadoTurbidez ? 'border-red-500' : ''}`}
                />
                {errors.resultadoTurbidez && (
                  <p className="text-xs text-red-500">{errors.resultadoTurbidez}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="valoresRefTurbidez" className="text-sm font-medium">
                  Valores de Referência
                </Label>
                <Input
                  id="valoresRefTurbidez"
                  type="text"
                  value={formData.valoresRefTurbidez}
                  onChange={(e) => handleInputChange('valoresRefTurbidez', e.target.value)}
                  placeholder="5"
                  className="h-11 bg-gray-100"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodologiaTurbidez" className="text-sm font-medium">
                  Metodologia
                </Label>
                <Input
                  id="metodologiaTurbidez"
                  type="text"
                  value={formData.metodologiaTurbidez}
                  onChange={(e) => handleInputChange('metodologiaTurbidez', e.target.value)}
                  placeholder="SM 23ª Ed. 2130 B"
                  className="h-11 bg-gray-100"
                  disabled
                />
              </div>
            </div>

            {/* pH */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resultadoPh" className="text-sm font-medium">
                  Resultado Analítico do pH (UC)
                </Label>
                <Input
                  id="resultadoPh"
                  type="number"
                  step="0.01"
                  value={formData.resultadoPh}
                  onChange={(e) => handleInputChange('resultadoPh', e.target.value)}
                  placeholder="Informe"
                  className={`h-11 ${errors.resultadoPh ? 'border-red-500' : ''}`}
                />
                {errors.resultadoPh && (
                  <p className="text-xs text-red-500">{errors.resultadoPh}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="valoresRefPh" className="text-sm font-medium">
                  Valores de Referência
                </Label>
                <Input
                  id="valoresRefPh"
                  type="text"
                  value={formData.valoresRefPh}
                  onChange={(e) => handleInputChange('valoresRefPh', e.target.value)}
                  placeholder="6,0 a 9,0"
                  className="h-11 bg-gray-100"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodologiaPh" className="text-sm font-medium">
                  Metodologia
                </Label>
                <Input
                  id="metodologiaPh"
                  type="text"
                  value={formData.metodologiaPh}
                  onChange={(e) => handleInputChange('metodologiaPh', e.target.value)}
                  placeholder="SM 4500 H+ B"
                  className="h-11 bg-gray-100"
                  disabled
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800"
            >
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PhysicalChemicalAnalysisModal;
