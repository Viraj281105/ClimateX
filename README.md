# 📈 ClimateX

**A Real-Time Climate Intelligence & Policy Impact Platform, built for India.**

*Project for the PCCOE IGC Hackathon (Demo Due: Nov 15th)*

---

## 🎯 Hackathon Goal: An "India-First" Intelligence Platform

Our goal is to move beyond generic global dashboards. ClimateX is a lean, modular platform optimized for the hackathon by focusing on **India-specific datasets** to deliver **causal insights** and **actionable policy recommendations**.

We are building four key modules to demonstrate this:

1.  **Real-Time India Dashboard:** A live geospatial dashboard showing rainfall, emissions, and crop data from Indian sources (IMD, CPCB).
2.  **Causal Policy Engine:** A "DoWhy-lite" engine to answer counterfactual questions like, *"What would be the causal impact on Delhi's AQI if Policy X was adopted?"*
3.  **Live Sentiment Analyzer:** A lightweight BERT model to track public sentiment on climate issues, state-by-state, using Twitter and news data.
4.  **Policy Recommender:** A RAG-based pipeline to suggest relevant, proven policies for different Indian states based on their unique climate challenges.

## 🏛️ System Architecture

We are using a simplified 5-layer design to build a fast, modular, and deployable demo.

1.  **Presentation Layer (Frontend):** React.js, Mapbox, and Recharts for a fully interactive UI.
2.  **Application Layer (Backend):** A high-speed FastAPI backend to serve data and control model execution.
3.  **Intelligence Layer (AI/ML):** A set of containerized services for Causal Inference (DoWhy), NLP (HuggingFace BERT), and Policy Recommendation (RAG).
4.  **Data Layer (India-Specific):** A dedicated data store using PostgreSQL and MongoDB.
5.  **Integration Layer (ETL):** Simple cron jobs and REST APIs (falling back from Airflow) to fetch data from Indian portals.

## 🔧 Tech Stack Summary

| Layer | Technologies (Hackathon-Ready) |
| :--- | :--- |
| **Frontend** | React.js, TailwindCSS, Mapbox, Recharts |
| **Backend** | FastAPI, Redis, JWT |
| **ML/NLP** | DoWhy, HuggingFace (BERT/RoBERTa), Scikit-learn |
| **Data Storage** | PostgreSQL (Structured data), MongoDB (Tweets, docs) |
| **Data Sources** | IMD, CPCB, Twitter API v2, MoEFCC Reports |
| **Integration** | Cron jobs, REST APIs |
| **Deployment** | Docker Compose (for easy demo deployment) |

## 🚀 Get Started: Cloning the Repo

Here are the step-by-step instructions to get a full local copy of this project.

### Prerequisite: Install Git

You must have Git installed on your machine. To check, open your terminal and type:
`git --version`

If you don't see a version number, **[download and install Git](https://git-scm.com/downloads)** first.

### Step-by-Step Cloning

1.  **Get the Repository URL**
    * Go to the main page of this GitHub repository.
    * Click the green **`< > Code`** button.
    * Make sure the **HTTPS** tab is selected and **copy the URL**:
        `https://github.com/Viraj281105/ClimateX.git`

2.  **Open Your Terminal**
    * Open your command-line tool (e.g., Terminal, Git Bash, Command Prompt).

3.  **Navigate to Your Projects Folder**
    * `cd` into the directory where you want this project to live.
    * Example: `cd ~/Documents/Projects`

4.  **Clone the Repository**
    * Use the `git clone` command with the URL you copied. This will create a new `ClimateX` folder.
    * `git clone https://github.com/Viraj281105/ClimateX.git`

5.  **You're All Set!**
    * Navigate into your new project folder:
        `cd ClimateX`
    * You are now ready to set up your environment and start coding.
