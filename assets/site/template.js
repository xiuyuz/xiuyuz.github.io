import { renderResearch } from "./concepts/contour-research.js";
import { renderContact } from "./concepts/contour-contact.js";

const escape = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const external = (url, text, className = "") => `<a class="${className}" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`;

export function renderPage(data) {
  const updatedDate = data.lastUpdated
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
        new Date(`${data.lastUpdated}T00:00:00Z`)
      )
    : "";
  return `<div class="concept concept-21 study-page particle-study" id="ct-top"><div class="ct-wrap"><header class="ct-nav"><a class="ct-monogram" href="#ct-top" aria-label="XiuYu Zhang home">xz<span>.</span></a><nav aria-label="Page navigation"><a href="#ct-about">About</a><a href="#ct-research">Research</a><button class="ct-contact-trigger" type="button" data-contact-open>Contact <span aria-hidden="true">↗</span></button></nav></header><section class="ct-hero" aria-labelledby="ct-name"><div class="ct-hero-label"><span>COMPUTER SCIENCE · NUS</span><span>SINGAPORE</span></div><div class="ct-title-row"><h1 class="ct-name-effects" id="ct-name">XiuYu <em>Zhang</em></h1><div class="ct-identity"><p>${escape(
    data.role
  )}<br>${escape(data.institution)}</p><div class="ct-affiliations" role="group" aria-label="Research affiliations">${data.groups
    .map((group) =>
      external(
        group.url,
        group.logo
          ? `<img src="${escape(group.logo)}" alt="${escape(group.name)}" width="${escape(group.logoWidth)}" height="${escape(
              group.logoHeight
            )}" decoding="async">`
          : escape(group.name),
        "ct-affiliation"
      )
    )
    .join(
      ""
    )}</div></div></div><div class="ct-art-panel bs-panel" data-research-focus="reasoning"><div class="ct-topics"><span class="ct-label">RESEARCH INTERESTS</span>${data.interests
    .map(
      (interest, i) =>
        `<div class="ct-interest" data-research-focus="${
          ["reasoning", "safety", "multimodal"][i]
        }"><span class="ct-interest-number" aria-hidden="true"></span><span class="ct-interest-text">${escape(interest)}</span></div>`
    )
    .join(
      ""
    )}</div><div class="bs-art-stage" aria-hidden="true"><div class="bs-art-shadow"></div><img class="bs-art-fallback" src="/assets/site/banner/artwork.png" alt="" decoding="async"><canvas></canvas></div><div class="ct-art-caption"><button class="ct-motion-toggle" type="button" aria-label="Pause particle animation" aria-pressed="false" data-paused="false"><svg class="ct-motion-pause" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2v8M8 2v8" fill="none" stroke="currentColor" stroke-width="1.4"/></svg><svg class="ct-motion-play" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="m4 2 6 4-6 4Z" fill="currentColor"/></svg><span class="ct-motion-text">Pause motion</span></button></div></div><div class="ct-hero-bottom"><a href="#ct-about">Introduction <span aria-hidden="true">↓</span></a></div></section><section class="ct-about" id="ct-about"><div class="ct-section-heading"><span class="ct-label">01 / INTRODUCTION</span><h2>About</h2></div><div class="ct-introduction full-introduction"><div class="ct-personal">${
    data.aboutPersonalHtml
  }</div><div class="ct-research-intro">${data.aboutResearchHtml}</div></div></section>${renderResearch(
    data
  )}<section class="ct-education" id="ct-education"><div class="ct-section-heading"><span class="ct-label">03 / BACKGROUND</span><h2>Education</h2></div><div class="ct-schools">${data.education
    .map(
      (school) =>
        `<article>${
          school.logo
            ? `<img class="ct-school-logo" src="${escape(school.logo)}" alt="" width="220" height="64" loading="lazy" decoding="async">`
            : ""
        }<span>${escape(school.years)}</span><h3>${escape(school.school)}</h3><p>${escape(school.degree)}</p><p class="ct-department">${escape(
          school.department
        )}</p></article>`
    )
    .join(
      ""
    )}</div></section><footer class="ct-footer"><div><span class="ct-label">GET IN TOUCH</span><button class="ct-email ct-contact-trigger" type="button" data-contact-open>Let’s connect <span aria-hidden="true">↗</span></button></div><div class="ct-footer-links">${external(
    data.scholarUrl,
    "Google Scholar ↗"
  )}${external(data.githubUrl, "GitHub ↗")}<a href="#ct-top">Back to top ↑</a></div><p>${escape(data.name)}${
    updatedDate ? ` · Last updated <time datetime="${escape(data.lastUpdated)}">${escape(updatedDate)}</time>` : ""
  }</p></footer></div>${renderContact()}</div>`;
}
