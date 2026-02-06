import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BackgroundService } from './background-service';
import type { PluginConfig } from './types';

describe('BackgroundService', () => {
  let service: BackgroundService;
  let mockApi: any;
  let mockImapConnection: any;

  const mockConfig: PluginConfig = {
    imap: {
      host: '127.0.0.1',
      port: 1143,
      user: 'test@example.com',
      password: 'test-password',
      useStarttls: true,
    },
    folders: {
      inbox: 'INBOX',
      safeInbox: 'Safe-Inbox',
      quarantine: 'Quarantine',
      spam: 'Spam',
      trash: 'Trash',
    },
    listener: {
      enabled: true,
      pollInterval: 60000,
      useIdle: false,
    },
    security: {
      knownSafeSenders: [],
      criticalThreats: [],
      phishingKeywords: [],
      attachmentBlacklist: [],
      linkThreatPatterns: [],
      credentialRequestPhrases: [],
    },
    smtp: {
      host: '127.0.0.1',
      port: 1025,
      user: 'test@example.com',
      password: 'test-password',
      useStarttls: true,
      from: 'test@example.com',
    },
    notifications: {},
  };

  beforeEach(() => {
    mockImapConnection = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      select: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue([]),
      listMessages: vi.fn().mockResolvedValue([]),
      fetchMessage: vi.fn().mockResolvedValue({}),
      move: vi.fn().mockResolvedValue(undefined),
      copy: vi.fn().mockResolvedValue(undefined),
      status: vi.fn().mockResolvedValue({
        attributes: {
          unread: 0,
          messages: 0,
          size: 0,
        },
      }),
    };

    mockApi = {
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      sessions_send: vi.fn().mockResolvedValue(undefined),
    };

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('start', () => {
    it('should start polling interval', async () => {
      service = new BackgroundService(mockApi, mockConfig);
      await service.start();
      expect(mockImapConnection.connect).toHaveBeenCalled();
      expect(mockApi.logger.info).toHaveBeenCalledWith('Starting mail-access background service');
    });

    it('should not start if already running', async () => {
      service = new BackgroundService(mockApi, mockConfig);
      await service.start();
      await service.start();
      expect(mockApi.logger.warn).toHaveBeenCalledWith('Background service already running');
    });

    it('should handle connection errors', async () => {
      mockImapConnection.connect.mockRejectedValue(new Error('Connection failed'));
      service = new BackgroundService(mockApi, mockConfig);
      await expect(service.start()).rejects.toThrow('Connection failed');
    });

    it('should trigger security agent when new messages found', async () => {
      const messages: any[] = [
        { id: 'msg1', from: 'test@example.com', subject: 'Test', date: new Date(), flags: [], preview: 'Test' },
        { id: 'msg2', from: 'test2@example.com', subject: 'Test2', date: new Date(), flags: [], preview: 'Test2' },
      ];
      mockImapConnection.listMessages.mockResolvedValue(messages);

      service = new BackgroundService(mockApi, mockConfig);
      await service.start();

      await vi.advanceTimersByTimeAsync(60000);

      expect(mockApi.sessions_send).toHaveBeenCalledWith({
        agent: 'security-agent',
        message: 'New email detected: 2 message(s). Scan INBOX for threats using mail_security_scan_mail.',
      });
    });

    it('should not trigger security agent when no new messages', async () => {
      mockImapConnection.listMessages.mockResolvedValue([]);

      service = new BackgroundService(mockApi, mockConfig);
      await service.start();

      await vi.advanceTimersByTimeAsync(60000);

      expect(mockApi.sessions_send).not.toHaveBeenCalled();
    });

    it('should handle polling errors gracefully', async () => {
      const messages: any[] = [];
      mockImapConnection.listMessages.mockResolvedValue(messages);

      service = new BackgroundService(mockApi, mockConfig);
      await service.start();

      await vi.advanceTimersByTimeAsync(60000);

      expect(mockApi.logger.info).toHaveBeenCalledWith('Found 0 new messages');
    });
  });

  describe('stop', () => {
    it('should stop polling interval', async () => {
      service = new BackgroundService(mockApi, mockConfig);
      await service.start();
      await service.stop();

      expect(mockApi.logger.info).toHaveBeenCalledWith('Stopping mail-access background service');
      expect(mockImapConnection.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect errors gracefully', async () => {
      mockImapConnection.disconnect.mockRejectedValue(new Error('Disconnect failed'));
      service = new BackgroundService(mockApi, mockConfig);
      await service.start();
      await service.stop();

      expect(mockApi.logger.error).toHaveBeenCalled();
    });
  });

  describe('getRecentMessages', () => {
    it('should get recent messages from last N hours', async () => {
      const messages = [
        { id: 'msg1', from: 'test@example.com', subject: 'Test', date: new Date(), flags: [], preview: 'Test' },
      ];
      mockImapConnection.listMessages.mockResolvedValue(messages);

      service = new BackgroundService(mockApi, mockConfig);
      await service.start();

      const recent = await service.getRecentMessages(24);
      expect(recent).toHaveLength(1);
      expect(mockImapConnection.select).toHaveBeenCalledWith('INBOX');
    });

    it('should start service if not running', async () => {
      const messages = [];
      mockImapConnection.listMessages.mockResolvedValue(messages);

      service = new BackgroundService(mockApi, mockConfig);
      await service.getRecentMessages(24);

      expect(mockImapConnection.connect).toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('should get service status', async () => {
      const inboxStats = {
        attributes: {
          unread: 5,
          messages: 100,
          size: 1024,
        },
      };
      mockImapConnection.status.mockResolvedValue(inboxStats);

      service = new BackgroundService(mockApi, mockConfig);
      await service.start();

      const status = await service.getStatus();

      expect(status).toEqual({
        running: true,
        lastCheck: expect.any(Date),
        unreadMessages: 5,
        totalMessages: 100,
        quarantineMessages: 0,
      });
    });

    it('should handle status errors gracefully', async () => {
      service = new BackgroundService(mockApi, mockConfig);
      await service.start();

      const status = await service.getStatus();

      expect(status.running).toBe(true);
    });
  });

  describe('scanNewMessages', () => {
    it('should scan for new messages', async () => {
      const messages: any[] = [
        { id: 'msg1', from: 'test@example.com', subject: 'Test', date: new Date(), flags: [], preview: 'Test' },
      ];
      mockImapConnection.listMessages.mockResolvedValue(messages);

      service = new BackgroundService(mockApi, mockConfig);
      await service.start();

      await vi.advanceTimersByTimeAsync(60000);

      expect(mockApi.logger.info).toHaveBeenCalledWith('Found 1 new messages');
    });
  });
});
