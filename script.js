// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
    if (localStorage.getItem('isLoggedIn') === 'true') {
        loadDashboard();
    }
});



function setupEventListeners() {
    // Auth modal
    document.getElementById('showRegister').onclick = () => toggleAuthForm('register');
    document.getElementById('showLogin').onclick = () => toggleAuthForm('login');
    document.getElementById('closeModal').onclick = closeAuthModal;
    window.onclick = (e) => {
        if (e.target.id === 'authModal') closeAuthModal();
    };

    // Forms
    document.getElementById('loginFormSubmit').onsubmit = handleLogin;
    document.getElementById('registerFormSubmit').onsubmit = handleRegister;
    document.getElementById('lostItemForm').onsubmit = handleLostItem;
    document.getElementById('foundItemForm').onsubmit = handleFoundItem;

    // Search
    document.getElementById('lostSearch').oninput = filterLostItems;
    document.getElementById('foundSearch').oninput = filterFoundItems;
    document.getElementById('lostCategory').onchange = filterLostItems;
    document.getElementById('foundCategory').onchange = filterFoundItems;
    
    // Claimed items search
    document.getElementById('claimedSearch').oninput = filterClaimedItems;
    document.getElementById('claimedCategory').onchange = filterClaimedItems

    // Image preview handlers
    document.getElementById('lostImage').addEventListener('change', (e) => previewImage(e, 'lostImagePreview'));
    document.getElementById('foundImage').addEventListener('change', (e) => previewImage(e, 'foundImagePreview'));

    // Logout
    document.getElementById('logoutBtn').onclick = logout;
}

function filterClaimedItems() {
    const searchTerm = document.getElementById('claimedSearch').value.toLowerCase();
    const category = document.getElementById('claimedCategory').value;
    
    document.querySelectorAll('#claimedItemsList .item-card').forEach(card => {
        const title = card.dataset.title;
        const cat = card.dataset.category;
        const matchesSearch = title.includes(searchTerm);
        const matchesCategory = !category || cat === category;
        
        card.style.display = (matchesSearch && matchesCategory) ? 'block' : 'none';
    });
}

function toggleAuthForm(formType) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (formType === 'register') {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    } else {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    }
}

function toggleClaimedItems() {
    showClaimedItems = !showClaimedItems;
    const btn = document.getElementById('toggleClaimedBtn');
    
    if (showClaimedItems) {
        btn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Claimed Items';
        btn.classList.add('active');
        loadClaimedItems();
    } else {
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Show Claimed Items';
        btn.classList.remove('active');
        document.getElementById('claimedItemsSection').style.display = 'none';
    }
}


function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function handleRegister(e) {
    e.preventDefault();
    const collegeId = document.getElementById('collegeId').value;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;

    // Validate college ID format 
   if (!/^\d{13}$/.test(collegeId)) {
    alert('College ID must be exactly 13 digits');
    return;
}

    // Store user data
    const user = { collegeId, name, email, phone, password };
    localStorage.setItem(`user_${collegeId}`, JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', collegeId);

    alert('Registration successful!');
    loadDashboard();
    closeAuthModal();
}

function handleLogin(e) {
    e.preventDefault();
    const collegeId = document.getElementById('collegeIdLogin').value;
    const password = document.getElementById('passwordLogin').value;

    const userData = localStorage.getItem(`user_${collegeId}`);
    if (userData) {
        const user = JSON.parse(userData);
        if (user.password === password) {

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', collegeId);

    // update UI immediately
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('authModal').style.display = 'none';

    document.getElementById('userName').textContent = user.name;

    loadDashboard();
    checkAdmin();
} else {
            alert('Invalid password');
        }
    } else {
        alert('User not found. Please register first.');
    }
}

function checkAuth() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        const currentUser = localStorage.getItem('currentUser');
        const user = JSON.parse(localStorage.getItem(`user_${currentUser}`));
        document.getElementById('userName').textContent = user.name;
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('authModal').style.display = 'none';
        loadDashboard();
    } else {
        document.getElementById('authModal').style.display = 'block';
    }
}

function loadDashboard() {
    loadLostItems();
    loadFoundItems();
    updateStats();
}

function showLostItemForm() {
    document.getElementById('lostFormModal').style.display = 'block';
    document.getElementById('lostDate').valueAsDate = new Date();
}

function closeLostForm() {
    document.getElementById('lostFormModal').style.display = 'none';
    document.getElementById('lostItemForm').reset();
}

function showFoundItemForm() {
    document.getElementById('foundFormModal').style.display = 'block';
    document.getElementById('foundDate').valueAsDate = new Date();
}

function closeFoundForm() {
    document.getElementById('foundFormModal').style.display = 'none';
    document.getElementById('foundItemForm').reset();
}

