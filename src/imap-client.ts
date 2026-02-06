import * as ImapFlow from "imapflow";

export interface ImapConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  useStarttls: boolean;
}

export interface IImapConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  select(folder: string): Promise<void>;
  list(): Promise<any[]>;
  listMessages(criteria: any[], options: any): Promise<any[]>;
  fetchMessage(id: string, options: any): Promise<any>;
  move(selector: any, destination: string): Promise<void>;
  copy(selector: any, destination: string): Promise<void>;
  status(folder: string, options: any): Promise<any>;
}

export class ImapClient {
  private client: IImapConnection | null = null;
  private connected: boolean = false;

  constructor(
    private config: ImapConfig,
    imapConnection?: IImapConnection
  ) {
    if (imapConnection) {
      this.client = imapConnection;
    } else {
      this.client = new (ImapFlow as any).ImapFlow({
        host: this.config.host,
        port: this.config.port,
        secure: !this.config.useStarttls,
        auth: {
          user: this.config.user,
          pass: this.config.password,
        },
        logger: false,
      });
    }
  }

  async connect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.connect();
      }
      this.connected = true;
      console.log("IMAP client connected");
    } catch (error) {
      console.error("Failed to connect IMAP client:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.disconnect();
      }
      this.connected = false;
      console.log("IMAP client disconnected");
    } catch (error) {
      console.error("Failed to disconnect IMAP client:", error);
      throw error;
    }
  }

  async selectFolder(folder: string): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
    if (this.client) {
      await this.client.select(folder);
    }
  }

  async listFolders(): Promise<string[]> {
    if (!this.connected) {
      await this.connect();
    }
    if (this.client) {
      const folderList = await this.client.list();
      return folderList.map((folder: any) => folder.name);
    }
    return [];
  }

  async getMessages(opts: {
    count?: number;
    offset?: number;
    searchPhrase?: string;
    filter?: "unread" | "read" | "both";
  } = {}): Promise<any[]> {
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
    } else if (filter === "read") {
      searchCriteria.push({ seen: true });
    }

    if (this.client) {
      const messages = await this.client.listMessages(searchCriteria, {
        markSeen: filter === "read",
        uid: true,
        bodyParts: ["HEADER.FIELDS (FROM TO SUBJECT DATE)", "TEXT"],
      });

      const messagesToReturn: any[] = [];

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
            from: message.headers.from?.value?.map((f: any) => f.value?.address?.address).join(", "),
            to: message.headers.to?.value?.map((t: any) => t.value?.address?.address).join(", "),
            subject: message.headers.subject?.value,
            date: message.attributes.date,
          },
          attachments: message.parts?.filter((part: any) =>
            part.disposition?.type === "attachment"
          ).map((part: any) => ({
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

  async getMessage(id: string): Promise<any> {
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
          from: message.headers.from?.value?.map((f: any) => f.value?.address?.address).join(", "),
          to: message.headers.to?.value?.map((t: any) => t.value?.address?.address).join(", "),
          subject: message.headers.subject?.value,
          date: message.attributes.date,
        },
        attachments: message.parts?.filter((part: any) =>
          part.disposition?.type === "attachment"
        ).map((part: any) => ({
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

  async moveMessage(id: string, destination: string): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    if (this.client) {
      await this.client.move({ seqNo: Number(id) }, destination);
      console.log(`Message ${id} moved to ${destination}`);
    }
  }

  async copyMessage(id: string, destination: string): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    if (this.client) {
      await this.client.copy({ seqNo: Number(id) }, destination);
      console.log(`Message ${id} copied to ${destination}`);
    }
  }

  async searchMessages(criteria: Record<string, any>[]): Promise<any[]> {
    if (!this.connected) {
      await this.connect();
    }

    if (this.client) {
      const messages = await this.client.listMessages(criteria, {
        uid: true,
        bodyParts: ["HEADER.FIELDS (FROM TO SUBJECT DATE)", "TEXT"],
      });

      const messagesToReturn: any[] = [];

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
            from: message.headers.from?.value?.map((f: any) => f.value?.address?.address).join(", "),
            to: message.headers.to?.value?.map((t: any) => t.value?.address?.address).join(", "),
            subject: message.headers.subject?.value,
            date: message.attributes.date,
          },
          attachments: message.parts?.filter((part: any) =>
            part.disposition?.type === "attachment"
          ).map((part: any) => ({
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

  async getFolderStats(folder: string): Promise<any> {
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
