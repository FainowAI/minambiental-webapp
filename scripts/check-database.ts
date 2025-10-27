import { supabase } from '../src/integrations/supabase/client';

async function checkDatabase() {
  try {
    console.log("Verificando estrutura do banco de dados...\n");

    // Test 1: Query usuarios table to see what columns exist
    console.log("1. Testando query na tabela usuarios...");
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1);

    if (error) {
      console.error("  ❌ Erro ao consultar usuarios:", error.message);
      console.error("  Detalhes:", error);
    } else {
      console.log("  ✅ Query executada com sucesso!");
      if (usuarios && usuarios.length > 0) {
        console.log("  Colunas disponíveis:", Object.keys(usuarios[0]));
        const user = usuarios[0];
        console.log("  Campos importantes:");
        console.log("    - auth_user_id:", user.auth_user_id || "❌ NÃO EXISTE");
        console.log("    - status_aprovacao:", user.status_aprovacao || "❌ NÃO EXISTE");
        console.log("    - perfil:", user.perfil || "❌ NÃO EXISTE");
        console.log("    - token_senha:", user.token_senha !== undefined ? "✅ EXISTE" : "❌ NÃO EXISTE");
        console.log("    - token_expiracao:", user.token_expiracao !== undefined ? "✅ EXISTE" : "❌ NÃO EXISTE");
      } else {
        console.log("  ⚠️  Tabela existe mas está vazia");
      }
    }

    // Test 2: Check if we can query with status_aprovacao filter
    console.log("\n2. Testando filtro por status_aprovacao...");
    const { data: pendingUsers, error: filterError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('status_aprovacao', 'Pendente');

    if (filterError) {
      console.error("  ❌ Erro ao filtrar por status_aprovacao:", filterError.message);
      console.error("  Isso indica que a coluna status_aprovacao provavelmente não existe!");
    } else {
      console.log("  ✅ Filtro funciona! Usuários pendentes:", pendingUsers?.length || 0);
    }

    // Test 3: Check if auth_user_id column exists
    console.log("\n3. Testando filtro por auth_user_id...");
    const { data: authTest, error: authError } = await supabase
      .from('usuarios')
      .select('auth_user_id')
      .limit(1);

    if (authError) {
      console.error("  ❌ Erro ao selecionar auth_user_id:", authError.message);
      console.error("  Isso indica que a coluna auth_user_id provavelmente não existe!");
    } else {
      console.log("  ✅ Coluna auth_user_id existe!");
    }

    console.log("\n" + "=".repeat(60));
    console.log("CONCLUSÃO:");
    console.log("=".repeat(60));

    if (error || filterError || authError) {
      console.log("\n⚠️  ATENÇÃO: A tabela usuarios precisa ser atualizada!");
      console.log("\nPara corrigir, execute o seguinte SQL no SQL Editor do Supabase:");
      console.log("(Dashboard > SQL Editor > New Query)\n");
      console.log("Copie e cole o conteúdo do arquivo:");
      console.log("supabase/migrations/20250123180000_apply_all_user_fixes.sql\n");
    } else {
      console.log("\n✅ Banco de dados está configurado corretamente!");
    }

  } catch (error) {
    console.error("\n❌ Erro fatal:", error);
  }
}

checkDatabase();