function handleLostItem(e) {
    e.preventDefault();
    const fileInput = document.getElementById('lostImage');
    const imageFile = fileInput.files[0];
    
    const item = {
        id: Date.now(),
        title: document.getElementById('lostTitle').value,
        description: document.getElementById('lostDescription').value,
        category: document.getElementById('lostCategorySelect').value,
        date: document.getElementById('lostDate').value,
        reportedBy: localStorage.getItem('currentUser'),
        type: 'lost',
        claimed: false,
        timestamp: new Date().toISOString(),
        hasImage: !!imageFile
    };
    
    // Convert image to base64 if uploaded
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            item.imageData = e.target.result;
            saveLostItem(item);
        };
        reader.readAsDataURL(imageFile);
    } else {
        saveLostItem(item);
    }
}

function saveLostItem(item) {
    let lostItems = JSON.parse(localStorage.getItem('lostItems') || '[]');
    lostItems.unshift(item);
    localStorage.setItem('lostItems', JSON.stringify(lostItems));
    
    alert('Lost item reported successfully!');
    closeLostForm();
    loadLostItems();
    updateStats();
}


function handleFoundItem(e) {
    e.preventDefault();
    const fileInput = document.getElementById('foundImage');
    const imageFile = fileInput.files[0];
    
    const item = {
        id: Date.now(),
        title: document.getElementById('foundTitle').value,
        description: document.getElementById('foundDescription').value,
        category: document.getElementById('foundCategorySelect').value,
        date: document.getElementById('foundDate').value,
        reportedBy: localStorage.getItem('currentUser'),
        type: 'found',
        claimed: false,
        timestamp: new Date().toISOString(),
        hasImage: !!imageFile
    };
    
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            item.imageData = e.target.result;
            saveFoundItem(item);
        };
        reader.readAsDataURL(imageFile);
    } else {
        saveFoundItem(item);
    }
}

function saveFoundItem(item) {
    let foundItems = JSON.parse(localStorage.getItem('foundItems') || '[]');
    foundItems.unshift(item);
    localStorage.setItem('foundItems', JSON.stringify(foundItems));
    
    alert('Found item reported successfully!');
    closeFoundForm();
    loadFoundItems();
    updateStats();
}

let showClaimedItems = false;
const ADMIN_ID = '2403031460001'; 
let isAdmin = false;

// ✅ STEP 3 - ADD THESE 7 FUNCTIONS HERE (complete admin panel)
function loadUsersTable() {
    const usersTableBody = document.getElementById('usersTableBody');
    const users = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('user_')) {
            const user = JSON.parse(localStorage.getItem(key));
            const lostItems = JSON.parse(localStorage.getItem('lostItems') || '[]');
            const foundItems = JSON.parse(localStorage.getItem('foundItems') || '[]');
            
            const userLostCount = lostItems.filter(item => item.reportedBy === user.collegeId).length;
            const userFoundCount = foundItems.filter(item => item.reportedBy === user.collegeId).length;
            
            users.push({
                collegeId: user.collegeId,
                name: user.name,
                email: user.email,
                phone: user.phone,
                lostCount: userLostCount,
                foundCount: userFoundCount,
                totalReports: userLostCount + userFoundCount
            });
        }
    }
    
    if (users.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #666;">No users registered yet</td></tr>';
        return;
    }
    
    usersTableBody.innerHTML = users.map(user => `
        <tr>
            <td><strong>${user.collegeId}</strong></td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone || 'N/A'}</td>
            <td style="color: #e17055;">${user.lostCount}</td>
            <td style="color: #00b894;">${user.foundCount}</td>
            <td><strong>${user.totalReports}</strong></td>
            <td><button class="delete-user-btn" onclick="deleteUser('${user.collegeId}')"><i class="fas fa-trash"></i> Delete</button></td>
        </tr>
    `).join('');
}

function deleteUser(collegeId) {
    if (confirm(`Delete user ${collegeId}?`)) {
        localStorage.removeItem(`user_${collegeId}`);
        let lostItems = JSON.parse(localStorage.getItem('lostItems') || '[]');
        let foundItems = JSON.parse(localStorage.getItem('foundItems') || '[]');
        lostItems = lostItems.filter(item => item.reportedBy !== collegeId);
        foundItems = foundItems.filter(item => item.reportedBy !== collegeId);
        localStorage.setItem('lostItems', JSON.stringify(lostItems));
        localStorage.setItem('foundItems', JSON.stringify(foundItems));
        loadUsersTable();
        alert('✅ User deleted!');
    }
}

function loadAdminPanel() {
    loadUsersTable();
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
}


