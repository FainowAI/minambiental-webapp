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
          coliformes_totais: number | null
          condutividade: number | null
          cor: number | null
          created_at: string | null
          data_coleta: string
          dureza_total: number | null
          escherichia_coli: number | null
          id: string
          laboratorio: string | null
          licenca_id: string
          observacoes: string | null
          parametros_adicionais: Json | null
          ph: number | null
          solidos_totais: number | null
          status: string | null
          turbidez: number | null
          updated_at: string | null
        }
        Insert: {
          arquivo_laudo?: string | null
          coliformes_totais?: number | null
          condutividade?: number | null
          cor?: number | null
          created_at?: string | null
          data_coleta: string
          dureza_total?: number | null
          escherichia_coli?: number | null
          id?: string
          laboratorio?: string | null
          licenca_id: string
          observacoes?: string | null
          parametros_adicionais?: Json | null
          ph?: number | null
          solidos_totais?: number | null
          status?: string | null
          turbidez?: number | null
          updated_at?: string | null
        }
        Update: {
          arquivo_laudo?: string | null
          coliformes_totais?: number | null
          condutividade?: number | null
          cor?: number | null
          created_at?: string | null
          data_coleta?: string
          dureza_total?: number | null
          escherichia_coli?: number | null
          id?: string
          laboratorio?: string | null
          licenca_id?: string
          observacoes?: string | null
          parametros_adicionais?: Json | null
          ph?: number | null
          solidos_totais?: number | null
          status?: string | null
          turbidez?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analises_agua_licenca_id_fkey"
            columns: ["licenca_id"]
            isOneToOne: false
            referencedRelation: "dashboard_licencas"
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
          estado: string | null
          estado_obra: string | null
          finalidade: string | null
          id: string
          licenca_id: string
          nome_contato: string | null
          nome_tecnico: string | null
          numero: string | null
          numero_obra: string | null
          pais: string | null
          pais_obra: string | null
          periodo_medicao_fim: string | null
          periodo_medicao_inicio: string | null
          previsao_termino: string | null
          rnp: string | null
          rua: string | null
          rua_obra: string | null
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
          estado?: string | null
          estado_obra?: string | null
          finalidade?: string | null
          id?: string
          licenca_id: string
          nome_contato?: string | null
          nome_tecnico?: string | null
          numero?: string | null
          numero_obra?: string | null
          pais?: string | null
          pais_obra?: string | null
          periodo_medicao_fim?: string | null
          periodo_medicao_inicio?: string | null
          previsao_termino?: string | null
          rnp?: string | null
          rua?: string | null
          rua_obra?: string | null
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
          estado?: string | null
          estado_obra?: string | null
          finalidade?: string | null
          id?: string
          licenca_id?: string
          nome_contato?: string | null
          nome_tecnico?: string | null
          numero?: string | null
          numero_obra?: string | null
          pais?: string | null
          pais_obra?: string | null
          periodo_medicao_fim?: string | null
          periodo_medicao_inicio?: string | null
          previsao_termino?: string | null
          rnp?: string | null
          rua?: string | null
          rua_obra?: string | null
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
            referencedRelation: "dashboard_licencas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_licenca_id_fkey"
            columns: ["licenca_id"]
            isOneToOne: false
            referencedRelation: "licencas"
            referencedColumns: ["id"]
          },
        ]
      }
      licencas: {
        Row: {
          created_at: string | null
          data_fim: string
          data_inicio: string
          estado: string
          finalidade_uso: string
          id: string
          latitude: number | null
          longitude: number | null
          municipio: string
          numero_licenca: string
          objeto_ato: string | null
          pdf_licenca: string | null
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
          estado: string
          finalidade_uso: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipio: string
          numero_licenca: string
          objeto_ato?: string | null
          pdf_licenca?: string | null
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
          estado?: string
          finalidade_uso?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipio?: string
          numero_licenca?: string
          objeto_ato?: string | null
          pdf_licenca?: string | null
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
            referencedRelation: "pessoas"
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
            referencedRelation: "dashboard_licencas"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "dashboard_licencas"
            referencedColumns: ["id"]
          },
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
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      dashboard_licencas: {
        Row: {
          cpf_cnpj: string | null
          data_fim: string | null
          data_inicio: string | null
          finalidade_uso: string | null
          id: string | null
          monitoramentos_pendentes: number | null
          municipio: string | null
          numero_licenca: string | null
          requerente: string | null
          situacao_vencimento: string | null
          status: string | null
          total_monitoramentos: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invitation: {
        Args: { invitation_token: string; user_id: string }
        Returns: Json
      }
      expire_old_invitations: { Args: never; Returns: undefined }
      generate_invitation_token: { Args: never; Returns: string }
      get_invitation_by_token: { Args: { token: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
      invitation_status: "pending" | "accepted" | "expired"
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
      invitation_status: ["pending", "accepted", "expired"],
      user_profile: ["corpo_tecnico", "tecnico", "requerente"],
    },
  },
} as const
