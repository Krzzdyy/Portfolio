# crisdee.ipynb — portfolio v3

A rebuild of the portfolio as a **data notebook**, based on the GSAP showcase study in `../research/gsap-showcase/`. The comic version is untouched at the project root, so you can compare the two.

**Stack:** plain HTML, CSS and JS. GSAP 3.15 (ScrollTrigger, SplitText, ScrambleText, DrawSVG, CustomEase, ScrollTo) and Lenis are vendored in `assets/vendor/`; only Google Fonts load remotely (Bricolage Grotesque, JetBrains Mono, Caveat).

## Running it locally

Serve the folder; don't open `index.html` by double-clicking it. The contact form only sends from a page served over `http://` (FormSubmit rejects pages opened as files).

```bash
cd "C:/PORTFOLIO(FINAL)/v3"
python -m http.server 5173
# → http://localhost:5173/
```

Press Ctrl+C in the terminal to stop the server. Once deployed (Vercel, Netlify, GitHub Pages…), the live site is already served, so the form works there too.

## Contact form

The form posts to [FormSubmit](https://formsubmit.co) (`action` in `#contact`), which forwards each message to crisdeet@gmail.com. No account or API key is needed.

- **Activation:** FormSubmit holds messages until the form is activated through the link it emails to crisdeet@gmail.com. This has been done for local testing; if a new activation email arrives after the first message from the live address, click that link too.
- **On the page:** `main.js` sends the form in the background, so visitors stay on the page and see `✓ 200 OK — message sent`. If sending fails, it shows FormSubmit's reason and then opens the visitor's email app as a fallback.
- **Spam:** a hidden `_honey` field catches bots.

## The idea

Every section is a notebook cell, and cells **run when you scroll to them**, the way Jupyter does it:

1. The prompt shows `In [ ]:`, then `In [*]:` while the code line types itself and the toolbar's kernel switches to **busy**.
2. The cell takes the next execution number, in the order you reached it (tab straight to the form and it becomes `In [1]`). The badge shows the real run time.
3. Only then does the output render.
4. A blue bar marks the active cell.

| Cell | Code | Output |
|---|---|---|
| In [1] | `crisdee.describe()` | Name, intro, Fig. 1 photo with crop marks and Zamboanga's coordinates, and a `describe()` table whose rules draw in |
| In [2] | `degree.plot(x="year", y="done")` | A compact cell (one fact): a short title and a "3 of 4 years done" reel beside a small progress line drawn with DrawSVG. Years 1–3 are done; the year-4 segment is drawn only 55% of the way, and its point breathes |
| In [3] | `import toolkit as tk` | Each group is an import line that types itself (`from tools import jupyter, mysql, …, git, github`), then its tiles print top-down. Brand logos (Simple Icons, CC0: Python, JavaScript, PHP, Jupyter, MySQL, Kaggle, Git, GitHub) draw their outline, then ink in. They sit in ink and turn their brand colour on hover, while the tile tilts and the logo leans out. Excel isn't in Simple Icons (and SQL has no logo), so they use plain line icons; drop official logo files from each brand's press kit into the same `<svg>` if you want them. Power BI and Tableau are commented out in the HTML; restore those tiles and add them back to the import line to show them again. Concepts are shown as the call you'd make (`df.dropna()` → Data cleaning) and scramble in |
| In [4] | `ls projects/` | One manila folder per project (a directory tab like `3pm-brew/`, a ruled sheet with a red margin, a binder clip on the screenshot). The cell pins and each folder swipes up over the last; the one behind sinks back and dims, and the tabs step right so all stay visible. The `iloc[n]` reel follows the top folder. The last folder, `untitled/`, is dashed and empty: `NaN`, with "mkdir our-project/". Screens under 560px tall get a plain list |
| In [5] | `contact.send(name=, email=, message=)` | The form as function arguments. **Shift + Enter** runs it; errors print as `TypeError`, success as `✓ 200 OK` |

## Motion, and where each idea came from

- **Masked line reveals** (Revelatio): SplitText `mask: "lines"`, `yPercent` 105 → 0, `power4.inOut`, 1.05s, `stagger.amount: 0.25`.
- **In-out curve** (A24): `CustomEase "ink"` = `0.77, 0, 0.175, 1`, used for wipes, rules and clip-paths. Things that land use `expo.out`.
- **Lines that draw** (Filmbot, A24): DrawSVG on the chart and the hand-drawn arrows; table hairlines grow from the left.
- **Number reels** (Revelatio, Filmbot): the "3 of 4 years" counter and the project `iloc[n]`.
- **ScrambleText** (Revelatio): the boot screen, kernel status, the coordinates and the form result.
- **Scrubbed highlight list** (Revelatio's city wall): the skills.
- **One pin only** (neither long showcase site pins): the projects folder stack, ported from the comic version's Chapter 2.
- **Handwritten margin notes** (Illoca): three of them, in Caveat, in ballpoint blue.
- **One ambient loop** (IKEA): the unfinished year-4 point.

Smaller touches, each tied to something on the page:
- A blinking caret rides along while each code line types.
- The graph paper is its own layer and drifts at a fifth of the scroll speed.
- A notebook outline down the right edge (one tick per cell, the active one blue, labels on hover, clickable). Shown at 1100px and wider.
- Leaving the first screen, the two name lines slide apart and Fig. 1 drifts up.
- Fig. 1 tilts toward the cursor and its crop marks spread on hover.
- Buttons lean toward the cursor and spring back.
- Toolbar, footer and project links scramble on hover.
- Skill words skew slightly with scroll speed and "print" (scramble) the first time they light up.
- Chart points pop when you point at them.

Pointer-only touches are skipped on touch screens.


Responsive (checked from 320px phones to 1920px, including phone landscape and tablets):
- Below 980px the toolbar links become a **cells** menu (a small table of contents). Below 480px the résumé button moves into it.
- The folder stack pins whenever the screen is at least 560px tall; on shorter screens (phone landscape) it's a plain list. Folder tabs split the width evenly (by `--count` on `.files`), so they always fit; long folder names shorten with "…" on mid-size screens.
- The name is capped by screen height so it never fills a short screen. Long code lines wrap on phones. Links you tap are at least 44px tall.

Accessibility:
- `prefers-reduced-motion` turns everything off, including Lenis and the pin.
- Without JS the page is fully readable; nothing is hidden by CSS alone.
- Fields and links stay focusable before their cell runs, and focusing into a cell runs it.

## Still needs you

| What | Where |
|---|---|
| Project screenshots | 3PM Brew and Lektura have them. For a new project, save the image in `assets/img/` and copy the 3PM Brew markup: `<div class="file-shot file-shot--img" style="--ar: W / H">` with an `<img>` inside, where W / H is the image's width and height so the frame fits it uncropped |
| Résumé | Save as `v3/assets/resume.pdf` |
| Social links | Footer: GitHub still points at the home page (LinkedIn is set) |
| Skills list | Edit to what you can speak to in an interview (TODO in `#skills`) |
