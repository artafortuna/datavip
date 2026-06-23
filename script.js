let apps = JSON.parse(localStorage.getItem('myApps')) || [];
let currentApp = null;

// --- 1. FUNGSI APP MANAGER ---
function addApp() {
    let name = document.getElementById("newAppName").value;
    if(name) {
        let id = "DATA_" + name.toUpperCase().replace(/\s/g, '_');
        apps.push({ name: name, key: id });
        localStorage.setItem('myApps', JSON.stringify(apps));
        document.getElementById("newAppName").value = "";
        renderApps();
    }
}

function renderApps() {
    let list = document.getElementById("appList");
    list.innerHTML = "";
    apps.forEach(app => {
        list.innerHTML += `<div class="app-item" onclick="selectApp('${app.key}', '${app.name}')">${app.name}</div>`;
    });
}

function selectApp(key, name) {
    currentApp = { key, name };
    document.getElementById("currentAppTitle").innerText = name;
    document.getElementById("formArea").style.display = "block";
    document.getElementById("searchArea").style.display = "block"; // Munculkan search box
    document.getElementById("dataTable").style.display = "table";
    renderTable();
}

// --- 2. FUNGSI DATA MANAGER ---
function renderTable() {
    let data = JSON.parse(localStorage.getItem(currentApp.key)) || [];
    let searchTerm = document.getElementById("searchBox").value.toLowerCase();
    
    // Filter data berdasarkan input pencarian
    let filteredData = data.filter(item => 
        item.kode.toLowerCase().includes(searchTerm) || 
        item.nama.toLowerCase().includes(searchTerm)
    );

    let tbody = document.getElementById("dataBody");
    tbody.innerHTML = "";
    filteredData.forEach((item, index) => {
        tbody.innerHTML += `<tr>
            <td>${item.kode}</td><td>${item.nama}</td><td>${item.status}</td>
            <td>
                <button class="edit-btn" onclick="editData(${index})">Edit</button>
                <button class="del-btn" onclick="deleteData(${index})">Hapus</button>
            </td>
        </tr>`;
    });
}

function addData() {
    let data = JSON.parse(localStorage.getItem(currentApp.key)) || [];
    data.push({ 
        kode: document.getElementById("inKode").value, 
        nama: document.getElementById("inNama").value, 
        status: document.getElementById("inStatus").value 
    });
    localStorage.setItem(currentApp.key, JSON.stringify(data));
    renderTable();
    // Bersihkan input
    document.getElementById("inKode").value = "";
    document.getElementById("inNama").value = "";
}

function editData(index) {
    let data = JSON.parse(localStorage.getItem(currentApp.key));
    let item = data[index];
    
    let newKode = prompt("Edit Kode:", item.kode);
    let newNama = prompt("Edit Nama:", item.nama);
    let newStatus = prompt("Edit Status (Lunas/Pending):", item.status);
    
    if(newKode !== null && newNama !== null) {
        data[index] = { kode: newKode, nama: newNama, status: newStatus || item.status };
        localStorage.setItem(currentApp.key, JSON.stringify(data));
        renderTable();
    }
}

function deleteData(index) {
    if(confirm("Yakin hapus data ini?")) {
        let data = JSON.parse(localStorage.getItem(currentApp.key));
        data.splice(index, 1);
        localStorage.setItem(currentApp.key, JSON.stringify(data));
        renderTable();
    }
}

// --- 3. FITUR BACKUP & RESTORE ---
function exportData() {
    let data = localStorage.getItem(currentApp.key);
    let blob = new Blob([data], {type: "application/json"});
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = currentApp.name + "_backup.json";
    a.click();
}

function importData() {
    document.getElementById("fileInput").click();
}

function handleImport(event) {
    let file = event.target.files[0];
    let reader = new FileReader();
    reader.onload = function(e) {
        localStorage.setItem(currentApp.key, e.target.result);
        renderTable();
        alert("Data berhasil dipulihkan!");
    };
    reader.readAsText(file);
}

// Jalankan saat pertama kali dimuat
renderApps();