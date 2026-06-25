// ==========================================
// 1. KONTROL UI & TEMA
// ==========================================
const viewBeranda = document.getElementById('viewBeranda');
const viewData = document.getElementById('viewData');
const btnLihat = document.getElementById('btnLihatData');
const btnKembali = document.getElementById('btnKembali');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('i');
const searchInput = document.getElementById('searchInput');

btnLihat.addEventListener('click', () => {
    viewBeranda.classList.remove('active');
    viewData.classList.add('active');
    searchInput.value = ''; // Kosongkan pencarian tiap kali masuk
    loadData(); 
});

btnKembali.addEventListener('click', () => {
    viewData.classList.remove('active');
    viewBeranda.classList.add('active');
    
    document.getElementById('dataForm').reset();
    document.getElementById('editId').value = "";
    document.getElementById('submitText').innerText = "INJECT_DATA";
});

let isLight = localStorage.getItem('hackerTheme') === 'light';
if (isLight) {
    document.body.classList.add('light-mode');
    themeIcon.className = 'fas fa-sun';
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('hackerTheme', isLight ? 'light' : 'dark');
    themeIcon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
});

// ==========================================
// 2. SETUP INDEXEDDB
// ==========================================
let db;
const dbName = "HackerTerminalDB";
const storeName = "secureApps";

const request = indexedDB.open(dbName, 1);
request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
    }
};
request.onsuccess = (event) => { db = event.target.result; };
request.onerror = (event) => { console.error("[ERROR] DB: ", event.target.errorCode); };

// ==========================================
// 3. OPERASI CRUD INDEXEDDB
// ==========================================
document.getElementById('dataForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('editId').value;
    
    const payload = {
        kode: document.getElementById('kodeApp').value,
        nama: document.getElementById('namaApp').value,
        namaPengguna: document.getElementById('namaPengguna').value,
        nomorHp: document.getElementById('nomorHp').value,
        tglData: document.getElementById('tglData').value,
        status: document.getElementById('statusApp').value
    };

    const tx = db.transaction([storeName], "readwrite");
    const store = tx.objectStore(storeName);
    
    if (editId) {
        payload.id = Number(editId);
        store.put(payload);
    } else {
        store.add(payload);
    }

    tx.oncomplete = () => {
        alert(editId ? "✔️ STATUS: Data successfully updated!" : "✔️ STATUS: Data successfully injected!");
        e.target.reset(); 
        document.getElementById('editId').value = ""; 
        document.getElementById('submitText').innerText = "INJECT_DATA"; 
        
        if (editId) {
            viewBeranda.classList.remove('active');
            viewData.classList.add('active');
            loadData();
        }
    };
});

