import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { NDNEFilters as FilterType } from '@/services/ndneService';

interface NDNEFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

export const NDNEFilters = ({ filters, onFiltersChange }: NDNEFiltersProps) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const hasActiveFilters = filters.periodo || filters.origem || filters.ano;

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Select
        value={filters.periodo || ''}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            periodo: value ? (value as 'chuvoso' | 'seco') : undefined,
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="chuvoso">Período Chuvoso</SelectItem>
          <SelectItem value="seco">Período Seco</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.origem || ''}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            origem: value ? (value as 'chatbot' | 'sistema') : undefined,
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Origem" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="chatbot">Chatbot</SelectItem>
          <SelectItem value="sistema">Sistema</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.ano?.toString() || ''}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            ano: value ? parseInt(value) : undefined,
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-10"
        >
          <X className="h-4 w-4 mr-2" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
};
