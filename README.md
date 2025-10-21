**[INSTRUCTIONS_FOR_RUNNING]**

***=====> FOR BACKEND <=====***

*use powershell*
* cd backend
* .\venv\Scripts\activate
* python manage.py runserver  

***=====> FOR FRONTEND <=====***

*use cmd*
* cd frontend
*  npm start

***====> ACCOUNTS REGISTERED <====***

> 'username'
> 'password'

<ins>USER</ins>        
suppy           
12345           

hotaru          
12345           

kauri
09876

<ins>ADMIN</ins>
kyle
09876

yoshi
09876

====> DEACTIVATED (blocked) ACCOUNTS <====


(please add newly created account..)

[INSTRUCTIONS_FOR_RUNNING]


# UPDATES

## 10/20/2025

We can mark everything we've done as Sprint 1, covering:

- Authentication (Login/Register with JWT) ✔️
- Landing page with redirect buttons ✔️
- Sidebar layout for dashboard pages ✔️
- View Logs page with status management and 15 recent activity items ✔️
- UI tweaks like logos linking to landing page ✔️


# FILE TREE (DONT MIND THIS HEHE)

[FILE_TREE]

SE2_ProjectWeb/
├── backend/
│ ├── venv
│ ├── db.sqlite3
│ ├── manage.py
│ ├── accounts/
│ │   ├── init.py
│ │   ├── admin.py
│ │   ├── apps.py
│ │   ├── models.py
│ │   ├── serializers.py
│ │   ├── tests.py
│ │   ├── urls.py
│ │   ├── views.py
│ │   ├── pycache/
│ │   └── migrations/
│ │     └── ...
│ └── backend/
│   ├── init.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── pycache/
├── frontend/
│ ├── .gitignore
│ ├── package.json
│ ├── postcss.config.js
│ ├── README.md
│ ├── tailwind.config.js
│ ├── public/
│ └── src/
│ │  └── icons/
│ │  │   └──CHONKY_LOGO.png
│ │  └── components/
│ │  │   └──DashboardHome.jsx
│ │  │   └──MainLayout.jsx
│ │  │   └──ProtectedRoute.jsx
│ │  │   └──Sidebar.jsx
│ │  └── pages/
│ │  │   └──AboutUs.jsx
│ │  │   └──Dashboard.jsx
│ │  │   └──LandingPage.jsx
│ │  │   └──Login.jsx
│ │  │   └──Register.jsx
│ │  │   └──ServicesDashboard.jsx
│ │  │   └──Shop.jsx
│ │  │   └──Viewlogs.jsx
│ │  ├── App.css
│ │  ├── App.js
│ │  ├── App.test.js
│ │  ├── index.css
│ │  ├── index.js
│ │  ├── reportWebVitals.js
│ │  ├── setupTests.js

[FILE_TREE]

