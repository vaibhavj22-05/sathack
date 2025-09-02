function showSection(sectionId) {
            document.querySelectorAll(".form-section")
                .forEach(sec => sec.style.display = "none");
            document.getElementById(sectionId).style.display = "block";
        }

        // Optional: toggle incoming/outgoing fields based on pickup address
        const pickupField = document.querySelector("textarea[name='pickup_address']");
        const warehouseAddress = ""; // replace with actual

        pickupField.addEventListener("input", () => {
            if(pickupField.value.trim() === warehouseAddress) {
                // outgoing
                document.getElementById("incoming-fields").style.display = "none";
                document.getElementById("incoming-fields-phone").style.display = "none";
                document.getElementById("outgoing-fields").style.display = "block";
                document.getElementById("outgoing-fields-phone").style.display = "block";
            } else {
                // incoming
                document.getElementById("incoming-fields").style.display = "block";
                document.getElementById("incoming-fields-phone").style.display = "block";
                document.getElementById("outgoing-fields").style.display = "none";
                document.getElementById("outgoing-fields-phone").style.display = "none";
            }
        });