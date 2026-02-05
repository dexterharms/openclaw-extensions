import { Type, Static } from "@sinclair/typebox";

export const ImapConfigSchema = Type.Object({
  host: Type.String({ default: "127.0.0.1" }),
  port: Type.Number({ default: 1143 }),
  user: Type.String(),
  password: Type.String({ description: "Sensitive field - encrypted in config" }),
  useStarttls: Type.Boolean({ default: true }),
});

export type ImapConfig = Static<typeof ImapConfigSchema>;

export const SmtpConfigSchema = Type.Object({
  host: Type.String({ default: "127.0.0.1" }),
  port: Type.Number({ default: 1025 }),
  user: Type.String(),
  password: Type.String({ description: "Sensitive field - encrypted in config" }),
  useStarttls: Type.Boolean({ default: true }),
  from: Type.String({ default: "dexter@harms.haus" }),
});

export type SmtpConfig = Static<typeof SmtpConfigSchema>;

export const FolderConfigSchema = Type.Object({
  inbox: Type.String({ default: "INBOX" }),
  safeInbox: Type.String({ default: "safe" }),
  quarantine: Type.String({ default: "quarantine" }),
  spam: Type.String({ default: "Junk" }),
  trash: Type.String({ default: "Trash" }),
});

export type FolderConfig = Static<typeof FolderConfigSchema>;

export const SecurityConfigSchema = Type.Object({
  knownSafeSenders: Type.Array(Type.String()),
  criticalThreats: Type.Array(Type.String()),
  phishingKeywords: Type.Array(Type.String()),
  attachmentBlacklist: Type.Array(Type.String()),
  linkThreatPatterns: Type.Array(Type.String()),
  credentialRequestPhrases: Type.Array(Type.String()),
});

export type SecurityConfig = Static<typeof SecurityConfigSchema>;

export const ListenerConfigSchema = Type.Object({
  enabled: Type.Boolean({ default: false }),
  pollInterval: Type.Number({ default: 30000 }),
  useIdle: Type.Boolean({ default: false }),
});

export type ListenerConfig = Static<typeof ListenerConfigSchema>;

export const NotificationConfigSchema = Type.Object({
  alertAgent: Type.Optional(Type.String()),
  quarantineReportTo: Type.Optional(Type.String()),
});

export type NotificationConfig = Static<typeof NotificationConfigSchema>;

export const PluginConfigSchema = Type.Object({
  imap: ImapConfigSchema,
  smtp: SmtpConfigSchema,
  folders: FolderConfigSchema,
  security: SecurityConfigSchema,
  listener: ListenerConfigSchema,
  notifications: NotificationConfigSchema,
});

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
