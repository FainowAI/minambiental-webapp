export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analises_agua: {
        Row: {
          arquivo_laudo: string | null
          codigo_amostra: string | null
          coliformes_totais: number | null
          condutividade: number | null
          contrato_id: string | null
          cor: number | null
          created_at: string | null
          data_coleta: string
          data_entrada_laboratorio: string | null
          dureza_total: number | null
          escherichia_coli: number | null
          hora_coleta: string | null
          id: string
          identificacao_profissional: string | null
          laboratorio: string | null
          licenca_id: string
          observacoes: string | null
          parametros_adicionais: Json | null
          ph: number | null
          responsavel_coleta: string | null
          solidos_totais: number | null
          status: string | null
          temperatura_ambiente: number | null
          temperatura_amostra: number | null
          tipo_coleta: string | null
          turbidez: number | null
          updated_at: string | null
        }
        Insert: {
          arquivo_laudo?: string | null
          codigo_amostra?: string | null
          coliformes_totais?: number | null
          condutividade?: number | null
          contrato_id?: string | null
          cor?: number | null
          created_at?: string | null
          data_coleta: string
          data_entrada_laboratorio?: string | null
          dureza_total?: number | null
          escherichia_coli?: number | null
          hora_coleta?: string | null
          id?: string
          identificacao_profissional?: string | null
          laboratorio?: string | null
          licenca_id: string
          observacoes?: string | null
          parametros_adicionais?: Json | null
          ph?: number | null
          responsavel_coleta?: string | null
          solidos_totais?: number | null
          status?: string | null
          temperatura_ambiente?: number | null
          temperatura_amostra?: number | null
          tipo_coleta?: string | null
          turbidez?: number | null
          updated_at?: string | null
        }
        Update: {
          arquivo_laudo?: string | null
          codigo_amostra?: string | null
          coliformes_totais?: number | null
          condutividade?: number | null
          contrato_id?: string | null
          cor?: number | null
          created_at?: string | null
          data_coleta?: string
          data_entrada_laboratorio?: string | null
          dureza_total?: number | null
          escherichia_coli?: number | null
          hora_coleta?: string | null
          id?: string
          identificacao_profissional?: string | null
          laboratorio?: string | null
          licenca_id?: string
          observacoes?: string | null
          parametros_adicionais?: Json | null
          ph?: number | null
          responsavel_coleta?: string | null
          solidos_totais?: number | null
          status?: string | null
          temperatura_ambiente?: number | null
          temperatura_amostra?: number | null
          tipo_coleta?: string | null
          turbidez?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analises_agua_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analises_agua_licenca_id_fkey"
            columns: ["licenca_id"]
            isOneToOne: false
            referencedRelation: "licencas"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_analises_fq: {
        Row: {
          codigo_amostra: string | null
          condicoes_tempo: string | null
          contrato_id: string
          created_at: string | null
          created_by: string | null
          data_coleta: string
          data_entrada_laboratorio: string | null
          hora_coleta: string | null
          id: string
          ind_profissional: string | null
          laboratorio: string | null
          observacoes: string | null
          parametros_extras: Json | null
          responsavel_coleta: string | null
          resultado_cor: number | null
          resultado_ph: number | null
          resultado_temperatura_agua: number | null
          resultado_turbidez: number | null
          temperatura_ambiente: number | null
          temperatura_amostra: number | null
          updated_at: string | null
        }
        Insert: {
          codigo_amostra?: string | null
          condicoes_tempo?: string | null
          contrato_id: string
          created_at?: string | null
          created_by?: string | null
          data_coleta: string
          data_entrada_laboratorio?: string | null
          hora_coleta?: string | null
          id?: string
          ind_profissional?: string | null
          laboratorio?: string | null
          observacoes?: string | null
          parametros_extras?: Json | null
          responsavel_coleta?: string | null
          resultado_cor?: number | null
          resultado_ph?: number | null
          resultado_temperatura_agua?: number | null
          resultado_turbidez?: number | null
          temperatura_ambiente?: number | null
          temperatura_amostra?: number | null
          updated_at?: string | null
        }
        Update: {
          codigo_amostra?: string | null
          condicoes_tempo?: string | null
          contrato_id?: string
          created_at?: string | null
          created_by?: string | null
          data_coleta?: string
          data_entrada_laboratorio?: string | null
          hora_coleta?: string | null
          id?: string
          ind_profissional?: string | null
          laboratorio?: string | null
          observacoes?: string | null
          parametros_extras?: Json | null
          responsavel_coleta?: string | null
          resultado_cor?: number | null
          resultado_ph?: number | null
          resultado_temperatura_agua?: number | null
          resultado_turbidez?: number | null
          temperatura_ambiente?: number | null
          temperatura_amostra?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contrato_analises_fq_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_monitoramento_imagens: {
        Row: {
          arquivo_url: string
          bucket_path: string
          content_type: string | null
          created_at: string | null
          created_by: string | null
          id: string
          monitoramento_id: string
          tamanho_bytes: number | null
        }
        Insert: {
          arquivo_url: string
          bucket_path: string
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          monitoramento_id: string
          tamanho_bytes?: number | null
        }
        Update: {
          arquivo_url?: string
          bucket_path?: string
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          monitoramento_id?: string
          tamanho_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contrato_monitoramento_imagens_monitoramento_id_fkey"
            columns: ["monitoramento_id"]
            isOneToOne: false
            referencedRelation: "contrato_monitoramentos"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_monitoramentos: {
        Row: {
          consumo: number | null
          contrato_id: string
          created_at: string | null
          created_by: string | null
          data_leitura: string
          hora_apurada: number | null
          hora_declarada: number | null
          id: string
          leitura_anterior: number | null
          leitura_apurada: number | null
          leitura_declarada: number | null
          observacoes: string | null
          referencia_ano: number
          referencia_mes: number
          tipo: Database["public"]["Enums"]["tipo_medidor"]
          updated_at: string | null
        }
        Insert: {
          consumo?: number | null
          contrato_id: string
          created_at?: string | null
          created_by?: string | null
          data_leitura: string
          hora_apurada?: number | null
          hora_declarada?: number | null
          id?: string
          leitura_anterior?: number | null
          leitura_apurada?: number | null
          leitura_declarada?: number | null
          observacoes?: string | null
          referencia_ano: number
          referencia_mes: number
          tipo: Database["public"]["Enums"]["tipo_medidor"]
          updated_at?: string | null
        }
        Update: {
          consumo?: number | null
          contrato_id?: string
          created_at?: string | null
          created_by?: string | null
          data_leitura?: string
          hora_apurada?: number | null
          hora_declarada?: number | null
          id?: string
          leitura_anterior?: number | null
          leitura_apurada?: number | null
          leitura_declarada?: number | null
          observacoes?: string | null
          referencia_ano?: number
          referencia_mes?: number
          tipo?: Database["public"]["Enums"]["tipo_medidor"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contrato_monitoramentos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_nd_ne: {
        Row: {
          contrato_id: string
          created_at: string | null
          created_by: string | null
          data_medicao: string
          edited_at: string | null
          edited_by: string | null
          id: string
          nivel_dinamico: number
          nivel_estatico: number
          observacoes: string | null
          origem_cadastro: Database["public"]["Enums"]["origem_cadastro_nd_ne"]
          original_origem_cadastro:
            | Database["public"]["Enums"]["origem_cadastro_nd_ne"]
            | null
          periodo: Database["public"]["Enums"]["periodo_medicao"]
          responsavel: string | null
          tecnico_id: string | null
          updated_at: string | null
        }
        Insert: {
          contrato_id: string
          created_at?: string | null
          created_by?: string | null
          data_medicao: string
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          nivel_dinamico: number
          nivel_estatico: number
          observacoes?: string | null
          origem_cadastro?: Database["public"]["Enums"]["origem_cadastro_nd_ne"]
          original_origem_cadastro?:
            | Database["public"]["Enums"]["origem_cadastro_nd_ne"]
            | null
          periodo: Database["public"]["Enums"]["periodo_medicao"]
          responsavel?: string | null
          tecnico_id?: string | null
          updated_at?: string | null
        }
        Update: {
          contrato_id?: string
          created_at?: string | null
          created_by?: string | null
          data_medicao?: string
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          nivel_dinamico?: number
          nivel_estatico?: number
          observacoes?: string | null
          origem_cadastro?: Database["public"]["Enums"]["origem_cadastro_nd_ne"]
          original_origem_cadastro?:
            | Database["public"]["Enums"]["origem_cadastro_nd_ne"]
            | null
          periodo?: Database["public"]["Enums"]["periodo_medicao"]
          responsavel?: string | null
          tecnico_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contrato_nd_ne_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_nd_ne_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          acao_institucional: string | null
          bairro: string | null
          bairro_obra: string | null
          celebrado_em: string | null
          cep_contrato: string | null
          cep_obra: string | null
          cidade: string | null
          cidade_obra: string | null
          codigo: string | null
          coordenada: string | null
          cpf_contato: string | null
          cpf_tecnico: string | null
          created_at: string | null
          data_inicio: string | null
          deleted_at: string | null
          estado: string | null
          estado_obra: string | null
          finalidade: string | null
          id: string
          licenca_id: string
          nome_contato: string | null
          nome_tecnico: string | null
          numero: string | null
          numero_obra: string | null
          observacao: string | null
          pais: string | null
          pais_obra: string | null
          periodo_medicao_fim: string | null
          periodo_medicao_inicio: string | null
          previsao_termino: string | null
          registro: string | null
          registro_empresa_contratada: string | null
          rnp: string | null
          rua: string | null
          rua_obra: string | null
          status: string | null
          telefone_contato: string | null
          tipo_contratante: string | null
          titulo_profissional: string | null
          updated_at: string | null
          valor: number | null
          vinculo_art: string | null
        }
        Insert: {
          acao_institucional?: string | null
          bairro?: string | null
          bairro_obra?: string | null
          celebrado_em?: string | null
          cep_contrato?: string | null
          cep_obra?: string | null
          cidade?: string | null
          cidade_obra?: string | null
          codigo?: string | null
          coordenada?: string | null
          cpf_contato?: string | null
          cpf_tecnico?: string | null
          created_at?: string | null
          data_inicio?: string | null
          deleted_at?: string | null
          estado?: string | null
          estado_obra?: string | null
          finalidade?: string | null
          id?: string
          licenca_id: string
          nome_contato?: string | null
          nome_tecnico?: string | null
          numero?: string | null
          numero_obra?: string | null
          observacao?: string | null
          pais?: string | null
          pais_obra?: string | null
          periodo_medicao_fim?: string | null
          periodo_medicao_inicio?: string | null
          previsao_termino?: string | null
          registro?: string | null
          registro_empresa_contratada?: string | null
          rnp?: string | null
          rua?: string | null
          rua_obra?: string | null
          status?: string | null
          telefone_contato?: string | null
          tipo_contratante?: string | null
          titulo_profissional?: string | null
          updated_at?: string | null
          valor?: number | null
          vinculo_art?: string | null
        }
        Update: {
          acao_institucional?: string | null
          bairro?: string | null
          bairro_obra?: string | null
          celebrado_em?: string | null
          cep_contrato?: string | null
          cep_obra?: string | null
          cidade?: string | null
          cidade_obra?: string | null
          codigo?: string | null
          coordenada?: string | null
          cpf_contato?: string | null
          cpf_tecnico?: string | null
          created_at?: string | null
          data_inicio?: string | null
          deleted_at?: string | null
          estado?: string | null
          estado_obra?: string | null
          finalidade?: string | null
          id?: string
          licenca_id?: string
          nome_contato?: string | null
          nome_tecnico?: string | null
          numero?: string | null
          numero_obra?: string | null
          observacao?: string | null
          pais?: string | null
          pais_obra?: string | null
          periodo_medicao_fim?: string | null
          periodo_medicao_inicio?: string | null
          previsao_termino?: string | null
          registro?: string | null
          registro_empresa_contratada?: string | null
          rnp?: string | null
          rua?: string | null
          rua_obra?: string | null
          status?: string | null
          telefone_contato?: string | null
          tipo_contratante?: string | null
          titulo_profissional?: string | null
          updated_at?: string | null
          valor?: number | null
          vinculo_art?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_licenca_id_fkey"
            columns: ["licenca_id"]
            isOneToOne: false
            referencedRelation: "licencas"
            referencedColumns: ["id"]
          },
        ]
      }
      ebook_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      licencas: {
        Row: {
          created_at: string | null
          data_fim: string
          data_inicio: string
          deleted_at: string | null
          estado: string
          finalidade_uso: string
          id: string
          latitude: number | null
          longitude: number | null
          municipio: string
          numero_licenca: string
          objeto_ato: string | null
          pdf_licenca: string | null
          prioridade: Database["public"]["Enums"]["prioridade_licenca"] | null
          requerente_id: string
          sistema_aquifero: string | null
          status: string | null
          tipo_ato: string
          tipo_ponto_interferencia: string | null
          unidade_planejamento: string | null
          updated_at: string | null
          volume_anual_captado: number | null
        }
        Insert: {
          created_at?: string | null
          data_fim: string
          data_inicio: string
          deleted_at?: string | null
          estado: string
          finalidade_uso: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipio: string
          numero_licenca: string
          objeto_ato?: string | null
          pdf_licenca?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_licenca"] | null
          requerente_id: string
          sistema_aquifero?: string | null
          status?: string | null
          tipo_ato: string
          tipo_ponto_interferencia?: string | null
          unidade_planejamento?: string | null
          updated_at?: string | null
          volume_anual_captado?: number | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          deleted_at?: string | null
          estado?: string
          finalidade_uso?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipio?: string
          numero_licenca?: string
          objeto_ato?: string | null
          pdf_licenca?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_licenca"] | null
          requerente_id?: string
          sistema_aquifero?: string | null
          status?: string | null
          tipo_ato?: string
          tipo_ponto_interferencia?: string | null
          unidade_planejamento?: string | null
          updated_at?: string | null
          volume_anual_captado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "licencas_requerente_id_fkey"
            columns: ["requerente_id"]
            isOneToOne: false
            referencedRelation: "requerentes"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoramentos: {
        Row: {
          ano: number
          created_at: string | null
          data_leitura: string
          hidrometro_consumo: number | null
          hidrometro_leitura_anterior: number | null
          hidrometro_leitura_atual: number | null
          horimetro_horas_operacao: number | null
          horimetro_leitura_anterior: number | null
          horimetro_leitura_atual: number | null
          id: string
          licenca_id: string
          mes: number
          nd_metros: number | null
          ne_metros: number | null
          observacoes: string | null
          status: string | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          ano: number
          created_at?: string | null
          data_leitura?: string
          hidrometro_consumo?: number | null
          hidrometro_leitura_anterior?: number | null
          hidrometro_leitura_atual?: number | null
          horimetro_horas_operacao?: number | null
          horimetro_leitura_anterior?: number | null
          horimetro_leitura_atual?: number | null
          id?: string
          licenca_id: string
          mes: number
          nd_metros?: number | null
          ne_metros?: number | null
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          ano?: number
          created_at?: string | null
          data_leitura?: string
          hidrometro_consumo?: number | null
          hidrometro_leitura_anterior?: number | null
          hidrometro_leitura_atual?: number | null
          horimetro_horas_operacao?: number | null
          horimetro_leitura_anterior?: number | null
          horimetro_leitura_atual?: number | null
          id?: string
          licenca_id?: string
          mes?: number
          nd_metros?: number | null
          ne_metros?: number | null
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitoramentos_licenca_id_fkey"
            columns: ["licenca_id"]
            isOneToOne: false
            referencedRelation: "licencas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitoramentos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string | null
          data_envio: string | null
          id: string
          licenca_id: string | null
          lida: boolean | null
          mensagem: string
          tipo: string
          titulo: string
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          data_envio?: string | null
          id?: string
          licenca_id?: string | null
          lida?: boolean | null
          mensagem: string
          tipo: string
          titulo: string
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          data_envio?: string | null
          id?: string
          licenca_id?: string | null
          lida?: boolean | null
          mensagem?: string
          tipo?: string
          titulo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_licenca_id_fkey"
            columns: ["licenca_id"]
            isOneToOne: false
            referencedRelation: "licencas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pessoas: {
        Row: {
          bairro: string | null
          celular: string | null
          cep: string | null
          cidade: string | null
          cpf_cnpj: string
          created_at: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome_razao_social: string
          numero: string | null
          pais: string | null
          status: string | null
          tipo_pessoa: string
          updated_at: string | null
        }
        Insert: {
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cpf_cnpj: string
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_razao_social: string
          numero?: string | null
          pais?: string | null
          status?: string | null
          tipo_pessoa: string
          updated_at?: string | null
        }
        Update: {
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_razao_social?: string
          numero?: string | null
          pais?: string | null
          status?: string | null
          tipo_pessoa?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          celular: string | null
          cpf: string
          created_at: string | null
          id: string
          invitation_id: string | null
          nome: string
          updated_at: string | null
        }
        Insert: {
          celular?: string | null
          cpf: string
          created_at?: string | null
          id: string
          invitation_id?: string | null
          nome: string
          updated_at?: string | null
        }
        Update: {
          celular?: string | null
          cpf?: string
          created_at?: string | null
          id?: string
          invitation_id?: string | null
          nome?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "user_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      ref_finalidades_uso: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      ref_municipios_ms: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      ref_parametros_analise: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          grupo: string
          id: string
          metodologia: string | null
          nome: string
          ordem_exibicao: number
          unidade: string | null
          valor_referencia: string | null
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          grupo: string
          id?: string
          metodologia?: string | null
          nome: string
          ordem_exibicao?: number
          unidade?: string | null
          valor_referencia?: string | null
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          grupo?: string
          id?: string
          metodologia?: string | null
          nome?: string
          ordem_exibicao?: number
          unidade?: string | null
          valor_referencia?: string | null
        }
        Relationships: []
      }
      ref_sistemas_aquiferos: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      ref_tipos_ato: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      ref_unidades_planejamento: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      requerentes: {
        Row: {
          celular: string | null
          contato_medicao_celular: string | null
          contato_medicao_cpf: string | null
          contato_medicao_email: string | null
          contato_medicao_nome: string | null
          cpf_cnpj: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          id: string
          nome_razao_social: string
          status: string
          tipo_pessoa: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          celular?: string | null
          contato_medicao_celular?: string | null
          contato_medicao_cpf?: string | null
          contato_medicao_email?: string | null
          contato_medicao_nome?: string | null
          cpf_cnpj: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          nome_razao_social: string
          status?: string
          tipo_pessoa?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          celular?: string | null
          contato_medicao_celular?: string | null
          contato_medicao_cpf?: string | null
          contato_medicao_email?: string | null
          contato_medicao_nome?: string | null
          cpf_cnpj?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          nome_razao_social?: string
          status?: string
          tipo_pessoa?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          celular: string | null
          cpf: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          nome: string
          perfil: Database["public"]["Enums"]["user_profile"]
          role_v2: Database["public"]["Enums"]["app_role_v2"] | null
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          celular?: string | null
          cpf: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          nome: string
          perfil: Database["public"]["Enums"]["user_profile"]
          role_v2?: Database["public"]["Enums"]["app_role_v2"] | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          celular?: string | null
          cpf?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          nome?: string
          perfil?: Database["public"]["Enums"]["user_profile"]
          role_v2?: Database["public"]["Enums"]["app_role_v2"] | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          role_v2: Database["public"]["Enums"]["app_role_v2"] | null
          user_id: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          role_v2?: Database["public"]["Enums"]["app_role_v2"] | null
          user_id: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          role_v2?: Database["public"]["Enums"]["app_role_v2"] | null
          user_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          auth_user_id: string | null
          celular: string | null
          contato_medicao_celular: string | null
          contato_medicao_cpf: string | null
          contato_medicao_email: string | null
          cpf: string
          created_at: string | null
          email: string | null
          id: string
          nome: string
          perfil: string
          senha_hash: string | null
          status: string | null
          status_aprovacao: string | null
          token_expiracao: string | null
          token_senha: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          celular?: string | null
          contato_medicao_celular?: string | null
          contato_medicao_cpf?: string | null
          contato_medicao_email?: string | null
          cpf: string
          created_at?: string | null
          email?: string | null
          id?: string
          nome: string
          perfil: string
          senha_hash?: string | null
          status?: string | null
          status_aprovacao?: string | null
          token_expiracao?: string | null
          token_senha?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          celular?: string | null
          contato_medicao_celular?: string | null
          contato_medicao_cpf?: string | null
          contato_medicao_email?: string | null
          cpf?: string
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          perfil?: string
          senha_hash?: string | null
          status?: string | null
          status_aprovacao?: string | null
          token_expiracao?: string | null
          token_senha?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: { invitation_token: string; user_id: string }
        Returns: Json
      }
      current_usuario_id: { Args: never; Returns: string }
      expire_old_invitations: { Args: never; Returns: undefined }
      generate_invitation_token: { Args: never; Returns: string }
      get_invitation_by_token: { Args: { token: string }; Returns: Json }
      get_invitation_by_token_public: {
        Args: { p_token: string }
        Returns: {
          celular: string
          cpf: string
          email: string
          expires_at: string
          id: string
          nome: string
          perfil: Database["public"]["Enums"]["user_profile"]
          status: Database["public"]["Enums"]["invitation_status"]
        }[]
      }
      has_role: {
        Args: {
          _auth_user_id: string
          _role: Database["public"]["Enums"]["app_role_v2"]
        }
        Returns: boolean
      }
      is_corpo_tecnico: { Args: { _auth_user_id: string }; Returns: boolean }
      is_corpo_tecnico_legacy: {
        Args: { _auth_user_id: string }
        Returns: boolean
      }
      is_requerente: { Args: { _user_id: string }; Returns: boolean }
      is_tecnico: { Args: { _auth_user_id: string }; Returns: boolean }
      is_tecnico_legacy: { Args: { _auth_user_id: string }; Returns: boolean }
      sync_confirmed_users: {
        Args: never
        Returns: {
          email: string
          status: string
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "gestor"
      app_role_v2: "corpo_tecnico" | "tecnico"
      invitation_status: "pending" | "accepted" | "expired"
      origem_cadastro_nd_ne: "chatbot" | "sistema"
      periodo_medicao: "chuvoso" | "seco"
      prioridade_licenca: "URGENTE" | "ALTA" | "MÉDIA" | "BAIXA"
      tipo_medidor: "hidrometro" | "horimetro"
      user_profile: "corpo_tecnico" | "tecnico" | "requerente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "gestor"],
      app_role_v2: ["corpo_tecnico", "tecnico"],
      invitation_status: ["pending", "accepted", "expired"],
      origem_cadastro_nd_ne: ["chatbot", "sistema"],
      periodo_medicao: ["chuvoso", "seco"],
      prioridade_licenca: ["URGENTE", "ALTA", "MÉDIA", "BAIXA"],
      tipo_medidor: ["hidrometro", "horimetro"],
      user_profile: ["corpo_tecnico", "tecnico", "requerente"],
    },
  },
} as const
<claude-code-hint v="1" type="plugin" value="supabase@claude-plugins-official" />
