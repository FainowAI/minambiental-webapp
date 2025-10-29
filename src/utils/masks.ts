/**
 * Aplica máscara de CPF
 * @param value - Valor sem formatação
 * @returns Valor formatado como CPF (000.000.000-00)
 */
export function maskCPF(value: string): string {
  // Remove caracteres não numéricos
  const cleanValue = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limitedValue = cleanValue.substring(0, 11);
  
  // Aplica a máscara
  return limitedValue
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Aplica máscara de CNPJ
 * @param value - Valor sem formatação
 * @returns Valor formatado como CNPJ (00.000.000/0000-00)
 */
export function maskCNPJ(value: string): string {
  // Remove caracteres não numéricos
  const cleanValue = value.replace(/\D/g, '');
  
  // Limita a 14 dígitos
  const limitedValue = cleanValue.substring(0, 14);
  
  // Aplica a máscara
  return limitedValue
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/**
 * Aplica máscara automaticamente baseada no tamanho (CPF ou CNPJ)
 * @param value - Valor sem formatação
 * @returns Valor formatado como CPF ou CNPJ
 */
export function maskCPFOrCNPJ(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length <= 11) {
    return maskCPF(cleanValue);
  } else {
    return maskCNPJ(cleanValue);
  }
}

/**
 * Aplica máscara de celular brasileiro
 * @param value - Valor sem formatação
 * @returns Valor formatado como celular ((00) 00000-0000)
 */
export function maskPhone(value: string): string {
  // Remove caracteres não numéricos
  const cleanValue = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limitedValue = cleanValue.substring(0, 11);
  
  // Aplica a máscara
  return limitedValue
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Remove todas as máscaras de um valor
 * @param value - Valor com formatação
 * @returns Valor apenas com números
 */
export function removeMask(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Detecta o tipo de documento baseado no tamanho
 * @param value - Valor sem formatação
 * @returns 'CPF', 'CNPJ' ou null
 */
export function detectDocumentType(value: string): 'CPF' | 'CNPJ' | null {
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length === 11) return 'CPF';
  if (cleanValue.length === 14) return 'CNPJ';
  return null;
}

/**
 * Formata um valor baseado no tipo de documento detectado
 * @param value - Valor sem formatação
 * @returns Valor formatado
 */
export function formatDocument(value: string): string {
  const type = detectDocumentType(value);
  
  switch (type) {
    case 'CPF':
      return maskCPF(value);
    case 'CNPJ':
      return maskCNPJ(value);
    default:
      return value;
  }
}
