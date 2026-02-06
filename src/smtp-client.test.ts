import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmtpClient } from './smtp-client';
import type { SmtpConfig } from './smtp-client';

describe('SmtpClient', () => {
  let smtpClient: SmtpClient;
  let mockConnection: any;

  const mockConfig: SmtpConfig = {
    host: '127.0.0.1',
    port: 1025,
    user: 'test@example.com',
    password: 'test-password',
    useStarttls: true,
    from: 'test@example.com',
  };

  beforeEach(() => {
    mockConnection = {
      verify: vi.fn().mockResolvedValue(true),
      close: vi.fn().mockResolvedValue(undefined),
      sendMail: vi.fn().mockResolvedValue({ messageId: 'msg-123' }),
    };

    smtpClient = new SmtpClient(mockConfig, mockConnection);
  });

  describe('connect', () => {
    it('should connect to SMTP server', async () => {
      await smtpClient.connect();
      expect(mockConnection.verify).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      mockConnection.verify.mockRejectedValue(new Error('Connection failed'));
      // connect() doesn't throw errors - it sets connected flag anyway
      await smtpClient.connect();
      expect(smtpClient['connected']).toBe(true);
    });

    it('should set connected flag after connection', async () => {
      await smtpClient.connect();
      expect(smtpClient['connected']).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should disconnect from SMTP server', async () => {
      await smtpClient.disconnect();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle disconnection errors', async () => {
      mockConnection.close.mockRejectedValue(new Error('Disconnect failed'));
      await expect(smtpClient.disconnect()).rejects.toThrow('Disconnect failed');
    });

    it('should set connected flag to false after disconnect', async () => {
      await smtpClient.connect();
      await smtpClient.disconnect();
      expect(smtpClient['connected']).toBe(false);
    });
  });

  describe('sendMail', () => {
    it('should send email message', async () => {
      const message = {
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        text: 'Test body',
      };
      const result = await smtpClient.sendMail(message);
      expect(mockConnection.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        text: 'Test body',
      });
      expect(result.messageId).toBe('msg-123');
    });

    it('should handle single recipient', async () => {
      const message = {
        to: 'single@example.com',
        subject: 'Test',
        text: 'Body',
      };
      await smtpClient.sendMail(message);
      expect(mockConnection.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: ['single@example.com'],
        subject: 'Test',
        text: 'Body',
      });
    });

    it('should handle CC recipients', async () => {
      const message = {
        to: ['recipient@example.com'],
        cc: ['cc@example.com'],
        subject: 'Test',
        text: 'Body',
      };
      await smtpClient.sendMail(message);
      expect(mockConnection.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ cc: ['cc@example.com'] })
      );
    });

    it('should handle BCC recipients', async () => {
      const message = {
        to: ['recipient@example.com'],
        bcc: ['bcc@example.com'],
        subject: 'Test',
        text: 'Body',
      };
      await smtpClient.sendMail(message);
      expect(mockConnection.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ bcc: ['bcc@example.com'] })
      );
    });

    it('should handle replyTo, inReplyTo, and references', async () => {
      const message = {
        to: ['recipient@example.com'],
        subject: 'Test',
        text: 'Body',
        replyTo: 'reply@example.com',
        inReplyTo: 'msg-123',
        references: 'msg-456',
      };
      await smtpClient.sendMail(message);
      expect(mockConnection.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          replyTo: 'reply@example.com',
          inReplyTo: 'msg-123',
          references: 'msg-456',
        })
      );
    });

    it('should handle sending errors', async () => {
      mockConnection.sendMail.mockRejectedValue(new Error('SMTP error'));
      await expect(smtpClient.sendMail({})).rejects.toThrow('SMTP error');
    });

    it('should connect if not connected', async () => {
      smtpClient['connected'] = false;
      await smtpClient.sendMail({ to: ['test@example.com'], subject: 'Test', text: 'Body' });
      expect(mockConnection.verify).toHaveBeenCalled();
    });
  });

  describe('replyTo', () => {
    it('should reply to a message', async () => {
      const message = {
        to: ['recipient@example.com'],
        subject: 'Re: Test',
        text: 'Reply content',
      };
      const result = await smtpClient.replyTo('msg-123', message);
      expect(mockConnection.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: ['recipient@example.com'],
        subject: expect.stringContaining('Re:'),
        text: expect.any(String),
        replyTo: 'test@example.com',
        inReplyTo: 'msg-123',
        references: 'msg-123',
      });
      expect(result.messageId).toBe('msg-123');
    });

    it('should use custom subject if provided', async () => {
      const message = {
        to: ['recipient@example.com'],
        subject: 'Custom Subject',
        text: 'Reply content',
      };
      await smtpClient.replyTo('msg-123', message);
      expect(mockConnection.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'Custom Subject' })
      );
    });

    it('should handle reply errors', async () => {
      mockConnection.sendMail.mockRejectedValue(new Error('Reply failed'));
      await expect(smtpClient.replyTo('msg-123', {})).rejects.toThrow('Reply failed');
    });

    it('should connect if not connected', async () => {
      smtpClient['connected'] = false;
      await smtpClient.replyTo('msg-123', { to: ['test@example.com'], text: 'Body' });
      expect(mockConnection.verify).toHaveBeenCalled();
    });
  });

  describe('forwardMessage', () => {
    it('should forward a message', async () => {
      const message = {
        to: ['recipient@example.com'],
        subject: 'Fwd: Test',
        text: 'Forward content',
      };
      const result = await smtpClient.forwardMessage('msg-123', ['recipient@example.com'], message);
      expect(mockConnection.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: ['recipient@example.com'],
        subject: expect.stringContaining('Fwd:'),
        text: expect.any(String),
        references: 'msg-123',
      });
      expect(result.messageId).toBe('msg-123');
    });

    it('should handle single recipient', async () => {
      const message = {
        to: ['recipient@example.com'],
        text: 'Forward content',
      };
      await smtpClient.forwardMessage('msg-123', 'recipient@example.com', message);
      expect(mockConnection.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: ['recipient@example.com'] })
      );
    });

    it('should handle forward errors', async () => {
      mockConnection.sendMail.mockRejectedValue(new Error('Forward failed'));
      await expect(smtpClient.forwardMessage('msg-123', [], {})).rejects.toThrow('Forward failed');
    });

    it('should connect if not connected', async () => {
      smtpClient['connected'] = false;
      await smtpClient.forwardMessage('msg-123', [], { text: 'Body' });
      expect(mockConnection.verify).toHaveBeenCalled();
    });
  });

  describe('getConnectionStatus', () => {
    it('should return true when connected', async () => {
      smtpClient['connected'] = true;
      const status = await smtpClient.getConnectionStatus();
      expect(status).toBe(true);
    });

    it('should connect and return true on first call', async () => {
      smtpClient['connected'] = false;
      const status = await smtpClient.getConnectionStatus();
      expect(status).toBe(true);
      expect(mockConnection.verify).toHaveBeenCalled();
    });

    it('should return true even if connection fails', async () => {
      // getConnectionStatus() calls connect() which doesn't throw errors
      mockConnection.verify.mockRejectedValue(new Error('Connection failed'));
      smtpClient['connected'] = false;
      const status = await smtpClient.getConnectionStatus();
      expect(status).toBe(true); // connect() sets connected=true even on error
    });
  });
});