function checkAdmin() {
    const currentUser = localStorage.getItem('currentUser');
    isAdmin = currentUser === ADMIN_ID;
    
    const adminBtn = document.getElementById('adminBtn');
    if (isAdmin && adminBtn) {
        adminBtn.style.display = 'inline-flex';
        adminBtn.innerHTML = '<i class="fas fa-crown"></i> Admin';
        adminBtn.onclick = function() {
            document.getElementById('adminModal').style.display = 'block';
            loadAdminPanel();
        };
    }
}


// Load claimed items
function loadClaimedItems() {
    const lostItems = JSON.parse(localStorage.getItem('lostItems') || '[]');
    const foundItems = JSON.parse(localStorage.getItem('foundItems') || '[]');
    const claimedItemsSection = document.getElementById('claimedItemsSection');
    
    // Get ALL claimed items from both lists
    const claimedLost = lostItems.filter(item => item.claimed);
    const claimedFound = foundItems.filter(item => item.claimed);
    const allClaimedItems = [...claimedLost, ...claimedFound];
    
    const container = document.getElementById('claimedItemsList');
    container.innerHTML = allClaimedItems.map(item => createItemCard(item)).join('');
    
    // Show/hide section
    claimedItemsSection.style.display = showClaimedItems ? 'block' : 'none';
}

// Updated load functions - NO LONGER filter claimed items
function loadLostItems() {
    const lostItems = JSON.parse(localStorage.getItem('lostItems') || '[]');
    const container = document.getElementById('lostItemsList');
    container.innerHTML = lostItems.map(item => createItemCard(item)).join('');
}

function loadFoundItems() {
    const foundItems = JSON.parse(localStorage.getItem('foundItems') || '[]');
    const container = document.getElementById('foundItemsList');
    container.innerHTML = foundItems.map(item => createItemCard(item, true)).join('');
}

let currentContactItem = null;

function showContactModal(itemId, type) {

    let lostItems = JSON.parse(localStorage.getItem('lostItems') || '[]');
    let foundItems = JSON.parse(localStorage.getItem('foundItems') || '[]');

    // search in both lists
    let item =
        lostItems.find(i => i.id === itemId) ||
        foundItems.find(i => i.id === itemId);

    if (!item || !item.claimedBy) {
        alert("No contact info available");
        return;
    }

    const userData = JSON.parse(localStorage.getItem(`user_${item.claimedBy}`));

    document.getElementById('contactDetails').innerHTML = `
        <div style="background:#e3f2fd;padding:20px;border-radius:10px">
            <h3>${userData.name}</h3>
            <p><strong>College ID:</strong> ${userData.collegeId}</p>
            <p><strong>Email:</strong> ${userData.email}</p>
            <p><strong>Phone:</strong> ${userData.phone}</p>
        </div>
    `;

    document.getElementById('contactModal').style.display = 'block';
}


function closeContactModal() {
    document.getElementById('contactModal').style.display = 'none';
    currentContactItem = null;
}

