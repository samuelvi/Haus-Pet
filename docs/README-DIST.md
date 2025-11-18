# Temporary Directory

This directory is used for **temporary build artifacts** and **compilation outputs**.

## What's stored here?

- **`tmp/dist/`** - Compiled TypeScript output (from `npm run build`)
  - Used by the MCP server (`npm run mcp`)
  - Used for production builds
  - Generated from `app/` directory

## Git Ignore

The entire contents of this directory (except `.gitignore` and this README) are ignored by Git. This ensures that:

- Build artifacts don't pollute the repository
- Each developer/environment generates their own compiled code
- The repository stays clean and focused on source code

## Regenerating

If you need to regenerate the build artifacts:

```bash
npm run build
```

This will compile TypeScript from `app/` into `tmp/dist/`.
