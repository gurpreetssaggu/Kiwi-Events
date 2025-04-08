let allEvents = []; // ⬅️ Add this globally at the top of script.js


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
            const response = await fetch("/api/events", {


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

async function fetchAndDisplayEvents(sortBy = "name", filterValue = null) {
    console.log("🔥 fetchAndDisplayEvents START");
    try {
        const eventList = document.getElementById("eventsList");
        if (!eventList) {
            console.warn("⚠️ eventList container not found.");
            return;
        }

        eventList.innerHTML = "<div>Loading events...</div>";

        console.log("📡 Fetching events from /api/events");
        const response = await fetch("/api/events");
        console.log("📦 Response status:", response.status);

        if (!response.ok) {
            throw new Error("❌ Failed to fetch events. Status: " + response.status);
        }

        let events = await response.json();
        console.log("✅ Raw events fetched from backend:", events);

        allEvents = events;

        console.log("🧠 Filter value:", filterValue);
        if (!filterValue) {
            console.log("💥 Populating dropdowns with full event list");
            populateCategoryAndCityDropdowns(allEvents);
        }

        if (filterValue) {
            events = events.filter(event => event[sortBy] === filterValue);
            console.log(`🔍 Events after filtering by ${sortBy}:`, events);
        }

        if (sortBy === "name") {
            events.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortBy === "date") {
            events.sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        if (events.length === 0) {
            eventList.innerHTML = `<div class="text-center text-muted">No events found.</div>`;
            return;
        }

        eventList.innerHTML = events.map(event => `
            <div class="col-lg-4 col-md-6">
                <div class="card event-card shadow-sm" data-id="${event._id}">
                    <img src="${event.image ? '/uploads/' + event.image : 'https://via.placeholder.com/400x200'}" class="card-img-top" alt="${event.title}">
                    <div class="card-body">
                        <h5 class="card-title">${event.title}</h5>
                        <p class="text-muted"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                        <p class="text-muted"><strong>City:</strong> ${event.city}</p>
                    </div>
                </div>
            </div>
        `).join("");

        // 🧠 Attach modal click listeners
document.querySelectorAll(".event-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-id");
      const event = allEvents.find(e => e._id === id);
      if (event) showEventDetailsModal(event);
    });
  });
  

        console.log("✅ Events rendered on page");

    } catch (error) {
        console.error("❌ Error in fetchAndDisplayEvents:", error);
    }
}


function setupSortOptions() {
    const buttons = document.querySelectorAll(".btn-sort");

    if (!buttons.length) {
        console.warn("❌ No sort buttons found");
        return;
    }

    buttons.forEach(button => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            const sortBy = button.getAttribute("data-sort");

            document.querySelectorAll(".btn-sort").forEach(btn => {
                btn.classList.remove("active", "btn-primary");
                btn.classList.add("btn-outline-secondary");
            });

            button.classList.remove("btn-outline-secondary");
            button.classList.add("active", "btn-primary");

            console.log(`🟦 Button clicked for sorting: ${sortBy}`);
            fetchAndDisplayEvents(sortBy);
        });
    });

    // 🔥 Force fetch directly instead of simulating a click
    console.log("⚡ Directly calling fetchAndDisplayEvents('name')");
    fetchAndDisplayEvents("name");
}


function populateCategoryAndCityDropdowns(events) {
    const categoryDropdown = document.getElementById("categoryDropdown");
    const cityDropdown = document.getElementById("cityDropdown");

    if (!categoryDropdown || !cityDropdown) {
        console.warn("Dropdown elements not found");
        return;
    }

    // 🔥 Remove duplicates + filter out null/undefined
    const categories = [...new Set(events.map(e => e.category).filter(Boolean))].sort();
    const cities = [...new Set(events.map(e => e.city).filter(Boolean))].sort();

    console.log("✅ Categories:", categories);
    console.log("✅ Cities:", cities);

    // 🔁 Populate Category dropdown
    categoryDropdown.innerHTML = `
    <li><a class="dropdown-item fw-semibold text-primary" href="#" data-filter="" data-type="category">
        <i class="bi bi-arrow-counterclockwise me-1"></i> All Categories
    </a></li>
    ${categories.map(cat => `
        <li><a class="dropdown-item" href="#" data-filter="${cat}" data-type="category">${cat}</a></li>
    `).join("")}
`;

cityDropdown.innerHTML = `
    <li><a class="dropdown-item fw-semibold text-primary" href="#" data-filter="" data-type="city">
        <i class="bi bi-arrow-counterclockwise me-1"></i> All Cities
    </a></li>
    ${[...new Set(events.map(e => e.city).filter(Boolean))].sort().map(city => `
        <li><a class="dropdown-item" href="#" data-filter="${city}" data-type="city">${city}</a></li>
    `).join("")}
`;

    // 🔁 Populate City dropdown
    categoryDropdown.innerHTML = `
    <li><a class="dropdown-item fw-semibold text-primary" href="#" data-filter="" data-type="category">
        <i class="bi bi-arrow-counterclockwise me-1"></i> All Categories
    </a></li>
    ${[...new Set(events.map(e => e.category).filter(Boolean))].sort().map(cat => `
        <li><a class="dropdown-item" href="#" data-filter="${cat}" data-type="category">${cat}</a></li>
    `).join("")}
`;

    // 🧠 Attach filter logic
    document.querySelectorAll(".dropdown-item").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const value = item.getAttribute("data-filter");
            const type = item.getAttribute("data-type");
            fetchAndDisplayEvents(type, value); // ← This filters by selected value
        });
    });
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
        const response = await fetch(`/api/events/${eventId}`, {
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

    fetch("/api/events")
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

    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById("eventDetailsModal"));
    if (modal) modal.hide();

    // If we're on the saved-events page, refresh the list
    if (window.location.pathname.includes("saved-events.html")) {
        setTimeout(displaySavedEvents, 300); // short delay to ensure smooth UX
    }
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


document.addEventListener("DOMContentLoaded", () => {
    const eventList = document.getElementById("eventsList");
  
    if (eventList) {
      console.log("🔥 Events page detected.");
      setupSortOptions();
    } else {
      console.log("🟡 Not on events page — skipping eventList logic");
    }
  });
  
