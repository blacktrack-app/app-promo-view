# App Install Insights

PROMPT COMPLETO — Dashboard de App Install (Facebook Ads)

Dashboard exclusivo para monitoramento de campanhas de instalação de aplicativo

---

VISÃO GERAL

Dashboard web simples, moderno e responsivo para um único cliente. Consome a Meta Marketing API (Facebook Graph API) diretamente do frontend para exibir métricas de campanhas de App Install. Sem backend — toda a comunicação é feita direto com a API do Facebook via token de acesso.

---

STACK TÉCNICA

- React + TypeScript + Tailwind CSS + shadcn/ui + Recharts

- Sem backend, sem Supabase, sem banco de dados

- Chamadas diretas à Facebook Graph API v19.0 do frontend

- Autenticação simples via variáveis de ambiente (login/senha fixos)

---

DESIGN SYSTEM

Modo Dark (único, sem toggle).

Background principal: #0a0a0a

Background cards: #1a1a1a

Background cards hover: #252525

Bordas: #2a2a2a

Texto primário: #FFFFFF

Texto secundário: #888888

Cor de destaque: #d1de08 (amarelo-limão) — botões, destaques, variações positivas, elementos ativos

Cor negativa: #ef4444 (vermelho)

Sucesso: #22c55e

Warning: #f59e0b

Font: Inter (Google Fonts)

Logo: Nome do app ou "Dashboard" estilizado no header

NÃO usar sidebar — layout de página inteira

Cards com rounded-xl, sombras sutis (shadow-lg shadow-black/20)

---

AUTENTICAÇÃO

Login fixo via variáveis de ambiente:

VITE_DASH_USER=usuario

VITE_DASH_PASSWORD=senha123

Tela de Login:

- Background #0a0a0a

- Card centralizado com fundo #1a1a1a, rounded-xl

- Campo "Usuário" (input text)

- Campo "Senha" (input password)

- Botão "Entrar" na cor #d1de08 com texto preto

- Se credenciais incorretas: mensagem vermelha "Usuário ou senha incorretos"

- Sem link de "Criar conta" ou "Esqueci a senha"

Sessão:

- Ao fazer login, salvar flag em localStorage (ex: "authenticated": true)

- Ao recarregar a página, verificar localStorage e manter logado

- Botão "Sair" no header que limpa localStorage e volta para login

- Todas as rotas bloqueadas se não autenticado

---

CONFIGURAÇÃO DO FACEBOOK

O token e o account_id são configurados de duas formas:

1. Via variáveis de ambiente (padrão):

VITE_FB_ACCESS_TOKEN=EAAxxxxx

VITE_FB_ACCOUNT_ID=act_XXXXXXXXX

2. Via modal de configuração no app (para atualizar sem redeploy):

- Ícone de engrenagem (⚙️) discreto no header, ao lado do botão Sair

- Ao clicar, abre modal com:

  - Campo "Access Token" (preenchido com o valor atual, editável)

  - Campo "Account ID" (preenchido com o valor atual, editável)

  - Botão "Testar Conexão" → chama GET https://graph.facebook.com/v19.0/me?access_token={token}

    - Se sucesso: ✅ "Conexão válida — {nome do usuário}"

    - Se erro: ❌ "Token inválido ou expirado"

  - Botão "Salvar" → salva em localStorage (sobrescreve as variáveis de ambiente)

- Ao carregar o app: verificar localStorage primeiro, se não tiver, usar variáveis de ambiente

---

TRATAMENTO DE TOKEN EXPIRADO

Se QUALQUER chamada à API do Facebook retornar erro 190 (token expirado/inválido):

1. Parar de fazer chamadas

2. Exibir banner no topo do dashboard (fixo, não dismissable):

   Fundo #f59e0b com texto preto:

   "⚠️ A sincronização com o Gerenciador de Anúncios precisa ser atualizada. [Atualizar Conexão]"

3. Ao clicar "Atualizar Conexão" → abre o modal de configuração (engrenagem)

4. Após salvar novo token válido → refetch automático de todos os dados

---

ESTRUTURA DA PÁGINA (após login)

HEADER (fixo no topo):

- Logo/Nome do app à esquerda

- Filtros de data ao centro

