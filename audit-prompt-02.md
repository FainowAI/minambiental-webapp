# Auditoria — Refactor Sprint 0b (prompt_02)

**Branch**: `refactor/sprint-0b-model`
**Commit auditado**: `477c26d refactor(sprint-0b): migrate to new data model`
**Data**: 2026-05-12
**Spec**: `prompt.md`

**Resultados objetivos**
- `npm run build` → exit 0
- `npx tsc --noEmit` → limpo
- `npm run lint` → 72 erros `no-explicit-any` + 12 warnings `exhaustive-deps` (pré-existentes, não bloqueiam)

---

## Status por Tarefa

| # | Tarefa | Status |
|---|---|---|
| 1 | Regenerar types | ⚠️ Foi feito antes da migration final |
| 2 | requerenteService | ✅ |
| 3 | userService | ⚠️ Lê `role_v2` |
| 4 | useAuth | ⚠️ Lê `role_v2` |
| 5 | licenseService | ✅ |
| 6 | contractService | ❌ Bug de mapping + dead code + CA07 incompleta |
| 7 | monitoringService | ❌ MeterReadingModal não migrado; service usa `usuarios.perfil` |
| 8 | analysisService | ❌ Persiste em JSONB em vez de `contrato_analise_parametros` |
| 9 | ndneService | ✅ |
| 10 | notificationService | ✅ |
| 11 | Forms | ⚠️ EditLicense e EditUser ficaram legacy |
| 12 | Edge functions | ✅ |
| 13 | ProtectedRoute | ✅ |
| 14 | analysisParameters.ts deprecated | ✅ |
| 15 | Smoke tests | — não executado |

---

## ❌ Bugs funcionais hoje (antes da migration 015)

### 1. `contractService.ts:230` — mapping de `numero_contrato` quebrado
`numeroContrato` está sendo gravado em `numero_endereco` (a coluna do **endereço**). A coluna `numero_contrato` nunca é escrita. **Esse é exatamente o bug que a Tarefa 6 mandava corrigir.**

### 2. `MeterReadingModal.tsx:117, 136, 352, 380, 404, 446, 457` — Tarefa 7 desfeita
Sete queries ainda batem na tabela legacy `monitoramentos`. Modal inteiro não foi migrado para `contrato_monitoramentos` / `referencia_ano` / `referencia_mes` / `contrato_id`.

### 3. `monitoringService.ts:104, 149-152, 210-214` — service half-migrated
- `:104` — `.from('monitoramentos')` (legacy)
- `:149-152` — `.from('usuarios').eq('perfil','Requerente')` para identificar Requerente (Requerente não está mais em `usuarios`)
- `:210-214` — `.from('usuarios').eq('perfil','Corpo Técnico')` — vai retornar vazio post-015

### 4. `ContractFormPage.tsx:251-261` — Requerente lookup errado
Chama `getUserById(license.requerente.id)` para ler `contato_medicao_*`. Deveria ser `requerenteService.getRequerenteById`.

### 5. `ContractFormPage.tsx:424-429` — CA07 com fonte errada
Busca Técnico em `from('usuarios').select(...).eq('perfil','Técnico')`. Deveria usar JOIN com `user_roles.role='tecnico'` (e dropar a leitura de `perfil`).

### 6. `NDNEModal.tsx:114-117` — dropdown errado
Lista `usuarios.perfil='Corpo Técnico'`. Conceitualmente errado (ND/NE deveria listar Técnico, não Corpo Técnico) **e** usa coluna que será dropada.

### 7. `PendingApproval.tsx:20-30` — comparação de casing
Compara `status === 'Aprovado'/'Rejeitado'` (capitalizado) enquanto `userService` escreve lowercase. Redirect de aprovação silenciosamente quebrado.

