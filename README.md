# Learning Management System

This is a full-stack LMS project I built with a separate React frontend and Node.js/Express backend. The main idea behind this project was to create one platform where:

- students can browse courses, buy them, watch lessons, track progress, rate courses, practice programming questions, and ask for AI help
- educators can create and manage courses, upload lecture notes, add programming questions, and monitor enrollments and earnings

The project uses Clerk for authentication, MongoDB for data storage, Cloudinary for file hosting, Stripe for payments, Gemini for AI study help, and Judge0 for running code inside programming courses.

## What this project does

### Student side

- View all published courses
- Open a course details page before purchasing
- Buy a course using Stripe Checkout
- Access enrolled courses from the dashboard
- Watch lectures inside a course player
- Mark lectures as completed
- Track learning progress
- Download and view lecture notes in PDF format
- Rate courses after enrollment
- Solve programming questions directly in the player
- Run code in multiple languages through Judge0
- Ask course/study questions using the built-in AI helper
- Upload an image or PDF while asking the AI helper

### Educator side

- Upgrade a signed-in user to educator role
- Create new courses with title, description, price, discount, thumbnail, chapters, and lectures
- Upload lecture notes to Cloudinary
- Add and update lecture content
- Add programming questions for coding-based courses
- Remove programming questions later if needed
- Update course thumbnails
- View all created courses
- Track dashboard stats like earnings, number of courses, and enrolled students
- Check student enrollment history

## Tech stack

### Frontend

- React 19
- Vite
- React Router
- Tailwind CSS
- Clerk React
- Axios
- Quill editor
- React Toastify
- React YouTube

### Backend

- Node.js
- Express 5
- MongoDB + Mongoose
- Clerk Express middleware
- Stripe
- Cloudinary
- Multer
- Google Gemini API

### External services

- Clerk for auth and user management
- Stripe for payment flow
- Cloudinary for thumbnails, attachments, and notes
- Judge0 for code execution
- Gemini for AI tutor / debugging support

## Project structure

```text
Lms - Copy/
|-- backend/
|   |-- config/
|   |-- controller/
|   |-- model/
|   |-- routes/
|   |-- mddelware/
|   |-- index.js
|   `-- package.json
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- assets/
|   |   |-- components/
|   |   |-- context/
|   |   |-- pages/
|   |   `-- main.jsx
|   `-- package.json
`-- README.md
```

## Main modules

### Backend modules

- `backend/index.js`  
  Starts the Express server, connects MongoDB and Cloudinary, applies Clerk middleware, and mounts all API routes.

- `backend/controller/user.controller.js`  
  Handles student-side features like purchase flow, course progress, ratings, AI chat, and programming question execution.

- `backend/controller/educatorcontroller.js`  
  Handles educator-specific features like role upgrade, course creation, lecture management, note upload, dashboard stats, and programming questions.

- `backend/controller/webhooks.js`  
  Handles Clerk user webhooks and Stripe payment webhooks.

- `backend/model/`  
  Contains the MongoDB models for users, courses, purchases, and course progress.

### Frontend modules

- `frontend/src/context/AppContext.jsx`  
  Central place for shared app state like courses, enrolled courses, user data, educator status, and utility functions.

- `frontend/src/pages/student/`  
  Student-facing pages such as home, course list, course details, enrollments, and player.

- `frontend/src/pages/educator/`  
  Educator-facing pages such as dashboard, add course, my courses, and course content management.

## Important features explained

### 1. Authentication and roles

Authentication is handled with Clerk. When a user signs up, Clerk webhook events are used to create or update the matching user in MongoDB. There is also an educator role flow, where a logged-in user can be upgraded and then gets access to educator-only routes.

### 2. Course creation flow

An educator can:

- enter course title, description, price, and discount
- upload a thumbnail image
- add multiple chapters
- add lectures under each chapter
- mark a lecture as free preview or paid
- upload lecture notes as PDF
- optionally mark the course as a programming course
- add programming questions to that course

### 3. Purchase flow

When a student purchases a course:

1. a purchase record is created in MongoDB with `pending` status
2. Stripe Checkout session is created
3. after payment, Stripe webhook updates purchase status
4. the student is added to the course enrollment list
5. the course is added to the student enrolled courses list

### 4. Course player

Inside the player, students can:

- watch lessons
- mark lectures as completed
- load existing progress
- open or download PDF notes
- rate the course

If the course is a programming course, the same player also shows the coding practice section.

### 5. Programming practice

