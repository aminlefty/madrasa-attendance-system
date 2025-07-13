// Initialize variables
let students = [];
let teachers = [];
let attendance = [];
let currentPage = 1;
const itemsPerPage = 10;

// ADDED: Variables to fix errors
let editStudentId = null;
let editTeacherId = null;
let attendanceChart = null;
let classDistributionChart = null;
let hifzProgressChart = null;

// DOM Elements
const studentForm = document.getElementById('studentForm');
const teacherForm = document.getElementById('teacherForm');
const attendanceTable = document.getElementById('attendanceTable');
const classFilter = document.getElementById('classFilter');
const notificationBadge = document.getElementById('notificationBadge');
const lateArrivalAlert = document.getElementById('lateArrivalAlert');
const hifzCompleters = document.getElementById('hifzCompleters');

// Date Display
function getTodayDate() {
  const today = new Date();
  return today.toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
  });
}

const dateDiv = document.getElementById('currentDate');
dateDiv.textContent = getTodayDate();

// Load JSON Data
async function loadData() {
  try {
    const [studentRes, teacherRes] = await Promise.all([
      fetch('http://localhost:3000/students'),
      fetch('http://localhost:3000/teachers')
    ]);

    students = await studentRes.json();
    teachers = await teacherRes.json();

    // Initialize attendance with random data for demo
    attendance = students.map(s => ({
      id: s.id,
      name: s.name,
      sclass: s.sclass,
      status: Math.random() > 0.2 ? 'Present' : 'Absent',
      time: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleTimeString()
    }));

    // Simulate some late arrivals
    attendance.forEach(a => {
      if (a.status === 'Present' && Math.random() > 0.7) {
        a.status = 'Late';
      }
    });

    renderStudents();
    renderTeachers();
    renderAttendance();
    renderStats();
    renderCharts();
    updateNotificationBadge();
    
    // Simulate new late arrivals for demo
    setTimeout(() => {
      simulateLateArrivals();
    }, 3000);
    
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Charts Rendering
function renderCharts() {
  // Destroy existing charts first
  if (attendanceChart) attendanceChart.destroy();
  if (classDistributionChart) classDistributionChart.destroy();
  if (hifzProgressChart) hifzProgressChart.destroy();
  
  // Create new charts
  renderAttendanceChart();
  renderClassDistributionChart();
  renderHifzProgressChart();
}

function renderAttendanceChart() {
  const ctx = document.getElementById('attendanceChart');
  if (!ctx) return;

  // Destroy previous chart if exists
  if (attendanceChart) attendanceChart.destroy();

  const present = attendance.filter(a => a.status === 'Present').length;
  const absent = attendance.filter(a => a.status === 'Absent').length;
  const late = attendance.filter(a => a.status === 'Late').length;

  attendanceChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Present', 'Absent', 'Late'],
      datasets: [{
        label: 'Attendance Distribution',
        data: [present, absent, late],
        backgroundColor: ['#22c55e', '#ef4444', '#f59e0b'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderClassDistributionChart() {
  const ctx = document.getElementById('classDistributionChart');
  if (!ctx) return;

  // Destroy previous chart if exists
  if (classDistributionChart) classDistributionChart.destroy();

  const classCounts = {};
  students.forEach(student => {
    classCounts[student.sclass] = (classCounts[student.sclass] || 0) + 1;
  });

  classDistributionChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(classCounts),
      datasets: [{
        data: Object.values(classCounts),
        backgroundColor: [
          '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'right' }
      }
    }
  });
}

function renderHifzProgressChart() {
  const chartEl = document.getElementById('hifzProgressChart');
  if (!chartEl) return;

  // Destroy previous chart if exists
  if (hifzProgressChart) hifzProgressChart.destroy();

  // Simulate Hifz progress data
  const options = {
    series: [{
      name: 'Juz Completed',
      data: [1, 2, 5, 8, 12, 15, 18, 22, 25, 28]
    }],
    chart: {
      height: '100%',
      type: 'radar',
      toolbar: { show: false }
    },
    colors: ['#10b981'],
    xaxis: {
      categories: ['Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 
                  'Grade 10', 'Hifz 1', 'Hifz 2', 'Hifz 3', 'Hifz 4']
    },
    yaxis: { show: false },
    markers: { size: 4 },
    tooltip: { enabled: true }
  };

  hifzProgressChart = new ApexCharts(chartEl, options);
  hifzProgressChart.render();
  
  // Simulate new Hifz completers
  setTimeout(() => {
    hifzCompleters.textContent = `${Math.floor(Math.random() * 5)} New Completers`;
    hifzCompleters.classList.remove('hidden');
  }, 2000);
}

// Form Handlers
studentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('studentName').value.trim();
  const sclass = document.getElementById('studentClass').value.trim();
  const guardian = document.getElementById('guardianContact').value.trim();
  
  if (!name || !sclass || !guardian) {
    showAlert('Please fill all fields', 'error');
    return;
  }

  try {
    const id = editStudentId || Date.now();
    const student = { id, name, sclass, guardian };

    const method = editStudentId ? 'PUT' : 'POST';
    const url = editStudentId ? `http://localhost:3000/students/${editStudentId}` : 'http://localhost:3000/students';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });

    if (editStudentId) {
      students = students.map(s => s.id === editStudentId ? student : s);
    } else {
      students.push(student);
      attendance.push({ 
        id, name, sclass, 
        status: 'Present', 
        time: new Date().toLocaleTimeString() 
      });
    }

    renderStudents();
    renderAttendance();
    renderStats();
    renderCharts();
    studentForm.reset();
    editStudentId = null;
    
    showAlert(`Student ${editStudentId ? 'updated' : 'added'} successfully`, 'success');
  } catch (error) {
    showAlert('Error saving student', 'error');
    console.error(error);
  }
});

teacherForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('teacherName').value.trim();
  const subject = document.getElementById('teacherSubject').value.trim();
  const contact = document.getElementById('teacherContact').value.trim();
  
  if (!name || !subject || !contact) {
    showAlert('Please fill all fields', 'error');
    return;
  }

  try {
    const id = editTeacherId || Date.now();
    const teacher = { id, name, subject, contact };

    const method = editTeacherId ? 'PUT' : 'POST';
    const url = editTeacherId ? `http://localhost:3000/teachers/${editTeacherId}` : 'http://localhost:3000/teachers';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacher)
    });

    if (editTeacherId) {
      teachers = teachers.map(t => t.id === editTeacherId ? teacher : t);
    } else {
      teachers.push(teacher);
    }

    renderTeachers();
    teacherForm.reset();
    editTeacherId = null;
    
    showAlert(`Teacher ${editTeacherId ? 'updated' : 'added'} successfully`, 'success');
  } catch (error) {
    showAlert('Error saving teacher', 'error');
    console.error(error);
  }
});

