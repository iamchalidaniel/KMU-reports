# Scripts Directory

This directory contains utility scripts for building, deploying, and managing the KMU Reports application.

## Available Scripts

### `generate-pwa-icons.js`
Generates PWA icons from the source logo file.
- Converts SVG to multiple PNG sizes
- Creates optimized icons for different devices
- Usage: `node generate-pwa-icons.js`

### `deploy-pwa.js`
Automates the PWA deployment process.
- Builds the production frontend
- Optimizes assets
- Generates deployment package
- Usage: `node deploy-pwa.js`

### `test-database.js`
Database connection and testing utility.
- Tests MongoDB connectivity
- Validates database schema
- Usage: `node test-database.js`

### `fix-permissions.js`
File permission management for Linux/Unix systems.
- Sets appropriate file permissions
- Fixes ownership issues
- Usage: `node fix-permissions.js`

## Usage Notes

All scripts are designed to run from the project root directory. Make sure you have the required dependencies installed before running any scripts.
