/**
 * Cliente headless (Playwright) para renderizar fontes SPA.
 *
 * O Playwright é importado dinamicamente apenas quando um scraper realmente
 * precisa renderizar. Se o pacote não estiver instalado, as funções lançam um
 * erro claro e o scraper trata como fonte indisponível (sem quebrar o pipeline).
 */
export interface RenderOptions {
  /** Quantas vezes rolar a página para disparar carregamento por scroll infinito. */
  scrollRounds?: number;
  /** Seletor a aguardar antes de extrair o conteúdo. */
  waitForSelector?: string;
  /** Tempo (ms) de espera após cada rolagem. */
  scrollDelayMs?: number;
}

async function loadChromium(): Promise<{ launch(opts: { headless: boolean }): Promise<any> }> {
  try {
    const { chromium } = await import('playwright');
    return chromium;
  } catch {
    throw new Error(
      'Playwright não está instalado. Instale com "npm i playwright && npx playwright install chromium" ' +
        'para habilitar a coleta de fontes SPA.'
    );
  }
}

/** Abre a página, faz scroll/espera conforme as opções e executa `action`. */
async function withPage<T>(
  url: string,
  options: RenderOptions,
  action: (page: any) => Promise<T>
): Promise<T> {
  const { scrollRounds = 0, waitForSelector, scrollDelayMs = 1200 } = options;
  const chromium = await loadChromium();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });

    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 15_000 }).catch(() => undefined);
    }

    for (let i = 0; i < scrollRounds; i++) {
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForTimeout(scrollDelayMs);
    }

    return await action(page);
  } finally {
    await browser.close();
  }
}

/** Renderiza a página e retorna o HTML final. */
export async function renderHtml(url: string, options: RenderOptions = {}): Promise<string> {
  return withPage(url, options, (page) => page.content());
}