// ==========================================
// 4. SISTEM TAMPILAN, COLLAPSE, & PENCARIAN
// ==========================================
function loadData() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Fetching secure data...</td></tr>";

    const tx = db.transaction([storeName], "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
        const data = request.result;
        tbody.innerHTML = ""; 
        
        if (data.length === 0) {
            tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; opacity:0.5;'>[ NO_RECORDS_FOUND ]</td></tr>";
            return;
        }

        const groupedData = data.reduce((acc, item) => {
            // Melindungi dari kemungkinan properti 'nama' kosong
            const appName = item.nama || 'UNKNOWN_APP'; 
            if (!acc[appName]) acc[appName] = [];
            acc[appName].push(item);
            return acc;
        }, {});

        for (const appName in groupedData) {
            const groupId = appName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

            // HEADER GRUP 
            const groupTr = document.createElement('tr');
            groupTr.className = 'group-header';
            groupTr.dataset.group = groupId; 
            groupTr.innerHTML = `
                <td colspan="5" onclick="toggleGroup('${groupId}', this)">
                    <span class="toggle-icon">[+]</span> >> APP_TARGET: [ ${appName.toUpperCase()} ]
                </td>`;
            tbody.appendChild(groupTr);

            // DATA DALAM GRUP
            groupedData[appName].forEach(item => {
                const tr = document.createElement('tr');
                tr.className = `data-row group-item-${groupId} hidden-collapse`;
                tr.dataset.group = groupId; 
                
                // PERBAIKAN: Menambahkan '|| ""' agar jika ada data yang kosong, tidak error jadi string "undefined"
                const searchStr = `${item.kode || ''} ${item.nama || ''} ${item.namaPengguna || ''} ${item.nomorHp || ''} ${item.status || ''} ${item.tglData || ''}`.toLowerCase();
                tr.dataset.search = searchStr;

                const statusColor = item.status === 'Aktif' ? 'var(--accent)' : '#f59e0b';
                
                let formattedDate = 'XX/XX/XXXX';
                if (item.tglData) {
                    const [year, month, day] = item.tglData.split('-'); 
                    formattedDate = `${day}/${month}/${year}`; 
                }

                tr.innerHTML = `
                    <td style="font-family: var(--font-code); white-space: nowrap;">${item.kode || '-'}</td>
                    <td style="font-family: var(--font-code); font-size: 0.85rem; white-space: nowrap;">${formattedDate}</td>
                    <td>
                        ${item.namaPengguna || 'UNKNOWN'}<br>
                        <span style="font-family: var(--font-code); font-size: 0.8rem; opacity: 0.7;">${item.nomorHp || 'NO_PHONE'}</span>
                    </td>
                    <td style="color: ${statusColor}; font-weight: 800; white-space: nowrap;">[ ${item.status} ]</td>
                    <td style="white-space: nowrap;">
                        <div class="action-buttons">
                            <button class="btn-edit" onclick="editData(${item.id})" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="btn-del" onclick="hapusData(${item.id})" title="Purge"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    };
}

// Fungsi Buka/Tutup Baris (Accordion)
window.toggleGroup = (groupId, tdElement) => {
    const icon = tdElement.querySelector('.toggle-icon');
    const isCollapsed = icon.innerText === '[+]';
    const rows = document.querySelectorAll(`.group-item-${groupId}`);

    if (isCollapsed) {
        icon.innerText = '[-]';
        rows.forEach(row => row.classList.remove('hidden-collapse'));
    } else {
        icon.innerText = '[+]';
        rows.forEach(row => row.classList.add('hidden-collapse'));
    }
};

// Fitur Pencarian Langsung (Live Search)
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const dataRows = document.querySelectorAll('.data-row');
    const groupHeaders = document.querySelectorAll('.group-header');

    if (term === '') {
        dataRows.forEach(row => {
            row.classList.remove('hidden-search');
            row.classList.add('hidden-collapse');
        });
        groupHeaders.forEach(header => {
            header.classList.remove('hidden-search');
            header.querySelector('.toggle-icon').innerText = '[+]';
        });
        return;
    }

    let visibleGroups = new Set();

    dataRows.forEach(row => {
        if (row.dataset.search.includes(term)) {
            row.classList.remove('hidden-search');
            row.classList.remove('hidden-collapse'); 
            visibleGroups.add(row.dataset.group); 
        } else {
            row.classList.add('hidden-search'); 
        }
    });

    groupHeaders.forEach(header => {
        if (visibleGroups.has(header.dataset.group)) {
            header.classList.remove('hidden-search');
            header.querySelector('.toggle-icon').innerText = '[-]'; 
        } else {
            header.classList.add('hidden-search');
        }
    });
});

// Menarik Data ke Form
window.editData = (id) => {
    const tx = db.transaction([storeName], "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => {
        const item = request.result;
        if(item) {
            document.getElementById('kodeApp').value = item.kode || '';
            document.getElementById('namaApp').value = item.nama || '';
            document.getElementById('namaPengguna').value = item.namaPengguna || '';
            document.getElementById('nomorHp').value = item.nomorHp || '';
            document.getElementById('tglData').value = item.tglData || '';
            document.getElementById('statusApp').value = item.status || 'Aktif';

            document.getElementById('editId').value = item.id;
            document.getElementById('submitText').innerText = "UPDATE_DATA"; 

            viewData.classList.remove('active');
            viewBeranda.classList.add('active');
        }
    };
};

window.hapusData = (id) => {
    if(confirm("⚠️ SYSTEM WARNING:\nExecute permanent purge on this record?")) {
        const tx = db.transaction([storeName], "readwrite");
        const store = tx.objectStore(storeName);
        store.delete(id);
        tx.oncomplete = () => loadData();
    }
};

// ==========================================
// 5. EFEK MATRIX (HUJAN KODE) BACKGROUND
// ==========================================
const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d');

let chars = '01'; 
let fontSize = 14;
let columns, drops;

// PERBAIKAN: Fungsi resize sekarang menghitung ulang jumlah kolom. 
// Jika layar diperbesar, efek hujan tidak akan terpotong setengah.
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.floor(canvas.width / fontSize) + 1;
    
    // Reset rintik hujan agar menyesuaikan lebar layar baru
    drops = [];
    for (let x = 0; x < columns; x++) {
        // Rintik jatuh secara acak di awal agar tidak serempak
        drops[x] = Math.random() * (canvas.height / fontSize); 
    }
}

// Inisiasi awal
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function drawMatrix() {
    ctx.fillStyle = 'rgba(10, 14, 23, 0.1)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ffcc'; 
    ctx.font = fontSize + 'px var(--font-code)';

    for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

setInterval(drawMatrix, 50);
