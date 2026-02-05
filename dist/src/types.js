"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginConfigSchema = exports.NotificationConfigSchema = exports.ListenerConfigSchema = exports.SecurityConfigSchema = exports.FolderConfigSchema = exports.SmtpConfigSchema = exports.ImapConfigSchema = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.ImapConfigSchema = typebox_1.Type.Object({
    host: typebox_1.Type.String({ default: "127.0.0.1" }),
    port: typebox_1.Type.Number({ default: 1143 }),
    user: typebox_1.Type.String(),
    password: typebox_1.Type.String({ description: "Sensitive field - encrypted in config" }),
    useStarttls: typebox_1.Type.Boolean({ default: true }),
});
exports.SmtpConfigSchema = typebox_1.Type.Object({
    host: typebox_1.Type.String({ default: "127.0.0.1" }),
    port: typebox_1.Type.Number({ default: 1025 }),
    user: typebox_1.Type.String(),
    password: typebox_1.Type.String({ description: "Sensitive field - encrypted in config" }),
    useStarttls: typebox_1.Type.Boolean({ default: true }),
    from: typebox_1.Type.String({ default: "dexter@harms.haus" }),
});
exports.FolderConfigSchema = typebox_1.Type.Object({
    inbox: typebox_1.Type.String({ default: "INBOX" }),
    safeInbox: typebox_1.Type.String({ default: "safe" }),
    quarantine: typebox_1.Type.String({ default: "quarantine" }),
    spam: typebox_1.Type.String({ default: "Junk" }),
    trash: typebox_1.Type.String({ default: "Trash" }),
});
exports.SecurityConfigSchema = typebox_1.Type.Object({
    knownSafeSenders: typebox_1.Type.Array(typebox_1.Type.String()),
    criticalThreats: typebox_1.Type.Array(typebox_1.Type.String()),
    phishingKeywords: typebox_1.Type.Array(typebox_1.Type.String()),
    attachmentBlacklist: typebox_1.Type.Array(typebox_1.Type.String()),
    linkThreatPatterns: typebox_1.Type.Array(typebox_1.Type.String()),
    credentialRequestPhrases: typebox_1.Type.Array(typebox_1.Type.String()),
});
exports.ListenerConfigSchema = typebox_1.Type.Object({
    enabled: typebox_1.Type.Boolean({ default: false }),
    pollInterval: typebox_1.Type.Number({ default: 30000 }),
    useIdle: typebox_1.Type.Boolean({ default: false }),
});
exports.NotificationConfigSchema = typebox_1.Type.Object({
    alertAgent: typebox_1.Type.Optional(typebox_1.Type.String()),
    quarantineReportTo: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.PluginConfigSchema = typebox_1.Type.Object({
    imap: exports.ImapConfigSchema,
    smtp: exports.SmtpConfigSchema,
    folders: exports.FolderConfigSchema,
    security: exports.SecurityConfigSchema,
    listener: exports.ListenerConfigSchema,
    notifications: exports.NotificationConfigSchema,
});
//# sourceMappingURL=types.js.map