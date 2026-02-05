import nodemailer from "nodemailer";

export class SmtpClient {
  private transporter: nodemailer.Transporter | null = null;
  private connected: boolean = false;

  constructor(private config: any) {
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
      },
    });
  }

  async connect(): Promise<void> {
    try {
      await this.transporter!.verify();
      this.connected = true;
      console.log("SMTP client connected");
    } catch (error) {
      console.error("Failed to connect SMTP client:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.transporter!.close();
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

    return await this.transporter!.sendMail(options);
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

    return await this.transporter!.sendMail(options);
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

    return await this.transporter!.sendMail(options);
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
