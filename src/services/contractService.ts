/**
 * Contract Service
 *
 * Serviço para gerenciamento de contratos vinculados a licenças
 * Responsável por operações CRUD na tabela 'contratos'
 */

import { supabase } from '@/integrations/supabase/client';
import { maskCEP, maskCPF, maskCurrency, maskPhone } from '@/utils/masks';

/**
 * Interface para dados de criação de contrato
 */
export interface CreateContractPayload {
  // Dados do Contrato
  numero: string;
  celebradoEm: string; // ISO date string
  valor: number;
  tipoContratante: 'Pessoa Física' | 'Pessoa Jurídica';
  vinculoArt?: string;
  acaoInstitucional?: string;

  // Endereço do Contrato
  cepContrato: string;
  ruaContrato: string;
  bairroContrato: string;
  numeroContrato: string;
  cidadeContrato: string;
  estadoContrato: string;
  paisContrato: string;

  // Dados da Obra/Serviço
  cepObra: string;
  ruaObra: string;
  bairroObra: string;
  numeroObra: string;
  cidadeObra: string;
  estadoObra: string;
  paisObra: string;
  coordenadas: string;
  dataInicio: string; // ISO date string
  previsaoTermino: string; // ISO date string
  codigo?: string;
  finalidade: string;

  // Contato para Medição
  cpfContato: string;
  nomeContato: string;
  telefoneContato: string;
  periodoMedicaoInicio: string; // ISO date string
  periodoMedicaoFim: string; // ISO date string

  // Técnico Responsável
  cpfTecnico: string;
  nomeTecnico: string;
  rnp: string;
  tituloProfissional: string;
  registroEmpresaContratada: string;
  registro: string;

  // Observações
  observacao?: string;

  // Foreign Key
  licencaId: string;
}

/**
 * Interface para dados de contrato retornados do banco
 */
export interface ContractData {
  id: string;
  numero: string | null;
  celebrado_em: string | null;
  valor: number | null;
  tipo_contratante: string | null;
  vinculo_art: string | null;
  acao_institucional: string | null;

  // Endereço do Contrato
  cep_contrato: string | null;
  rua: string | null;
  bairro: string | null;
  numero_endereco: string | null;
  cidade: string | null;
  estado: string | null;
  pais: string | null;

  // Dados da Obra
  cep_obra: string | null;
  rua_obra: string | null;
  bairro_obra: string | null;
  numero_obra: string | null;
  cidade_obra: string | null;
  estado_obra: string | null;
  pais_obra: string | null;
  coordenada: string | null;
  data_inicio: string | null;
  previsao_termino: string | null;
  codigo: string | null;
  finalidade: string | null;

  // Contato para Medição
  cpf_contato: string | null;
  nome_contato: string | null;
  telefone_contato: string | null;
  periodo_medicao_inicio: string | null;
  periodo_medicao_fim: string | null;

  // Técnico Responsável
  cpf_tecnico: string | null;
  nome_tecnico: string | null;
  rnp: string | null;
  titulo_profissional: string | null;
  registro_empresa_contratada: string | null;
  registro: string | null;

  // Observações e Status
  observacao: string | null;
  status: string | null;

  // Foreign Key
  licenca_id: string;

  // Timestamps
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Interface com os valores utilizados no formulário de contrato
 * (todos os campos em formato string para ligação com inputs)
 */
export interface ContractFormValues {
  // Dados do Contrato
  numero: string;
  celebradoEm: string;
  valor: string;
  tipoContratante: 'Pessoa Física' | 'Pessoa Jurídica' | '';
  vinculoArt: string;
  acaoInstitucional: string;

  // Endereço do Contrato
  cepContrato: string;
  ruaContrato: string;
  bairroContrato: string;
  numeroContrato: string;
  cidadeContrato: string;
  estadoContrato: string;
  paisContrato: string;

  // Dados da Obra/Serviço
  cepObra: string;
  ruaObra: string;
  bairroObra: string;
  numeroObra: string;
  cidadeObra: string;
  estadoObra: string;
  paisObra: string;
  coordenadas: string;
  dataInicio: string;
  previsaoTermino: string;
  codigo: string;
  finalidade: string;

  // Contato para Medição
  cpfContato: string;
  nomeContato: string;
  telefoneContato: string;
  periodoMedicaoInicio: string;
  periodoMedicaoFim: string;

  // Técnico Responsável
  cpfTecnico: string;
  nomeTecnico: string;
  rnp: string;
  tituloProfissional: string;
  registroEmpresaContratada: string;
  registro: string;

