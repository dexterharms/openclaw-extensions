"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const security_scanner_1 = require("./security-scanner");
let mockConfig = {
    knownSafeSenders: ['blake@harms.haus', 'erin@harms.haus'],
    criticalThreats: ['.exe', '.scr', '.bat', '.js', '.vbs'],
    phishingKeywords: ['urgent', 'immediate action', 'verify account'],
    credentialRequestPhrases: ['password', 'verify your account'],
    attachmentBlacklist: ['.pdf', '.doc', '.docx'],
    linkThreatPatterns: ['bit.ly', 't.co'],
};
(0, vitest_1.describe)('SecurityScanner', () => {
    let scanner;
    (0, vitest_1.beforeEach)(() => {
        scanner = new security_scanner_1.SecurityScanner(mockConfig);
    });
    (0, vitest_1.describe)('analyzeMessage', () => {
        (0, vitest_1.it)('should mark safe messages from known senders', () => {
            const message = {
                id: 'msg-1',
                from: 'blake@harms.haus',
                to: 'recipient@example.com',
                subject: 'Hello',
                date: new Date(),
                size: 1000,
                flags: [],
                preview: 'Hello',
                body: 'Test message',
                attachments: [],
            };
            const result = scanner.analyzeMessage(message);
            (0, vitest_1.expect)(result.level).toBe('safe');
            (0, vitest_1.expect)(result.senderReputation).toBe('known');
        });
        (0, vitest_1.it)('should detect critical threats in attachments', () => {
            const message = {
                id: 'msg-2',
                from: 'unknown@example.com',
                to: 'recipient@example.com',
                subject: 'Update',
                date: new Date(),
                size: 1000,
                flags: [],
                preview: 'Update',
                body: 'Please install this file',
                attachments: [{
                        id: 'att-1',
                        filename: 'update.exe',
                        contentType: 'application/x-msdownload',
                        size: 1024,
                    }],
            };
            const result = scanner.analyzeMessage(message);
            (0, vitest_1.expect)(result.level).toBe('suspicious');
            (0, vitest_1.expect)(result.attachmentThreats).toContain('.exe');
            (0, vitest_1.expect)(result.reasons).toContain('High risk: Executable attachment detected');
        });
        (0, vitest_1.it)('should detect phishing keywords', () => {
            const message = {
                id: 'msg-3',
                from: 'phisher@example.com',
                to: 'recipient@example.com',
                subject: 'URGENT: Verify your account',
                date: new Date(),
                size: 1000,
                flags: [],
                preview: 'URGENT: Verify your account',
                body: 'Please verify your account immediately',
                attachments: [],
            };
            const result = scanner.analyzeMessage(message);
            (0, vitest_1.expect)(result.level).toBe('dangerous');
            (0, vitest_1.expect)(result.reasons).toContain('Critical: Credential theft attempt detected');
        });
        (0, vitest_1.it)('should detect suspicious PDF attachments', () => {
            const message = {
                id: 'msg-4',
                from: 'unknown@example.com',
                to: 'recipient@example.com',
                subject: 'Invoice',
                date: new Date(),
                size: 1000,
                flags: [],
                preview: 'Invoice',
                body: 'Please review',
                attachments: [{
                        id: 'att-2',
                        filename: 'invoice.pdf',
                        contentType: 'application/pdf',
                        size: 2048,
                    }],
            };
            const result = scanner.analyzeMessage(message);
            (0, vitest_1.expect)(result.level).toBe('suspicious');
            (0, vitest_1.expect)(result.attachmentThreats).toContain('.pdf');
        });
        (0, vitest_1.it)('should detect suspicious link patterns', () => {
            const message = {
                id: 'msg-5',
                from: 'unknown@example.com',
                to: 'recipient@example.com',
                subject: 'Click here',
                date: new Date(),
                size: 1000,
                flags: [],
                preview: 'Click here',
                body: 'Visit http://bit.ly/abc123 for more info',
                attachments: [],
            };
            const result = scanner.analyzeMessage(message);
            (0, vitest_1.expect)(result.level).toBe('suspicious');
        });
        (0, vitest_1.it)('should calculate phishing score correctly', () => {
            const message = {
                id: 'msg-6',
                from: 'unknown@example.com',
                to: 'recipient@example.com',
                subject: 'URGENT: Password required',
                date: new Date(),
                size: 1000,
                flags: [],
                preview: 'URGENT: Password required',
                body: 'Password needed immediately',
                attachments: [],
            };
            const result = scanner.analyzeMessage(message);
            (0, vitest_1.expect)(result.level).toBe('dangerous');
            (0, vitest_1.expect)(result.phishingScore).toBeGreaterThan(5);
        });
        (0, vitest_1.it)('should mark safe messages with no threats', () => {
            const message = {
                id: 'msg-7',
                from: 'blake@harms.haus',
                to: 'recipient@example.com',
                subject: 'Meeting tomorrow',
                date: new Date(),
                size: 1000,
                flags: [],
                preview: 'Meeting tomorrow',
                body: 'See you at 10am',
                attachments: [],
            };
            const result = scanner.analyzeMessage(message);
            (0, vitest_1.expect)(result.level).toBe('safe');
            (0, vitest_1.expect)(result.phishingScore).toBe(0);
        });
        (0, vitest_1.it)('should handle unknown sender correctly', () => {
            const message = {
                id: 'msg-8',
                from: 'random.user@example.com',
                to: 'recipient@example.com',
                subject: 'Test',
                date: new Date(),
                size: 1000,
                flags: [],
                preview: 'Test',
                body: 'Test message',
                attachments: [],
            };
            const result = scanner.analyzeMessage(message);
            (0, vitest_1.expect)(result.senderReputation).toBe('unknown');
        });
        (0, vitest_1.it)('should not flag protonmail as suspicious', () => {
            const message = {
                id: 'msg-10',
                from: 'user@protonmail.com',
                to: 'recipient@example.com',
                subject: 'Test',
                date: new Date(),
                size: 1000,
                flags: [],
                preview: 'Test',
                body: 'Test message',
                attachments: [],
            };
            const result = scanner.analyzeMessage(message);
            (0, vitest_1.expect)(result.senderReputation).toBe('unknown');
        });
        (0, vitest_1.it)('should detect JavaScript file attachments', () => {
            const message = {
                id: 'msg-11',
                from: 'unknown@example.com',
                to: 'recipient@example.com',
                subject: 'Test',
                date: new Date(),
                size: 1000,
                flags: [],
                preview: 'Test',
                body: 'Test message',
                attachments: [{
                        id: 'att-3',
                        filename: 'script.js',
                        contentType: 'application/javascript',
                        size: 500,
                    }],
            };
            const result = scanner.analyzeMessage(message);
            (0, vitest_1.expect)(result.level).toBe('suspicious');
        });
        (0, vitest_1.it)('should detect suspicious TLDs in links', () => {
            const message = {
                id: 'msg-12',
                from: 'unknown@example.com',
                to: 'recipient@example.com',
                subject: 'Click here',
                date: new Date(),
                size: 1000,
                flags: [],
                preview: 'Click here',
                body: 'Visit http://example.xyz for more info',
                attachments: [],
            };
            const result = scanner.analyzeMessage(message);
            (0, vitest_1.expect)(result.level).toBe('suspicious');
        });
        (0, vitest_1.it)('should detect multiple threat levels', () => {
            const message = {
                id: 'msg-14',
                from: 'unknown@example.com',
                to: 'recipient@example.com',
                subject: 'URGENT: Password required NOW!',
                date: new Date(),
                size: 1000,
                flags: [],
                preview: 'URGENT: Password required NOW!',
                body: 'Click here http://bit.ly/abc123 and verify your password immediately',
                attachments: [{
                        id: 'att-4',
                        filename: 'urgent.pdf',
                        contentType: 'application/pdf',
                        size: 1000,
                    }],
            };
            const result = scanner.analyzeMessage(message);
            (0, vitest_1.expect)(result.level).toBe('dangerous');
            (0, vitest_1.expect)(result.phishingScore).toBeGreaterThan(8);
        });
    });
    (0, vitest_1.describe)('getScannedMessages', () => {
        (0, vitest_1.it)('should analyze all messages in array', () => {
            const messages = [
                {
                    id: 'msg-15',
                    from: 'blake@harms.haus',
                    to: 'recipient@example.com',
                    subject: 'Test',
                    date: new Date(),
                    size: 1000,
                    flags: [],
                    preview: 'Test',
                    body: 'Test',
                    attachments: [],
                },
                {
                    id: 'msg-16',
                    from: 'unknown@example.com',
                    to: 'recipient@example.com',
                    subject: 'Test',
                    date: new Date(),
                    size: 1000,
                    flags: [],
                    preview: 'Test',
                    body: 'Test',
                    attachments: [],
                },
            ];
            const result = scanner.getScannedMessages(messages);
            (0, vitest_1.expect)(result).toHaveLength(2);
        });
        (0, vitest_1.it)('should preserve original message data', () => {
            const messages = [
                {
                    id: 'msg-17',
                    from: 'blake@harms.haus',
                    to: 'recipient@example.com',
                    subject: 'Test',
                    date: new Date(),
                    size: 1000,
                    flags: [],
                    preview: 'Test',
                    body: 'Test',
                    attachments: [],
                },
            ];
            const result = scanner.getScannedMessages(messages);
            (0, vitest_1.expect)(result[0].from).toBe('blake@harms.haus');
            (0, vitest_1.expect)(result[0].subject).toBe('Test');
        });
    });
    (0, vitest_1.describe)('getThreatLevelMessageCount', () => {
        (0, vitest_1.it)('should count safe messages', () => {
            const messages = [
                {
                    id: 'msg-18',
                    from: 'blake@harms.haus',
                    to: 'recipient@example.com',
                    subject: 'Test',
                    date: new Date(),
                    size: 1000,
                    flags: [],
                    preview: 'Test',
                    body: 'Test',
                    attachments: [],
                },
                {
                    id: 'msg-19',
                    from: 'erin@harms.haus',
                    to: 'recipient@example.com',
                    subject: 'Test',
                    date: new Date(),
                    size: 1000,
                    flags: [],
                    preview: 'Test',
                    body: 'Test',
                    attachments: [],
                },
            ];
            const count = scanner.getThreatLevelMessageCount(messages, 'safe');
            (0, vitest_1.expect)(count).toBe(2);
        });
        (0, vitest_1.it)('should return 0 for unknown level', () => {
            const messages = [];
            const count = scanner.getThreatLevelMessageCount(messages, 'safe');
            (0, vitest_1.expect)(count).toBe(0);
        });
    });
});
//# sourceMappingURL=security-scanner.test.js.map