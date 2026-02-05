import { ImapClient } from "./src/imap-client";
import { SmtpClient } from "./src/smtp-client";
import { SecurityScanner } from "./src/security-scanner";
import { PluginConfig } from "./src/types";
export default function register(api: any, config: PluginConfig): {
    api: any;
    config: {
        imap: {
            host: string;
            port: number;
            user: string;
            password: string;
            useStarttls: boolean;
        };
        smtp: {
            host: string;
            port: number;
            user: string;
            password: string;
            useStarttls: boolean;
            from: string;
        };
        folders: {
            inbox: string;
            safeInbox: string;
            quarantine: string;
            spam: string;
            trash: string;
        };
        security: {
            knownSafeSenders: string[];
            criticalThreats: string[];
            phishingKeywords: string[];
            attachmentBlacklist: string[];
            linkThreatPatterns: string[];
            credentialRequestPhrases: string[];
        };
        listener: {
            enabled: boolean;
            pollInterval: number;
            useIdle: boolean;
        };
        notifications: {
            alertAgent?: string | undefined;
            quarantineReportTo?: string | undefined;
        };
    };
    imapClient: ImapClient;
    smtpClient: SmtpClient;
    securityScanner: SecurityScanner;
};
//# sourceMappingURL=index.d.ts.map