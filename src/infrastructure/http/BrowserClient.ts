/**
 * Cliente headless (Playwright) para renderizar fontes SPA.
 *
 * O Playwright é importado dinamicamente apenas quando um scraper realmente
 * precisa renderizar. Se o pacote não estiver instalado, as funções lançam um
 * erro claro e o scraper trata como fonte indisponível (sem quebrar o pipeline).
 */
export interface RenderOptions {
  /** Quantas vezes rolar a página para disparar carregamento por scroll infinito. */
  scrollRounds?: number
  /** Seletor a aguardar antes de extrair o conteúdo. */
  waitForSelector?: string
  /** Tempo (ms) de espera após cada rolagem. */
  scrollDelayMs?: number
  /** Estratégia de espera do `goto` (padrão: networkidle). */
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'
  /** User-Agent customizado (ex.: para evitar bloqueio anti-bot). */
  userAgent?: string
  /** Locale do contexto (ex.: 'pt-BR'). */
  locale?: string
  /**
   * Seletores de botões de fechar popup/modal a tentar clicar após o carregamento
   * (best-effort, fallback para popups como o de confirmação de e-mail do Indeed).
   */
  dismissSelectors?: string[]
}

async function loadChromium (): Promise<{ launch: (opts: { headless: boolean }) => Promise<any> }> {
  try {
    const { chromium } = await import('playwright')

    return chromium
  } catch {
    throw new Error(
      'Playwright não está instalado. Instale com "npm i playwright && npx playwright install chromium" ' +
        'para habilitar a coleta de fontes SPA.'
    )
  }
}

function buildContextOptions (options: RenderOptions): Record<string, unknown> {
  const contextOptions: Record<string, unknown> = {}

  if (options.userAgent) contextOptions.userAgent = options.userAgent
  if (options.locale) contextOptions.locale = options.locale

  return contextOptions
}

/** Navega até a URL, fecha popups, aguarda o seletor e faz scroll conforme as opções. */
async function preparePage (page: any, url: string, options: RenderOptions): Promise<void> {
  const { scrollRounds = 0, waitForSelector, scrollDelayMs = 1200, waitUntil = 'networkidle', dismissSelectors } = options
  await page.goto(url, { waitUntil, timeout: 30_000 })

  if (dismissSelectors?.length) {
    await dismissPopups(page, dismissSelectors)
  }

  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { timeout: 15_000 }).catch(() => undefined)
  }

  for (let i = 0; i < scrollRounds; i++) {
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
    await page.waitForTimeout(scrollDelayMs)
  }
}

/** Fecha popups/modais: tecla Esc + clique nos seletores de fechar (best-effort). */
async function dismissPopups (page: any, selectors: string[]): Promise<void> {
  await page.waitForTimeout(1500) // dá tempo do popup aparecer
  await page.keyboard.press('Escape').catch(() => undefined)
  for (const selector of selectors) {
    await page.click(selector, { timeout: 1200 }).catch(() => undefined)
  }
}

/** Renderiza a página e retorna o HTML final. */
export async function renderHtml (url: string, options: RenderOptions = {}): Promise<string> {
  const chromium = await loadChromium()
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext(buildContextOptions(options))
    const page = await context.newPage()
    await preparePage(page, url, options)

    return await page.content()
  } finally {
    await browser.close()
  }
}

/**
 * Abre UMA sessão de navegador (um contexto reutilizado) e expõe `visit(url)` que
 * retorna o HTML de cada página. Reutilizar o contexto preserva cookies entre
 * páginas — essencial para manter a liberação do Cloudflare ao paginar (ex.: Indeed).
 */
export async function renderSession<T> (
  options: RenderOptions,
  run: (visit: (url: string) => Promise<string>) => Promise<T>
): Promise<T> {
  const chromium = await loadChromium()
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext(buildContextOptions(options))
    const page = await context.newPage()
    const visit = async (url: string): Promise<string> => {
      await preparePage(page, url, options)

      return await page.content()
    }

    return await run(visit)
  } finally {
    await browser.close()
  }
}
