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

## [Unreleased]

### Added

- Schema tipado do banco em `src/db/schema.ts` (`Database`, `NewJobsSent`, `NewPipelineRun`, etc.).
- Runner de migrations nativo do Kysely (`src/db/migrate.ts`).
- Factory `createDb()` para instâncias SQLite em memória nos testes.
- Índice único em `pipeline_runs (run_date, scheduled_hour)` para deduplicação de execuções.

### Changed

- Substituição de Knex.js + sqlite3 por **Kysely** + **better-sqlite3** com queries type-safe.
- `JobsRepository` reescrito com API do Kysely (`selectFrom`, `insertInto`, `onConflict`).
- Scripts `db:migrate` e `db:rollback` passam a usar `tsx src/db/migrate.ts`.

### Removed

- Dependências `knex` e `sqlite3`.
- Arquivo `knexfile.ts`.

### Fixed

- `onConflict` em `recordRun` agora funciona corretamente com constraint única no banco.

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