For programming courses, educators can add questions and students can:

- choose a language
- write code in the editor
- provide custom stdin input
- run the code using Judge0
- read the compiler output, runtime output, and execution details

### 6. AI helper

The player also includes an AI helper for study support. A student can ask:

- programming doubts
- debugging questions
- lecture-related questions
- study questions in general

The request can also include:

- current code
- selected programming language
- uploaded image or PDF attachment

The backend sends this to Gemini and returns the answer back to the UI.

## Database models

### User

- Clerk user id as `_id`
- name
- email
- image URL
- enrolled courses

### Course

- title
- rich text description
- thumbnail
- price
- discount
- publish status
- educator reference
- enrolled student list
- course rating
- chapter and lecture structure
- programming course flag
- programming questions

### Purchase

- course reference
- user reference
- amount
- payment status: `pending`, `completed`, or `failed`

### CourseProgress

- user id
- course id
- completed lecture list

## API route overview

### User routes

Base path: `/api/user`

- `GET /data`
- `GET /enrolled-courses`
- `POST /purchase`
- `POST /update-course-progress`
- `GET /get-course-progress`
- `POST /add-rating`
- `POST /course/:courseId/programming-questions/:questionId/run`
- `POST /ai/chat`

### Course routes

Base path: `/api/course`

- `GET /all`
- `GET /:id`

### Educator routes

Base path: `/api/educator`

- `GET /update-role`
- `POST /add-course`
- `POST /upload-notes`
- `GET /course/:id`
- `POST /course/:courseId/chapters`
- `POST /course/:courseId/lectures`
- `PUT /course/:courseId/lectures/:lectureId`
- `PUT /course/:courseId/thumbnail`
- `POST /course/:courseId/programming-questions`
- `DELETE /course/:courseId/programming-questions/:questionId`
- `GET /courses`
- `GET /dashboard`
- `GET /enrolled-students`

### Webhook routes

- `POST /clerk`
- `POST /stripe`

## Environment variables

### Backend `.env`

Create a `.env` file inside `backend/` and add:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string

CLOUDINARY_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret

STRIPE_SECRETE_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
CURRENCY=INR

CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
GEMINI_API_KEY=your_gemini_api_key

JUDGE0_URL=https://ce.judge0.com
```

### Frontend `.env`

Create a `.env` file inside `frontend/` and add:

```env
VITE_BACKEND_URL=http://localhost:5000
VITE_CURRENCY=INR
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## How to run locally

### 1. Clone the project

```bash
git clone <your-repo-url>
cd "Lms - Copy"
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Start the backend

From the `backend` folder:

```bash
npm run server
```

### 5. Start the frontend

From the `frontend` folder:

```bash
npm run dev
```

### 6. Open the app

Frontend usually runs on:

```text
http://localhost:5173
```

Backend usually runs on:

```text
http://localhost:5000
```

## Webhook setup notes

### Clerk webhook

Point Clerk webhook events to:

```text
http://localhost:5000/clerk
```

Use the signing secret from Clerk in `CLERK_WEBHOOK_SECRET`.

### Stripe webhook

Point Stripe webhook events to:

```text
http://localhost:5000/stripe
```

Use the signing secret from Stripe in `STRIPE_WEBHOOK_SECRET`.

## A few implementation notes

- The backend uses Clerk middleware globally, so protected requests depend on a valid Clerk token.
- Course thumbnails, lecture notes, and AI attachments are uploaded to Cloudinary.
- Free preview lectures still appear in course details, while restricted lecture URLs are hidden before enrollment.
- Programming question execution currently uses Judge0 compiler API with custom stdin support.
- The frontend has separate student and educator flows under different route groups.

## Current routes in the frontend

### Student routes

- `/`
- `/course-list`
- `/course-list/:input`
- `/course/:id`
- `/my-enrollments`
- `/player/:courseId`
- `/loading/:path`

### Educator routes

- `/educator`
- `/educator/add-course`
- `/educator/my-courses`
- `/educator/course/:courseId/content`
- `/educator/student-enrolled`

## Future improvements I can still add

- proper test coverage for backend APIs and frontend flows
- better validation and error handling in some forms
- stronger admin controls and course moderation
- payment history page for students
- coding question result persistence
- richer analytics for educators

## Final note

I tried to keep this project practical instead of overcomplicating it. The main focus was building a real LMS flow end to end: authentication, course creation, payments, progress tracking, notes, coding practice, and AI-based study help in one place.
