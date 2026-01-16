# Privacy Policy - Homeschool Management Application

**Last Updated:** January 2026

## Overview

This Homeschool Management Application ("the App") is a desktop application designed to help families manage their homeschooling activities, curriculum, and compliance. Your privacy and your children's privacy are our highest priorities.

## Data Storage and Collection

### Local Data Storage

All of your family's educational data is stored **locally on your device** in a DuckDB database located at:

- `~/.homeschool/homeschool.db` (your primary database)
- `~/.homeschool/parquet/` (exported reports)

**We never:**

- Upload your children's names, ages, or personal information to our servers
- Transmit educational records, grades, or activities to third parties
- Store any of your family's data on cloud servers
- Access your device's data remotely

### Family Sync Feature

The optional Family Sync feature uses **encrypted peer-to-peer connections** to synchronize data between your family's devices:

- Data is transmitted directly between your devices (no intermediary servers)
- All sync connections are encrypted
- You control which devices can sync with your family
- Sync can be disabled at any time in Settings

## Sponsored Content & Partnerships

### What We Track

To support ongoing development of this free application, we partner with trusted educational companies. When you interact with sponsored content, we track:

**Anonymous Click Data Only:**

- Resource clicked (e.g., "IXL Math Practice")
- Location in app (e.g., "Resources page", "Dashboard")
- Timestamp of click

**We DO NOT track:**

- Student names, ages, or grade levels
- Activity history or learning progress
- Which student clicked on what resource
- Any personally identifiable information (PII)

### How Tracking Works

1. **Local Storage:** All click data is stored in your device's local DuckDB database
2. **No External Services:** No cookies, pixels, or third-party analytics scripts
3. **Aggregate Reporting:** Sponsors receive only total click counts (e.g., "Your resource received 247 clicks this month")
4. **No Individual Data:** Sponsors never receive information about individual users or families

### What Sponsors Receive

Sponsors receive monthly reports containing:

- Total clicks for their resources
- Clicks broken down by location in the app (e.g., "156 clicks from Resources page")
- Performance comparison across their resources

Sponsors **never** receive:

- User names, email addresses, or contact information
- Student information (names, ages, grades)
- Individual user behavior or patterns
- Device identifiers or IP addresses
- Any personally identifiable information

### Your Control

You have complete control over sponsored content:

1. **Settings Toggle:** Go to Settings → Privacy & Sponsored Content to hide all sponsored content
2. **First-Time Disclosure:** We show a disclosure modal the first time you see sponsored content
3. **Clearly Labeled:** All sponsored content is clearly marked with "Sponsored" labels
4. **Opt-Out Anytime:** Disabling sponsored content stops all tracking immediately

## Partner Standards

We only partner with:

- **Trusted Educational Companies:** Established organizations with proven homeschool resources
- **Value-First Partners:** Companies that provide genuine educational value to families
- **Privacy-Respecting Partners:** Organizations that agree to our strict no-data-sharing policy

We will **never** partner with:

- Data brokers or companies that sell user information
- Companies with predatory pricing or misleading marketing
- Organizations that require student data for purchases
- Any entity that violates children's privacy regulations

## Children's Privacy (COPPA Compliance)

This application is designed for use by families with children under 13. We are committed to protecting children's privacy:

**No Personal Information Collection:**

- We do not collect children's names in any tracking systems
- Student data is stored only on your local device
- No student information is transmitted to sponsors or third parties

**Parental Control:**

- Parents have full control over all student information
- Parents can disable sponsored content at any time
- Parents can export or delete all student data

**Educational Purpose:**

- The app is designed solely for educational record-keeping
- No advertising targeted at children
- Sponsored content is educational resources, not consumer products

## Data Retention

**Your Data:**

- All student records and activities remain on your device indefinitely
- You can export data to Parquet files at any time
- You can delete the entire database by removing `~/.homeschool/`

**Analytics Data:**

- Anonymous click data is retained locally for 12 months
- After 12 months, old click records are automatically deleted
- You can clear all analytics data in Settings

## Third-Party Services

### Optional Integrations

The app offers optional integrations that you can enable:

**Google Calendar Sync:**

- If enabled, uses Google OAuth for authentication
- Only syncs calendar events you explicitly allow
- Can be disconnected at any time
- Subject to Google's Privacy Policy

**Skylight Frame Integration:**

- If enabled, syncs chore assignments to Skylight Frame
- Uses local network connection only
- No data sent to Skylight servers without your explicit action

**Email Summaries:**

- If enabled, generates weekly summary emails
- Uses your system's default email client (mailto:) or configured SMTP
- Email content is generated locally on your device
- No email data is stored or transmitted through our servers

### No Other Third-Party Services

We do not use:

- Google Analytics or similar tracking services
- Advertising networks
- Social media tracking pixels
- Error reporting services that transmit user data
- Cloud hosting or server-side processing

## Security

**Local Database Encryption:**

- The DuckDB database is stored unencrypted on your device
- We rely on your device's filesystem permissions and encryption
- Consider using full-disk encryption (FileVault on macOS, BitLocker on Windows)

**Network Security:**

- Family Sync uses TLS/SSL encryption for peer-to-peer connections
- No data is transmitted to our servers
- Optional integrations (Google Calendar) use OAuth authentication

## Your Rights

You have the right to:

1. **Access:** View all data stored in the app at any time
2. **Export:** Export your data to Parquet files or CSV
3. **Delete:** Delete your entire database by removing the `~/.homeschool/` directory
4. **Opt-Out:** Disable sponsored content and all tracking
5. **Transparency:** Request information about our sponsor partnerships

## Changes to This Policy

We will notify you of any material changes to this privacy policy:

- In-app notification on first launch after update
- Updated version number and "Last Updated" date in this document
- Changes documented in GitHub releases (if repository is made public)

## Legal Basis (for GDPR compliance)

If you are in the European Union, our legal basis for processing your data is:

- **Consent:** You explicitly consent to sponsored content tracking (can be withdrawn in Settings)
- **Legitimate Interest:** Local data storage for app functionality (cannot be disabled without making app unusable)

## Contact Information

For privacy questions, concerns, or requests:

- **GitHub Issues:** [Repository URL - to be added if repository becomes public]
- **Email:** [Your contact email - to be added]

## Open Source Compliance

This application uses open-source libraries. Full attribution and licenses can be found in `THIRD_PARTY_LICENSES.md`.

---

## Summary

**What this means in plain English:**

✅ **Your data stays on your device.** We don't have servers, we can't see your data.

✅ **We only track anonymous clicks.** No names, no student info, just "someone clicked this resource."

✅ **You can turn it off.** Go to Settings and disable sponsored content anytime.

✅ **We're transparent.** All sponsored content is clearly labeled.

✅ **We protect kids.** No personal information about your children ever leaves your device.

✅ **You're in control.** Delete everything, export everything, sync or don't sync - it's your choice.

---

**Questions?** Please reach out if you have any concerns about privacy or data handling.
