# JavaDrop ☕

Host, run, and share your Java projects (`.java`, `.class`, `.jar`) with family and friends — completely free on **GitHub Pages free tier**.

## 🚀 Features

- **Upload Anything**: Supports `.java` source code, `.class` compiled bytecode, and `.jar` archives.
- **In-Browser Java Runner (JVM)**: Family and friends can play interactive console games, text RPGs, and 2D canvas games right in their browser without installing Java!
- **Point to Just One File / Project**: Every project generates a direct, standalone share link (`#p=...` or LZ-String compressed hash) that opens immediately into that project.
- **1-Click PC Launcher Kit**: Generates ready-to-run `run_on_windows.bat` and `run_on_mac_linux.sh` scripts so friends can double-click and run natively.
- **Bytecode Disassembler**: Automatically parses `.class` and `.jar` headers, manifests, and bytecode instructions.
- **100% Free on GitHub Pages**: Zero backend servers, zero database costs. All data runs in the browser and across URL states.

## 📦 How to Deploy to GitHub Pages (Free Tier)

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Deploy JavaDrop to GitHub Pages"
   git branch -M main
   git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** > **Pages**
   - Under **Build and deployment > Source**, choose **GitHub Actions**
3. That's it! Your site will be automatically built and live at `https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/`.
