# Cloudflare Workers Builds fresh-commit trigger

This file was created on the isolated deploy/cloudflare-vinext-preview-v1 branch only.

Goal: generate a new GitHub push after the dashboard production branch and root directory were confirmed, to test whether Cloudflare Workers Builds receives a fresh push event and selects the correct source revision.

Verified source: web/package.json contains "build:vinext": "vite build".

The source application, Pixel Pop components, Feishu, CoursePack, authentication, and main branch are unchanged.

When troubleshooting, compare the commit SHA shown in the Cloudflare Build Details against the GitHub commit that introduced this file. GitHub-run browser tests remain separately documented in PR #38.
