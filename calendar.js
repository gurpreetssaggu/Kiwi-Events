document.addEventListener('DOMContentLoaded', async () => {
    console.log("✅ FullCalendar Loaded:", FullCalendar);

    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        console.error("❌ Calendar element not found");
        return;
    }

    const events = await fetchEvents();

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        events: events,
        eventClick: (info) => {
            console.log("✅ Event clicked:", info.event.extendedProps);
            showEventDetailsModal(info.event.extendedProps);
        }
    });

    calendar.render();
});

async function fetchEvents() {
    try {
        const response = await fetch('/api/events');
        if (!response.ok) throw new Error("Failed to fetch events");

        const events = await response.json();
        console.log("✅ Fetched events:", events);

        return events.map(event => ({
            id: event._id,
            title: event.title,
            start: new Date(event.date),
            description: event.description,
            city: event.city,
            category: event.category,
            image: event.image ? `/uploads/${event.image}` : 'https://via.placeholder.com/400x200'
        }));
    } catch (error) {
        console.error("❌ Error loading events:", error);
        return [];
    }
}

function showEventDetailsModal(event) {
    document.getElementById("modalEventTitle").textContent = event.title;
    document.getElementById("modalEventDescription").textContent = event.description;
    document.getElementById("modalEventDate").textContent = `Date: ${new Date(event.start).toLocaleDateString()}`;
    document.getElementById("modalEventCategory").textContent = `Category: ${event.category}`;
    document.getElementById("modalEventCity").textContent = `City: ${event.city}`;

    const modal = new bootstrap.Modal(document.getElementById('eventDetailsModal'));
    modal.show();
}
