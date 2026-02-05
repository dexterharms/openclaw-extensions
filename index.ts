import { ImapClient } from "./src/imap-client";
import { SmtpClient } from "./src/smtp-client";
import { SecurityScanner } from "./src/security-scanner";
import { PluginConfig } from "./src/types";

export default function register(api: any, config: PluginConfig) {
  const imapClient = new ImapClient(config.imap);
  const smtpClient = new SmtpClient(config.smtp);
  const securityScanner = new SecurityScanner(config.security);

  api.logger.info("mail-access plugin loaded");

  return {
    api,
    config,
    imapClient,
    smtpClient,
    securityScanner,
  };
}
