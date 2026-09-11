# Dashboard de App Install — plano de implementação

## Objetivo
Construir a primeira tela como um dashboard responsivo e exclusivamente dark para acompanhar campanhas de instalação de aplicativo, com login local, configuração da conexão Meta e dados obtidos diretamente no navegador.

## Experiência
- Criar login centralizado com usuário e senha definidos por variáveis públicas do app, sessão persistida no navegador e saída pelo cabeçalho.
- Montar cabeçalho fixo sem barra lateral, com marca, períodos, horário da última atualização, atualização manual, configurações e saída.
- Criar os seis indicadores, gráfico diário de gasto versus downloads e tabela pesquisável e ordenável por campanha.
- Incluir carregamentos visuais, estados vazios, tentativa novamente, alertas amigáveis e aviso permanente para conexão expirada.
- Adaptar cards, cabeçalho, gráfico e tabela para celular, tablet e desktop.

## Conexão Meta
- Ler token e conta primeiro do armazenamento do navegador e usar as variáveis do app como fallback.
- Manter o token mascarado no modal, testar a conexão, salvar a configuração e atualizar todos os dados após uma conexão válida.
- Fazer em paralelo as quatro consultas da Graph API v19.0, normalizar conta com ou sem prefixo `act_` e processar downloads ausentes como zero.
- Interromper novas consultas automáticas após erro 190, preservando dados já exibidos até a conexão ser corrigida.

## Estrutura técnica
- Separar tipos, formatação/períodos, cliente Meta e blocos visuais em módulos focados.
- Usar os componentes de interface já presentes, ícones Lucide, Recharts e notificações Sonner.
- Proteger leituras de `localStorage` para manter a renderização inicial estável.
- Definir cores, tipografia, sombras e estados no sistema visual global com tokens semânticos.
- Adicionar metadados próprios da página e carregar Inter pelo cabeçalho do documento.

## Validação
- Conferir o fluxo de login, configurações, filtros, busca, ordenação, atualização e saída no navegador.
- Verificar os estados sem configuração, carregando, vazio, erro comum e token expirado.
- Revisar visualmente desktop e celular e confirmar que não há erros de compilação ou execução.

## Observação de segurança
As credenciais de login e o token serão acessíveis no navegador por exigência do escopo sem servidor. Essa barreira é adequada apenas para acesso básico, não para proteção forte de dados ou segredos.
