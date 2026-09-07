# Selected research figure sources

Verified on 6 September 2026. Selected research defaults to each paper's first
numbered figure, preserving the complete original. The oral atlas uses the
graphical abstract explicitly chosen by XiuYu instead. These assets are figure
exports or original downloads, not redrawn illustrations.

| Paper                       | Local asset                   | Figure and original source                                                                                                                                                                                                                                                                                                                  |
| --------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LMSM                        | `lmsm-figure1.svg`            | Figure 1, comparison of separate guards with the shared LMSM enforcement substrate. [Caption in arXiv v1](https://arxiv.org/html/2608.25697v1#S1.F1); [original source archive](https://arxiv.org/src/2608.25697v1), `figures/sections/LMSM_overview.pdf`.                                                                                  |
| SEE                         | `see.png`                     | Figure 1, overview of the SEE cycle. [Caption in arXiv v2](https://arxiv.org/html/2606.05122v2#S2.F1); [original PNG](https://arxiv.org/html/2606.05122v2/method.png). The existing local PNG is byte-identical to this source.                                                                                                             |
| Cosine Misleads             | `cosine_misleads-figure1.svg` | Figure 1, the relationship between cosine alignment and accuracy across five variants. [Caption in arXiv v1](https://arxiv.org/html/2606.05753v1#S1.F1); [original SVG](https://arxiv.org/html/2606.05753v1/fig1_teaser.svg).                                                                                                               |
| AlphaAlign                  | `alphaalign.png`              | Figure 1, overview of AlphaAlign's incentive mechanism and two reward components. [Caption in arXiv v1](https://arxiv.org/html/2507.14987v1#S3.F1); [original arXiv PNG for comparison](https://arxiv.org/html/2507.14987v1/overview.png). The existing local PNG presents the same complete figure at a higher resolution and is retained. |
| Oral and craniofacial atlas | `ocf-featured.jpg`            | Graphical abstract, explicitly chosen by XiuYu in place of Figure 1. Downloaded unchanged from the [exact Cell image supplied by XiuYu](https://www.cell.com/cms/10.1016/j.cpblue.2026.100007/asset/e0c281de-c281-4100-a11b-bd932e1cec3c/main.assets/fx1_lrg.jpg); [published article](https://doi.org/10.1016/j.cpblue.2026.100007).       |

LMSM's HTML conversion does not contain its Figure 1 image. Its original standalone
figure PDF was exported as SVG using PyMuPDF 1.28.2:

```python
doc = pymupdf.open("figures/sections/LMSM_overview.pdf")
svg = doc[0].get_svg_image(text_as_path=True)
```

This retains the original vector paths, colors, text appearance, and full figure
bounds. The existing `lmsm.svg` and `cosine_misleads.png` are Figure 2 in their
respective papers. The older `ocf.png` contains an earlier, shorter version of the
atlas overview. They remain available for existing references, but are not the
default selected-research figures.

The oral atlas graphical abstract is reproduced without alteration from the
author's article, under the article's stated CC BY-NC-ND 4.0 terms. See the linked
article's acknowledgments for the original BioRender and Servier component credits.
