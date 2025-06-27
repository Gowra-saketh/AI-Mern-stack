// Import Firebase modules for authentication and Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase configuration (global variables provided by Canvas environment)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let userId = null; // Will store the current user's ID

// Authenticate user anonymously or with custom token
onAuthStateChanged(auth, async (user) => {
    if (user) {
        userId = user.uid;
        console.log("Firebase authenticated. User ID:", userId);
        // Load data after authentication is ready
        loadNotes();
        loadTasks();
    } else {
        try {
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken);
                userId = auth.currentUser.uid;
                console.log("Signed in with custom token. User ID:", userId);
            } else {
                await signInAnonymously(auth);
                userId = auth.currentUser.uid;
                console.log("Signed in anonymously. User ID:", userId);
            }
             // Load data after authentication is ready
             loadNotes();
             loadTasks();
        } catch (error) {
            console.error("Firebase authentication failed:", error);
        }
    }
});

// --- Navigation active link logic ---
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('section');

// Function to update active navigation link based on scroll position
const updateActiveNav = () => {
    let currentActive = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100; // Offset for sticky header
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentActive = section.getAttribute('id');
        }
    });

    navItems.forEach(item => {
        item.classList.remove('active-nav');
        if (item.getAttribute('href').includes(currentActive)) {
            item.classList.add('active-nav');
        }
    });
};

// Add scroll and load listeners to update active nav
window.addEventListener('scroll', updateActiveNav);
window.addEventListener('load', updateActiveNav);

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Adjust for fixed header
                behavior: 'smooth'
            });
        }
    });
});

// --- Learning Phases "Show All" / "Show Less" logic ---
const togglePhasesBtn = document.getElementById('togglePhasesBtn');
const phasesContainer = document.getElementById('phasesContainer');
const hiddenPhases = phasesContainer.querySelectorAll('.hidden-phase');

// Initially hide extra phases
hiddenPhases.forEach(phase => phase.style.display = 'none');

let showAll = false; // State to track if all phases are shown

togglePhasesBtn.addEventListener('click', () => {
    showAll = !showAll; // Toggle the state
    hiddenPhases.forEach(phase => {
        // Toggle display based on showAll state
        phase.style.display = showAll ? 'block' : 'none';
    });
    // Update button text and icon
    togglePhasesBtn.innerHTML = showAll ? 'Show Less Phases <i class="fas fa-chevron-up ml-2"></i>' : 'Show All Phases <i class="fas fa-chevron-down ml-2"></i>';
});

// --- Note Modal Logic ---
const noteModal = document.getElementById('noteModal');
const openNoteModalBtn = document.getElementById('openNoteModalBtn');
const closeNoteModal = document.getElementById('closeNoteModal');
const cancelNoteBtn = document.getElementById('cancelNoteBtn');
const noteForm = document.getElementById('noteForm');
const noteIdInput = document.getElementById('noteId');
const noteTitleInput = document.getElementById('noteTitle');
const noteContentInput = document.getElementById('noteContent');
const noteCategorySelect = document.getElementById('noteCategory');
const notesContainer = document.getElementById('notesContainer');
const emptyNotesMessage = document.getElementById('emptyNotes');
const emptyAddNoteBtn = document.getElementById('emptyAddNoteBtn');
const noteModalTitle = document.getElementById('noteModalTitle');

let editingNoteId = null; // To store the ID of the note being edited

// Function to open the note modal
const openNoteModal = (note = null) => {
    noteModal.classList.remove('hidden'); // Show modal
    if (note) {
        // Populate form for editing
        noteModalTitle.textContent = 'Edit Note';
        noteIdInput.value = note.id;
        noteTitleInput.value = note.title;
        noteContentInput.value = note.content.replace(/<br>/g, '\n'); // Convert <br> to newlines for textarea
        noteCategorySelect.value = note.category;
        editingNoteId = note.id;
    } else {
        // Clear form for new note
        noteModalTitle.textContent = 'Add New Note';
        noteForm.reset();
        noteIdInput.value = '';
        editingNoteId = null;
    }
};

// Function to close the note modal
const closeNoteModalHandler = () => {
    noteModal.classList.add('hidden'); // Hide modal
    noteForm.reset(); // Clear form
    editingNoteId = null; // Reset editing state
};

