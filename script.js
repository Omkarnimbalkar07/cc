const API_BASE = '/api';
let courses = []; // Fetched from DB
let selectedCourses = new Set(); // Tracked by IDs

// Auth Check
const studentId = localStorage.getItem('studentId');
if (!localStorage.getItem('studentLoggedIn')) {
    window.location.href = 'login.html';
}

// DOM Elements
const coursesContainer = document.getElementById('courses-container');
const myCoursesBtn = document.getElementById('my-courses-btn');
const logoutBtn = document.getElementById('logout-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalOverlay = document.getElementById('modal-overlay');
const myCoursesModal = document.getElementById('my-courses-modal');
const selectedCoursesList = document.getElementById('selected-courses-list');
const emptyState = document.getElementById('empty-state');
const courseCountBadge = document.getElementById('course-count');
const confirmBtn = document.getElementById('confirm-registration');

// Initialize
async function init() {
    if(coursesContainer) {
        await fetchCourses();
        await fetchUserCourses();
        setupEventListeners();
    }
}

// Fetch all courses
async function fetchCourses() {
    try {
        const res = await fetch(`${API_BASE}/courses`);
        courses = await res.json();
        renderCourses();
    } catch (err) {
        console.error('Failed to fetch courses', err);
    }
}

// Fetch user selections
async function fetchUserCourses() {
    try {
        const res = await fetch(`${API_BASE}/user/${studentId}/courses`);
        const data = await res.json();
        selectedCourses = new Set(data.map(c => c.id));
        updateUI();
    } catch (err) {
        console.error('Failed to fetch user courses', err);
    }
}

// Render available courses
function renderCourses() {
    coursesContainer.innerHTML = courses.map(course => {
        const isSelected = selectedCourses.has(course.id);
        return `
            <div class="course-card">
                <div class="course-content">
                    <i class="fa-solid ${course.icon} course-icon"></i>
                    <div class="course-info">
                        <h3>${course.title}</h3>
                        <p>${course.code} • ${course.description}</p>
                    </div>
                </div>
                <div class="card-footer">
                    <button 
                        class="btn-add ${isSelected ? 'selected' : ''}" 
                        onclick="toggleCourse(${course.id})"
                        ${isSelected ? 'disabled' : ''}
                    >
                        ${isSelected ? 'Selected' : 'Select Course'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Toggle course selection (API Call)
window.toggleCourse = async (id) => {
    try {
        const res = await fetch(`${API_BASE}/user/${studentId}/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId: id })
        });
        const updatedList = await res.json();
        selectedCourses = new Set(updatedList.map(c => c.id));
        updateUI();
    } catch (err) {
        alert('Error updating course');
    }
};

// Remove course from modal (Same API call as it toggles)
window.removeCourse = (id) => {
    toggleCourse(id);
};

// Update all UI elements
function updateUI() {
    renderCourses();
    courseCountBadge.textContent = selectedCourses.size;
    renderSelectedCourses();
}

// Render selected courses in modal
function renderSelectedCourses() {
    const selectedItems = courses.filter(course => selectedCourses.has(course.id));

    if (selectedItems.length === 0) {
        selectedCoursesList.innerHTML = '';
        selectedCoursesList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    selectedCoursesList.style.display = 'block';
    emptyState.style.display = 'none';
    
    selectedCoursesList.innerHTML = selectedItems.map(course => `
        <li class="course-list-item">
            <div class="item-info">
                <h4>${course.title}</h4>
                <span>${course.code}</span>
            </div>
            <button class="btn-remove-sm" onclick="removeCourse(${course.id})" title="Remove">
                <i class="fa-solid fa-trash"></i>
            </button>
        </li>
    `).join('');
}

// Event Listeners
function setupEventListeners() {
    myCoursesBtn.addEventListener('click', openModal);
    if(logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    
    confirmBtn.addEventListener('click', () => {
        if (selectedCourses.size > 0) {
            alert(`Your selection of ${selectedCourses.size} courses is saved to the database!`);
            closeModal();
        } else {
            alert('Please select at least one course.');
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !myCoursesModal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

function openModal() {
    renderSelectedCourses();
    myCoursesModal.classList.remove('hidden');
    modalOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
}

function closeModal() {
    myCoursesModal.classList.add('hidden');
    modalOverlay.classList.add('hidden');
    document.body.style.overflow = '';
}

function logout() {
    localStorage.removeItem('studentLoggedIn');
    localStorage.removeItem('studentId');
    window.location.href = 'login.html';
}

init();
