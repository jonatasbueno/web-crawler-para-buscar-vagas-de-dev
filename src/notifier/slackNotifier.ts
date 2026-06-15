import axios from 'axios';
import { Job } from '../types/index.js';

export interface SendJobsOptions {
  /** Envia mensagem quando nenhuma vaga nova for encontrada. Padrão: true. */
  notifyWhenEmpty?: boolean;
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }
  return String(error);
}

export class SlackNotifier {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async sendError(context: string, error: unknown): Promise<void> {
    if (!this.webhookUrl) {
      console.warn('Slack Webhook URL not configured. Skipping error notification.');
      return;
    }

    const detail = formatError(error);
    await axios.post(this.webhookUrl, {
      text: `❌ *Erro no Crawler Vagas Dev*\n*Contexto:* ${context}\n\`\`\`${detail}\`\`\``
    });
  }

  async sendJobs(jobs: Job[], options: SendJobsOptions = {}): Promise<void> {
    const { notifyWhenEmpty = true } = options;

    if (!this.webhookUrl) {
      console.warn('Slack Webhook URL not configured. Skipping notification.');
      return;
    }

    if (jobs.length === 0) {
      if (notifyWhenEmpty) {
        await axios.post(this.webhookUrl, {
          text: 'Nenhum vaga nova encontrada'
        });
      }
      return;
    }

    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🎯 ${jobs.length} Nova(s) Vaga(s) Encontrada(s)!`
        }
      },
      {
        type: "divider"
      }
    ];

    for (const job of jobs) {
      const locationInfo = job.model === 'Híbrido' ? `Híbrido - ${job.city || 'Não Informado'}` : '100% Remoto';
      let text = `*<${job.link}|${job.title}>*\n`;
      text += `🏢 *Empresa:* ${job.company || 'Não Informada'}\n`;
      text += `📍 *Modelo:* ${locationInfo}\n`;
      text += `🎯 *Senioridade:* ${job.seniority}\n`;
      if (job.salary) text += `💰 *Salário:* ${job.salary}\n`;
      if (job.contactEmail) text += `📧 *Contato:* ${job.contactEmail}\n`;

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text
        }
      });
      blocks.push({ type: "divider" });
    }

    await axios.post(this.webhookUrl, { blocks });
  }
}
