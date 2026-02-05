import { Type, Static } from "@sinclair/typebox";
import { ImapClient } from "./imap-client";
import { SmtpClient } from "./smtp-client";
import { MailMessage } from "./types";

export const GetMailParamsSchema = Type.Object({
  count: Type.Optional(Type.Number({ default: 10, minimum: 1, maximum: 100 })),
  offset: Type.Optional(Type.Number({ default: 0, minimum: 0 })),
  searchPhrase: Type.Optional(Type.String()),
  filter: Type.Optional(Type.Union([Type.Literal("unread"), Type.Literal("read"), Type.Literal("both")])),
});

export const GetMailResultSchema = Type.Object({
  messages: Type.Array(
    Type.Object({
      id: Type.String(),
      from: Type.String(),
      subject: Type.String(),
      date: Type.String(),
      preview: Type.String(),
      isRead: Type.Boolean(),
    })
  ),
  total: Type.Number(),
});

export const ReadMailParamsSchema = Type.Object({
  id: Type.String(),
  folder: Type.Optional(Type.String()),
});

export const ReadMailResultSchema = Type.Object({
  from: Type.String(),
  to: Type.Array(Type.String()),
  cc: Type.Optional(Type.Array(Type.String())),
  subject: Type.String(),
  date: Type.String(),
  body: Type.String(),
  attachments: Type.Optional(
    Type.Array(
      Type.Object({
        filename: Type.String(),
        contentType: Type.String(),
        size: Type.Number(),
      })
    )
  ),
});

export const ReplyParamsSchema = Type.Object({
  id: Type.String(),
  content: Type.String(),
  quoteOriginal: Type.Optional(Type.Boolean({ default: false })),
  folder: Type.Optional(Type.String()),
});

export const ReplyResultSchema = Type.Object({
  success: Type.Boolean(),
  sent: Type.Boolean(),
  messageId: Type.Optional(Type.String()),
});

export const ForwardParamsSchema = Type.Object({
  id: Type.String(),
  toRecipients: Type.Array(Type.String()),
  ccRecipients: Type.Optional(Type.Array(Type.String())),
  bccRecipients: Type.Optional(Type.Array(Type.String())),
  content: Type.Optional(Type.String()),
  folder: Type.Optional(Type.String()),
});

export const ForwardResultSchema = Type.Object({
  success: Type.Boolean(),
  sent: Type.Boolean(),
  messageId: Type.Optional(Type.String()),
});

export const SendMailParamsSchema = Type.Object({
  toRecipients: Type.Array(Type.String()),
  ccRecipients: Type.Optional(Type.Array(Type.String())),
  bccRecipients: Type.Optional(Type.Array(Type.String())),
  subject: Type.String(),
  content: Type.String(),
  replyToMessageId: Type.Optional(Type.String()),
});

export const SendMailResultSchema = Type.Object({
  success: Type.Boolean(),
  sent: Type.Boolean(),
  messageId: Type.Optional(Type.String()),
});

export const ArchiveParamsSchema = Type.Object({
  id: Type.String(),
  folder: Type.Optional(Type.String()),
});

export const ArchiveResultSchema = Type.Object({
  success: Type.Boolean(),
  moved: Type.Boolean(),
  destination: Type.Optional(Type.String()),
});

export const MoveParamsSchema = Type.Object({
  id: Type.String(),
  folderPath: Type.String(),
  currentFolder: Type.Optional(Type.String()),
});

export const MoveResultSchema = Type.Object({
  success: Type.Boolean(),
  moved: Type.Boolean(),
  destination: Type.String(),
});

export function registerSafeMailTools(api: any, config: any, imapClient: ImapClient, smtpClient: SmtpClient) {
  const safeInboxFolder = config.folders?.safeInbox || "safe";

  api.registerTool({
    name: "mail_access_get_mail",
    description: "List messages in Safe-Inbox folder with pagination and filtering",
    parameters: GetMailParamsSchema,
    handler: async (params: Static<typeof GetMailParamsSchema>) => {
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
      } catch (error) {
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
    parameters: ReadMailParamsSchema,
    handler: async (params: Static<typeof ReadMailParamsSchema>) => {
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
      } catch (error) {
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
    parameters: ReplyParamsSchema,
    handler: async (params: Static<typeof ReplyParamsSchema>) => {
      try {
        api.logger.info(`Replying to message with ID: ${params.id}`);

        const folder = params.folder || safeInboxFolder;
        const message = await imapClient.getMessage(params.id);

        const quotedContent = params.quoteOriginal
          ? `\n\n--- Original Message ---\nFrom: ${message.from}\nDate: ${message.date.toISOString()}\nSubject: ${message.subject}\n\n${message.body}`
          : "";

        const mail: MailMessage = {
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
      } catch (error) {
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
    parameters: ForwardParamsSchema,
    handler: async (params: Static<typeof ForwardParamsSchema>) => {
      try {
        api.logger.info(`Forwarding message with ID: ${params.id} to ${params.toRecipients.join(", ")}`);

        const folder = params.folder || safeInboxFolder;
        const message = await imapClient.getMessage(params.id);

        const forwardContent = params.content || `\n\n--- Forwarded Message ---\nFrom: ${message.from}\nDate: ${message.date.toISOString()}\nSubject: ${message.subject}\n\n${message.body}`;

        const mail: MailMessage = {
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
      } catch (error) {
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
    parameters: SendMailParamsSchema,
    handler: async (params: Static<typeof SendMailParamsSchema>) => {
      try {
        api.logger.info(`Sending mail to ${params.toRecipients.join(", ")}`);

        const mail: MailMessage = {
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
      } catch (error) {
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
    parameters: ArchiveParamsSchema,
    handler: async (params: Static<typeof ArchiveParamsSchema>) => {
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
      } catch (error) {
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
    parameters: MoveParamsSchema,
    handler: async (params: Static<typeof MoveParamsSchema>) => {
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
      } catch (error) {
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