// Data Rendering Functions
function renderAttendance() {
  const filter = classFilter.value;
  const filtered = filter ? attendance.filter(a => a.sclass === filter) : attendance;
  
  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginated = filtered.slice(startIndex, endIndex);
  
  // Update pagination info
  document.getElementById('showingFrom').textContent = startIndex + 1;
  document.getElementById('showingTo').textContent = Math.min(endIndex, filtered.length);
  document.getElementById('totalEntries').textContent = filtered.length;
  
  attendanceTable.innerHTML = paginated.map((s, i) => `
    <tr class="hover:bg-gray-50">
      <td class="px-4 py-2 whitespace-nowrap">${startIndex + i + 1}</td>
      <td class="px-4 py-2 whitespace-nowrap">${s.name}</td>
      <td class="px-4 py-2 whitespace-nowrap">${s.sclass}</td>
      <td class="px-4 py-2 whitespace-nowrap">
        <span class="px-2 py-1 rounded-full text-xs font-medium 
          ${s.status === 'Present' ? 'bg-green-100 text-green-800' : 
            s.status === 'Absent' ? 'bg-red-100 text-red-800' : 
            'bg-yellow-100 text-yellow-800'}">
          ${s.status}
        </span>
      </td>
      <td class="px-4 py-2 whitespace-nowrap text-sm">${s.time}</td>
      <td class="px-4 py-2 whitespace-nowrap text-sm">
        <button onclick="deleteAttendance(${s.id})" class="text-red-600 hover:text-red-800">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function renderStudents() {
  updateClassFilter();
  renderStats();
  
  const studentList = document.getElementById('studentList');
  if (studentList) {
    studentList.innerHTML = students.map(s => `
      <li class="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
        <div>
          <span class="font-medium">${s.name}</span>
          <span class="text-sm text-gray-500 ml-2">${s.sclass}</span>
        </div>
        <div class="space-x-2">
          <button onclick="editStudent(${s.id})" class="text-blue-600 hover:text-blue-800">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteStudent(${s.id})" class="text-red-600 hover:text-red-800">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </li>
    `).join('');
  }
}

function renderTeachers() {
  const teacherList = document.getElementById('teacherList');
  if (teacherList) {
    teacherList.innerHTML = teachers.map(t => `
      <li class="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
        <div>
          <span class="font-medium">${t.name}</span>
          <span class="text-sm text-gray-500 ml-2">${t.subject}</span>
        </div>
        <div class="space-x-2">
          <button onclick="editTeacher(${t.id})" class="text-blue-600 hover:text-blue-800">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteTeacher(${t.id})" class="text-red-600 hover:text-red-800">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </li>
    `).join('');
  }
}

function renderStats() {
  document.getElementById('statTotalStudents').textContent = students.length;
  
  const present = attendance.filter(a => a.status === 'Present').length;
  const absent = attendance.filter(a => a.status === 'Absent').length;
  const late = attendance.filter(a => a.status === 'Late').length;
  
  document.getElementById('statPresent').textContent = present;
  document.getElementById('statAbsent').textContent = absent;
  document.getElementById('statLate').textContent = late;
  
  // Calculate growth percentage (demo)
  const growth = students.length > 0 ? Math.round((students.length / 50) * 100) : 0;
  document.getElementById('studentGrowth').textContent = `${growth}%`;
}

// CRUD Operations
async function deleteAttendance(id) {
  if (confirm('Delete attendance record?')) {
    attendance = attendance.filter(a => a.id !== id);
    renderAttendance();
    renderStats();
    renderCharts();
    showAlert('Attendance record deleted', 'success');
  }
}

async function deleteStudent(id) {
  if (confirm('Delete this student?')) {
    try {
      await fetch(`http://localhost:3000/students/${id}`, { method: 'DELETE' });
      students = students.filter(s => s.id !== id);
      attendance = attendance.filter(a => a.id !== id);
      renderStudents();
      renderAttendance();
      renderCharts();
      showAlert('Student deleted successfully', 'success');
    } catch (error) {
      showAlert('Error deleting student', 'error');
      console.error(error);
    }
  }
}

