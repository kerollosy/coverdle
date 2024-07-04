# Coverdle
A  daily puzzle game challenging players to guess album covers within a limited time frame.

## Technologies Used
- **Flask:** A lightweight WSGI web application framework used to serve the web interface and handle backend logic.
- **Redis:** Employed for caching to improve performance and reduce database load.
- **PostgreSQL:** The primary database for storing puzzle data, user responses, and other necessary information.
- **jQuery:** Utilized for the frontend to create interactive web pages and simplify DOM manipulation, event handling, and Ajax interactions.

## Getting Started
To run Coverdle locally, follow these steps:

1. **Clone the Repository:**
```
git clone https://github.com/kerollosy/coverdle.git
cd daily-music-puzzle
```

2. **Set Up Environment Variables:**
Create a `.env` file in the project root and define the necessary environment variables:
```
REDIS_URL=redis://localhost:6379

POSTGRES_HOST=localhost
POSTGRES_DATABASE=yourdatabase
POSTGRES_USER=youruser
POSTGRES_PASSWORD=yourpassword 

SECRET_KEY=yoursecretkey
ADMIN_PASSWORD=password
```
3. **Install Dependencies:**
```
pip install -r requirements.txt
```

4. **Initialize the Database:**
Ensure your PostgreSQL database is set up according to the schema expected by the application.

5. **Run the Application:**
```
flask run
```
The application will start running on `http://localhost:5000`.

## Todo 
### In Progress
- [ ] Make a confirmation when the user clicks the "I don't know" button
- [ ] Switch from alerts() to popups
- [ ] When an album is added to the control panel, it should be added to the suggestions automatically

### Done ✓

- [x] Save cookies till the next day to prevent players from replaying the same day
- [x] Make the contact button send an email to me
- [x] View the correct answer and a timer after the user finishes
- [x] View the statistics (finished within x seconds and with y guesses left)
- [x] Show the recommendations correctly
- [x] Make it "daily"

## Contributing
Contributions to Coverdle are welcome! Whether it's bug fixes, new features, or improvements to the documentation, feel free to fork the repository and submit a pull request.