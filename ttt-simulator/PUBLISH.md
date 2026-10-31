# Publishing TTT Simulator as its own GitHub repo

The cloud agent **cannot create new GitHub repositories** from this environment (token lacks `createRepository`). Use one of the options below on your machine.

## Option A — GitHub CLI (recommended)

1. Create the repo and push from the `ttt-simulator` folder (on branch `cursor/ttt-simulator-repo-e340` in `strix`, or clone and `cd ttt-simulator`):

```bash
cd ttt-simulator
npm install   # optional, for local dev
gh repo create DrVladThePenguin/ttt-simulator --public --description "WWII tactical command simulator" --source=. --remote=origin --push
```

2. On GitHub: **Settings → General → Repository name** can stay `ttt-simulator`; set **Description** to “TTT Simulator” if you want that label in the UI.

## Option B — Empty repo + subtree push (from full strix clone)

```bash
# After you create an EMPTY repo: github.com/DrVladThePenguin/ttt-simulator
git fetch origin cursor/ttt-simulator-repo-e340
git checkout cursor/ttt-simulator-repo-e340
git subtree split --prefix=ttt-simulator -b ttt-simulator-only
git push https://github.com/DrVladThePenguin/ttt-simulator.git ttt-simulator-only:main
```

## Option C — Git bundle (offline handoff)

A bundle file `ttt-simulator-main.bundle` is included on the export branch:

```bash
git clone ttt-simulator-main.bundle ttt-simulator
cd ttt-simulator
git remote add origin https://github.com/DrVladThePenguin/ttt-simulator.git
git push -u origin main
```

(Create the empty GitHub repo first.)
