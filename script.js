class NotesApp {
    constructor() {
        this.notes = this.loadNotes();
        this.currentCategory = 'all';
        this.currentView = 'grid';
        this.editingNoteId = null;
        this.noteToDelete = null;
        
        this.initializeApp();
        this.renderNotes();
        this.updateCategoryCounts();
    }

    initializeApp() {
        this.bindEvents();
        this.loadInitialNotes();
    }

    bindEvents() {
        // Mobile menu
        document.getElementById('mobileMenu').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.add('active');
        });

        document.getElementById('mobileClose').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.remove('active');
        });

        // New note buttons
        document.getElementById('newNoteBtn').addEventListener('click', () => this.openNoteModal());
        document.getElementById('emptyNewNoteBtn').addEventListener('click', () => this.openNoteModal());

        // Category filtering
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.filterByCategory(category);
                document.querySelector('.sidebar').classList.remove('active');
            });
        });

        // View options
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.changeView(view);
            });
        });

        // Note modal
        document.getElementById('closeModal').addEventListener('click', () => this.closeNoteModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeNoteModal());
        document.getElementById('noteForm').addEventListener('submit', (e) => this.saveNote(e));
        document.getElementById('deleteBtn').addEventListener('click', () => this.confirmDelete());

        // Delete modal
        document.getElementById('cancelDelete').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('confirmDelete').addEventListener('click', () => this.deleteNote());

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    if (modal.id === 'noteModal') this.closeNoteModal();
                    if (modal.id === 'deleteModal') this.closeDeleteModal();
                }
            });
        });

        // Title uniqueness check
        document.getElementById('noteTitle').addEventListener('input', () => this.checkTitleUniqueness());
        document.getElementById('noteCategory').addEventListener('change', () => this.checkTitleUniqueness());
    }

    loadInitialNotes() {
        // If no notes in localStorage, load from JSON file
        if (this.notes.length === 0) {
            fetch('notes.json')
                .then(response => response.json())
                .then(data => {
                    this.notes = data;
                    this.saveNotes();
                    this.renderNotes();
                    this.updateCategoryCounts();
                })
                .catch(error => {
                    console.log('No initial notes found, starting with empty notes');
                });
        }
    }

    loadNotes() {
        const savedNotes = localStorage.getItem('notes');
        return savedNotes ? JSON.parse(savedNotes) : [];
    }

    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    openNoteModal(noteId = null) {
        this.editingNoteId = noteId;
        const modal = document.getElementById('noteModal');
        const form = document.getElementById('noteForm');
        const deleteBtn = document.getElementById('deleteBtn');
        const modalTitle = document.getElementById('modalTitle');

        form.reset();
        document.getElementById('titleError').classList.remove('show');

        if (noteId) {
            // Editing existing note
            const note = this.notes.find(n => n.id === noteId);
            if (note) {
                document.getElementById('noteTitle').value = note.title;
                document.getElementById('noteCategory').value = note.category;
                document.getElementById('noteDescription').value = note.description;
                deleteBtn.style.display = 'block';
                modalTitle.textContent = 'Edit Note';
            }
        } else {
            // Creating new note
            deleteBtn.style.display = 'none';
            modalTitle.textContent = 'New Note';
        }

        modal.classList.add('active');
        document.getElementById('noteTitle').focus();
    }

    closeNoteModal() {
        document.getElementById('noteModal').classList.remove('active');
        this.editingNoteId = null;
    }

    saveNote(e) {
        e.preventDefault();

        const title = document.getElementById('noteTitle').value.trim();
        const category = document.getElementById('noteCategory').value;
        const description = document.getElementById('noteDescription').value.trim();

        if (!title || !category) {
            alert('Please fill in all required fields');
            return;
        }

        // Check for duplicate title in the same category
        if (this.isDuplicateTitle(title, category)) {
            document.getElementById('titleError').textContent = 'A note with this title already exists in this category';
            document.getElementById('titleError').classList.add('show');
            return;
        }

        const now = new Date().toISOString();

        if (this.editingNoteId) {
            // Update existing note
            const noteIndex = this.notes.findIndex(n => n.id === this.editingNoteId);
            if (noteIndex !== -1) {
                this.notes[noteIndex] = {
                    ...this.notes[noteIndex],
                    title,
                    category,
                    description,
                    updatedAt: now
                };
            }
        } else {
            // Create new note
            const newNote = {
                id: Date.now(),
                title,
                description,
                category,
                createdAt: now,
                updatedAt: now
            };
            this.notes.unshift(newNote);
        }

        this.saveNotes();
        this.renderNotes();
        this.updateCategoryCounts();
        this.closeNoteModal();
    }

    isDuplicateTitle(title, category, excludeId = null) {
        return this.notes.some(note => 
            note.title === title && 
            note.category === category && 
            note.id !== excludeId
        );
    }

    checkTitleUniqueness() {
        const title = document.getElementById('noteTitle').value.trim();
        const category = document.getElementById('noteCategory').value;
        const errorElement = document.getElementById('titleError');

        if (title && category && this.isDuplicateTitle(title, category, this.editingNoteId)) {
            errorElement.textContent = 'A note with this title already exists in this category';
            errorElement.classList.add('show');
        } else {
            errorElement.classList.remove('show');
        }
    }

    confirmDelete(noteId = null) {
        this.noteToDelete = noteId || this.editingNoteId;
        document.getElementById('deleteModal').classList.add('active');
    }

    deleteNote() {
        if (this.noteToDelete) {
            this.notes = this.notes.filter(note => note.id !== this.noteToDelete);
            this.saveNotes();
            this.renderNotes();
            this.updateCategoryCounts();
            this.closeDeleteModal();
            this.closeNoteModal();
        }
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
        this.noteToDelete = null;
    }

    filterByCategory(category) {
        this.currentCategory = category;
        
        // Update UI
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        // Update header
        document.getElementById('currentCategory').textContent = 
            category === 'all' ? 'All Notes' : category;
        
        this.renderNotes();
    }

    changeView(view) {
        this.currentView = view;
        
        // Update UI
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        this.renderNotes();
    }

    renderNotes() {
        const container = document.getElementById('notesContainer');
        const emptyState = document.getElementById('emptyState');
        
        // Filter notes based on current category
        let filteredNotes = this.notes;
        if (this.currentCategory !== 'all') {
            filteredNotes = this.notes.filter(note => note.category === this.currentCategory);
        }

        if (filteredNotes.length === 0) {
            container.innerHTML = '';
            container.appendChild(emptyState);
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        // Create notes container
        const notesElement = document.createElement('div');
        notesElement.className = this.currentView === 'grid' ? 'notes-grid' : 'notes-list';

        filteredNotes.forEach(note => {
            const noteElement = this.createNoteElement(note);
            notesElement.appendChild(noteElement);
        });

        container.innerHTML = '';
        container.appendChild(notesElement);
    }

    createNoteElement(note) {
        const noteElement = document.createElement('div');
        noteElement.className = `note-card ${this.currentView}-view`;
        
        const isDuplicate = this.hasDuplicateTitle(note.title, note.category, note.id);
        const formattedDate = this.formatDate(note.updatedAt || note.createdAt);
        
        noteElement.innerHTML = `
            <div class="note-header">
                <div>
                    <div class="note-title">${this.escapeHtml(note.title)}</div>
                    <div class="note-category">${note.category}</div>
                </div>
                ${isDuplicate ? '<span class="duplicate-badge">Duplicate</span>' : ''}
            </div>
            <div class="note-description">${this.escapeHtml(note.description)}</div>
            <div class="note-footer">
                <span>${formattedDate}</span>
                <button class="btn-secondary edit-btn" onclick="app.openNoteModal(${note.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </div>
        `;

        // Add click event to open note for editing
        noteElement.addEventListener('click', (e) => {
            if (!e.target.closest('.edit-btn')) {
                this.openNoteModal(note.id);
            }
        });

        return noteElement;
    }

    hasDuplicateTitle(title, category, excludeId = null) {
        const sameTitleNotes = this.notes.filter(note => 
            note.title === title && 
            note.category === category && 
            note.id !== excludeId
        );
        return sameTitleNotes.length > 0;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\n/g, '<br>');
    }

    updateCategoryCounts() {
        const categories = ['all', 'Work', 'Personal', 'Ideas', 'Important'];
        
        categories.forEach(category => {
            const count = category === 'all' 
                ? this.notes.length 
                : this.notes.filter(note => note.category === category).length;
            
            document.getElementById(`count${category.replace(' ', '')}`).textContent = count;
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NotesApp();
});