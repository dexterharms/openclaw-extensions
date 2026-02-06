declare const plugin: {
    id: string;
    name: string;
    description: string;
    configSchema: import("@sinclair/typebox").TObject<{
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
    register(api: any): void;
};
export default plugin;
//# sourceMappingURL=index.d.ts.map