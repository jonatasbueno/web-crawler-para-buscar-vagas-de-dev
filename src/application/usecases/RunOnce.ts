import { RunPipeline } from './RunPipeline.js'

/**
 * Execução avulsa (sob demanda). Diferente do comportamento anterior, agora
 * **também avisa quando o retorno é vazio** (o RunPipeline envia o aviso de
 * lista vazia). Não registra slot agendado.
 */
export class RunOnce {
  constructor (private readonly pipeline: RunPipeline) {}

  async execute (): Promise<void> {
    await this.pipeline.execute('once')
  }
}
