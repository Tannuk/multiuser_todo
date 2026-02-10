# 🚀 Multi-User Todo App - Production Ready

A full-featured, multi-user todo application with authentication, daily progress tracking, and monthly statistics. Ready for public deployment!

## ✨ Features

### 🔐 User Authentication
- **Register** - Create new accounts with username, email, password
- **Login/Logout** - Secure session-based authentication
- **Password Hashing** - Uses Werkzeug for secure password storage
- **User Isolation** - Each user sees only their own tasks

### 📊 Task Management
- ✅ Add, edit, delete tasks
- ☑️ Mark tasks complete with checkboxes
- 📈 Real-time daily progress bar
- 📊 Weekly overview (last 7 days)
- 📈 Monthly statistics (up to 12 months)

### 💾 Database
- **SQLite** - Lightweight, file-based database (included)
- **Easy to upgrade** - Can switch to PostgreSQL/MySQL for production
- **User & Todo tables** - Proper relational structure
- **Automatic migrations** - Database created on first run

## 📁 Project Structure

```
multiuser_todo/
│
├── app.py                  # Flask app with auth & API
├── requirements.txt        # Python dependencies
├── todos.db               # SQLite database (auto-created)
│
├── templates/
│   └── index.html         # HTML with auth screens
│
└── static/
    ├── style.css          # Complete styling
    └── script.js          # Frontend logic
```

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the App
```bash
cd multiuser_todo
python app.py
```

### 3. Open Browser
Visit: **http://localhost:5000**

### 4. Create Account
- Click "Sign up"
- Enter username, email, password
- Start adding tasks!

## 🌐 Deploy to Production

### Option 1: Heroku (Recommended for Beginners)

1. **Install Heroku CLI**
```bash
# Install from https://devcenter.heroku.com/articles/heroku-cli
```

2. **Create Procfile**
```bash
echo "web: gunicorn app:app" > Procfile
```

3. **Install Gunicorn**
```bash
pip install gunicorn
pip freeze > requirements.txt
```

4. **Deploy**
```bash
heroku login
heroku create your-todo-app-name
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

5. **Upgrade to PostgreSQL (Optional but Recommended)**
```bash
heroku addons:create heroku-postgresql:mini
```

Then update `app.py`:
```python
import os
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///todos.db')
```

### Option 2: Railway

1. Visit **https://railway.app**
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Flask and deploys!

### Option 3: Render

1. Visit **https://render.com**
2. Sign up and create "New Web Service"
3. Connect GitHub repo
4. Set:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
5. Deploy!

### Option 4: PythonAnywhere

1. Visit **https://www.pythonanywhere.com**
2. Create free account
3. Upload your files
4. Create a web app (Flask)
5. Configure WSGI file
6. Reload and you're live!

### Option 5: DigitalOcean / AWS / VPS

1. **Setup server**
```bash
sudo apt update
sudo apt install python3 python3-pip nginx
```

2. **Install app**
```bash
git clone your-repo
cd multiuser_todo
pip3 install -r requirements.txt
pip3 install gunicorn
```

3. **Run with Gunicorn**
```bash
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

4. **Setup Nginx** (reverse proxy)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

5. **Setup systemd service** (auto-restart)
```ini
[Unit]
Description=Todo App
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/multiuser_todo
ExecStart=/usr/local/bin/gunicorn -w 4 -b 127.0.0.1:8000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

## 🔒 Security Considerations

### Before Going Public:

1. **Change Secret Key** in `app.py`:
```python
import os
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'fallback-secret-key')
```

Set in production:
```bash
export SECRET_KEY='your-super-secret-random-key-here'
```

2. **Use PostgreSQL** (not SQLite) for production:
```python
# Install psycopg2
pip install psycopg2-binary

# Update app.py
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:password@localhost/dbname'
```

3. **Enable HTTPS** (use Let's Encrypt or platform SSL):
```python
from flask_talisman import Talisman
Talisman(app)
```

4. **Add rate limiting**:
```python
from flask_limiter import Limiter
limiter = Limiter(app, key_func=lambda: request.remote_addr)

@limiter.limit("5 per minute")
@app.route('/api/login', methods=['POST'])
def login():
    # ...
```

5. **Email verification** (optional):
```python
from flask_mail import Mail, Message
# Send verification email on registration
```

## 🎨 Customization

### Change Colors
Edit `static/style.css`:
```css
/* Main gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Try different themes! */
background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);  /* Pink */
background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);  /* Blue */
background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);  /* Green */
```

### Add Features
- Email notifications
- Task categories/tags
- Due dates and reminders
- Team collaboration
- File attachments
- Calendar view
- Export to CSV/PDF

## 📊 Database Schema

### User Table
- id (Primary Key)
- username (Unique)
- email (Unique)
- password_hash
- created_at

### Todo Table
- id (Primary Key)
- text
- completed (Boolean)
- date (YYYY-MM-DD)
- month (YYYY-MM)
- created_at
- user_id (Foreign Key → User)

## 🔧 Environment Variables

For production, set these:

```bash
export SECRET_KEY='your-random-secret-key'
export DATABASE_URL='postgresql://...'  # If using PostgreSQL
export FLASK_ENV='production'
```

## 📈 Scaling Tips

### For 100+ Users:
- Switch to PostgreSQL or MySQL
- Add Redis for session storage
- Enable caching
- Use CDN for static files

### For 1000+ Users:
- Use Gunicorn with multiple workers
- Add load balancer
- Database connection pooling
- Implement queue system (Celery)

### For 10,000+ Users:
- Kubernetes deployment
- Separate database server
- Microservices architecture
- Full monitoring stack

## 🐛 Troubleshooting

**Database not found?**
- Run `python app.py` once to create tables

**403 errors?**
- Check SECRET_KEY is set

**Can't login?**
- Clear browser cookies
- Check database exists

**Slow performance?**
- Add database indexes
- Enable query caching
- Use production WSGI server

## 📝 License

Free to use for personal and commercial projects!

## 🎓 What You Learn

- Flask authentication
- SQLAlchemy ORM
- Database relationships
- Session management
- Password hashing
- RESTful API design
- Production deployment
- Security best practices

---

**Built for production** • **Multi-user ready** • **Secure by default**

Enjoy your deployed todo app! 🎉
