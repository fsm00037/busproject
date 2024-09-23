class Driver {
    constructor(name, maxWorkHours, minRestHours, maxWeeklyHours, maxBiweeklyHours) {
        this.name = name;
        this.secondsWorked = 0; // Total de segundos trabajados
        this.weeklySeconds = 0; // Segundos trabajados en la semana
        this.biweeklySeconds = 0; // Segundos trabajados en dos semanas
        this.lastWorkEnd = null; // Fecha y hora del último trabajo
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
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    hasRestedEnough(newWorkStartTime) {
        if (this.lastWorkEnd === null) {
            return true; // Si nunca ha trabajado, no necesita descansar
        }

        const timeSinceLastWork = (new Date(newWorkStartTime) - this.lastWorkEnd) / 1000; // Tiempo en segundos
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
}

let drivers = [];
let works = [];
let maxWorkHours = 9;  // Por defecto
let minRestHours = 24; // Por defecto
let maxWeeklyHours = 56; // Por defecto
let maxBiweeklyHours = 90; // Por defecto

document.getElementById("driverForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("driverName").value;

    const driver = new Driver(name, maxWorkHours, minRestHours, maxWeeklyHours, maxBiweeklyHours);
    drivers.push(driver);

    renderDrivers();
    e.target.reset();
});

document.getElementById("workForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const workName = document.getElementById("workName").value;
    const workDate = document.getElementById("workDate").value;
    const workStartTime = document.getElementById("workStartTime").value;
    const workEndTime = document.getElementById("workEndTime").value;

    const workDurationInSeconds = (new Date(`${workDate}T${workEndTime}`) - new Date(`${workDate}T${workStartTime}`)) / 1000;

    const availableDrivers = drivers.filter(driver => {
        const exceedsWeekly = driver.hasExceededWeeklyLimit();
        const exceedsBiweekly = driver.hasExceededBiweeklyLimit();
        return driver.hasRestedEnough(`${workDate}T${workStartTime}`) &&
               !exceedsWeekly &&
               !exceedsBiweekly &&
               (driver.secondsWorked + workDurationInSeconds <= driver.maxWorkSeconds);
    });

    if (availableDrivers.length > 0) {
        showAvailableDrivers(availableDrivers, workName, workDate, workStartTime, workEndTime);
    } else {
        alert("No hay conductores disponibles para esta fecha y horas.");
    }
});

function showAvailableDrivers(availableDrivers, workName, workDate, workStartTime, workEndTime) {
    const availableDriversList = document.getElementById("availableDriversList");
    availableDriversList.innerHTML = ''; // Limpiar la lista

    availableDrivers.forEach(driver => {
        const listItem = document.createElement("li");
        listItem.textContent = driver.name;

        const assignButton = document.createElement("button");
        assignButton.textContent = "Asignar";
        assignButton.onclick = () => {
            assignWork(driver, workName, workDate, workStartTime, workEndTime);
            document.getElementById("availableDriversModal").style.display = 'none'; // Cerrar modal
        };
        listItem.appendChild(assignButton);
        availableDriversList.appendChild(listItem);
    });

    document.getElementById("availableDriversModal").style.display = 'block';
}

function assignWork(driver, workName, workDate, workStartTime, workEndTime) {
    const work = {
        name: workName,
        date: workDate,
        startTime: workStartTime,
        endTime: workEndTime,
        driver: driver.name
    };

    const workDurationInSeconds = (new Date(`${workDate}T${workEndTime}`) - new Date(`${workDate}T${workStartTime}`)) / 1000;
    driver.addSeconds(workDurationInSeconds); // Sumar horas al conductor
    driver.endWorkSession(); // Registrar fin de trabajo
    works.push(work);
    renderWorks();
    renderDrivers();
}

function renderDrivers() {
    const driverList = document.getElementById("driverList");
    driverList.innerHTML = '<tr><th>Nombre</th><th>Horas Trabajadas</th><th>Acciones</th></tr>';
    
    drivers.forEach(driver => {
        const row = driverList.insertRow();
        row.insertCell(0).textContent = driver.name;
        row.insertCell(1).textContent = driver.getFormattedTime();

        const actionsCell = row.insertCell(2);
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Eliminar";
        deleteButton.onclick = () => {
            drivers = drivers.filter(d => d !== driver);
            renderDrivers();
        };
        actionsCell.appendChild(deleteButton);
    });
}

function renderWorks() {
    const workList = document.getElementById("workList");
    workList.innerHTML = '<tr><th>Trabajo</th><th>Fecha</th><th>Hora Inicio</th><th>Hora Fin</th><th>Conductor Asignado</th></tr>';
    
    works.forEach(work => {
        const row = workList.insertRow();
        row.insertCell(0).textContent = work.name;
        row.insertCell(1).textContent = work.date;
        row.insertCell(2).textContent = work.startTime;
        row.insertCell(3).textContent = work.endTime;
        row.insertCell(4).textContent = work.driver;
    });
}

document.getElementById("settingsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    maxWorkHours = parseInt(document.getElementById("maxWorkHours").value);
    minRestHours = parseInt(document.getElementById("minRestHours").value);
    maxWeeklyHours = parseInt(document.getElementById("maxWeeklyHours").value);
    maxBiweeklyHours = parseInt(document.getElementById("maxBiweeklyHours").value);
    alert("Ajustes guardados.");
});

// Mostrar el modal de ajustes
document.getElementById("settingsButton").onclick = function() {
    document.getElementById("settingsModal").style.display = "block";
};

// Cerrar el modal de ajustes
document.querySelector(".close").onclick = function() {
    document.getElementById("settingsModal").style.display = "none";
};

// Cerrar el modal al hacer clic fuera de él
window.onclick = function(event) {
    const modals = [document.getElementById("settingsModal"), document.getElementById("availableDriversModal")];
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
};
