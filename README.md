# 🥐 APJ Bakery - Traditional Tamil Nadu Snack System

A premium, full-stack bakery and snack ordering system inspired by the heritage of Tamil Nadu. Built with **Spring Boot** and **Vanilla JS**, featuring a modern traditional aesthetic, QR-based ordering, and multi-language support.

## ✨ Features

-   **📜 Traditional Menu**: Authentic Tamil Nadu snacks (Murukku, Adhirasam, etc.).
-   **📲 QR Code Ordering**: Scan a table-specific QR code to lock your table and order instantly.
-   **🌐 Multi-Language**: Switch between **Tamil (தமிழ்)**, Hindi, and English.
-   **🎁 Combo Offers**: Highlighted section for special festival and tea-time packs.
-   **🎨 Traditional Aesthetic**: A rich Maroon and Gold theme with parchment backgrounds.
-   **📊 Admin Dashboard**: Manage orders in real-time with a Kanban-style kitchen board.

## 🚀 Tech Stack

-   **Backend**: Java 17+, Spring Boot 3.5.x, Spring Data JPA, H2 (In-Memory).
-   **Frontend**: HTML5, Vanilla CSS3, Modern JavaScript (ES6+).
-   **Icons**: Custom Vector SVGs.

## 🛠️ How to Run Locally

### Prerequisites
-   Java 17 or higher.
-   Git.

### Steps
1.  Clone the repository:
    ```bash
    git clone https://github.com/YOUR_USERNAME/apj-bakery-system.git
    ```
2.  Navigate to the folder:
    ```bash
    cd apj-bakery-system
    ```
3.  Run the application:
    *   **Windows**: Double-click `start-bakery.bat`.
    *   **Linux/Mac**: `./mvnw spring-boot:run`

4.  Open [http://localhost:8080](http://localhost:8080) in your browser.

## 📲 QR Ordering Demo
To simulate a QR scan for Table 7, visit:
`http://localhost:8080/?table=7`

## 🛡️ Admin Access
-   **URL**: `http://localhost:8080/admin-login.html`
-   **Credentials**: `admin` / `admin123`

---
Built with ❤️ for Traditional Taste.
