export declare class SmtpClient {
    private config;
    private transporter;
    private connected;
    constructor(config: any);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendMail(mail: any): Promise<any>;
    replyTo(messageId: string, content: any): Promise<any>;
    forwardMessage(messageId: string, toRecipients: string | string[], content: any): Promise<any>;
    getConnectionStatus(): Promise<boolean>;
}
//# sourceMappingURL=smtp-client.d.ts.map