export interface ImapConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    useStarttls: boolean;
}
export interface IImapConnection {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    select(folder: string): Promise<void>;
    list(): Promise<any[]>;
    listMessages(criteria: any[], options: any): Promise<any[]>;
    fetchMessage(id: string, options: any): Promise<any>;
    move(selector: any, destination: string): Promise<void>;
    copy(selector: any, destination: string): Promise<void>;
    status(folder: string, options: any): Promise<any>;
}
export declare class ImapClient {
    private config;
    private client;
    private connected;
    constructor(config: ImapConfig, imapConnection?: IImapConnection);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    selectFolder(folder: string): Promise<void>;
    listFolders(): Promise<string[]>;
    getMessages(opts?: {
        count?: number;
        offset?: number;
        searchPhrase?: string;
        filter?: "unread" | "read" | "both";
    }): Promise<any[]>;
    getMessage(id: string): Promise<any>;
    moveMessage(id: string, destination: string): Promise<void>;
    copyMessage(id: string, destination: string): Promise<void>;
    searchMessages(criteria: Record<string, any>[]): Promise<any[]>;
    getFolderStats(folder: string): Promise<any>;
}
//# sourceMappingURL=imap-client.d.ts.map