// Event listeners for opening and closing note modal
openNoteModalBtn.addEventListener('click', () => openNoteModal());
emptyAddNoteBtn.addEventListener('click', () => openNoteModal());
closeNoteModal.addEventListener('click', closeNoteModalHandler);
cancelNoteBtn.addEventListener('click', closeNoteModalHandler);
noteModal.addEventListener('click', (e) => {
    if (e.target === noteModal) {
        closeNoteModalHandler();
    }
});

// Function to display notes
const displayNotes = (notes) => {
    notesContainer.innerHTML = ''; // Clear existing notes
    if (notes.length === 0) {
        emptyNotesMessage.classList.remove('hidden'); // Show empty message
    } else {
        emptyNotesMessage.classList.add('hidden'); // Hide empty message
        notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.classList.add('note-card', 'p-6', 'border', 'border-slate-700');
            noteElement.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-semibold">${note.title}</h3>
                    <div class="flex space-x-2">
                        <button class="edit-note text-slate-400 hover:text-blue-400 transition-colors" data-id="${note.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-note text-slate-400 hover:text-red-400 transition-colors" data-id="${note.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                <p class="text-slate-300 mb-4">${note.content}</p>
                <div class="flex justify-between text-sm text-slate-400">
                    <span>${note.category}</span>
                    <span>Added: ${note.date}</span>
                </div>
            `;
            notesContainer.appendChild(noteElement);
        });

        // Add event listeners for edit and delete buttons on newly created notes
        notesContainer.querySelectorAll('.edit-note').forEach(button => {
            button.addEventListener('click', (e) => {
                const noteId = e.currentTarget.dataset.id;
                const noteToEdit = notes.find(note => note.id === noteId);
                if (noteToEdit) {
                    openNoteModal(noteToEdit);
                }
            });
        });

        notesContainer.querySelectorAll('.delete-note').forEach(button => {
            button.addEventListener('click', (e) => {
                const noteId = e.currentTarget.dataset.id;
                deleteNote(noteId);
            });
        });
    }
};

// Load notes from Firestore
const loadNotes = () => {
    if (!userId) {
        console.log("User not authenticated, cannot load notes.");
        return;
    }
    // Use onSnapshot for real-time updates
    const notesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/notes`);
    onSnapshot(notesCollectionRef, (snapshot) => {
        const notes = [];
        snapshot.forEach(doc => {
            notes.push({ id: doc.id, ...doc.data() });
        });
        // Sort notes by date, newest first
        notes.sort((a, b) => new Date(b.date) - new Date(a.date));
        displayNotes(notes);
    }, (error) => {
        console.error("Error loading notes:", error);
    });
};

// Save or update note to Firestore
noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!userId) {
        console.error("User not authenticated, cannot save note.");
        return;
    }

    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim().replace(/\n/g, '<br>'); // Convert newlines to <br> for display
    const category = noteCategorySelect.value;
    const date = new Date().toISOString().split('T')[0]; // Current dateYYYY-MM-DD

    const noteData = { title, content, category, date };
    const notesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/notes`);

    try {
        if (editingNoteId) {
            // Update existing note
            await updateDoc(doc(notesCollectionRef, editingNoteId), noteData);
            console.log("Note updated successfully!");
        } else {
            // Add new note
            await addDoc(notesCollectionRef, noteData);
            console.log("Note added successfully!");
        }
        closeNoteModalHandler(); // Close modal after saving
    } catch (error) {
        console.error("Error saving note:", error);
    }
});

// Delete note from Firestore
const deleteNote = async (id) => {
    if (!userId) {
        console.error("User not authenticated, cannot delete note.");
        return;
    }
    try {
        const notesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/notes`);
        await deleteDoc(doc(notesCollectionRef, id));
        console.log("Note deleted successfully!");
    } catch (error) {
        console.error("Error deleting note:", error);
    }
};

