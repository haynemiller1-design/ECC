---
description: Drive a real Chrome browser — open a URL, click, type, screenshot, read the console/network, and run Lighthouse. Use for inspecting or testing web pages live.
---

# /chrome

Control a live Chromium browser via the `mcp__chrome-devtools__*` tools to inspect or
test a web page. Take whatever the user passes as `$ARGUMENTS` (a URL, an action, or
a question about the current page) and carry it out.

## How to run it

1. **Load the DevTools tools first.** They're deferred — fetch their schemas before calling:
   `ToolSearch` with `select:mcp__chrome-devtools__navigate_page,mcp__chrome-devtools__new_page,mcp__chrome-devtools__take_snapshot,mcp__chrome-devtools__take_screenshot,mcp__chrome-devtools__click,mcp__chrome-devtools__fill,mcp__chrome-devtools__list_console_messages,mcp__chrome-devtools__list_network_requests,mcp__chrome-devtools__evaluate_script,mcp__chrome-devtools__wait_for`
   (use the keyword search form to pull in any others you need, e.g. `lighthouse`, `performance`, `hover`, `press_key`).

2. **Open / navigate.** If `$ARGUMENTS` contains a URL, `new_page` (or `navigate_page`) to it.
   If no URL is given and the user means the local app, use the dev/prod server URL
   already running for this project (e.g. `https://localhost:3000`).

3. **Observe before acting.** Call `take_snapshot` to get the accessibility tree with
   stable element UIDs, then use those UIDs for `click` / `fill` / `hover`. Use
   `take_screenshot` when the user wants a visual.

4. **Do what was asked**, then report back concisely:
   - "open / go to <url>" → navigate and screenshot.
   - "click / type / fill ..." → snapshot, act on the UID, confirm the result.
   - "console / errors" → `list_console_messages` and summarize errors/warnings.
   - "network / requests" → `list_network_requests` and summarize failures or key calls.
   - "performance / lighthouse / audit" → run `performance_start_trace` / `lighthouse_audit` and summarize scores.
   - a question → `evaluate_script` or read a snapshot to answer it.

## Notes

- This drives a headless Chromium inside the remote container, not the user's own
  browser — screenshots come back to this chat; the user can't see the window directly.
- For TLS to the local HTTPS dev server, the page may show a cert warning; proceed past it.
- Prefer snapshots (UIDs) over raw coordinates so clicks stay reliable.
- Keep one page/tab unless the task needs more; close extra pages when done.
