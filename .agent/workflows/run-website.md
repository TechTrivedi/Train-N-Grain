---
description: How to run the website locally and open it in Chrome
---

1. Start a local HTTP server on port 8080 (or next available port if busy):
// turbo
```
python -m http.server 8080
```
Run this in the project root directory as a background command.

2. Open the website in **Google Chrome** browser:
// turbo
```powershell
Start-Process "chrome" "http://localhost:8080"
```

Always use Chrome as the default browser. Never use Edge, Firefox, or any other browser unless the user explicitly asks.
