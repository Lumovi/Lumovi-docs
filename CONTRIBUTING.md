# Contributing to the Lumovi docs

Thanks for helping! Fixes, clarifications and new pages are all welcome.

## Before you start

- **Something wrong or missing in the docs:** open an
  [issue](https://github.com/Lumovi/Lumovi-docs/issues/new/choose), or a pull request
  straight away for a small fix.
- **Something wrong with Lumovi itself:** that goes to the
  [Lumovi repository](https://github.com/Lumovi/Lumovi/issues).
- **Bigger changes**, like a new section or pages that move: open an issue first, so we can
  agree on the approach.
- **Security issues:** please don't open a public issue. See [SECURITY.md](SECURITY.md).

## Setting up

You need [Node.js](https://nodejs.org) 20 or later. Then, in this folder:

```sh
npx mint dev
```

The docs open at <http://localhost:3000> and reload as you edit. To see Lumovi as the docs
describe it, run the app against its demo clusters: `npm run dev:mock` in a
[Lumovi](https://github.com/Lumovi/Lumovi) checkout.

## How the docs are organized

Every page is an `.mdx` file: Markdown, plus Mintlify's
[components](https://mintlify.com/docs/components). `docs.json` lists the pages in the order
the sidebar shows them, in three tabs: _Using Lumovi_, _In your cluster_ and _Reference_.

A new page needs a `title`, a one-sentence `description` and an `icon` in its frontmatter, and
a place in `docs.json`:

```mdx
---
title: "Port forwarding"
description: "Forward a port on your computer to a pod or a service, and open it in your browser."
icon: "plug-zap"
---
```

**Keep pages where they are.** [lumovi.dev](https://lumovi.dev) links to pages by
their path and shows their titles, and links to a few headings (_Verify your download_,
_Verify the image_, _Thousands of pods_). Renaming one breaks those links. When a page has to
move, add a [redirect](https://mintlify.com/docs/create/redirects) in `docs.json`, and say so
in your pull request, so the website's links can follow.

## Writing

- **Write like the app.** Plain, calm, short sentences, in the second person. No hype. Explain
  what happens and why, not only which button to press.
- **It's Lumovi:** one word, capital L. Not LUMOVI, LumoVi or Lumovi App (environment
  variables like `LUMOVI_READ_ONLY` aside). It's a Kubernetes dashboard you run on your desktop
  or in your cluster.
- **Be exact.** Every label, default, limit and behavior should match Lumovi. When in
  doubt, check its [source](https://github.com/Lumovi/Lumovi/tree/main/src), or try it
  against the demo clusters. Leave out what you can't confirm.
- **Name things as the app does.** Buttons, menus and fields in bold, spelled exactly as the
  app shows them: **Restart now**, **Help → Check for Updates…**.
- **Keys** are `<kbd>⌘</kbd><kbd>K</kbd>`. Write them for macOS, and say once on the page that
  ⌘ is Ctrl on Windows and Linux.
- **Health** looks like the app's, a colored mark with a label, never color alone:
  `<span className="lumovi-status critical">CrashLoopBackOff</span>`, with `healthy`, `warning`,
  `critical`, `progressing` or `neutral`.
- **The desktop app and Lumovi in a cluster** are the same app, so most pages cover both.
  Where they differ, say so in a `<Note>` that starts with **In your cluster:** or
  **Desktop app only:**.
- **Links between pages** are root-relative and have no extension: `/changes/read-only`.
- **Icons** are [Lucide](https://lucide.dev/icons) names, as in the app. Mintlify serves
  Lucide 1.16, without the older aliases.
- **The current version** is `{{version}}`, set in `docs.json`. Mintlify fails the build on any
  other `{{name}}`, so write templates like `{{ .spec.name }}` with spaces, inside code.

## Screenshots

Screenshots aren't kept in this repository. Lumovi takes every screen worth showing again
from its demo clusters, light and dark (`npm run screenshots` there), and the docs show them
from [its repository](https://github.com/Lumovi/Lumovi/tree/main/docs/screenshots)
through jsDelivr. When the app changes, the docs show it, without a change here.

```mdx
<Frame caption="A short caption.">
  <img
    className="block dark:hidden"
    loading="lazy"
    src="https://cdn.jsdelivr.net/gh/Lumovi/Lumovi@main/docs/screenshots/overview-light-1x.webp"
    alt="…"
  />
  <img
    className="hidden dark:block"
    loading="lazy"
    src="https://cdn.jsdelivr.net/gh/Lumovi/Lumovi@main/docs/screenshots/overview-dark-1x.webp"
    alt="…"
  />
</Frame>
```

- Every screenshot's name and a description that makes good alt text are in the app's
  [`screenshots.json`](https://github.com/Lumovi/Lumovi/blob/main/docs/screenshots/screenshots.json).
  A screen that isn't there yet is added in Lumovi's `scripts/screenshots/screens.ts`.
- Pages use the 1440 px files (`-1x.webp`). `screenshots.js` swaps in the 2880 px ones when a
  screenshot is zoomed. Mintlify drops `srcSet` from images, so this is how both sizes are used.
- `loading="lazy"` keeps the browser from downloading the theme that isn't showing.

## Logo and colors

The logo, the favicon, the link preview and the colors are Lumovi's brand, from
[Lumovi-design](https://github.com/Lumovi/Lumovi-design), along with the
[guidelines](https://github.com/Lumovi/Lumovi-design/blob/main/guidelines/README.md) for using
them. Copy new versions from there rather than changing them here:

| Here                                     | From Lumovi-design                    |
| ---------------------------------------- | ------------------------------------- |
| `logo/light.svg`                         | `logo/svg/lumovi-logo-on-light.svg`   |
| `logo/dark.svg`                          | `logo/svg/lumovi-logo-on-dark.svg`    |
| `favicon.svg`                            | `icons/web/favicon.svg`               |
| `og.png`, the docs' link preview         | `social/og/lumovi-docs.png`           |
| `colors` and `background` in `docs.json` | The README's settings for the docs    |
| The `--lumovi-*` colors in `style.css`   | `colors/tokens.css`, its theme tokens |

## Checking your change

```sh
npx mint validate               # the site builds, without warnings
npx mint broken-links           # every link between pages works
node .github/scripts/check.mjs  # screenshots, icons, page metadata and variables
```

CI runs these on every pull request. Also look at what you changed in `npx mint dev`, in light
and dark.

## Pull requests

1. Create a branch from `main`.
2. Keep the change focused.
3. Open a pull request that says what changed and why. For a change you can see, a screenshot
   helps.

What's merged to `main` goes live at [docs.lumovi.dev](https://docs.lumovi.dev).

## When Lumovi is released (maintainers)

1. Set `variables.version` in `docs.json` to the new version.
2. Add the release to `changelog.mdx`, from Lumovi's `CHANGELOG.md`.
3. Document what's new, and update pages whose labels or behavior changed.

The screenshots update themselves.
