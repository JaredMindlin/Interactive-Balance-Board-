**Montessori Interactive Balance Board App**
This project is part of the Montessori Interactive Balance Board System, which aims to provide an engaging, technology-enhanced educational tool for children. The app serves as the primary interface for interacting with the system, enabling game selection, system control, and real-time status updates of connected devices.

**Features: ✅ Completed Features**
System Control Dashboard:<br />
* Toggle system ON/OFF and manage connections to devices (ESP32 boards).
* Display the count of connected devices in real-time.
* Monitor and control the system's LED status.

**Game Modes:**
Pathway Game: Guide the user from a starting point (green node) to a destination (red node) via blue LED pathways (placeholder created).<br />
Up Next Game: Sequentially guide the user through a series of dynamically changing nodes (placeholder created).<br />

**Database Integration:**
Real-time updates of system and game states using MongoDB.<br />
Persistent storage for:<br />
* System status (ON/OFF).
* Connected devices count.
* LED state.
* Selected game mode.

**Frontend-Backend Communication:**
* API integration between the React frontend and the Node.js/Express backend.
* Live updates to the backend state via Axios.

**Wi-Fi/Bluetooth Integration: 🚧 In Progress**
* Communication between the app and the ESP32 server for real-time hardware interaction.
* Enable hardware-triggered events and feedback.

**Game Interactions:**
* Fully interactive gameplay tied to hardware input/output (e.g., LED activation and sensor feedback).
* Dependency on ESP32 connections and hardware setup.

**Installation and Setup:**

**Prerequisites**
* Node.js and npm/yarn installed on your system.
* MongoDB Atlas account or a locally hosted MongoDB instance.
* ESP32 with Arduino IDE configured for Wi-Fi/Bluetooth communication.

**Steps**
Clone the repository:
* git clone https://github.com/JaredMindlin/Interactive-Balance-Board-.git
* cd Interactive-Balance-Board

Install dependencies for both frontend and backend:
* cd montessori-app/frontend
* npm install
* cd ../backend
* npm install

Start the MongoDB database connection and backend server:
* node server.js

Start the frontend development server:
* cd ../frontend
* npm start

Access the app at http://localhost:3000 locally or http://'your.network.ip':3000.

**Usage**
* Navigate to the System Control page to manage the system's state and connected devices.
* Select a game mode from the Game Modes page. Changes will reflect in the database.
* Monitor real-time system updates and continue further Wi-Fi/Bluetooth integration.

**Future Goals**
* Finalize hardware communication for seamless interaction between the app and the ESP32 server.
* Enhance gameplay by incorporating live feedback from sensors and LEDs.
* Improve UI/UX based on user testing and feedback.

**All Known Bugs**
* Apart from placeholders for 'In Progress' work, inexpected behavior currently only lies in communicating with the ESP32 Server Board to actually track the real-time user data.<br />
* We have attempted to integrate the app to have access to HTTP requests made by the board to update the backend database and trigger the board to dequeue and sleep its process, however this feature has been moved under 'In Progress' by the team.