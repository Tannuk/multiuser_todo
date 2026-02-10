let editingTodoId = null;
let currentUser = null;

// Check authentication on load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    updateCurrentDate();
    
    // Enter key handlers
    document.getElementById('loginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });
    
    document.getElementById('registerPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') register();
    });
    
    document.getElementById('todoInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
});

// Check if user is authenticated
async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = data.user;
            showMainApp();
        } else {
            showAuthScreen();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showAuthScreen();
    }
}

// Show/hide screens
function showAuthScreen() {
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    document.getElementById('userName').textContent = currentUser.username;
    loadTodayTasks();
}

// Switch between login and register
function showLogin() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
    clearErrors();
}

function showRegister() {
    document.getElementById('registerForm').classList.add('active');
    document.getElementById('loginForm').classList.remove('active');
    clearErrors();
}

function clearErrors() {
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('registerError').classList.remove('show');
}

// Authentication functions
async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    if (!username || !password) {
        errorDiv.textContent = 'Please fill in all fields';
        errorDiv.classList.add('show');
        return;
    }
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showMainApp();
        } else {
            errorDiv.textContent = data.error || 'Login failed';
            errorDiv.classList.add('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.classList.add('show');
    }
}

async function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const errorDiv = document.getElementById('registerError');
    
    if (!username || !email || !password) {
        errorDiv.textContent = 'Please fill in all fields';
        errorDiv.classList.add('show');
        return;
    }
    
    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters';
        errorDiv.classList.add('show');
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showMainApp();
        } else {
            errorDiv.textContent = data.error || 'Registration failed';
            errorDiv.classList.add('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.classList.add('show');
    }
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        showAuthScreen();
        
        // Clear form fields
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// Update current date
function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('en-US', options);
    document.getElementById('currentDate').textContent = dateStr;
}

// Section navigation
function showSection(section) {
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (section === 'today') {
        document.getElementById('todaySection').classList.add('active');
        event.target.classList.add('active');
        loadTodayTasks();
    } else if (section === 'weekly') {
        document.getElementById('weeklySection').classList.add('active');
        event.target.classList.add('active');
        loadWeeklyStats();
    } else if (section === 'monthly') {
        document.getElementById('monthlySection').classList.add('active');
        event.target.classList.add('active');
        loadMonthlyStats();
    }
}

// Load today's tasks
async function loadTodayTasks() {
    try {
        const response = await fetch('/api/todos');
        
        if (response.status === 401) {
            showAuthScreen();
            return;
        }
        
        const todos = await response.json();
        renderTodos(todos);
        updateDailyProgress();
    } catch (error) {
        console.error('Error loading todos:', error);
    }
}

// Update daily progress
async function updateDailyProgress() {
    try {
        const response = await fetch('/api/stats/today');
        const stats = await response.json();
        
        document.getElementById('dailyProgressBar').style.width = stats.progress + '%';
        document.getElementById('dailyProgressText').textContent = stats.progress + '%';
        document.getElementById('completedCount').textContent = stats.completed;
        document.getElementById('totalCount').textContent = stats.total;
        document.getElementById('statTotal').textContent = stats.total;
        document.getElementById('statCompleted').textContent = stats.completed;
        document.getElementById('statPending').textContent = stats.pending;
    } catch (error) {
        console.error('Error updating progress:', error);
    }
}

// Add todo
async function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    
    if (!text) {
        input.focus();
        return;
    }
    
    try {
        const response = await fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        
        if (response.ok) {
            input.value = '';
            loadTodayTasks();
        }
    } catch (error) {
        console.error('Error adding todo:', error);
    }
}

// Toggle todo
async function toggleTodo(id, completed) {
    try {
        await fetch(`/api/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !completed })
        });
        
        loadTodayTasks();
    } catch (error) {
        console.error('Error toggling todo:', error);
    }
}

// Start editing
function startEdit(id, currentText) {
    editingTodoId = id;
    const todoItem = document.querySelector(`[data-id="${id}"]`);
    const textSpan = todoItem.querySelector('.task-text');
    const editInput = todoItem.querySelector('.edit-input');
    const editBtn = todoItem.querySelector('.edit-btn');
    const deleteBtn = todoItem.querySelector('.delete-btn');
    const saveBtn = todoItem.querySelector('.save-btn');
    const cancelBtn = todoItem.querySelector('.cancel-btn');
    
    textSpan.style.display = 'none';
    editInput.classList.add('active');
    editInput.value = currentText;
    editInput.focus();
    
    editBtn.style.display = 'none';
    deleteBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';
    
    editInput.onkeypress = (e) => {
        if (e.key === 'Enter') saveEdit(id);
    };
}

// Save edit
async function saveEdit(id) {
    const todoItem = document.querySelector(`[data-id="${id}"]`);
    const editInput = todoItem.querySelector('.edit-input');
    const newText = editInput.value.trim();
    
    if (!newText) {
        cancelEdit(id);
        return;
    }
    
    try {
        await fetch(`/api/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: newText })
        });
        
        loadTodayTasks();
        editingTodoId = null;
    } catch (error) {
        console.error('Error updating todo:', error);
    }
}

