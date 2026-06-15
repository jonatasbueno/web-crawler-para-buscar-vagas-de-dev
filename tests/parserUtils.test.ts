import { parseSeniority, parseWorkModel } from '../src/utils/parserUtils.js';

describe('parserUtils', () => {
  describe('parseSeniority', () => {
    it('should parse Júnior correctly', () => {
      expect(parseSeniority('Desenvolvedor Júnior')).toBe('Júnior');
      expect(parseSeniority('Dev Junior')).toBe('Júnior');
      expect(parseSeniority('Software Engineer Jr')).toBe('Júnior');
    });

    it('should parse Sênior correctly', () => {
      expect(parseSeniority('Desenvolvedor Sênior')).toBe('Sênior');
      expect(parseSeniority('Dev Senior')).toBe('Sênior');
      expect(parseSeniority('Software Engineer Sr')).toBe('Sênior');
    });

    it('should parse Pleno correctly', () => {
      expect(parseSeniority('Desenvolvedor Pleno')).toBe('Pleno');
      expect(parseSeniority('Dev Pl')).toBe('Pleno');
    });

    it('should fallback to Não Informado', () => {
      expect(parseSeniority('Desenvolvedor')).toBe('Não Informado');
    });
  });

  describe('parseWorkModel', () => {
    it('should parse Home Office correctly', () => {
      expect(parseWorkModel('Trabalho remoto')).toBe('Home Office');
      expect(parseWorkModel('Vaga Home Office')).toBe('Home Office');
    });

    it('should parse Híbrido correctly', () => {
      expect(parseWorkModel('Trabalho Híbrido')).toBe('Híbrido');
      expect(parseWorkModel('Modelo hibrido')).toBe('Híbrido');
    });

    it('should fallback to Outro', () => {
      expect(parseWorkModel('Presencial')).toBe('Outro');
    });
  });
});
