"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const tools_1 = require("./tools");
(0, vitest_1.describe)('Tool Handlers', () => {
    let mockApi;
    let mockConfig;
    let mockImapClient;
    let mockSmtpClient;
    let mockSecurityScanner;
    (0, vitest_1.beforeEach)(() => {
        mockApi = {
            logger: {
                info: vitest_1.vi.fn(),
                error: vitest_1.vi.fn(),
            },
            registerTool: vitest_1.vi.fn(),
        };
        mockConfig = {
            folders: {
                inbox: 'INBOX',
                safeInbox: 'Safe-Inbox',
                quarantine: 'Quarantine',
            },
        };
        mockImapClient = {
            selectFolder: vitest_1.vi.fn().mockResolvedValue(undefined),
            getMessages: vitest_1.vi.fn().mockResolvedValue([
                { id: 'msg1', from: 'test@example.com', subject: 'Test', date: new Date(), flags: [], preview: 'Preview' },
            ]),
            getMessage: vitest_1.vi.fn().mockResolvedValue({
                from: 'test@example.com',
                to: 'recipient@example.com',
                subject: 'Test',
                body: 'Body',
                date: new Date(),
                attachments: [],
            }),
        };
        mockSmtpClient = {
            connect: vitest_1.vi.fn().mockResolvedValue(undefined),
            sendMail: vitest_1.vi.fn().mockResolvedValue({ messageId: 'msg-sent-123' }),
            replyTo: vitest_1.vi.fn().mockResolvedValue({ messageId: 'msg-reply-123' }),
            forwardMessage: vitest_1.vi.fn().mockResolvedValue({ messageId: 'msg-forward-123' }),
        };
        mockSecurityScanner = {
            analyzeMessage: vitest_1.vi.fn().mockReturnValue({
                level: 'safe',
                reasons: [],
                phishingScore: 0,
                attachmentThreats: [],
                linkThreats: [],
                senderReputation: 'unknown',
            }),
        };
    });
    (0, vitest_1.describe)('Safe Mail Tools', () => {
        (0, vitest_1.beforeEach)(() => {
            (0, tools_1.registerSafeMailTools)(mockApi, mockConfig, mockImapClient, mockSmtpClient);
        });
        (0, vitest_1.it)('should register mail_access_get_mail tool', () => {
            (0, vitest_1.expect)(mockApi.registerTool).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                name: 'mail_access_get_mail',
                description: vitest_1.expect.any(String),
                parameters: vitest_1.expect.any(Object),
            }));
        });
        (0, vitest_1.it)('should register mail_access_read_mail tool', () => {
            (0, vitest_1.expect)(mockApi.registerTool).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ name: 'mail_access_read_mail' }));
        });
        (0, vitest_1.it)('should register mail_access_reply tool', () => {
            (0, vitest_1.expect)(mockApi.registerTool).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ name: 'mail_access_reply' }));
        });
        (0, vitest_1.it)('should register mail_access_forward tool', () => {
            (0, vitest_1.expect)(mockApi.registerTool).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ name: 'mail_access_forward' }));
        });
        (0, vitest_1.it)('should register mail_access_send_mail tool', () => {
            (0, vitest_1.expect)(mockApi.registerTool).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ name: 'mail_access_send_mail' }));
        });
        (0, vitest_1.it)('should register mail_access_archive tool', () => {
            (0, vitest_1.expect)(mockApi.registerTool).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ name: 'mail_access_archive' }));
        });
        (0, vitest_1.it)('should register mail_access_move tool', () => {
            (0, vitest_1.expect)(mockApi.registerTool).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ name: 'mail_access_move' }));
        });
        (0, vitest_1.it)('should handle reply errors', async () => {
            mockImapClient.getMessage.mockRejectedValue(new Error('Message not found'));
            const toolCalls = mockApi.registerTool.mock.calls;
            const replyHandler = toolCalls.find((call) => call[0]?.name === 'mail_access_reply')?.[0]?.handler;
            if (replyHandler) {
                const result = await replyHandler({ id: 'msg1', content: 'Reply' });
                (0, vitest_1.expect)(result.content[0].text).toContain('"success":false');
            }
        });
    });
    (0, vitest_1.describe)('Security Tools', () => {
        (0, vitest_1.it)('should register security tools with optional flag', () => {
            (0, tools_1.registerSecurityTools)(mockApi, mockConfig, mockImapClient, mockSecurityScanner);
            const registerCalls = mockApi.registerTool.mock.calls;
            (0, vitest_1.expect)(registerCalls.length).toBeGreaterThanOrEqual(5);
            const securityToolNames = [
                'mail_security_scan_mail',
                'mail_security_mark_safe',
                'mail_security_quarantine',
                'mail_security_trash',
                'mail_security_finish_check',
            ];
            securityToolNames.forEach(name => {
                const call = registerCalls.find((c) => c[0]?.name === name);
                (0, vitest_1.expect)(call?.[1]).toEqual({ optional: true });
            });
        });
        (0, vitest_1.it)('should register security tools even for main agent (agent config enforces availability)', () => {
            (0, tools_1.registerSecurityTools)(mockApi, mockConfig, mockImapClient, mockSecurityScanner);
            const registerCalls = mockApi.registerTool.mock.calls;
            (0, vitest_1.expect)(registerCalls.length).toBeGreaterThan(0);
            const securityToolNames = [
                'mail_security_scan_mail',
                'mail_security_mark_safe',
                'mail_security_quarantine',
                'mail_security_trash',
                'mail_security_finish_check',
            ];
            securityToolNames.forEach(name => {
                const call = registerCalls.find((c) => c[0]?.name === name);
                (0, vitest_1.expect)(call?.[1]).toEqual({ optional: true });
            });
        });
        (0, vitest_1.it)('should call imapClient for scan mail tool', () => {
            (0, tools_1.registerSecurityTools)(mockApi, mockConfig, mockImapClient, mockSecurityScanner);
            const registerCalls = mockApi.registerTool.mock.calls;
            const scanCall = registerCalls.find((c) => c[0]?.name === 'mail_security_scan_mail');
            if (scanCall) {
                const handler = scanCall[0]?.handler;
                if (handler) {
                    const params = { scanAll: false };
                    handler(params);
                    (0, vitest_1.expect)(mockImapClient.getMessages).toHaveBeenCalled();
                }
            }
        });
        (0, vitest_1.it)('should call securityScanner for scan mail tool', async () => {
            // Need to mock getMessages to return a test message
            mockImapClient.getMessages.mockResolvedValue([
                { id: 'msg1', from: 'test@example.com', subject: 'Test', date: new Date(), flags: [], preview: 'Test' },
            ]);
            (0, tools_1.registerSecurityTools)(mockApi, mockConfig, mockImapClient, mockSecurityScanner);
            const registerCalls = mockApi.registerTool.mock.calls;
            const scanCall = registerCalls.find((c) => c[0]?.name === 'mail_security_scan_mail');
            if (scanCall) {
                const handler = scanCall[0]?.handler;
                if (handler) {
                    const params = { scanAll: false };
                    await handler(params);
                    (0, vitest_1.expect)(mockSecurityScanner.analyzeMessage).toHaveBeenCalled();
                }
            }
        });
    });
});
//# sourceMappingURL=tools.test.js.map