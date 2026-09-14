# Dashboard sem Trials, datas personalizadas e anúncios

## Objetivo
Aplicar as cinco alterações solicitadas ao BlackTrack: remover StartTrial, reorganizar indicadores, permitir intervalo personalizado, alternar a tabela entre campanhas e anúncios e manter o funil como um fluxo Sankey contínuo.

## Experiência
- Reorganizar os indicadores em três cards principais maiores e cinco cards compactos, com os cálculos, ícones e estados de cor especificados.
- Adicionar “Personalizado” aos períodos, abrindo um calendário em português com seleção de intervalo, dois meses no desktop e um no celular, datas futuras bloqueadas e ações Limpar, Cancelar e Aplicar.
- Incluir abas “Por Campanha” e “Por Anúncio”, busca contextual, ordenação por todas as colunas e paginação de 50 anúncios.
- Exibir o funil Install → Activate → Registration → InitiatedCheckout → Subscribe em uma única forma SVG contínua, com curvas suaves, espessura proporcional e gradiente amarelo–laranja–verde.

## Dados e cálculos
- Remover `StartTrial`, `startTrials` e “Trials” dos tipos, extração, dados vazios, gráfico, tabela e textos da aplicação.
- Ampliar a consulta em paralelo para trazer insights e status de anúncios com `level=ad`, `ad_name`, `ad_id`, `campaign_name` e limite 200.
- Reutilizar a normalização de eventos e os cálculos de CPI, CPA, ROAS e assinantes para campanhas e anúncios.
- Manter o intervalo aplicado separado da seleção temporária, evitando recarregar dados ao cancelar o calendário.

## Estrutura técnica
- Estender os tipos retornados pela integração para incluir anúncios e compartilhar um tipo comum de linha de desempenho.
- Usar o calendário Shadcn já disponível com seleção `range`, locale pt-BR e estilos semânticos do tema escuro.
- Manter todas as consultas diretas no navegador, preservando tratamento do erro 190 e os dados anteriores em caso de falha.

## Validação
- Confirmar que não existe qualquer referência a StartTrial, startTrials ou Trials nos arquivos ativos.
- Validar presets e intervalo personalizado, incluindo Limpar, Cancelar, Aplicar, datas futuras e adaptação celular/desktop.
- Validar abas, busca, ordenação, cores condicionais e paginação com dados simulados de campanhas e mais de 50 anúncios.
- Revisar o Sankey, os indicadores e a tabela em desktop e celular, sem erros de compilação ou execução.
