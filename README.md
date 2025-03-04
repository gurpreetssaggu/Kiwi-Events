# Kiwi Events

Kiwi Events is a web application that allows users to browse, create, and manage local events. Users can register for events, save their favorites, and sort events based on categories and locations.

## Features

### User Features
- Secure account creation and login (via email/OTP or Google/Facebook authentication)
- Browse events sorted alphabetically
- Save/pin events to a favorites list
- Book events with confirmation emails
- Add event dates to Google Calendar
- Cancel event bookings
- Get event directions using Google Maps
- Create and post events for others to view and register

### Admin Features
- Verify user-posted events before publishing
- Delete inappropriate or outdated events
- View a counter of registered users per event
- Edit event details for accuracy
- Manage user accounts for compliance

## Tech Stack
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Backend**: Node.js, Express.js, MongoDB
- **Authentication**: JWT, Google OAuth, Facebook OAuth, OTP Verification
- **File Uploads**: Multer for event images
- **Email Notifications**: Nodemailer
- **Session Management**: Express Sessions & Passport.js

## Installation and Setup

### Prerequisites
- Node.js and npm installed
- MongoDB installed and running locally

### Clone the Repository
```sh
git clone https://github.com/yourusername/KiwiEvents.git
cd KiwiEvents
```

### Install Dependencies
```sh
npm install
```

### Environment Variables
Create a `.env` file and configure the following environment variables:
```
MONGO_URI=mongodb://localhost:27017/kiwiEventsDB
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret
```

### Run the Server
```sh
npm start
```
The server runs on `http://localhost:5001` by default.

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register a new user
- `POST /login` - Login user and receive JWT
- `POST /send-otp` - Send OTP to user email
- `POST /verify-otp` - Verify OTP and register/login user
- `GET /google` - Google OAuth login
- `GET /facebook` - Facebook OAuth login

### Event Routes (`/api/events`)
- `POST /` - Create a new event
- `GET /` - Retrieve all events
- `GET /:id` - Retrieve a single event by ID
- `DELETE /:id` - Delete an event by ID

## Frontend Pages
- `index.html` - Home page
- `events.html` - Browse and sort events
- `create-event.html` - Create a new event
- `saved-events.html` - View saved events
- `signup.html` - User registration
- `login.html` - User login
- `verify-otp.html` - OTP verification page


