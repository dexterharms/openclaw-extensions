"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const imap_client_1 = require("./imap-client");
(0, vitest_1.describe)('ImapClient', () => {
    let imapClient;
    let mockConnection;
    const mockConfig = {
        host: '127.0.0.1',
        port: 1143,
        user: 'test@example.com',
        password: 'test-password',
        useStarttls: true,
    };
    (0, vitest_1.beforeEach)(() => {
        mockConnection = {
            connect: vitest_1.vi.fn().mockResolvedValue(undefined),
            logout: vitest_1.vi.fn().mockResolvedValue(undefined),
            select: vitest_1.vi.fn().mockResolvedValue(undefined),
            list: vitest_1.vi.fn().mockResolvedValue([]),
            fetchAll: vitest_1.vi.fn().mockResolvedValue([]),
            fetchOne: vitest_1.vi.fn().mockResolvedValue({
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
            messageMove: vitest_1.vi.fn().mockResolvedValue(undefined),
            messageCopy: vitest_1.vi.fn().mockResolvedValue(undefined),
            status: vitest_1.vi.fn().mockResolvedValue({
                attributes: {
                    unread: 0,
                    messages: 0,
                    size: 0,
                },
            }),
            listMessages: vitest_1.vi.fn().mockResolvedValue([]),
        };
        imapClient = new imap_client_1.ImapClient(mockConfig, mockConnection);
    });
    (0, vitest_1.describe)('connect', () => {
        (0, vitest_1.it)('should connect to IMAP server', async () => {
            await imapClient.connect();
            (0, vitest_1.expect)(mockConnection.connect).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle connection errors', async () => {
            mockConnection.connect.mockRejectedValue(new Error('Connection failed'));
            await (0, vitest_1.expect)(imapClient.connect()).rejects.toThrow('Connection failed');
        });
        (0, vitest_1.it)('should set connected flag after connection', async () => {
            await imapClient.connect();
            (0, vitest_1.expect)(imapClient['connected']).toBe(true);
        });
    });
    (0, vitest_1.describe)('disconnect', () => {
        (0, vitest_1.it)('should disconnect from IMAP server', async () => {
            await imapClient.disconnect();
            (0, vitest_1.expect)(mockConnection.logout).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle disconnection errors', async () => {
            mockConnection.logout.mockRejectedValue(new Error('Disconnect failed'));
            await (0, vitest_1.expect)(imapClient.disconnect()).rejects.toThrow('Disconnect failed');
        });
        (0, vitest_1.it)('should set connected flag to false after disconnect', async () => {
            await imapClient.connect();
            await imapClient.disconnect();
            (0, vitest_1.expect)(imapClient['connected']).toBe(false);
        });
    });
    (0, vitest_1.describe)('selectFolder', () => {
        (0, vitest_1.it)('should select folder and connect if not connected', async () => {
            await imapClient.selectFolder('INBOX');
            (0, vitest_1.expect)(mockConnection.connect).toHaveBeenCalled();
            (0, vitest_1.expect)(mockConnection.select).toHaveBeenCalledWith('INBOX');
        });
        (0, vitest_1.it)('should select folder without connecting if already connected', async () => {
            await imapClient.connect();
            await imapClient.selectFolder('INBOX');
            (0, vitest_1.expect)(mockConnection.connect).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(mockConnection.select).toHaveBeenCalledWith('INBOX');
        });
        (0, vitest_1.it)('should handle folder selection errors', async () => {
            mockConnection.select.mockRejectedValue(new Error('Folder not found'));
            await (0, vitest_1.expect)(imapClient.selectFolder('INBOX')).rejects.toThrow('Folder not found');
        });
    });
    (0, vitest_1.describe)('listFolders', () => {
        (0, vitest_1.it)('should list folders and connect if not connected', async () => {
            const mockFolders = [
                { name: 'INBOX' },
                { name: 'Sent' },
                { name: 'Drafts' },
            ];
            mockConnection.list.mockResolvedValue(mockFolders);
            const result = await imapClient.listFolders();
            (0, vitest_1.expect)(result).toEqual(['INBOX', 'Sent', 'Drafts']);
            (0, vitest_1.expect)(mockConnection.connect).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle list folders errors', async () => {
            mockConnection.list.mockRejectedValue(new Error('List failed'));
            await (0, vitest_1.expect)(imapClient.listFolders()).rejects.toThrow('List failed');
        });
    });
    (0, vitest_1.describe)('getMessages', () => {
        (0, vitest_1.it)('should fetch messages with default options', async () => {
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
            (0, vitest_1.expect)(mockConnection.fetchAll).toHaveBeenCalledWith({}, {
                source: {
                    headers: ['from', 'to', 'cc', 'bcc', 'subject', 'date'],
                    bodyParts: ['text'],
                },
            });
            (0, vitest_1.expect)(messages).toHaveLength(1);
            (0, vitest_1.expect)(messages[0].subject).toBe('Test Subject');
        });
        (0, vitest_1.it)('should apply filter parameter', async () => {
            mockConnection.fetchAll.mockResolvedValue([]);
            await imapClient.getMessages({ filter: 'unread' });
            (0, vitest_1.expect)(mockConnection.fetchAll).toHaveBeenCalledWith({ seen: false }, vitest_1.expect.any(Object));
        });
        (0, vitest_1.it)('should apply search phrase parameter', async () => {
            mockConnection.fetchAll.mockResolvedValue([]);
            await imapClient.getMessages({ searchPhrase: 'important' });
            (0, vitest_1.expect)(mockConnection.fetchAll).toHaveBeenCalledWith({ subject: 'important' }, vitest_1.expect.any(Object));
        });
        (0, vitest_1.it)('should handle IMAP errors', async () => {
            mockConnection.fetchAll.mockRejectedValue(new Error('IMAP error'));
            await (0, vitest_1.expect)(imapClient.getMessages({})).rejects.toThrow('IMAP error');
        });
        (0, vitest_1.it)('should apply count and offset parameters', async () => {
            mockConnection.fetchAll.mockResolvedValue([]);
            await imapClient.getMessages({ count: 20, offset: 5 });
            (0, vitest_1.expect)(mockConnection.fetchAll).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('getMessage', () => {
        (0, vitest_1.it)('should fetch a single message by ID', async () => {
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
            (0, vitest_1.expect)(mockConnection.fetchOne).toHaveBeenCalledWith('123', vitest_1.expect.any(Object));
            (0, vitest_1.expect)(message.subject).toBe('Test Subject');
        });
        (0, vitest_1.it)('should handle message fetch errors', async () => {
            mockConnection.fetchOne.mockRejectedValue(new Error('Message not found'));
            await (0, vitest_1.expect)(imapClient.getMessage('123')).rejects.toThrow('Message not found');
        });
    });
    (0, vitest_1.describe)('moveMessage', () => {
        (0, vitest_1.it)('should move message to folder', async () => {
            await imapClient.moveMessage('123', 'Archive');
            (0, vitest_1.expect)(mockConnection.messageMove).toHaveBeenCalledWith('123', 'Archive');
        });
        (0, vitest_1.it)('should connect if not connected', async () => {
            await imapClient.moveMessage('123', 'Archive');
            (0, vitest_1.expect)(mockConnection.connect).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle move errors', async () => {
            mockConnection.messageMove.mockRejectedValue(new Error('Move failed'));
            await (0, vitest_1.expect)(imapClient.moveMessage('123', 'Archive')).rejects.toThrow('Move failed');
        });
    });
    (0, vitest_1.describe)('copyMessage', () => {
        (0, vitest_1.it)('should copy message to folder', async () => {
            await imapClient.copyMessage('123', 'Archive');
            (0, vitest_1.expect)(mockConnection.messageCopy).toHaveBeenCalledWith('123', 'Archive');
        });
        (0, vitest_1.it)('should connect if not connected', async () => {
            await imapClient.copyMessage('123', 'Archive');
            (0, vitest_1.expect)(mockConnection.connect).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle copy errors', async () => {
            mockConnection.messageCopy.mockRejectedValue(new Error('Copy failed'));
            await (0, vitest_1.expect)(imapClient.copyMessage('123', 'Archive')).rejects.toThrow('Copy failed');
        });
    });
    (0, vitest_1.describe)('searchMessages', () => {
        (0, vitest_1.it)('should search messages with criteria', async () => {
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
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].subject).toBe('Test Subject');
        });
        (0, vitest_1.it)('should handle search errors', async () => {
            mockConnection.listMessages.mockRejectedValue(new Error('Search failed'));
            await (0, vitest_1.expect)(imapClient.searchMessages([])).rejects.toThrow('Search failed');
        });
    });
    (0, vitest_1.describe)('getFolderStats', () => {
        (0, vitest_1.it)('should get folder statistics', async () => {
            const mockStats = {
                attributes: {
                    unread: 5,
                    messages: 100,
                    size: 1024,
                },
            };
            mockConnection.status.mockResolvedValue(mockStats);
            const result = await imapClient.getFolderStats('INBOX');
            (0, vitest_1.expect)(result).toEqual({
                name: 'INBOX',
                unread: 5,
                total: 100,
                size: 1024,
            });
        });
        (0, vitest_1.it)('should handle stats errors', async () => {
            mockConnection.status.mockRejectedValue(new Error('Stats failed'));
            await (0, vitest_1.expect)(imapClient.getFolderStats('INBOX')).rejects.toThrow('Stats failed');
        });
    });
});
//# sourceMappingURL=imap-client.test.js.map