// Cancel edit
function cancelEdit(id) {
    editingTodoId = null;
    loadTodayTasks();
}

// Delete todo
async function deleteTodo(id) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        await fetch(`/api/todos/${id}`, { method: 'DELETE' });
        loadTodayTasks();
    } catch (error) {
        console.error('Error deleting todo:', error);
    }
}

// Render todos
function renderTodos(todos) {
    const todoList = document.getElementById('todoList');
    const emptyState = document.getElementById('emptyState');
    
    if (todos.length === 0) {
        todoList.innerHTML = '';
        emptyState.classList.add('show');
        return;
    }
    
    emptyState.classList.remove('show');
    
    todoList.innerHTML = todos.map(todo => `
        <li class="task-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <div class="checkbox ${todo.completed ? 'checked' : ''}" 
                 onclick="toggleTodo(${todo.id}, ${todo.completed})">
            </div>
            
            <span class="task-text">${escapeHtml(todo.text)}</span>
            
            <input type="text" class="edit-input" value="${escapeHtml(todo.text)}">
            
            <div class="task-actions">
                <button class="action-btn edit-btn" onclick="startEdit(${todo.id}, '${escapeHtml(todo.text).replace(/'/g, "\\'")}')">
                    ✏️ Edit
                </button>
                
                <button class="action-btn delete-btn" onclick="deleteTodo(${todo.id})">
                    🗑️ Delete
                </button>
                
                <button class="action-btn save-btn" onclick="saveEdit(${todo.id})" style="display: none;">
                    ✓ Save
                </button>
                
                <button class="action-btn cancel-btn" onclick="cancelEdit(${todo.id})" style="display: none;">
                    ✕ Cancel
                </button>
            </div>
        </li>
    `).join('');
}

// Load weekly stats
async function loadWeeklyStats() {
    try {
        const response = await fetch('/api/stats/week');
        const weekData = await response.json();
        
        const weeklyGrid = document.getElementById('weeklyGrid');
        
        weeklyGrid.innerHTML = weekData.map(day => `
            <div class="day-card">
                <div class="day-name">${day.day}</div>
                <div class="day-progress">${day.progress}%</div>
                <div class="day-tasks">${day.completed}/${day.total} tasks</div>
                <div class="day-bar">
                    <div class="day-bar-fill" style="width: ${day.progress}%"></div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading weekly stats:', error);
    }
}

// Load monthly stats
async function loadMonthlyStats() {
    try {
        const response = await fetch('/api/stats/monthly');
        const monthlyData = await response.json();
        
        const monthlyContainer = document.getElementById('monthlyContainer');
        
        if (monthlyData.length === 0) {
            monthlyContainer.innerHTML = `
                <div class="empty-state show">
                    <div class="empty-icon">📊</div>
                    <h3>No monthly data yet!</h3>
                    <p>Start adding tasks to see your monthly progress</p>
                </div>
            `;
            return;
        }
        
        monthlyContainer.innerHTML = monthlyData.map(month => `
            <div class="month-card">
                <div class="month-header">
                    <div class="month-name">${month.month_name}</div>
                    <div class="month-progress-text">${month.progress}%</div>
                </div>
                
                <div class="month-bar-container">
                    <div class="month-bar-fill" style="width: ${month.progress}%"></div>
                </div>
                
                <div class="month-stats">
                    <div class="month-stat">
                        <span class="month-stat-value">${month.total}</span>
                        <span class="month-stat-label">Total</span>
                    </div>
                    <div class="month-stat">
                        <span class="month-stat-value">${month.completed}</span>
                        <span class="month-stat-label">Completed</span>
                    </div>
                    <div class="month-stat">
                        <span class="month-stat-value">${month.pending}</span>
                        <span class="month-stat-label">Pending</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading monthly stats:', error);
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
