import { jest } from '@jest/globals';
import axios from 'axios';
import { SlackNotifier } from '../src/infrastructure/notifier/SlackNotifier.js';
import { Job } from '../src/domain/entities/Job.js';

describe('SlackNotifier', () => {
  let postSpy: any;

  beforeEach(() => {
    postSpy = jest.spyOn(axios, 'post').mockResolvedValue({ data: {} } as any);
  });

  afterEach(() => {
    postSpy.mockRestore();
  });

  it('avisa quando não há webhook configurado (sendJobs)', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await new SlackNotifier('').sendJobs([
      { title: 'X', model: 'Home Office', seniority: 'Pleno', link: 'l' },
    ]);
    expect(consoleSpy).toHaveBeenCalled();
    expect(postSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('envia aviso de lista vazia (requisito: avisar quando vazio)', async () => {
    await new SlackNotifier('http://hook').sendEmpty();
    expect(postSpy).toHaveBeenCalledWith('http://hook', { text: 'Nenhuma vaga nova encontrada' });
  });

  it('sendJobs com lista vazia delega para sendEmpty', async () => {
    await new SlackNotifier('http://hook').sendJobs([]);
    expect(postSpy).toHaveBeenCalledWith('http://hook', { text: 'Nenhuma vaga nova encontrada' });
  });

  it('monta blocks com as vagas', async () => {
    const jobs: Job[] = [
      {
        title: 'Frontend',
        company: 'Tech Corp',
        model: 'Híbrido',
        city: 'Campinas',
        seniority: 'Pleno',
        salary: 'R$ 5000',
        contactEmail: 'rh@tech.com',
        link: 'http://link.com',
        publishedAt: new Date('2026-06-12'),
        source: 'GitHub',
      },
      { title: 'React Native', model: 'Home Office', seniority: 'Júnior', link: 'http://l2.com' },
    ];
    await new SlackNotifier('http://hook').sendJobs(jobs);
    const body = postSpy.mock.calls[0][1] as any;
    expect(body.blocks.length).toBeGreaterThan(0);
    const serialized = JSON.stringify(body.blocks);
    expect(serialized).toContain('Híbrido - Campinas');
    expect(serialized).toContain('100% Remoto');
    expect(serialized).toContain('Publicada em');
  });

  it('envia mensagem de erro com contexto', async () => {
    await new SlackNotifier('http://hook').sendError('ctx', new Error('boom'));
    const body = postSpy.mock.calls[0][1] as any;
    expect(body.text).toContain('ctx');
    expect(body.text).toContain('boom');
  });

  it('avisa quando não há webhook (sendError e sendEmpty)', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await new SlackNotifier('').sendError('ctx', new Error('x'));
    await new SlackNotifier('').sendEmpty();
    expect(postSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
