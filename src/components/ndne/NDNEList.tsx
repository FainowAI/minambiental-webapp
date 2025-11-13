import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Bot, User, Droplets } from 'lucide-react';
import { useNDNERecords } from '@/hooks/useNDNE';
import { NDNEFilters } from './NDNEFilters';
import { NDNEFilters as FilterType, NDNERecord } from '@/services/ndneService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NDNEListProps {
  contractId: string;
  onEdit: (record: NDNERecord) => void;
}

export const NDNEList = ({ contractId, onEdit }: NDNEListProps) => {
  const [filters, setFilters] = useState<FilterType>({});
  const { data: records, isLoading, error } = useNDNERecords(contractId, filters);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getPeriodoBadge = (periodo: string) => {
    if (periodo === 'chuvoso') {
      return (
        <Badge variant="default" className="bg-blue-500">
          Chuvoso
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="bg-orange-500">
        Seco
      </Badge>
    );
  };

  const getOrigemBadge = (origem: string, originalOrigem?: string | null) => {
    const isEdited = originalOrigem && origem !== originalOrigem;

    if (origem === 'chatbot') {
      return (
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="flex items-center gap-1">
            <Bot className="h-3 w-3" />
            Chatbot
          </Badge>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        <Badge variant="outline" className="flex items-center gap-1">
          <User className="h-3 w-3" />
          Sistema
        </Badge>
        {isEdited && originalOrigem === 'chatbot' && (
          <span className="text-xs text-muted-foreground">
            (Editado)
          </span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Registros de ND e NE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando registros...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Registros de ND e NE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Erro ao carregar registros: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5" />
          Registros de ND e NE
        </CardTitle>
        <CardDescription>
          Histórico de medições de Nível Dinâmico e Nível Estático do poço
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <NDNEFilters filters={filters} onFiltersChange={setFilters} />

          {!records || records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Droplets className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum registro encontrado</p>
              {Object.keys(filters).length > 0 && (
                <p className="text-sm mt-2">Tente ajustar os filtros</p>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Data Medição</TableHead>
                    <TableHead>ND (m)</TableHead>
                    <TableHead>NE (m)</TableHead>
                    <TableHead>Técnico</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{getPeriodoBadge(record.periodo)}</TableCell>
                      <TableCell>{formatDate(record.data_medicao)}</TableCell>
                      <TableCell className="font-mono">
                        {record.nivel_dinamico.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {record.nivel_estatico.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {record.tecnico?.nome || record.responsavel || '-'}
                      </TableCell>
                      <TableCell>
                        {getOrigemBadge(
                          record.origem_cadastro,
                          record.original_origem_cadastro
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(record)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {records && records.length > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Total: {records.length} {records.length === 1 ? 'registro' : 'registros'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
