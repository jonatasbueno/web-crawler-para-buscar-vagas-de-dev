import {
  parseSeniority,
  parseWorkModel,
  parseEmail,
  parseFirstUrl,
  parseRelativeDate,
  slugToTitle,
  cleanTitle,
  stripHtml,
} from '../src/infrastructure/scrapers/support/parsing.js';

describe('parsing', () => {
  describe('parseSeniority', () => {
    it('detecta Júnior, Sênior, Pleno', () => {
      expect(parseSeniority('Desenvolvedor Júnior')).toBe('Júnior');
      expect(parseSeniority('Dev Jr')).toBe('Júnior');
      expect(parseSeniority('Engenheiro Sênior')).toBe('Sênior');
      expect(parseSeniority('Dev Sr')).toBe('Sênior');
      expect(parseSeniority('Desenvolvedor Pleno')).toBe('Pleno');
    });

    it('faz fallback para Não Informado', () => {
      expect(parseSeniority('Desenvolvedor')).toBe('Não Informado');
    });
  });

  describe('parseWorkModel', () => {
    it('detecta Home Office, Híbrido e Outro (incl. variações de gênero)', () => {
      expect(parseWorkModel('Trabalho remoto')).toBe('Home Office');
      expect(parseWorkModel('Vaga Remota')).toBe('Home Office');
      expect(parseWorkModel('100% remote')).toBe('Home Office');
      expect(parseWorkModel('Modelo Híbrido')).toBe('Híbrido');
      expect(parseWorkModel('Posição Híbrida')).toBe('Híbrido');
      expect(parseWorkModel('hybrid model')).toBe('Híbrido');
      expect(parseWorkModel('Presencial')).toBe('Outro');
    });
  });

  describe('parseRelativeDate', () => {
    const now = new Date('2026-06-17T12:00:00Z');

    it('interpreta "há N dias/horas/semanas/meses"', () => {
      expect(parseRelativeDate('Postada há 1 dia', now)?.toISOString().slice(0, 10)).toBe('2026-06-16');
      expect(parseRelativeDate('há 3 horas', now)?.getUTCHours()).toBe(9);
      expect(parseRelativeDate('há 2 semanas', now)?.toISOString().slice(0, 10)).toBe('2026-06-03');
      expect(parseRelativeDate('há 1 mês', now)?.toISOString().slice(0, 10)).toBe('2026-05-17');
    });

    it('reconhece "hoje" e retorna undefined sem padrão', () => {
      expect(parseRelativeDate('Publicada hoje', now)).toEqual(now);
      expect(parseRelativeDate('sem data', now)).toBeUndefined();
    });
  });

  describe('slugToTitle', () => {
    it('converte slug em título legível', () => {
      expect(slugToTitle('desenvolvedor-react-123')).toBe('Desenvolvedor React');
      expect(slugToTitle('infra-and-cyber-99')).toBe('Infra & Cyber');
    });
  });

  describe('cleanTitle', () => {
    it('colapsa espaços e remove rótulos de destaque', () => {
      expect(cleanTitle('  Dev   Frontend  ')).toBe('Dev Frontend');
      expect(cleanTitle('DESTAQUE | Analista de Mídia')).toBe('Analista de Mídia');
    });
  });

  describe('stripHtml', () => {
    it('remove tags e decodifica entidades comuns', () => {
      expect(stripHtml('<ul><li>React <strong>&amp;</strong> Node</li></ul>')).toBe('React & Node');
      expect(stripHtml('Localiza&ccedil;&atilde;o: Campinas &nbsp; SP')).toBe('Localiza o: Campinas SP');
    });
  });

  describe('parseEmail', () => {
    it('extrai o primeiro e-mail', () => {
      expect(parseEmail('Envie para rh@empresa.com.br por favor')).toBe('rh@empresa.com.br');
    });
    it('retorna undefined sem e-mail', () => {
      expect(parseEmail('sem contato aqui')).toBeUndefined();
    });
  });

  describe('parseFirstUrl', () => {
    it('extrai a primeira URL', () => {
      expect(parseFirstUrl('candidate-se em https://vaga.com/123 agora')).toBe(
        'https://vaga.com/123'
      );
    });
    it('retorna undefined sem URL', () => {
      expect(parseFirstUrl('sem link')).toBeUndefined();
    });
  });
});