  // Observações
  observacao: string;
}

/**
 * Sanitiza strings para evitar salvar valores vazios como strings em branco
 */
function sanitizeString(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Converte o payload recebido da aplicação para o formato esperado pelo banco
 */
function mapPayloadToDatabaseRecord(
  payload: Partial<CreateContractPayload>
): Record<string, any> {
  const record: Record<string, any> = {};

  const mapping: Record<keyof Partial<CreateContractPayload>, string> = {
    licencaId: 'licenca_id',
    numero: 'numero',
    celebradoEm: 'celebrado_em',
    valor: 'valor',
    tipoContratante: 'tipo_contratante',
    vinculoArt: 'vinculo_art',
    acaoInstitucional: 'acao_institucional',
    cepContrato: 'cep_contrato',
    ruaContrato: 'rua',
    bairroContrato: 'bairro',
    numeroContrato: 'numero',
    cidadeContrato: 'cidade',
    estadoContrato: 'estado',
    paisContrato: 'pais',
    cepObra: 'cep_obra',
    ruaObra: 'rua_obra',
    bairroObra: 'bairro_obra',
    numeroObra: 'numero_obra',
    cidadeObra: 'cidade_obra',
    estadoObra: 'estado_obra',
    paisObra: 'pais_obra',
    coordenadas: 'coordenada',
    dataInicio: 'data_inicio',
    previsaoTermino: 'previsao_termino',
    codigo: 'codigo',
    finalidade: 'finalidade',
    cpfContato: 'cpf_contato',
    nomeContato: 'nome_contato',
    telefoneContato: 'telefone_contato',
    periodoMedicaoInicio: 'periodo_medicao_inicio',
    periodoMedicaoFim: 'periodo_medicao_fim',
    cpfTecnico: 'cpf_tecnico',
    nomeTecnico: 'nome_tecnico',
    rnp: 'rnp',
    tituloProfissional: 'titulo_profissional',
    registroEmpresaContratada: 'registro_empresa_contratada',
    registro: 'registro',
    observacao: 'observacao',
  };

  (Object.keys(mapping) as Array<keyof typeof mapping>).forEach((key) => {
    const column = mapping[key];
    const value = payload[key];

    if (value === undefined) {
      return;
    }

    if (typeof value === 'string') {
      if (column === 'valor') {
        // valor é tratado como number, portanto ignora branch string
        record[column] = value;
        return;
      }

      const sanitized = sanitizeString(value);
      record[column] = sanitized ?? null;
      return;
    }

    record[column] = value;
  });

  // Sempre que atualizarmos, atualiza coluna updated_at
  record.updated_at = new Date().toISOString();

  return record;
}

/**
 * Converte datas em formato ISO para o padrão aceito por inputs "date" (yyyy-MM-dd)
 */
function formatDateForInput(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

/**
 * Formata número monetário do banco para máscara utilizada no formulário
 */
function formatCurrencyFromNumber(value: number | null): string {
  if (value === null || value === undefined) {
    return '';
  }
  const cents = Math.round(value * 100);
  return maskCurrency(String(cents));
}

/**
 * Mapeia dados do banco para o formato consumido pelo formulário
 */
export function mapContractDataToFormValues(contract: ContractData): ContractFormValues {
  return {
    numero: contract.numero ?? '',
    celebradoEm: formatDateForInput(contract.celebrado_em),
    valor: formatCurrencyFromNumber(contract.valor),
    tipoContratante: (contract.tipo_contratante as ContractFormValues['tipoContratante']) || '',
    vinculoArt: contract.vinculo_art ?? '',
    acaoInstitucional: contract.acao_institucional ?? '',

    cepContrato: maskCEP(contract.cep_contrato ?? ''),
    ruaContrato: contract.rua ?? '',
    bairroContrato: contract.bairro ?? '',
    numeroContrato: contract.numero_endereco ?? '',
    cidadeContrato: contract.cidade ?? '',
    estadoContrato: contract.estado ?? '',
    paisContrato: contract.pais ?? '',

    cepObra: maskCEP(contract.cep_obra ?? ''),
    ruaObra: contract.rua_obra ?? '',
    bairroObra: contract.bairro_obra ?? '',
    numeroObra: contract.numero_obra ?? '',
    cidadeObra: contract.cidade_obra ?? '',
    estadoObra: contract.estado_obra ?? '',
    paisObra: contract.pais_obra ?? '',
    coordenadas: contract.coordenada ?? '',
    dataInicio: formatDateForInput(contract.data_inicio),
    previsaoTermino: formatDateForInput(contract.previsao_termino),
    codigo: contract.codigo ?? '',
    finalidade: contract.finalidade ?? '',

    cpfContato: maskCPF(contract.cpf_contato ?? ''),
    nomeContato: contract.nome_contato ?? '',
    telefoneContato: maskPhone(contract.telefone_contato ?? ''),
    periodoMedicaoInicio: formatDateForInput(contract.periodo_medicao_inicio),
    periodoMedicaoFim: formatDateForInput(contract.periodo_medicao_fim),

    cpfTecnico: maskCPF(contract.cpf_tecnico ?? ''),
    nomeTecnico: contract.nome_tecnico ?? '',
    rnp: contract.rnp ?? '',
    tituloProfissional: contract.titulo_profissional ?? '',
    registroEmpresaContratada: contract.registro_empresa_contratada ?? '',
    registro: contract.registro ?? '',

    observacao: contract.observacao ?? '',
  };
}

/**
 * Cria um novo contrato vinculado a uma licença
 *
 * @param payload - Dados do contrato a ser criado
 * @returns Promise com o contrato criado
 * @throws Error se houver falha na criação
 */
export async function createContract(
  payload: CreateContractPayload
): Promise<ContractData> {
  try {
    const contractData = {
      ...mapPayloadToDatabaseRecord(payload),
      status: 'Ativo',
      licenca_id: payload.licencaId,
    };

    // Insere o contrato no banco de dados
    const { data, error } = await supabase
      .from('contratos')
      .insert(contractData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar contrato:', error);
      throw new Error(`Falha ao criar contrato: ${error.message}`);
    }

    if (!data) {
      throw new Error('Nenhum dado retornado após criar contrato');
    }

    return data as ContractData;
  } catch (error) {
    console.error('Erro em createContract:', error);
    throw error;
  }
}

/**
 * Busca todos os contratos vinculados a uma licença específica
 *
 * @param licenseId - ID da licença
 * @returns Promise com array de contratos
 * @throws Error se houver falha na busca
 */
export async function getContractsByLicenseId(
  licenseId: string
): Promise<ContractData[]> {
  try {
    const { data, error } = await supabase
      .from('contratos')
      .select('*')
      .eq('licenca_id', licenseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar contratos da licença:', error);
      throw new Error(`Falha ao buscar contratos: ${error.message}`);
    }

    return (data as ContractData[]) || [];
  } catch (error) {
    console.error('Erro em getContractsByLicenseId:', error);
    throw error;
  }
}

/**
 * Busca um contrato específico por ID
 *
 * @param contractId - ID do contrato
 * @returns Promise com dados do contrato
 * @throws Error se contrato não for encontrado ou houver falha na busca
 */
export async function getContractById(
  contractId: string
): Promise<ContractData> {
  try {
    const { data, error } = await supabase
      .from('contratos')
      .select('*')
      .eq('id', contractId)
      .single();

    if (error) {
      console.error('Erro ao buscar contrato:', error);
      throw new Error(`Falha ao buscar contrato: ${error.message}`);
    }

    if (!data) {
      throw new Error('Contrato não encontrado');
    }

    return data as ContractData;
  } catch (error) {
    console.error('Erro em getContractById:', error);
    throw error;
  }
}

/**
 * Atualiza um contrato existente
 *
 * @param contractId - ID do contrato a ser atualizado
 * @param payload - Dados atualizados do contrato
 * @returns Promise com o contrato atualizado
 * @throws Error se houver falha na atualização
 */
export async function updateContract(
  contractId: string,
  payload: Partial<CreateContractPayload>
): Promise<ContractData> {
  try {
    const updates = mapPayloadToDatabaseRecord(payload);

    if (Object.keys(updates).length === 0) {
      throw new Error('Nenhum campo informado para atualização do contrato.');
    }

    const { data, error } = await supabase
      .from('contratos')
      .update(updates)
      .eq('id', contractId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar contrato:', error);
      throw new Error(`Falha ao atualizar contrato: ${error.message}`);
    }

    if (!data) {
      throw new Error('Nenhum dado retornado após atualizar contrato');
    }

    return data as ContractData;
  } catch (error) {
    console.error('Erro em updateContract:', error);
    throw error;
  }
}

/**
 * Deleta um contrato
 *
 * @param contractId - ID do contrato a ser deletado
 * @returns Promise<void>
 * @throws Error se houver falha na deleção
 */
export async function deleteContract(contractId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('contratos')
      .delete()
      .eq('id', contractId);

    if (error) {
      console.error('Erro ao deletar contrato:', error);
      throw new Error(`Falha ao deletar contrato: ${error.message}`);
    }
  } catch (error) {
    console.error('Erro em deleteContract:', error);
    throw error;
  }
}

/**
 * Atualiza o contato de medição de um requerente (usuário)
 * Esta função deve ser chamada após criar/atualizar um contrato
 * para manter os dados de contato sincronizados
 *
 * @param requerenteId - ID do requerente
 * @param cpf - CPF do contato
 * @param telefone - Telefone do contato
 * @returns Promise<void>
 */
export async function updateRequerenteContatoMedicao(
  requerenteId: string,
  cpf: string,
  telefone: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({
        contato_medicao_cpf: cpf,
        contato_medicao_celular: telefone,
      })
      .eq('id', requerenteId);

    if (error) {
      console.error('Erro ao atualizar contato de medição:', error);
      // Não lançamos erro aqui para não bloquear a criação do contrato
      // Apenas logamos o erro
    }
  } catch (error) {
    console.error('Erro em updateRequerenteContatoMedicao:', error);
    // Não lançamos erro aqui
  }
}
