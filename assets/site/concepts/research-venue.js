const escape = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

export function renderVenue(paper) {
  if (paper.status === "accepted" || paper.status === "published") {
    return `<span class="research-venue research-venue--accepted" title="${escape(paper.venue)}"><span class="research-venue-name">${escape(
      paper.tag
    )}</span> <span class="research-venue-year">${escape(paper.year)}</span></span>`;
  }
  return `<span class="research-venue research-venue--preprint"><span>${escape(paper.tag)}</span> <span class="research-venue-year">${escape(
    paper.year
  )}</span></span>`;
}
