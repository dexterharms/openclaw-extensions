import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityScanner } from './security-scanner';
import type { Message } from './types';

let mockConfig: any = {
  knownSafeSenders: ['blake@harms.haus', 'erin@harms.haus'],
  criticalThreats: ['.exe', '.scr', '.bat', '.js', '.vbs'],
  phishingKeywords: ['urgent', 'immediate action', 'verify account'],
  credentialRequestPhrases: ['password', 'verify your account'],
  attachmentBlacklist: ['.pdf', '.doc', '.docx'],
  linkThreatPatterns: ['bit.ly', 't.co'],
};

describe('SecurityScanner', () => {
  let scanner: SecurityScanner;

  beforeEach(() => {
    scanner = new SecurityScanner(mockConfig);
  });

  describe('analyzeMessage', () => {
    it('should mark safe messages from known senders', () => {
      const message: Message = {
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
      expect(result.level).toBe('safe');
      expect(result.senderReputation).toBe('known');
    });

    it('should detect critical threats in attachments', () => {
      const message: Message = {
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
      expect(result.level).toBe('suspicious');
      expect(result.attachmentThreats).toContain('.exe');
      expect(result.reasons).toContain('High risk: Executable attachment detected');
    });

    it('should detect phishing keywords', () => {
      const message: Message = {
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
      expect(result.level).toBe('dangerous');
      expect(result.reasons).toContain('Critical: Credential theft attempt detected');
    });

    it('should detect suspicious PDF attachments', () => {
      const message: Message = {
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
      expect(result.level).toBe('suspicious');
      expect(result.attachmentThreats).toContain('.pdf');
    });

    it('should detect suspicious link patterns', () => {
      const message: Message = {
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
      expect(result.level).toBe('suspicious');
    });

    it('should calculate phishing score correctly', () => {
      const message: Message = {
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
      expect(result.level).toBe('dangerous');
      expect(result.phishingScore).toBeGreaterThan(5);
    });

    it('should mark safe messages with no threats', () => {
      const message: Message = {
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
      expect(result.level).toBe('safe');
      expect(result.phishingScore).toBe(0);
    });

    it('should handle unknown sender correctly', () => {
      const message: Message = {
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
      expect(result.senderReputation).toBe('unknown');
    });

    it('should not flag protonmail as suspicious', () => {
      const message: Message = {
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
      expect(result.senderReputation).toBe('unknown');
    });

    it('should detect JavaScript file attachments', () => {
      const message: Message = {
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
      expect(result.level).toBe('suspicious');
    });

    it('should detect suspicious TLDs in links', () => {
      const message: Message = {
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
      expect(result.level).toBe('suspicious');
    });

    it('should detect multiple threat levels', () => {
      const message: Message = {
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
      expect(result.level).toBe('dangerous');
      expect(result.phishingScore).toBeGreaterThan(8);
    });
  });

  describe('getScannedMessages', () => {
    it('should analyze all messages in array', () => {
      const messages: Message[] = [
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
      expect(result).toHaveLength(2);
    });

    it('should preserve original message data', () => {
      const messages: Message[] = [
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
      expect(result[0].from).toBe('blake@harms.haus');
      expect(result[0].subject).toBe('Test');
    });
  });

  describe('getThreatLevelMessageCount', () => {
    it('should count safe messages', () => {
      const messages: Message[] = [
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
      expect(count).toBe(2);
    });

    it('should return 0 for unknown level', () => {
      const messages: Message[] = [];
      const count = scanner.getThreatLevelMessageCount(messages, 'safe');
      expect(count).toBe(0);
    });
  });
});
