# 🐟 Madha Marines Inventory Management System

A full-stack **Inventory Management System** developed for **Madha Marines**, a fish-net and fishing accessories business.

The system is designed to simplify day-to-day inventory operations by managing products, stock movement, suppliers, customers, sales, invoices, and reports through a centralized web application.

## 🚀 Features

- 🔐 Admin Login & Logout
- 📊 Interactive Dashboard
- 📦 Product Management
- ⬇️ Stock In Management
- ⬆️ Stock Out / Sales Management
- 🏭 Supplier Management
- 👥 Customer Management
- 🗃️ Inventory Overview
- ⚠️ Low Stock Monitoring
- 💰 Daily & Monthly Sales Tracking
- 📈 Sales Analytics
- 🧾 Invoice Management
- 📑 Reports
- ⚙️ Business Settings
- 🔎 Product Search
- 📱 Responsive Navigation
- ☁️ Cloud Database Integration

## 🛠️ Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript
- Font Awesome
- Chart.js

### Backend
- Python
- Flask

### Database
- MySQL
- MySQL Connector for Python

### Deployment
- Railway
- Railway MySQL
- Gunicorn

### Version Control
- Git
- GitHub

## 📂 Project Structure

```text
madha-marines-inventory/
│
├── app.py
├── database.py
├── create_admin.py
├── requirements.txt
├── .gitignore
│
├── templates/
│   ├── login.html
│   ├── dashboard.html
│   ├── products.html
│   ├── stock-in.html
│   ├── stock-out.html
│   ├── suppliers.html
│   ├── customers.html
│   ├── inventory.html
│   ├── reports.html
│   └── settings.html
│
└── static/
    ├── css/
    ├── js/
    └── images/
```

## ⚙️ How It Works

The application uses a Flask backend to handle requests and communicate with the MySQL database.

```text
User
  ↓
Web Browser
  ↓
HTML / CSS / JavaScript
  ↓
Flask Backend
  ↓
MySQL Database
```

The production version is deployed using Railway with a cloud-hosted MySQL database.

## 💻 Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/AhilRoy/madha-marines-inventory.git
```

### 2. Enter the project directory

```bash
cd madha-marines-inventory
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the project root and configure your database credentials.

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=madha_marines_db

FLASK_SECRET_KEY=your_secret_key
```

> Never commit the `.env` file to GitHub.

### 5. Start the application

```bash
python app.py
```

Then open:

```text
http://127.0.0.1:5000
```

## 🔒 Security

Sensitive information such as database passwords and Flask secret keys is stored using environment variables and excluded from Git using `.gitignore`.

User sessions are used to protect authenticated application pages.

## ☁️ Deployment

The application is deployed using **Railway**.

Production architecture:

```text
GitHub Repository
       ↓
Railway
       ↓
Gunicorn + Flask
       ↓
Railway MySQL
```

Updates pushed to the main GitHub branch can be automatically redeployed by Railway.

## 🎯 Purpose

The project was created to provide a simple and practical inventory management solution for a real-world small business.

It demonstrates full-stack web development concepts including:

- Frontend development
- REST API integration
- Backend development
- Relational database management
- Authentication
- Inventory management
- Sales tracking
- Cloud database deployment
- Production web deployment
- Git and GitHub version control

## 🔮 Future Improvements

Possible future enhancements include:

- Barcode / QR code scanning
- Advanced sales analytics
- Automatic database backups
- PDF invoice improvements
- Role-based user accounts
- Email notifications
- Low-stock notifications
- Custom domain
- Progressive Web App (PWA)
- Mobile application integration

## 👨‍💻 Developer

**Ahil Roy**

B.Tech Student  
Ponjesly College of Engineering  
Anna University Affiliated

## 📄 Project Status

**Version 1.0 — Completed & Deployed ✅**

The core inventory management system is fully functional and deployed for online use.
