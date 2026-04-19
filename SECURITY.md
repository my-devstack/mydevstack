# Security

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please send an e-mail to the maintainers. All security vulnerabilities will be promptly addressed.

Please include the following information:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue
- Suggested fix or remediation

We will reply within 48 hours and provide a timeline for addressing the vulnerability.

## Security Best Practices

When using this project:

1. **Development Only** - This UI is intended for development and testing with AWS emulators. Do not use in production with real AWS credentials.

2. **Credential Safety** - Never commit real AWS access keys or secrets to the repository.

3. **Endpoint Security** - Ensure your local AWS emulator is properly secured and not exposed publicly.

4. **HTTPS in Production** - If deploying to production, ensure HTTPS is enabled and proper authentication is configured.
