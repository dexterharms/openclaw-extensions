#!/usr/bin/env node
"use strict";
/**
 * Integration test for mail-access plugin
 *
 * Tests real IMAP/SMTP connectivity with Proton Bridge
 * Run with: node tests/integration-test.ts
 *
 * Prerequisites:
 * 1. Proton Bridge running: protonmail-bridge --cli --noninteractive
 * 2. Bridge logged in and credentials available
 * 3. Ports accessible: 127.0.0.1:1143 (IMAP), 127.0.0.1:1025 (SMTP)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const imap_client_js_1 = require("../dist/src/imap-client.js");
const smtp_client_js_1 = require("../dist/src/smtp-client.js");
const IMAP_CONFIG = {
    host: '127.0.0.1',
    port: 1143,
    user: 'dexterharmshaus@proton.me',
    password: '2Q6LsZfes-gCdDVfqf8UTQ',
    useStarttls: true,
};
const SMTP_CONFIG = {
    host: '127.0.0.1',
    port: 1025,
    user: 'dexterharmshaus@proton.me',
    password: '2Q6LsZfes-gCdDVfqf8UTQ',
    useStarttls: true,
    from: 'dexter@harms.haus',
};
class IntegrationTester {
    imapClient;
    smtpClient;
    constructor() {
        this.imapClient = new imap_client_js_1.ImapClient(IMAP_CONFIG);
        this.smtpClient = new smtp_client_js_1.SmtpClient(SMTP_CONFIG);
    }
    async testConnection() {
        console.log('\n=== Testing IMAP Connection ===');
        try {
            await this.imapClient.connect();
            console.log('✓ IMAP connection successful');
            return true;
        }
        catch (error) {
            console.error('✗ IMAP connection failed:', error);
            return false;
        }
    }
    async testListFolders() {
        console.log('\n=== Testing List Folders ===');
        try {
            const folders = await this.imapClient.listFolders();
            console.log(`✓ Found ${folders.length} folders:`, folders);
            return true;
        }
        catch (error) {
            console.error('✗ List folders failed:', error);
            return false;
        }
    }
    async testGetMessages() {
        console.log('\n=== Testing Get Messages ===');
        try {
            const messages = await this.imapClient.getMessages({ count: 5 });
            console.log(`✓ Retrieved ${messages.length} messages`);
            if (messages.length > 0) {
                console.log('  Latest message:', {
                    from: messages[0].from,
                    subject: messages[0].subject,
                    date: messages[0].date,
                });
            }
            return true;
        }
        catch (error) {
            console.error('✗ Get messages failed:', error);
            return false;
        }
    }
    async testSmtpConnection() {
        console.log('\n=== Testing SMTP Connection ===');
        try {
            await this.smtpClient.connect();
            console.log('✓ SMTP connection successful');
            return true;
        }
        catch (error) {
            console.error('✗ SMTP connection failed:', error);
            return false;
        }
    }
    async testSendEmail() {
        console.log('\n=== Testing Send Email ===');
        try {
            const result = await this.smtpClient.sendMail({
                to: 'dexter@harms.haus',
                subject: `Mail Access Plugin Integration Test - ${new Date().toISOString()}`,
                text: 'This is an automated test message from the mail-access plugin integration test suite.',
            });
            console.log('✓ Email sent successfully:', result.messageId);
            return true;
        }
        catch (error) {
            console.error('✗ Send email failed:', error);
            return false;
        }
    }
    async runAll() {
        console.log('╔══════════════════════════════════════════════════════╗');
        console.log('║  Mail Access Plugin - Integration Test Suite            ║');
        console.log('╚══════════════════════════════════════════════════════╝');
        const results = {};
        try {
            // Test IMAP
            results['IMAP Connection'] = await this.testConnection();
            if (results['IMAP Connection']) {
                results['List Folders'] = await this.testListFolders();
                results['Get Messages'] = await this.testGetMessages();
            }
            // Test SMTP
            results['SMTP Connection'] = await this.testSmtpConnection();
            if (results['SMTP Connection']) {
                results['Send Email'] = await this.testSendEmail();
            }
            // Summary
            console.log('\n╔══════════════════════════════════════════════════════╗');
            console.log('║  Test Summary                                             ║');
            console.log('╠══════════════════════════════════════════════════════╣');
            let passed = 0;
            let failed = 0;
            for (const [name, success] of Object.entries(results)) {
                const status = success ? '✓ PASS' : '✗ FAIL';
                console.log(`║  ${name.padEnd(25)} ${status.padEnd(10)}  ║`);
                if (success)
                    passed++;
                else
                    failed++;
            }
            console.log('╠══════════════════════════════════════════════════════╣');
            console.log(`║  Total: ${passed + failed} tests  Passed: ${passed}  Failed: ${failed}  ║`);
            console.log('╚══════════════════════════════════════════════════════╝');
            // Cleanup
            console.log('\n=== Cleanup ===');
            try {
                await this.imapClient.disconnect();
                await this.smtpClient.disconnect();
                console.log('✓ Disconnected from IMAP/SMTP');
            }
            catch (error) {
                console.error('✗ Cleanup failed:', error);
            }
            process.exit(failed === 0 ? 0 : 1);
        }
        catch (error) {
            console.error('\n✗ Integration test suite failed with error:', error);
            process.exit(1);
        }
    }
}
// Run tests
const tester = new IntegrationTester();
tester.runAll().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
//# sourceMappingURL=integration-test.js.map