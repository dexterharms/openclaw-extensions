import { PluginConfig } from "./types";
export declare class BackgroundService {
    private config;
    private imapClient;
    private securityScanner;
    private intervalId;
    private isRunning;
    private lastCheckTime;
    constructor(config: PluginConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    private scanNewMessages;
    getRecentMessages(hours?: number): Promise<any[]>;
    getScannedMessages(): Promise<any[]>;
    getStatus(): Promise<{
        running: boolean;
        lastCheck: Date | null;
        unreadMessages: number;
        totalMessages: number;
        quarantineMessages: number;
    }>;
}
//# sourceMappingURL=background-service.d.ts.map