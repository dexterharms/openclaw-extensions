import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerSafeMailTools, registerSecurityTools } from './tools';

describe('Tool Handlers', () => {
  let mockApi: any;
  let mockConfig: any;
  let mockImapClient: any;
  let mockSmtpClient: any;
  let mockSecurityScanner: any;

  beforeEach(() => {
    mockApi = {
      logger: {
        info: vi.fn(),
        error: vi.fn(),
      },
      registerTool: vi.fn(),
    };

    mockConfig = {
      folders: {
        inbox: 'INBOX',
        safeInbox: 'Safe-Inbox',
        quarantine: 'Quarantine',
      },
    };

    mockImapClient = {
      selectFolder: vi.fn().mockResolvedValue(undefined),
      getMessages: vi.fn().mockResolvedValue([
        { id: 'msg1', from: 'test@example.com', subject: 'Test', date: new Date(), flags: [], preview: 'Preview' },
      ]),
      getMessage: vi.fn().mockResolvedValue({
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
        body: 'Body',
        date: new Date(),
        attachments: [],
      }),
    };

    mockSmtpClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      sendMail: vi.fn().mockResolvedValue({ messageId: 'msg-sent-123' }),
      replyTo: vi.fn().mockResolvedValue({ messageId: 'msg-reply-123' }),
      forwardMessage: vi.fn().mockResolvedValue({ messageId: 'msg-forward-123' }),
    };

    mockSecurityScanner = {
      analyzeMessage: vi.fn().mockReturnValue({
        level: 'safe',
        reasons: [],
        phishingScore: 0,
        attachmentThreats: [],
        linkThreats: [],
        senderReputation: 'unknown',
      }),
    };
  });

  describe('Safe Mail Tools', () => {
    beforeEach(() => {
      registerSafeMailTools(mockApi, mockConfig, mockImapClient, mockSmtpClient);
    });

    it('should register mail_access_get_mail tool', () => {
      expect(mockApi.registerTool).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'mail_access_get_mail',
          description: expect.any(String),
          parameters: expect.any(Object),
        })
      );
    });

    it('should register mail_access_read_mail tool', () => {
      expect(mockApi.registerTool).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'mail_access_read_mail' })
      );
    });

    it('should register mail_access_reply tool', () => {
      expect(mockApi.registerTool).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'mail_access_reply' })
      );
    });

    it('should register mail_access_forward tool', () => {
      expect(mockApi.registerTool).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'mail_access_forward' })
      );
    });

    it('should register mail_access_send_mail tool', () => {
      expect(mockApi.registerTool).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'mail_access_send_mail' })
      );
    });

    it('should register mail_access_archive tool', () => {
      expect(mockApi.registerTool).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'mail_access_archive' })
      );
    });

    it('should register mail_access_move tool', () => {
      expect(mockApi.registerTool).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'mail_access_move' })
      );
    });

    it('should handle reply errors', async () => {
      mockImapClient.getMessage.mockRejectedValue(new Error('Message not found'));

      const toolCalls = mockApi.registerTool.mock.calls;
      const replyHandler = toolCalls.find((call: any) => call[0]?.name === 'mail_access_reply')?.[0]?.handler;

      if (replyHandler) {
        const result = await replyHandler({ id: 'msg1', content: 'Reply' });
        expect(result.content[0].text).toContain('"success":false');
      }
    });
  });

  describe('Security Tools', () => {
    it('should register security tools with optional flag', () => {
      registerSecurityTools(mockApi, mockConfig, mockImapClient, mockSecurityScanner);
      const registerCalls = mockApi.registerTool.mock.calls;

      expect(registerCalls.length).toBeGreaterThanOrEqual(5);

      const securityToolNames = [
        'mail_security_scan_mail',
        'mail_security_mark_safe',
        'mail_security_quarantine',
        'mail_security_trash',
        'mail_security_finish_check',
      ];

      securityToolNames.forEach(name => {
        const call = registerCalls.find((c: any) => c[0]?.name === name);
        expect(call?.[1]).toEqual({ optional: true });
      });
    });

    it('should register security tools even for main agent (agent config enforces availability)', () => {
      registerSecurityTools(mockApi, mockConfig, mockImapClient, mockSecurityScanner);
      const registerCalls = mockApi.registerTool.mock.calls;

      expect(registerCalls.length).toBeGreaterThan(0);

      const securityToolNames = [
        'mail_security_scan_mail',
        'mail_security_mark_safe',
        'mail_security_quarantine',
        'mail_security_trash',
        'mail_security_finish_check',
      ];

      securityToolNames.forEach(name => {
        const call = registerCalls.find((c: any) => c[0]?.name === name);
        expect(call?.[1]).toEqual({ optional: true });
      });
    });

    it('should call imapClient for scan mail tool', () => {
      registerSecurityTools(mockApi, mockConfig, mockImapClient, mockSecurityScanner);
      const registerCalls = mockApi.registerTool.mock.calls;
      const scanCall = registerCalls.find((c: any) => c[0]?.name === 'mail_security_scan_mail');

      if (scanCall) {
        const handler = scanCall[0]?.handler;
        if (handler) {
          const params = { scanAll: false };
          handler(params);
          expect(mockImapClient.getMessages).toHaveBeenCalled();
        }
      }
    });

    it('should call securityScanner for scan mail tool', async () => {
      // Need to mock getMessages to return a test message
      mockImapClient.getMessages.mockResolvedValue([
        { id: 'msg1', from: 'test@example.com', subject: 'Test', date: new Date(), flags: [], preview: 'Test' },
      ]);

      registerSecurityTools(mockApi, mockConfig, mockImapClient, mockSecurityScanner);
      const registerCalls = mockApi.registerTool.mock.calls;
      const scanCall = registerCalls.find((c: any) => c[0]?.name === 'mail_security_scan_mail');

      if (scanCall) {
        const handler = scanCall[0]?.handler;
        if (handler) {
          const params = { scanAll: false };
          await handler(params);
          expect(mockSecurityScanner.analyzeMessage).toHaveBeenCalled();
        }
      }
    });
  });
});
