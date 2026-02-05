"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoveResultSchema = exports.MoveParamsSchema = exports.ArchiveResultSchema = exports.ArchiveParamsSchema = exports.SendMailResultSchema = exports.SendMailParamsSchema = exports.ForwardResultSchema = exports.ForwardParamsSchema = exports.ReplyResultSchema = exports.ReplyParamsSchema = exports.ReadMailResultSchema = exports.ReadMailParamsSchema = exports.GetMailResultSchema = exports.GetMailParamsSchema = void 0;
exports.registerSafeMailTools = registerSafeMailTools;
const typebox_1 = require("@sinclair/typebox");
exports.GetMailParamsSchema = typebox_1.Type.Object({
    count: typebox_1.Type.Optional(typebox_1.Type.Number({ default: 10, minimum: 1, maximum: 100 })),
    offset: typebox_1.Type.Optional(typebox_1.Type.Number({ default: 0, minimum: 0 })),
    searchPhrase: typebox_1.Type.Optional(typebox_1.Type.String()),
    filter: typebox_1.Type.Optional(typebox_1.Type.Union([typebox_1.Type.Literal("unread"), typebox_1.Type.Literal("read"), typebox_1.Type.Literal("both")])),
});
exports.GetMailResultSchema = typebox_1.Type.Object({
    messages: typebox_1.Type.Array(typebox_1.Type.Object({
        id: typebox_1.Type.String(),
        from: typebox_1.Type.String(),
        subject: typebox_1.Type.String(),
        date: typebox_1.Type.String(),
        preview: typebox_1.Type.String(),
        isRead: typebox_1.Type.Boolean(),
    })),
    total: typebox_1.Type.Number(),
});
exports.ReadMailParamsSchema = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    folder: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.ReadMailResultSchema = typebox_1.Type.Object({
    from: typebox_1.Type.String(),
    to: typebox_1.Type.Array(typebox_1.Type.String()),
    cc: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
    subject: typebox_1.Type.String(),
    date: typebox_1.Type.String(),
    body: typebox_1.Type.String(),
    attachments: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.Object({
        filename: typebox_1.Type.String(),
        contentType: typebox_1.Type.String(),
        size: typebox_1.Type.Number(),
    }))),
});
exports.ReplyParamsSchema = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    content: typebox_1.Type.String(),
    quoteOriginal: typebox_1.Type.Optional(typebox_1.Type.Boolean({ default: false })),
    folder: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.ReplyResultSchema = typebox_1.Type.Object({
    success: typebox_1.Type.Boolean(),
    sent: typebox_1.Type.Boolean(),
    messageId: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.ForwardParamsSchema = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    toRecipients: typebox_1.Type.Array(typebox_1.Type.String()),
    ccRecipients: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
    bccRecipients: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
    content: typebox_1.Type.Optional(typebox_1.Type.String()),
    folder: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.ForwardResultSchema = typebox_1.Type.Object({
    success: typebox_1.Type.Boolean(),
    sent: typebox_1.Type.Boolean(),
    messageId: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.SendMailParamsSchema = typebox_1.Type.Object({
    toRecipients: typebox_1.Type.Array(typebox_1.Type.String()),
    ccRecipients: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
    bccRecipients: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
    subject: typebox_1.Type.String(),
    content: typebox_1.Type.String(),
    replyToMessageId: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.SendMailResultSchema = typebox_1.Type.Object({
    success: typebox_1.Type.Boolean(),
    sent: typebox_1.Type.Boolean(),
    messageId: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.ArchiveParamsSchema = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    folder: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.ArchiveResultSchema = typebox_1.Type.Object({
    success: typebox_1.Type.Boolean(),
    moved: typebox_1.Type.Boolean(),
    destination: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.MoveParamsSchema = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    folderPath: typebox_1.Type.String(),
    currentFolder: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.MoveResultSchema = typebox_1.Type.Object({
    success: typebox_1.Type.Boolean(),
    moved: typebox_1.Type.Boolean(),
    destination: typebox_1.Type.String(),
});
function registerSafeMailTools(api, config, imapClient, smtpClient) {
    const safeInboxFolder = config.folders?.safeInbox || "safe";
    api.registerTool({
        name: "mail_access_get_mail",
        description: "List messages in Safe-Inbox folder with pagination and filtering",
        parameters: exports.GetMailParamsSchema,
        handler: async (params) => {
            try {
                api.logger.info(`Getting mail messages from ${safeInboxFolder} folder`);
                const messages = await imapClient.getMessages({
                    count: params.count || 10,
                    offset: params.offset || 0,
                    searchPhrase: params.searchPhrase,
                    filter: params.filter || "unread",
                });
                const total = messages.length;
                const result = {
                    messages: messages.map((msg) => ({
                        id: msg.id,
                        from: msg.from,
                        subject: msg.subject,
                        date: msg.date.toISOString(),
                        preview: msg.preview,
                        isRead: msg.flags?.includes("\\Seen") || false,
                    })),
                    total,
                };
                api.logger.info(`Retrieved ${total} messages from ${safeInboxFolder} folder`);
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                };
            }
            catch (error) {
                api.logger.error("Error in mail_access_get_mail:", error);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: false,
                                error: error instanceof Error ? error.message : "Unknown error",
                            }),
                        },
                    ],
                };
            }
        },
    });
    api.registerTool({
        name: "mail_access_read_mail",
        description: "Read a specific message from Safe-Inbox",
        parameters: exports.ReadMailParamsSchema,
        handler: async (params) => {
            try {
                api.logger.info(`Reading mail message with ID: ${params.id}`);
                const folder = params.folder || safeInboxFolder;
                const message = await imapClient.getMessage(params.id);
                const result = {
                    from: message.from,
                    to: message.to.split(",").map((t) => t.trim()),
                    subject: message.subject,
                    date: message.date.toISOString(),
                    body: message.body || "",
                    attachments: message.attachments?.map((att) => ({
                        filename: att.filename,
                        contentType: att.contentType,
                        size: att.size,
                    })),
                };
                api.logger.info(`Successfully read message ${params.id}`);
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                };
            }
            catch (error) {
                api.logger.error("Error in mail_access_read_mail:", error);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: false,
                                error: error instanceof Error ? error.message : "Unknown error",
                            }),
                        },
                    ],
                };
            }
        },
    });
    api.registerTool({
        name: "mail_access_reply",
        description: "Reply to a message",
        parameters: exports.ReplyParamsSchema,
        handler: async (params) => {
            try {
                api.logger.info(`Replying to message with ID: ${params.id}`);
                const folder = params.folder || safeInboxFolder;
                const message = await imapClient.getMessage(params.id);
                const quotedContent = params.quoteOriginal
                    ? `\n\n--- Original Message ---\nFrom: ${message.from}\nDate: ${message.date.toISOString()}\nSubject: ${message.subject}\n\n${message.body}`
                    : "";
                const mail = {
                    to: message.to.split(",").map((t) => t.trim())[0],
                    subject: `Re: ${message.subject}`,
                    text: `${quotedContent}\n\n${params.content}`,
                    inReplyTo: params.id,
                    references: params.id,
                };
                await smtpClient.connect();
                const result = await smtpClient.replyTo(params.id, mail);
                api.logger.info(`Successfully replied to message ${params.id}`);
                return {
                    content: [{ type: "text", text: JSON.stringify({ success: true, sent: true, messageId: result.messageId }) }],
                };
            }
            catch (error) {
                api.logger.error("Error in mail_access_reply:", error);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: false,
                                sent: false,
                                error: error instanceof Error ? error.message : "Unknown error",
                            }),
                        },
                    ],
                };
            }
        },
    });
    api.registerTool({
        name: "mail_access_forward",
        description: "Forward a message",
        parameters: exports.ForwardParamsSchema,
        handler: async (params) => {
            try {
                api.logger.info(`Forwarding message with ID: ${params.id} to ${params.toRecipients.join(", ")}`);
                const folder = params.folder || safeInboxFolder;
                const message = await imapClient.getMessage(params.id);
                const forwardContent = params.content || `\n\n--- Forwarded Message ---\nFrom: ${message.from}\nDate: ${message.date.toISOString()}\nSubject: ${message.subject}\n\n${message.body}`;
                const mail = {
                    to: params.toRecipients,
                    subject: `Fwd: ${message.subject}`,
                    text: forwardContent,
                    references: params.id,
                };
                await smtpClient.connect();
                const result = await smtpClient.forwardMessage(params.id, params.toRecipients, mail);
                api.logger.info(`Successfully forwarded message ${params.id}`);
                return {
                    content: [{ type: "text", text: JSON.stringify({ success: true, sent: true, messageId: result.messageId }) }],
                };
            }
            catch (error) {
                api.logger.error("Error in mail_access_forward:", error);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: false,
                                sent: false,
                                error: error instanceof Error ? error.message : "Unknown error",
                            }),
                        },
                    ],
                };
            }
        },
    });
    api.registerTool({
        name: "mail_access_send_mail",
        description: "Compose and send a new email",
        parameters: exports.SendMailParamsSchema,
        handler: async (params) => {
            try {
                api.logger.info(`Sending mail to ${params.toRecipients.join(", ")}`);
                const mail = {
                    to: params.toRecipients,
                    cc: params.ccRecipients,
                    bcc: params.bccRecipients,
                    subject: params.subject,
                    text: params.content,
                    replyTo: params.replyToMessageId,
                    inReplyTo: params.replyToMessageId,
                };
                await smtpClient.connect();
                const result = await smtpClient.sendMail(mail);
                api.logger.info(`Successfully sent mail to ${params.toRecipients.join(", ")}`);
                return {
                    content: [{ type: "text", text: JSON.stringify({ success: true, sent: true, messageId: result.messageId }) }],
                };
            }
            catch (error) {
                api.logger.error("Error in mail_access_send_mail:", error);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: false,
                                sent: false,
                                error: error instanceof Error ? error.message : "Unknown error",
                            }),
                        },
                    ],
                };
            }
        },
    });
    api.registerTool({
        name: "mail_access_archive",
        description: "Archive a message (mark as read or move to Archive folder)",
        parameters: exports.ArchiveParamsSchema,
        handler: async (params) => {
            try {
                api.logger.info(`Archiving message with ID: ${params.id}`);
                const folder = params.folder || safeInboxFolder;
                const destination = "Archive";
                await imapClient.selectFolder(folder);
                await imapClient.copyMessage(params.id, destination);
                await imapClient.moveMessage(params.id, destination);
                api.logger.info(`Successfully archived message ${params.id} to ${destination}`);
                return {
                    content: [{ type: "text", text: JSON.stringify({ success: true, moved: true, destination }) }],
                };
            }
            catch (error) {
                api.logger.error("Error in mail_access_archive:", error);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: false,
                                moved: false,
                                error: error instanceof Error ? error.message : "Unknown error",
                            }),
                        },
                    ],
                };
            }
        },
    });
    api.registerTool({
        name: "mail_access_move",
        description: "Move a message to a different folder",
        parameters: exports.MoveParamsSchema,
        handler: async (params) => {
            try {
                api.logger.info(`Moving message with ID: ${params.id} to folder: ${params.folderPath}`);
                const currentFolder = params.currentFolder || safeInboxFolder;
                await imapClient.selectFolder(currentFolder);
                await imapClient.copyMessage(params.id, params.folderPath);
                await imapClient.moveMessage(params.id, params.folderPath);
                api.logger.info(`Successfully moved message ${params.id} to ${params.folderPath}`);
                return {
                    content: [{ type: "text", text: JSON.stringify({ success: true, moved: true, destination: params.folderPath }) }],
                };
            }
            catch (error) {
                api.logger.error("Error in mail_access_move:", error);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: false,
                                moved: false,
                                destination: params.folderPath,
                                error: error instanceof Error ? error.message : "Unknown error",
                            }),
                        },
                    ],
                };
            }
        },
    });
}
//# sourceMappingURL=tools.js.map