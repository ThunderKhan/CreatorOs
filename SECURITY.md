# Security Policy

## Supported versions

Security fixes are targeted at the current `main` branch. Older commits and unreleased branches may not receive security updates.

## Reporting a vulnerability

Please do not open a public GitHub issue for an unpatched security vulnerability.

Use GitHub's private vulnerability reporting for this repository when available. Include:

- A clear description of the vulnerability and its impact.
- The affected endpoint, file, or component.
- Reproduction steps or a minimal proof of concept.
- Any relevant request/response examples, logs, or screenshots that do not contain secrets.
- Your suggested mitigation, if you have one.

Please allow maintainers reasonable time to investigate and prepare a fix before public disclosure.

## What to expect

Maintainers should acknowledge a valid report, investigate the affected code path, and coordinate remediation or disclosure timing with the reporter.

## Sensitive information

Never include passwords, API keys, access tokens, private credentials, or other secrets in an issue or vulnerability report. Redact sensitive values from logs and examples.

## Scope

Reports involving authentication, authorization, account isolation, CSRF, OAuth, webhooks, billing, data exposure, injection, unsafe file handling, or other security-sensitive behavior are in scope.
