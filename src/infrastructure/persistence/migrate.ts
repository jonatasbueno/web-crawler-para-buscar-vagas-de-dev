import { FileMigrationProvider, Migrator } from 'kysely'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { db } from './connection.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationFolder = path.join(__dirname, 'migrations')

function createMigrator (): Migrator {
  return new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder
    })
  })
}

function logResults (results: Awaited<ReturnType<Migrator['migrateToLatest']>>['results']): void {
  for (const result of results ?? []) {
    if (result.status === 'Success') {
      console.log(`Migration "${result.migrationName}" executada com sucesso.`)
    } else if (result.status === 'Error') {
      console.error(`Falha na migration "${result.migrationName}".`)
    }
  }
}

async function migrateToLatest (): Promise<void> {
  const { error, results } = await createMigrator().migrateToLatest()
  logResults(results)

  if (error) {
    console.error('Falha ao executar migrations.')
    console.error(error)
    process.exit(1)
  }
}

async function migrateDown (): Promise<void> {
  const { error, results } = await createMigrator().migrateDown()
  logResults(results)

  if (error) {
    console.error('Falha ao reverter migration.')
    console.error(error)
    process.exit(1)
  }
}

async function main (): Promise<void> {
  const command = process.argv[2]

  if (command === 'down') {
    await migrateDown()

    return
  }

  await migrateToLatest()
}

main()
  .then(async () => await db.destroy())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
