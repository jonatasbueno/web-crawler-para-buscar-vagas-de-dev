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

/** Abre a página, faz scroll/espera conforme as opções e executa `action`. */
async function withPage<T> (
  url: string,
  options: RenderOptions,
  action: (page: any) => Promise<T>
): Promise<T> {
  const {
    scrollRounds = 0,
    waitForSelector,
    scrollDelayMs = 1200,
    waitUntil = 'networkidle',
    userAgent,
    locale,
    dismissSelectors
  } = options
  const chromium = await loadChromium()
  const browser = await chromium.launch({ headless: true })
  try {
    const contextOptions: Record<string, unknown> = {}

    if (userAgent) contextOptions.userAgent = userAgent
    if (locale) contextOptions.locale = locale
    const context = await browser.newContext(contextOptions)
    const page = await context.newPage()
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

    return await action(page)
  } finally {
    await browser.close()
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
  return await withPage(url, options, (page) => page.content())
}
