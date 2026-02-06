import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ImapClient } from './imap-client';
import type { ImapConfig } from './imap-client';

describe('ImapClient', () => {
  let imapClient: ImapClient;
  let mockConnection: any;

  const mockConfig: ImapConfig = {
    host: '127.0.0.1',
    port: 1143,
    user: 'test@example.com',
    password: 'test-password',
    useStarttls: true,
  };

  beforeEach(() => {
    mockConnection = {
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

    imapClient = new ImapClient(mockConfig, mockConnection);
  });

  describe('connect', () => {
    it('should connect to IMAP server', async () => {
      await imapClient.connect();
      expect(mockConnection.connect).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      mockConnection.connect.mockRejectedValue(new Error('Connection failed'));
      await expect(imapClient.connect()).rejects.toThrow('Connection failed');
    });

    it('should set connected flag after connection', async () => {
      await imapClient.connect();
      expect(imapClient['connected']).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should disconnect from IMAP server', async () => {
      await imapClient.disconnect();
      expect(mockConnection.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnection errors', async () => {
      mockConnection.disconnect.mockRejectedValue(new Error('Disconnect failed'));
      await expect(imapClient.disconnect()).rejects.toThrow('Disconnect failed');
    });

    it('should set connected flag to false after disconnect', async () => {
      await imapClient.connect();
      await imapClient.disconnect();
      expect(imapClient['connected']).toBe(false);
    });
  });

  describe('selectFolder', () => {
    it('should select folder and connect if not connected', async () => {
      await imapClient.selectFolder('INBOX');
      expect(mockConnection.connect).toHaveBeenCalled();
      expect(mockConnection.select).toHaveBeenCalledWith('INBOX');
    });

    it('should select folder without connecting if already connected', async () => {
      await imapClient.connect();
      await imapClient.selectFolder('INBOX');
      expect(mockConnection.connect).toHaveBeenCalledTimes(1);
      expect(mockConnection.select).toHaveBeenCalledWith('INBOX');
    });

    it('should handle folder selection errors', async () => {
      mockConnection.select.mockRejectedValue(new Error('Folder not found'));
      await expect(imapClient.selectFolder('INBOX')).rejects.toThrow('Folder not found');
    });
  });

  describe('listFolders', () => {
    it('should list folders and connect if not connected', async () => {
      const mockFolders = [
        { name: 'INBOX' },
        { name: 'Sent' },
        { name: 'Drafts' },
      ];
      mockConnection.list.mockResolvedValue(mockFolders);

      const result = await imapClient.listFolders();
      expect(result).toEqual(['INBOX', 'Sent', 'Drafts']);
      expect(mockConnection.connect).toHaveBeenCalled();
    });

    it('should handle list folders errors', async () => {
      mockConnection.list.mockRejectedValue(new Error('List failed'));
      await expect(imapClient.listFolders()).rejects.toThrow('List failed');
    });
  });

  describe('getMessages', () => {
    it('should fetch messages with default options', async () => {
      const mockMessages = [
        {
          seqNo: 1,
          uid: 1,
          headers: {
            from: { value: [{ address: { address: 'test@example.com' } }] },
            to: { value: [{ address: { address: 'recipient@example.com' } }] },
            subject: { value: 'Test Subject' },
          },
          attributes: { date: Date.now() },
          body: { text: 'Test body content' },
          flags: [],
          size: 100,
          parts: [],
        },
      ];
      mockConnection.listMessages.mockResolvedValue(mockMessages);

      const messages = await imapClient.getMessages({});
      expect(mockConnection.listMessages).toHaveBeenCalledWith(
        [],
        {
          markSeen: false,
          uid: true,
          bodyParts: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
        }
      );
      expect(messages).toHaveLength(1);
      expect(messages[0].subject).toBe('Test Subject');
    });

    it('should apply filter parameter', async () => {
      mockConnection.listMessages.mockResolvedValue([]);

      await imapClient.getMessages({ filter: 'unread' });
      expect(mockConnection.listMessages).toHaveBeenCalledWith(
        [{ seen: false }],
        expect.any(Object)
      );
    });

    it('should apply search phrase parameter', async () => {
      mockConnection.listMessages.mockResolvedValue([]);

      await imapClient.getMessages({ searchPhrase: 'important' });
      expect(mockConnection.listMessages).toHaveBeenCalledWith(
        [{ subject: 'important' }],
        expect.any(Object)
      );
    });

    it('should handle IMAP errors', async () => {
      mockConnection.listMessages.mockRejectedValue(new Error('IMAP error'));
      await expect(imapClient.getMessages({})).rejects.toThrow('IMAP error');
    });

    it('should apply count and offset parameters', async () => {
      mockConnection.listMessages.mockResolvedValue([]);

      await imapClient.getMessages({ count: 20, offset: 5 });
      expect(mockConnection.listMessages).toHaveBeenCalled();
    });
  });

  describe('getMessage', () => {
    it('should fetch a single message by ID', async () => {
      const mockMessage = {
        seqNo: 123,
        uid: 123,
        headers: {
          from: { value: [{ address: { address: 'test@example.com' } }] },
          to: { value: [{ address: { address: 'recipient@example.com' } }] },
          subject: { value: 'Test Subject' },
        },
        attributes: { date: Date.now() },
        body: { text: 'Test body content' },
        flags: [],
        size: 100,
        parts: [],
      };
      mockConnection.fetchMessage.mockResolvedValue(mockMessage);

      const message = await imapClient.getMessage('123');
      expect(mockConnection.fetchMessage).toHaveBeenCalledWith('123', expect.any(Object));
      expect(message.subject).toBe('Test Subject');
    });

    it('should handle message fetch errors', async () => {
      mockConnection.fetchMessage.mockRejectedValue(new Error('Message not found'));
      await expect(imapClient.getMessage('123')).rejects.toThrow('Message not found');
    });
  });

  describe('moveMessage', () => {
    it('should move message to folder', async () => {
      await imapClient.moveMessage('123', 'Archive');
      expect(mockConnection.move).toHaveBeenCalledWith({ seqNo: 123 }, 'Archive');
    });

    it('should connect if not connected', async () => {
      await imapClient.moveMessage('123', 'Archive');
      expect(mockConnection.connect).toHaveBeenCalled();
    });

    it('should handle move errors', async () => {
      mockConnection.move.mockRejectedValue(new Error('Move failed'));
      await expect(imapClient.moveMessage('123', 'Archive')).rejects.toThrow('Move failed');
    });
  });

  describe('copyMessage', () => {
    it('should copy message to folder', async () => {
      await imapClient.copyMessage('123', 'Archive');
      expect(mockConnection.copy).toHaveBeenCalledWith({ seqNo: 123 }, 'Archive');
    });

    it('should connect if not connected', async () => {
      await imapClient.copyMessage('123', 'Archive');
      expect(mockConnection.connect).toHaveBeenCalled();
    });

    it('should handle copy errors', async () => {
      mockConnection.copy.mockRejectedValue(new Error('Copy failed'));
      await expect(imapClient.copyMessage('123', 'Archive')).rejects.toThrow('Copy failed');
    });
  });

  describe('searchMessages', () => {
    it('should search messages with criteria', async () => {
      const mockMessages = [
        {
          seqNo: 1,
          uid: 1,
          headers: { from: { value: [{ address: { address: 'test@example.com' } }] }, to: { value: [{ address: { address: 'recipient@example.com' } }] }, subject: { value: 'Test Subject' } },
          attributes: { date: Date.now() },
          body: { text: 'Test body content' },
          flags: [],
          size: 100,
          parts: [],
        },
      ];
      mockConnection.listMessages.mockResolvedValue(mockMessages);

      const result = await imapClient.searchMessages([{ seen: false }]);
      expect(result).toHaveLength(1);
      expect(result[0].subject).toBe('Test Subject');
    });

    it('should handle search errors', async () => {
      mockConnection.listMessages.mockRejectedValue(new Error('Search failed'));
      await expect(imapClient.searchMessages([])).rejects.toThrow('Search failed');
    });
  });

  describe('getFolderStats', () => {
    it('should get folder statistics', async () => {
      const mockStats = {
        attributes: {
          unread: 5,
          messages: 100,
          size: 1024,
        },
      };
      mockConnection.status.mockResolvedValue(mockStats);

      const result = await imapClient.getFolderStats('INBOX');
      expect(result).toEqual({
        name: 'INBOX',
        unread: 5,
        total: 100,
        size: 1024,
      });
    });

    it('should handle stats errors', async () => {
      mockConnection.status.mockRejectedValue(new Error('Stats failed'));
      await expect(imapClient.getFolderStats('INBOX')).rejects.toThrow('Stats failed');
    });
  });
});
