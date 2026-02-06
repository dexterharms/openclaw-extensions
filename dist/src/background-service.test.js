"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const background_service_1 = require("./background-service");
(0, vitest_1.describe)('BackgroundService', () => {
    let service;
    let mockApi;
    let mockImapConnection;
    const mockConfig = {
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
    (0, vitest_1.beforeEach)(() => {
        mockImapConnection = {
            connect: vitest_1.vi.fn().mockResolvedValue(undefined),
            logout: vitest_1.vi.fn().mockResolvedValue(undefined),
            select: vitest_1.vi.fn().mockResolvedValue(undefined),
            list: vitest_1.vi.fn().mockResolvedValue([]),
            fetchAll: vitest_1.vi.fn().mockResolvedValue([]),
            fetchOne: vitest_1.vi.fn().mockResolvedValue({}),
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
        mockApi = {
            logger: {
                info: vitest_1.vi.fn(),
                warn: vitest_1.vi.fn(),
                error: vitest_1.vi.fn(),
            },
            sessions_send: vitest_1.vi.fn().mockResolvedValue(undefined),
        };
        vitest_1.vi.useFakeTimers();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('start', () => {
        (0, vitest_1.it)('should start polling interval', async () => {
            service = new background_service_1.BackgroundService(mockApi, mockConfig, mockImapConnection);
            await service.start();
            (0, vitest_1.expect)(mockImapConnection.connect).toHaveBeenCalled();
            (0, vitest_1.expect)(mockApi.logger.info).toHaveBeenCalledWith('Starting mail-access background service');
        });
        (0, vitest_1.it)('should not start if already running', async () => {
            service = new background_service_1.BackgroundService(mockApi, mockConfig, mockImapConnection);
            await service.start();
            await service.start();
            (0, vitest_1.expect)(mockApi.logger.warn).toHaveBeenCalledWith('Background service already running');
        });
        (0, vitest_1.it)('should handle connection errors', async () => {
            mockImapConnection.connect.mockRejectedValue(new Error('Connection failed'));
            service = new background_service_1.BackgroundService(mockApi, mockConfig, mockImapConnection);
            await (0, vitest_1.expect)(service.start()).rejects.toThrow('Connection failed');
        });
        (0, vitest_1.it)('should trigger security agent when new messages found', async () => {
            // Mock raw IMAP message structure
            const rawMessages = [
                {
                    seq: 1,
                    uid: 1,
                    size: 1000,
                    flags: [],
                    from: { address: 'test@example.com' },
                    to: [{ address: 'recipient@example.com' }],
                    subject: 'Test',
                    date: new Date(),
                    text: 'Test body',
                    attachments: [],
                },
                {
                    seq: 2,
                    uid: 2,
                    size: 1000,
                    flags: [],
                    from: { address: 'test2@example.com' },
                    to: [{ address: 'recipient@example.com' }],
                    subject: 'Test2',
                    date: new Date(),
                    text: 'Test2 body',
                    attachments: [],
                },
            ];
            mockImapConnection.fetchAll.mockResolvedValue(rawMessages);
            service = new background_service_1.BackgroundService(mockApi, mockConfig, mockImapConnection);
            await service.start();
            await vitest_1.vi.advanceTimersByTimeAsync(60000);
            (0, vitest_1.expect)(mockApi.sessions_send).toHaveBeenCalledWith({
                agent: 'security-agent',
                message: 'New email detected: 2 message(s). Scan INBOX for threats using mail_security_scan_mail.',
            });
        });
        (0, vitest_1.it)('should not trigger security agent when no new messages', async () => {
            mockImapConnection.fetchAll.mockResolvedValue([]);
            service = new background_service_1.BackgroundService(mockApi, mockConfig, mockImapConnection);
            await service.start();
            await vitest_1.vi.advanceTimersByTimeAsync(60000);
            (0, vitest_1.expect)(mockApi.sessions_send).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle polling errors gracefully', async () => {
            const messages = [];
            mockImapConnection.fetchAll.mockResolvedValue(messages);
            service = new background_service_1.BackgroundService(mockApi, mockConfig, mockImapConnection);
            await service.start();
            await vitest_1.vi.advanceTimersByTimeAsync(60000);
            (0, vitest_1.expect)(mockApi.logger.info).toHaveBeenCalledWith('Found 0 new messages');
        });
    });
    (0, vitest_1.describe)('stop', () => {
        (0, vitest_1.it)('should stop polling interval', async () => {
            service = new background_service_1.BackgroundService(mockApi, mockConfig, mockImapConnection);
            await service.start();
            await service.stop();
            (0, vitest_1.expect)(mockApi.logger.info).toHaveBeenCalledWith('Stopping mail-access background service');
            (0, vitest_1.expect)(mockImapConnection.logout).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle disconnect errors gracefully', async () => {
            mockImapConnection.logout.mockRejectedValue(new Error('Disconnect failed'));
            service = new background_service_1.BackgroundService(mockApi, mockConfig, mockImapConnection);
            await service.start();
            await service.stop();
            (0, vitest_1.expect)(mockApi.logger.error).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('getRecentMessages', () => {
        (0, vitest_1.it)('should get recent messages from last N hours', async () => {
            const rawMessages = [
                {
                    seq: 1,
                    uid: 1,
                    size: 1000,
                    flags: [],
                    from: { address: 'test@example.com' },
                    to: [{ address: 'recipient@example.com' }],
                    subject: 'Test',
                    date: new Date(),
                    text: 'Test body',
                    attachments: [],
                },
            ];
            mockImapConnection.fetchAll.mockResolvedValue(rawMessages);
            service = new background_service_1.BackgroundService(mockApi, mockConfig, mockImapConnection);
            await service.start();
            const recent = await service.getRecentMessages(24);
            (0, vitest_1.expect)(recent).toHaveLength(1);
            (0, vitest_1.expect)(mockImapConnection.select).toHaveBeenCalledWith('INBOX');
        });
        (0, vitest_1.it)('should start service if not running', async () => {
            const rawMessages = [];
            mockImapConnection.fetchAll.mockResolvedValue(rawMessages);
            service = new background_service_1.BackgroundService(mockApi, mockConfig, mockImapConnection);
            await service.getRecentMessages(24);
            (0, vitest_1.expect)(mockImapConnection.connect).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('getStatus', () => {
        (0, vitest_1.it)('should get service status', async () => {
            const inboxStats = {
                attributes: {
                    unread: 5,
                    messages: 100,
                    size: 1024,
                },
            };
            const quarantineStats = {
                attributes: {
                    unread: 0,
                    messages: 0,
                    size: 0,
                },
            };
            // Mock to return different values based on folder name
            mockImapConnection.status.mockImplementation((folder) => {
                if (folder === 'INBOX')
                    return Promise.resolve(inboxStats);
                if (folder === 'Quarantine')
                    return Promise.resolve(quarantineStats);
                return Promise.resolve({ attributes: { unread: 0, messages: 0, size: 0 } });
            });
            service = new background_service_1.BackgroundService(mockApi, mockConfig, mockImapConnection);
            await service.start();
            const status = await service.getStatus();
            (0, vitest_1.expect)(status).toEqual({
                running: true,
                lastCheck: vitest_1.expect.any(Date),
                unreadMessages: 5,
                totalMessages: 100,
                quarantineMessages: 0,
            });
        });
        (0, vitest_1.it)('should handle status errors gracefully', async () => {
            service = new background_service_1.BackgroundService(mockApi, mockConfig, mockImapConnection);
            await service.start();
            const status = await service.getStatus();
            (0, vitest_1.expect)(status.running).toBe(true);
        });
    });
    (0, vitest_1.describe)('scanNewMessages', () => {
        (0, vitest_1.it)('should scan for new messages', async () => {
            const rawMessages = [
                {
                    seqNo: 1,
                    uid: 1,
                    size: 1000,
                    flags: [],
                    attributes: { date: new Date() },
                    headers: {
                        from: { value: [{ address: { address: 'test@example.com' } }] },
                        to: { value: [{ address: { address: 'recipient@example.com' } }] },
                        subject: { value: 'Test' },
                    },
                    body: { text: 'Test body' },
                },
            ];
            mockImapConnection.fetchAll.mockResolvedValue(rawMessages);
            service = new background_service_1.BackgroundService(mockApi, mockConfig, mockImapConnection);
            await service.start();
            await vitest_1.vi.advanceTimersByTimeAsync(60000);
            (0, vitest_1.expect)(mockApi.logger.info).toHaveBeenCalledWith('Found 1 new messages');
        });
    });
});
//# sourceMappingURL=background-service.test.js.map