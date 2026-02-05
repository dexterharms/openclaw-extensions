import { Message, SecurityAnalysis } from "./types";
export declare class SecurityScanner {
    private config;
    constructor(config: any);
    analyzeMessage(message: Message): SecurityAnalysis;
    private detectSuspiciousLinks;
    private extractLinks;
    private isSuspiciousTLD;
    private isIPAddress;
    private detectPhishingPhrases;
    private detectCredentialRequests;
    private detectSuspiciousAttachments;
    private detectKnownThreats;
    private detectUrgency;
    getScannedMessages(messages: Message[]): Message[];
    getThreatLevelMessageCount(messages: Message[], level: "safe" | "suspicious" | "dangerous"): number;
}
//# sourceMappingURL=security-scanner.d.ts.map