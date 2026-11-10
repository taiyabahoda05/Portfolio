import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { ArrowDown, ArrowRight, ArrowUpRight, Brain, Braces, BriefcaseBusiness, Cloud, CodeXml, Cpu, Link, Mail, MapPin, Menu, Phone, X, Award, Download } from "lucide-react";
import "./style.css";

const projects = [
  {
    id: "01", name: "AI Conveyor Fault Detection", category: "INDUSTRIAL AI & COMPUTER VISION",
    image: "/1.png",
    description: "An automated computer vision system designed to inspect industrial conveyor assemblies and identify missing pins and wheel faults in real time.",
    bullets: ["Developed an object-detection pipeline using YOLOv8 for automated conveyor inspection.", "Collected and annotated images using Roboflow, then trained and validated the detection model.", "Achieved 98.6% mAP50 in the showcased production-testing result; designed an alarm workflow for detected faults."],
    tags: ["YOLOv8", "Python", "OpenCV", "Roboflow", "Computer Vision"],
    metric: "98.6%", metricLabel: "mAP50",
    githubUrl: "https://github.com/taiyabahoda05/Defect-Detection-in-Conveyor-Through-AI",
    primary: true
  },
  {
    id: "02", name: "OptiFare — Ride Fare Comparison", category: "FULL-STACK WEB & AI PREDICTIVE APP",
    image: "/2.png",
    description: "A comprehensive full-stack application comparing ride fares across competing mobility platforms in one unified interface, using map APIs for route calculation and AI models for future price forecasting.",
    bullets: ["Built with Next.js and MongoDB to unify fare comparisons into a single responsive screen.", "Integrated route-based distance calculation using map APIs.", "Designed backend AI logic to predict future peak and off-peak ride prices."],
    tags: ["Next.js", "MongoDB", "JavaScript", "REST APIs", "Map APIs"],
    metric: "Multi-Ride", metricLabel: "Platforms aggregated",
    live: true,
    githubUrl: "https://github.com/taiyabahoda05/OptiFare",
    demoUrl: "https://taiyaba-optifare.onrender.com",
    primary: true
  },
  {
  id: "03",name: "Generative AI & Full-Stack Development",category: "APPLIED AI & SOFTWARE ENGINEERING",
  image: "/3.png",
  description: "Explored Generative AI and modern LLM architectures, including LLM Engineering, Retrieval-Augmented Generation (RAG), QLoRA fine-tuning, and AI Agents, alongside hands-on development of full-stack applications and practical software utilities.",
  bullets: [
  "Completed the AI Engineer Core Track covering LLM Engineering, RAG, QLoRA, Fine-Tuning, and AI Agents.",
  "Explored Generative AI application development and modern LLM architectures.",
  "Gained hands-on experience with Microsoft Azure cloud services and Power BI dashboard development."
],
  tags: ["Generative AI","LLMs","RAG","QLoRA","AI Agents","React","Appwrite","Microsoft Azure","Power BI"],
  metric: "33.5h",metricLabel: "Course hours",
  coursework: true
},
{
  id: "04", name: "Blog", category: "FULL-STACK BLOGGING PLATFORM",
  image: "/4.png",
  visual: "BLOG", visualLabel: "BLOG",
  description: "A full-stack blogging platform with authenticated accounts, rich-text post creation, and image uploads, built on a modern React and Appwrite stack.",
  bullets: [
    "Secure user login and signup powered by Appwrite Authentication.",
    "Create, edit, and manage blog posts with the TinyMCE rich-text editor.",
    "Store post data in Appwrite Databases and upload images to Appwrite Storage.",
    "Manage application state with Redux Toolkit and navigate with React Router."
  ],
  tags: ["React 19", "Vite 8", "React Router 7", "Redux Toolkit", "Appwrite", "Appwrite Databases", "Appwrite Storage", "TinyMCE", "Tailwind CSS 4"],
  metric: "React 19", metricLabel: "Frontend",
  live: true,
  githubUrl: "https://github.com/taiyabahoda05/Blog",
  demoUrl: "https://taiyaba-blog.onrender.com",
  practiceBadge: true
},
{
  id: "05", name: "BitLinks — URL Shortener", category: "WEB APPLICATION",
  image: "/5.png",
  visual: "BITLINKS", visualLabel: "LINK",
  description: "A high-throughput URL shortener built to make long web addresses easier to share.",
  bullets: ["Developed a URL shortening application.", "Focused on handling URL-shortening requests efficiently."],
  tags: ["URL Shortener", "Web Application"],
  metric: "High-throughput", metricLabel: "URL shortening",
  live: true,
  githubUrl: "https://github.com/taiyabahoda05/BitLinks",
  demoUrl: "https://taiyaba-bitlinks.onrender.com",
  practiceBadge: true
},
{
  id: "06", name: "To-Do List Application", category: "PRODUCTIVITY APPLICATION",
  image: "/6.png",
  visual: "TODO", visualLabel: "TASKS",
  description: "A practical task-list application for keeping everyday to-dos organized.",
  bullets: ["Created an application for managing a to-do list."],
  tags: ["Task Management", "Web Application"],
  metric: "Task", metricLabel: "Management",
  live: true,
  githubUrl: "https://github.com/taiyabahoda05/To-Do-List",
  demoUrl: "https://to-do-site-px80.onrender.com",
  practiceBadge: true
},
{
  id: "07", name: "Practice & Utility Apps", category: "PRACTICE & UTILITY PROJECTS",
  image: "/7.png",
  visual: "PRACTICE", visualLabel: "TOOLS",
  description: "A pair of practical utilities: a random password generator and a live currency converter.",
  bullets: ["Generate random passwords.", "Convert values between currencies using live exchange rates."],
  tags: ["JavaScript", "Password Generator", "Currency Conversion", "Exchange Rates"],
  metric: "2", metricLabel: "Utility apps",
  practice: true
}
];
const skillGroups = [
  { icon: Brain, title: "AI & COMPUTER VISION", desc: "Object Detection, YOLOv11, OpenCV, Roboflow, Image Annotation, Real-time Visual Inspection, ML Fundamentals.", tags: ["YOLOv11", "OpenCV", "Roboflow", "Object Detection", "Machine Learning"] },
  { icon: Cpu, title: "GENERATIVE AI & LLMs", desc: "LLM Engineering, Retrieval-Augmented Generation (RAG), QLoRA Fine-Tuning, Autonomous AI Agents.", tags: ["RAG", "QLoRA", "AI Agents", "LLM Engineering", "Prompt Design"] },
  { icon: CodeXml, title: "FULL-STACK WEB & CLOUD", desc: "Python, Java, JavaScript, React, Next.js, MongoDB, REST & Map APIs, Microsoft Azure, Power BI, Git, GitHub.", tags: ["Python", "Java", "React", "Next.js", "MongoDB", "Azure", "Power BI", "Git"] }
];
const certifications = [
  ["AI Engineer Core Track: LLM Engineering, RAG, QLoRA, Agents", "Udemy · 8-week course, 33.5 hours"],
  ["Generative AI for All", "Physics Wallah & Microsoft"],
  ["Data Visualization with Python", "IBM Career Education Program"],
  ["IBM Cloud Fundamentals", "IBM Career Education Program"],
  ["Microsoft Azure & Cloud Administration", "Microsoft Elevate Internship"],
  ["Virtual Job Simulations: Deloitte Australia Cybersecurity & AWS Solutions Architecture", "Forage"],
  ["Database Management Systems (DBMS), Cryptography and Network Security, Introduction to Machine Learning", "NPTEL"],
];

