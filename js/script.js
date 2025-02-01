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
 * Diccionario que asocia la fecha (MM-DD) con el NOMBRE exacto del festivo
 * (en lugar de decir "Festivo").
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
  // Si hay más, añádelos aquí.
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
 * Convert getDay() => lunes-based
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

    // Generar mini
    generateMiniCalendar(2025, i, miniCalendar.id);
  }

  // Clic en tarjeta => abrir modal
  document.querySelectorAll('.mes-card').forEach(card => {
    card.addEventListener('click', () => {
      const monthIndex = card.getAttribute('data-month');
      const modal = document.getElementById(`modal-${monthIndex}`);
      if (modal) {
        modal.classList.add('active');
      }
    });
  });

  // Generar calendarios grandes + info de cada mes
  for (let i = 0; i < 12; i++) {
    generateFullCalendar(2025, i, `calendar-full-${i}`);
    generateMonthInfo(2025, i, `info-${i}`);
  }

  initModalEvents();
});

/**
 * generateMiniCalendar => prioridad:
 * 1) Falla, 2) Evento, 3) Festivo, 4) Weekend, 5) Normal
 * Usamos namedHolidays solo para la parte textual (en generateMonthInfo).
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
    const mmdd = String(monthIndex+1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
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
      // markerFa.textContent = 'Falla';
      dayDiv.appendChild(markerFa);
    }
    // 2) Evento
    else if (specialEvents[mmdd]) {
      dayDiv.classList.add('mini-evento');
      const markerE = document.createElement('span');
      markerE.classList.add('mini-marker');
      // markerE.textContent = 'Evento';
      dayDiv.appendChild(markerE);
    }
    // 3) Festivo => si existe en namedHolidays (p. ej. "01-01": "Año Nuevo")
    else if (namedHolidays[mmdd]) {
      dayDiv.classList.add('mini-festivo');
      const markerF = document.createElement('span');
      markerF.classList.add('mini-marker');
      // markerF.textContent = 'Festivo'; // O podrías poner la inicial del festivo
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
 * generateFullCalendar => prioridad:
 * 1) Falla, 2) Evento, 3) Festivo, 4) Weekend, 5) Normal
 * Si es Falla + Evento => "Falla – NombreEvento"
 * Si es Festivo => .festivo-valencia + namedHolidays[mmdd] en el texto
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
    const mmdd = String(monthIndex+1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
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
        // si además es un festivo con nombre
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
      // ¿También es festivo con nombre?
      if (namedHolidays[mmdd]) {
        labelText += ` (Festivo: ${namedHolidays[mmdd]})`;
      }
      const labelSpan = document.createElement('span');
      labelSpan.classList.add('day-label');
      labelSpan.textContent = labelText;
      dayDiv.appendChild(labelSpan);
    }
    // 3) Festivo con nombre
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

    // Clic => .ics
    dayDiv.addEventListener('click', () => {
      const eventTitle = `Evento día ${day} de ${monthNames[monthIndex]}`;
      generateICSFile(eventTitle, year, monthIndex, day);
    });

    container.appendChild(dayDiv);
  }
}

/**
 * generateMonthInfo => recorre todos los días del mes y muestra:
 *  - Si es falla, evento y/o festivo con su nombre exacto
 *  - Solo el "día" (sin el mes)
 *  - Ordenado por día
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

    // ¿Falla?
    if (fallaDays.includes(mmdd)) {
      desc = "Falla";
      // Además, si hay un evento
      if (specialEvents[mmdd]) {
        desc += ` – ${specialEvents[mmdd]}`;
      }
      // Además, si es festivo con nombre
      if (namedHolidays[mmdd]) {
        desc += ` (Festivo: ${namedHolidays[mmdd]})`;
      }
      relevantDays.push({ day, text: `${day}: ${desc}` });
    }
    // ¿Evento "solo"?
    else if (specialEvents[mmdd]) {
      desc = specialEvents[mmdd];
      // ¿Además es festivo con nombre?
      if (namedHolidays[mmdd]) {
        desc += ` (Festivo: ${namedHolidays[mmdd]})`;
      }
      relevantDays.push({ day, text: `${day}: ${desc}` });
    }
    // ¿Festivo con nombre?
    else if (namedHolidays[mmdd]) {
      desc = namedHolidays[mmdd];
      // ej. "15: Asunción de la Virgen"
      relevantDays.push({ day, text: `${day}: ${desc}` });
    }
    // sino => no lo listamos
  }

  // Ordenar asc por day
  relevantDays.sort((a,b) => a.day - b.day);

  // Crear <li> por cada uno
  relevantDays.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.text; // ej. "19: Falla – Presentación Falleras Mayores (Festivo: San José)"
    container.appendChild(li);
  });
}

/**
 * initModalEvents => cerrar modales
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
 * Generar .ics
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
 * formatDateICS => "YYYYMMDDTHHMMSSZ"
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