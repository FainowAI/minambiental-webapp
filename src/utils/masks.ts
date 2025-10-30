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
 * Máscara para coordenadas em graus/minutos/segundos: "xx° xx’ xx.xx" com sinal opcional
 */
export function maskDMS(value: string): string {
  // Mantém apenas dígitos, +, -, °, ', . e espaços
  let v = value.replace(/[^0-9+\-°'\.\s]/g, '');

  // Remove múltiplos espaços
  v = v.replace(/\s+/g, ' ');

  // Monta padrão progressivo: DD° MM' SS.ss
  const digits = v.replace(/[^0-9]/g, '');
  const sign = value.trim().startsWith('-') ? '-' : value.trim().startsWith('+') ? '+' : '';

  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const s = digits.slice(4, 6);
  const sDec = digits.slice(6, 8);

  let out = sign;
  if (d) out += `${d}°`;
  if (m) out += ` ${m}’`;
  if (s) out += ` ${s}`;
  if (sDec) out += `.${sDec}`;
  if (s || sDec) out += '';

  return out.trim();
}

/**
 * Máscara numérica com duas casas decimais para volume em m³
 */
export function maskDecimalTwoPlaces(value: string): string {
  const cleaned = value.replace(/[^0-9]/g, '');
  if (!cleaned) return '';
  const num = (parseInt(cleaned, 10) / 100).toFixed(2);
  return num;
}

/**
 * Converte DMS (mascarado) para decimal. Retorna null se inválido
 */
export function dmsToDecimal(dms: string): number | null {
  if (!dms) return null;
  const sign = dms.trim().startsWith('-') ? -1 : 1;
  const nums = dms.replace(/[^0-9.]/g, ' ').trim().split(/\s+/);
  if (nums.length < 3) return null;
  const deg = parseFloat(nums[0]);
  const min = parseFloat(nums[1]);
  const sec = parseFloat(nums[2]);
  if (Number.isNaN(deg) || Number.isNaN(min) || Number.isNaN(sec)) return null;
  const dec = sign * (deg + min / 60 + sec / 3600);
  return Number.isFinite(dec) ? dec : null;
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
