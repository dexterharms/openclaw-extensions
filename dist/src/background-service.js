"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackgroundService = void 0;
const imap_client_1 = require("./imap-client");
const security_scanner_1 = require("./security-scanner");
class BackgroundService {
    config;
    imapClient;
    securityScanner;
    intervalId = null;
    isRunning = false;
    lastCheckTime = null;
    constructor(config) {
        this.config = config;
        this.imapClient = new imap_client_1.ImapClient(this.config.imap);
        this.securityScanner = new security_scanner_1.SecurityScanner(this.config.security);
    }
    async start() {
        if (this.isRunning) {
            console.warn("Background service already running");
            return;
        }
        console.log("Starting background service");
        try {
            await this.imapClient.connect();
            await this.scanNewMessages();
            this.isRunning = true;
            const pollInterval = this.config.listener?.pollInterval || 30000;
            console.log(`Starting poll interval: ${pollInterval}ms`);
            this.intervalId = setInterval(async () => {
                try {
                    await this.scanNewMessages();
                }
                catch (error) {
                    console.error("Error during background scan:", error);
                }
            }, pollInterval);
        }
        catch (error) {
            console.error("Failed to start background service:", error);
            throw error;
        }
    }
    async stop() {
        console.log("Stopping background service");
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        try {
            await this.imapClient.disconnect();
        }
        catch (error) {
            console.error("Error during disconnect:", error);
        }
    }
    async scanNewMessages() {
        const inboxFolder = this.config.folders?.inbox || "INBOX";
        const quarantineFolder = this.config.folders?.quarantine || "quarantine";
        await this.imapClient.selectFolder(inboxFolder);
        const newMessages = await this.imapClient.getMessages({
            count: 50,
            filter: "unread",
        });
        console.log(`Found ${newMessages.length} new messages`);
        for (const message of newMessages) {
            const analysis = this.securityScanner.analyzeMessage(message);
            console.log(`Analyzing message ${message.id}: ${analysis.level}`);
            console.log(`Phishing score: ${analysis.phishingScore}/10`);
            console.log(`Threats:`, analysis.reasons);
            if (analysis.level === "dangerous") {
                console.log(`High threat detected - moving to quarantine`);
                await this.imapClient.moveMessage(message.id, quarantineFolder);
            }
            else if (analysis.level === "suspicious" && analysis.phishingScore >= 5) {
                console.log(`Moving suspicious message to quarantine`);
                await this.imapClient.moveMessage(message.id, quarantineFolder);
            }
            else if (analysis.level === "suspicious") {
                console.log(`Moving suspicious message to safe folder`);
                const safeInbox = this.config.folders?.safeInbox || "safe";
                await this.imapClient.moveMessage(message.id, safeInbox);
            }
        }
        this.lastCheckTime = new Date();
        console.log("Background scan completed");
    }
    async getRecentMessages(hours = 24) {
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
    async getScannedMessages() {
        const messages = await this.getRecentMessages(24);
        return this.securityScanner.getScannedMessages(messages);
    }
    async getStatus() {
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
exports.BackgroundService = BackgroundService;
//# sourceMappingURL=background-service.js.map