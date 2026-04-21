const contexte = document.getElementById("context");
const userId = parseInt(contexte.dataset.userId);
const roomId = parseInt(contexte.dataset.roomId);

const ws = new WebSocket(`ws://localhost:8000/ws/${roomId}/${userId}`);

ws.onopen = () => {
    console.log("WebSocket connecté ✅");
    // Marque les messages existants comme lus dès l'ouverture
    fetch(`/rooms/${roomId}/read/${userId}`, { method: "POST" });
};

ws.onclose = () => console.log("WebSocket déconnecté ❌");
ws.onerror = (e) => console.error("Erreur WebSocket :", e);

ws.onmessage = (event) => {
    const payload = JSON.parse(event.data);

    if (payload.type === "message") {
        afficherMessage(payload);
        scrollerEnBas();
        // Si le message vient de quelqu'un d'autre, envoyer un accusé de lecture
        if (payload.send_by !== userId) {
            ws.send(JSON.stringify({ type: "read", message_id: payload.id }));
        }
    } else if (payload.type === "read_receipt") {
        marquerLu(payload.message_id);
    }
};


function afficherMessage(msg) {
    const container = document.getElementById("messages-container");
    const bulle = document.createElement("div");
    const estMoi = msg.send_by === userId;
    bulle.classList.add("message", estMoi ? "envoye" : "recu");
    if (estMoi) bulle.dataset.messageId = msg.id;

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

function marquerLu(messageId) {
    const bulle = document.querySelector(`[data-message-id="${messageId}"]`);
    if (bulle) {
        const lecture = bulle.querySelector(".lecture");
        if (lecture) lecture.textContent = "✓✓";
    }
}

function envoyerMessage() {
    const input = document.getElementById("message-input");
    const contenu = input.value.trim();
    if (!contenu) return;
    ws.send(JSON.stringify({ type: "message", content: contenu }));
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
