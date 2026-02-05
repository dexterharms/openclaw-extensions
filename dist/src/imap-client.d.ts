import { Message, FolderStats } from "./types";
export declare class ImapClient {
    private config;
    private client;
    private connected;
    constructor(config: any);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    selectFolder(folder: any): Promise<void>;
    listFolders(): Promise<string[]>;
    getMessages(opts?: {
        count?: number;
        offset?: number;
        searchPhrase?: string;
        filter?: "unread" | "read" | "both";
    }): Promise<any[]>;
    getMessage(id: string): Promise<Message>;
    moveMessage(id: string, destination: string): Promise<void>;
    copyMessage(id: string, destination: string): Promise<void>;
    searchMessages(criteria: Record<string, any>[]): Promise<Message[]>;
    getFolderStats(folder: string): Promise<FolderStats>;
}
//# sourceMappingURL=imap-client.d.ts.map