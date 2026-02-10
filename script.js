// Import Supabase client
import { supabase } from './supabase.js';

// Chart instance
let monitoringChart = null;

// Initialize App
document.addEventListener('DOMContentLoaded', async function() {
    // Set default datetime to now
    setDefaultDateTime();
    
    // Update current datetime display
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Load data from Supabase
    await loadData();
    
    // Setup form submit
    document.getElementById('monitoringForm').addEventListener('submit', handleSubmit);
    
    // Initialize chart
    initChart();
    
    // Setup real-time subscription (optional)
    setupRealtime();
});

// Update datetime display
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('datetime').textContent = now.toLocaleDateString('id-ID', options);
}

// Set default datetime input to current time
function setDefaultDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
    document.getElementById('tanggal').value = datetimeLocal;
}

// Handle form submit
async function handleSubmit(e) {
    e.preventDefault();
    
    const formData = {
        tanggal: document.getElementById('tanggal').value,
        petugas: document.getElementById('petugas').value.trim(),
        suhu: parseFloat(document.getElementById('suhu').value),
        kelembaban: parseFloat(document.getElementById('kelembaban').value),
        status_ac: document.getElementById('statusAC').value,
        status_ups: document.getElementById('statusUPS').value,
        status_listrik: document.getElementById('statusListrik').value,
        status_server: document.getElementById('statusServer').value,
        catatan: document.getElementById('catatan').value.trim()
    };
    
    // Validate suhu and kelembaban
    const suhu = formData.suhu;
    const kelembaban = formData.kelembaban;
    
    if (suhu < 15 || suhu > 30) {
        showToast('⚠️ Peringatan: Suhu di luar rentang normal (20-25°C)', 'error');
    }
    
    if (kelembaban < 30 || kelembaban > 70) {
        showToast('⚠️ Peringatan: Kelembaban di luar rentang normal (40-60%)', 'error');
    }
    
    try {
        // Save data to Supabase
        await saveData(formData);
        
        // Reset form
        document.getElementById('monitoringForm').reset();
        setDefaultDateTime();
        
        // Show success message
        showToast('✅ Data berhasil disimpan!', 'success');
        
        // Reload data
        await loadData();
    } catch (error) {
        console.error('Error saving data:', error);
        showToast('❌ Gagal menyimpan data', 'error');
    }
}

// Save data to Supabase
async function saveData(data) {
    const { error } = await supabase
        .from('server_monitoring')
        .insert([data]);
    
    if (error) throw error;
}

// Load data from Supabase
async function loadData() {
    try {
        const { data, error } = await supabase
            .from('server_monitoring')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Update table
        updateTable(data || []);
        
        // Update status display with latest data
        if (data && data.length > 0) {
            updateStatus(data[0]);
        }
        
        // Update chart
        updateChart(data || []);
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('❌ Gagal memuat data', 'error');
    }
}