### 8. `contractService.ts:611-617` — CA06 com dead code
`updateRequerenteContatoMedicao` escreve em `usuarios.contato_medicao_*` (dropado em 015). O caminho correto `syncContatoMedicaoIntoRequerente` existe em paralelo. A função antiga deve ser removida e callers verificados.

### 9. `contractService.ts:785` — CA07 não lança a mensagem do prompt
`findTecnicoByCpf` retorna `null` em vez de lançar `"Técnico não encontrado..."`. Caller também não está validando.

### 10. `reportService.ts:140-145` — join errado
Join `licencas` ↔ `usuarios:requerente_id`. O FK agora aponta para `requerentes`. Alias de join e colunas lidas (`contato_medicao_*`) estão erradas.

---

## ⚠️ Vai quebrar quando migration 015 rodar

### Tarefa 1 incompleta
Types foram regenerados antes da migration que renomeia `role_v2 → role` e dropa colunas legacy. Resultado: `types.ts` ainda expõe `role_v2`, `app_role_v2`, e todos os legacy de `usuarios`. **Re-rodar `supabase gen types` após 015.**

### `role_v2` espalhado pelo código
Vai virar `role` post-015. Hoje funciona porque a column ainda existe.
- `src/services/userService.ts:140, 145, 164, 169, 194, 316`
- `src/services/contractService.ts:775, 794, 796`
- `src/hooks/useAuth.ts:6, 69, 87-95`

### Forms de edição não refatoradas
- `EditLicense.tsx:805-927` — selects hardcoded inline (não usa `getRef*`/`useQuery` em `ref_*`)
- `EditLicense.tsx:874` — usa constante `MS_MUNICIPIOS` em vez de `ref_municipios_ms`
- `EditLicense.tsx:363-367` — `data_fim` auto-calc sobrescreve edição manual (sem `manuallyEditedDataFimRef` guard)
- `EditUser.tsx:72, 600-611` — enum perfil ainda `'Corpo Técnico' | 'Requerente' | 'Técnico'`; não foi separada em fluxo funcionário/requerente

---

## ❌ Tarefa 8 — divergência grave com o spec

`analysisService.ts:20-30, 111-122, 247-251` — implementação grava valores de parâmetros em `parametros_extras` JSONB + colunas dedicadas `resultado_ph/cor/turbidez/temperatura_agua`. O prompt exige inserir rows em `contrato_analise_parametros` referenciando `ref_parametros_analise`.

Comentário no código admite o gap e culpa migration ausente. **Decisão pendente**: verificar se a migration realmente não criou `contrato_analise_parametros`, ou se foi um workaround temporário. Pode mudar drasticamente o escopo do fix.

`getAnalysisById:305-308` também não faz o JOIN com `ref_parametros_analise`.

---

## Inconsistências menores

- **Casing de status**: `requerenteService.softDelete` usa `'ativo'` (lowercase); `userService.hasActiveContracts:293` usa `status='Ativo'` (capitalizado). Uma das duas está errada conforme o que o banco aceita.
- **Lookup helpers em `licenseService:460, 470, 480, 490, 500`**: castam tables como `as any` porque types.ts está stale. Cosmético — some quando T1 for re-rodada.

---

## Back-compat declarado no commit (NÃO são bugs)

Estes arquivos lêem `usuarios.perfil` propositalmente até migration 015, conforme commit msg:
- `src/pages/Users.tsx`
- `src/pages/ViewUser.tsx`
- `src/pages/EditUser.tsx`
- `src/pages/FirstAccess.tsx`
- `src/components/LoginModal.tsx`

---

## Recomendação de próximos passos

1. **Corrigir os 10 bugs funcionais** listados acima — todos quebram comportamento hoje, não dependem da 015.
2. **Decidir sobre T8** antes de qualquer fix em analysisService.
3. **Deixar role_v2 + EditLicense + EditUser + reportService para prompt_03** — fazem parte do cleanup pós-015 já planejado.
4. **Rodar Tarefa 15 (smoke)** depois dos fixes funcionais.
