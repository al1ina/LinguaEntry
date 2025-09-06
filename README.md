# LinguaEntry

LinguaEntry is a web application designed to help users improve their language learning experience by tracking entries, practicing vocabulary, and keeping progress organized.  

## 🚀 Features
- ✍️ Add and manage language learning entries
- 📊 Track progress over time
- 🌐 User-friendly interface built with React + TypeScript
- 📁 Backend support with JSON data handling
- 🔒 Secure environment variable management (`.env` file not included in repo)

## 🛠️ Tech Stack
- **Frontend:** React, TypeScript, CSS
- **Backend:** Node.js / Express (with JSON storage)
- **Package Management:** npm
- **Version Control:** Git + GitHub

## 📂 Project Structure
LinguaEntry/
├── backend/ # Backend files (data handling, API)
├── src/ # Frontend React source code
│ ├── App.tsx # Main React app
│ ├── index.css # Styles
│ └── ...
├── package.json # Project dependencies
├── .gitignore # Ignored files (includes .env)
└── README.md # Project documentation

## 🔑 Environment Variables
Create a .env file in the root directory to configure environment variables (not committed to GitHub). Example:
API_KEY=your_api_key_here

## To start
Must run "npm run dev" on the front end 
Then do "cd backend" and run "node server.js" to run the backend
