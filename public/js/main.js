document.addEventListener("DOMContentLoaded", () => {
  const ticketsInput = document.getElementById("tickets");
  const amountInput = document.getElementById("amount");
  const prizeSpan = document.getElementById("prizeAmount");
  const ticketError = document.getElementById("ticketError");

  const ticketsSold = parseInt(document.getElementById("ticketsSold").value);
  const userTickets = parseInt(document.getElementById("userTickets").value);

  // 🎟 Ticket validation
  ticketsInput.addEventListener("input", () => {
    let tickets = parseInt(ticketsInput.value) || 0;

    if (tickets > 5 || userTickets + tickets > 5 || ticketsSold + tickets > 80) {
      ticketError.classList.remove("d-none");
      ticketsInput.value = Math.min(5, 80 - ticketsSold);
    } else {
      ticketError.classList.add("d-none");
    }
  });

  // 💰 Prize calculation
  amountInput.addEventListener("input", () => {
    const amount = parseInt(amountInput.value) || 0;

    if (amount >= 1 && amount <= 100) {
      prizeSpan.innerText = amount * 70;
    } else {
      prizeSpan.innerText = 0;
    }
  });
});
