# XiuYu Zhang

Personal academic website: [xiuyuz.github.io](https://xiuyuz.github.io/).

The homepage is generated as complete HTML, with JavaScript adding the particle artwork, research carousel, appearance controls, and contact dialog.

## Updating the site

- [assets/site/data.js](assets/site/data.js): biography, research interests, papers, education, affiliations, and profile links.
- [assets/site/template.js](assets/site/template.js): homepage structure.
- [assets/site/](assets/site/): styles and browser interactions.
- [assets/site/banner/config.js](assets/site/banner/config.js): the selected particle artwork.
- [scripts/build-homepage.mjs](scripts/build-homepage.mjs): browser title, description, sharing metadata, and HTML generation.
- [assets/img/favicon.svg](assets/img/favicon.svg): the site icon.
- [\_bibliography/papers.bib](_bibliography/papers.bib): bibliography used by the existing Jekyll research pages.

Update `lastUpdated` in `assets/site/data.js` manually when making a meaningful content or design change. The footer displays this date; the build does not replace it automatically.

Run `npm run build:home` after editing homepage content or its template. Commit the refreshed [index.html](index.html) together with the source changes.

## Previewing the homepage

Requires Node.js 22 or newer and Python 3. From the repository root:

```sh
npm ci --ignore-scripts
npm run build:home
npm run check:home
python3 -m http.server 8081
```

Open [localhost:8081](http://localhost:8081/). Run `npm run build:home` again after changing the content or template, then refresh the browser. CSS and browser JavaScript changes are served directly.

`npm run check:home` verifies that the committed homepage matches its source.

## Building and publishing

The existing Jekyll pipeline also builds the other research pages and the 404 page. For a full local build, install Ruby and Bundler, then run:

```sh
bundle install
JEKYLL_ENV=production bundle exec jekyll build
python3 -m http.server 8081 --directory _site
```

Use the Ruby version specified in the [deployment workflow](.github/workflows/deploy.yml) when reproducing the CI environment.

Pushing source changes to `main` runs that workflow. It regenerates the homepage, builds Jekyll, and publishes `_site` to the `gh-pages` branch.

Earlier design studies and the previous homepage are preserved in [\_archive/](_archive/). They are excluded from the published site and active source checks.

## Asset credits

Fonts are self-hosted; their SIL Open Font License files are included in [assets/site/fonts](assets/site/fonts/). Three.js is distributed under its [MIT license](assets/site/lib/three/LICENSE), with provenance in [SOURCES.md](assets/site/lib/three/SOURCES.md).

Original source credits are retained for [affiliation logos](assets/img/affiliations/SOURCES.md), [education logos](assets/img/education/SOURCES.md), and [research figures](assets/img/publication_preview/SOURCES.md). Dark-mode figure treatments are browser presentations; the original image files remain available.

The repository's [MIT license](LICENSE) credits XiuYu Zhang for site-specific additions and retains Maruan Al-Shedivat’s attribution for the original al-folio template used by the existing Jekyll pages. Third-party libraries and fonts retain their own notices. Research figures, university and affiliation logos, and third-party publication content remain subject to their original rights and source credits.
