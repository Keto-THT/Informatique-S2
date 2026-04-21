const contexte = document.getElementById("context");
const userId = parseInt(contexte.dataset.userId);    // id de l'utilisateur connecté
const roomId = parseInt(contexte.dataset.roomId);    // id de la room courante


const ws = new WebSocket(`ws://localhost:8000/ws/${roomId}/${userId}`);

ws.onopen = () => {
    console.log("WebSocket connecté ✅");
};

ws.onclose = () => {
    console.log("WebSocket déconnecté ❌");
};

ws.onerror = (erreur) => {
    console.error("Erreur WebSocket :", erreur);
};

ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    afficherMessage(msg);
    scrollerEnBas();
};


function afficherMessage(msg) {
    const container = document.getElementById("messages-container");
    const bulle = document.createElement("div");
    const estMoi = msg.send_by === userId;
    bulle.classList.add("message", estMoi ? "envoye" : "recu");

    const date = new Date(msg.send_on);
    const heure = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    bulle.innerHTML = `
        <p>${msg.content}</p>
        <span class="heure">${heure}</span>
        ${estMoi ? `<span class="lecture">${msg.message_read ? "✓✓" : "✓"}</span>` : ""}
    `;

    const vide = container.querySelector(".vide");
    if (vide) vide.remove();

    container.appendChild(bulle);
}


function envoyerMessage() {
    const input = document.getElementById("message-input");
    const contenu = input.value.trim();
    if (!contenu) return;
    ws.send(contenu);
    input.value = "";
}


document.getElementById("message-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") envoyerMessage();
});


function scrollerEnBas() {
    const container = document.getElementById("messages-container");
    container.scrollTop = container.scrollHeight;
}

scrollerEnBas();


// Affichage des utilisateurs en ligne (polling toutes les 5 secondes)
async function mettreAJourEnLigne() {
    try {
        const res = await fetch(`/rooms/${roomId}/online`);
        const data = await res.json();
        const noms = data.online.map(u => u.name).join(", ");
        document.getElementById("online-list").textContent = noms || "Personne";
    } catch (e) {
        console.error("Erreur récupération utilisateurs en ligne :", e);
    }
}

mettreAJourEnLigne();
setInterval(mettreAJourEnLigne, 5000);
