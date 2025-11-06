/**
 * Validação de CPF
 * @param cpf - CPF sem formatação (apenas números)
 * @returns true se o CPF for válido
 */
export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

/**
 * Validação de CNPJ
 * @param cnpj - CNPJ sem formatação (apenas números)
 * @returns true se o CNPJ for válido
 */
export function validateCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  let weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;
  if (firstDigit !== parseInt(cleanCNPJ.charAt(12))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;
  if (secondDigit !== parseInt(cleanCNPJ.charAt(13))) return false;
  
  return true;
}

/**
 * Detecta e valida CPF ou CNPJ automaticamente
 * @param value - CPF ou CNPJ com ou sem formatação
 * @returns objeto com validade e tipo detectado
 */
export function validateCPFOrCNPJ(value: string): { valid: boolean; type: 'CPF' | 'CNPJ' | null } {
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length === 11) {
    return {
      valid: validateCPF(cleanValue),
      type: 'CPF'
    };
  } else if (cleanValue.length === 14) {
    return {
      valid: validateCNPJ(cleanValue),
      type: 'CNPJ'
    };
  }
  
  return {
    valid: false,
    type: null
  };
}

/**
 * Validação de email
 * @param email - Email para validar
 * @returns true se o email for válido
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validação de celular brasileiro
 * @param phone - Celular com ou sem formatação
 * @returns true se o celular for válido
 */
export function validatePhone(phone: string): boolean {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Verifica se tem 10 ou 11 dígitos (com DDD)
  if (cleanPhone.length !== 10 && cleanPhone.length !== 11) return false;
  
  // Verifica se o DDD é válido (11 a 99)
  const ddd = parseInt(cleanPhone.substring(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  
  // Verifica se o número não é composto apenas por zeros
  if (/^0+$/.test(cleanPhone.substring(2))) return false;
  
  return true;
}

/**
 * Validação de nome completo
 * @param name - Nome para validar
 * @returns true se o nome for válido
 */
export function validateName(name: string): boolean {
  // Remove espaços extras
  const trimmedName = name.trim();
  
  // Verifica se tem pelo menos 3 caracteres
  if (trimmedName.length < 3) return false;
  
  // Verifica se tem pelo menos 2 palavras (nome e sobrenome)
  const words = trimmedName.split(/\s+/).filter(word => word.length > 0);
  if (words.length < 2) return false;
  
  // Verifica se não contém apenas números ou caracteres especiais
  if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(trimmedName)) return false;
  
  return true;
}

/**
 * Valida string DMS no formato aproximado: "xx° xx’ xx.xx" com sinal opcional
 */
export function validateDMS(value: string): boolean {
  if (!value) return false;
  const regex = /^[+-]?\s?\d{1,2}°\s\d{1,2}’\s\d{1,2}(?:\.\d{1,2})?$/;
  return regex.test(value.trim());
}

/**
 * Valida arquivo PDF por extensão e MIME
 */
export function validatePdfFile(file: File | null): boolean {
  if (!file) return false;
  const isPdfMime = file.type === 'application/pdf';
  const isPdfExt = /\.pdf$/i.test(file.name);
  return isPdfMime || isPdfExt;
}

/**
 * Validação de CEP brasileiro
 * @param cep - CEP com ou sem formatação
 * @returns true se o CEP for válido (8 dígitos)
 */
export function validateCEP(cep: string): boolean {
  // Remove caracteres não numéricos
  const cleanCEP = cep.replace(/\D/g, '');

  // Verifica se tem exatamente 8 dígitos
  if (cleanCEP.length !== 8) return false;

  // Verifica se não é composto apenas por zeros
  if (/^0+$/.test(cleanCEP)) return false;

  return true;
}

/**
 * Interface para retorno de validação de datas de contrato
 */
export interface ContractDateValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Valida se as datas do contrato estão dentro das regras de negócio
 *
 * Regras:
 * - Data de início do contrato >= Data de início da licença
 * - Previsão de término >= Data de início do contrato
 * - Previsão de término <= Data de fim da licença
 *
 * @param dataInicio - Data de início do contrato (ISO string ou Date)
 * @param previsaoTermino - Previsão de término do contrato (ISO string ou Date)
 * @param licenseDataInicio - Data de início da licença (ISO string ou Date)
 * @param licenseDataFim - Data de fim da licença (ISO string ou Date)
 * @returns Objeto com status de validação e array de erros
 */
export function validateContractDates(
  dataInicio: string | Date,
  previsaoTermino: string | Date,
  licenseDataInicio: string | Date,
  licenseDataFim: string | Date
): ContractDateValidation {
  const errors: string[] = [];

  // Converte strings para Date se necessário
  const contractStart = typeof dataInicio === 'string' ? new Date(dataInicio) : dataInicio;
  const contractEnd = typeof previsaoTermino === 'string' ? new Date(previsaoTermino) : previsaoTermino;
  const licenseStart =
    typeof licenseDataInicio === 'string' ? new Date(licenseDataInicio) : licenseDataInicio;
  const licenseEnd =
    typeof licenseDataFim === 'string' ? new Date(licenseDataFim) : licenseDataFim;

  // Valida se todas as datas são válidas
  if (isNaN(contractStart.getTime())) {
    errors.push('Data de início do contrato inválida');
  }
  if (isNaN(contractEnd.getTime())) {
    errors.push('Previsão de término inválida');
  }
  if (isNaN(licenseStart.getTime())) {
    errors.push('Data de início da licença inválida');
  }
  if (isNaN(licenseEnd.getTime())) {
    errors.push('Data de fim da licença inválida');
  }

  // Se alguma data for inválida, retorna
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Regra 1: Data de início do contrato não pode ser anterior à data de início da licença
  if (contractStart < licenseStart) {
    errors.push('A data de início do contrato não pode ser inferior à data de início da licença.');
  }

  // Regra 2: Previsão de término não pode ser anterior à data de início do contrato
  if (contractEnd < contractStart) {
    errors.push('A previsão de término do contrato não pode ser inferior à data de início do contrato.');
  }

  // Regra 3: Previsão de término não pode ultrapassar a data de fim da licença
  if (contractEnd > licenseEnd) {
    errors.push('A previsão de término do contrato não pode ultrapassar a validade da licença.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}