// --- Task Modal & Task List Logic ---
const taskModal = document.getElementById('taskModal');
const openTaskModalBtn = document.getElementById('openTaskModal'); // From nav bar
const openTaskModalForNewBtn = document.getElementById('openTaskModalForNewBtn'); // From tasks section
const closeTaskModal = document.getElementById('closeTaskModal');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');
const taskForm = document.getElementById('taskForm');
const modalTaskIdInput = document.getElementById('modalTaskId');
const modalTaskTitleInput = document.getElementById('modalTaskTitle');
const modalTaskPrioritySelect = document.getElementById('modalTaskPriority');
const modalTaskDeadlineInput = document.getElementById('modalTaskDeadline');
const taskModalTitle = document.getElementById('taskModalTitle');

const mainTaskInput = document.getElementById('mainTaskInput'); // For quick add
const addTaskBtn = document.getElementById('addTaskBtn'); // For quick add
const taskListContainer = document.getElementById('taskList');
const completedTasksCountSpan = document.getElementById('completedTasksCount');
const totalTasksCountSpan = document.getElementById('totalTasksCount');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

let editingTaskId = null; // To store the ID of the task being edited

// Function to open the task modal
const openTaskDetailsModal = (task = null) => {
    taskModal.classList.remove('hidden');
    if (task) {
        taskModalTitle.textContent = 'Edit Task';
        modalTaskIdInput.value = task.id;
        modalTaskTitleInput.value = task.description;
        modalTaskPrioritySelect.value = task.priority;
        modalTaskDeadlineInput.value = task.deadline || '';
        editingTaskId = task.id;
    } else {
        taskModalTitle.textContent = 'Add New Task';
        taskForm.reset();
        modalTaskIdInput.value = '';
        editingTaskId = null;
    }
};

// Function to close the task modal
const closeTaskDetailsModal = () => {
    taskModal.classList.add('hidden');
    taskForm.reset();
    editingTaskId = null;
};

// Event listeners for opening and closing task modal
openTaskModalBtn.addEventListener('click', () => openTaskDetailsModal());
openTaskModalForNewBtn.addEventListener('click', () => openTaskDetailsModal());
closeTaskModal.addEventListener('click', closeTaskDetailsModal);
cancelTaskBtn.addEventListener('click', closeTaskDetailsModal);
taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) {
        closeTaskDetailsModal();
    }
});

// Function to display tasks
const displayTasks = (tasks) => {
    taskListContainer.innerHTML = ''; // Clear existing tasks
    let completedCount = 0;

    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task-item', 'flex', 'items-center', 'p-3', 'bg-slate-800/50', 'rounded-lg', 'border', 'border-slate-700', 'cursor-pointer');
        if (task.completed) {
            taskElement.classList.add('completed');
            completedCount++;
        }
        taskElement.dataset.id = task.id; // Store task ID on the element

        const priorityClass = {
            'low': 'text-blue-400',
            'medium': 'text-yellow-400',
            'high': 'text-red-400'
        }[task.priority] || 'text-slate-400';

        taskElement.innerHTML = `
            <div class="custom-checkbox mr-3 ${task.completed ? 'checked' : ''}">
                <i class="fas fa-check"></i>
            </div>
            <span class="text-slate-300 flex-grow mr-2">${task.description}
                ${task.deadline ? `<br><span class="text-xs text-slate-500">Due: ${task.deadline}</span>` : ''}
                <span class="text-xs ${priorityClass} ml-2 font-semibold">(${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)})</span>
            </span>
            <button class="edit-task text-slate-400 hover:text-blue-400 transition-colors mr-2" data-id="${task.id}">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-task text-slate-400 hover:text-red-400 transition-colors" data-id="${task.id}">
                <i class="fas fa-times"></i>
            </button>
        `;
        taskListContainer.appendChild(taskElement);
    });

    // Update counts
    completedTasksCountSpan.textContent = completedCount;
    totalTasksCountSpan.textContent = tasks.length;

    // Add event listeners for new elements
    taskListContainer.querySelectorAll('.custom-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', (e) => {
            const taskId = e.currentTarget.closest('.task-item').dataset.id;
            const taskToToggle = tasks.find(t => t.id === taskId);
            if (taskToToggle) {
                toggleTaskCompleted(taskId, !taskToToggle.completed);
            }
        });
    });

    taskListContainer.querySelectorAll('.edit-task').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent toggling completion
            const taskId = e.currentTarget.dataset.id;
            const taskToEdit = tasks.find(task => task.id === taskId);
            if (taskToEdit) {
                openTaskDetailsModal(taskToEdit);
            }
        });
    });

    taskListContainer.querySelectorAll('.delete-task').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent toggling completion
            const taskId = e.currentTarget.dataset.id;
            deleteTask(taskId);
        });
    });
};

