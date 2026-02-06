import { ImapClient } from "./src/imap-client";
import { SmtpClient } from "./src/smtp-client";
import { SecurityScanner } from "./src/security-scanner";
import { PluginConfig } from "./src/types";
import { registerSafeMailTools, registerSecurityTools } from "./src/tools";
import { registerBackgroundService } from "./src/background-service";
import { PluginConfigSchema } from "./src/types";

const plugin = {
  id: "mail-access",
  name: "mail-access",
  description: "Secure email access plugin with IMAP, SMTP, and security scanning capabilities",
  configSchema: PluginConfigSchema,
  register(api: any) {
    api.logger.info("mail-access plugin starting...");
    api.logger.info("API keys:", Object.keys(api).join(', '));

    // Try to access config
    if (!api.config && !api.runtime?.config) {
      api.logger.error("Plugin config not found - no api.config or api.runtime.config");
      api.logger.error("API object:", JSON.stringify({ ...api, logger: '[logger]' }));
      return;
    }

    const config = (api.config || api.runtime?.config) as PluginConfig;

    if (!config.imap) {
      api.logger.error("config.imap is undefined");
      api.logger.error("Config structure:", JSON.stringify({ ...config, smtp: config.smtp ? '...' : 'undefined' }));
      return;
    }

    api.logger.info("Plugin config loaded:", JSON.stringify({ imap: { ...config.imap, password: "***" }, smtp: { ...config.smtp, password: "***" } }));

    const imapClient = new ImapClient(config.imap);
    const smtpClient = new SmtpClient(config.smtp);
    const securityScanner = new SecurityScanner(config.security);

    registerSafeMailTools(api, config, imapClient, smtpClient);
    registerSecurityTools(api, config, imapClient, securityScanner);
    registerBackgroundService(api, config);

    api.logger.info("mail-access plugin loaded");
  },
};

export default plugin;
