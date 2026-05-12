/**
 * Contract Service
 *
 * Serviço para gerenciamento de contratos vinculados a licenças
 * Responsável por operações CRUD na tabela 'contratos'
 */

import { supabase } from '@/integrations/supabase/client';
import { maskCEP, maskCPF, maskCurrency, maskPhone } from '@/utils/masks';

/**
 * Remove todos os caracteres não numéricos de uma string
 * Usado para sanitizar CPF/CNPJ/CEP/celular antes de persistir no banco
 */
function onlyDigits(value: string | undefined | null): string {
  return (value ?? '').replace(/\D/g, '');
}

/**
 * Resultado da busca de técnico por CPF
 */
export interface TecnicoLookupResult {
  id: string;
  nome: string;
  cpf: string;
}

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
    numeroContrato: 'numero_endereco',
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

  // Colunas cujo conteúdo deve ser persistido como apenas dígitos
  // (CPF/CNPJ/CEP/telefone-celular). Stripping antes do INSERT/UPDATE
  // garante consistência com lookups posteriores (ex.: findTecnicoByCpf).
  const digitsOnlyColumns = new Set<string>([
    'cep_contrato',
    'cep_obra',
    'cpf_contato',
    'telefone_contato',
    'cpf_tecnico',
  ]);

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

      if (digitsOnlyColumns.has(column)) {
        const digits = onlyDigits(value);
        record[column] = digits.length > 0 ? digits : null;
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
    // CA 05 — Valida as datas do contrato contra a vigência da licença
    await validateContractDatesAgainstLicenca(payload.licencaId, {
      dataInicio: payload.dataInicio,
      previsaoTermino: payload.previsaoTermino,
    });

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

    // CA 06 — Sincroniza o contato de medição no Requerente vinculado (não bloqueante)
    await syncContatoMedicaoIntoRequerente(payload.licencaId, payload);

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
      .is('deleted_at', null)
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
      .is('deleted_at', null)
      .maybeSingle();

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

    // CA 05 — Quando dataInicio/previsaoTermino estiverem no payload, validar contra a licença
    if (payload.dataInicio || payload.previsaoTermino) {
      // Descobre a licença vinculada ao contrato (não confia em payload.licencaId em update)
      const { data: existing, error: existingError } = await supabase
        .from('contratos')
        .select('licenca_id')
        .eq('id', contractId)
        .is('deleted_at', null)
        .maybeSingle();

      if (existingError) {
        console.error('Erro ao recuperar licença vinculada ao contrato:', existingError);
        throw new Error('Não foi possível validar as datas do contrato contra a licença.');
      }

      if (!existing) {
        throw new Error('Contrato não encontrado para validação.');
      }

      await validateContractDatesAgainstLicenca(existing.licenca_id, {
        dataInicio: payload.dataInicio,
        previsaoTermino: payload.previsaoTermino,
      });
    }

    const { data, error } = await supabase
      .from('contratos')
      .update(updates)
      .eq('id', contractId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar contrato:', error);
      throw new Error(`Falha ao atualizar contrato: ${error.message}`);
    }

    if (!data) {
      throw new Error('Nenhum dado retornado após atualizar contrato');
    }

    // CA 06 — Sincroniza o contato de medição no Requerente vinculado (não bloqueante)
    const contrato = data as ContractData;
    if (contrato.licenca_id) {
      await syncContatoMedicaoIntoRequerente(contrato.licenca_id, payload);
    }

    return contrato;
  } catch (error) {
    console.error('Erro em updateContract:', error);
    throw error;
  }
}

/**
 * Soft-delete de um contrato
 * Mantém o registro fisicamente no banco e apenas marca `deleted_at = now()`.
 *
 * @param contractId - ID do contrato a ser deletado
 * @returns Promise<void>
 * @throws Error se houver falha na deleção
 */
