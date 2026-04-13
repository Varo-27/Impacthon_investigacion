# <img src="frontend/public/logo.png" width="40" height="40" align="center" style="margin-right: 10px;"> Micafold

[![Hackathon](https://img.shields.io/badge/Impacthon-2026-blueviolet?style=for-the-badge)](https://github.com/JoseEstevez520/Impacthon_investigacion)
[![Award](https://img.shields.io/badge/Award-🥈%202nd%20Place-gold?style=for-the-badge)](https://github.com/JoseEstevez520/Impacthon_investigacion)
[![Target](https://img.shields.io/badge/Platform-CESGA%20HPC-brightgreen?style=for-the-badge)](https://www.cesga.es/)
[![AI-Powered](https://img.shields.io/badge/Powered%20by-ProteIA-orange?style=for-the-badge)](https://github.com/JoseEstevez520/Impacthon_investigacion)

**Micafold** bridges the gap between high-performance computing and biological intuition. Developed during **Impacthon 2026**, it is an AI-augmented platform designed for researchers to fold, visualize, and interpret protein structures with the power of CESGA infrastructure.

---

## 🌟 The Vision

Structural biology is often bottlenecked by terminal-heavy workflows and cryptic metrics. **Micafold** transforms this experience into a seamless, visual journey. 

This project aims to democratize access to AlphaFold2, allowing laboratory biologists to move from raw sequences to scientific discovery without opening a terminal.

## 🚀 Core Features

### 🤖 ProteIA: AI Research Assistant
Integrated throughout the workflow to translate data into biological insights:
- **Intelligent Reporting**: Automatically generates scientific summaries from folding results.
- **Contextual Chat**: Ask ProteIA about specific regions, mutations, or biological implications.
- **Error Diagnosis**: Translates complex HPC/Slurm errors into actionable biological advice.

### 🔬 Scientific Visual Intelligence
- **3D Interactive Viewer**: High-performance rendering of PDB/mmCIF structures using Mol*.
- **Metrics Interpretation**: Color-coded pLDDT (confidence) and PAE (aligned error) heatmaps translated into plain language.
- **One-Click Exports**: Download publication-ready reports and structural files.

### ⚡ HPC-Native via CESGA
Directly integrated with the **CESGA (Centro de Supercomputación de Galicia)** infrastructure:
- **Real-time Job Monitoring**: Track PENDING → RUNNING → COMPLETED status without SSH.
- **Enriched Metadata**: Automatic fetching of UniProt data, organism info, and experimental metrics.

---

## 🛠️ Technology Stack

- **Frontend**: [React 19](https://react.dev/), [Vite 8](https://vitejs.dev/)
- **UI/UX**: [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Visuals**: [3Dmol.js](https://3dmol.csb.pitt.edu/), [Mol*](https://molstar.org/)
- **AI Backend**: Gemini 1.5 Pro via specialized N8N workflows.
- **Database**: Cloud Firestore (NoSQL) for job tracking and persistence.

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Firebase Account (for database and authentication, optional for local UI testing)

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

## 👥 Team
Developed with ❤️ by the **Micafold Team** during **Impacthon 2026** at CESGA.

---

## 📄 Final Notes
This repository contains the full source code and research documentation for the Micafold platform. While the hackathon has concluded, the project remains as a proof-of-concept for the future of accessible structural biology in high-performance computing environments.
