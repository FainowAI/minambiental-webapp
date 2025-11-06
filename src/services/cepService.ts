/**
 * CEP Service
 *
 * Serviço para busca de endereços utilizando a API ViaCEP
 * API gratuita para consulta de CEPs brasileiros
 *
 * @see https://viacep.com.br/
 */

export interface CEPResponse {
  cep: string;
  logradouro: string; // Rua/Avenida
  complemento: string;
  bairro: string;
  localidade: string; // Cidade
  uf: string; // Estado
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean; // Presente quando CEP não é encontrado
}

export interface AddressData {
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
  erro?: boolean;
}

/**
 * Busca endereço completo a partir de um CEP
 *
 * @param cep - CEP no formato 00000-000 ou 00000000
 * @returns Promise com dados do endereço ou erro
 *
 * @example
 * const address = await lookupCEP('01001000');
 * console.log(address.rua); // 'Praça da Sé'
 */
export async function lookupCEP(cep: string): Promise<AddressData> {
  try {
    // Remove formatação do CEP (traços e pontos)
    const cleanCEP = cep.replace(/\D/g, '');

    // Valida tamanho do CEP
    if (cleanCEP.length !== 8) {
      throw new Error('CEP deve conter 8 dígitos');
    }

    // Faz requisição para API ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);

    if (!response.ok) {
      throw new Error('Erro ao buscar CEP na API ViaCEP');
    }

    const data: CEPResponse = await response.json();

    // ViaCEP retorna { erro: true } quando CEP não é encontrado
    if (data.erro) {
      return {
        cep: cleanCEP,
        rua: '',
        bairro: '',
        cidade: '',
        estado: '',
        pais: 'Brasil',
        erro: true,
      };
    }

    // Retorna dados formatados
    return {
      cep: data.cep,
      rua: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      estado: data.uf || '',
      pais: 'Brasil',
      erro: false,
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);

    // Em caso de erro de rede ou outro erro, retorna estrutura vazia
    return {
      cep: cep,
      rua: '',
      bairro: '',
      cidade: '',
      estado: '',
      pais: 'Brasil',
      erro: true,
    };
  }
}

/**
 * Valida se um CEP está no formato correto
 *
 * @param cep - CEP a ser validado
 * @returns true se o formato é válido
 *
 * @example
 * isValidCEPFormat('01001-000'); // true
 * isValidCEPFormat('01001000'); // true
 * isValidCEPFormat('0100'); // false
 */
export function isValidCEPFormat(cep: string): boolean {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8;
}
