/**************************************************************
 * script.js
 *  - Semanas en lunes
 *  - Prioridad color (Falla > Evento > Festivo > Weekend)
 *  - namedHolidays => especifica el nombre del festivo (en vez de "Festivo")
 *  - generateMonthInfo => muestra solo el número del día y el nombre
 **************************************************************/

/* === 1. DATOS BASE === */

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

/**
 * Diccionario que asocia la fecha (MM-DD) con el NOMBRE exacto del festivo.
 */
const namedHolidays = {
  "01-01": "Año Nuevo",
  "01-06": "Epifanía del Señor",
  "01-22": "San Vicente Mártir",
  "03-19": "San José",
  "04-18": "Viernes Santo",
  "04-21": "Lunes de Pascua",
  "04-28": "San Vicente Ferrer",
  "05-01": "Fiesta del Trabajo",
  "06-24": "San Juan (recuperable)",
  "08-15": "Asunción de la Virgen",
  "10-09": "Día de la Comunidad Valenciana",
  "11-01": "Todos los Santos",
  "12-06": "Día de la Constitución",
  "12-08": "Inmaculada Concepción",
  "12-25": "Navidad"
  // Agrega más si es necesario.
};

/**
 * Días de Falla (incluyendo 19/01 => Falla + Evento)
 */
const fallaDays = [
  "01-19", 
  "03-15", "03-16", "03-17", "03-18", "03-19"
];

/**
 * Eventos especiales (además de 19-ene "Presentación Falleras Mayores")
 */
const specialEvents = {
  "01-19": "Presentación Falleras Mayores",
  "02-14": "San Valentín",
  "03-08": "Día Internacional de la Mujer",
  "12-31": "Nochevieja"
};

/**
 * Convertir getDay() (domingo=0) a índice basado en lunes.
 */
function mondayBasedIndex(jsDay) {
  return (jsDay + 6) % 7;
}

function isWeekendMondayBased(dayIndex) {
  return (dayIndex === 5 || dayIndex === 6);
}

/* === 2. Iniciar calendarios al cargar === */
window.addEventListener('DOMContentLoaded', () => {
  const gridMeses = document.getElementById('grid-de-meses');

  // Crear 12 tarjetas (mini)
  for (let i = 0; i < 12; i++) {
    const mesCard = document.createElement('div');
    mesCard.classList.add('mes-card');
    mesCard.setAttribute('data-month', i);

    const tituloMes = document.createElement('h3');
    tituloMes.textContent = monthNames[i];
    mesCard.appendChild(tituloMes);

    const miniCalendar = document.createElement('div');
    miniCalendar.classList.add('calendar-mini');
    miniCalendar.id = `mini-calendar-${i}`;
    mesCard.appendChild(miniCalendar);

    gridMeses.appendChild(mesCard);

    // Generar mini calendario
    generateMiniCalendar(2025, i, miniCalendar.id);
  }

  // Clic en tarjeta => abrir modal correspondiente
  document.querySelectorAll('.mes-card').forEach(card => {
    card.addEventListener('click', () => {
      const monthIndex = card.getAttribute('data-month');
      const modal = document.getElementById(`modal-${monthIndex}`);
      if (modal) {
        modal.classList.add('active');
      }
    });
  });

  // Generar calendarios grandes y la info adicional de cada mes
  for (let i = 0; i < 12; i++) {
    generateFullCalendar(2025, i, `calendar-full-${i}`);
    generateMonthInfo(2025, i, `info-${i}`);
  }

  initModalEvents();

  // Inicializar eventos para el modal de día
  const acceptButton = document.getElementById('day-modal-accept');
  acceptButton.addEventListener('click', () => {
    if (currentDayEvent) {
      const { year, monthIndex, day } = currentDayEvent;
      const eventTitle = `Evento día ${day} de ${monthNames[monthIndex]}`;
      generateICSFile(eventTitle, year, monthIndex, day);
    }
    hideDayModal();
  });

  const closeDayModalBtn = document.querySelector('.close-day-modal');
  closeDayModalBtn.addEventListener('click', hideDayModal);
});

/**
 * generateMiniCalendar: Prioridad:
 * 1) Falla, 2) Evento, 3) Festivo, 4) Weekend, 5) Normal.
 */
