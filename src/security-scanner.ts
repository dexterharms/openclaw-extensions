import { Message, SecurityAnalysis, Attachment } from "./types";

export class SecurityScanner {
  constructor(private config: any) {}

  analyzeMessage(message: Message): SecurityAnalysis {
    const reasons: string[] = [];
    const attachmentThreats: string[] = [];
    const linkThreats: string[] = [];
    let phishingScore = 0;
    let senderReputation: "known" | "unknown" | "suspicious" = "unknown";

    const content = (message.body || "") + (message.subject || "") + (message.from || "");
    const lowerContent = content.toLowerCase();
    const subject = message.subject?.toLowerCase() || "";
    const from = message.from.toLowerCase();

    const knownSafeSenders = this.config.knownSafeSenders?.map((s: string) => s.toLowerCase()) || [];
    const criticalThreats = this.config.criticalThreats?.map((t: string) => t.toLowerCase()) || [];

    const senders: string[] = from.split(/[<>]/);

    if (knownSafeSenders.some((s: string) => senders.some(sender => sender.includes(s)))) {
      senderReputation = "known";
    } else if (senders.some((s: string) => s.includes("@.") && !s.includes("@protonmail"))) {
      senderReputation = "suspicious";
    }

    if (senderReputation === "known") {
      reasons.push("Message from known safe sender");
    }

    const hasExecutableAttachment = message.attachments?.some((attachment: Attachment) => {
      const filename = attachment.filename.toLowerCase();
      return criticalThreats.some((threat: string) => filename.endsWith(threat)) ||
             filename.match(/\.(exe|scr|bat|js|vbs|ps1|sh|jar)$/);
    });

    if (hasExecutableAttachment) {
      attachmentThreats.push("Critical threats: Executable attachments detected");
      attachmentThreats.push("Blocked files: .exe, .scr, .bat, .js, .vbs, .ps1, .sh, .jar");
      reasons.push("High risk: Executable attachment detected");
      phishingScore += 6;
    }

    const hasSuspiciousLinks = this.detectSuspiciousLinks(message);
    if (hasSuspiciousLinks) {
      linkThreats.push("Suspicious links detected: URL shorteners, suspicious TLDs, IP addresses");
      reasons.push("High risk: Suspicious links detected");
      phishingScore += 5;
    }

    if (this.detectPhishingPhrases(lowerContent, subject)) {
      phishingScore += 4;
    }

    if (this.detectCredentialRequests(lowerContent, subject)) {
      linkThreats.push("Credential theft attempts detected: Password verification, account updates");
      reasons.push("Critical: Credential theft attempt detected");
      phishingScore += 5;
    }

    const hasSuspiciousAttachments = this.detectSuspiciousAttachments(message.attachments || []);
    if (hasSuspiciousAttachments.length > 0) {
      attachmentThreats.push("Suspicious attachments: Office documents, archives");
      attachmentThreats.push(...hasSuspiciousAttachments);
      reasons.push("Warning: Suspicious attachments detected");
      phishingScore += 3;
    }

    if (this.detectKnownThreats(lowerContent, subject)) {
      reasons.push("Warning: Known threat patterns detected");
      phishingScore += 2;
    }

    if (this.detectUrgency(lowerContent, subject)) {
      reasons.push("Warning: Urgent language detected");
      phishingScore += 1;
    }

    let level: "safe" | "suspicious" | "dangerous" = "safe";

    if (phishingScore >= 8 || reasons.length === 0 && hasExecutableAttachment) {
      level = "dangerous";
    } else if (phishingScore >= 5 || attachmentThreats.length > 0 || linkThreats.length > 0) {
      level = "suspicious";
    }

    return {
      level,
      reasons,
      phishingScore: Math.min(phishingScore, 10),
      attachmentThreats,
      linkThreats,
      senderReputation,
    };
  }

