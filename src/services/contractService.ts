/**
 * Contract Service
 *
 * Serviço para gerenciamento de contratos vinculados a licenças
 * Responsável por operações CRUD na tabela 'contratos'
 */

import { supabase } from '@/integrations/supabase/client';

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
  numero: string | null;
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
    // Mapeia payload para formato do banco de dados
    const contractData = {
      // Dados do Contrato
      numero: payload.numero,
      celebrado_em: payload.celebradoEm,
      valor: payload.valor,
      tipo_contratante: payload.tipoContratante,
      vinculo_art: payload.vinculoArt || null,
      acao_institucional: payload.acaoInstitucional || null,

      // Endereço do Contrato
      cep_contrato: payload.cepContrato,
      rua: payload.ruaContrato,
      bairro: payload.bairroContrato,
      numero: payload.numeroContrato,
      cidade: payload.cidadeContrato,
      estado: payload.estadoContrato,
      pais: payload.paisContrato,

      // Dados da Obra/Serviço
      cep_obra: payload.cepObra,
      rua_obra: payload.ruaObra,
      bairro_obra: payload.bairroObra,
      numero_obra: payload.numeroObra,
      cidade_obra: payload.cidadeObra,
      estado_obra: payload.estadoObra,
      pais_obra: payload.paisObra,
      coordenada: payload.coordenadas,
      data_inicio: payload.dataInicio,
      previsao_termino: payload.previsaoTermino,
      codigo: payload.codigo || null,
      finalidade: payload.finalidade,

      // Contato para Medição
      cpf_contato: payload.cpfContato,
      nome_contato: payload.nomeContato,
      telefone_contato: payload.telefoneContato,
      periodo_medicao_inicio: payload.periodoMedicaoInicio,
      periodo_medicao_fim: payload.periodoMedicaoFim,

      // Técnico Responsável
      cpf_tecnico: payload.cpfTecnico,
      nome_tecnico: payload.nomeTecnico,
      rnp: payload.rnp,
      titulo_profissional: payload.tituloProfissional,
      registro_empresa_contratada: payload.registroEmpresaContratada,
      registro: payload.registro,

      // Observações
      observacao: payload.observacao || null,

      // Status padrão
      status: 'Ativo',

      // Foreign Key
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
    // Mapeia payload para formato do banco de dados
    const updates: any = {};

    if (payload.numero) updates.numero = payload.numero;
    if (payload.celebradoEm) updates.celebrado_em = payload.celebradoEm;
    if (payload.valor !== undefined) updates.valor = payload.valor;
    if (payload.tipoContratante)
      updates.tipo_contratante = payload.tipoContratante;
    if (payload.vinculoArt !== undefined)
      updates.vinculo_art = payload.vinculoArt;
    if (payload.acaoInstitucional !== undefined)
      updates.acao_institucional = payload.acaoInstitucional;

    // Adicione mapeamentos para outros campos conforme necessário...

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