- "Última atualização: DD/MM/YYYY HH:MM" + Botão 🔄 Atualizar + ⚙️ Configurações + Botão Sair à direita

---

FILTROS DE DATA

Botões em linha horizontal:

[ Hoje ] [ Ontem ] [ Últimos 7 dias ] [ Últimos 30 dias ] [ Este Mês ]

Botão ativo: fundo #d1de08 com texto preto

Botões inativos: fundo #1a1a1a com texto #888888

Default ao carregar: "Últimos 7 dias"

Ao selecionar um filtro:

- Recalcular as datas (since/until)

- Refetch todos os dados da API do Facebook

- Atualizar todos os cards, gráfico e tabela

---

KPI CARDS (6 cards em grid, 3 colunas em desktop, 2 em tablet, 1 em mobile)

Card 1 — Total Gasto:

- Ícone: DollarSign (Lucide) em círculo cinza

- Label: "TOTAL GASTO" em text-xs uppercase cinza

- Valor: R$ X.XXX,XX em text-3xl bold branco

- Fonte: campo "spend" do response de insights

Card 2 — Total de Downloads:

- Ícone: Download (Lucide) em círculo #d1de08

- Label: "DOWNLOADS"

- Valor: número grande em branco

- Fonte: campo "actions" filtrando action_type === "mobile_app_install", pegar "value"

Card 3 — Custo por Download (CPI):

- Ícone: TrendingDown (Lucide) em círculo laranja

- Label: "CUSTO POR DOWNLOAD"

- Valor: R$ X,XX em branco

- Cálculo: spend / mobile_app_install

- Se downloads = 0: mostrar "—"

Card 4 — Taxa de Download (CVR):

- Ícone: Percent (Lucide) em círculo verde

- Label: "TAXA DE DOWNLOAD"

- Valor: X,XX% em branco

- Cálculo: (mobile_app_install / inline_link_clicks) × 100

- Se cliques = 0: mostrar "—"

Card 5 — Cliques no Link:

- Ícone: MousePointerClick (Lucide) em círculo azul

- Label: "CLIQUES NO LINK"

- Valor principal: número de cliques (inline_link_clicks)

- Valor secundário abaixo: "CTR: X,XX%" em text-xs #d1de08

- Fonte CTR: campo "inline_link_click_ctr"

Card 6 — CPM Médio:

- Ícone: Eye (Lucide) em círculo roxo

- Label: "CPM MÉDIO"

- Valor: R$ X,XX em branco

- Fonte: campo "cpm"

---

GRÁFICO — Gasto vs Downloads por Dia

Abaixo dos KPI cards, um gráfico de área/linha temporal ocupando largura total:

- Eixo X: datas do período selecionado

