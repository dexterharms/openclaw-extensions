import { Static } from "@sinclair/typebox";
export declare const ImapConfigSchema: import("@sinclair/typebox").TObject<{
    host: import("@sinclair/typebox").TString;
    port: import("@sinclair/typebox").TNumber;
    user: import("@sinclair/typebox").TString;
    password: import("@sinclair/typebox").TString;
    useStarttls: import("@sinclair/typebox").TBoolean;
}>;
export type ImapConfig = Static<typeof ImapConfigSchema>;
export declare const SmtpConfigSchema: import("@sinclair/typebox").TObject<{
    host: import("@sinclair/typebox").TString;
    port: import("@sinclair/typebox").TNumber;
    user: import("@sinclair/typebox").TString;
    password: import("@sinclair/typebox").TString;
    useStarttls: import("@sinclair/typebox").TBoolean;
    from: import("@sinclair/typebox").TString;
}>;
export type SmtpConfig = Static<typeof SmtpConfigSchema>;
export declare const FolderConfigSchema: import("@sinclair/typebox").TObject<{
    inbox: import("@sinclair/typebox").TString;
    safeInbox: import("@sinclair/typebox").TString;
    quarantine: import("@sinclair/typebox").TString;
    spam: import("@sinclair/typebox").TString;
    trash: import("@sinclair/typebox").TString;
}>;
export type FolderConfig = Static<typeof FolderConfigSchema>;
export declare const SecurityConfigSchema: import("@sinclair/typebox").TObject<{
    knownSafeSenders: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    criticalThreats: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    phishingKeywords: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    attachmentBlacklist: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    linkThreatPatterns: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    credentialRequestPhrases: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
}>;
export type SecurityConfig = Static<typeof SecurityConfigSchema>;
export declare const ListenerConfigSchema: import("@sinclair/typebox").TObject<{
    enabled: import("@sinclair/typebox").TBoolean;
    pollInterval: import("@sinclair/typebox").TNumber;
    useIdle: import("@sinclair/typebox").TBoolean;
}>;
export type ListenerConfig = Static<typeof ListenerConfigSchema>;
export declare const NotificationConfigSchema: import("@sinclair/typebox").TObject<{
    alertAgent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    quarantineReportTo: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type NotificationConfig = Static<typeof NotificationConfigSchema>;
export declare const PluginConfigSchema: import("@sinclair/typebox").TObject<{
    imap: import("@sinclair/typebox").TObject<{
        host: import("@sinclair/typebox").TString;
        port: import("@sinclair/typebox").TNumber;
        user: import("@sinclair/typebox").TString;
        password: import("@sinclair/typebox").TString;
        useStarttls: import("@sinclair/typebox").TBoolean;
    }>;
    smtp: import("@sinclair/typebox").TObject<{
        host: import("@sinclair/typebox").TString;
        port: import("@sinclair/typebox").TNumber;
        user: import("@sinclair/typebox").TString;
        password: import("@sinclair/typebox").TString;
        useStarttls: import("@sinclair/typebox").TBoolean;
        from: import("@sinclair/typebox").TString;
    }>;
    folders: import("@sinclair/typebox").TObject<{
        inbox: import("@sinclair/typebox").TString;
        safeInbox: import("@sinclair/typebox").TString;
        quarantine: import("@sinclair/typebox").TString;
        spam: import("@sinclair/typebox").TString;
        trash: import("@sinclair/typebox").TString;
    }>;
    security: import("@sinclair/typebox").TObject<{
        knownSafeSenders: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
        criticalThreats: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
        phishingKeywords: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
        attachmentBlacklist: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
        linkThreatPatterns: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
        credentialRequestPhrases: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    }>;
    listener: import("@sinclair/typebox").TObject<{
        enabled: import("@sinclair/typebox").TBoolean;
        pollInterval: import("@sinclair/typebox").TNumber;
        useIdle: import("@sinclair/typebox").TBoolean;
    }>;
    notifications: import("@sinclair/typebox").TObject<{
        alertAgent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        quarantineReportTo: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
}>;
export type PluginConfig = Static<typeof PluginConfigSchema>;
export interface Message {
    id: string;
    uid?: number;
    threadId?: string;
    from: string;
    to: string;
    subject: string;
    date: Date;
    size: number;
    flags: string[];
    preview: string;
    body?: string;
    headers?: Record<string, string>;
    attachments?: Attachment[];
}
export interface Attachment {
    id: string;
    filename: string;
    size: number;
    contentType: string;
    disposition?: string;
    contentId?: string;
    body?: Buffer;
}
export interface SecurityAnalysis {
    level: "safe" | "suspicious" | "dangerous";
    reasons: string[];
    phishingScore: number;
    attachmentThreats: string[];
    linkThreats: string[];
    senderReputation: "known" | "unknown" | "suspicious";
}
export interface SearchOptions {
    count?: number;
    offset?: number;
    searchPhrase?: string;
    filter?: "unread" | "read" | "both";
}
export interface MessageMoveOptions {
    sourceFolder: string;
    destinationFolder: string;
}
export interface SecurityThreatLevel {
    critical: number;
    high: number;
    medium: number;
    low: number;
}
export interface FolderStats {
    name: string;
    unread: number;
    total: number;
    size: number;
}
export interface MailMessage {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    text: string;
    replyTo?: string;
    inReplyTo?: string;
    references?: string;
}
//# sourceMappingURL=types.d.ts.map