# Mail Access Plugin

Secure email access plugin for OpenClaw with IMAP, SMTP, and comprehensive security scanning capabilities.

## Overview

This plugin provides secure email access to ProtonMail Bridge using modern TypeScript-based tools. It includes:

- **IMAP Client**: Connect to ProtonMail Bridge (127.0.0.1:1143) with STARTTLS support
- **SMTP Client**: Send emails via SMTP (127.0.0.1:1025) with STARTTLS support
- **Security Scanner**: Detect phishing, malicious attachments, and credential theft attempts
- **Background Service**: Optional continuous email monitoring and threat filtering

## Features

### IMAP Client

- Connect to IMAP servers with STARTTLS support
- List and select mail folders
- Retrieve messages with pagination and filtering
- Search messages by criteria
- Move and copy messages between folders
- Real-time status monitoring

### SMTP Client

- Connect to SMTP servers with STARTTLS support
- Send emails with proper headers
- Reply to messages
- Forward messages
- Support for multiple recipients (to, cc, bcc)

### Security Scanner

- **Known Sender Reputation**: Track trusted senders
- **Critical Threat Detection**: Block executable attachments (.exe, .scr, .bat, .js, .vbs, .ps1, .sh, .jar)
- **Phishing Detection**: Identify phishing keywords and urgency patterns
- **Suspicious Links**: Detect URL shorteners, suspicious TLDs, and IP addresses
- **Attachment Analysis**: Flag suspicious file types (PDFs, Office docs, archives)
- **Credential Theft Detection**: Identify password verification requests

### Security Levels

- **Safe**: No threats detected, message can be safely read
- **Suspicious**: Potential threats detected, requires review
- **Dangerous**: Critical threats found, automatically quarantined

## Installation

### Prerequisites

- Node.js 18 or higher
- ProtonMail Bridge running
- npm or yarn package manager

### Setup

1. Clone or navigate to the plugin directory:
```bash
cd ~/.haus/extensions/mail-access
```

2. Install dependencies:
```bash
npm install
```

3. Build the plugin:
```bash
npm run build
```

4. Load the plugin in OpenClaw

## Configuration

### Basic IMAP Configuration

```json
{
  "imap": {
    "host": "127.0.0.1",
    "port": 1143,
    "user": "your-email@proton.me",
    "password": "your-password",
    "useStarttls": true
  }
}
```

### Basic SMTP Configuration

```json
{
  "smtp": {
    "host": "127.0.0.1",
    "port": 1025,
    "user": "your-email@proton.me",
    "password": "your-password",
    "useStarttls": true,
    "from": "your-email@proton.me"
  }
}
```

### Security Configuration

```json
{
  "security": {
    "knownSafeSenders": [
      "trusted@example.com",
      "noreply@protonmail.com"
    ],
    "criticalThreats": [
      "exe",
      "scr",
      "bat",
      "js",
      "vbs",
      "ps1",
      "sh",
      "jar"
    ],
    "phishingKeywords": [
      "urgent",
      "immediate action",
      "verify account",
      "password",
      "security alert"
    ],
    "credentialRequestPhrases": [
      "password",
      "verify account",
      "reset password"
    ]
  }
}
```

### Background Listener Configuration

```json
{
  "listener": {
    "enabled": true,
    "pollInterval": 30000,
    "useIdle": false
  }
}
```

## Usage

### Phase 1: Basic Operations

The plugin skeleton provides the core functionality. Tools and operations will be available in future phases:

- **Phase 2**: Safe email operations (read, delete, archive)
- **Phase 3**: Security tools (quarantine, report, whitelist)
- **Phase 4**: Background service integration
- **Phase 5**: UI tools and notifications

### Example Code Structure

```typescript
import { ImapClient, SmtpClient, SecurityScanner } from "./src";

const imapClient = new ImapClient(config.imap);
const smtpClient = new SmtpClient(config.smtp);
const securityScanner = new SecurityScanner(config.security);

// Connect to IMAP
await imapClient.connect();
await imapClient.selectFolder("INBOX");

// Get messages
const messages = await imapClient.getMessages({
  count: 10,
  filter: "unread"
});

// Scan messages for threats
const scannedMessages = securityScanner.getScannedMessages(messages);

// Get security analysis
const analysis = securityScanner.analyzeMessage(messages[0]);

// Send email
await smtpClient.sendMail({
  to: "recipient@example.com",
  subject: "Test Email",
  text: "Hello, this is a test email."
});

// Disconnect
await imapClient.disconnect();
```

## Development

### Build Commands

```bash
npm run build       # Compile TypeScript
npm run dev         # Watch mode for development
npm run clean       # Clean build artifacts
```

### Project Structure

```
mail-access/
├── index.ts                      # Plugin entry point
├── openclaw.plugin.json          # Plugin manifest + config schema
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
├── README.md                     # Documentation
└── src/
    ├── imap-client.ts            # IMAP connection management
    ├── smtp-client.ts            # SMTP connection management
    ├── security-scanner.ts      # Threat detection logic
    ├── background-service.ts     # IMAP IDLE listener (placeholder)
    └── types.ts                  # TypeScript types
```

## Security Considerations

- **Password Encryption**: Sensitive passwords are encrypted in the plugin config
- **STARTTLS**: Always use STARTTLS for secure connections
- **Threat Detection**: Configure appropriate security levels for your needs
- **Quarantine**: Dangerous messages are automatically quarantined
- **Background Monitoring**: Disable listener if not needed

## Known Limitations

- ProtonMail Bridge uses plain connection + STARTTLS (not SSL)
- IMAP IDLE support is planned for Phase 4
- Full background service integration in Phase 4
- Additional UI tools in Phase 2-5

## Future Roadmap

- **Phase 2**: Safe email operations and UI tools
- **Phase 3**: Advanced security tools and reporting
- **Phase 4**: Background service with IMAP IDLE
- **Phase 5**: Complete UI integration and notifications

## Contributing

Contributions are welcome! Please ensure:
- Code follows TypeScript best practices
- All functions are properly typed
- Error handling is comprehensive
- Documentation is updated

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/anomalyco/opencode/issues
- Documentation: https://github.com/anomalyco/opencode