- Eixo Y esquerdo: Valor Gasto (R$) — linha/área vermelha (#ef4444) com opacidade

- Eixo Y direito: Downloads — linha/área amarela (#d1de08) com opacidade

- Tooltip ao hover: data, gasto do dia, downloads do dia, CPI do dia

- Legenda abaixo: "Gasto (R$)" e "Downloads"

- Fundo transparente, grid lines em #2a2a2a

Dados: chamar insights com time_increment=1 para dados diários

API call para o gráfico:

GET https://graph.facebook.com/v19.0/act_{ACCOUNT_ID}/insights

?fields=spend,actions,inline_link_clicks

&time_increment=1

&time_range={"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}

&level=account

&access_token={TOKEN}

Processar cada dia: extrair spend e mobile_app_install dos actions.

---

TABELA DE CAMPANHAS

Abaixo do gráfico, tabela com dados por campanha:

API call:

GET https://graph.facebook.com/v19.0/act_{ACCOUNT_ID}/insights

?fields=campaign_name,campaign_id,spend,actions,inline_link_clicks

&level=campaign

&time_range={"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}

&limit=100

&access_token={TOKEN}

Para status das campanhas:

GET https://graph.facebook.com/v19.0/act_{ACCOUNT_ID}/campaigns

?fields=id,name,status

&limit=100

&access_token={TOKEN}

Colunas:

| Coluna | Fonte | Formato |

|--------|-------|---------|

| Campanha | campaign_name | Texto |

| Status | campaign status da segunda chamada | Badge: "Ativo" verde, "Pausado" cinza |

| Gasto | spend | R$ X.XXX,XX |

| Downloads | actions → mobile_app_install | Número |

| CPI | spend / downloads | R$ X,XX |

| Cliques | inline_link_clicks | Número |

Funcionalidades:

- Ordenação por qualquer coluna (default: gasto desc)

- Busca por nome de campanha

- Sem paginação (máximo ~50 campanhas, mostra todas)

- CPI alto (> média × 1.5): texto em #f59e0b (warning)

- Linhas com downloads = 0 e gasto > 0: fundo levemente avermelhado

---

CHAMADAS À API DO FACEBOOK

Todas as chamadas usam o token e account_id configurados:

1. Insights agregados (KPI cards):

GET /act_{ID}/insights?fields=spend,actions,inline_link_clicks,inline_link_click_ctr,cpm&time_range={"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}&access_token={TOKEN}

2. Insights diários (gráfico):

GET /act_{ID}/insights?fields=spend,actions&time_increment=1&time_range={"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}&level=account&access_token={TOKEN}

3. Insights por campanha (tabela):

GET /act_{ID}/insights?fields=campaign_name,campaign_id,spend,actions,inline_link_clicks&level=campaign&time_range={"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}&limit=100&access_token={TOKEN}

4. Status das campanhas:

GET /act_{ID}/campaigns?fields=id,name,status&limit=100&access_token={TOKEN}

Todas as chamadas com base URL: https://graph.facebook.com/v19.0

Para extrair downloads: percorrer o array "actions" e encontrar o objeto com action_type === "mobile_app_install", pegar o campo "value". Se não existir, downloads = 0.

---

ESTADOS DA INTERFACE

Loading:

- Skeleton loaders em todos os cards enquanto carrega

- Spinner no gráfico e tabela

- Botão Atualizar com spinner enquanto processa

Empty State (sem dados no período):

- Cards zerados (R$ 0,00, 0 downloads)

- Gráfico vazio com mensagem: "Sem dados para o período selecionado"

- Tabela vazia: "Nenhuma campanha encontrada"

Erro de API (exceto token):

- Toast vermelho: "Erro ao carregar dados. Tente novamente."

- Botão "Tentar novamente"

Erro de Token (código 190):

- Banner fixo amarelo no topo

- Bloquear refetch automático

- Manter dados antigos na tela (se tiver)

---

RESPONSIVIDADE

Desktop (>1024px): 6 cards em grid 3x2, gráfico largura total, tabela largura total

Tablet (768-1024px): cards em grid 2x3

Mobile (<768px): cards empilhados 1 coluna, tabela com scroll horizontal

---

REFRESH

Botão 🔄 "Atualizar" no header:

- Refaz todas as chamadas à API

- Mostra spinner enquanto carrega

- Atualiza texto "Última atualização: DD/MM/YYYY HH:MM"

- Sem auto-refresh (apenas manual)

---

FORMATAÇÃO

- Moeda: R$ 1.234,56 → Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

- Percentual: 12,34%

- Números: separador de milhar (1.234)

- Datas: DD/MM/YYYY

---

VARIÁVEIS DE AMBIENTE

VITE_DASH_USER=usuario_do_cliente

VITE_DASH_PASSWORD=senha_do_cliente

VITE_FB_ACCESS_TOKEN=token_inicial

VITE_FB_ACCOUNT_ID=act_XXXXXXXXX

---

REGRAS

1. NÃO usar backend, banco de dados ou Supabase — tudo no frontend

2. Token e Account ID salvos em localStorage sobrescrevem as variáveis de ambiente

3. Idioma: Português brasileiro

4. NUNCA mostrar o token na tela (campo type=password no modal de config)

5. Tratar TODOS os erros da API com mensagens amigáveis, sem termos técnicos

6. Se actions não contém mobile_app_install: downloads = 0 (não quebrar)

7. Skeleton loaders em TODOS os componentes durante carregamento

8. Filtro de data default: Últimos 7 dias

9. Design responsivo (mobile-first)

10. Código modular e limpo, pronto para deploy em subdomínio

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8f5b11e1-79a2-4917-9d1a-4034b06b6317).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
