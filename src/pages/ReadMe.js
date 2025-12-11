import React, { useState } from "react";

const deploymentContent = `# Buy My Skills - Deployment Guide

## Overview
This guide provides instructions for deploying the Buy My Skills application on Oracle Cloud Infrastructure (OCI).

## Prerequisites
- OCI account with necessary permissions
- MySQL HeatWave instance
- Compute instance for the application server
- Load balancer (optional)

## Step 1: Set up MySQL HeatWave
1. Create a MySQL HeatWave instance in OCI.
2. Configure security lists to allow connections from your application server.
3. Create the database and user.

## Step 2: Deploy Application Server
1. Launch a compute instance (Ubuntu recommended).
2. Install Node.js and npm.
3. Clone the repository.
4. Configure environment variables.
5. Run the application.

## Step 3: Configure Load Balancer (Optional)
1. Set up OCI Load Balancer.
2. Point to your application server.

## Environment Variables
Set the following in your .env file:

\`\`\`
USE_DB=true
DB_HOST=your-oci-mysql-endpoint
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=buymyskills
PORT=4000
\`\`\`

## Running the Application
1. Install dependencies: \`npm install\`
2. Start the server: \`npm run server\`
3. Start the frontend: \`npm start\`

## Additional Notes
- Ensure SSL is enabled for production.
- Monitor resource usage.
- Set up backups for the database.

## Mini runbook (post-pull deploy)
cd /home/ubuntu/buymyskills && git pull
export npm_config_registry=https://registry.npmjs.org/ && npm ci || npm install
npm run build
sudo rsync -a --delete build/ /var/www/buymyskills/
pkill -f 'node .*server/index.js' || true
sudo systemctl restart buymyskills
sudo nginx -t && sudo systemctl reload nginx
Verify: curl -sS https://www.buymyskills.com/api/health`;

const internationalizationContent = `# Buy My Skills - Internationalization (i18n)

## Overview
Buy My Skills supports full internationalization with 5 languages: English, Spanish, French, Hindi, and Portuguese.

## Libraries Used

### 1. i18next (^21.10.0) - Core Translation Engine
**Purpose:**
- Core translation functionality - handles loading, parsing, and managing translation resources
- Key features:
  - Resource management - loads translation JSON files from \`src/locales/\`
  - Interpolation - replaces variables like \`{{name}}\` in translations
  - Pluralization - handles different forms (singular/plural) in different languages
  - Fallback languages - automatically falls back to English if translation missing
  - Namespace support - organizes translations into logical groups (e.g., \`auth.register.*\`, \`profile.*\`)

**Why needed:** Without this, you'd have to build your own translation system from scratch.

### 2. i18next-browser-languagedetector (^6.1.8) - Smart Language Detection
**Purpose:**
- Automatically detects user's preferred language from multiple sources:
  1. URL query parameter (\`?lng=es\`)
  2. LocalStorage (remembers user's choice)
  3. SessionStorage (temporary preference)
  4. Navigator language (browser's language setting)
  5. HTML tag (\`<html lang="en">\`)
  6. Cookie (server-set language)

**Why needed:** Instead of forcing users to manually select language every time, it intelligently detects their preference automatically.

### 3. react-i18next (^11.18.6) - React Integration
**Purpose:**
- React-specific integration that makes i18next work seamlessly with React components
- Key features:
  - \`useTranslation()\` hook - easy access to translations in components
  - \`t()\` function - translate keys like \`t("auth.login.title")\`
  - Suspense support - handles loading states during translation loading
  - Context providers - wraps app with translation context
  - Component optimization - only re-renders when translations change

**Why needed:** Pure i18next is framework-agnostic. \`react-i18next\` provides React-specific optimizations and developer experience.

## How They Work Together

\`\`\`javascript
// 1. i18next loads translation files
import i18n from './i18n.js';

// 2. react-i18next provides React integration
import { useTranslation } from 'react-i18next';

// 3. Language detector sets initial language
// (happens automatically)

// In components:
function LoginForm() {
  const { t } = useTranslation(); // From react-i18next

  return (
    <h1>{t('auth.login.title')}</h1> // Translated using i18next
  );
}
\`\`\`

## Translation Files Structure

Translations are stored in \`src/locales/\` directory:

- \`en.json\` - English (base language)
- \`es.json\` - Spanish
- \`fr.json\` - French
- \`hi.json\` - Hindi
- \`pt.json\` - Portuguese

## Key Features

### Namespace Organization
Translations are organized by feature:
- \`auth.*\` - Authentication (login, register)
- \`profile.*\` - User profile management
- \`landing.*\` - Landing page content
- \`browse.*\` - Browse/search functionality
- \`footer.*\` - Footer content

### Fallback System
- If a translation key is missing in current language, automatically falls back to English
- Warns in console about missing keys for development

### Language Switching
Users can switch languages via the dropdown in the top navigation bar. Choice is remembered in localStorage.

## Bundle Size Impact

The three libraries together add about **~50KB gzipped** to your bundle, which is very reasonable for full internationalization support.

## Version Compatibility

We use older versions (\`i18next@^21\`, \`react-i18next@^11\`) to maintain compatibility with TypeScript 4.9.5, rather than forcing a major TypeScript upgrade.

## Benefits

- ✅ Industry standard - Used by thousands of React apps worldwide
- ✅ Battle-tested - Mature, stable, well-maintained
- ✅ Feature-rich - Supports everything from simple translations to complex pluralization
- ✅ Developer-friendly - Excellent React integration and DX
- ✅ Performance optimized - Lazy loading, caching, minimal re-renders
- ✅ Extensible - Plugins for additional features (like language detection)`;

function ReadMe() {
  const [activeTab, setActiveTab] = useState("deployment");

  return (
    <div className="container-fluid">
      <div style={{ paddingBottom: "1.5rem" }}>
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
          <h1 className="h3 mb-0 text-gray-800">Read Me</h1>
        </div>

        <div className="row">
          <div className="col-lg-12">
            <div style={{ backgroundColor: "aliceblue" }}>
              <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === "deployment" ? "active" : ""}`}
                      onClick={() => setActiveTab("deployment")}
                    >
                      Deployment
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === "internationalization" ? "active" : ""}`}
                      onClick={() => setActiveTab("internationalization")}
                    >
                      Internationalization
                    </button>
                  </li>
                </ul>
              </div>
              <div
                className="card-body"
                style={{ height: "70vh", overflowY: "auto", padding: "1rem" }}
              >
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontFamily: "monospace",
                    margin: 0,
                    fontSize: "14px",
                    lineHeight: "1.5",
                  }}
                >
                  {activeTab === "deployment"
                    ? deploymentContent
                    : internationalizationContent}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReadMe;
