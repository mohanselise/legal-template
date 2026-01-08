# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Letterhead Management** - Organization admins can now upload and manage company letterheads
  - Upload PDF or image letterheads with automatic content area detection (AI-powered)
  - Simplified 2-step upload flow: Upload → Configure (previously 4 steps)
  - Progress indicator showing upload/processing/detection status
  - Auto-upload on file selection (no two-click flow)
  - Visual content area editor with drag handles to adjust header/footer boundaries
  - Set default letterhead per organization with prominent visual indicator
  - Edit content area on existing letterheads
  - Rename and delete letterheads

- **SELISE Signature Integration** - Organization-specific credentials support
  - Store SELISE Client ID and Secret per organization
  - Credential management in organization settings

- **Onboarding Flow** - New user onboarding experience
  - User profile tracking with job title and department
  - Onboarding steps: profile, org_settings, invite_team
  - Organization permissions model for granular access control

### Changed

- Improved letterhead card UI with better default indicator (blue border + ring effect)
- Dropdown menu now has separator before destructive actions
- Database helper function for default letterhead management (avoids Neon HTTP transaction issues)

### Fixed

- Neon Postgres HTTP adapter transaction error when setting default letterheads
- Middleware routing for uploadthing API endpoints (Clerk auth)
