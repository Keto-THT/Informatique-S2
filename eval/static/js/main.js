const contexte = document.getElementById("context");
const userId = parseInt(contexte.dataset.userId);    // id de l'utilisateur connecté
const roomId = parseInt(contexte.dataset.roomId);    // id de la room courante


const ws = new WebSocket(`ws://localhost:8000/ws/${roomId}/${userId}`);

//ouverture de la connexion Websocket
ws.onopen = () => {
    console.log("WebSocket connecté ✅");
};

// on ferme l'onglet
ws.onclose = () => {
    console.log("WebSocket déconnecté ❌");
};


ws.onerror = (erreur) => {
    console.error("Erreur WebSocket :", erreur);// Événement déclenché en cas d'erreur
};


//réception des messages du serveur
ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);// Le serveur envoie du JSON (texte) -> on le convertit en objet JS    
    afficherMessage(msg);// On crée la bulle de message et on l'ajoute au DOM
    scrollerEnBas();    // On scrolle automatiquement vers le bas pour voir le dernier message
};


function afficherMessage(msg) {
    const container = document.getElementById("messages-container");
    const bulle = document.createElement("div");  // On crée un div pour la bulle  
    const estMoi = msg.send_by === userId;
    bulle.classList.add("message", estMoi ? "envoye" : "recu");   // La classe CSS dépend de si c'est moi ou quelqu'un d'autre


    const date = new Date(msg.send_on);
    const heure = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    // On formate l'heure à partir de la date ISO reçue du serveur

    // On construit le HTML intérieur de la bulle
    bulle.innerHTML = `
        <p>${msg.content}</p>
        <span class="heure">${heure}</span>
        ${estMoi ? `<span class="lecture">${msg.message_read ? "✓✓" : "✓"}</span>` : ""}
    `;

    // On supprime le message "Aucun message" s'il est encore affiché
    const vide = container.querySelector(".vide");
    if (vide) vide.remove();

    container.appendChild(bulle);
}


// envoie d'un message
function envoyerMessage() {
    const input = document.getElementById("message-input");
    const contenu = input.value.trim();
    if (!contenu) return; // On n'envoie pas si le champ est vide
    ws.send(contenu);// On envoie le texte au serveur via WebSocket
    input.value = "";// On vide le champ de saisie
}


document.getElementById("message-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") envoyerMessage(); // Permettre l'envoi avec la touche Entrée
});


//utilisateur 

function scrollerEnBas() {
    const container = document.getElementById("messages-container");
    container.scrollTop = container.scrollHeight;
}

scrollerEnBas();