export async function deleteContract(contractId: string): Promise<void> {
  try {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('contratos')
      .update({ deleted_at: now, updated_at: now })
      .eq('id', contractId)
      .is('deleted_at', null);

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
 * Mantida para retro-compatibilidade com chamadas externas.
 * O contractService já sincroniza o contato no Requerente vinculado à licença
 * automaticamente após createContract/updateContract (CA 06).
 *
 * @param requerenteId - ID do requerente (registro em `usuarios`)
 * @param cpf - CPF do contato (com ou sem máscara — será sanitizado)
 * @param telefone - Telefone do contato (com ou sem máscara — será sanitizado)
 * @returns Promise<void>
 */
export async function updateRequerenteContatoMedicao(
  requerenteId: string,
  cpf: string,
  telefone: string
): Promise<void> {
  try {
    const cpfDigits = onlyDigits(cpf);
    const phoneDigits = onlyDigits(telefone);

    const { error } = await supabase
      .from('usuarios')
      .update({
        contato_medicao_cpf: cpfDigits || null,
        contato_medicao_celular: phoneDigits || null,
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

/**
 * Valida as datas de início/término do contrato contra a vigência da licença.
 * Throws com mensagens user-friendly em PT-BR caso as datas violem a vigência.
 *
 * @param licencaId - ID da licença referenciada pelo contrato
 * @param dates - dataInicio e/ou previsaoTermino (qualquer um pode ser undefined em updates parciais)
 */
async function validateContractDatesAgainstLicenca(
  licencaId: string,
  dates: { dataInicio?: string; previsaoTermino?: string }
): Promise<void> {
  if (!dates.dataInicio && !dates.previsaoTermino) {
    return;
  }

  const { data: licenca, error } = await supabase
    .from('licencas')
    .select('data_inicio, data_fim')
    .eq('id', licencaId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar licença para validação de datas:', error);
    throw new Error('Não foi possível validar as datas do contrato contra a licença.');
  }

  if (!licenca) {
    throw new Error('Licença vinculada ao contrato não foi encontrada.');
  }

  if (dates.dataInicio) {
    const inicioContrato = new Date(dates.dataInicio);
    const inicioLicenca = new Date(licenca.data_inicio);
    if (!Number.isNaN(inicioContrato.getTime()) && !Number.isNaN(inicioLicenca.getTime())) {
      if (inicioContrato < inicioLicenca) {
        throw new Error(
          'A data de início do contrato não pode ser inferior à data de início da licença.'
        );
      }
    }
  }

  if (dates.previsaoTermino) {
    const fimContrato = new Date(dates.previsaoTermino);
    const fimLicenca = new Date(licenca.data_fim);
    if (!Number.isNaN(fimContrato.getTime()) && !Number.isNaN(fimLicenca.getTime())) {
      if (fimContrato > fimLicenca) {
        throw new Error(
          'A previsão de término do contrato não pode ultrapassar a validade da licença.'
        );
      }
    }
  }
}

/**
 * Sincroniza os dados de contato de medição do contrato no Requerente
 * vinculado à licença (tabela `requerentes`). Operação não bloqueante:
 * em caso de falha apenas registra warning, não relança a exceção.
 *
 * Implementa o CA 06 — após salvar o contrato, se houver campos de
 * contato de medição preenchidos, atualizar o Requerente correspondente.
 *
 * @param licencaId - ID da licença vinculada ao contrato
 * @param payload - payload (parcial) do contrato com possíveis dados de contato
 */
async function syncContatoMedicaoIntoRequerente(
  licencaId: string,
  payload: Partial<CreateContractPayload>
): Promise<void> {
  try {
    // Só prossegue se ao menos um campo de contato de medição vier no payload
    const hasAnyContato =
      payload.nomeContato !== undefined ||
      payload.cpfContato !== undefined ||
      payload.telefoneContato !== undefined;

    if (!hasAnyContato) {
      return;
    }

    const { data: lic, error: licError } = await supabase
      .from('licencas')
      .select('requerente_id')
      .eq('id', licencaId)
      .is('deleted_at', null)
      .maybeSingle();

    if (licError) {
      console.warn(
        '[syncContatoMedicaoIntoRequerente] Falha ao buscar licença vinculada:',
        licError
      );
      return;
    }

    if (!lic?.requerente_id) {
      console.warn(
        '[syncContatoMedicaoIntoRequerente] Licença sem requerente_id; ignorando sync.'
      );
      return;
    }

    const updates: Record<string, string | null> = {};

    if (payload.nomeContato !== undefined) {
      const nome = (payload.nomeContato ?? '').trim();
      updates.contato_medicao_nome = nome.length > 0 ? nome : null;
    }
    if (payload.cpfContato !== undefined) {
      const cpfDigits = onlyDigits(payload.cpfContato);
      updates.contato_medicao_cpf = cpfDigits.length > 0 ? cpfDigits : null;
    }
    if (payload.telefoneContato !== undefined) {
      const phoneDigits = onlyDigits(payload.telefoneContato);
      updates.contato_medicao_celular = phoneDigits.length > 0 ? phoneDigits : null;
    }

    if (Object.keys(updates).length === 0) {
      return;
    }

    const { error: updateError } = await supabase
      .from('requerentes')
      .update(updates)
      .eq('id', lic.requerente_id);

    if (updateError) {
      console.warn(
        '[syncContatoMedicaoIntoRequerente] Falha ao atualizar contato de medição do requerente:',
        updateError
      );
    }
  } catch (err) {
    console.warn('[syncContatoMedicaoIntoRequerente] Erro inesperado:', err);
  }
}

/**
 * Busca um técnico responsável já cadastrado pelo CPF (CA 07).
 *
 * Verifica que o usuário:
 *   - exista em `usuarios`
 *   - esteja com status `ativo`
 *   - possua o papel `tecnico` em `user_roles.role_v2`
 *
 * Não lança erro: retorna `null` quando não encontrado ou em caso de falha
 * de consulta, para que o componente de formulário possa exibir a mensagem
 * orientativa: "Técnico não encontrado. Por favor, realize o cadastro do
 * técnico antes de vinculá-lo como responsável no contrato."
 *
 * @param cpf - CPF informado pelo usuário (com ou sem máscara)
 * @returns Dados básicos do técnico (id, nome, cpf) ou `null`
 */
export async function findTecnicoByCpf(cpf: string): Promise<TecnicoLookupResult | null> {
  const cpfDigits = onlyDigits(cpf);
  if (cpfDigits.length !== 11) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, cpf, user_roles!inner(role_v2)')
      .eq('cpf', cpfDigits)
      .eq('user_roles.role_v2', 'tecnico')
      .eq('status', 'ativo')
      .maybeSingle();

    if (error) {
      console.warn('[findTecnicoByCpf] Erro ao buscar técnico:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return { id: data.id, nome: data.nome, cpf: data.cpf };
  } catch (err) {
    console.warn('[findTecnicoByCpf] Erro inesperado:', err);
    return null;
  }
}
