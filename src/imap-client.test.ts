import { describe, it, expect, vi, beforeEach } from 'vitest';
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
      logout: vi.fn().mockResolvedValue(undefined),
      select: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue([]),
      fetchAll: vi.fn().mockResolvedValue([]),
      fetchOne: vi.fn().mockResolvedValue({
        seq: 1,
        uid: 123,
        subject: 'Test Subject',
        from: { address: 'test@example.com' },
        to: [{ address: 'recipient@example.com' }],
        date: new Date(),
        size: 1024,
        flags: [],
        text: 'Test body',
        attachments: [],
      }),
      messageMove: vi.fn().mockResolvedValue(undefined),
      messageCopy: vi.fn().mockResolvedValue(undefined),
      status: vi.fn().mockResolvedValue({
        attributes: {
          unread: 0,
          messages: 0,
          size: 0,
        },
      }),
      listMessages: vi.fn().mockResolvedValue([]),
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
      expect(mockConnection.logout).toHaveBeenCalled();
    });

    it('should handle disconnection errors', async () => {
      mockConnection.logout.mockRejectedValue(new Error('Disconnect failed'));
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
          seq: 1,
          uid: 1,
          subject: 'Test Subject',
          from: { address: 'test@example.com' },
          to: [{ address: 'recipient@example.com' }],
          date: new Date(),
          size: 100,
          flags: [],
          text: 'Test body content',
          attachments: [],
        },
      ];
      mockConnection.fetchAll.mockResolvedValue(mockMessages);

      const messages = await imapClient.getMessages({});
      expect(mockConnection.fetchAll).toHaveBeenCalledWith(
        {},
        {
          source: {
            headers: ['from', 'to', 'cc', 'bcc', 'subject', 'date'],
            bodyParts: ['text'],
          },
        }
      );
      expect(messages).toHaveLength(1);
      expect(messages[0].subject).toBe('Test Subject');
    });

    it('should apply filter parameter', async () => {
      mockConnection.fetchAll.mockResolvedValue([]);

      await imapClient.getMessages({ filter: 'unread' });
      expect(mockConnection.fetchAll).toHaveBeenCalledWith(
        { seen: false },
        expect.any(Object)
      );
    });

    it('should apply search phrase parameter', async () => {
      mockConnection.fetchAll.mockResolvedValue([]);

      await imapClient.getMessages({ searchPhrase: 'important' });
      expect(mockConnection.fetchAll).toHaveBeenCalledWith(
        { subject: 'important' },
        expect.any(Object)
      );
    });

    it('should handle IMAP errors', async () => {
      mockConnection.fetchAll.mockRejectedValue(new Error('IMAP error'));
      await expect(imapClient.getMessages({})).rejects.toThrow('IMAP error');
    });

    it('should apply count and offset parameters', async () => {
      mockConnection.fetchAll.mockResolvedValue([]);

      await imapClient.getMessages({ count: 20, offset: 5 });
      expect(mockConnection.fetchAll).toHaveBeenCalled();
    });
  });

  describe('getMessage', () => {
    it('should fetch a single message by ID', async () => {
      const mockMessage = {
        seq: 123,
        uid: 123,
        from: { address: 'test@example.com' },
        to: [{ address: 'recipient@example.com' }],
        subject: 'Test Subject',
        date: new Date(),
        size: 100,
        flags: [],
        text: 'Test body content',
        attachments: [],
      };
      mockConnection.fetchOne.mockResolvedValue(mockMessage);

      const message = await imapClient.getMessage('123');
      expect(mockConnection.fetchOne).toHaveBeenCalledWith('123', expect.any(Object));
      expect(message.subject).toBe('Test Subject');
    });

    it('should handle message fetch errors', async () => {
      mockConnection.fetchOne.mockRejectedValue(new Error('Message not found'));
      await expect(imapClient.getMessage('123')).rejects.toThrow('Message not found');
    });
  });

  describe('moveMessage', () => {
    it('should move message to folder', async () => {
      await imapClient.moveMessage('123', 'Archive');
      expect(mockConnection.messageMove).toHaveBeenCalledWith('123', 'Archive');
    });

    it('should connect if not connected', async () => {
      await imapClient.moveMessage('123', 'Archive');
      expect(mockConnection.connect).toHaveBeenCalled();
    });

    it('should handle move errors', async () => {
      mockConnection.messageMove.mockRejectedValue(new Error('Move failed'));
      await expect(imapClient.moveMessage('123', 'Archive')).rejects.toThrow('Move failed');
    });
  });

  describe('copyMessage', () => {
    it('should copy message to folder', async () => {
      await imapClient.copyMessage('123', 'Archive');
      expect(mockConnection.messageCopy).toHaveBeenCalledWith('123', 'Archive');
    });

    it('should connect if not connected', async () => {
      await imapClient.copyMessage('123', 'Archive');
      expect(mockConnection.connect).toHaveBeenCalled();
    });

    it('should handle copy errors', async () => {
      mockConnection.messageCopy.mockRejectedValue(new Error('Copy failed'));
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
