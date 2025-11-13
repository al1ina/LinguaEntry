# LinguaEntry

LinguaEntry is a fullstack web application made with React and TypeScript, it helps users improve their language learning by tracking entries, practicing vocabulary, and monitoring progress. It integrates a Claude AI API to correct user-written entries and highlight differences between the original text and the AI’s suggestions. The app also includes a streak counter to keep users engaged and motivated to write regularly. With a clean and intuitive interface, users can easily review their past entries alongside AI corrections. It also has an AI-insights feature that enables the user to look back on their past entries and have the AI find the places where the user can improve on.

## Features
- Add and manage language learning entries
- Track progress over time
- User-friendly interface built with React + TypeScript
- Backend support with JSON data handling
- Secure environment variable management (`.env` file not included in repo)

## Tech Stack
- **Frontend:** React, TypeScript, CSS
- **Backend:** Node.js / Express (with JSON storage)
- **Package Management:** npm

## Environment Variables
Create a .env file in the root directory to configure environment variables (not committed to GitHub). Example:
API_KEY=your_api_key_here

## To start
Must run "npm run dev" on the front end, then do "cd backend" and run "node server.js" to run the backend

## 🖥️ Screenshots
<img width="800" height="auto" alt="image" src="https://github.com/user-attachments/assets/9c7956b3-4b15-46f5-8745-8a54a27bfee4" />
<img width="800" height="auto" alt="image" src="https://github.com/user-attachments/assets/d01b3557-a470-4a0c-af70-e891089faac2" />

## NOTE
To change the language from Spanish into another, update the ai-correct route in the server.js file by replacing "Spanish" with any other language.