function generateMiniCalendar(year, monthIndex, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const firstDay = new Date(year, monthIndex, 1);
  const startDayMon = mondayBasedIndex(firstDay.getDay());
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();

  // Celdas vacías
  for (let i = 0; i < startDayMon; i++) {
    const emptyDiv = document.createElement('div');
    emptyDiv.classList.add('day-mini');
    container.appendChild(emptyDiv);
  }

  for (let day = 1; day <= totalDays; day++) {
    const mmdd = String(monthIndex + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    const date = new Date(year, monthIndex, day);
    const weekdayMon = mondayBasedIndex(date.getDay());

    const dayDiv = document.createElement('div');
    dayDiv.classList.add('day-mini');
    dayDiv.textContent = day;

    // 1) Falla
    if (fallaDays.includes(mmdd)) {
      dayDiv.classList.add('mini-falla');
      const markerFa = document.createElement('span');
      markerFa.classList.add('mini-marker');
      dayDiv.appendChild(markerFa);
    }
    // 2) Evento
    else if (specialEvents[mmdd]) {
      dayDiv.classList.add('mini-evento');
      const markerE = document.createElement('span');
      markerE.classList.add('mini-marker');
      dayDiv.appendChild(markerE);
    }
    // 3) Festivo
    else if (namedHolidays[mmdd]) {
      dayDiv.classList.add('mini-festivo');
      const markerF = document.createElement('span');
      markerF.classList.add('mini-marker');
      dayDiv.appendChild(markerF);
    }
    // 4) Weekend
    else if (isWeekendMondayBased(weekdayMon)) {
      dayDiv.classList.add('weekend-mini');
    }
    // 5) Normal

    container.appendChild(dayDiv);
  }
}

/**
 * generateFullCalendar: Prioridad:
 * 1) Falla, 2) Evento, 3) Festivo, 4) Weekend, 5) Normal.
 * Se muestran etiquetas según la prioridad.
 */
function generateFullCalendar(year, monthIndex, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const firstDay = new Date(year, monthIndex, 1);
  const startDayMon = mondayBasedIndex(firstDay.getDay());
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();

  // Celdas vacías
  for (let i = 0; i < startDayMon; i++) {
    const emptyDiv = document.createElement('div');
    emptyDiv.classList.add('day');
    container.appendChild(emptyDiv);
  }

  for (let day = 1; day <= totalDays; day++) {
    const mmdd = String(monthIndex + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    const date = new Date(year, monthIndex, day);
    const weekdayMon = mondayBasedIndex(date.getDay());

    const dayDiv = document.createElement('div');
    dayDiv.classList.add('day');
    dayDiv.textContent = day;

    // 1) Falla
    if (fallaDays.includes(mmdd)) {
      dayDiv.classList.add('falla-day');
      let labelText = "Falla";
      if (specialEvents[mmdd]) {
        labelText += ` – ${specialEvents[mmdd]}`;
      }
      if (namedHolidays[mmdd]) {
        labelText += ` (Festivo: ${namedHolidays[mmdd]})`;
      }
      const labelSpan = document.createElement('span');
      labelSpan.classList.add('day-label');
      labelSpan.textContent = labelText;
      dayDiv.appendChild(labelSpan);
    }
    // 2) Evento
    else if (specialEvents[mmdd]) {
      dayDiv.classList.add('event');
      let labelText = specialEvents[mmdd];
      if (namedHolidays[mmdd]) {
        labelText += ` (Festivo: ${namedHolidays[mmdd]})`;
      }
      const labelSpan = document.createElement('span');
      labelSpan.classList.add('day-label');
      labelSpan.textContent = labelText;
      dayDiv.appendChild(labelSpan);
    }
    // 3) Festivo
    else if (namedHolidays[mmdd]) {
      dayDiv.classList.add('festivo-valencia');
      const labelSpan = document.createElement('span');
      labelSpan.classList.add('day-label');
      labelSpan.textContent = namedHolidays[mmdd];
      dayDiv.appendChild(labelSpan);
    }
    // 4) Weekend
    else if (isWeekendMondayBased(weekdayMon)) {
      dayDiv.classList.add('weekend');
    }
    // 5) Normal

    // Mostrar modal de día al hacer clic sobre la fecha
    dayDiv.addEventListener('click', () => {
      showDayModal(year, monthIndex, day, mmdd);
    });

    container.appendChild(dayDiv);
  }
}

/**
 * generateMonthInfo: Recorre los días del mes y muestra:
 * - Si es Falla, Evento o Festivo (con nombre)
 * - El número del día y la descripción, ordenado por día.
 */
function generateMonthInfo(year, monthIndex, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const relevantDays = [];

  for (let day = 1; day <= totalDays; day++) {
    const mmdd = String(monthIndex + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    let desc = "";

    if (fallaDays.includes(mmdd)) {
      desc = "Falla";
      if (specialEvents[mmdd]) {
        desc += ` – ${specialEvents[mmdd]}`;
      }
      if (namedHolidays[mmdd]) {
        desc += ` (Festivo: ${namedHolidays[mmdd]})`;
      }
      relevantDays.push({ day, text: `${day}: ${desc}` });
    } else if (specialEvents[mmdd]) {
      desc = specialEvents[mmdd];
      if (namedHolidays[mmdd]) {
        desc += ` (Festivo: ${namedHolidays[mmdd]})`;
      }
      relevantDays.push({ day, text: `${day}: ${desc}` });
    } else if (namedHolidays[mmdd]) {
      desc = namedHolidays[mmdd];
      relevantDays.push({ day, text: `${day}: ${desc}` });
    }
  }

  // Ordenar ascendente por día
  relevantDays.sort((a, b) => a.day - b.day);

  relevantDays.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.text;
    container.appendChild(li);
  });
}

/**
 * initModalEvents: Inicializa eventos para cerrar los modales (calendario grande).
 */
function initModalEvents() {
  const closeButtons = document.querySelectorAll('.close-modal');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
      }
    });
  });

  const allModals = document.querySelectorAll('.modal');
  allModals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
}

