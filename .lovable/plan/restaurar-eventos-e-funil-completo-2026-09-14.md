# Restaurar eventos e funil completo

## Objetivo
Atualizar o dashboard para voltar a acompanhar StartTrial e apresentar todos os eventos, indicadores e cálculos solicitados.

## Alterações
- Restaurar `StartTrial` na leitura dos eventos da Meta, mantendo as variações de nomes e valores ausentes como zero.
- Manter `action_values` nas consultas e os cálculos de faturamento, CPA, ROAS e assinantes.
- Voltar os indicadores de volume para quatro cards: Installs, Cadastros, Trials e Assinantes.
- Atualizar o funil para seis etapas: Install, Activate, Registration, StartTrial, InitiatedCheckout e Subscribe/Purchase, com proporções e percentuais relativos a Install.
- Restaurar Trials na tabela de campanhas, incluindo ordenação.
- Restaurar Trials nos detalhes do gráfico temporal; manter as três séries Gasto, Installs e Assinantes.
- Preservar os eventos de engajamento, o tema escuro, a integração direta com a Meta e todos os estados existentes.

## Validação
- Confirmar extração de variações de `action_type`, inclusive evento ausente.
- Verificar os cálculos e a renderização com dados simulados.
- Revisar dashboard em desktop e celular e confirmar compilação sem erros.
