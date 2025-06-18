🚍 TrackIt
TrackIt is a React Native application designed to enable real-time bus tracking for students, drivers, and administrators. The app provides live location sharing, route management, driver-passenger messaging, SOS alerts, and profile management for a smooth commuting experience.

✨ Features
🎫 Role-Based Access
Drivers: Share live location, manage routes, send messages, trigger SOS alerts.

Students: View driver location on a map, receive route info & messages, SOS reception.

Admin: Manage drivers, routes, monitor activity, receive SOS alerts.

🗺 Live Bus Tracking
Real-time map showing driver location.

Route stops displayed with polylines and markers.

📍 Geolocation Features
Live updates using device GPS.

Detect if the bus is stationary for too long → automatic SOS trigger.

🔔 Messaging System
Drivers can send messages to connected students.

Admins notified of SOS or emergencies.

🆘 SOS Alerts
Triggered by:

Long-pressing volume button (Driver side)

Inactivity detection (bus not moving for X minutes)

Alerts sent to Admin for immediate response.

👤 Profile Management
Passengers can create and edit their profiles.

⚙️ Tech Stack
Tech	Purpose
React Native	Frontend (with Expo)
Supabase	Backend (Database + Auth + Storage)
React Native Maps	Maps display
Expo Location	Geolocation tracking
Native Modules	Volume button detection (SOS)

