// Toggles the mobile navigation menu
function toggleMenu() {
  document.querySelector('.nav-links').classList.toggle('open');
}

// Handles active state for navigation links based on scroll position
const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll(".nav-links span");

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.classList.remove("active"));
      // Only highlight 'Home' or 'Roadmap' for main sections
      if (entry.target.id === 'hero') {
        document.querySelector('.nav-links span[onclick*="hero"]').classList.add("active");
      } else if (entry.target.id === 'roadmap') {
        document.querySelector('.nav-links span[onclick*="roadmap"]').classList.add("active");
      }
    }
  });
}, { threshold: 0.5 }); // Trigger when 50% of the section is visible

sections.forEach(section => observer.observe(section));

// --- My Learning Sidebar Functionality ---
const myLearningSidebar = document.getElementById('myLearningSidebar');

function openMyLearning() {
  myLearningSidebar.classList.add('open');
  loadAllLearningData(); // Load all data when sidebar opens
}

function closeMyLearning() {
  myLearningSidebar.classList.remove('open');
}

// --- Notes Functionality ---
// Saves the current notes array to localStorage
function saveNotes(notes) {
  localStorage.setItem('userNotesList', JSON.stringify(notes));
}

// Loads notes from localStorage, returns empty array if none
function loadNotes() {
  const savedNotes = localStorage.getItem('userNotesList');
  return savedNotes ? JSON.parse(savedNotes) : [];
}

// Renders notes onto the page from the loaded data
function renderNotes() {
  const notesListElement = document.getElementById('notesList');
  notesListElement.innerHTML = ''; // Clear existing notes
  const notes = loadNotes();
  notes.forEach((note, index) => {
    const noteItem = document.createElement('div');
    noteItem.className = 'note-item';
    noteItem.innerHTML = `
      <span>${note}</span>
      <button class="delete-note-btn" onclick="deleteNote(${index})" aria-label="Delete note">x</button>
    `;
    notesListElement.appendChild(noteItem);
  });
}

// Adds a new note from the input field
function addNote() {
  const newNoteInput = document.getElementById('newNoteInput');
  const noteText = newNoteInput.value.trim();
  if (noteText) {
    const notes = loadNotes();
    notes.push(noteText);
    saveNotes(notes);
    newNoteInput.value = ''; // Clear input field
    renderNotes();
  }
}

// Deletes a note by its index
function deleteNote(index) {
  if (confirm('Are you sure you want to delete this note?')) {
    const notes = loadNotes();
    notes.splice(index, 1); // Remove note at index
    saveNotes(notes);
    renderNotes();
  }
}

// --- Daily Tasks Functionality ---
// Saves the current tasks array to localStorage
function saveTasks(tasks) {
  localStorage.setItem('dailyTasks', JSON.stringify(tasks));
}

// Loads tasks from localStorage, returns empty array if none
function loadTasks() {
  const savedTasks = localStorage.getItem('dailyTasks');
  return savedTasks ? JSON.parse(savedTasks) : [];
}

// Renders tasks onto the page from the loaded data
function renderTasks() {
  const dailyTasksListElement = document.getElementById('dailyTasksList');
  dailyTasksListElement.innerHTML = ''; // Clear existing tasks
  const tasks = loadTasks();
  tasks.forEach((task, index) => {
    const taskItem = document.createElement('div');
    taskItem.className = `checklist-item ${task.completed ? 'completed' : ''}`;
    taskItem.innerHTML = `
      <input type="checkbox" id="dailyTask-${index}" ${task.completed ? 'checked' : ''} onchange="toggleTaskCompletion(${index})" aria-label="Mark task as complete">
      <label for="dailyTask-${index}">${task.text}</label>
      <button class="delete-task-btn" onclick="deleteTask(${index})" aria-label="Delete task">Delete</button>
    `;
    dailyTasksListElement.appendChild(taskItem);
  });
}

// Adds a new task from the input field
function addTask(event) {
  event.preventDefault(); // Prevent form submission and page reload
  const newTaskInput = document.getElementById('newTaskInput');
  const taskText = newTaskInput.value.trim();
  if (taskText) {
    const tasks = loadTasks();
    tasks.push({ text: taskText, completed: false }); // Add new task as incomplete
    saveTasks(tasks);
    newTaskInput.value = ''; // Clear input field
    renderTasks();
  }
}

// Toggles the completion status of a task
function toggleTaskCompletion(index) {
  const tasks = loadTasks();
  tasks[index].completed = !tasks[index].completed; // Toggle boolean
  saveTasks(tasks);
  renderTasks(); // Re-render to update appearance
}

// Deletes a task by its index
function deleteTask(index) {
  if (confirm('Are you sure you want to delete this task?')) {
    const tasks = loadTasks();
    tasks.splice(index, 1); // Remove task at index
    saveTasks(tasks);
    renderTasks();
  }
}

// --- Timer Functionality ---
let timerInterval;
// Load persisted timer states from localStorage
let startTime = localStorage.getItem('timerStartTime') ? parseInt(localStorage.getItem('timerStartTime')) : null;
let elapsedTimeAtStop = localStorage.getItem('elapsedTimeAtStop') ? parseInt(localStorage.getItem('elapsedTimeAtStop')) : 0;

// Starts the timer
function startTimer() {
  if (!timerInterval) {
    startTime = Date.now() - elapsedTimeAtStop; // Calculate start time to account for pauses
    localStorage.setItem('timerStartTime', startTime);
    timerInterval = setInterval(updateTimer, 1000); // Update every second
  }
}

// Stops the timer
function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  elapsedTimeAtStop = Date.now() - startTime; // Save elapsed time when stopped
  localStorage.setItem('elapsedTimeAtStop', elapsedTimeAtStop);
  localStorage.removeItem('timerStartTime'); // Clear active start time
}

// Resets the timer to 00:00:00
function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  startTime = null;
  elapsedTimeAtStop = 0;
  localStorage.removeItem('timerStartTime');
  localStorage.removeItem('elapsedTimeAtStop');
  document.getElementById('timer').textContent = "00:00:00";
}

// Updates the timer display
function updateTimer() {
  const currentTime = Date.now();
  const currentElapsedTime = currentTime - startTime;
  const formattedTime = formatTime(currentElapsedTime);
  document.getElementById('timer').textContent = formattedTime;
}

// Formats milliseconds into HH:MM:SS string
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Pads single-digit numbers with a leading zero
function pad(unit) {
  return unit < 10 ? "0" + unit : unit;
}

// Loads all learning data (notes, tasks, timer) when the sidebar opens or on page load
function loadAllLearningData() {
  renderNotes();
  renderTasks();
  // Resume timer if it was running before page refresh/close
  if (startTime && !timerInterval) {
    startTimer();
  } else if (!startTime && elapsedTimeAtStop > 0) {
    // If timer was stopped but has a recorded duration, display it
    document.getElementById('timer').textContent = formatTime(elapsedTimeAtStop);
  }
}

// Initial load of data when the window is fully loaded
window.onload = function() {
    loadAllLearningData();
};