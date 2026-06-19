import { sql } from 'kysely'
import { db } from './connection.js'

async function dropAllTables (): Promise<void> {
  const { rows } = await sql<{ name: string }>`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
  `.execute(db)

  if (rows.length === 0) {
    console.log('Nenhuma tabela encontrada.')

    return
  }

  await sql`PRAGMA foreign_keys = OFF`.execute(db)

  for (const { name } of rows) {
    await sql`DROP TABLE IF EXISTS ${sql.table(name)}`.execute(db)
    console.log(`Tabela "${name}" removida.`)
  }

  await sql`PRAGMA foreign_keys = ON`.execute(db)
  console.log('Todas as tabelas foram removidas. Execute "npm run db:migrate" para recriar o schema.')
}

dropAllTables()
  .then(async () => await db.destroy())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
