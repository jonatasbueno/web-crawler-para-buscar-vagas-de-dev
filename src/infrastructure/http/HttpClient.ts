import axios, { AxiosRequestConfig } from 'axios';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 2;

export interface HttpGetOptions extends AxiosRequestConfig {
  retries?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Cliente HTTP fino sobre o axios: User-Agent de navegador, timeout e retry com
 * backoff. Centraliza a configuração usada por todos os scrapers baseados em HTTP.
 */
export class HttpClient {
  constructor(private readonly baseHeaders: Record<string, string> = {}) {}

  async getText(url: string, options: HttpGetOptions = {}): Promise<string> {
    const { data } = await this.request<string>(url, { responseType: 'text', ...options });
    return data;
  }

  /**
   * Busca o corpo como bytes e decodifica no charset informado (ex.: 'latin1'
   * para páginas legadas ISO-8859-1).
   */
  async getDecodedText(
    url: string,
    encoding: BufferEncoding,
    options: HttpGetOptions = {}
  ): Promise<string> {
    const { data } = await this.request<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      ...options,
    });
    return Buffer.from(data).toString(encoding);
  }

  async getJson<T = unknown>(url: string, options: HttpGetOptions = {}): Promise<T> {
    const { data } = await this.request<T>(url, options);
    return data;
  }

  private async request<T>(url: string, options: HttpGetOptions) {
    const { retries = DEFAULT_RETRIES, headers, ...rest } = options;
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await axios.get<T>(url, {
          timeout: DEFAULT_TIMEOUT_MS,
          headers: { 'User-Agent': DEFAULT_USER_AGENT, ...this.baseHeaders, ...headers },
          ...rest,
        });
      } catch (error) {
        lastError = error;
        if (attempt < retries) await sleep(500 * (attempt + 1));
      }
    }

    throw lastError;
  }
}
