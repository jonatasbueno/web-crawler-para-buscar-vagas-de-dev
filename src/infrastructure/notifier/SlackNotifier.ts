import axios from 'axios'
import { Job } from '../../domain/entities/Job.js'
import { Notifier } from '../../domain/ports/Notifier.js'

function formatError (error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message
  }

  return String(error)
}

function formatPublished (date?: Date): string | undefined {
  if (date == null) return undefined

  return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

export class SlackNotifier implements Notifier {
  constructor (private readonly webhookUrl: string) {}

  async sendError (context: string, error: unknown): Promise<void> {
    if (!this.webhookUrl) {
      console.warn('Slack Webhook URL não configurada. Pulando notificação de erro.')

      return
    }

    const detail = formatError(error)
    await axios.post(this.webhookUrl, {
      text: `❌ *Erro no Crawler Vagas Dev*\n*Contexto:* ${context}\n\`\`\`${detail}\`\`\``
    })
  }

  async sendEmpty (): Promise<void> {
    if (!this.webhookUrl) {
      console.warn('Slack Webhook URL não configurada. Pulando notificação de lista vazia.')

      return
    }

    await axios.post(this.webhookUrl, {
      text: 'Nenhuma vaga nova encontrada'
    })
  }

  async sendJobs (jobs: Job[]): Promise<void> {
    if (jobs.length === 0) {
      await this.sendEmpty()

      return
    }

    if (!this.webhookUrl) {
      console.warn('Slack Webhook URL não configurada. Pulando notificação de vagas.')

      return
    }

    const blocks: unknown[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🎯 ${jobs.length} Nova(s) Vaga(s) Encontrada(s)!`
        }
      },
      { type: 'divider' }
    ]

    for (const job of jobs) {
      const locationInfo =
        job.model === 'Híbrido' ? `Híbrido - ${job.city || 'Não Informado'}` : '100% Remoto'
      let text = `*<${job.link}|${job.title}>*\n`
      text += `🏢 *Empresa:* ${job.company || 'Não Informada'}\n`
      text += `📍 *Modelo:* ${locationInfo}\n`
      text += `🎯 *Senioridade:* ${job.seniority}\n`
      const published = formatPublished(job.publishedAt)

      if (published) text += `🗓️ *Publicada em:* ${published}\n`
      if (job.salary) text += `💰 *Salário:* ${job.salary}\n`
      if (job.contactEmail) text += `📧 *Contato:* ${job.contactEmail}\n`
      if (job.source) text += `🔎 *Fonte:* ${job.source}\n`

      blocks.push({ type: 'section', text: { type: 'mrkdwn', text } })
      blocks.push({ type: 'divider' })
    }

    await axios.post(this.webhookUrl, { blocks })
  }
}
