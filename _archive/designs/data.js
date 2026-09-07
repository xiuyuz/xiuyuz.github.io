// Academic content shared by the local design studies.
// Advisor, group, and education details supplied by XiuYu.
import {getEmail} from './contact-email.js';
const introduction = {
  "personal": "Hi! I’m a first year Computer Science Ph.D. student in the <a href=\"https://www.nextcenter.org/\">NExT++ Research Centre</a> at the <a href=\"https://www.comp.nus.edu.sg/\">National University of Singapore</a>. I’m broadly interested in developing effective, robust, and safe AI systems that can understand, reason about, and interact with the world in ways inspired by human intelligence, across language, vision, and potentially other modalities.",
  "advisors": "I am co-advised by <a href=\"https://www.chuatatseng.com/\">Chua Tat-Seng</a> and <a href=\"https://www.comp.nus.edu.sg/~liangzk/\">Zhenkai Liang</a>. In addition to the NExT++ Research Centre, I am also a member of the <a href=\"https://curiosity.comp.nus.edu.sg/\">CuriOSity Research Group</a>.",
  "research": "My recent research focuses on reasoning in AI systems, with an emphasis on understanding how reasoning and abstraction arise from learned representations, and how these processes can be made more reliable, verifiable, and safe. I am particularly interested in approaches that improve the correctness and trustworthiness of AI behavior while maintaining strong performance. More broadly, my research interests include:",
  "interests": [
    "Understanding how different modalities contribute to learning, knowledge representation and reasoning in AI systems",
    "Developing robust methods for knowledge extraction and verification across modalities",
    "Building integrated AI systems that can coordinate multiple capabilities to solve complex tasks safely and effectively"
  ],
  "education": "Before pursuing my Ph.D., I received my Master’s degree in Electrical Engineering and Computer Science from the <a href=\"https://eecs.berkeley.edu/\">University of California, Berkeley</a> and my Honours Bachelor’s degree in Computer Science from the <a href=\"https://web.cs.toronto.edu/\">University of Toronto</a>."
};
const paragraph = (html, className = '') => `<p${className ? ` class="${className}"` : ''}>${html}</p>`;
const researchIntroduction = paragraph(introduction.research) + `<ol>${introduction.interests.map(item => `<li>${item}</li>`).join('')}</ol>`;

