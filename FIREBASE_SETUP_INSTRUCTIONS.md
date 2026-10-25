# LearnSmart AI - Firebase Authentication & Cloud Firestore Setup Instructions

This document provides step-by-step instructions to configure **Firebase Authentication** and **Cloud Firestore** for LearnSmart AI.

---

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or select an existing Google Cloud project).
3. Name your project (e.g. `learnsmart-ai-production`) and complete the creation wizard.

---

## 2. Register a Web App in Firebase

1. In your Firebase project dashboard, click the **Web icon (`</>`)** to add a web application.
2. Enter an App nickname: `learnsmart-web`.
3. Check or leave unchecked Firebase Hosting as needed, then click **Register app**.
4. You will see your Firebase SDK configuration object:
   ```json
   {
     "apiKey": "AIzaSy...",
     "authDomain": "<project-id>.firebaseapp.com",
     "projectId": "<project-id>",
     "storageBucket": "<project-id>.appspot.com",
     "messagingSenderId": "...",
     "appId": "1:...:web:..."
   }
   ```
5. Save this configuration in `firebase-applet-config.json` at the project root.

---

## 3. Enable Firebase Authentication

1. In the Firebase Console left navigation, select **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab:
   - **Email/Password**: Click **Email/Password**, toggle **Enable**, and click **Save**.
   - **Google Sign-In**: Click **Google**, toggle **Enable**, select your project support email, and click **Save**.
4. Under **Authorized domains**:
   - Add your application domain (e.g., your Cloud Run / staging URL or `localhost`).

---

## 4. Provision Cloud Firestore Database

1. In the left navigation, select **Build > Firestore Database**.
2. Click **Create database**.
3. Choose a Database location close to your users (e.g. `asia-east1`, `us-central1`, etc.).
4. Choose **Start in production mode** (this enforces our security rules immediately).
5. Click **Create**.

---

## 5. Deploy Security Rules (`firestore.rules`)

The repository includes a pre-configured, hardened `firestore.rules` file built with Attribute-Based Access Control (ABAC) and Zero-Trust isolation.

### Option A: Firebase CLI (Recommended)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Log in: `firebase login`
3. Initialize in this directory: `firebase init firestore` (select your existing project and choose `firestore.rules`)
4. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Option B: Firebase Console
1. Open the Firebase Console > **Firestore Database** > **Rules** tab.
2. Copy the contents of `firestore.rules` from this repository.
3. Paste into the editor and click **Publish**.

---

## 6. Security Guarantees Enforced

| Resource Path | Read Security | Write Security | Purpose |
|---|---|---|---|
| `/users/{userId}` | `request.auth.uid == userId` | Validated student schema, immutable ID | Student private profile |
| `/users/{userId}/quizAttempts/{quizId}` | `request.auth.uid == userId` | Validated score, topic, questions count | Assessment history |
| `/users/{userId}/studyPlans/{planId}` | `request.auth.uid == userId` | Validated duration, type, reason | Adaptive study schedule |
| `/users/{userId}/topicMastery/{topicId}`| `request.auth.uid == userId` | Validated score, mastery status | Personalized recommendations |
| `/{document=**}` (All other paths) | **Deny (`false`)** | **Deny (`false`)** | Global catch-all default deny |

- **No Blanket Reads:** Enumerating student records is strictly blocked (`allow list: if false` on `/users`).
- **Data Isolation:** A student cannot read, overwrite, or delete another student's quizzes or study plans.
- **Client Key Security:** Gemini API keys and server secrets remain strictly on the backend and are never exposed to browser client code.
