import { ImapClient } from "./imap-client";
import { PluginConfig } from "./types";

export class BackgroundService {
  private imapClient: ImapClient;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private lastCheckTime: Date | null = null;

  constructor(
    private api: any,
    private config: PluginConfig
  ) {
    this.imapClient = new ImapClient(this.config.imap);
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.api.logger.warn("Background service already running");
      return;
    }

    this.api.logger.info("Starting mail-access background service");

    try {
      await this.imapClient.connect();
      await this.scanNewMessages();
      this.isRunning = true;

      const pollInterval = this.config.listener?.pollInterval || 60000;
      this.api.logger.info(`Starting poll interval: ${pollInterval}ms`);

      this.intervalId = setInterval(async () => {
        try {
          await this.scanNewMessages();
        } catch (error) {
          this.api.logger.error("Error during background scan:", error);
        }
      }, pollInterval);

    } catch (error) {
      this.api.logger.error("Failed to start background service:", error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.api.logger.info("Stopping mail-access background service");

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;

    try {
      await this.imapClient.disconnect();
    } catch (error) {
      this.api.logger.error("Error during disconnect:", error);
    }
  }

  private async scanNewMessages(): Promise<void> {
    const inboxFolder = this.config.folders?.inbox || "INBOX";

    await this.imapClient.selectFolder(inboxFolder);

    const newMessages = await this.imapClient.getMessages({
      count: 50,
      filter: "unread",
    });

    this.api.logger.info(`Found ${newMessages.length} new messages`);

    if (newMessages.length > 0) {
      this.api.logger.info("Triggering security agent to scan new messages");
      await this.triggerSecurityAgent(newMessages.length);
    }

    this.lastCheckTime = new Date();
    this.api.logger.info("Background scan completed");
  }

  private async triggerSecurityAgent(messageCount: number): Promise<void> {
    try {
      if (typeof (this.api as any).sessions_send === "function") {
        this.api.logger.info("Using sessions_send to trigger security agent");
        await (this.api as any).sessions_send({
          agent: "security-agent",
          message: `New email detected: ${messageCount} message(s). Scan INBOX for threats using mail_security_scan_mail.`
        });
        return;
      }

      if (typeof (this.api as any).rpc === "function") {
        this.api.logger.info("Using Gateway RPC to trigger security agent");
        await (this.api as any).rpc({
          method: "sessions_send",
          params: {
            agent: "security-agent",
            message: `New email detected: ${messageCount} message(s). Scan INBOX for threats.`
          }
        });
        return;
      }

      this.api.logger.warn("No sessions_send or RPC method available. New messages detected but not triggering security agent automatically.");
    } catch (error) {
      this.api.logger.error("Failed to trigger security agent:", error);
    }
  }

  async getRecentMessages(hours: number = 24): Promise<any[]> {
    if (!this.isRunning) {
      await this.start();
    }

    const folder = this.config.folders?.inbox || "INBOX";
    await this.imapClient.selectFolder(folder);

    const messages = await this.imapClient.getMessages({
      count: 100,
    });

    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return messages.filter(msg => new Date(msg.date) > cutoffTime);
  }

  async getScannedMessages(): Promise<any[]> {
    const messages = await this.getRecentMessages(24);
    return messages;
  }

  async getStatus(): Promise<{
    running: boolean;
    lastCheck: Date | null;
    unreadMessages: number;
    totalMessages: number;
    quarantineMessages: number;
  }> {
    if (!this.isRunning) {
      await this.start();
    }

    const inboxFolder = this.config.folders?.inbox || "INBOX";
    const quarantineFolder = this.config.folders?.quarantine || "quarantine";

    await this.imapClient.selectFolder(inboxFolder);
    const inboxStats = await this.imapClient.getFolderStats(inboxFolder);

    await this.imapClient.selectFolder(quarantineFolder);
    const quarantineStats = await this.imapClient.getFolderStats(quarantineFolder);

    return {
      running: this.isRunning,
      lastCheck: this.lastCheckTime,
      unreadMessages: inboxStats.unread,
      totalMessages: inboxStats.total,
      quarantineMessages: quarantineStats.total,
    };
  }
}

export function registerBackgroundService(api: any, config: PluginConfig) {
  const service = new BackgroundService(api, config);

  api.registerService({
    id: "mail-access-listener",
    name: "Mail Access IMAP Listener",
    description: "Polls IMAP for new messages and triggers security agent",
    start: async () => {
      api.logger.info("Starting mail-access background service");
      await service.start();
    },
    stop: async () => {
      api.logger.info("Stopping mail-access background service");
      await service.stop();
    },
  });

  return service;
}
