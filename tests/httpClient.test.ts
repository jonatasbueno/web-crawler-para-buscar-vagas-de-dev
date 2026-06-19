import { jest } from '@jest/globals';
import axios from 'axios';
import { HttpClient } from '../src/infrastructure/http/HttpClient.js';

describe('HttpClient', () => {
  let getSpy: any;

  afterEach(() => {
    getSpy?.mockRestore();
  });

  it('getJson retorna o corpo e envia User-Agent + headers extras', async () => {
    getSpy = jest.spyOn(axios, 'get').mockResolvedValue({ data: { ok: true } } as any);
    const http = new HttpClient({ 'X-Base': '1' });

    const data = await http.getJson<{ ok: boolean }>('http://x', { headers: { Accept: 'json' } });

    expect(data).toEqual({ ok: true });
    const cfg = getSpy.mock.calls[0][1];
    expect(cfg.headers['User-Agent']).toContain('Mozilla');
    expect(cfg.headers['X-Base']).toBe('1');
    expect(cfg.headers.Accept).toBe('json');
  });

  it('getText pede responseType text', async () => {
    getSpy = jest.spyOn(axios, 'get').mockResolvedValue({ data: '<html></html>' } as any);
    const text = await new HttpClient().getText('http://x');
    expect(text).toBe('<html></html>');
    expect(getSpy.mock.calls[0][1].responseType).toBe('text');
  });

  it('getDecodedText decodifica bytes ISO-8859-1', async () => {
    const latin1 = Buffer.from('Programação', 'latin1');
    getSpy = jest.spyOn(axios, 'get').mockResolvedValue({ data: latin1 } as any);

    const text = await new HttpClient().getDecodedText('http://x', 'latin1');
    expect(text).toBe('Programação');
    expect(getSpy.mock.calls[0][1].responseType).toBe('arraybuffer');
  });

  it('faz retry e retorna na tentativa bem-sucedida', async () => {
    getSpy = jest
      .spyOn(axios, 'get')
      .mockRejectedValueOnce(new Error('temporário'))
      .mockResolvedValueOnce({ data: 'ok' } as any);

    const text = await new HttpClient().getText('http://x', { retries: 1 });
    expect(text).toBe('ok');
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it('propaga o erro após esgotar as tentativas', async () => {
    getSpy = jest.spyOn(axios, 'get').mockRejectedValue(new Error('falhou'));
    await expect(new HttpClient().getText('http://x', { retries: 0 })).rejects.toThrow('falhou');
    expect(getSpy).toHaveBeenCalledTimes(1);
  });
});
