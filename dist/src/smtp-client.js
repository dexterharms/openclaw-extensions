"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmtpClient = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
class SmtpClient {
    config;
    transporter = null;
    connected = false;
    constructor(config, smtpConnection) {
        this.config = config;
        if (smtpConnection) {
            this.transporter = smtpConnection;
        }
        else {
            this.transporter = nodemailer_1.default.createTransport({
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
    async connect() {
        try {
            if (this.transporter) {
                await this.transporter.verify();
            }
            this.connected = true;
            console.log("SMTP client connected");
        }
        catch (error) {
            console.error("Failed to connect SMTP client:", error);
            // Don't throw - allow proceeding even if verification fails for localhost
            this.connected = true;
        }
    }
    async disconnect() {
        try {
            if (this.transporter) {
                await this.transporter.close();
            }
            this.connected = false;
            console.log("SMTP client disconnected");
        }
        catch (error) {
            console.error("Failed to disconnect SMTP client:", error);
            throw error;
        }
    }
    async sendMail(mail) {
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
    async replyTo(messageId, content) {
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
    async forwardMessage(messageId, toRecipients, content) {
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
    async getConnectionStatus() {
        if (!this.connected) {
            try {
                await this.connect();
                return true;
            }
            catch (error) {
                return false;
            }
        }
        return true;
    }
}
exports.SmtpClient = SmtpClient;
//# sourceMappingURL=smtp-client.js.map