function editStudent(id) {
  const student = students.find(s => s.id === id);
  if (student) {
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentClass').value = student.sclass;
    document.getElementById('guardianContact').value = student.guardian;
    editStudentId = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

async function deleteTeacher(id) {
  if (confirm('Delete this teacher?')) {
    try {
      await fetch(`http://localhost:3000/teachers/${id}`, { method: 'DELETE' });
      teachers = teachers.filter(t => t.id !== id);
      renderTeachers();
      showAlert('Teacher deleted successfully', 'success');
    } catch (error) {
      showAlert('Error deleting teacher', 'error');
      console.error(error);
    }
  }
}

function editTeacher(id) {
  const teacher = teachers.find(t => t.id === id);
  if (teacher) {
    document.getElementById('teacherName').value = teacher.name;
    document.getElementById('teacherSubject').value = teacher.subject;
    document.getElementById('teacherContact').value = teacher.contact;
    editTeacherId = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Helper Functions
function updateClassFilter() {
  const uniqueClasses = [...new Set(students.map(s => s.sclass))];
  classFilter.innerHTML = '<option value="">All Classes</option>' + 
    uniqueClasses.map(c => `<option value="${c}">${c}</option>`).join('');
}

function updateNotificationBadge() {
  const lateCount = attendance.filter(a => a.status === 'Late').length;
  const absentCount = attendance.filter(a => a.status === 'Absent').length;
  const totalNotifications = lateCount + absentCount;
  
  if (totalNotifications > 0) {
    notificationBadge.textContent = totalNotifications;
    notificationBadge.classList.remove('hidden');
  } else {
    notificationBadge.classList.add('hidden');
  }
}

function simulateLateArrivals() {
  const newLateCount = Math.floor(Math.random() * 3); // 0-2 new late arrivals
  if (newLateCount > 0) {
    document.getElementById('lateCount').textContent = newLateCount;
    lateArrivalAlert.classList.remove('hidden');
    
    // Add new late arrivals
    for (let i = 0; i < newLateCount; i++) {
      const randomStudent = students[Math.floor(Math.random() * students.length)];
      if (randomStudent) {
        attendance.push({
          id: randomStudent.id,
          name: randomStudent.name,
          sclass: randomStudent.sclass,
          status: 'Late',
          time: new Date().toLocaleTimeString()
        });
      }
    }
    
    renderAttendance();
    renderStats();
    renderCharts();
    updateNotificationBadge();
    
    // Hide after 5 seconds
    setTimeout(() => {
      lateArrivalAlert.classList.add('hidden');
    }, 5000);
  }
}

function notifyParents() {
  const absentStudents = attendance.filter(a => a.status === 'Absent');
  if (absentStudents.length === 0) {
    showAlert('No absent students to notify', 'info');
    return;
  }
  
  showAlert(`Notified parents of ${absentStudents.length} absent students`, 'success');
}

function exportAttendance() {
  const filter = classFilter.value;
  const filtered = filter ? attendance.filter(a => a.sclass === filter) : attendance;
  
  // Create CSV content
  let csv = 'Name,Class,Status,Time\n';
  filtered.forEach(a => {
    csv += `${a.name},${a.sclass},${a.status},${a.time}\n`;
  });
  
  // Create download link
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showAlert('Attendance exported successfully', 'success');
}

// Pagination Functions
function goToPage(page) {
  currentPage = page;
  renderAttendance();
}

function nextPage() {
  const filter = classFilter.value;
  const filtered = filter ? attendance.filter(a => a.sclass === filter) : attendance;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  if (currentPage < totalPages) {
    currentPage++;
    renderAttendance();
  }
}

function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    renderAttendance();
  }
}

// UI Helpers
function showAlert(message, type) {
  const alert = document.createElement('div');
  alert.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg text-white ${
    type === 'error' ? 'bg-red-500' : 
    type === 'success' ? 'bg-green-500' : 
    'bg-blue-500'
  }`;
  alert.textContent = message;
  document.body.appendChild(alert);
  
  setTimeout(() => {
    alert.classList.add('opacity-0', 'transition-opacity', 'duration-500');
    setTimeout(() => document.body.removeChild(alert), 500);
  }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  
  // Add event listeners
  classFilter.addEventListener('change', () => {
    currentPage = 1;
    renderAttendance();
  });
});