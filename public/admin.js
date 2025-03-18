document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Unauthorized! Redirecting to login...");
        window.location.href = "login.html";
        return;
    }

    // ✅ Load Events
    async function loadEvents() {
        const response = await fetch("http://localhost:5001/api/events/all", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            console.error("❌ Failed to fetch events");
            return;
        }

        const events = await response.json();
        renderEvents(events);
    }

    // ✅ Render Events in Admin Panel
    function renderEvents(events) {
        const eventList = document.getElementById("adminEventList");
        eventList.innerHTML = "";

        events.forEach(event => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${event.title}</td>
                <td>${new Date(event.date).toLocaleDateString()}</td>
                <td>${event.category}</td>
                <td>${event.city}</td>
                <td>
                    <span class="badge ${event.isApproved ? 'bg-success' : 'bg-warning'}">
                        ${event.isApproved ? "Approved" : "Pending"}
                    </span>
                </td>
                <td>
                    ${
                        !event.isApproved
                            ? `<button class="btn approve-btn btn-primary btn-sm" data-id="${event._id}">Approve</button>`
                            : ''
                    }
                    <button class="btn edit-btn btn-warning btn-sm" data-id="${event._id}">Edit</button>
                    <button class="btn delete-btn btn-danger btn-sm" data-id="${event._id}">Delete</button>
                </td>
            `;
            eventList.appendChild(row);
        });
    }

    // ✅ Fix Event Delegation
    document.getElementById("adminEventList").addEventListener("click", async (e) => {
        const target = e.target.closest("button");
        if (!target) return;

        const eventId = target.getAttribute("data-id");
        if (!eventId) {
            console.error("❌ Missing Event ID");
            return;
        }

        if (target.classList.contains("approve-btn")) {
            await approveEvent(eventId);
        } else if (target.classList.contains("edit-btn")) {
            await openEditModal(eventId);
        } else if (target.classList.contains("delete-btn")) {
            await deleteEvent(eventId);
        }
    });

    // ✅ Approve Event
    async function approveEvent(eventId) {
        try {
            const response = await fetch(`http://localhost:5001/api/events/approve/${eventId}`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                Swal.fire("Success!", "Event approved successfully!", "success");
                loadEvents(); // Refresh events after approval
            } else {
                Swal.fire("Error", "Failed to approve event", "error");
            }
        } catch (error) {
            console.error("❌ Error approving event:", error);
            Swal.fire("Error", "Something went wrong", "error");
        }
    }

    // ✅ Open Edit Modal with Dropdowns
    async function openEditModal(eventId) {
        const response = await fetch(`http://localhost:5001/api/events/${eventId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            console.error(`❌ Failed to fetch event: ${response.status}`);
            Swal.fire("Error", "Event not found", "error");
            return;
        }

        const event = await response.json();

        // ✅ Define Dropdown Options
        const categories = ["Music", "Art", "Exhibition", "Entertainment", "Conference", "Others"];
        const cities = ["Toronto", "Mississauga", "Brampton", "Markham", "Vaughan", "Oakville", "Burlington", "Ajax", "Pickering"];

        Swal.fire({
            title: "Edit Event",
            html: `
                <input type="text" id="editTitle" class="swal2-input" value="${event.title || ''}">
                <input type="date" id="editDate" class="swal2-input" value="${event.date?.split('T')[0] || ''}">
                <input type="time" id="editTime" class="swal2-input" value="${event.time || ''}">

                <select id="editCategory" class="swal2-select">
                    ${categories.map(category =>
                        `<option value="${category}" ${event.category === category ? "selected" : ""}>${category}</option>`
                    ).join('')}
                </select>

                <select id="editCity" class="swal2-select">
                    ${cities.map(city =>
                        `<option value="${city}" ${event.city === city ? "selected" : ""}>${city}</option>`
                    ).join('')}
                </select>

                <textarea id="editDescription" class="swal2-textarea">${event.description || ''}</textarea>
            `,
            showCancelButton: true,
            confirmButtonText: "Update",
            preConfirm: () => {
                return {
                    title: document.getElementById("editTitle").value,
                    date: document.getElementById("editDate").value,
                    time: document.getElementById("editTime").value,
                    category: document.getElementById("editCategory").value,
                    city: document.getElementById("editCity").value,
                    description: document.getElementById("editDescription").value
                };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                await updateEvent(eventId, result.value);
            }
        });
    }

    // ✅ Update Event
    async function updateEvent(eventId, updatedData) {
        const response = await fetch(`http://localhost:5001/api/events/${eventId}`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            Swal.fire("Updated!", "Event updated successfully.", "success");
            loadEvents();
        } else {
            Swal.fire("Error", "Failed to update event", "error");
        }
    }

    // ✅ Fancy Delete Event
    async function deleteEvent(eventId) {
        Swal.fire({
            title: "Are you sure?",
            text: "This action cannot be undone!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
            customClass: {
                confirmButton: 'btn btn-danger delete-btn',
                cancelButton: 'btn btn-secondary'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`http://localhost:5001/api/events/${eventId}`, {
                        method: "DELETE",
                        headers: { "Authorization": `Bearer ${token}` }
                    });

                    if (response.ok) {
                        loadEvents(); // Reload events after deletion
                        Swal.fire("Deleted!", "Event has been deleted.", "success");
                    }
                } catch (error) {
                    console.error("❌ Error deleting event:", error);
                    Swal.fire("Error", "Something went wrong", "error");
                }
            }
        });
    }

    // ✅ Fancy Logout Confirmation
    document.getElementById("logoutBtn").addEventListener("click", () => {
        Swal.fire({
            title: "Are you sure you want to log out?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Log Out",
            cancelButtonText: "Cancel",
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.clear();
                window.location.href = "login.html";
            }
        });
    });

    loadEvents();
});
