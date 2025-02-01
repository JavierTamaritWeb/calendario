/**************************************************************
 * SCRIPT.JS
 * - Calendario basado en semanas (lunes como inicio).
 * - Prioridad de color: Falla > Evento > Festivo > Weekend.
 * - Muestra información y genera archivo .ics.
 * - Modal de día draggable (se mueve con clic y arrastre).
 **************************************************************/

/* ---------- Datos Base ---------- */
const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

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
};

const fallaDays = [
  "01-19", "03-15", "03-16", "03-17", "03-18", "03-19"
];

const specialEvents = {
  "01-19": "Presentación Falleras Mayores",
  "02-14": "San Valentín",
  "03-08": "Día Internacional de la Mujer",
  "12-31": "Nochevieja"
};

/* ---------- Funciones Utilitarias ---------- */
/**
 * Convierte getDay() (donde domingo=0) a índice basado en lunes.
 * Resultado: Lunes=0, …, Domingo=6.
 */
const mondayBasedIndex = (jsDay) => (jsDay + 6) % 7;

const isWeekendMondayBased = (dayIndex) => (dayIndex === 5 || dayIndex === 6);

/* ---------- Inicialización ---------- */
window.addEventListener('DOMContentLoaded', () => {
  const gridMeses = document.getElementById('grid-de-meses');

  // Crear 12 tarjetas de mes (mini-calendarios)
  for (let i = 0; i < 12; i++) {
    const mesCard = document.createElement('div');
    mesCard.classList.add('mes-card');
    mesCard.dataset.month = i;

    const tituloMes = document.createElement('h3');
    tituloMes.textContent = monthNames[i];
    mesCard.appendChild(tituloMes);

    const miniCalendar = document.createElement('div');
    miniCalendar.classList.add('calendar-mini');
    miniCalendar.id = `mini-calendar-${i}`;
    mesCard.appendChild(miniCalendar);

    gridMeses.appendChild(mesCard);
    generateMiniCalendar(2025, i, miniCalendar.id);
  }

  // Abrir modal correspondiente al hacer clic en la tarjeta
  document.querySelectorAll('.mes-card').forEach(card => {
    card.addEventListener('click', () => {
      const monthIndex = card.dataset.month;
      const modal = document.getElementById(`modal-${monthIndex}`);
      if (modal) modal.classList.add('active');
    });
  });

  // Generar calendarios completos e información adicional para cada mes
  for (let i = 0; i < 12; i++) {
    generateFullCalendar(2025, i, `calendar-full-${i}`);
    generateMonthInfo(2025, i, `info-${i}`);
  }

  initModalEvents();

  // Eventos para el modal de día
  document.getElementById('day-modal-accept').addEventListener('click', () => {
    if (currentDayEvent) {
      const { year, monthIndex, day } = currentDayEvent;
      const eventTitle = `Evento día ${day} de ${monthNames[monthIndex]}`;
      generateICSFile(eventTitle, year, monthIndex, day);
    }
    hideDayModal();
  });

  document.querySelector('.close-day-modal').addEventListener('click', hideDayModal);

  // Hacer draggable el modal de día
  const dayModalElement = document.getElementById('day-modal');
  makeDraggable(dayModalElement);
});