function Header() {
  const [active, setActive] = useState("projects"), [open, setOpen] = useState(false);
  useEffect(() => {
    const ids = ["projects", "skills", "timeline", "about", "contact"];
    const obs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }), { rootMargin: "-35% 0px -55% 0px" });
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el) });
    return () => obs.disconnect();
  }, []);
  const links = [["PROJECTS", "projects"], ["SKILLS", "skills"], ["TIMELINE", "timeline"], ["ABOUT", "about"], ["CONTACT", "contact"]];
  return <header className="header"><a className="logo" href="#home">TH<span>.</span></a><button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button><nav className={open ? "nav open" : "nav"}>{links.map(([label, id]) => <a key={id} className={active === id ? "active" : ""} href={"#" + id} onClick={() => setOpen(false)}>{label}{id === "contact" && <i />}</a>)}</nav></header>
}
function SectionHead({ eyebrow, title, num, copy }) { return <div className="section-head"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><div className="section-side"><strong>{num}</strong>{copy && <p>{copy}</p>}</div></div> }
function Hero() {
  return <section className="hero wrap" id="home">
    <div className="hero-left"><span className="availability"><i /> OPEN TO TECHNOLOGY INTERNSHIPS AND JOBS</span>
      <h1>TAIYABA<br />HODA<span>.</span></h1>
      <p className="hero-role">Computer Science Student<br /><b>AI, Computer Vision & Full-Stack</b></p>
      <p className="degree">BCA (AI & DEEP LEARNING) · ARKA JAIN UNIVERSITY (IBM)</p>
      <div className="stats"><div><b>98.6%</b><small>MODEL mAP50</small></div><div><b>Tata Motors</b><small> INTERN</small></div><div><b>Full-Stack</b><small>DEVELOPMENT</small></div></div>
    </div>
    <div className="hero-art"><iframe src="/depth-robot.html?embed" title="Interactive depth robot" /><div className="art-caption">BASED IN JAMSHEDPUR, INDIA <span>●</span></div></div>
    <aside className="hero-aside"><div className="short-line" /><p>Detail-oriented BCA student building robust computer vision systems, generative AI workflows, and modern web applications that deliver measurable impact.</p><div className="hero-links"><a href="https://github.com/taiyabahoda05" target="_blank" rel="noreferrer">github.com/taiyabahoda05 <ArrowUpRight size={14} /></a><a href="https://www.linkedin.com/in/taiyaba-hoda-82505232b" target="_blank" rel="noreferrer"><Link size={15} /> LinkedIn Profile</a><a href="#projects">EXPLORE PROJECTS <ArrowDown size={14} /></a></div></aside>
  </section>
}
function Projects() {
  const [selected, setSelected] = useState(0), p = projects[selected];
  const showPracticeBadge = p.practice || p.practiceBadge;
  return <section id="projects" className="section wrap"><SectionHead eyebrow="SELECTED WORK" title="FEATURED PROJECTS" num="01" copy="A selection of applied AI, computer vision, and full-stack engineering work." />
    <div className="projects-layout"><div className="project-menu">{projects.map((item, i) => <button key={item.id} onClick={() => setSelected(i)} className={selected === i ? "selected" : ""}><small>{item.id}</small><b>{item.name}</b>{selected === i ? <span className="round-arrow"><ArrowRight size={17} /></span> : <ArrowUpRight size={17} />}</button>)}</div>
      <article className={`project-card${showPracticeBadge ? " project-card--practice" : ""}${p.live ? " project-card--live" : ""}${p.primary ? " project-card--primary" : ""}${p.coursework ? " project-card--coursework" : ""}${p.id === "05" ? " project-card--bitlinks" : ""}`}>{showPracticeBadge && <span className="practice-label practice-label--red">PRACTICE</span>}{p.primary && <span className="primary-label">PRIMARY</span>}{p.coursework && <span className="coursework-label">COURSEWORK</span>}{p.live && <span className={`live-label${showPracticeBadge || p.primary ? " live-label--with-badge" : ""}`}><i /> LIVE</span>}<div className="project-copy"><span className="eyebrow">{p.category}</span><h3>{p.name}</h3><p>{p.description}</p><h4>KEY HIGHLIGHTS</h4><ul>{p.bullets.map(b => <li key={b}>{b}</li>)}</ul><h4>TECH STACK & TAGS</h4><div className="tags">{p.tags.map(t => <span key={t}>{t}</span>)}</div>{!p.practice && (p.githubUrl || p.live) && <div className="project-actions">{p.githubUrl && <a className="github-project-link" href={p.githubUrl} target="_blank" rel="noreferrer" aria-label={`${p.name} GitHub repository`} title="Open GitHub repository"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.08c-3.1.67-3.76-1.31-3.76-1.31-.5-1.29-1.24-1.63-1.24-1.63-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.59 1.21 3.22.93.1-.72.39-1.21.7-1.49-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.15a10.6 0 0 1 5.55 0c2.11-1.45 3.05-1.15 3.05-1.15.61 1.53.23 2.67.11 2.95.71.78 1.15 1.78 1.15 3 0 4.29-2.61 5.24-5.1 5.51.4.35.75 1.03.75 2.08v3.09c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" /></svg></a>}{p.live && <a className="demo-project-link" href={p.demoUrl} target="_self" title="Open live demo">DEMO <ArrowUpRight size={14} /></a>}</div>}</div><div className={`project-image-wrap${p.image ? "" : " project-image-wrap--concept"}`}>{p.image ? <img className="project-image" src={p.image} alt={`${p.name} project illustration`} /> : <div className={`project-concept project-concept--${p.visual}`} aria-hidden="true"><span>{p.visualLabel}</span><b>{p.visual}</b></div>}<div className="visual-top"><small>METRICS & SCOPE</small><b>{p.metric}</b><span>{p.metricLabel}</span></div><div className="visual-lines" aria-hidden="true"><i /><i /><i /><i /></div><div className="visual-foot"><span>• PROJECT OVERVIEW</span><span>• ENGINEERING & IMPLEMENTATION</span><span>• APPLIED TECHNOLOGY</span></div></div></article>
    </div>
  </section>
}
function Skills() {
  return <section id="skills" className="section wrap"><SectionHead eyebrow="TECHNICAL TOOLKIT" title={<>SKILLS &<br />COMPETENCIES</>} num="02" />
    <div className="skills-layout"><div className="skill-list">{skillGroups.map(({ icon: Icon, title, desc, tags }) => <article className="skill-card" key={title}><h3><Icon size={17} />{title}</h3><p>{desc}</p><div className="tags">{tags.map(t => <span key={t}>{t}</span>)}</div></article>)}</div>
      <div className="venn"><div className="circle cv"><b>COMPUTER VISION</b><small>YOLO · OpenCV</small></div><div className="circle gen"><b>GEN AI</b><small>RAG · Agents · QLoRA</small></div><div className="circle full"><b>FULL-STACK</b><small>Next.js · Python · Azure</small></div></div>
      <div className="certs"><h3><Award size={17} /> VERIFIED CERTIFICATIONS</h3>{certifications.map(([a, b]) => <article className="cert" key={a}><b>{a}</b><small>{b}</small></article>)}</div></div></section>
}
function Timeline() {
  return <section id="timeline" className="section wrap"><SectionHead eyebrow="THE JOURNEY SO FAR" title="EDUCATION & EXPERIENCE" num="03" copy="Building a foundation in computer science while applying technology to real-world problems." />
    <div className="timeline-track">{[["2020 – 2021", "School education"], ["2022 – 2023", "Higher secondary"], ["2024 – 2027", "BCA · AI & Deep Learning"], ["Jan – Feb 2026", "Microsoft Azure"], ["May – Jun 2026", "Tata Motors"]].map((x, i) => <div className={i === 2 ? "track-point current" : "track-point"} key={x[0]}><b>{x[0]}</b><i /><small>{x[1]}</small></div>)}</div>
    <div className="experience-grid"><article className="experience-card"><div className="card-meta"><span className="pill red">INDUSTRIAL AI · MAY – JUN 2026</span><b>Hybrid</b></div><h3>AI & Computer Vision Intern</h3><b className="company">TATA MOTORS</b><p>Engineered an automated industrial conveyor inspection system using YOLOv8 Nano to detect missing components and identify assembly defects, reducing manual inspection and minimizing human involvement in hazardous, confined spaces.</p><ul><li>Dataset collection and annotation with Roboflow</li><li>Model training, validation and OpenCV integration</li><li>Real-time fault alerts and inspection workflow</li></ul><a className="experience-link" href="https://lnkd.in/p/dmsXmPfH" target="_blank" rel="noreferrer" aria-label="LinkedIn profile"><span className="linkedin-mark" aria-hidden="true">in</span></a></article>
      <article className="experience-card"><div className="card-meta"><span className="pill blue">CLOUD & BI · JAN – FEB 2026</span><b>Virtual</b></div><h3>Virtual Cloud Intern</h3><b className="company blue-text"><Cloud size={14} /> MICROSOFT AZURE</b><p>Hands-on cloud engineering experience configuring enterprise cloud infrastructure, security, identity, and analytics pipelines.</p><ul><li>Explored Azure VMs, Blob Storage, and Virtual Networks</li><li>Worked with cloud administration fundamentals</li><li>Completed Power BI business application training</li></ul><a className="experience-link" href="https://lnkd.in/p/dfayNp-x" target="_blank" rel="noreferrer" aria-label="LinkedIn profile"><span className="linkedin-mark" aria-hidden="true">in</span></a></article></div>
    <div className="education-card"><span className="eyebrow">EDUCATION</span><h3>Bachelor of Computer Applications</h3><b>ARKA JAIN UNIVERSITY · IN ASSOCIATION WITH IBM</b><p>BCA — Artificial Intelligence & Deep Learning · 2024–2027</p><p>CGPA: 9.260</p></div>
    <div className="education-card"><span className="eyebrow">SCHOOL EDUCATION</span><h3>Jusco School South Park</h3><b>SECONDARY & HIGHER SECONDARY</b><p>Class X: 89.6%</p><p>Class XII: 90% · PCB Stream</p></div>
  </section>
}
function About() {
  return <section id="about" className="section wrap about-section">  <div className="about-copy"><span className="eyebrow">BIOGRAPHY</span><h2>ABOUT TAIYABA HODA</h2><p>I am a detail-oriented BCA student specializing in Artificial Intelligence & Deep Learning at Arka Jain University in collaboration with IBM. My core passion lies in translating modern machine learning research into dependable, real-world industrial and software solutions.</p><p>During my internship at Tata Motors, I spearheaded the development of an automated YOLOv8 inspection pipeline with 98.6% mAP50 accuracy on assembly conveyors. Additionally, through virtual cloud training with Microsoft Azure and deep dives into Generative AI (LLMs, RAG, and AI Agents), I enjoy bridging backend cloud infrastructure with modern user-facing applications.</p><p>I am actively seeking technology internship and job opportunities where I can contribute to high-impact computer vision, software engineering, and AI projects.</p><a className="outline-btn" href="/Taiyaba_Hoda_Resume.pdf" target="_blank" rel="noreferrer">VIEW RESUME <ArrowUpRight size={15} /></a></div>
    <div className="contact-panel"><span className="eyebrow">LOCATION & CONTACT</span><h3><MapPin /> Jamshedpur, Jharkhand, India</h3><p><Phone /> +91 8235521002</p><div className="panel-bottom"><div><small>DIRECT EMAIL</small><a href="mailto:taiyabahoda05@gmail.com"><Mail /><span>taiyabahoda05@gmail.com</span></a></div><div><small>PROFESSIONAL NETWORKS</small><p><a href="https://www.linkedin.com/in/taiyaba-hoda-82505232b" target="_blank" rel="noreferrer"><Link /> LinkedIn</a><a href="https://github.com/taiyabahoda05" target="_blank" rel="noreferrer"><Link /> GitHub</a></p></div></div></div></section>
}
function Contact() {
  const [modal, setModal] = useState(false);
  return <><section id="contact" className="section wrap contact-section"><div className="connect-card"><h2>LET'S<br />CONNECT<span>.</span></h2><p>Interested in discussing technology internships, AI research, computer vision projects, or software collaboration? Let's talk.</p><hr /><small>PRIMARY EMAIL</small><a href="mailto:taiyabahoda05@gmail.com">taiyabahoda05@gmail.com</a></div><div className="contact-cta"><strong>04</strong><p>Send an inquiry directly through this quick form. I respond promptly to recruiter and collaboration messages.</p><button className="primary-btn" onClick={() => setModal(true)}>SEND MESSAGE <ArrowRight size={17} /></button></div></section>
    <footer className="footer wrap"><b>TAIYABA HODA</b><span>© 2026</span><div><a href="https://github.com/taiyabahoda05" target="_blank" rel="noreferrer">GitHub</a><a href="https://www.linkedin.com/in/taiyaba-hoda-82505232b" target="_blank" rel="noreferrer">LinkedIn</a><a href="mailto:taiyabahoda05@gmail.com">Email</a></div></footer>
    {modal && <div className="modal-backdrop" onClick={() => setModal(false)}><form className="modal" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); const d = new FormData(e.currentTarget); const subject = encodeURIComponent(d.get("subject")); const body = encodeURIComponent(`Name: ${d.get("name")}\\nEmail: ${d.get("email")}\\n\\n${d.get("message")}`); window.location.href = `mailto:taiyabahoda05@gmail.com?subject=${subject}&body=${body}`; }}><button type="button" className="modal-close" onClick={() => setModal(false)}><X /></button><span className="eyebrow">CONTACT FORM</span><h2>SEND A MESSAGE</h2><label>Your name<input name="name" required placeholder="Enter your name" /></label><label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label><label>Subject<input name="subject" required placeholder="Internship opportunity" /></label><label>Message<textarea name="message" required rows="4" placeholder="Write your message..." /></label><button className="primary-btn" type="submit">OPEN EMAIL APP <ArrowRight size={16} /></button><small>This form opens your email application to send the message.</small></form></div>}</>
}
function App() {
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    const sections = document.querySelectorAll("main > section, .footer");
    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" }
    );

    sections.forEach(section => {
      section.classList.add("motion-section");
      observer.observe(section);
    });

    return () => {
      observer.disconnect();
      sections.forEach(section => {
        section.classList.remove("motion-section", "is-visible");
      });
    };
  }, []);

  return <><div className="top-rule" /><Header /><main><Hero /><Projects /><Skills /><Timeline /><About /><Contact /></main></>;
}
createRoot(document.getElementById("root")).render(<App />);