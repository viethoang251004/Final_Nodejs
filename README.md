# Final_Nodejs

## Project Setup Guide

### Step-by-Step Instructions

1. **Navigate to the `backend` Folder**  
   Open your terminal and change directory to the `backend` folder.

2. **Install Dependencies**  
   Run the following command to install the necessary dependencies:
   ```bash
   npm install
   ```

3. **Build and Start the Docker Containers**  
   After installing the dependencies, return to the main project folder (where the `backend` folder and the `docker-compose.yml` file are located). Then, run:
   ```bash
   docker-compose build
   docker-compose up
   ```

4. **Set Default Data for the Database**  
   Go back to the *backend* folder and execute the following command to populate the database with default data:
   ```bash
   node seed.js
   ```

5. **Access the Login Page**  
   Once the setup is complete, open your browser and go to the following URL to access the login page:  
   [http://localhost:8080/](http://localhost:8080/)

---

### Account Information

To log in to the system, use the following credentials:

- **Email**: admin@gmail.com
- **Password**: admin@123
