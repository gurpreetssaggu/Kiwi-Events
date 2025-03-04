document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("saveEventButton")) {
        console.log("Creating event page detected.");
        setupCreateEvent();
    }

    if (document.getElementById("eventsList")) {
        console.log("Events list page detected.");
        setupSortOptions();
        fetchAndDisplayEvents();
    }

    if (document.getElementById("savedEventsList")) {
        console.log("Saved events page detected.");
        displaySavedEvents();
    }
});

function setupCreateEvent() {
    const saveEventButton = document.getElementById("saveEventButton");
    if (!saveEventButton) {
        console.error("Save Event button not found!");
        return;
    }

    saveEventButton.addEventListener("click", async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) {
            alert("You must be logged in to create an event.");
            return;
        }

        const formData = new FormData(document.getElementById("createEventForm"));

        try {
            const response = await fetch("http://localhost:5001/api/events", {
                method: "POST",
                headers: { "Authorization": "Bearer " + token },
                body: formData,
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "An error occurred.");

            alert("Event created successfully!");
            window.location.href = "events.html";
        } catch (error) {
            alert("Error: " + error.message);
            console.error("Event Creation Error:", error);
        }
    });
}

function setupSortOptions() {
    const dropdownItems = document.querySelectorAll(".dropdown-item[data-sort]");
    dropdownItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const sortBy = item.getAttribute("data-sort");

            // Check if sorting by category or city and display a secondary dropdown
            if (sortBy === "category" || sortBy === "city") {
                showSecondarySortDropdown(sortBy);
            } else {
                fetchAndDisplayEvents(sortBy);
            }
        });
    });

    document.getElementById("eventSearch").addEventListener("input", function () {
        const searchTerm = this.value.toLowerCase();
        document.querySelectorAll("#eventsList .card").forEach(card => {
            const title = card.querySelector(".card-title").textContent.toLowerCase();
            card.style.display = title.includes(searchTerm) ? "block" : "none";
        });
    });
}

function showSecondarySortDropdown(sortBy) {
    const secondaryDropdownContainer = document.getElementById("secondarySortContainer");
    if (!secondaryDropdownContainer) {
        console.error("Secondary sort container not found.");
        return;
    }

    fetch("http://localhost:5001/api/events")
        .then(response => response.json())
        .then(events => {
            let uniqueValues = [...new Set(events.map(event => event[sortBy]))].sort();

            secondaryDropdownContainer.innerHTML = `
                <div class="dropdown mt-2">
                    <button class="btn btn-secondary dropdown-toggle" type="button" id="secondarySortDropdown" data-bs-toggle="dropdown">
                        Select ${sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                    </button>
                    <ul class="dropdown-menu" aria-labelledby="secondarySortDropdown">
                        ${uniqueValues.map(value => `<li><a class="dropdown-item" href="#" data-filter="${value}">${value}</a></li>`).join('')}
                    </ul>
                </div>
            `;

            document.querySelectorAll(".dropdown-item[data-filter]").forEach(item => {
                item.addEventListener("click", (e) => {
                    e.preventDefault();
                    fetchAndDisplayEvents(sortBy, item.getAttribute("data-filter"));
                });
            });
        })
        .catch(error => console.error("Error fetching events:", error));
}