/**
 * generateICSFile: Genera y descarga el archivo .ics para el evento.
 */
function generateICSFile(eventTitle, year, monthIndex, day) {
  const startDate = new Date(year, monthIndex, day, 0, 0);
  const endDate = new Date(year, monthIndex, day, 23, 59);

  const dtStart = formatDateICS(startDate);
  const dtEnd   = formatDateICS(endDate);

  const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Mi Calendario 2025//ES
BEGIN:VEVENT
UID:${Date.now()}@mi-calendario
DTSTAMP:${formatDateICS(new Date())}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${eventTitle}
DESCRIPTION:Generado desde el Calendario 2025
END:VEVENT
END:VCALENDAR
`.trim();

  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = eventTitle.replace(/\s+/g, '_') + '.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * formatDateICS: Formatea la fecha en "YYYYMMDDTHHMMSSZ" (UTC).
 */
function formatDateICS(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

// Variable global para almacenar la fecha actualmente seleccionada
let currentDayEvent = null;

/**
 * showDayModal: Muestra el modal con información del día.
 * @param {number} year 
 * @param {number} monthIndex 
 * @param {number} day 
 * @param {string} mmdd  -> Formato "MM-DD"
 */
function showDayModal(year, monthIndex, day, mmdd) {
  currentDayEvent = { year, monthIndex, day };
  const modalMessage = document.getElementById('day-modal-message');
  let message = `Fecha: ${day} de ${monthNames[monthIndex]}.`;
  
  // Agregar detalles si la fecha es especial
  if (fallaDays.includes(mmdd)) {
    message += " Evento: Falla";
    if (specialEvents[mmdd]) {
      message += ` – ${specialEvents[mmdd]}`;
    }
    if (namedHolidays[mmdd]) {
      message += ` (Festivo: ${namedHolidays[mmdd]})`;
    }
  } else if (specialEvents[mmdd]) {
    message += ` Evento: ${specialEvents[mmdd]}`;
    if (namedHolidays[mmdd]) {
      message += ` (Festivo: ${namedHolidays[mmdd]})`;
    }
  } else if (namedHolidays[mmdd]) {
    message += ` Festivo: ${namedHolidays[mmdd]}`;
  }
  
  message += " Al hacer clic en Aceptar, se descargará un archivo .ics para agregar el evento a tu calendario.";
  modalMessage.textContent = message;
  
  // Mostrar el modal de día
  document.getElementById('day-modal').classList.add('active');
}

/**
 * hideDayModal: Oculta el modal de día.
 */
function hideDayModal() {
  document.getElementById('day-modal').classList.remove('active');
}