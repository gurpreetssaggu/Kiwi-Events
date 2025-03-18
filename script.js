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
                    <img src="${event.image ? '/uploads/' + event.image : 'https://via.placeholder.com/400x200'}" class="card-img-top" alt="${event.title}">
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
                    <div class="card shadow-sm border-0 rounded-lg saved-event-card" data-id="${event._id}">
                       <img src="${event.image ? `/uploads/${event.image}` : 'https://via.placeholder.com/400x200'}" 
                        <div class="card-body">
                            <h5 class="card-title">${event.title}</h5>
                            <p class="text-muted"><strong>Date:</strong> ${formatDate(event.date)}</p>
                            <p class="text-muted"><strong>City:</strong> ${event.city}</p>
                        </div>
                    </div>
                </div>
            `).join('');

            // ✅ Attach event listeners to open modal for saved events
            document.querySelectorAll(".saved-event-card").forEach(card => {
                card.addEventListener("click", function () {
                    const eventId = this.getAttribute("data-id");
                    const event = savedEventsData.find(e => e._id === eventId);
                    if (event) {
                        showEventDetailsModal(event); // ✅ Reuse existing modal function
                    }
                });
            });
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
    const modalShareEvent = document.getElementById("modalShareEvent");

   // Set modal content
   modalEventImage.src = event.image ? `/uploads/${event.image}` : 'https://via.placeholder.com/400x200';
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

   // Update save button state
   modalToggleSaveEvent.innerHTML = `<i class="bi bi-heart${isEventSaved(event._id) ? '-fill' : ''}"></i>`;
   modalToggleSaveEvent.onclick = () => {
       toggleSaveEvent(event._id);
       modalToggleSaveEvent.innerHTML = `<i class="bi bi-heart${isEventSaved(event._id) ? '-fill' : ''}"></i>`;
   };

   // Add share button functionality
   modalShareEvent.onclick = () => {
       const shareLinks = generateShareLink(event);
       Swal.fire({
           title: "Share Event",
           text: "Choose a platform to share this event:",
           showCancelButton: true,
           confirmButtonText: "Copy Link",
           cancelButtonText: "Cancel",
           html: `
               <div class="d-flex flex-column gap-2">
                   <a href="${shareLinks.whatsapp}" target="_blank" class="btn btn-success">
                       <i class="bi bi-whatsapp"></i> WhatsApp
                   </a>
                   <a href="${shareLinks.facebook}" target="_blank" class="btn btn-primary">
                       <i class="bi bi-facebook"></i> Facebook
                   </a>
                   <a href="${shareLinks.twitter}" target="_blank" class="btn btn-info">
                       <i class="bi bi-twitter"></i> Twitter
                   </a>
                   <a href="${shareLinks.email}" target="_blank" class="btn btn-secondary">
                       <i class="bi bi-envelope"></i> Email
                   </a>
               </div>
           `
       }).then((result) => {
           if (result.isConfirmed) {
               navigator.clipboard.writeText(`${event.title} - ${window.location.origin}/events.html`);
               Swal.fire("Copied!", "Event link has been copied to clipboard.", "success");
           }
       });
   };

   // Show the modal with smooth animation
   const eventDetailsModal = new bootstrap.Modal(document.getElementById('eventDetailsModal'));
   eventDetailsModal.show();

   // Apply fade-in animation to buttons
   document.querySelectorAll(".modal-footer .btn").forEach(button => {
       button.style.animation = "fadeInButtons 0.5s ease-in-out";
   });
}
// Function to generate share links for different platforms
function generateShareLink(event) {
    const eventUrl = encodeURIComponent(window.location.origin + "/events.html");
    const eventTitle = encodeURIComponent(event.title);
    const eventDescription = encodeURIComponent(event.description);

    return {
        whatsapp: `https://api.whatsapp.com/send?text=${eventTitle}%20-%20${eventUrl}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${eventUrl}`,
        twitter: `https://twitter.com/intent/tweet?url=${eventUrl}&text=${eventTitle}`,
        email: `mailto:?subject=${eventTitle}&body=${eventDescription}%0A${eventUrl}`
    };
}

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const isAdmin = localStorage.getItem("isAdmin") === "true";

    const loginNav = document.getElementById("loginNav");
    const logoutNav = document.getElementById("logoutNav");
    const adminNav = document.getElementById("adminNav");

    // ✅ Control visibility of nav items
    if (token) {
        loginNav.style.display = "none";
        logoutNav.style.display = "block";

        // ✅ If user is admin, show admin panel link
        if (isAdmin) {
            adminNav.style.display = "block";
        } else {
            adminNav.style.display = "none";
        }
    } else {
        loginNav.style.display = "block";
        logoutNav.style.display = "none";
        adminNav.style.display = "none";
    }

    // ✅ Logout functionality with confirmation
    document.getElementById("logoutBtn")?.addEventListener("click", async () => {
        Swal.fire({
            title: "Are you sure you want to log out?",
            text: "You will need to log in again to access your account.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, Log Out",
            cancelButtonText: "Cancel"
        }).then((result) => {
            if (result.isConfirmed) {
                // ✅ Clear LocalStorage and redirect to login page
                localStorage.removeItem("token");
                localStorage.removeItem("userId");
                localStorage.removeItem("isAdmin");

                Swal.fire({
                    icon: "success",
                    title: "Logged Out!",
                    text: "You have been logged out successfully.",
                    timer: 1500,
                    showConfirmButton: false
                });

                setTimeout(() => window.location.href = "login.html", 1500);
            }
        });
    });
});