async function fetchAndDisplayEvents(sortBy = "name", filterValue = null) {
    try {
        const eventList = document.getElementById("eventsList");
        if (!eventList) {
            console.error("Element 'eventsList' not found in DOM.");
            return;
        }
        eventList.innerHTML = "";

        const response = await fetch("http://localhost:5001/api/events");
        if (!response.ok) throw new Error("Failed to fetch events");

        let events = await response.json();

        populateDropdowns(events); // Populate category & city filters dynamically

        events = sortAndFilterEvents(events, sortBy, filterValue);

        eventList.innerHTML = events.map(event => `
            <div class="col-lg-4 col-md-6">
                <div class="card shadow-sm border-0 rounded-lg event-card" data-id="${event._id}">
                    <img src="${event.image ? event.image : 'https://via.placeholder.com/400x200'}" class="card-img-top" alt="${event.title}">
                    <div class="card-body">
                        <h5 class="card-title">${event.title}</h5>
                        <p class="text-muted"><strong>Date:</strong> ${formatDate(event.date)}</p>
                        <p class="text-muted"><strong>City:</strong> ${event.city}</p>
                    </div>
                </div>
            </div>
        `).join('');

        // Attach event listeners to event cards to open the modal
        document.querySelectorAll(".event-card").forEach(card => {
            card.addEventListener("click", function () {
                const eventId = this.getAttribute("data-id");
                const event = events.find(e => e._id === eventId);
                if (event) {
                    showEventDetailsModal(event);
                }
            });
        });

    } catch (error) {
        console.error("Error loading events:", error);
    }
}




function sortAndFilterEvents(events, sortBy, filterValue) {
    if (filterValue) {
        events = events.filter(event => event[sortBy] === filterValue);
    }

    if (sortBy === "name") {
        events.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "date") {
        events.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === "category") {
        events.sort((a, b) => a.category.localeCompare(b.category));
    } else if (sortBy === "city") {
        events.sort((a, b) => a.city.localeCompare(b.city));
    }

    return events;
}

function populateDropdowns(events) {
    const categoryFilter = document.getElementById("filter-category");
    const cityFilter = document.getElementById("filter-city");

    if (!categoryFilter || !cityFilter) return;

    const categories = [...new Set(events.map(event => event.category))].sort();
    const cities = [...new Set(events.map(event => event.city))].sort();

    categoryFilter.innerHTML = `<option value="">All Categories</option>`;
    cityFilter.innerHTML = `<option value="">All Cities</option>`;

    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });

    cities.forEach(city => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        cityFilter.appendChild(option);
    });
}

async function deleteEvent(eventId) {
    const token = localStorage.getItem('token');
    if (!token) {
        Swal.fire({
            icon: 'error',
            title: 'Unauthorized',
            text: 'You must be logged in to delete an event.',
            confirmButtonColor: '#d33'
        });
        return;
    }

    // Show confirmation popup before deleting
    const result = await Swal.fire({
        title: "Are you sure?",
        text: "This action cannot be undone!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
        animation: true
    });

    if (!result.isConfirmed) {
        return; // Exit function if user cancels
    }

    try {
        const response = await fetch(`http://localhost:5001/api/events/${eventId}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token },
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "An error occurred.");

        Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'The event has been removed successfully.',
            confirmButtonColor: '#28a745',
            timer: 2000,
            showConfirmButton: false
        });

        fetchAndDisplayEvents(); // Refresh the events list
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            confirmButtonColor: '#d33'
        });
        console.error("Event Deletion Error:", error);
    }
}




function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function generateGoogleCalendarLink(event) {
    const startDate = new Date(event.date).toISOString().replace(/-|:|\.\d+/g, '');
    const endDate = new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, '');
    const details = encodeURIComponent(`${event.description}\n\nCategory: ${event.category}\nCity: ${event.city}`);
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}/${endDate}&details=${details}&location=${encodeURIComponent(event.city)}`;
}

function generateGoogleMapsLink(event) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.city)}`;
}

// New functions for saving events
function toggleSaveEvent(eventId) {
    let savedEvents = JSON.parse(localStorage.getItem('savedEvents')) || [];
    if (savedEvents.includes(eventId)) {
        savedEvents = savedEvents.filter(id => id !== eventId);
    } else {
        savedEvents.push(eventId);
    }
    localStorage.setItem('savedEvents', JSON.stringify(savedEvents));
    fetchAndDisplayEvents(); // Refresh the events list to update the heart icon
}

function isEventSaved(eventId) {
    const savedEvents = JSON.parse(localStorage.getItem('savedEvents')) || [];
    return savedEvents.includes(eventId);
}

function displaySavedEvents() {
    const savedEventsList = document.getElementById("savedEventsList");
    if (!savedEventsList) return;

    const savedEvents = JSON.parse(localStorage.getItem('savedEvents')) || [];
    if (savedEvents.length === 0) {
        savedEventsList.innerHTML = "<p>No saved events found.</p>";
        return;
    }

    fetch("http://localhost:5001/api/events")
        .then(response => response.json())
        .then(events => {
            const savedEventsData = events.filter(event => savedEvents.includes(event._id));
            savedEventsList.innerHTML = savedEventsData.map(event => `
                <div class="col-lg-4 col-md-6">
                    <div class="card shadow-sm border-0 rounded-lg">
                        <img src="${event.image ? 'uploads/' + event.image : 'https://via.placeholder.com/400x200'}" class="card-img-top" alt="${event.title}">
                        <div class="card-body">
                            <h5 class="card-title">${event.title}</h5>
                            <p class="card-text">${event.description}</p>
                            <p class="text-muted"><strong>Date:</strong> ${formatDate(event.date)}</p>
                            <p class="text-muted"><strong>Category:</strong> ${event.category}</p>
                            <p class="text-muted"><strong>City:</strong> ${event.city}</p>
                            <div class="d-grid gap-2 d-md-flex justify-content-md-end mt-3">
                                <a href="${generateGoogleCalendarLink(event)}" target="_blank" class="btn btn-primary btn-sm me-md-2">
                                    <i class="bi bi-calendar-plus"></i> Add to Calendar
                                </a>
                                <a href="${generateGoogleMapsLink(event)}" target="_blank" class="btn btn-success btn-sm me-md-2">
                                    <i class="bi bi-geo-alt"></i> Get Directions
                                </a>
                                <button class="btn btn-outline-danger btn-sm" onclick="toggleSaveEvent('${event._id}')">
                                    <i class="bi bi-heart-fill"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        })
        .catch(error => console.error("Error fetching saved events:", error));
}

