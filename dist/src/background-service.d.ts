import { PluginConfig } from "./types";
export declare class BackgroundService {
    private api;
    private config;
    private imapClient;
    private intervalId;
    private isRunning;
    private lastCheckTime;
    constructor(api: any, config: PluginConfig, imapConnection?: any);
    start(): Promise<void>;
    stop(): Promise<void>;
    private scanNewMessages;
    private triggerSecurityAgent;
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
export declare function registerBackgroundService(api: any, config: PluginConfig): BackgroundService;
//# sourceMappingURL=background-service.d.ts.map