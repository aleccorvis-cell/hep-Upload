/**
 * HEP Berichte Upload - PWA Application
 * Handles file upload, webhook communication with n8n
 */

// Configuration
const CONFIG_KEY = 'hep_workflow_config';
const DEFAULT_CONFIG = {
    webhookUrl: '' // Will be set by user
};

// State
let selectedFile = null;

// DOM Elements
const elements = {
    uploadForm: document.getElementById('uploadForm'),
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    selectedFile: document.getElementById('selectedFile'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    removeFile: document.getElementById('removeFile'),
    gradingToggle: document.getElementById('gradingToggle'),
    studentEmail: document.getElementById('studentEmail'),
    submitBtn: document.getElementById('submitBtn'),
    btnText: document.querySelector('.btn-text'),
    btnLoading: document.querySelector('.btn-loading'),
    statusContainer: document.getElementById('statusContainer'),
    statusCard: document.getElementById('statusCard'),
    statusIcon: document.getElementById('statusIcon'),
    statusTitle: document.getElementById('statusTitle'),
    statusMessage: document.getElementById('statusMessage'),
    statusBtn: document.getElementById('statusBtn'),
    configModal: document.getElementById('configModal'),
    webhookUrl: document.getElementById('webhookUrl'),
    saveConfig: document.getElementById('saveConfig'),
    cancelConfig: document.getElementById('cancelConfig')
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    loadConfig();
    setupEventListeners();
    checkConfig();
}

// Configuration Management
function loadConfig() {
    try {
        const stored = localStorage.getItem(CONFIG_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
    } catch {
        return DEFAULT_CONFIG;
    }
}

function saveConfig(config) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function checkConfig() {
    const config = loadConfig();
    if (!config.webhookUrl) {
        showConfigModal();
    }
}

function showConfigModal() {
    const config = loadConfig();
    elements.webhookUrl.value = config.webhookUrl || '';
    elements.configModal.style.display = 'flex';
}

function hideConfigModal() {
    elements.configModal.style.display = 'none';
}

// Event Listeners
function setupEventListeners() {
    // Upload area click
    elements.uploadArea.addEventListener('click', () => {
        elements.fileInput.click();
    });

    // File input change
    elements.fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleDrop);

    // Remove file
    elements.removeFile.addEventListener('click', removeSelectedFile);

    // Form submit
    elements.uploadForm.addEventListener('submit', handleSubmit);

    // Status button (reset)
    elements.statusBtn.addEventListener('click', resetForm);

    // Config modal
    elements.saveConfig.addEventListener('click', handleSaveConfig);
    elements.cancelConfig.addEventListener('click', hideConfigModal);

    // Long press on logo to open config
    const logo = document.querySelector('.logo');
    let pressTimer;
    logo.addEventListener('touchstart', () => {
        pressTimer = setTimeout(showConfigModal, 1000);
    });
    logo.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
    });
    logo.addEventListener('mousedown', () => {
        pressTimer = setTimeout(showConfigModal, 1000);
    });
    logo.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
    });
}

// File Handling
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        validateAndSetFile(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    elements.uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('drag-over');

    const file = e.dataTransfer.files[0];
    if (file) {
        validateAndSetFile(file);
    }
}

function validateAndSetFile(file) {
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ];

    const allowedExtensions = ['.pdf', '.docx', '.doc'];
    const extension = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension)) {
        showStatus('error', 'Ungültiges Format', 'Bitte nur PDF, DOCX oder DOC Dateien hochladen.');
        return;
    }

    // Max 25MB
    if (file.size > 25 * 1024 * 1024) {
        showStatus('error', 'Datei zu gross', 'Die maximale Dateigroesse betraegt 25 MB.');
        return;
    }

    selectedFile = file;
    displaySelectedFile(file);
    updateSubmitButton();
}

function displaySelectedFile(file) {
    elements.fileName.textContent = file.name;
    elements.fileSize.textContent = formatFileSize(file.size);
    elements.uploadArea.style.display = 'none';
    elements.selectedFile.style.display = 'flex';
}

function removeSelectedFile() {
    selectedFile = null;
    elements.fileInput.value = '';
    elements.uploadArea.style.display = 'block';
    elements.selectedFile.style.display = 'none';
    updateSubmitButton();
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function updateSubmitButton() {
    elements.submitBtn.disabled = !selectedFile;
}

// Form Submission
async function handleSubmit(e) {
    e.preventDefault();

    const config = loadConfig();
    if (!config.webhookUrl) {
        showConfigModal();
        return;
    }

    if (!selectedFile) {
        showStatus('error', 'Keine Datei', 'Bitte waehle eine Datei zum Hochladen aus.');
        return;
    }

    // Show loading state
    setLoading(true);
    hideStatus();

    try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('benotet', elements.gradingToggle.checked ? 'true' : 'false');
        formData.append('studentEmail', elements.studentEmail.value || '');
        formData.append('fileName', selectedFile.name);
        formData.append('timestamp', new Date().toISOString());

        const response = await fetch(config.webhookUrl, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        showStatus(
            'success',
            'Erfolgreich hochgeladen!',
            `Der Bericht "${selectedFile.name}" wird jetzt verarbeitet. Du erhaeltst eine E-Mail, sobald die Bewertung abgeschlossen ist.`
        );

    } catch (error) {
        console.error('Upload error:', error);
        showStatus(
            'error',
            'Fehler beim Upload',
            `Der Upload ist fehlgeschlagen: ${error.message}. Bitte versuche es erneut.`
        );
    } finally {
        setLoading(false);
    }
}

function setLoading(loading) {
    elements.submitBtn.disabled = loading;
    elements.btnText.style.display = loading ? 'none' : 'inline';
    elements.btnLoading.style.display = loading ? 'flex' : 'none';
}

// Status Display
function showStatus(type, title, message) {
    elements.statusCard.className = 'status-card ' + type;
    elements.statusIcon.textContent = type === 'success' ? '✅' : '❌';
    elements.statusTitle.textContent = title;
    elements.statusMessage.textContent = message;
    elements.statusBtn.style.display = 'block';
    elements.statusContainer.style.display = 'block';
    elements.uploadForm.style.display = 'none';
}

function hideStatus() {
    elements.statusContainer.style.display = 'none';
    elements.uploadForm.style.display = 'flex';
}

function resetForm() {
    removeSelectedFile();
    elements.gradingToggle.checked = false;
    elements.studentEmail.value = '';
    hideStatus();
}

// Config Modal
function handleSaveConfig() {
    const webhookUrl = elements.webhookUrl.value.trim();

    if (!webhookUrl) {
        alert('Bitte gib eine Webhook URL ein.');
        return;
    }

    try {
        new URL(webhookUrl);
    } catch {
        alert('Bitte gib eine gueltige URL ein.');
        return;
    }

    saveConfig({ webhookUrl });
    hideConfigModal();
}

// Service Worker Registration (for PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered:', registration.scope);
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    });
}
