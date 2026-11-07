# pi-auto-session-name

Pi extension that names new sessions automatically, so `/resume`, the footer and the terminal title show a short label
instead of the first message:

```
/resume
  Jittered Backoff Retry Refactor       2m ago
  Add deploy dry-run flag               14m ago
```

Pi names sessions only by hand — `pi -n "title"`, `/name <title>`, or `pi.setSessionName()` from an extension. This
package adds the missing piece: once the first turn of a fresh session finishes, it asks the session's current model
for a six-word title and stores it.

## Install

```bash
pi install git:github.com/realshw/pi-auto-session-name
```

Project-local instead of personal:

```bash
pi install git:github.com/realshw/pi-auto-session-name -l
```

Try it without installing:

```bash
pi -e git:github.com/realshw/pi-auto-session-name
```

## Behavior

- Titles a new session after its first turn, capped at 48 characters.
- Falls back to the trimmed first message when the model call fails or no model is set, so every session gets a name.
- Never slows the answer down: the title request starts at the turn boundary and is awaited only on `agent_settled`
  and `session_shutdown`, which also covers `pi -p` runs.
- Skips sessions that already have a name, resumed or continued sessions with history, and any session you name
  yourself with `/name`.

## Removing

Turn the extension off in `pi config`, or uninstall it:

```bash
pi remove git:github.com/realshw/pi-auto-session-name
```

## HTTPS blocked?

Pi clones git packages over HTTPS. Where only SSH reaches GitHub, let git rewrite the URL:

```bash
git config --global url."ssh://git@github.com/".insteadOf "https://github.com/"
```