/* ---------- Funciones para Generar Calendarios ---------- */
function generateMiniCalendar(year, monthIndex, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  
  const firstDay = new Date(year, monthIndex, 1);
  const startDayMon = mondayBasedIndex(firstDay.getDay());
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  
  // Celdas vacías para alinear el primer día
  for (let i = 0; i < startDayMon; i++) {
    const emptyDiv = document.createElement('div');
    emptyDiv.classList.add('day-mini');
    container.appendChild(emptyDiv);
  }
  
  for (let day = 1; day <= totalDays; day++) {
    const mmdd = `${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(year, monthIndex, day);
    const weekdayMon = mondayBasedIndex(date.getDay());
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('day-mini');
    dayDiv.textContent = day;
  
    if (fallaDays.includes(mmdd)) {
      dayDiv.classList.add('mini-falla');
      const markerFa = document.createElement('span');
      markerFa.classList.add('mini-marker');
      dayDiv.appendChild(markerFa);
    } else if (specialEvents[mmdd]) {
      dayDiv.classList.add('mini-evento');
      const markerE = document.createElement('span');
      markerE.classList.add('mini-marker');
      dayDiv.appendChild(markerE);
    } else if (namedHolidays[mmdd]) {
      dayDiv.classList.add('mini-festivo');
      const markerF = document.createElement('span');
      markerF.classList.add('mini-marker');
      dayDiv.appendChild(markerF);
    } else if (isWeekendMondayBased(weekdayMon)) {
      dayDiv.classList.add('weekend-mini');
    }
  
    if (
      !dayDiv.classList.contains('mini-falla') &&
      !dayDiv.classList.contains('mini-evento') &&
      !dayDiv.classList.contains('mini-festivo') &&
      weekdayMon < 6
    ) {
      dayDiv.style.color = "var(--gris-oscuro)";
    }
    container.appendChild(dayDiv);
  }
}
  
function generateFullCalendar(year, monthIndex, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  
  const firstDay = new Date(year, monthIndex, 1);
  const startDayMon = mondayBasedIndex(firstDay.getDay());
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  
  for (let i = 0; i < startDayMon; i++) {
    const emptyDiv = document.createElement('div');
    emptyDiv.classList.add('day');
    container.appendChild(emptyDiv);
  }
  
  for (let day = 1; day <= totalDays; day++) {
    const mmdd = `${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(year, monthIndex, day);
    const weekdayMon = mondayBasedIndex(date.getDay());
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('day');
    dayDiv.textContent = day;
  
    if (fallaDays.includes(mmdd)) {
      dayDiv.classList.add('falla-day');
      let labelText = "Falla";
      if (specialEvents[mmdd]) labelText += ` – ${specialEvents[mmdd]}`;
      if (namedHolidays[mmdd]) labelText += ` (Festivo: ${namedHolidays[mmdd]})`;
      const labelSpan = document.createElement('span');
      labelSpan.classList.add('day-label');
      labelSpan.textContent = labelText;
      dayDiv.appendChild(labelSpan);
    } else if (specialEvents[mmdd]) {
      dayDiv.classList.add('event');
      let labelText = specialEvents[mmdd];
      if (namedHolidays[mmdd]) labelText += ` (Festivo: ${namedHolidays[mmdd]})`;
      const labelSpan = document.createElement('span');
      labelSpan.classList.add('day-label');
      labelSpan.textContent = labelText;
      dayDiv.appendChild(labelSpan);
    } else if (namedHolidays[mmdd]) {
      dayDiv.classList.add('festivo-valencia');
      const labelSpan = document.createElement('span');
      labelSpan.classList.add('day-label');
      labelSpan.textContent = namedHolidays[mmdd];
      dayDiv.appendChild(labelSpan);
    } else if (isWeekendMondayBased(weekdayMon)) {
      dayDiv.classList.add('weekend');
    }
  
    if (
      !dayDiv.classList.contains('falla-day') &&
      !dayDiv.classList.contains('event') &&
      !dayDiv.classList.contains('festivo-valencia') &&
      weekdayMon < 6
    ) {
      dayDiv.style.color = "var(--gris-oscuro)";
    }
  
    dayDiv.addEventListener('click', () => {
      showDayModal(year, monthIndex, day, mmdd);
    });
    container.appendChild(dayDiv);
  }
}
  
function generateMonthInfo(year, monthIndex, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const relevantDays = [];
  for (let day = 1; day <= totalDays; day++) {
    const mmdd = `${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    let desc = "";
    if (fallaDays.includes(mmdd)) {
      desc = "Falla";
      if (specialEvents[mmdd]) desc += ` – ${specialEvents[mmdd]}`;
      if (namedHolidays[mmdd]) desc += ` (Festivo: ${namedHolidays[mmdd]})`;
      relevantDays.push({ day, text: `${day}: ${desc}` });
    } else if (specialEvents[mmdd]) {
      desc = specialEvents[mmdd];
      if (namedHolidays[mmdd]) desc += ` (Festivo: ${namedHolidays[mmdd]})`;
      relevantDays.push({ day, text: `${day}: ${desc}` });
    } else if (namedHolidays[mmdd]) {
      desc = namedHolidays[mmdd];
      relevantDays.push({ day, text: `${day}: ${desc}` });
    }
  }
  relevantDays.sort((a, b) => a.day - b.day);
  relevantDays.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.text;
    container.appendChild(li);
  });
}

/* ---------- Funciones para Modales ---------- */
function initModalEvents() {
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) modal.classList.remove('active');
    });
  });
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });
}
  
function showDayModal(year, monthIndex, day, mmdd) {
  currentDayEvent = { year, monthIndex, day };
  const modalMessage = document.getElementById('day-modal-message');
  let message = `Fecha: ${day} de ${monthNames[monthIndex]}.`;
  if (fallaDays.includes(mmdd)) {
    message += " Evento: Falla";
    if (specialEvents[mmdd]) message += ` – ${specialEvents[mmdd]}`;
    if (namedHolidays[mmdd]) message += ` (Festivo: ${namedHolidays[mmdd]})`;
  } else if (specialEvents[mmdd]) {
    message += ` Evento: ${specialEvents[mmdd]}`;
    if (namedHolidays[mmdd]) message += ` (Festivo: ${namedHolidays[mmdd]})`;
  } else if (namedHolidays[mmdd]) {
    message += ` Festivo: ${namedHolidays[mmdd]}`;
  }
  message += " Al hacer clic en Aceptar, se descargará un archivo .ics para agregar el evento a tu calendario.";
  modalMessage.textContent = message;
  document.getElementById('day-modal').classList.add('active');
}
  
function hideDayModal() {
  document.getElementById('day-modal').classList.remove('active');
}

/* ---------- Funciones para .ics ---------- */
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
  
function formatDateICS(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/* ---------- Draggable Modal ---------- */
/**
 * Permite mover (draggable) el modal de día.
 */
function makeDraggable(modalElement) {
  let isDragging = false;
  let offsetX = 0, offsetY = 0;
  
  modalElement.addEventListener('mousedown', function(e) {
    isDragging = true;
    modalElement.style.transform = "none"; // Remover transform para usar coordenadas absolutas
    const rect = modalElement.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  });
  
  document.addEventListener('mousemove', function(e) {
    if (isDragging) {
      modalElement.style.left = (e.clientX - offsetX) + "px";
      modalElement.style.top = (e.clientY - offsetY) + "px";
    }
  });
  
  document.addEventListener('mouseup', function() {
    isDragging = false;
  });
}

/* ---------- Variable Global ---------- */
let currentDayEvent = null;