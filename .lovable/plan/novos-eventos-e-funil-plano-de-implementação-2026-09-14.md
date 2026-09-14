# Novos eventos e funil — plano de implementação

## Objetivo
Ampliar o dashboard BlackTrack para acompanhar toda a jornada de conversão, receita e retorno das campanhas, mantendo a integração direta com a Meta e o visual dark atual.

## Dados e cálculos
- Extrair dos arrays `actions` e `action_values` os eventos Install, Activate, Registration, StartTrial, InitiatedCheckout, Subscribe, Purchase, ViewContent, Search e DetectorQuery.
- Aceitar as variações de nomes retornadas pela Meta, incluindo prefixos `offsite_conversion.`, versões `fb_pixel_` e nomes sem `app_custom_event.fb_mobile_`; eventos ausentes serão zero.
- Incluir `action_values` nas consultas agregada, diária e por campanha.
- Calcular faturamento, CPA, ROAS, assinantes e todas as taxas do funil sem divisão por zero.

## Interface
- Substituir os seis indicadores atuais por oito cards: quatro financeiros e quatro de volume.
- Inserir um funil de conversão responsivo com seis etapas e barras proporcionais entre os indicadores e o gráfico temporal.
- Adicionar o bloco “Eventos de Engajamento” com Abriu Confronto, Buscas e Detector.
- Atualizar o gráfico temporal para Gasto, Installs e Assinantes, com detalhes adicionais no tooltip.
- Atualizar a tabela para as onze colunas solicitadas, preservando busca, ordenação, destaques e rolagem horizontal.

## Validação
- Confirmar os cálculos com dados simulados, incluindo eventos ausentes e variações de `action_type`.
- Verificar login, carregamento e layout do dashboard em desktop e celular.
- Confirmar ausência de erros de compilação e execução.
