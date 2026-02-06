"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const smtp_client_1 = require("./smtp-client");
(0, vitest_1.describe)('SmtpClient', () => {
    let smtpClient;
    let mockConnection;
    const mockConfig = {
        host: '127.0.0.1',
        port: 1025,
        user: 'test@example.com',
        password: 'test-password',
        useStarttls: true,
        from: 'test@example.com',
    };
    (0, vitest_1.beforeEach)(() => {
        mockConnection = {
            verify: vitest_1.vi.fn().mockResolvedValue(true),
            close: vitest_1.vi.fn().mockResolvedValue(undefined),
            sendMail: vitest_1.vi.fn().mockResolvedValue({ messageId: 'msg-123' }),
        };
        smtpClient = new smtp_client_1.SmtpClient(mockConfig, mockConnection);
    });
    (0, vitest_1.describe)('connect', () => {
        (0, vitest_1.it)('should connect to SMTP server', async () => {
            await smtpClient.connect();
            (0, vitest_1.expect)(mockConnection.verify).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle connection errors', async () => {
            mockConnection.verify.mockRejectedValue(new Error('Connection failed'));
            await (0, vitest_1.expect)(smtpClient.connect()).rejects.toThrow('Connection failed');
        });
        (0, vitest_1.it)('should set connected flag after connection', async () => {
            await smtpClient.connect();
            (0, vitest_1.expect)(smtpClient['connected']).toBe(true);
        });
    });
    (0, vitest_1.describe)('disconnect', () => {
        (0, vitest_1.it)('should disconnect from SMTP server', async () => {
            await smtpClient.disconnect();
            (0, vitest_1.expect)(mockConnection.close).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle disconnection errors', async () => {
            mockConnection.close.mockRejectedValue(new Error('Disconnect failed'));
            await (0, vitest_1.expect)(smtpClient.disconnect()).rejects.toThrow('Disconnect failed');
        });
        (0, vitest_1.it)('should set connected flag to false after disconnect', async () => {
            await smtpClient.connect();
            await smtpClient.disconnect();
            (0, vitest_1.expect)(smtpClient['connected']).toBe(false);
        });
    });
    (0, vitest_1.describe)('sendMail', () => {
        (0, vitest_1.it)('should send email message', async () => {
            const message = {
                to: ['recipient@example.com'],
                subject: 'Test Subject',
                text: 'Test body',
            };
            const result = await smtpClient.sendMail(message);
            (0, vitest_1.expect)(mockConnection.sendMail).toHaveBeenCalledWith({
                from: 'test@example.com',
                to: ['recipient@example.com'],
                subject: 'Test Subject',
                text: 'Test body',
            });
            (0, vitest_1.expect)(result.messageId).toBe('msg-123');
        });
        (0, vitest_1.it)('should handle single recipient', async () => {
            const message = {
                to: 'single@example.com',
                subject: 'Test',
                text: 'Body',
            };
            await smtpClient.sendMail(message);
            (0, vitest_1.expect)(mockConnection.sendMail).toHaveBeenCalledWith({
                from: 'test@example.com',
                to: ['single@example.com'],
                subject: 'Test',
                text: 'Body',
            });
        });
        (0, vitest_1.it)('should handle CC recipients', async () => {
            const message = {
                to: ['recipient@example.com'],
                cc: ['cc@example.com'],
                subject: 'Test',
                text: 'Body',
            };
            await smtpClient.sendMail(message);
            (0, vitest_1.expect)(mockConnection.sendMail).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ cc: ['cc@example.com'] }));
        });
        (0, vitest_1.it)('should handle BCC recipients', async () => {
            const message = {
                to: ['recipient@example.com'],
                bcc: ['bcc@example.com'],
                subject: 'Test',
                text: 'Body',
            };
            await smtpClient.sendMail(message);
            (0, vitest_1.expect)(mockConnection.sendMail).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ bcc: ['bcc@example.com'] }));
        });
        (0, vitest_1.it)('should handle replyTo, inReplyTo, and references', async () => {
            const message = {
                to: ['recipient@example.com'],
                subject: 'Test',
                text: 'Body',
                replyTo: 'reply@example.com',
                inReplyTo: 'msg-123',
                references: 'msg-456',
            };
            await smtpClient.sendMail(message);
            (0, vitest_1.expect)(mockConnection.sendMail).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                replyTo: 'reply@example.com',
                inReplyTo: 'msg-123',
                references: 'msg-456',
            }));
        });
        (0, vitest_1.it)('should handle sending errors', async () => {
            mockConnection.sendMail.mockRejectedValue(new Error('SMTP error'));
            await (0, vitest_1.expect)(smtpClient.sendMail({})).rejects.toThrow('SMTP error');
        });
        (0, vitest_1.it)('should connect if not connected', async () => {
            smtpClient['connected'] = false;
            await smtpClient.sendMail({ to: ['test@example.com'], subject: 'Test', text: 'Body' });
            (0, vitest_1.expect)(mockConnection.verify).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('replyTo', () => {
        (0, vitest_1.it)('should reply to a message', async () => {
            const message = {
                to: ['recipient@example.com'],
                subject: 'Re: Test',
                text: 'Reply content',
            };
            const result = await smtpClient.replyTo('msg-123', message);
            (0, vitest_1.expect)(mockConnection.sendMail).toHaveBeenCalledWith({
                from: 'test@example.com',
                to: ['recipient@example.com'],
                subject: vitest_1.expect.stringContaining('Re:'),
                text: vitest_1.expect.any(String),
                replyTo: 'test@example.com',
                inReplyTo: 'msg-123',
                references: 'msg-123',
            });
            (0, vitest_1.expect)(result.messageId).toBe('msg-123');
        });
        (0, vitest_1.it)('should use custom subject if provided', async () => {
            const message = {
                to: ['recipient@example.com'],
                subject: 'Custom Subject',
                text: 'Reply content',
            };
            await smtpClient.replyTo('msg-123', message);
            (0, vitest_1.expect)(mockConnection.sendMail).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ subject: 'Custom Subject' }));
        });
        (0, vitest_1.it)('should handle reply errors', async () => {
            mockConnection.sendMail.mockRejectedValue(new Error('Reply failed'));
            await (0, vitest_1.expect)(smtpClient.replyTo('msg-123', {})).rejects.toThrow('Reply failed');
        });
        (0, vitest_1.it)('should connect if not connected', async () => {
            smtpClient['connected'] = false;
            await smtpClient.replyTo('msg-123', { to: ['test@example.com'], text: 'Body' });
            (0, vitest_1.expect)(mockConnection.verify).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('forwardMessage', () => {
        (0, vitest_1.it)('should forward a message', async () => {
            const message = {
                to: ['recipient@example.com'],
                subject: 'Fwd: Test',
                text: 'Forward content',
            };
            const result = await smtpClient.forwardMessage('msg-123', ['recipient@example.com'], message);
            (0, vitest_1.expect)(mockConnection.sendMail).toHaveBeenCalledWith({
                from: 'test@example.com',
                to: ['recipient@example.com'],
                subject: vitest_1.expect.stringContaining('Fwd:'),
                text: vitest_1.expect.any(String),
                references: 'msg-123',
            });
            (0, vitest_1.expect)(result.messageId).toBe('msg-123');
        });
        (0, vitest_1.it)('should handle single recipient', async () => {
            const message = {
                to: ['recipient@example.com'],
                text: 'Forward content',
            };
            await smtpClient.forwardMessage('msg-123', 'recipient@example.com', message);
            (0, vitest_1.expect)(mockConnection.sendMail).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ to: ['recipient@example.com'] }));
        });
        (0, vitest_1.it)('should handle forward errors', async () => {
            mockConnection.sendMail.mockRejectedValue(new Error('Forward failed'));
            await (0, vitest_1.expect)(smtpClient.forwardMessage('msg-123', [], {})).rejects.toThrow('Forward failed');
        });
        (0, vitest_1.it)('should connect if not connected', async () => {
            smtpClient['connected'] = false;
            await smtpClient.forwardMessage('msg-123', [], { text: 'Body' });
            (0, vitest_1.expect)(mockConnection.verify).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('getConnectionStatus', () => {
        (0, vitest_1.it)('should return true when connected', async () => {
            smtpClient['connected'] = true;
            const status = await smtpClient.getConnectionStatus();
            (0, vitest_1.expect)(status).toBe(true);
        });
        (0, vitest_1.it)('should connect and return true on first call', async () => {
            smtpClient['connected'] = false;
            const status = await smtpClient.getConnectionStatus();
            (0, vitest_1.expect)(status).toBe(true);
            (0, vitest_1.expect)(mockConnection.verify).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should return false if connection fails', async () => {
            mockConnection.verify.mockRejectedValue(new Error('Connection failed'));
            smtpClient['connected'] = false;
            const status = await smtpClient.getConnectionStatus();
            (0, vitest_1.expect)(status).toBe(false);
        });
    });
});
//# sourceMappingURL=smtp-client.test.js.map