// Load tasks from Firestore
const loadTasks = () => {
    if (!userId) {
        console.log("User not authenticated, cannot load tasks.");
        return;
    }
    const tasksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/tasks`);
    onSnapshot(tasksCollectionRef, (snapshot) => {
        const tasks = [];
        snapshot.forEach(doc => {
            tasks.push({ id: doc.id, ...doc.data() });
        });
        // Sort tasks: incomplete first, then by priority (high > medium > low), then by deadline
        tasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1; // Incomplete tasks come first
            }

            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority]; // Higher priority first
            }

            if (a.deadline && b.deadline) {
                return new Date(a.deadline) - new Date(b.deadline); // Earlier deadline first
            }
            if (a.deadline) return -1; // Task with deadline before task without
            if (b.deadline) return 1; // Task without deadline after task with
            return 0; // Maintain original order if no other sort criteria
        });
        displayTasks(tasks);
    }, (error) => {
        console.error("Error loading tasks:", error);
    });
};

// Add or update task from quick add input or modal
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!userId) {
        console.error("User not authenticated, cannot save task.");
        return;
    }

    const description = modalTaskTitleInput.value.trim();
    const priority = modalTaskPrioritySelect.value;
    const deadline = modalTaskDeadlineInput.value; //YYYY-MM-DD format from input

    const taskData = {
        description,
        priority,
        deadline: deadline || null, // Store null if no deadline
        completed: false
    };
    const tasksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/tasks`);

    try {
        if (editingTaskId) {
            await updateDoc(doc(tasksCollectionRef, editingTaskId), taskData);
            console.log("Task updated successfully!");
        } else {
            await addDoc(tasksCollectionRef, taskData);
            console.log("Task added successfully!");
        }
        closeTaskDetailsModal(); // Close modal after saving
    } catch (error) {
        console.error("Error saving task:", error);
    }
});

// Quick add task functionality
addTaskBtn.addEventListener('click', async () => {
    if (!userId) {
        console.error("User not authenticated, cannot add task.");
        return;
    }
    const description = mainTaskInput.value.trim();
    if (description) {
        const tasksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/tasks`);
        try {
            await addDoc(tasksCollectionRef, {
                description: description,
                priority: 'medium', // Default priority for quick add
                deadline: null,
                completed: false
            });
            mainTaskInput.value = ''; // Clear input
            console.log("Quick task added successfully!");
        } catch (error) {
            console.error("Error adding quick task:", error);
        }
    } else {
        console.warn("Task description cannot be empty.");
    }
});

// Toggle task completion status
const toggleTaskCompleted = async (id, completedStatus) => {
    if (!userId) {
        console.error("User not authenticated, cannot toggle task.");
        return;
    }
    try {
        const tasksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/tasks`);
        await updateDoc(doc(tasksCollectionRef, id), { completed: completedStatus });
        console.log(`Task ${id} completion toggled to ${completedStatus}`);
    } catch (error) {
        console.error("Error toggling task completion:", error);
    }
};

// Delete task from Firestore
const deleteTask = async (id) => {
    if (!userId) {
        console.error("User not authenticated, cannot delete task.");
        return;
    }
    try {
        const tasksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/tasks`);
        await deleteDoc(doc(tasksCollectionRef, id));
        console.log("Task deleted successfully!");
    } catch (error) {
        console.error("Error deleting task:", error);
    }
};

// Clear completed tasks from Firestore
clearCompletedBtn.addEventListener('click', async () => {
    if (!userId) {
        console.error("User not authenticated, cannot clear completed tasks.");
        return;
    }
    try {
        const tasksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/tasks`);
        const q = query(tasksCollectionRef, where("completed", "==", true));
        const querySnapshot = await getDocs(q);
        const deletePromises = [];
        querySnapshot.forEach((doc) => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        await Promise.all(deletePromises);
        console.log("Completed tasks cleared!");
    } catch (error) {
        console.error("Error clearing completed tasks:", error);
    }
});
