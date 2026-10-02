import React, { useState } from 'react';
import { X, Github, Download, Check, Copy, ExternalLink, Terminal, FileCode, Sparkles } from 'lucide-react';
import { exportAllProjectsJson } from '../services/storage';

interface GitHubPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GITHUB_ACTIONS_WORKFLOW = `name: Deploy to GitHub Pages

on:
  push:
    branches: ['main', 'master']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build static site
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

export const GitHubPagesModal: React.FC<GitHubPagesModalProps> = ({ isOpen, onClose }) => {
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const [copiedCommands, setCopiedCommands] = useState(false);

  if (!isOpen) return null;

  const handleCopyWorkflow = () => {
    navigator.clipboard.writeText(GITHUB_ACTIONS_WORKFLOW);
    setCopiedWorkflow(true);
    setTimeout(() => setCopiedWorkflow(false), 2000);
  };

  const handleDownloadWorkflow = () => {
    const blob = new Blob([GITHUB_ACTIONS_WORKFLOW], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deploy.yml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportBackup = () => {
    const json = exportAllProjectsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `javadrop_projects_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const gitCommands = `# 1. Initialize git in your project folder
git init
git add .
git commit -m "Deploy JavaDrop to GitHub Pages"

# 2. Add your GitHub repository remote
git branch -M main
git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/<YOUR-REPO-NAME>.git

# 3. Push code to main
git push -u origin main`;

  const handleCopyCommands = () => {
    navigator.clipboard.writeText(gitCommands);
    setCopiedCommands(true);
    setTimeout(() => setCopiedCommands(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">GitHub Pages Free Tier Deployment</h2>
              <p className="text-xs text-slate-400">
                100% free hosting with zero server costs, zero maintenance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Overview Callout */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wide">
              <Sparkles className="w-4 h-4" />
              <span>How Free Hosting Works for Your Family</span>
            </div>
            <p className="leading-relaxed">
              This site is designed as a standalone static application. All project files, Java code, and binaries run completely in the browser and can be shared with URL hash links. You can host it permanently for free on GitHub Pages at <code>https://&lt;username&gt;.github.io/&lt;repo&gt;/</code>!
            </p>
          </div>

          {/* CRITICAL FIX FOR BLANK PAGE / 404 main.tsx */}
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 text-xs text-slate-200 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Fixing Blank Page: 404 main.tsx</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              If your GitHub Pages URL shows a blank page with <code className="text-amber-300">404 (main.tsx)</code>, it means GitHub Pages is currently serving the raw uncompiled root folder instead of the built bundle.
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px] text-slate-300">
              <div className="font-bold text-amber-400 text-xs font-sans">Quick 1-Minute Fix:</div>
              <div>1. Go to your GitHub repository: <strong>Settings</strong> &gt; <strong>Pages</strong></div>
              <div>2. Under <strong>Build and deployment &gt; Source</strong>:</div>
              <div className="pl-3 text-emerald-400 font-bold">
                Change from "Deploy from a branch" ➔ select "GitHub Actions"
              </div>
              <div className="text-slate-400 mt-1">
                (With "GitHub Actions" selected, the included <code>.github/workflows/deploy.yml</code> automatically builds the site cleanly and deploys it!)
              </div>
            </div>
          </div>

          {/* Step 1: GitHub Workflow File */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center">1</span>
                  <span>Add GitHub Actions Workflow (.github/workflows/deploy.yml)</span>
                </h3>
                <p className="text-xs text-slate-400 ml-7">
                  Place this file in your project to build and publish on every push automatically.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadWorkflow}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download deploy.yml</span>
                </button>
                <button
                  onClick={handleCopyWorkflow}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Copy YAML"
                >
                  {copiedWorkflow ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-36">
              <code>{GITHUB_ACTIONS_WORKFLOW}</code>
            </pre>
          </div>

          {/* Step 2: Push to GitHub */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center">2</span>
                  <span>Push to Your GitHub Repository</span>
                </h3>
                <p className="text-xs text-slate-400 ml-7">
                  Run these standard commands in your project terminal:
                </p>
              </div>
              <button
                onClick={handleCopyCommands}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {copiedCommands ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCommands ? 'Copied' : 'Copy Commands'}</span>
              </button>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-amber-300 overflow-x-auto">
              <code>{gitCommands}</code>
            </pre>
          </div>

          {/* Step 3: Enable Pages in GitHub */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center">3</span>
              <span>Enable Pages in GitHub Settings</span>
            </h3>
            <div className="ml-7 text-xs text-slate-300 space-y-1.5 leading-relaxed">
              <p>1. Open your repository on GitHub.</p>
              <p>2. Go to <strong>Settings</strong> &gt; <strong>Pages</strong>.</p>
              <p>3. Under <strong>Build and deployment &gt; Source</strong>, choose <strong>GitHub Actions</strong>.</p>
              <p>4. Done! Your site will be published at <code>https://&lt;your-username&gt;.github.io/&lt;repo-name&gt;/</code>.</p>
            </div>
          </div>

          {/* Data Backup Section */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Project Data Backup</h4>
              <p className="text-[11px] text-slate-400">Download all your saved Java projects as a JSON file</p>
            </div>
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download Backup JSON</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
