# <img src="frontend/public/logo.png" width="40" height="40" align="center" style="margin-right: 10px;"> Micafold

[![Hackathon](https://img.shields.io/badge/Impacthon-2026-blueviolet?style=for-the-badge)](https://github.com/JoseEstevez520/Impacthon_investigacion)
[![Target](https://img.shields.io/badge/Platform-CESGA%20HPC-brightgreen?style=for-the-badge)](https://www.cesga.es/)
[![AI-Powered](https://img.shields.io/badge/Powered%20by-ProteIA-orange?style=for-the-badge)](https://github.com/JoseEstevez520/Impacthon_investigacion)

> [!CAUTION]
> **Project Status:** This application is **no longer functional**. The system relied on a **CESGA Mock API** that was retired after the event concluded. The code is maintained for documentation and portfolio purposes only.

> **Micafold** bridges the gap between high-performance computing and biological intuition. An AI-augmented platform designed for researchers to fold, visualize, and interpret protein structures with the power of CESGA infrastructure.

---

## 🌟 The Vision

Structural biology is often bottlenecked by terminal-heavy workflows and cryptic metrics. **Micafold** transforms this experience into a seamless, visual journey. 

Whether you are a laboratory biologist without terminal access or a CESGA power user managing dozens of jobs, Micafold provides the tools to move from raw sequences to scientific discovery.

## 🚀 Key Pillars

### 🤖 ProteIA: Your AI Research Partner
Forget interpreting raw logs. **ProteIA** (Protein Intelligent Assistant) is integrated throughout the workflow:
- **Natural Language Input**: Describe your protein or mutation in plain Spanish/English, and let ProteIA prepare the FASTA.
- **Intelligent Reporting**: Automatically generates scientific summaries and abstract-ready insights from folding results.
- **Error Diagnosis**: Translates complex HPC/Slurm errors into actionable biological advice.

### 🔬 Scientific Visual Intelligence
- **3D Interactive Viewer**: High-performance rendering of PDB/mmCIF structures using Mol*.
- **Metrics Interpretation**: Color-coded pLDDT (confidence) and PAE (aligned error) heatmaps translated into "human language" (e.g., *"High confidence in the catalytic domain"*).
- **One-Click Exports**: Download publication-ready PDF reports, structural files, and raw metrics.

### ⚡ HPC-Native via CESGA
Built to scale on the **CESGA (Centro de Supercomputación de Galicia)** infrastructure:
- **Real-time Job Monitoring**: Track your PENDING → RUNNING → COMPLETED status without SSH.
- **Input Cleaning**: Intelligent FASTA normalization that prevents 95% of server-side crashes.
- **Resource Optimized**: Seamless integration with AlphaFold2 and ESMFold pipelines.

---

## 🛠️ Technology Stack

Micafold is built with a commitment to performance, reliability, and aesthetics:

- **Frontend**: [React 19](https://react.dev/), [Vite 8](https://vitejs.dev/)
- **UI/UX**: [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Visuals**: [3Dmol.js](https://3dmol.csb.pitt.edu/), [Mol*](https://molstar.org/), [Plotly](https://plotly.com/)
- **AI Backend**: Gemini 1.5 Pro via [n8n](https://n8n.io/) Webhooks
- **Infrastructure**: Firebase (Configuration & Hosting) + CESGA Slurm API

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/JoseEstevez520/Impacthon_investigacion.git
   cd Impacthon_investigacion
   ```
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🗺️ Roadmap
- [ ] **Mobile AR Support**: Scan a QR code to see your protein prediction in Augmented Reality.
- [ ] **In-Silico Mutation Analysis**: Predict stability changes (DDG) for single-point mutations on the fly.
- [ ] **Institutional SSO**: Integration with USC/CSIC IDs for seamless multi-device history.
- [ ] **Knowledge Graph**: Connecting 3D structures with disease pathways and drug binding sites.

---

## 👥 Team
Developed with ❤️ during the **Impacthon 2026** at CESGA.

---

## 📄 Acknowledgments
Special thanks to the **CESGA** team for providing the world-class infrastructure and to the organizers of **Impacthon 2026** for fostering innovation at the intersection of biology and technology.
