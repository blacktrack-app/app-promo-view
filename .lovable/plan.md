# Remoção de Trials e novo funil Sankey

## Objetivo
Simplificar a jornada de conversão removendo StartTrial de toda a aplicação e substituir o funil atual por um fluxo Sankey contínuo, suave e responsivo, seguindo a referência visual enviada.

## Alterações
- Remover `startTrials` dos tipos, dados vazios, extração dos eventos da Meta e cálculos exibidos.
- Remover o card Trials, deixando os KPIs de volume em três colunas: Installs, Cadastros e Assinantes.
- Remover Trials do detalhe diário e da tabela de campanhas, incluindo ordenação e tooltip.
- Atualizar o funil para cinco etapas: Install, Activate, Registration, InitiatedCheckout e Subscribe.
- Construir o Sankey em SVG puro, com uma única forma fechada, curvas Bézier entre as etapas e espessura proporcional aos valores.
- Aplicar gradiente contínuo do amarelo/dourado ao verde/ciano, mantendo percentuais dentro do fluxo, rótulos acima e valores absolutos abaixo.
- Garantir largura mínima e rolagem horizontal no celular para preservar a leitura sem deformar o fluxo.

## Validação
- Confirmar que não restam referências a StartTrial ou Trials na aplicação.
- Testar o funil com valores normais, zeros e quedas acentuadas entre etapas.
- Verificar visualmente o fluxo em desktop e celular.
- Confirmar ausência de erros de compilação e execução.
