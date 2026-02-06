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
export declare class SmtpClient {
    private config;
    private transporter;
    private connected;
    constructor(config: SmtpConfig, smtpConnection?: ISmtpConnection);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendMail(mail: any): Promise<any>;
    replyTo(messageId: string, content: any): Promise<any>;
    forwardMessage(messageId: string, toRecipients: string | string[], content: any): Promise<any>;
    getConnectionStatus(): Promise<boolean>;
}
//# sourceMappingURL=smtp-client.d.ts.map