  private detectSuspiciousLinks(message: Message): boolean {
    const content = (message.body || "") + (message.subject || "");
    const links = this.extractLinks(content);

    return links.some(link => {
      const lowerLink = link.toLowerCase();

      return lowerLink.includes("bit.ly") ||
             lowerLink.includes("tinyurl") ||
             lowerLink.includes("t.co") ||
             lowerLink.includes("lnkd.in") ||
             lowerLink.includes("goo.gl") ||
             this.isSuspiciousTLD(link) ||
             this.isIPAddress(link);
    });
  }

  private extractLinks(content: string): string[] {
    const linkRegex = /[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?::\d+)?(?:\/[^\s]*)?/g;
    const links = content.match(linkRegex) || [];
    return [...new Set(links)];
  }

  private isSuspiciousTLD(url: string): boolean {
    const tldRegex = /(?:\.([a-z]{2,}))$/i;
    const match = url.match(tldRegex);

    if (!match || !match[1]) return false;

    const tld = match[1].toLowerCase();
    const suspiciousTLDs = [
      "xyz", "top", "vip", "ml", "ga", "cf", "tk", "ml", "co", "ws",
      "cf", "gq", "pw", "cc", "me", "ro", "so", "we", "xc", "za"
    ];

    return suspiciousTLDs.includes(tld);
  }

  private isIPAddress(url: string): boolean {
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::[0-9]{1,5})?$/;
    return ipRegex.test(url.trim());
  }

  private detectPhishingPhrases(content: string, subject: string): boolean {
    const phishingPhrases = [
      "urgent",
      "immediate action",
      "verify account",
      "password",
      "security alert",
      "your account has been compromised",
      "click here to verify",
      "update your information",
      "confirm your identity",
      "act now",
      "limited time",
      "suspended account",
      "security breach",
      "unusual activity",
      "click to unlock",
      "verify your details",
      "verify your account",
      "verify your identity",
    ];

    const phrases = [...phishingPhrases, ...this.config.phishingKeywords || []];

    return phrases.some(phrase =>
      content.includes(phrase) || subject.includes(phrase)
    );
  }

  private detectCredentialRequests(content: string, subject: string): boolean {
    const credentialPhrases = [
      "password",
      "verify account",
      "update password",
      "change password",
      "confirm password",
      "reset password",
      "account verification",
      "verify your account",
      "verify identity",
      "click to verify",
      "account with click",
      "update with click",
    ];

    return credentialPhrases.some(phrase =>
      content.includes(phrase) || subject.includes(phrase)
    );
  }

  private detectSuspiciousAttachments(attachments: Attachment[]): string[] {
    const suspiciousPatterns = [
      /\.pdf$/i,
      /\.doc$/i,
      /\.docx$/i,
      /\.xls$/i,
      /\.xlsx$/i,
      /\.ppt$/i,
      /\.pptx$/i,
      /\.zip$/i,
      /\.rar$/i,
      /\.7z$/i,
      /\.tar$/i,
      /\.tgz$/i,
    ];

    return attachments
      .filter(attachment => suspiciousPatterns.some(pattern => pattern.test(attachment.filename)))
      .map(attachment => `Suspicious attachment: ${attachment.filename}`);
  }

  private detectKnownThreats(content: string, subject: string): boolean {
    const knownThreats = [
      "phishing",
      "malware",
      "virus",
      "trojan",
      "ransomware",
      "spyware",
      "adware",
    ];

    return knownThreats.some(threat =>
      content.includes(threat) || subject.includes(threat)
    );
  }

  private detectUrgency(content: string, subject: string): boolean {
    const urgencyWords = [
      "immediately",
      "right now",
      "as soon as possible",
      "must act",
      "urgent",
      "critical",
      "important",
      "deadline",
      "final notice",
    ];

    return urgencyWords.some(word =>
      content.includes(word) || subject.includes(word)
    );
  }

  getScannedMessages(messages: Message[]): Message[] {
    return messages.map(message => {
      const analysis = this.analyzeMessage(message);
      return {
        ...message,
        securityAnalysis: analysis,
      };
    });
  }

  getThreatLevelMessageCount(messages: Message[], level: "safe" | "suspicious" | "dangerous"): number {
    return messages.filter(message =>
      this.analyzeMessage(message).level === level
    ).length;
  }
}