function copyContactInfo() {
    if (currentContactItem && currentContactItem.claimedBy) {
        const userData = JSON.parse(localStorage.getItem(`user_${currentContactItem.claimedBy}`));
        const contactText = `Name: ${userData ? userData.name : 'Unknown'}\nID: ${currentContactItem.claimedBy}\nEmail: ${userData ? userData.email : 'N/A'}`;
        
        navigator.clipboard.writeText(contactText).then(() => {
            alert('✅ Contact details copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = contactText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('✅ Contact details copied!');
        });
    }
}


function createItemCard(item, isFound = false) {
    const currentUser = localStorage.getItem('currentUser');
    const isOwn = item.reportedBy === currentUser;
    
    let claimBtn = '';
    let claimedInfo = '';
    
    if (item.claimed) {
        const claimerName = item.claimedByName || 'Unknown User';
        const claimerId = item.claimedBy || 'N/A';
        const claimTime = item.claimedTimestamp ? 
            new Date(item.claimedTimestamp).toLocaleString() : 'N/A';
        
        let statusBadge = '';
        if (item.status === 'claimed_and_returned') {
            statusBadge = '<span class="status-badge returned">RETURNED ✅</span>';
        } else {
            statusBadge = '<span class="claimed-badge">CLAIMED ✅</span>';
        }
        
        claimedInfo = `
            <div class="claimed-info">
                ${statusBadge}
                <div class="claimer-details">
                    <strong>Returned by:</strong> ${claimerName}<br>
                    <small>ID: ${claimerId}</small><br>
                    <small>⏰ ${claimTime}</small>
                    <button class="contact-btn" onclick="showContactModal(${item.id}, '${item.type}')">
                        <i class="fas fa-phone"></i> Contact
                    </button>
                </div>
            </div>
        `;
    } else {
        claimBtn = `<button class="claim-btn" onclick="claimItem(${item.id}, '${item.type}')">${isFound ? 'Claim Found Item' : 'I Found This'}</button>`;
    }
    
    const imageContent = item.hasImage && item.imageData ? 
        `<img src="${item.imageData}" alt="${item.title}" class="item-image">` :
        `<div class="no-image">📷</div>`;
    
    return `
        <div class="item-card ${isFound ? 'found' : ''} ${item.status === 'claimed_and_returned' ? 'returned' : ''}" data-category="${item.category}" data-title="${item.title.toLocaleLowerCase()}">
            ${imageContent}
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            ${claimedInfo}
            <div class="item-meta">
                <span><i class="fas fa-calendar"></i> ${new Date(item.date).toLocaleDateString()}</span>
                ${claimBtn}
                ${isOwn ? '<span style="color: #00b894;"><i class="fas fa-user-check"></i> Yours</span>' : ''}
            </div>
        </div>
    `;
}



function claimItem(itemId, type) {
    const currentUser = localStorage.getItem('currentUser');
    const currentUserData = JSON.parse(localStorage.getItem(`user_${currentUser}`));
    
    console.log("🔧 CLAIM DEBUG:", {itemId, type, currentUser, currentUserData});
    
    if (type === 'lost') {
        let lostItems = JSON.parse(localStorage.getItem('lostItems') || '[]');
        const item = lostItems.find(i => i.id == itemId);
        
        if (item) {
            // ✅ FORCE SAVE CLAIMER INFO
            item.claimed = true;
            item.claimedBy = currentUser;
            item.claimedByName = currentUserData.name;
            item.claimedTimestamp = new Date().toISOString();
            item.status = 'claimed_and_returned';
            
            // Move to found
            let foundItems = JSON.parse(localStorage.getItem('foundItems') || '[]');
            foundItems.unshift(item);
            lostItems = lostItems.filter(i => i.id != itemId);
            
            localStorage.setItem('lostItems', JSON.stringify(lostItems));
            localStorage.setItem('foundItems', JSON.stringify(foundItems));
            
            console.log("✅ SAVED WITH CLAIMER:", item.claimedBy);
            alert(`✅ "${item.title}" claimed by ${currentUserData.name}!`);
        }
    } else {
        let foundItems = JSON.parse(localStorage.getItem('foundItems') || '[]');
        const item = foundItems.find(i => i.id == itemId);
        
        if (item) {
            // ✅ FORCE SAVE CLAIMER INFO
            item.claimed = true;
            item.claimedBy = currentUser;
            item.claimedByName = currentUserData.name;
            item.claimedTimestamp = new Date().toISOString();
            
            localStorage.setItem('foundItems', JSON.stringify(foundItems));
            console.log("✅ FOUND ITEM CLAIMED:", item.claimedBy);
            alert(`✅ "${item.title}" claimed!`);
        }
    }
    
    loadLostItems();
    loadFoundItems();
    updateStats();
}




function filterLostItems() {
    const searchTerm = document.getElementById('lostSearch').value.toLowerCase();
    const category = document.getElementById('lostCategory').value;
    
    document.querySelectorAll('#lostItemsList .item-card').forEach(card => {
        const title = card.dataset.title;
        const cat = card.dataset.category;
        const matchesSearch = title.includes(searchTerm);
        const matchesCategory = !category || cat === category;
        
        card.style.display = (matchesSearch && matchesCategory) ? 'block' : 'none';
    });
}

function filterFoundItems() {
    const searchTerm = document.getElementById('foundSearch').value.toLowerCase();
    const category = document.getElementById('foundCategory').value;
    
    document.querySelectorAll('#foundItemsList .item-card').forEach(card => {
        const title = card.dataset.title;
        const cat = card.dataset.category;
        const matchesSearch = title.includes(searchTerm);
        const matchesCategory = !category || cat === category;
        
        card.style.display = (matchesSearch && matchesCategory) ? 'block' : 'none';
    });
}

function updateStats() {
    const currentUser = localStorage.getItem('currentUser');
    const lostItems = JSON.parse(localStorage.getItem('lostItems') || '[]');
    const foundItems = JSON.parse(localStorage.getItem('foundItems') || '[]');
    
    const myReports = lostItems.filter(item => item.reportedBy === currentUser).length;
    const totalItems = lostItems.length + foundItems.length;
    const claimed = lostItems.filter(item => item.claimed).length + foundItems.filter(item => item.claimed).length;
    
    document.getElementById('myReports').textContent = myReports;
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('claimed').textContent = claimed;
}

function previewImage(event, previewId) {
    const file = event.target.files[0];
    const preview = document.getElementById(previewId);
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            preview.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
        preview.classList.remove('has-image');
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('authModal').style.display = 'block';
}


