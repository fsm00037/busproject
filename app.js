class Driver {
    constructor(name, hoursWorked, maxWorkHours, minRestHours, maxWeeklyHours, maxBiweeklyHours) {
        this.name = name;
        this.secondsWorked = hoursWorked * 3600; // Guardar horas en segundos
        this.isRunning = false; // Estado de la ruta (si está en marcha o no)
        this.weeklySeconds = 0; // Horas trabajadas esta semana (en segundos)
        this.biweeklySeconds = 0; // Horas trabajadas en las últimas dos semanas
        this.lastWorkEnd = null; // Última vez que el conductor dejó de trabajar (para calcular el descanso)
        this.restTimeRequired = minRestHours * 3600; // Tiempo mínimo de descanso en segundos
        this.maxWorkSeconds = maxWorkHours * 3600; // Máximo de horas de trabajo en segundos
        this.maxWeeklySeconds = maxWeeklyHours * 3600; // Máximo de horas semanales en segundos
        this.maxBiweeklySeconds = maxBiweeklyHours * 3600; // Máximo de horas bisemanales en segundos
    }

    addSeconds(seconds) {
        this.secondsWorked += seconds;
        this.weeklySeconds += seconds;
        this.biweeklySeconds += seconds;
    }

    getFormattedTime() {
        const hours = Math.floor(this.secondsWorked / 3600);
        const minutes = Math.floor((this.secondsWorked % 3600) / 60);
        const seconds = Math.floor(this.secondsWorked % 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    getWeeklyTime() {
        const hours = Math.floor(this.weeklySeconds / 3600);
        const minutes = Math.floor((this.weeklySeconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    getBiweeklyTime() {
        const hours = Math.floor(this.biweeklySeconds / 3600);
        const minutes = Math.floor((this.biweeklySeconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    hasRestedEnough() {
        if (this.lastWorkEnd === null) {
            return true; // Si nunca ha trabajado, no necesita descansar
        }

        const now = new Date();
        const timeSinceLastWork = (now - this.lastWorkEnd) / 1000; // Tiempo en segundos
        return timeSinceLastWork >= this.restTimeRequired;
    }

    hasExceededWeeklyLimit() {
        return this.weeklySeconds >= this.maxWeeklySeconds;
    }

    hasExceededBiweeklyLimit() {
        return this.biweeklySeconds >= this.maxBiweeklySeconds;
    }

    endWorkSession() {
        this.lastWorkEnd = new Date(); // Registrar el fin de la sesión de trabajo
    }

    isAvailable() {
        return this.hasRestedEnough() && !this.hasExceededWeeklyLimit() && !this.hasExceededBiweeklyLimit();
    }
}

let drivers = [];
let timers = [];
let maxWorkHours = 9;  // Por defecto 9 horas de trabajo
let minRestHours = 24; // Por defecto 24 horas de descanso
let maxWeeklyHours = 56; // Por defecto 56 horas semanales
let maxBiweeklyHours = 90; // Por defecto 90 horas bisemanales

// Formulario para añadir conductores
document.getElementById("driverForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("driverName").value;
    const hours = parseInt(document.getElementById("driverHours").value) || 0;
    const minutes = parseInt(document.getElementById("driverMinutes").value) || 0;
    const seconds = parseInt(document.getElementById("driverSeconds").value) || 0;

    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    const driver = new Driver(name, totalSeconds / 3600, maxWorkHours, minRestHours, maxWeeklyHours, maxBiweeklyHours);
    drivers.push(driver);

    renderDrivers();
    e.target.reset();
});

// Formulario para añadir trabajo
document.getElementById("workForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const hours = parseInt(document.getElementById("workHours").value) || 0;
    const totalSeconds = hours * 3600;

    const availableDrivers = drivers.filter(driver => driver.isAvailable());
    
    if (availableDrivers.length === 0) {
        alert("No hay conductores disponibles para este trabajo.");
        return;
    }

    showAvailableDrivers(availableDrivers, totalSeconds);
    e.target.reset();
});

// Mostrar conductores disponibles
function showAvailableDrivers(availableDrivers, totalSeconds) {
    const availableDriversList = document.getElementById("availableDriversList");
    availableDriversList.innerHTML = ''; // Limpiar lista anterior

    availableDrivers.forEach((driver, index) => {
        let listItem = document.createElement("li");

        listItem.innerHTML = `
            ${driver.name} (Horas trabajadas: ${driver.getFormattedTime()})
            <button onclick="assignWork(${index}, ${totalSeconds})">Asignar trabajo</button>
        `;

        availableDriversList.appendChild(listItem);
    });

    document.getElementById("availableDriversSection").style.display = 'block'; // Mostrar sección de conductores disponibles
}

// Asignar trabajo al conductor seleccionado
function assignWork(index, totalSeconds) {
    const driver = drivers[index];
    driver.addSeconds(totalSeconds);

    alert(`Trabajo asignado a ${driver.name}. Se añadieron ${totalSeconds / 3600} horas.`);
    renderDrivers();

    document.getElementById("availableDriversSection").style.display = 'none'; // Ocultar lista después de asignar el trabajo
}

// Iniciar ruta
function startRoute(index) {
    const driver = drivers[index];

    if (!driver.hasRestedEnough()) {
        alert("Este conductor no ha descansado lo suficiente. No puede iniciar una nueva ruta.");
        return;
    }

    if (driver.hasExceededWeeklyLimit()) {
        alert("Este conductor ha excedido el límite de horas semanales.");
        return;
    }

    if (driver.hasExceededBiweeklyLimit()) {
        alert("Este conductor ha excedido el límite de horas bisemanales.");
        return;
    }

    driver.isRunning = true;

    if (!timers[index]) {
        timers[index] = setInterval(() => {
            driver.addSeconds(1);
            renderDrivers();
        }, 1000);
    }
}

// Detener ruta
function stopRoute(index) {
    drivers[index].isRunning = false;

    if (timers[index]) {
        clearInterval(timers[index]);
        delete timers[index];
    }

    drivers[index].endWorkSession();
    renderDrivers();
}

// Eliminar conductor
function deleteDriver(index) {
    drivers.splice(index, 1);
    renderDrivers();
}

// Renderizar tabla de conductores
function renderDrivers() {
    const driverList = document.getElementById("driverList");
    driverList.innerHTML = '';

    drivers.forEach((driver, index) => {
        let listItem = document.createElement("tr");

        listItem.innerHTML = `
            <td>${driver.name}</td>
            <td>${driver.getFormattedTime()}</td>
            <td>${driver.getWeeklyTime()}</td>
            <td>${driver.getBiweeklyTime()}</td>
            <td>
                <button onclick="editDriver(${index})" class="btn-action">✏️</button>
                <button onclick="startRoute(${index})" class="btn-action">${driver.isRunning ? '⏸️' : '▶️'}</button>
                <button onclick="deleteDriver(${index})" class="btn-action">🗑️</button>
            </td>
        `;

        driverList.appendChild(listItem);
    });
}

// Control de ajustes
document.getElementById("settingsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    maxWorkHours = parseInt(document.getElementById("maxWorkHours").value) || 9;
    minRestHours = parseInt(document.getElementById("minRestHours").value) || 24;
    maxWeeklyHours = parseInt(document.getElementById("maxWeeklyHours").value) || 56;
    maxBiweeklyHours = parseInt(document.getElementById("maxBiweeklyHours").value) || 90;

    alert(`Ajustes guardados:\nMáximo de horas de trabajo: ${maxWorkHours} horas\nMínimo de horas de descanso: ${minRestHours} horas\nMáximo de horas semanales: ${maxWeeklyHours} horas\nMáximo de horas bisemanales: ${maxBiweeklyHours} horas`);
});

// Control del modal de ajustes
const settingsModal = document.getElementById("settingsModal");
const settingsButton = document.getElementById("settingsButton");
const closeModal = document.getElementById("closeModal");

settingsButton.onclick = function() {
    settingsModal.style.display = "block";
};

closeModal.onclick = function() {
    settingsModal.style.display = "none";
};

window.onclick = function(event) {
    if (event.target === settingsModal) {
        settingsModal.style.display = "none";
    }
};
