# Bhumi — National Land Acquisition & Management System

**Bhumi** is a full-stack land acquisition and land-management platform designed to make the complete journey of land transparent and trackable — from project proposals and parcel identification to compensation, possession, rehabilitation, documentation, land history, and private land transactions.

The platform provides different experiences for **farmers, district officers, state officers, central ministry officials, project agencies, and police verification officers**.

> **Hackathon / Demo Project**
>
> Several government integrations such as Aadhaar/UIDAI, SMS OTP, Google authentication, satellite imagery, and external notification services are simulated for demonstration purposes. They are not connected to live government or commercial services.

---

# Table of Contents

* [Problem Statement](#problem-statement)
* [What Bhumi Does](#what-bhumi-does)
* [Key Features](#key-features)
* [User Roles](#user-roles)
* [Complete Application Flow](#complete-application-flow)
* [Feature Details](#feature-details)
* [Land Acquisition Workflow](#land-acquisition-workflow)
* [Buy & Sell Land Workflow](#buy--sell-land-workflow)
* [Land History Tracker](#land-history-tracker)
* [Authentication](#authentication)
* [Government Schemes](#government-schemes)
* [Technology Stack](#technology-stack)
* [Project Architecture](#project-architecture)
* [Project Structure](#project-structure)
* [Database](#database)
* [API Modules](#api-modules)
* [Installation](#installation)
* [Running the Project](#running-the-project)
* [Demo Accounts](#demo-accounts)
* [Demo OTP](#demo-otp)
* [Environment Variables](#environment-variables)
* [Reports](#reports)
* [File Uploads](#file-uploads)
* [Important Demo Limitations](#important-demo-limitations)
* [Future Scope](#future-scope)

---

# Problem Statement

Land acquisition can involve multiple stakeholders and many stages:

**Proposal → Survey → Land Identification → Notification → Compensation → Possession → Rehabilitation**

Without a unified system, landowners may have difficulty tracking:

* The current status of their land
* Acquisition progress
* Compensation calculations
* Compensation payments
* Possession status
* Rehabilitation and resettlement
* Land documents
* Previous government acquisition activity
* Private buying and selling activity

Bhumi brings these workflows into one platform.

---

# What Bhumi Does

Bhumi provides a centralized system where:

* Farmers can track their land.
* Government officers can manage acquisition projects.
* Agencies can submit project proposals.
* Parcels can be viewed geographically through GIS.
* Compensation can be calculated transparently.
* Possession can be tracked and verified.
* Displaced families can be registered for rehabilitation.
* Documents can be uploaded and checked for exact duplicates.
* Satellite-style before/after image comparison can detect visible changes.
* Farmers can query their land status through a chatbot.
* States can be compared using a data-driven ranking dashboard.
* Unused acquired land can be located near a selected parcel.
* Land can be submitted for private buying/selling.
* Private transactions can go through a police verification workflow.
* Every land parcel can have a chronological government acquisition history.
* Government land-related schemes can be viewed from inside the platform.
* MIS reports can be downloaded as PDF or Excel files.

---

# Key Features

## 1. Mobile Number + OTP Authentication

Users can sign in using their mobile number.

Flow:

```text
Enter mobile number
       ↓
Generate OTP
       ↓
Verify OTP
       ↓
Create / retrieve user
       ↓
JWT session
       ↓
Bhumi application
```

The OTP:

* Is 6 digits.
* Expires after 5 minutes.
* Is stored in SQLite.
* Is marked as used after successful verification.
* Is simulated instead of being sent through a real SMS provider.

---

# 2. Guest Mode

Users can enter Bhumi without creating an account.

Guest users receive a scoped guest session and can use public functionality such as the farmer chatbot.

Guests cannot submit private land-sale transactions.

---

# 3. Google Login Demo

The login screen also provides a **Continue with Google** option.

For the current hackathon implementation this is a simulated Google login.

A demo Google account is created/retrieved instead of performing real Google OAuth verification.

---

# 4. Aadhaar-Style Land Registration

Farmers can register/link land through a simulated Aadhaar verification process.

The registration form collects:

* Full name
* Date of birth
* Father's / husband's name
* Land / parcel ID
* Survey / plot number
* Land area
* Village
* District
* State
* Aadhaar number

The process is:

```text
Land registration form
        ↓
12-digit Aadhaar number validation
        ↓
Verification OTP
        ↓
OTP verification
        ↓
Aadhaar marked as verified
        ↓
Land linked to user profile
```

The application clearly labels this as a **demo verification**.

No real UIDAI connection is used.

---

# 5. Role-Based Access

Bhumi supports six application roles:

| Role             | Main Responsibilities                                                        |
| ---------------- | ---------------------------------------------------------------------------- |
| Farmer           | Track land, compensation, possession, rehabilitation and transactions        |
| District Officer | Review projects, manage parcels, compensation, possession and rehabilitation |
| State Officer    | State-level project management, approvals and analytics                      |
| Central Ministry | National-level monitoring and project oversight                              |
| Project Agency   | Submit projects and manage acquisition-related information                   |
| Police Officer   | Verify private land buying/selling transactions                              |

Authorization is implemented through JWT authentication and role-based middleware.

---

# 6. Role-Based Dashboards

The dashboard provides acquisition-level analytics including:

* Total projects
* Total land parcels
* Possessed parcels
* Possession rate
* Total assessed compensation
* Paid compensation
* Compensation disbursement rate
* Resettled families
* Total rehabilitation families

The dashboard also provides:

### State-wise Compensation

Shows:

* State
* Number of projects
* Number of parcels
* Total assessed compensation
* Total paid compensation
* Possession count

### Project-wise Progress

Shows:

* Project
* State
* District
* Project status
* Total parcels
* Possessed parcels
* Compensated parcels

---

# 7. Project Proposal & Approval Workflow

Authorized users can submit new land acquisition projects.

A project contains:

* Project name
* Project type
* State
* District
* Implementing agency

Supported project types can include examples such as:

* Highway
* Railway
* Irrigation
* Industrial
* Urban

After submission, proposals move through stages:

```text
Submitted
   ↓
District Review
   ↓
State Review
   ↓
Central Ministry Review
   ↓
Approved
```

A proposal can also be rejected.

The system:

* Stores proposal history.
* Updates project status.
* Records remarks.
* Creates notifications.
* Adds acquisition milestones to the land-history timeline.

---

# 8. GIS-Based Land Parcel Map

The GIS page displays land parcels using **Leaflet** and **OpenStreetMap**.

Each parcel contains information such as:

* Parcel ID
* Owner
* Area
* Location
* Project
* Land status
* Dispute count

The map also displays a **litigation risk indicator**.

Risk is calculated from the parcel's dispute count:

```text
0 disputes       → Low risk
1–2 disputes     → Medium risk
3+ disputes      → High risk
```

The map can therefore visually identify parcels requiring additional attention.

---

# 9. Unused Acquired Land Finder

Bhumi can identify acquired land marked as unused.

The system accepts:

* Latitude
* Longitude
* Search radius

It calculates geographical distance using the **Haversine formula**.

The result:

```text
Selected location
       ↓
Search unused parcels
       ↓
Calculate distance
       ↓
Filter by radius
       ↓
Sort nearest → farthest
```

This can help identify existing acquired land that may potentially be considered before acquiring additional land.

---

# 10. Transparent Compensation Calculator

Bhumi includes an explainable compensation calculator.

The calculation uses:

* Base rate per acre
* Land area
* Location factor
* Connectivity bonus

The calculation is broken into understandable components:

```text
Base value
    +
Location adjustment
    +
Connectivity bonus
    =
Total compensation
```

The system displays the individual components rather than only showing one final number.

It also stores:

* Amount assessed
* Amount paid
* Payment status
* Calculation breakdown

Payment status can be:

```text
Pending
Partial
Paid
```

Authorized officers can record payments.

When compensation is fully paid, the parcel can automatically move to the compensated state.

---

# 11. Possession Tracking

The possession module tracks whether the government has taken possession of a parcel.

Officers can record:

* Handed-over status
* Handover date
* Verifying officer

Possible state:

```text
Not handed over
       ↓
Handed over
```

When possession is recorded, the parcel status is updated accordingly.

The action is also added to the land-history timeline.

---

# 12. Rehabilitation & Resettlement

Bhumi provides a rehabilitation and resettlement module for displaced families.

The system records:

* Family name
* Family size
* Monthly income
* Agriculture dependency
* Resettlement status
* Priority score

A priority score is calculated using:

* Family size
* Income
* Agriculture dependency

The rehabilitation list is sorted by priority score so higher-scoring families appear first.

Authorized officers can:

* Register families
* View priority information
* Mark families as resettled

Each major rehabilitation action is recorded in land history.

---

# 13. Document Management

Users can upload land/project documents.

The document system stores:

* File name
* Parcel
* Project
* Version
* Uploading user
* Upload time
* SHA-256 file hash

Uploaded files can also be downloaded.

Maximum regular document upload size:

```text
20 MB
```

---

# 14. Document Duplicate Checker

Bhumi calculates a **SHA-256 hash** for uploaded documents.

If a document has the same hash as an existing document, it is flagged as a duplicate.

Example:

```text
Upload document
      ↓
Generate SHA-256 hash
      ↓
Search existing hashes
      ↓
Match found?
   /       \
 Yes        No
 ↓          ↓
Duplicate   Unique
flag        document
```

The system also calculates document versions based on the same filename and parcel.

---

# 15. Satellite / Encroachment Checker

The satellite module performs a lightweight image comparison.

The user supplies:

* Before image
* After image

The backend:

1. Loads both images.
2. Resizes them to 300 × 300.
3. Compares pixel brightness differences.
4. Counts changed pixels.
5. Calculates the percentage of changed area.

The result includes:

* Changed area percentage
* Analysis verdict

Current demo thresholds:

```text
≤ 10%      → No significant change
> 10%      → Moderate change / field verification recommended
> 25%      → High probability of encroachment / unauthorized construction
```

This is **not actual satellite-based AI detection**. It is a transparent pixel-difference demonstration.

---

# 16. Farmer Chatbot

Bhumi includes a farmer-facing chatbot.

The chatbot can be used without authentication.

A farmer enters a Land ID and receives:

* Land ID
* Owner
* Current land status
* Compensation assessed
* Compensation paid
* Compensation payment status
* Possession status

The chatbot supports:

* English
* Hindi

Example:

```text
Land ID: RJ-JPR-0001
Owner: Ramesh Kumar
Status: compensated
Compensation assessed: ₹...
Paid so far: ₹...
Possession handed over: Yes
```

The backend endpoint is designed so that the same logic could later sit behind WhatsApp/SMS integration.

---

# 17. State Ranking Dashboard

Bhumi calculates state-level scores using three measurable components:

### Speed Score

Based on possession rate.

### Transparency Score

Based on the percentage of assessed compensation that has been paid.

### Satisfaction Proxy

Based on dispute frequency.

The dashboard displays these individual metrics and a calculated total score.

The ranking is generated dynamically from the current project, parcel and compensation data.

---

# 18. Voice-Based Data Entry

The rehabilitation form includes voice input functionality.

The browser's **Web Speech API** is used to convert speech into text.

This can help users enter form information without typing everything manually.

The feature depends on browser speech-recognition support.

---

# 19. MIS Reports

Bhumi provides downloadable reports in two formats.

## PDF Report

Contains:

* Project overview
* Land parcels
* Parcel owners
* Parcel areas
* Parcel statuses
* Dispute counts
* Compensation assessed
* Compensation paid
* Compensation status

## Excel Report

The generated workbook contains separate sheets for:

### Projects

* ID
* Name
* Type
* State
* District
* Agency
* Status

### Land Parcels

* ID
* Parcel code
* Owner
* Area
* Status
* Dispute count

### Compensation

* Parcel code
* Owner
* Amount assessed
* Amount paid
* Status

---

# 20. Notifications & Alerts

The backend contains a notification system.

Notifications store:

* User
* Message
* Channel
* Read/unread state
* Creation time

Supported channels:

```text
app
email
sms
```

For the demo, email/SMS notifications are simulated through server-side logging.

Proposal stage changes create application notifications for the original proposal submitter.

---

# 21. User Profile

Authenticated users have a profile page.

Profile information can include:

* Name
* Email
* Village
* District
* State
* Language
* Land / Parcel ID
* Survey number
* Land area

Profile information can be edited and saved.

The profile also provides access to land registration/verification.

---

# 22. Hindi / English Language Support

The frontend uses:

* `i18next`
* `react-i18next`

Two translation dictionaries are included:

```text
frontend/src/i18n/en.json
frontend/src/i18n/hi.json
```

The navbar provides:

```text
EN
हिं
```

The login, home, navigation and several other interface elements have English/Hindi translations.

---

# 23. Government Schemes Information

Bhumi contains a reference section for relevant land-related schemes and laws.

Current information includes:

### Land Acquisition & Records

* RFCTLARR Act, 2013
* DILRMP
* ULPIN / Bhu-Aadhaar
* SVAMITVA Scheme

### Buying & Selling Land

* Stamp duty concession for women

### Rehabilitation & Resettlement

* RFCTLARR R&R benefits
* PMAY-Gramin

Each scheme can be expanded to view:

* Description
* Who it is for
* What it offers
* How to access it
* Official reference page where available

These schemes are informational only; Bhumi does not directly administer them.

---

# 24. Private Land Buying & Selling

Bhumi contains a separate **peer-to-peer land transaction workflow**.

This is different from government land acquisition.

A user can submit a transaction as either:

```text
Seller
```

or

```text
Buyer
```

The transaction contains:

* Land ID
* Survey number
* Village
* District
* State
* Area
* Agreed price
* Seller details
* Buyer details
* Contact details
* Transaction documents

---

# Buy & Sell Land Workflow

The complete workflow is:

```text
Seller / Buyer starts transaction
             ↓
Enter land details
             ↓
Enter seller & buyer details
             ↓
Upload required documents
             ↓
Submit transaction
             ↓
Police verification queue
             ↓
Police officer reviews transaction
          /        \
     Approve       Reject
        ↓             ↓
      SOLD         REJECTED
```

A newly submitted transaction starts with:

```text
Police Verification
```

The system also calculates an approximate verification period for the demo.

---

# Required Seller Documents

A seller must provide:

* Original Sale Deed / Title Deed
* Encumbrance Certificate
* Latest Property Tax Receipt
* Seller ID Proof

---

# Required Buyer Documents

A buyer must provide:

* Buyer ID Proof

Optional transaction documentation can include:

* Agreement to Sell

Supported document types are explicitly tagged rather than being stored as generic files.

Maximum transaction-document upload size:

```text
20 MB per file
```

---

# Police Verification Queue

Police officers have a dedicated verification queue.

Only users with the:

```text
police
```

role can access the verification queue.

The police officer can:

### Approve

Changes transaction status to:

```text
sold
```

### Reject

Changes transaction status to:

```text
rejected
```

The officer can also provide verification notes.

The verification record stores:

* Verifying officer
* Decision
* Notes
* Verification timestamp

---

# My Land Transactions

Users can view transactions where they are:

* The person who submitted the transaction
* Seller
* Buyer
* Named through their contact number

This allows both sides of a transaction to track the same land sale.

---

# Transaction Status Tracker

Private land transactions display their progress using a status tracker.

Typical state:

```text
Submitted
     ↓
Police Verification
     ↓
Sold
```

or:

```text
Submitted
     ↓
Police Verification
     ↓
Rejected
```

Rejected transactions can display the rejection reason.

---

# Land History Tracker

Bhumi includes a dedicated **Land History Tracker**.

A user can enter a Land ID and see the history associated with that land.

The history is separated into two sections:

## 1. Buy & Sell History

Shows every private transaction recorded for that Land ID.

Each transaction can display:

* Seller
* Buyer
* Submission date
* Agreed price
* Transaction status
* Verification status
* Seller details
* Buyer details
* Land details
* Documents
* Rejection reason when applicable

---

## 2. Government Land Purchase History

Shows the government's acquisition journey for the land.

The timeline can contain events such as:

```text
Proposal approved
       ↓
Land identified
       ↓
Acquisition notice issued
       ↓
Compensation assessed
       ↓
Partial/full compensation paid
       ↓
Possession handed over
       ↓
Rehabilitation registered
       ↓
Family resettled
```

Each event can include:

* Date
* Event title
* Description
* Amount where applicable
* Current/previous status

The history system is designed as an append-only event log so previous milestones are retained rather than simply replacing the current status.

---

# Complete Application Flow

## Login Flow

```text
Landing / Login
      ↓
Mobile number
      ↓
OTP
      ↓
JWT authentication
      ↓
Home
      ↓
Dashboard / Features
```

Alternative entry:

```text
Login
 ↓
Guest Mode
 ↓
Limited public functionality
```

---

# Farmer Flow

```text
Login
  ↓
Farmer Home
  ↓
Profile
  ↓
Aadhaar-style land registration
  ↓
Land linked to profile
  ↓
Track acquisition
  ├── GIS map
  ├── Compensation
  ├── Possession
  ├── Rehabilitation
  ├── Documents
  └── Land History
```

A farmer can also use:

```text
Buy Land
Sell Land
Track Transaction
View Government Schemes
Use Farmer Chatbot
```

---

# Government Acquisition Flow

```text
Project Proposal
       ↓
Review
       ↓
Approval
       ↓
Land Parcels
       ↓
GIS / Survey
       ↓
Acquisition Notification
       ↓
Compensation Assessment
       ↓
Compensation Payment
       ↓
Possession
       ↓
Rehabilitation / Resettlement
       ↓
Land History
```

---

# Private Land Sale Flow

```text
Buyer / Seller
      ↓
Land details
      ↓
Required documents
      ↓
Transaction submission
      ↓
Police verification
      ↓
Approve / Reject
      ↓
Sold / Rejected
```

---

# Technology Stack

| Layer                | Technology              |
| -------------------- | ----------------------- |
| Frontend             | React 18                |
| Build Tool           | Vite                    |
| Styling              | Tailwind CSS            |
| Animation            | Framer Motion           |
| Routing              | React Router            |
| Internationalization | i18next + react-i18next |
| HTTP Client          | Axios                   |
| Maps                 | Leaflet + React Leaflet |
| Map Data             | OpenStreetMap           |
| Charts               | Recharts                |
| Backend              | Node.js                 |
| API Framework        | Express.js              |
| Database             | SQLite                  |
| SQLite Driver        | better-sqlite3          |
| Authentication       | JWT                     |
| File Uploads         | Multer                  |
| Image Processing     | Jimp                    |
| PDF Reports          | PDFKit                  |
| Excel Reports        | ExcelJS                 |
| Voice Input          | Browser Web Speech API  |

---

# Project Architecture

```text
                    ┌──────────────────────────┐
                    │       React Frontend      │
                    │                          │
                    │ React + Vite             │
                    │ Tailwind CSS             │
                    │ Framer Motion            │
                    │ Leaflet                  │
                    │ Recharts                 │
                    │ i18next                  │
                    └────────────┬─────────────┘
                                 │
                              Axios
                                 │
                              /api
                                 │
                    ┌────────────▼─────────────┐
                    │      Express Backend      │
                    │                          │
                    │ JWT Authentication       │
                    │ Role Authorization       │
                    │ REST APIs                │
                    │ File Uploads             │
                    │ Image Processing         │
                    │ Report Generation        │
                    └────────────┬─────────────┘
                                 │
                         better-sqlite3
                                 │
                    ┌────────────▼─────────────┐
                    │       SQLite Database     │
                    │                          │
                    │ Users                    │
                    │ Projects                 │
                    │ Proposals                │
                    │ Parcels                  │
                    │ Compensation             │
                    │ Possession               │
                    │ Rehabilitation           │
                    │ Documents                │
                    │ Transactions             │
                    │ History                  │
                    │ Notifications             │
                    └──────────────────────────┘
```

---

# Project Structure

```text
bhumi-app/
│
├── README.md
├── PRD.md
├── TRD.md
├── package.json
├── package-lock.json
│
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   │
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       │
│       ├── api/
│       │   └── client.js
│       │
│       ├── context/
│       │   └── AuthContext.jsx
│       │
│       ├── components/
│       │   ├── FeatureLayer.jsx
│       │   ├── Navbar.jsx
│       │   ├── ProfileMenu.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── StatusStepper.jsx
│       │   └── VoiceInput.jsx
│       │
│       ├── i18n/
│       │   ├── en.json
│       │   ├── hi.json
│       │   └── index.js
│       │
│       └── pages/
│           ├── Home.jsx
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── Projects.jsx
│           ├── MapView.jsx
│           ├── Compensation.jsx
│           ├── Possession.jsx
│           ├── Rehabilitation.jsx
│           ├── Documents.jsx
│           ├── Satellite.jsx
│           ├── StateRanking.jsx
│           ├── Chatbot.jsx
│           ├── Reports.jsx
│           ├── Profile.jsx
│           ├── AadhaarRegister.jsx
│           ├── Schemes.jsx
│           ├── LandTransactions.jsx
│           ├── LandTransactionForm.jsx
│           ├── LandTransactionDetail.jsx
│           ├── LandTransactionQueue.jsx
│           └── LandHistory.jsx
│
└── backend/
    ├── package.json
    ├── package-lock.json
    ├── server.js
    ├── nodemon.json
    ├── .env.example
    │
    ├── middleware/
    │   └── auth.js
    │
    ├── db/
    │   ├── init.js
    │   ├── seed.js
    │   └── history.js
    │
    └── routes/
        ├── auth.js
        ├── proposals.js
        ├── parcels.js
        ├── compensation.js
        ├── possession.js
        ├── rehabilitation.js
        ├── documents.js
        ├── satellite.js
        ├── chatbot.js
        ├── dashboard.js
        ├── reports.js
        ├── notifications.js
        ├── landTransactions.js
        └── landHistory.js
```

---

# Database

Bhumi uses **SQLite** through `better-sqlite3`.

The database schema contains tables for:

```text
users
otp_codes
projects
proposals
land_parcels
compensation
possession
rehabilitation
documents
notifications
state_stats
land_transactions
transaction_documents
land_history_events
```

---

# Database Relationships

The main acquisition relationship is:

```text
Project
   │
   ├── Proposals
   │
   └── Land Parcels
          │
          ├── Compensation
          ├── Possession
          ├── Rehabilitation
          ├── Documents
          └── Land History
```

Private transactions are separated from government acquisition:

```text
Land ID
   │
   ├── Government Acquisition History
   │
   └── Private Transaction History
          │
          └── Transaction Documents
```

---

# API Modules

The backend exposes REST APIs under `/api`.

## Authentication

```text
POST   /api/auth/otp/send
POST   /api/auth/otp/verify
GET    /api/auth/me
PATCH  /api/auth/me
POST   /api/auth/guest
POST   /api/auth/demo-login
POST   /api/auth/google
POST   /api/auth/aadhaar/send
POST   /api/auth/aadhaar/verify
```

## Projects & Proposals

```text
GET    /api/projects
POST   /api/projects
GET    /api/proposals/:projectId
PATCH  /api/proposals/:id/advance
```

## Parcels

```text
GET    /api/parcels
GET    /api/parcels/:id
POST   /api/parcels
PATCH  /api/parcels/:id/status
GET    /api/parcels/unused/nearby
```

## Compensation

```text
GET    /api/compensation
GET    /api/compensation/parcel/:parcelId
POST   /api/compensation/calculate
POST   /api/compensation/parcel/:parcelId
PATCH  /api/compensation/:id/pay
```

## Possession

```text
GET    /api/possession
PATCH  /api/possession/:parcelId
```

## Rehabilitation

```text
GET    /api/rehabilitation
POST   /api/rehabilitation
PATCH  /api/rehabilitation/:id/resettle
```

## Documents

```text
GET    /api/documents
POST   /api/documents/upload
GET    /api/documents/:id/download
```

## Satellite

```text
POST   /api/satellite/:parcelId/compare
```

## Chatbot

```text
POST   /api/chatbot/query
```

## Dashboard

```text
GET    /api/dashboard/summary
GET    /api/dashboard/state-wise
GET    /api/dashboard/project-progress
GET    /api/dashboard/state-ranking
```

## Reports

```text
GET    /api/reports/pdf
GET    /api/reports/excel
```

## Notifications

```text
GET    /api/notifications
PATCH  /api/notifications/:id/read
```

## Private Land Transactions

```text
GET    /api/land-transactions/required-docs
GET    /api/land-transactions/mine
GET    /api/land-transactions/queue
GET    /api/land-transactions/:id
POST   /api/land-transactions
PATCH  /api/land-transactions/:id/verify
GET    /api/land-transactions/documents/:docId/download
```

## Land History

```text
GET    /api/land-history/:landId
```

## Backend Health Check

```text
GET    /api/health
```

---

# Installation

## Prerequisites

Install:

* Node.js
* npm
* Git

Because the backend currently uses `better-sqlite3`, your system may also need the native build tools required by that package.

---

# Running the Project

After cloning/downloading the project:

```bash
cd bhumi-app
```

Install both frontend and backend dependencies:

```bash
npm install
```

---

# Create the Environment File

### Windows Command Prompt

```cmd
copy backend\.env.example backend\.env
```

### PowerShell

```powershell
Copy-Item backend\.env.example backend\.env
```

### macOS / Linux

```bash
cp backend/.env.example backend/.env
```

---

# Seed Demo Data

Run:

```bash
npm run seed
```

This creates demo users and sample data for:

* Projects
* Proposals
* Land parcels
* Compensation
* Possession
* Rehabilitation
* State statistics
* Land history

---

# Start the Application

Run:

```bash
npm run dev
```

This starts:

```text
Backend  → http://localhost:5000
Frontend → http://localhost:5173
```

Open the frontend in your browser:

```text
http://localhost:5173
```

---

# Individual Commands

If you want to run the services separately:

## Backend

```bash
cd backend
npm install
npm run dev
```

## Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

---

# Production Frontend Build

Inside the frontend directory:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

---

# Demo Accounts

The seed script creates the following accounts:

| Role             | Demo User                         | Mobile       |
| ---------------- | --------------------------------- | ------------ |
| Central Ministry | Central Ministry                  | `9000000001` |
| State Officer    | Rajasthan State Office            | `9000000002` |
| District Officer | Jaipur District Office            | `9000000003` |
| Project Agency   | NHAI Project Agency               | `9000000004` |
| Farmer           | Ramesh Kumar                      | `9000000005` |
| Farmer           | Sunita Devi                       | `9000000006` |
| Police           | Jaipur Police (Land Verification) | `9000000007` |

The login page provides role-based demo quick-access buttons, so the accounts do not need to be manually entered during a presentation.

---

# Demo OTP

The project is configured with:

```env
OTP_DEV_MODE=true
```

Therefore the OTP is:

* Printed in the backend console.
* Returned in the API response during development.
* Displayed by the frontend where applicable.

No real SMS is sent.

---

# Environment Variables

The backend uses:

```env
PORT=5000
JWT_SECRET=change_this_to_a_long_random_secret
DB_PATH=./db/bhumi.sqlite
OTP_DEV_MODE=true
GOOGLE_CLIENT_ID=
```

### PORT

Controls the backend server port.

### JWT_SECRET

Secret used to sign authentication tokens.

For production, replace the demo value with a long random secret.

### DB_PATH

Location of the SQLite database.

### OTP_DEV_MODE

When enabled, OTP codes are exposed for development/demo use.

### GOOGLE_CLIENT_ID

Reserved for future real Google OAuth integration.

---

# File Uploads

Uploaded files are stored locally by the backend.

Regular documents:

```text
backend/uploads/
```

Private transaction documents:

```text
backend/uploads/land-transactions/
```

Satellite comparison images:

```text
backend/uploads/satellite/
```

The current application is therefore intended for a local/demo environment rather than production cloud file storage.

---

# Important Demo Limitations

Bhumi is a hackathon-scale prototype. The following integrations are simulated:

## Aadhaar

The Aadhaar verification flow is a mock verification process.

It is **not connected to UIDAI**.

Do not use real Aadhaar information in the demo database.

---

## OTP / SMS

OTP is generated by the backend.

No real SMS gateway is connected.

---

## Google Authentication

The Google login button uses a simulated demo account.

It does not perform production Google OAuth verification.

---

## Satellite Analysis

The satellite module does not retrieve real satellite imagery.

It compares two uploaded images using pixel-level differences.

The output should therefore be treated as a demonstration of the workflow, not as a real remote-sensing or legal encroachment determination.

---

## Notifications

Email and SMS channels are represented in the database, but actual delivery providers are not connected.

---

## Land Transaction Verification

Police verification is simulated through the application's police officer account.

It does not connect to a real police or government verification system.

---

# Security Notes

The current implementation is intended for demonstration.

Before production deployment, the system should additionally implement:

* Real SMS/OTP provider integration
* Real UIDAI-approved identity verification where legally permitted
* Production OAuth configuration
* Strong production secrets
* HTTPS
* Secure file storage
* File type validation
* Malware scanning
* Access control at the resource level
* Audit logging and monitoring
* Rate limiting
* Input sanitization
* Production database infrastructure
* Secure secret management
* Government API authorization where required

---

# Future Scope

Possible future extensions include:

* Real government identity integrations
* Real SMS/WhatsApp integration
* Real satellite imagery APIs
* Advanced satellite change detection using computer vision
* Automated land-record verification
* ULPIN integration
* Digital signatures
* Blockchain-backed document/audit verification
* Advanced GIS parcel boundaries
* Multi-state government infrastructure
* Cloud file storage
* Mobile applications
* More comprehensive notification services
* Real-time officer alerts
* Advanced analytics
* AI-assisted document verification
* Multilingual chatbot expansion

---

# Core Workflow Summary

Bhumi combines two major land workflows.

## Government Acquisition

```text
Proposal
   ↓
Review & Approval
   ↓
Land Identification
   ↓
GIS Mapping
   ↓
Acquisition Notification
   ↓
Compensation
   ↓
Possession
   ↓
Rehabilitation & Resettlement
   ↓
Complete Government Land History
```

## Private Land Transaction

```text
Buyer / Seller
      ↓
Land Details
      ↓
Document Upload
      ↓
Transaction Submitted
      ↓
Police Verification
      ↓
Approve / Reject
      ↓
Sold / Rejected
      ↓
Transaction History
```

Together, these workflows allow Bhumi to maintain a more complete picture of a land parcel's journey across both **government acquisition activity** and **private buying/selling activity**.

---

# License

This project is developed as a hackathon/academic demonstration project.

Government names, schemes, laws, organizations, and example project data are used for demonstration and educational purposes. Real-world deployment would require appropriate legal, governmental, security, and data-protection approvals.
