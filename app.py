from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from functools import wraps
import calendar
from collections import defaultdict

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///todos.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    todos = db.relationship('Todo', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Todo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(500), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    date = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD
    month = db.Column(db.String(7), nullable=False)  # YYYY-MM
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

# Create tables
with app.app_context():
    db.create_all()

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

# Helper functions
def get_date_key():
    return datetime.now().strftime('%Y-%m-%d')

def get_month_key():
    return datetime.now().strftime('%Y-%m')

# Authentication Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return jsonify({'error': 'All fields required'}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(username=username, email=email)
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    session['user_id'] = user.id
    session['username'] = user.username
    
    return jsonify({
        'message': 'Registration successful',
        'user': {'id': user.id, 'username': user.username}
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    if user and user.check_password(password):
        session['user_id'] = user.id
        session['username'] = user.username
        return jsonify({
            'message': 'Login successful',
            'user': {'id': user.id, 'username': user.username}
        }), 200
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    if 'user_id' in session:
        return jsonify({
            'authenticated': True,
            'user': {
                'id': session['user_id'],
                'username': session['username']
            }
        }), 200
    return jsonify({'authenticated': False}), 200

# Main Routes
@app.route('/')
def index():
    return render_template('index.html')

# Todo Routes
@app.route('/api/todos', methods=['GET'])
@login_required
def get_todos():
    user_id = session['user_id']
    today = get_date_key()
    todos = Todo.query.filter_by(user_id=user_id, date=today).all()
    
    return jsonify([{
        'id': t.id,
        'text': t.text,
        'completed': t.completed,
        'date': t.date,
        'month': t.month,
        'created_at': t.created_at.strftime('%Y-%m-%d %H:%M:%S')
    } for t in todos])

@app.route('/api/todos', methods=['POST'])
@login_required
def add_todo():
    user_id = session['user_id']
    data = request.get_json()
    
    todo = Todo(
        text=data.get('text'),
        user_id=user_id,
        date=get_date_key(),
        month=get_month_key()
    )
    
    db.session.add(todo)
    db.session.commit()
    
    return jsonify({
        'id': todo.id,
        'text': todo.text,
        'completed': todo.completed,
        'date': todo.date,
        'month': todo.month,
        'created_at': todo.created_at.strftime('%Y-%m-%d %H:%M:%S')
    }), 201

@app.route('/api/todos/<int:todo_id>', methods=['PUT'])
@login_required
def update_todo(todo_id):
    user_id = session['user_id']
    todo = Todo.query.filter_by(id=todo_id, user_id=user_id).first()
    
    if not todo:
        return jsonify({'error': 'Todo not found'}), 404
    
    data = request.get_json()
    
    if 'text' in data:
        todo.text = data['text']
    if 'completed' in data:
        todo.completed = data['completed']
    
    db.session.commit()
    
    return jsonify({
        'id': todo.id,
        'text': todo.text,
        'completed': todo.completed,
        'date': todo.date,
        'month': todo.month
    })

@app.route('/api/todos/<int:todo_id>', methods=['DELETE'])
@login_required
def delete_todo(todo_id):
    user_id = session['user_id']
    todo = Todo.query.filter_by(id=todo_id, user_id=user_id).first()
    
    if not todo:
        return jsonify({'error': 'Todo not found'}), 404
    
    db.session.delete(todo)
    db.session.commit()
    
    return jsonify({'message': 'Todo deleted'}), 200

# Statistics Routes
@app.route('/api/stats/today', methods=['GET'])
@login_required
def get_today_stats():
    user_id = session['user_id']
    today = get_date_key()
    todos = Todo.query.filter_by(user_id=user_id, date=today).all()
    
    total = len(todos)
    completed = sum(1 for t in todos if t.completed)
    progress = round((completed / total * 100) if total > 0 else 0, 1)
    
    return jsonify({
        'total': total,
        'completed': completed,
        'pending': total - completed,
        'progress': progress
    })

@app.route('/api/stats/week', methods=['GET'])
@login_required
def get_week_stats():
    user_id = session['user_id']
    week_data = []
    
    for i in range(6, -1, -1):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        todos = Todo.query.filter_by(user_id=user_id, date=date).all()
        
        total = len(todos)
        completed = sum(1 for t in todos if t.completed)
        progress = round((completed / total * 100) if total > 0 else 0, 1)
        
        day_name = (datetime.now() - timedelta(days=i)).strftime('%A')[:3]
        
        week_data.append({
            'date': date,
            'day': day_name,
            'total': total,
            'completed': completed,
            'progress': progress
        })
    
    return jsonify(week_data)

@app.route('/api/stats/monthly', methods=['GET'])
@login_required
def get_monthly_stats():
    user_id = session['user_id']
    todos = Todo.query.filter_by(user_id=user_id).all()
    
    monthly_data = defaultdict(lambda: {'total': 0, 'completed': 0})
    
    for todo in todos:
        month = todo.month
        monthly_data[month]['total'] += 1
        if todo.completed:
            monthly_data[month]['completed'] += 1
    
    stats = []
    for month in sorted(monthly_data.keys(), reverse=True)[:12]:
        data = monthly_data[month]
        total = data['total']
        completed = data['completed']
        progress = round((completed / total * 100) if total > 0 else 0, 1)
        
        year, month_num = month.split('-')
        month_name = calendar.month_name[int(month_num)]
        
        stats.append({
            'month': month,
            'month_name': f"{month_name} {year}",
            'total': total,
            'completed': completed,
            'pending': total - completed,
            'progress': progress
        })
    
    return jsonify(stats)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
