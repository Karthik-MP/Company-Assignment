# 🎓 Undergraduation Admin Dashboard (MVP)

This is an internal-facing CRM-style admin dashboard for **Undergraduation.com** to track and manage student journeys through their college application process.  
The dashboard allows internal team members to view, update, and manage student data, tasks, and communications.

---

## ⚙️ Tech Stack

### Frontend
- **Next.js** – React framework for server-side rendering, routing, and scalability.
- **Tailwind CSS** – Utility-first CSS for fast UI development.
- **Shadcn/UI** – Prebuilt accessible UI components integrated with Tailwind for consistent styling.
- **React Hook Form** – For managing form state, validation, and performance.
- **Firebase Auth** – Secure authentication with email link sign-in.
- **Firebase Firestore** – NoSQL cloud database to store students, team members, and tasks.

### Backend
- **Node.js (Standalone scripts only)** – Used only for generating and seeding dummy data to Firebase.
    - `backend/seedTeamMembers.js`
    - `backend/seedTask.js`
    - `backend/insertStudents.js`
    - `backend/generateStudents.js`

> ⚠️ No backend server is running in production. Firebase services directly serve as the backend.

> ⚠️ Add serviceAccount from Firebase details in insertStudents file to worl
---

## 📁 Project Structure
    /my-app
        /app
        /login
        /dashboard
            /students
                /[student_id]
            /team
        /components
        /lib
        /services
        /package.json
    /backend
        /seedTeamMembers.js
        /seedTask.js
        /insertStudents.js
        /generateStudents.js

---

## 🧩 Features & Routes

### Auth Flow
- `/login` – Admin login using **email link**. User receives a validation link via email, and after verifying, gets access.
- Firebase Auth ensures protected routes and session persistence.

---

### Admin Routes
| Route | Description |
|---|---|
| `/login` | Login with email, password |
| `/signup` | Signup with required details,  verification email is sent to the registered email |
| `/dashboard` | Summary stats of students |
| `/dashboard/students` | List of all students (filter, search) |
| `/dashboard/students/[student_id]` | Individual student profile view |
| `/dashboard/team` | Manage internal tasks (CRUD, assign, filter tasks) |

---

## 📝 Signup Component

Although admin users sign in with a magic link, a **signup page** can be used to onboard new team members.  
Here are the fields to start with:

### Fields
- Full Name (text)
- Email (email)
- Password (password)
- Confirm Password (password)
- Role (dropdown: Admin, Counselor, Reviewer)
- Country (optional, text)
- Phone Number (optional, number)

### 📦 Packages Used & Why

| Package | Purpose |
|---|---|
| next | Core framework for frontend |
| tailwindcss |	Styling UI components |
| @shadcn/ui |Prebuilt components with Tailwind |
| firebase | Auth, Firestore DB |
| react-hook-form |	Easy form handling and validation |
| zod (optional) |	Schema-based form validation |


### 📊 Using Firebase Indexes

To support filtering and sorting large student data efficiently, this project uses Firestore composite indexes.
Indexes are required when you:

- Query on multiple fields (e.g., where("status", "==", "Applying").orderBy("lastActive"))
- Perform range and equality filters together
- Sort results by multiple fields (e.g., orderBy("country").orderBy("createdAt"))

### How to Add Indexes

- When you run a query that needs an index, Firestore will throw an error in the console.
- That error includes a direct link to create the required index.
Open the link → Confirm → Wait for the index to build (usually <2 minutes).

### 💡 Common indexes used:
- Students: (status + lastActive)
- Students: (country + createdAt)
- Tasks: (assignedTo + dueDate)
- TeamMembers: (role + createdAt)

### 🖥️ Setup Instructions

### Prerequisites
- Node.js ≥ 18
- Firebase project with Auth and Firestore enabled

### Steps
1. Clone the [repo](https://github.com/Karthik-MP/undergraduation_assignment)
2. Move to project directory
    - cd undergraduation_assignment
3. Install dependencies
    - npm install
4. Setup Environment: 
    - Create .env.local file

        NEXT_PUBLIC_FIREBASE_API_KEY=xxxx
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxx
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxx
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxx
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxx
        NEXT_PUBLIC_FIREBASE_APP_ID=xxxx
5. Run the project
    - npm run dev

### 📌 Roadmap

- Implement student filters
- Add communication logs UI
- Add AI-generated student summary (mock)
- Improve role-based permissions for team

### 📷 Demo
[link]()


