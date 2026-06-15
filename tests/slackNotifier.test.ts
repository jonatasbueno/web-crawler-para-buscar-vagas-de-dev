import { jest } from '@jest/globals';
import axios from 'axios';
import { SlackNotifier } from '../src/notifier/slackNotifier.js';
import { Job } from '../src/types/index.js';

describe('SlackNotifier', () => {
  let postSpy: any;

  beforeEach(() => {
    postSpy = jest.spyOn(axios, 'post').mockResolvedValue({ data: {} });
    jest.clearAllMocks();
  });

  afterAll(() => {
    postSpy.mockRestore();
  });

  it('should warn if no webhook URL is provided', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const notifier = new SlackNotifier('');
    await notifier.sendJobs([]);
    expect(consoleSpy).toHaveBeenCalledWith('Slack Webhook URL not configured. Skipping notification.');
    consoleSpy.mockRestore();
  });

  it('should send fallback message if no jobs', async () => {
    const notifier = new SlackNotifier('http://webhook.test');
    await notifier.sendJobs([]);
    expect(postSpy).toHaveBeenCalledWith('http://webhook.test', {
      text: 'Nenhum vaga nova encontrada'
    });
  });

  it('should skip notification when notifyWhenEmpty is false', async () => {
    const notifier = new SlackNotifier('http://webhook.test');
    await notifier.sendJobs([], { notifyWhenEmpty: false });
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('should send error message to webhook', async () => {
    const notifier = new SlackNotifier('http://webhook.test');
    await notifier.sendError('test-context', new Error('boom'));
    expect(postSpy).toHaveBeenCalledWith(
      'http://webhook.test',
      expect.objectContaining({
        text: expect.stringContaining('test-context')
      })
    );
    expect(postSpy).toHaveBeenCalledWith(
      'http://webhook.test',
      expect.objectContaining({
        text: expect.stringContaining('boom')
      })
    );
  });

  it('should warn if no webhook URL is provided for errors', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const notifier = new SlackNotifier('');
    await notifier.sendError('ctx', new Error('x'));
    expect(consoleSpy).toHaveBeenCalledWith('Slack Webhook URL not configured. Skipping error notification.');
    consoleSpy.mockRestore();
  });

  it('should send jobs blocks if jobs are present', async () => {
    const notifier = new SlackNotifier('http://webhook.test');
    const jobs: Job[] = [
      {
        title: 'Frontend',
        company: 'Tech Corp',
        model: 'Híbrido',
        city: 'Campinas',
        seniority: 'Pleno',
        salary: 'R$ 5000',
        contactEmail: 'rh@tech.com',
        link: 'http://link.com'
      },
      {
        title: 'React Native',
        model: 'Home Office',
        seniority: 'Júnior',
        link: 'http://link2.com',
        company: undefined
      },
      {
        title: 'Backend',
        model: 'Híbrido',
        seniority: 'Sênior',
        link: 'http://link3.com'
      }
    ];

    await notifier.sendJobs(jobs);
    expect(postSpy).toHaveBeenCalled();
    const callArgs = postSpy.mock.calls[0][1] as any;
    expect(callArgs.blocks).toBeDefined();
    expect(callArgs.blocks.length).toBeGreaterThan(0);
    expect(JSON.stringify(callArgs.blocks)).toContain('Híbrido - Campinas');
    expect(JSON.stringify(callArgs.blocks)).toContain('100% Remoto');
  });
});