// Function to show event details in modal
function showEventDetailsModal(event) {
    const modalEventImage = document.getElementById("modalEventImage");
    const modalEventTitle = document.getElementById("modalEventTitle");
    const modalEventDescription = document.getElementById("modalEventDescription");
    const modalEventDate = document.getElementById("modalEventDate");
    const modalEventCategory = document.getElementById("modalEventCategory");
    const modalEventCity = document.getElementById("modalEventCity");
    const modalAddToCalendar = document.getElementById("modalAddToCalendar");
    const modalGetDirections = document.getElementById("modalGetDirections");
    const modalDeleteEvent = document.getElementById("modalDeleteEvent");
    const modalToggleSaveEvent = document.getElementById("modalToggleSaveEvent");

    // Set modal content
    modalEventImage.src = event.image ? event.image : 'https://via.placeholder.com/400x200';
    modalEventTitle.textContent = event.title;
    modalEventDescription.textContent = event.description;
    modalEventDate.textContent = `Date: ${formatDate(event.date)}`;
    modalEventCategory.textContent = `Category: ${event.category}`;
    modalEventCity.textContent = `City: ${event.city}`;
    modalAddToCalendar.href = generateGoogleCalendarLink(event);
    modalGetDirections.href = generateGoogleMapsLink(event);

    // Show delete button only if the user is logged in
    if (localStorage.getItem('token')) {
        modalDeleteEvent.style.display = 'inline-block';
        modalDeleteEvent.onclick = () => deleteEvent(event._id);
    } else {
        modalDeleteEvent.style.display = 'none';
    }

    // Update like (save) button state
    modalToggleSaveEvent.innerHTML = `<i class="bi bi-heart${isEventSaved(event._id) ? '-fill' : ''}"></i>`;
    modalToggleSaveEvent.onclick = () => {
        toggleSaveEvent(event._id);
        modalToggleSaveEvent.innerHTML = `<i class="bi bi-heart${isEventSaved(event._id) ? '-fill' : ''}"></i>`;
    };

    // Show the modal
    const eventDetailsModal = new bootstrap.Modal(document.getElementById('eventDetailsModal'));
    eventDetailsModal.show();
}


