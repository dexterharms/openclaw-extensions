import { ImapClient } from "./imap-client";
import { SmtpClient } from "./smtp-client";
export declare const GetMailParamsSchema: import("@sinclair/typebox").TObject<{
    count: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    offset: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    searchPhrase: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    filter: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"unread">, import("@sinclair/typebox").TLiteral<"read">, import("@sinclair/typebox").TLiteral<"both">]>>;
}>;
export declare const GetMailResultSchema: import("@sinclair/typebox").TObject<{
    messages: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        from: import("@sinclair/typebox").TString;
        subject: import("@sinclair/typebox").TString;
        date: import("@sinclair/typebox").TString;
        preview: import("@sinclair/typebox").TString;
        isRead: import("@sinclair/typebox").TBoolean;
    }>>;
    total: import("@sinclair/typebox").TNumber;
}>;
export declare const ReadMailParamsSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    folder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const ReadMailResultSchema: import("@sinclair/typebox").TObject<{
    from: import("@sinclair/typebox").TString;
    to: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    cc: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    subject: import("@sinclair/typebox").TString;
    date: import("@sinclair/typebox").TString;
    body: import("@sinclair/typebox").TString;
    attachments: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        filename: import("@sinclair/typebox").TString;
        contentType: import("@sinclair/typebox").TString;
        size: import("@sinclair/typebox").TNumber;
    }>>>;
}>;
export declare const ReplyParamsSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    content: import("@sinclair/typebox").TString;
    quoteOriginal: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    folder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const ReplyResultSchema: import("@sinclair/typebox").TObject<{
    success: import("@sinclair/typebox").TBoolean;
    sent: import("@sinclair/typebox").TBoolean;
    messageId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const ForwardParamsSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    toRecipients: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    ccRecipients: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    bccRecipients: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    content: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    folder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const ForwardResultSchema: import("@sinclair/typebox").TObject<{
    success: import("@sinclair/typebox").TBoolean;
    sent: import("@sinclair/typebox").TBoolean;
    messageId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const SendMailParamsSchema: import("@sinclair/typebox").TObject<{
    toRecipients: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    ccRecipients: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    bccRecipients: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    subject: import("@sinclair/typebox").TString;
    content: import("@sinclair/typebox").TString;
    replyToMessageId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const SendMailResultSchema: import("@sinclair/typebox").TObject<{
    success: import("@sinclair/typebox").TBoolean;
    sent: import("@sinclair/typebox").TBoolean;
    messageId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const ArchiveParamsSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    folder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const ArchiveResultSchema: import("@sinclair/typebox").TObject<{
    success: import("@sinclair/typebox").TBoolean;
    moved: import("@sinclair/typebox").TBoolean;
    destination: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const MoveParamsSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    folderPath: import("@sinclair/typebox").TString;
    currentFolder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const MoveResultSchema: import("@sinclair/typebox").TObject<{
    success: import("@sinclair/typebox").TBoolean;
    moved: import("@sinclair/typebox").TBoolean;
    destination: import("@sinclair/typebox").TString;
}>;
export declare function registerSafeMailTools(api: any, config: any, imapClient: ImapClient, smtpClient: SmtpClient): void;
//# sourceMappingURL=tools.d.ts.map