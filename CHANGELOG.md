# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico (SemVer)](https://semver.org/lang/pt-BR/).

## Como versionar

| Tipo de mudança | Incremento | Exemplo |
|-----------------|------------|---------|
| Correção compatível com versões anteriores | **PATCH** (`1.0.x`) | Corrigir seletor CSS de um scraper |
| Nova funcionalidade compatível | **MINOR** (`1.x.0`) | Adicionar scraper de um novo portal |
| Mudança incompatível com versões anteriores | **MAJOR** (`x.0.0`) | Alterar schema do banco sem migração automática |

Ao publicar uma versão:

1. Mova os itens de `[Unreleased]` para uma nova seção com a versão e a data (`YYYY-MM-DD`).
2. Atualize o campo `version` em `package.json`.
3. Crie uma tag Git anotada: `git tag -a v1.0.0 -m "v1.0.0"`.

### Categorias

Use estas seções dentro de cada versão (omitindo as vazias):

- **Added** — funcionalidades novas.
- **Changed** — alterações em funcionalidades existentes.
- **Deprecated** — funcionalidades que serão removidas em versões futuras.
- **Removed** — funcionalidades removidas.
- **Fixed** — correções de bugs.
- **Security** — correções de vulnerabilidades.

---

## [0.1.0] 2026-06-19

### Added

- **Scraper Indeed** (`br.indeed.com`) — busca de "desenvolvedor" (últimos 14 dias, remoto) via
  navegador headless (Playwright) com User-Agent real para contornar o Cloudflare; paginação
  por `&start=N`. Inclui **fallback para fechar o popup** de confirmação de e-mail (Esc + botões
  de fechar) e um **filtro que descarta vagas de torno CNC / programador da área de mecânica**
  (`isMechanicalRole`). Opções de `BrowserClient`: `userAgent`, `locale`, `waitUntil` e
  `dismissSelectors`.

- **Arquitetura Clean** em camadas: `domain` (entidades, serviços e ports), `application`
  (casos de uso), `infrastructure` (scrapers, persistência, notifier, HTTP) e `interface` (CLI).
- Suporte ao Playwright instalado: os scrapers SPA (Sólides, Workana, Coodesh, Trampos)
  passam a coletar vagas reais via navegador headless.
- **Scraper Quickin (ATS)** — coleta boards de empresa (`jobs.quickin.io/<empresa>/jobs`) lendo
  o estado SSR `window.__NUXT__` **via axios** (avaliado em sandbox `vm`), com paginação `?page=N`.
  Genérico por empresa, com lista padrão de empresas e override via `QUICKIN_COMPANIES`.
- Campo `description` em `Job`, usado pelo filtro de stack quando o título é genérico; helper `stripHtml`.
- Util compartilhado `scrapePaginatedHtml` — remove a duplicação do laço de paginação dos
  scrapers HTML (Programathor, Vagas.com, LinkedIn).

### Changed

- Todas as requisições HTTP do projeto usam **axios** (via `HttpClient`); nenhum `fetch` nativo.

### Removed

- Variáveis de ambiente `LINKEDIN_USERNAME` e `LINKEDIN_PASSWORD` (não utilizadas pelo código).

### Fixed

- **Filtro de stack** passa a usar fronteiras de palavra (regex), eliminando falsos positivos
  por substring (ex.: `ios` em "benefícios"/"negócios", `expo` em "exposição").
- **Coleta multi-fonte ampliada**: 11 repositórios `*/vagas` do GitHub (frontendbr, react-brasil,
  flutterbr, nodejsdevbr, rustdevbr, gommunity, pydevbr, phpdevbr, rubydevbr, frontend-ao,
  frontend-pt) via API REST de issues, mais APInfo, Sólides Vagas, Workana, Coodesh, Trampos.co,
  Hipsters.Jobs e Remotar.
- Scraper genérico `GithubVagasScraper` parametrizado por organização, com paginação que respeita
  a janela de recência e suporte a `GITHUB_TOKEN` opcional (5000 req/h).
- Fallback headless opcional via **Playwright** (`BrowserClient`) para fontes SPA, com degradação
  graciosa quando o pacote não está instalado.
- `HttpClient` compartilhado (User-Agent, timeout, retry com backoff e decodificação ISO-8859-1).
- Coluna `source` e `published_at` em `jobs_sent` (migration `add_source_to_jobs_sent`).

### Changed

- **Filtro de stack** ampliado para o ecossistema JavaScript e afins (Node, Node-RED, Electron,
  Elixir, Backbone etc.) além do foco Frontend/Mobile.
- **Filtro de recência** reduzido de 28 para **15 dias**.
- **Ordenação** passa a ser por **recência (mais recente primeiro)**, com senioridade como desempate.
- **Catch-up** executa **apenas o último slot pendente do dia atual** (antes: todos os pendentes).
- **Execução avulsa** (`--once-loose`) agora **avisa quando o retorno é vazio**.
- O **registro do slot agendado** (`recordRun`) ocorre **somente após a consolidação das vagas**.
- Caminhos dos scripts atualizados para a nova estrutura (`src/interface/cli/index.ts`,
  `src/infrastructure/persistence/migrate.ts`).

### Removed

- Estrutura antiga em `src/{db,filters,sorters,notifier,scrapers,utils,types}` e `src/index.ts`,
  realocada para as camadas da Clean Architecture.

---

## [0.0.1] - 2026-06-15

Primeira versão estável do crawler de vagas para Desenvolvedores Frontend / React Native.

### Added

- Pipeline de coleta com scrapers para LinkedIn, Gupy, Programathor, Vagas.com, GeekHunter e Revelo.
- Interface `Scraper` e implementações modulares por portal (`src/scrapers/`).
- Filtros de negócio: stack Frontend/Mobile, modalidade remota ou híbrida (Campinas/Piracicaba) e recência de até 28 dias.
- Ordenação de vagas por senioridade (Pleno → Sênior → Júnior → Não Informado).
- Deduplicação de vagas via SQLite (`jobs_sent`), usando o link como chave única.
- Notificações no Slack com Block Kit (título, empresa, modelo, senioridade, salário e contato).
- Notificação de erros no Slack quando um scraper ou o pipeline falha.
- Modos de execução via CLI: `--scheduled-hour`, `--catch-up` e `--once-loose`.
- Agendamento em três slots diários (08h, 13h e 20h, horário de Brasília).
- Catch-up no boot para executar slots pendentes do dia (`pipeline_runs`).
- Persistência com Knex.js + SQLite3 e migrações versionadas.
- Parsers compartilhados de senioridade e modelo de trabalho (`parserUtils`).
- Instalação de timers via systemd (`npm run cron:install`) e exemplo de crontab.
- Suite de testes com Jest (filtros, parsers, repositório, scrapers e notificador).
- Documentação do projeto em `README.md`.
