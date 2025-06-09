# Release Setup Guide

This guide explains how to set up automated releases for the AI Knowledge Hub npm package.

## 🔧 Prerequisites Setup

### 1. NPM Token Setup

1. **Create NPM Account**: Sign up at [npmjs.com](https://www.npmjs.com) if you haven't already
2. **Generate Access Token**:
   - Go to [npm Access Tokens](https://www.npmjs.com/settings/tokens)
   - Click "Generate New Token"
   - Choose "Automation" (for CI/CD)
   - Copy the token (starts with `npm_`)

3. **Add Token to GitHub Secrets**:
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your npm token
   - Click "Add secret"

### 2. GitHub Permissions

The workflow already has the correct permissions configured:

- `contents: write` - Create releases and push tags
- `packages: write` - Publish packages  
- `id-token: write` - Enhanced security

## 🚀 How to Use the Release Workflow

### Manual Release (Recommended for learning)

1. **Go to GitHub Actions**:
   - Navigate to your repo → Actions tab
   - Click "Release" workflow
   - Click "Run workflow"

2. **Choose Release Options**:
   - **Version bump**: `patch` (1.0.2 → 1.0.3), `minor` (1.0.2 → 1.1.0), or `major` (1.0.2 → 2.0.0)
   - **Release notes**: Optional custom notes (auto-generates if empty)
   - **Pre-release**: Check if this is a beta/alpha release

3. **Click "Run workflow"**

### What the Workflow Does

1. ✅ **Validates** - Runs tests and validation
2. 📈 **Bumps Version** - Updates package.json and src/server.ts
3. 🏗️ **Builds** - Compiles TypeScript and prepares package
4. 🔍 **Tests** - Runs final validation including MCP inspector tests
5. 📝 **Commits** - Commits version changes and creates git tag
6. 🏷️ **Creates Release** - Creates GitHub release with notes
7. 📦 **Publishes** - Publishes to npm registry
8. 🎉 **Notifies** - Provides links to npm package and release

## 📋 Semantic Versioning Guide

- **Patch** (1.0.2 → 1.0.3): Bug fixes, small improvements
- **Minor** (1.0.2 → 1.1.0): New features, backward compatible
- **Major** (1.0.2 → 2.0.0): Breaking changes, API changes

## 🔒 Security Best Practices

- ✅ NPM token stored securely in GitHub Secrets
- ✅ Minimal required permissions
- ✅ Validation runs before publishing
- ✅ Dry-run testing included
- ✅ Automatic changelog generation

## 🆘 Troubleshooting

### NPM Publish Fails

- Check NPM_TOKEN is set correctly in GitHub Secrets
- Ensure you have publish rights to the package name
- Verify package name is available on npm

### Version Conflicts

- Make sure no manual version changes are pending
- Check that the workflow has write access to the repository

### Build Failures

- Ensure all dependencies are properly declared
- Check that validation scripts pass locally first

## 📚 Alternative Approaches

As you become more experienced, you might want to explore:

1. **Automated Releases**: Trigger releases on merge to main
2. **Conventional Commits**: Auto-determine version bump from commit messages
3. **Release Please**: Google's automated release management
4. **Changesets**: Advanced release management for monorepos

For now, the manual approach gives you full control and learning experience!
