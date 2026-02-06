"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImapClient = void 0;
const ImapFlow = __importStar(require("imapflow"));
class ImapClient {
    config;
    client = null;
    connected = false;
    constructor(config, imapConnection) {
        this.config = config;
        if (imapConnection) {
            this.client = imapConnection;
        }
        else {
            this.client = new ImapFlow.ImapFlow({
                host: this.config.host,
                port: this.config.port,
                secure: !this.config.useStarttls,
                auth: {
                    user: this.config.user,
                    pass: this.config.password,
                },
                logger: false,
                tls: {
                    rejectUnauthorized: false, // Accept self-signed certs for localhost
                },
            });
        }
    }
    async connect() {
        try {
            if (this.client) {
                await this.client.connect();
            }
            this.connected = true;
            console.log("IMAP client connected");
        }
        catch (error) {
            console.error("Failed to connect IMAP client:", error);
            throw error;
        }
    }
    async disconnect() {
        try {
            if (this.client) {
                await this.client.disconnect();
            }
            this.connected = false;
            console.log("IMAP client disconnected");
        }
        catch (error) {
            console.error("Failed to disconnect IMAP client:", error);
            throw error;
        }
    }
    async selectFolder(folder) {
        if (!this.connected) {
            await this.connect();
        }
        if (this.client) {
            await this.client.select(folder);
        }
    }
    async listFolders() {
        if (!this.connected) {
            await this.connect();
        }
        if (this.client) {
            const folderList = await this.client.list();
            return folderList.map((folder) => folder.name);
        }
        return [];
    }
    async getMessages(opts = {}) {
        if (!this.connected) {
            await this.connect();
        }
        const { count = 50, offset = 0, searchPhrase, filter = "both" } = opts;
        let searchCriteria = [];
        if (searchPhrase) {
            searchCriteria.push({ subject: searchPhrase });
        }
        if (filter === "unread") {
            searchCriteria.push({ seen: false });
        }
        else if (filter === "read") {
            searchCriteria.push({ seen: true });
        }
        if (this.client) {
            const messages = await this.client.listMessages(searchCriteria, {
                markSeen: filter === "read",
                uid: true,
                bodyParts: ["HEADER.FIELDS (FROM TO SUBJECT DATE)", "TEXT"],
            });
            const messagesToReturn = [];
            for (const message of messages) {
                const body = message.body?.text || "";
                const preview = body.substring(0, 200);
                messagesToReturn.push({
                    id: String(message.seqNo),
                    uid: message.uid,
                    from: message.headers.from?.value?.[0]?.address?.address || "unknown",
                    to: message.headers.to?.value?.[0]?.address?.address || "unknown",
                    subject: message.headers.subject?.value || "No Subject",
                    date: new Date(message.attributes.date || Date.now()),
                    size: message.size,
                    flags: message.flags || [],
                    preview,
                    body,
                    headers: {
                        from: message.headers.from?.value?.map((f) => f.value?.address?.address).join(", "),
                        to: message.headers.to?.value?.map((t) => t.value?.address?.address).join(", "),
                        subject: message.headers.subject?.value,
                        date: message.attributes.date,
                    },
                    attachments: message.parts?.filter((part) => part.disposition?.type === "attachment").map((part) => ({
                        id: part.partId,
                        filename: part.disposition?.params?.filename || "unknown",
                        size: part.size,
                        contentType: part.contentType,
                        disposition: part.disposition?.type,
                        contentId: part.id,
                    })) || [],
                });
            }
            return messagesToReturn.slice(offset, offset + count);
        }
        return [];
    }
    async getMessage(id) {
        if (!this.connected) {
            await this.connect();
        }
        if (this.client) {
            const message = await this.client.fetchMessage(id, {
                uid: true,
                bodyParts: ["HEADER.FIELDS (FROM TO SUBJECT DATE)", "TEXT", "ENVELOPE"],
            });
            const body = message.body?.text || "";
            const preview = body.substring(0, 200);
            return {
                id: String(message.seqNo),
                uid: message.uid,
                from: message.headers.from?.value?.[0]?.address?.address || "unknown",
                to: message.headers.to?.value?.[0]?.address?.address || "unknown",
                subject: message.headers.subject?.value || "No Subject",
                date: new Date(message.attributes.date || Date.now()),
                size: message.size,
                flags: message.flags || [],
                preview,
                body,
                headers: {
                    from: message.headers.from?.value?.map((f) => f.value?.address?.address).join(", "),
                    to: message.headers.to?.value?.map((t) => t.value?.address?.address).join(", "),
                    subject: message.headers.subject?.value,
                    date: message.attributes.date,
                },
                attachments: message.parts?.filter((part) => part.disposition?.type === "attachment").map((part) => ({
                    id: part.partId,
                    filename: part.disposition?.params?.filename || "unknown",
                    size: part.size,
                    contentType: part.contentType,
                    disposition: part.disposition?.type,
                    contentId: part.id,
                })) || [],
            };
        }
        return {};
    }
    async moveMessage(id, destination) {
        if (!this.connected) {
            await this.connect();
        }
        if (this.client) {
            await this.client.move({ seqNo: Number(id) }, destination);
            console.log(`Message ${id} moved to ${destination}`);
        }
    }
    async copyMessage(id, destination) {
        if (!this.connected) {
            await this.connect();
        }
        if (this.client) {
            await this.client.copy({ seqNo: Number(id) }, destination);
            console.log(`Message ${id} copied to ${destination}`);
        }
    }
    async searchMessages(criteria) {
        if (!this.connected) {
            await this.connect();
        }
        if (this.client) {
            const messages = await this.client.listMessages(criteria, {
                uid: true,
                bodyParts: ["HEADER.FIELDS (FROM TO SUBJECT DATE)", "TEXT"],
            });
            const messagesToReturn = [];
            for (const message of messages) {
                const body = message.body?.text || "";
                const preview = body.substring(0, 200);
                messagesToReturn.push({
                    id: String(message.seqNo),
                    uid: message.uid,
                    from: message.headers.from?.value?.[0]?.address?.address || "unknown",
                    to: message.headers.to?.value?.[0]?.address?.address || "unknown",
                    subject: message.headers.subject?.value || "No Subject",
                    date: new Date(message.attributes.date || Date.now()),
                    size: message.size,
                    flags: message.flags || [],
                    preview,
                    body,
                    headers: {
                        from: message.headers.from?.value?.map((f) => f.value?.address?.address).join(", "),
                        to: message.headers.to?.value?.map((t) => t.value?.address?.address).join(", "),
                        subject: message.headers.subject?.value,
                        date: message.attributes.date,
                    },
                    attachments: message.parts?.filter((part) => part.disposition?.type === "attachment").map((part) => ({
                        id: part.partId,
                        filename: part.disposition?.params?.filename || "unknown",
                        size: part.size,
                        contentType: part.contentType,
                        disposition: part.disposition?.type,
                        contentId: part.id,
                    })) || [],
                });
            }
            return messagesToReturn;
        }
        return [];
    }
    async getFolderStats(folder) {
        if (!this.connected) {
            await this.connect();
        }
        if (this.client) {
            const status = await this.client.status(folder, {
                messages: true,
                unread: true,
            });
            return {
                name: folder,
                unread: status.attributes.unread || 0,
                total: status.attributes.messages || 0,
                size: status.attributes.size || 0,
            };
        }
        return { name: folder, unread: 0, total: 0, size: 0 };
    }
}
exports.ImapClient = ImapClient;
//# sourceMappingURL=imap-client.js.map