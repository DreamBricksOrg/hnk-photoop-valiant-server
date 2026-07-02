document.addEventListener("DOMContentLoaded", function () {
    var continueLink = document.getElementById("continue-link");
    var ageCheck = document.getElementById("age-check");
    var termsCheck = document.getElementById("terms-check");
    var warningToggle = document.getElementById("warning-modal-toggle");

    continueLink.addEventListener("click", function (event) {
        if (!ageCheck.checked || !termsCheck.checked) {
            event.preventDefault();
            warningToggle.checked = true;
        }
    });
});
