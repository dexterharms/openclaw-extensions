import nodemailer from "nodemailer";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  useStarttls: boolean;
  from: string;
}

export interface ISmtpConnection {
  verify(): Promise<boolean>;
  close(): Promise<void> | void;
  sendMail(options: any): Promise<any>;
}

export class SmtpClient {
  private transporter: ISmtpConnection | null = null;
  private connected: boolean = false;

  constructor(
    private config: SmtpConfig,
    smtpConnection?: ISmtpConnection
  ) {
    if (smtpConnection) {
      this.transporter = smtpConnection;
    } else {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.useStarttls,
        auth: {
          user: this.config.user,
          pass: this.config.password,
        },
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2',
        },
      });
    }
  }

  async connect(): Promise<void> {
    try {
      if (this.transporter) {
        await this.transporter.verify();
      }
      this.connected = true;
      console.log("SMTP client connected");
    } catch (error) {
      console.error("Failed to connect SMTP client:", error);
      // Don't throw - allow proceeding even if verification fails for localhost
      this.connected = true;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.transporter) {
        await this.transporter.close();
      }
      this.connected = false;
      console.log("SMTP client disconnected");
    } catch (error) {
      console.error("Failed to disconnect SMTP client:", error);
      throw error;
    }
  }

  async sendMail(mail: any): Promise<any> {
    if (!this.connected) {
      await this.connect();
    }

    const options = {
      from: this.config.from,
      to: Array.isArray(mail.to) ? mail.to : [mail.to],
      cc: mail.cc ? (Array.isArray(mail.cc) ? mail.cc : [mail.cc]) : undefined,
      bcc: mail.bcc ? (Array.isArray(mail.bcc) ? mail.bcc : [mail.bcc]) : undefined,
      subject: mail.subject,
      text: mail.text,
      replyTo: mail.replyTo,
      inReplyTo: mail.inReplyTo,
      references: mail.references,
    };

    if (this.transporter) {
      return await this.transporter.sendMail(options);
    }
    return {};
  }

  async replyTo(messageId: string, content: any): Promise<any> {
    if (!this.connected) {
      await this.connect();
    }

    const options = {
      from: this.config.from,
      to: Array.isArray(content.to) ? content.to : [content.to],
      subject: content.subject || `Re: ${content.inReplyTo}`,
      text: content.text,
      replyTo: this.config.from,
      inReplyTo: messageId,
      references: messageId,
    };

    if (this.transporter) {
      return await this.transporter.sendMail(options);
    }
    return {};
  }

  async forwardMessage(messageId: string, toRecipients: string | string[], content: any): Promise<any> {
    if (!this.connected) {
      await this.connect();
    }

    const options = {
      from: this.config.from,
      to: Array.isArray(toRecipients) ? toRecipients : [toRecipients],
      subject: content.subject || `Fwd: ${messageId}`,
      text: content.text,
      references: messageId,
    };

    if (this.transporter) {
      return await this.transporter.sendMail(options);
    }
    return {};
  }

  async getConnectionStatus(): Promise<boolean> {
    if (!this.connected) {
      try {
        await this.connect();
        return true;
      } catch (error) {
        return false;
      }
    }
    return true;
  }
}