// Initialize Chart
function initChart() {
    const ctx = document.getElementById('monitoringChart').getContext('2d');
    
    monitoringChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Suhu (°C)',
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y',
                },
                {
                    label: 'Kelembaban (%)',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Suhu (°C)',
                        color: '#ef4444',
                        font: {
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: '#ef4444'
                    },
                    grid: {
                        drawOnChartArea: true,
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Kelembaban (%)',
                        color: '#3b82f6',
                        font: {
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: '#3b82f6'
                    },
                    grid: {
                        drawOnChartArea: false,
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Update Chart with data
function updateChart(allData) {
    if (!monitoringChart) return;
    
    // Get last 10 entries
    const chartData = allData.slice(0, 10);
    
    const labels = chartData.map(item => {
        const date = new Date(item.tanggal);
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    });
    
    const suhuData = chartData.map(item => parseFloat(item.suhu));
    const kelembabanData = chartData.map(item => parseFloat(item.kelembaban));
    
    monitoringChart.data.labels = labels;
    monitoringChart.data.datasets[0].data = suhuData;
    monitoringChart.data.datasets[1].data = kelembabanData;
    monitoringChart.update();
}

// Update status display
function updateStatus(data) {
    const suhu = parseFloat(data.suhu);
    const kelembaban = parseFloat(data.kelembaban);
    
    // Update values
    document.getElementById('currentSuhu').textContent = `${suhu}°C`;
    document.getElementById('currentKelembaban').textContent = `${kelembaban}%`;
    document.getElementById('currentAC').textContent = data.status_ac;
    document.getElementById('currentUPS').textContent = data.status_ups;
    document.getElementById('currentListrik').textContent = data.status_listrik;
    document.getElementById('currentServer').textContent = data.status_server;
    
    // Apply color classes
    const suhuElement = document.getElementById('currentSuhu');
    if (suhu >= 20 && suhu <= 25) {
        suhuElement.className = 'status-value normal';
    } else if (suhu > 25 && suhu <= 27) {
        suhuElement.className = 'status-value warning';
    } else {
        suhuElement.className = 'status-value danger';
    }
    
    const kelembabanElement = document.getElementById('currentKelembaban');
    if (kelembaban >= 40 && kelembaban <= 60) {
        kelembabanElement.className = 'status-value normal';
    } else if ((kelembaban >= 35 && kelembaban < 40) || (kelembaban > 60 && kelembaban <= 65)) {
        kelembabanElement.className = 'status-value warning';
    } else {
        kelembabanElement.className = 'status-value danger';
    }
    
    // Status AC
    const acElement = document.getElementById('currentAC');
    if (data.status_ac === 'Normal') {
        acElement.className = 'status-value normal';
    } else if (data.status_ac === 'Bermasalah') {
        acElement.className = 'status-value warning';
    } else {
        acElement.className = 'status-value danger';
    }
    
    // Status UPS
    const upsElement = document.getElementById('currentUPS');
    if (data.status_ups === 'Normal') {
        upsElement.className = 'status-value normal';
    } else if (data.status_ups === 'Bermasalah') {
        upsElement.className = 'status-value warning';
    } else {
        upsElement.className = 'status-value danger';
    }
    
    // Status Listrik
    const listrikElement = document.getElementById('currentListrik');
    if (data.status_listrik === 'Normal') {
        listrikElement.className = 'status-value normal';
    } else {
        listrikElement.className = 'status-value danger';
    }
    
    // Status Server
    const serverElement = document.getElementById('currentServer');
    if (data.status_server === 'Online') {
        serverElement.className = 'status-value normal';
    } else if (data.status_server === 'Maintenance') {
        serverElement.className = 'status-value warning';
    } else {
        serverElement.className = 'status-value danger';
    }
}

// Update table with data
function updateTable(data) {
    const tableBody = document.getElementById('tableBody');
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="11" class="empty-state">Belum ada data monitoring</td></tr>';
        return;
    }
    
    let html = '';
    data.forEach((item, index) => {
        const date = new Date(item.tanggal);
        const formattedDate = date.toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${formattedDate}</td>
                <td>${item.petugas}</td>
                <td>${item.suhu}°C</td>
                <td>${item.kelembaban}%</td>
                <td><span class="status-badge badge-${item.status_ac.toLowerCase()}">${item.status_ac}</span></td>
                <td><span class="status-badge badge-${item.status_ups.toLowerCase()}">${item.status_ups}</span></td>
                <td><span class="status-badge badge-${item.status_listrik.toLowerCase()}">${item.status_listrik}</span></td>
                <td><span class="status-badge badge-${item.status_server.toLowerCase()}">${item.status_server}</span></td>
                <td>${item.catatan || '-'}</td>
                <td>
                    <button class="btn btn-delete" onclick="deleteData(${item.id})">🗑️ Hapus</button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Delete single data
async function deleteData(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
        try {
            const { error } = await supabase
                .from('server_monitoring')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            await loadData();
            showToast('🗑️ Data berhasil dihapus!', 'success');
        } catch (error) {
            console.error('Error deleting data:', error);
            showToast('❌ Gagal menghapus data', 'error');
        }
    }
}

// Clear all data
async function clearAllData() {
    if (confirm('⚠️ PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data monitoring? Tindakan ini tidak dapat dibatalkan!')) {
        if (confirm('Konfirmasi sekali lagi: Hapus semua data?')) {
            try {
                const { error } = await supabase
                    .from('server_monitoring')
                    .delete()
                    .gte('id', 0); // Delete all rows
                
                if (error) throw error;
                
                await loadData();
                showToast('🗑️ Semua data berhasil dihapus!', 'success');
            } catch (error) {
                console.error('Error clearing all data:', error);
                showToast('❌ Gagal menghapus semua data', 'error');
            }
        }
    }
}

// Export to Excel (using SheetJS)
async function exportToExcel() {
    try {
        const { data, error } = await supabase
            .from('server_monitoring')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            showToast('⚠️ Tidak ada data untuk diekspor!', 'error');
            return;
        }
        
        // Prepare data for Excel
        const excelData = [];
        
        // Add title rows
        excelData.push(['LAPORAN MONITORING RUANG SERVER']);
        excelData.push(['Tanggal Export: ' + new Date().toLocaleString('id-ID')]);
        excelData.push([]); // Empty row
        
        // Add headers
        excelData.push([
            'No',
            'Tanggal & Waktu',
            'Petugas',
            'Suhu (°C)',
            'Kelembaban (%)',
            'Status AC',
            'Status UPS',
            'Status Listrik',
            'Status Server',
            'Catatan'
        ]);
        
        // Add data rows
        data.forEach((item, index) => {
            const date = new Date(item.tanggal);
            const formattedDate = date.toLocaleString('id-ID');
            
            excelData.push([
                index + 1,
                formattedDate,
                item.petugas,
                parseFloat(item.suhu),
                parseFloat(item.kelembaban),
                item.status_ac,
                item.status_ups,
                item.status_listrik,
                item.status_server,
                item.catatan || '-'
            ]);
        });
        
        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 5 },  // No
            { wch: 20 }, // Tanggal
            { wch: 20 }, // Petugas
            { wch: 12 }, // Suhu
            { wch: 15 }, // Kelembaban
            { wch: 15 }, // AC
            { wch: 15 }, // UPS
            { wch: 15 }, // Listrik
            { wch: 15 }, // Server
            { wch: 30 }  // Catatan
        ];
        
        // Style the title
        ws['A1'].s = {
            font: { bold: true, sz: 14 },
            alignment: { horizontal: 'center' }
        };
        
        // Merge title cell
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, // Merge A1:J1
            { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }  // Merge A2:J2
        ];
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Monitoring Server');
        
        // Generate filename
        const now = new Date();
        const filename = `Monitoring_Server_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}.xlsx`;
        
        // Save file
        XLSX.writeFile(wb, filename);
        
        showToast('📥 Data berhasil diekspor ke Excel!', 'success');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showToast('❌ Gagal mengekspor data', 'error');
    }
}

// Setup real-time updates (optional)
function setupRealtime() {
    supabase
        .channel('server-monitoring-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'server_monitoring' }, 
            async (payload) => {
                console.log('Data changed:', payload);
                await loadData();
            }
        )
        .subscribe();
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
