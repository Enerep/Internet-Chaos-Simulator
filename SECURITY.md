# Security and dependency policy

This project treats dependency installation as code execution.

## Local setup

- Use the pinned Node and npm versions documented in `README.md`.
- Install from the committed `package-lock.json` with `npm ci`.
- Keep `ignore-scripts=true` in `web/.npmrc`.
- Do not run unpinned `npx`, `npm create`, or global-install commands for routine development.
- Do not expose cloud credentials, npm tokens, GitHub tokens, SSH agents, or production `.env` files during dependency installation.

The initial scaffold was created from the explicitly pinned official package `@openai/create-sites@0.2.0`, with lifecycle scripts disabled.

## Adding or updating a dependency

1. Explain why existing code or dependencies cannot provide the capability.
2. Prefer established packages with a public source repository and registry provenance.
3. Select an exact version; avoid an automatically resolved `latest` tag.
4. Review the package metadata, maintainers, release age, lifecycle scripts, and dependency diff.
5. Install with lifecycle scripts disabled.
6. Inspect `package-lock.json` before committing.
7. Run `npm audit`, `npm audit signatures`, tests, lint, and the production build.

Do not use `npm audit fix --force` without reviewing every resulting version and API change.

## Shai-Hulud and similar campaigns

The project does not rely on a static list of one malware campaign as its only defense. Compromised legitimate packages can pass popularity-based trust checks, and malicious versions can appear after a repository was previously reviewed.

Our durable controls are:

- few direct dependencies;
- exact direct versions and a committed lockfile;
- dependency lifecycle scripts disabled;
- no secrets needed for local builds;
- advisory and signature checks;
- manual dependency diffs;
- reproducible clean installs.

If a known-malicious package is discovered in the lockfile, do not reinstall it. Treat any machine that already executed its lifecycle scripts as potentially compromised and follow the incident guidance supplied by the relevant registry and security advisory.

## Application scope

The current app has no authentication, user uploads, database, privileged API, or stored secrets. Route popup content must be constructed as DOM text, not untrusted HTML, before third-party datasets are introduced.

## Reporting

Open a private security report with the repository owner. Do not publish credentials, exploit payloads, or sensitive infrastructure details in a public issue.
