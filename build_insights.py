#!/usr/bin/env python3
"""Regenerates the Insights section from insights.json.

Run:  python3 build_insights.py
Writes: insights.html, insights/<slug>.html, images/ins-<slug>.svg,
        and the scrolling feed on the homepage (between the INS markers).
To add news: add an item to the top of insights.json and run this again.
"""
import json, html, re, datetime, pathlib

root = pathlib.Path(__file__).parent
items = json.loads((root / "insights.json").read_text(encoding="utf-8"))
E = html.escape
PAL = ["#0f3d2e", "#1d5a3f", "#2f6b4a", "#0c3326", "#285c45", "#17493a"]


def nice(d):
    return datetime.date.fromisoformat(d).strftime("%d %b %Y").lstrip("0")


def svg(i, tag):
    c = PAL[i % len(PAL)]
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" role="img" aria-label="{E(tag)}">
<rect width="800" height="500" fill="{c}"/>
<circle cx="{620 - i*30}" cy="120" r="170" fill="#3fa863" opacity=".18"/>
<circle cx="{140 + i*25}" cy="430" r="130" fill="#a8dcc0" opacity=".12"/>
<g transform="translate(330 140) scale(1.6)" fill="none" stroke="#a8dcc0" stroke-width="3" stroke-linecap="round">
<path d="M70 150V60"/><path d="M70 100C20 100 10 50 30 20c40 0 50 40 40 80z" fill="#3fa863" fill-opacity=".55"/>
<path d="M70 80C110 80 125 40 110 10c-35 5-50 30-40 70z" fill="#3fa863" fill-opacity=".35"/></g>
<text x="400" y="400" text-anchor="middle" fill="#a8dcc0" font-family="monospace" font-size="26" letter-spacing="3">{E(tag.upper())}</text>
</svg>'''


for i, it in enumerate(items):
    (root / "images" / f"ins-{it['slug']}.svg").write_text(svg(i, it["tag"]), encoding="utf-8")

# ---------- homepage feed ----------
def feed_item(it, dup):
    attrs = ' aria-hidden="true" tabindex="-1"' if dup else ""
    return (f'<a class="ins-row" href="insights/{it["slug"]}.html"{attrs}>'
            f'<img src="images/ins-{it["slug"]}.svg" alt="" width="800" height="500" loading="lazy">'
            f'<span><small>{nice(it["date"])} &middot; {E(it["tag"])}</small><b>{E(it["title"])}</b></span></a>')

feed = "".join(feed_item(it, False) for it in items) + "".join(feed_item(it, True) for it in items)
block = ('<!--INS:START-->\n    <aside class="hh-ins" aria-label="Insights">'
         f'<div class="hh-ins-list">{feed}</div></aside>\n    <!--INS:END-->')
idx = root / "index.html"
s = idx.read_text(encoding="utf-8")
if "<!--INS:START-->" in s:
    s = re.sub(r"<!--INS:START-->.*?<!--INS:END-->", lambda m: block, s, flags=re.S)
else:
    s = re.sub(r'<aside class="hh-fixed".*?</aside>', lambda m: block, s, count=1, flags=re.S)
idx.write_text(s, encoding="utf-8")

# ---------- shared page head (reuses an existing article's styles) ----------
src = (root / "articles" / "gri-vs-ifrs-s1-s2.html").read_text(encoding="utf-8")
head_end = src.index("</head>") + len("</head>")
head = src[:head_end]
head = re.sub(r"<title>.*?</title>", "<title>@@TITLE@@ — GreenMetrics</title>", head, flags=re.S)
head = re.sub(r'<link rel="canonical"[^>]*>\s*', "", head)
head = re.sub(r'<meta (property|name)="(og|twitter):[^>]*>\s*', "", head)
head = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="@@DESC@@">', head)
if "@@DESC@@" not in head:
    head = head.replace("</title>", '</title>\n<meta name="description" content="@@DESC@@">', 1)


def nav(p):
    return f'''  <nav class="tabs">
    <a href="{p}index.html">Home</a>
    <a href="{p}services.html">Services</a>
    <a href="{p}articles.html">Articles &amp; Videos</a>
    <a href="{p}tools-guides.html">Tools &amp; Guides</a>
    <a class="active" href="{p}insights.html">Insights</a>
    <a href="{p}about.html">About Me</a>
    <a href="{p}contact.html">Contact</a>
  </nav>'''


def foot(js):
    return f'''  <footer>
    <div class="brand">GreenMetrics</div>
    <p>GreenMetrics is Ifat Sarfraz's sustainability reporting and assurance practice. Tools on this site are readiness aids, not legal or regulatory advice.</p>
  </footer>
</div>
<script src="{js}assets/gm-fx.js" defer></script>
</body>
</html>
'''


def page(title, desc, p, body, js):
    h = head.replace("@@TITLE@@", E(title)).replace("@@DESC@@", E(desc, quote=True))
    if p == "":
        h = h.replace("../assets/gm-fx.css", "assets/gm-fx.css")
    return h + '\n<body class="rd insights-page">\n<div class="sheet">\n\n' + nav(p) + "\n\n" + body + foot(js)


# ---------- insights.html (grid: centre line, cards on either side) ----------
cards = ""
for it in items:
    cards += f'''
    <a class="ins-card" href="insights/{it["slug"]}.html">
      <span class="ins-img"><img src="images/ins-{it["slug"]}.svg" alt="" width="800" height="500" loading="lazy"></span>
      <span class="ins-body"><span class="ins-meta">{nice(it["date"])} &middot; {E(it["tag"])}</span>
      <h2>{E(it["title"])}</h2><p>{E(it["summary"])}</p><span class="go">Read the full news &rarr;</span></span>
    </a>'''
listing = f'''  <header class="pg-intro">
    <div class="pg-kicker">News &amp; updates</div>
    <h1>Insights</h1>
    <p>Short news and updates on sustainability reporting and assurance, newest first. Select any item to read the full story.</p>
  </header>

  <section class="ins-tl" aria-label="Insights timeline">{cards}
  </section>

'''
(root / "insights.html").write_text(
    page("Insights", "News and updates on sustainability reporting and assurance.", "", listing, ""), encoding="utf-8")

# ---------- one page per news item ----------
(root / "insights").mkdir(exist_ok=True)
for i, it in enumerate(items):
    paras = "\n".join(f"      <p>{E(t)}</p>" for t in it["paras"])
    link = ""
    if it.get("link"):
        link = f'\n      <p><a class="btn" href="{it["link"][0]}">{E(it["link"][1])} &rarr;</a></p>'
    nxt = items[(i + 1) % len(items)]
    body = f'''  <header class="article-head">
    <div class="doc-ref">Insight &middot; {E(it["tag"])} &middot; {nice(it["date"])}</div>
    <h1>{E(it["title"])}</h1>
    <p class="dek">{E(it["summary"])}</p>
  </header>

  <main>
    <figure class="ins-fig"><img src="../images/ins-{it["slug"]}.svg" alt="" width="800" height="500"></figure>
    <section class="a-block">
{paras}{link}
    </section>
    <p class="ins-nav"><a href="../insights.html">&larr; All insights</a><a href="{nxt["slug"]}.html">Next: {E(nxt["title"])} &rarr;</a></p>
  </main>

'''
    (root / "insights" / f'{it["slug"]}.html').write_text(
        page(it["title"], it["summary"], "../", body, "../"), encoding="utf-8")

print(f"Built {len(items)} insights.")
