
# Placify — AI-Powered Placement Preparation Platform

Placify is a full-stack, AI-powered placement preparation platform designed to help students prepare for campus placements and entry-level IT careers.

It brings resume analysis, job matching, skill-gap identification, personalized learning, technical assessments, interview preparation, and placement opportunity tracking into one application.

## Key Features

### AI-Powered Career Preparation
- **AI Resume Analyzer:** Analyzes resumes and provides improvement suggestions.
- **Resume Generation:** Helps students create professional resumes.
- **AI Job Matching:** Evaluates compatibility between student profiles and job requirements.
- **Skill Gap Analysis:** Identifies skills students need to develop for their target roles.
- **Personalized Roadmaps:** Provides structured preparation guidance.
- **AI HR Mock Interviews:** Supports interview practice and AI-generated feedback.

### Assessments and Learning
- Aptitude and technical practice
- Coding assessments and evaluation
- Personalized learning and preparation tracking
- Mock placement preparation

### Placement Management
- Placement and internship opportunities
- Opportunity search and filtering
- Application status tracking
- Deadline reminders and notifications
- Calendar and progress analytics
- Telegram-based placement announcement integration

### Administration
- Student and administrator roles
- Placement opportunity management
- Application and notification management
- Administrative workflows

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| AI Integration | Google Gemini API |
| Authentication | JWT, Email OTP |
| Real-Time Communication | Socket.IO |
| API Architecture | REST APIs |
| Version Control | Git, GitHub |

## Project Structure

```text
placify/
├── frontend/       # React frontend application
├── backend/        # Express backend, APIs and services
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites
- Node.js and npm
- MongoDB Atlas or a compatible MongoDB instance
- Google Gemini API key
- Environment credentials for enabled integrations

### 1. Clone the Repository

```bash
git clone https://github.com/PrajwalAcharya9535/placify.git
cd placify
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a local `.env` file and configure the environment variables required by your installation.

Never commit passwords, API keys, database connection strings, or session files.

Start the backend using the script configured in `backend/package.json`.

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Configure the frontend API URL according to your local backend configuration.

## Security

- JWT-based authentication
- Role-based student and administrator access
- Email OTP workflows
- Environment-based configuration for credentials
- Git ignore rules for sensitive local files

## Project Information

**Project:** Placify  
**Category:** Full-Stack Web Development / AI Applications  
**Academic Project:** Master of Computer Applications (MCA)  
**Development:** Individual Project

## Future Enhancements

- Expanded AI-based interview evaluation
- Additional placement opportunity integrations
- Improved analytics and recommendations
- Cloud deployment and production monitoring

## Developer

**Prajwal Acharya**

GitHub: https://github.com/PrajwalAcharya9535

---

Placify aims to make placement preparation more structured, personalized, and accessible for students.