export const data = {
  "name": "XiuYu Zhang",
  "lastUpdated": "2026-09-07",
  "role": "Ph.D. Student · Computer Science",
  "institution": "National University of Singapore",
  "lab": "NExT++ Research Centre",
  get email() { return getEmail(); },
  "bio": "I study how AI systems reason, represent knowledge, and interact with the world. My research focuses on making their behavior more reliable, verifiable, and safe—across language, vision, and beyond.",
  "interests": [
    "Reasoning & representation",
    "AI safety & alignment",
    "Multimodal intelligence"
  ],
  "selectedPaperKeys": ["lmsm", "see", "cosine_misleads", "alphaalign", "ocf"],
  "papers": [
    {
      "key": "lmsm",
      "title": "LMSM: LLM Security Framework Inspired by Linux Security Modules",
      "authors": "XiuYu Zhang, Bonan Ruan, Junfeng Fang, An Zhang, Tat-Seng Chua, Zhenkai Liang",
      "year": "2026",
      "venue": "arXiv preprint",
      "tag": "Preprint",
      "url": "https://arxiv.org/abs/2608.25697",
      "image": "/assets/img/publication_preview/lmsm-figure1.svg",
      "summary": "LMSM brings a modular security architecture to language-model serving.",
      "carouselExcerpt": "We present Language Model Security Modules (LMSM), a security framework that adapts the separation behind Linux Security Modules (LSM) to LLM serving. In LMSM, a selected security backend exposes calibrated evidence, a versioned policy evaluates active rules over trusted per-request context, and a separate gate authorizes buffered output release. This design separates mediation correctness from policy effectiveness, and it allows backend, rule, or schedule changes without rebuilding request handling or enforcement.",
      "abstract": "Large language models (LLMs) are increasingly deployed with layered defenses, yet malicious prompts can still bypass them. Interpretability methods can expose model-internal signals along the generation path that could inform enforcement, but these signals are not security controls by themselves. Deployments that adapt them for safety typically couple each signal to its own calibration, policy logic, and intervention code, so each new artifact creates integration work instead of strengthening a shared defense. We present Language Model Security Modules (LMSM), a security framework that adapts the separation behind Linux Security Modules (LSM) to LLM serving. In LMSM, a selected security backend exposes calibrated evidence, a versioned policy evaluates active rules over trusted per-request context, and a separate gate authorizes buffered output release. This design separates mediation correctness from policy effectiveness, and it allows backend, rule, or schedule changes without rebuilding request handling or enforcement. Our prototype shows the separation working in practice: with Hugging Face Transformers and continuously batched vLLM, the same substrate hosts artifact-backed sparse autoencoder (SAE) and transcoder deployments and task-fitted dense probes, preserves request-specific decisions under scheduler churn, and selectively enforces and composes multiple rules per request. On Qwen3-4B, LMSM-Checkpoint reduces HarmBench attack success rate from 39.20% to 3.32%, with XSTest false refusals rising from 2.40% to 4.40%, while retaining 98.14% of the throughput of a matched serving path that performs no monitoring work at 32 active sequences. LMSM gives advances in interpretability and model-internal analysis a common path to runtime enforcement.",
      "code": "https://github.com/xiuyuz/LMSM"
    },
    {
      "key": "see",
      "title": "Self-Evaluation Is Already There: Eliciting Latent Judge Calibration in Base LLMs with Minimal Data",
      "authors": "XiuYu Zhang, Yi Shan, Junfeng Fang, Zhenkai Liang",
      "year": "2026",
      "venue": "Findings of the Association for Computational Linguistics: EMNLP 2026",
      "tag": "EMNLP Findings",
      "status": "accepted",
      "url": "https://arxiv.org/abs/2606.05122",
      "image": "/assets/img/publication_preview/see.png",
      "summary": "This work studies whether language models can anticipate the quality scores assigned to their own answers by external model judges.",
      "carouselExcerpt": "We introduce Self-Evaluation Elicitation (SEE), a method that surfaces this latent ability through a short cycle comprising a calibration-coupled reinforcement learning phase that improves the answer and predicts the judge, followed by a masked distillation phase that sharpens the prediction while leaving the answer untouched. From 160 unique examples, roughly 31x fewer than a reinforcement learning baseline, SEE improves held-out calibration across three benchmarks while preserving answer quality. These results reframe judge-aligned self-evaluation as a problem of elicitation rather than acquisition.",
      "abstract": "Large language models are increasingly evaluated by other models, raising a natural question: can a model predict how a judge will score its own output? We find that the ability is largely present before any targeted training: prompted few-shot, a base model already predicts an external judge's multi-attribute quality scores on open-ended responses well above chance across three benchmarks. We introduce Self-Evaluation Elicitation (SEE), a method that surfaces this latent ability through a short cycle comprising a calibration-coupled reinforcement learning phase that improves the answer and predicts the judge, followed by a masked distillation phase that sharpens the prediction while leaving the answer untouched. From 160 unique examples, roughly 31x fewer than a reinforcement learning baseline, SEE improves held-out calibration across three benchmarks while preserving answer quality. The elicited self-evaluation is sharply localized within the model's own token distribution and stable across judges it was never trained against, indicating a transferable notion of quality rather than a single judge's preference. These results reframe judge-aligned self-evaluation as a problem of elicitation rather than acquisition.",
      "code": "https://github.com/YiShan05/SEE_official"
    },
    {
      "key": "cosine_misleads",
      "title": "Cosine Misleads: Auxiliary Losses Reshape Vision Language Models, Not Their Latents",
      "authors": "XiuYu Zhang, Junfeng Fang, Zhenkai Liang",
      "year": "2026",
      "venue": "arXiv preprint",
      "tag": "Preprint",
      "url": "https://arxiv.org/abs/2606.05753",
      "image": "/assets/img/publication_preview/cosine_misleads-figure1.svg",
      "summary": "This study tests whether aligning supervised latent tokens with visual targets improves reasoning in vision-language models.",
      "carouselExcerpt": "Latent visual reasoning (LVR) inserts supervised latent tokens between perception and answer generation in vision-language models (VLMs). The field uses alignment between these latents and their visual targets, i.e., cosine similarity or mean squared error (MSE), as both the training loss and the quality metric, assuming that better alignment yields a better answer. We test this with a designed matrix of five LVR variants and find the assumption inverted: cosine alignment is negatively correlated with accuracy across all five (r=-0.94).",
      "abstract": "Latent visual reasoning (LVR) inserts supervised latent tokens between perception and answer generation in vision-language models (VLMs). The field uses alignment between these latents and their visual targets, i.e., cosine similarity or mean squared error (MSE), as both the training loss and the quality metric, assuming that better alignment yields a better answer. We test this with a designed matrix of five LVR variants and find the assumption inverted: cosine alignment is negatively correlated with accuracy across all five (r=-0.94). To explain this, we introduce PRISM, a pair of inference-time diagnostics: a linear probe that asks where the answer is decodable, and a corruption test that asks whether the latent is load-bearing. The supervised latents are largely bypassed. Corrupting them shifts accuracy by at most four points. The answer is decodable downstream of the latent but not at it, and the size of this decodability gap predicts how much each variant relies on its latent under perturbation. Consistent with an Information Bottleneck reading of the loss, the auxiliary objective reshapes the language model via shared parameters rather than via the latent variable it nominally optimizes.",
      "code": "https://github.com/xiuyuz/cosine-misleads"
    },
    {
      "key": "alphaalign",
      "title": "AlphaAlign: Incentivizing Safety Alignment with Extremely Simplified Reinforcement Learning",
      "authors": "Yi Zhang, An Zhang, XiuYu Zhang, Leheng Sheng, Yuxin Chen, Zhenkai Liang, Xiang Wang",
      "year": "2026",
      "venue": "The Fourteenth International Conference on Learning Representations",
      "tag": "ICLR",
      "status": "accepted",
      "url": "https://openreview.net/forum?id=2XNb1JUKW3",
      "image": "/assets/img/publication_preview/alphaalign.png",
      "summary": "Large language models (LLMs), despite possessing latent safety understanding from their vast pretraining data, remain vulnerable to generating harmful content and exhibit issues such as over-refusal and utility degradation after safety alignment.",
      "carouselExcerpt": "We propose AlphaAlign, a simple yet effective pure reinforcement learning (RL) framework with verifiable safety reward designed to incentivize this latent safety awareness through proactive safety reasoning. AlphaAlign employs a dual-reward system: a verifiable safety reward encourages correctly formatted and explicitly justified refusals for harmful queries while penalizing over-refusals, and a normalized helpfulness reward guides high-quality responses to benign inputs. This allows the model to develop proactive safety reasoning capabilities without depending on supervised safety-specific reasoning data.",
      "abstract": "Large language models (LLMs), despite possessing latent safety understanding from their vast pretraining data, remain vulnerable to generating harmful content and exhibit issues such as over-refusal and utility degradation after safety alignment. Current safety alignment methods often result in superficial refusal shortcuts or rely on intensive supervision for reasoning-based approaches, failing to fully leverage the model's intrinsic safety self-awareness. We propose AlphaAlign, a simple yet effective pure reinforcement learning (RL) framework with verifiable safety reward designed to incentivize this latent safety awareness through proactive safety reasoning. AlphaAlign employs a dual-reward system: a verifiable safety reward encourages correctly formatted and explicitly justified refusals for harmful queries while penalizing over-refusals, and a normalized helpfulness reward guides high-quality responses to benign inputs. This allows the model to develop proactive safety reasoning capabilities without depending on supervised safety-specific reasoning data. AlphaAlign demonstrates three key advantages: (1) Simplicity and efficiency, requiring only binary prompt safety labels and minimal RL steps for substantial improvements. (2) Breaking the safety-utility trade-off, by enhancing refusal of harmful content and reducing over-refusals, while simultaneously maintaining or even improving general task performance and robustness to unseen jailbreaks. (3) Deep alignment, fostering proactive safety reasoning that generates explicit safety rationales rather than relying on shallow refusal patterns.",
      "code": "https://github.com/zy20031230/AlphaAlign"
    },
    {
      "key": "ocf",
      "title": "An integrated single-cell and spatial proteotranscriptomics atlas of fibroblast-driven immunoregulation within the human adult oral cavity",
      "authors": "Bruno F. Matuck, Khoa L. A. Huynh, Diana Pereira, Quinn T. Easter, XiuYu Zhang, Meik Kunz, Nikhil Kumar, Aditya Pratapa, Brittany T. Rupp, Ameer Ghodke, Alexander V. Predeus, Alexandre Fernandes, Lili Szabó, Stefan Hartmann, Nadja Harnischfeger, Zohreh Khavandgar, Margaret Beach, Paola Perez, Benedikt Nilges, Maria M. Moreno, Kang I. Ko, Rohit Singh, Purushothama Rao Tata, Sarah A. Teichmann, Adam Kimple, Sarah Pringle, Kai Kretzschmar, Blake M. Warner, Inês Sequeira, Jinze Liu, Kevin M. Byrd",
      "year": "2026",
      "venue": "Cell Press Blue",
      "tag": "Cell Press Blue",
      "status": "published",
      "url": "https://doi.org/10.1016/j.cpblue.2026.100007",
      "image": "/assets/img/publication_preview/ocf-featured.jpg",
      "summary": "This study combines single-cell RNA sequencing with spatial protein and RNA measurements to map immune organization across adult oral tissues.",
      "carouselExcerpt": "We present an integrated single-cell and spatial proteotranscriptomic atlas profiling >250,000 single-cell transcriptomes and >4 million spatially resolved cells across 13 niches. Using our AI-enabled AstroSuite, we defined neighborhoods and interaction modules, revealing peri-epithelial fibroblast-centered hubs enriched in effector cytokines. Together, this atlas identifies fibroblasts as central regulators of structural immunity and provides a scalable framework to target stromal-immune interactions across barrier organs.",
      "abstract": "The immunoregulatory architecture of human oral tissues remains poorly defined. We present an integrated single-cell and spatial proteotranscriptomic atlas profiling >250,000 single-cell transcriptomes and >4 million spatially resolved cells across 13 niches. Using our AI-enabled AstroSuite, we defined neighborhoods and interaction modules, revealing peri-epithelial fibroblast-centered hubs enriched in effector cytokines. We harmonized fibroblast subtypes (universal, immune, peri-epithelial, peri-vascular, peri-neural, antigen-presenting cell [APC]-like, stress responsive, and myofibroblasts) with stress-responsive subtypes partitioning between mucosae and glands (type I and II). Spatial multiomics mapped ligand-receptor programs and identified mucosal stress-responsive fibroblasts as putative immunoregulatory hubs. Niche-aware integration of healthy and diseased datasets revealed fibroblast rewiring into inflammatory and reparative niches. Disease neighborhoods exhibited expansion of major histocompatibility complex (MHC)-I+, MHC-II+, and programmed cell death ligand 1 (PD-L1)+ fibroblasts and predicted spatial engagement with T cells at tertiary lymphoid structures. Together, this atlas identifies fibroblasts as central regulators of structural immunity and provides a scalable framework to target stromal-immune interactions across barrier organs.",
      "code": ""
    },
    {
      "key": "starcomm",
      "title": "STARComm Scalably Detects Emergent Modules of Spatial Cell-Cell Communication in Inflammation and Cancer",
      "authors": "Khoa L. A. Huynh, Bruno F. Matuck, Deiziane Souza, XiuYu Zhang, Giancarlo Fatobene, Luiz Alberto Valente Soares Junior, Luiz Fernando Silva, Vanderson Geraldo Rocha, Kevin M. Byrd, Jinze Liu",
      "year": "2025",
      "venue": "bioRxiv preprint",
      "tag": "Preprint",
      "url": "https://www.biorxiv.org/content/10.1101/2025.08.07.669133v1",
      "image": "",
      "summary": "STARComm identifies spatial patterns of intercellular signaling from two- and three-dimensional transcriptomic data by grouping co-located ligand-receptor activity into multicellular communication modules.",
      "code": ""
    },
    {
      "key": "zhang2024advancing",
      "title": "Advancing Conversational Psychotherapy: Integrating Privacy, Dual-Memory, and Domain Expertise with Large Language Models",
      "authors": "XiuYu Zhang, Zening Luo",
      "year": "2024",
      "venue": "NeurIPS Workshop on Statistical Frontiers in LLMs and Foundation Models",
      "tag": "SFLLM@NeurIPS 2024",
      "url": "https://neurips.cc/virtual/2024/105608",
      "image": "/assets/img/publication_preview/soulspeak.png",
      "summary": "Mental health has increasingly become a global issue that reveals the limitations of traditional conversational psychotherapy, constrained by location, time, expense, and privacy concerns.",
      "code": ""
    },
    {
      "key": "10347512",
      "title": "Learning-Based Auction for Matching Demand and Supply of Holographic Digital Twin Over Immersive Communications",
      "authors": "XiuYu Zhang, Minrui Xu, Rui Tan, Dusit Niyato",
      "year": "2024",
      "venue": "IEEE Transactions on Multimedia",
      "tag": "IEEE TMM",
      "url": "https://ieeexplore.ieee.org/document/10347512",
      "image": "/assets/img/publication_preview/dda.png",
      "summary": "Digital Twin (DT) technologies create digital models of physical entities frequently in multimedia forms, which are crucial for concurrent simulation and analysis of real-world systems.",
      "code": ""
    },
    {
      "key": "pcpp_preprint",
      "title": "Partially Conditioned Patch Parallelism for Accelerated Diffusion Model Inference",
      "authors": "XiuYu Zhang, Zening Luo, Michelle E. Lu",
      "year": "2024",
      "venue": "Preprint",
      "tag": "Preprint",
      "url": "https://arxiv.org/abs/2412.02962",
      "image": "/assets/img/publication_preview/pcpp.png",
      "summary": "Diffusion models have exhibited exciting capabilities in generating images and are also very promising for video creation.",
      "code": ""
    },
    {
      "key": "clas",
      "title": "CLAS : A Machine Learning Enhanced Framework for Exploring Large 3D Design Datasets",
      "authors": "XiuYu Zhang, Xiaolei Ye, Jui–Che Chang, Yue Fang",
      "year": "2024",
      "venue": "Report",
      "tag": "Report",
      "url": "https://arxiv.org/abs/2412.02996",
      "image": "/assets/img/publication_preview/clas.png",
      "summary": "Three-dimensional (3D) objects have wide applications.",
      "code": ""
    }
  ],
  "education": [
    {
      "school": "National University of Singapore",
      "logo": "/assets/img/education/nus-logo.png",
      "degree": "Ph.D. in Computer Science",
      "years": "Jan. 2026 — present",
      "department": "School of Computing | NExT++ Research Centre | CuriOSity Research Group"
    },
    {
      "school": "University of California, Berkeley",
      "logo": "/assets/img/UC-Berkeley-Symbol.png",
      "degree": "M.Eng. in Electrical Engineering & Computer Science",
      "years": "Aug. 2023 — May 2024",
      "department": "Department of Electrical Engineering and Computer Science"
    },
    {
      "school": "University of Toronto",
      "logo": "/assets/img/UofT_Logo.png",
      "degree": "Honours B.Sc. in Computer Science",
      "years": "Sept. 2019 — June 2022",
      "department": "Department of Computer Science | Trinity College"
    }
  ],
  "scholarUrl": "https://scholar.google.com/citations?user=-7oao10AAAAJ",
  "githubUrl": "https://github.com/xiuyuz",
  "introductionHtml": [paragraph(introduction.personal), paragraph(introduction.advisors), researchIntroduction, paragraph(introduction.education)].join('\n'),
  "advisors": [
    {
      "name": "Chua Tat-Seng",
      "url": "https://www.chuatatseng.com/"
    },
    {
      "name": "Zhenkai Liang",
      "url": "https://www.comp.nus.edu.sg/~liangzk/"
    }
  ],
  "groups": [
    {
      "name": "NExT++ Research Centre",
      "url": "https://www.nextcenter.org/",
      "logo": "/assets/img/affiliations/next-logo.png",
      "logoWidth": 247,
      "logoHeight": 80
    },
    {
      "name": "CuriOSity Research Group",
      "url": "https://curiosity.comp.nus.edu.sg/",
      "logo": "/assets/img/affiliations/curiosity-logo.png",
      "logoWidth": 598,
      "logoHeight": 166
    }
  ],
  "aboutPersonalHtml": paragraph(`Hi! I’m a first-year Computer Science Ph.D. student in the <a href="https://www.nextcenter.org/">NExT++ Research Centre</a> at the <a href="https://www.comp.nus.edu.sg/">National University of Singapore</a>, co-advised by <a href="https://www.comp.nus.edu.sg/~liangzk/">Prof. Zhenkai Liang</a> and <a href="https://www.chuatatseng.com/">Prof. Tat-Seng Chua</a>. I am also a member of the <a href="https://curiosity.comp.nus.edu.sg/">CuriOSity Research Group</a>. I’m broadly interested in developing effective, robust, and safe AI systems that can understand, reason about, and interact with the world in ways inspired by human intelligence, across language, vision, and potentially other modalities. ${introduction.education}`) + paragraph('<strong>I’m open to new collaborations.</strong> If you’re interested in my research or would like to work together, please feel free to <button class="ct-contact-trigger" type="button" data-contact-open>get in touch</button>.', 'ct-collaboration'),
  "aboutResearchHtml": researchIntroduction
};
