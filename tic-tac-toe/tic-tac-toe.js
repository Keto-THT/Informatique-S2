
    
const grid = document.getElementById("grid");
const overlay = document.getElementById("overlay");
const winnerText = document.getElementById("winner-text");



// Joueur courant : "red" ou "blue" (rouge commence)
let currentPlayer = "red";

// Toutes les combinaisons gagnantes (indices des 9 cases 0..8)
const winningCombos = [
  [0,1,2],[3,4,5],[6,7,8], // lignes
  [0,3,6],[1,4,7],[2,5,8], // colonnes
  [0,4,8],[2,4,6]          // diagonales
];

function updateStats() {
  const cells = grid.querySelectorAll("div");
  let red = 0, blue = 0, empty = 0;
  for (const c of cells) {
    if (c.classList.contains("red")) red++;
    else if (c.classList.contains("blue")) blue++;
    else empty++;
  }
  document.getElementById("stat-red").textContent   = `🔴 Red: ${red}`;
  document.getElementById("stat-blue").textContent  = `🔵 Blue: ${blue}`;
  document.getElementById("stat-empty").textContent = `⬜ Empty: ${empty}`;
}

function checkWinner() {
  const cells = [...grid.querySelectorAll("div")];
  for (const combo of winningCombos) {
    const [a,b,c] = combo;
    if (cells[a].classList.contains("red") && cells[b].classList.contains("red") && cells[c].classList.contains("red")) {
      return "red";
    }
    if (cells[a].classList.contains("blue") && cells[b].classList.contains("blue") && cells[c].classList.contains("blue")) {
      return "blue";
    }
  }
  return null;
}

function wasClicked(cell, index) {
  // Ne pas modifier une case déjà marquée
  if (cell.classList.contains("red") || cell.classList.contains("blue")) return;

  // Marquer la case avec la couleur du joueur courant
  cell.classList.add(currentPlayer);
  updateStats(); // mettre à jour les compteurs visibles

  // Vérifier s'il y a un gagnant
  const winner = checkWinner();
  if (winner) {
    const name = winner === "red" ? "Red" : "Blue";
    // Affiche le gagnant (la couleur est appliquée via la classe `winnerText`)
    showWinner(name, winner);
    return;
  }

  // Vérifier l'égalité (toutes les cases remplies)
  const allFilled = [...grid.querySelectorAll("div")].every(c => c.classList.contains("red") || c.classList.contains("blue"));
  if (allFilled) {
    // En cas d'égalité, on affiche juste le message sans couleur
    showWinner("Égalité!", "");
    return;
  }

  // Aucun vainqueur ni égalité : basculer le joueur pour le prochain tour
  currentPlayer = currentPlayer === "red" ? "blue" : "red";
}

function showWinner(name, colorClass) {
  // Affiche le message du gagnant (ou d'égalité). La classe `colorClass`
  // permet d'appliquer la couleur (carré rouge/bleu via CSS ::before).
  winnerText.textContent = `${name} won !`;
  winnerText.className = colorClass;
  overlay.classList.remove("hidden");
}

function resetGame() {
  for (const cell of grid.querySelectorAll("div")) {
    cell.classList.remove("red", "blue");
  }
  overlay.classList.add("hidden");
  currentPlayer = "red";
  updateStats();
}

// Attacher les écouteurs de clic sur chaque case du plateau
const cells = Array.from(grid.querySelectorAll("div"));
cells.forEach((cell, idx) => cell.addEventListener("click", () => wasClicked(cell, idx)));

// Boutons de réinitialisation
document.getElementById("btn-reset").addEventListener("click", resetGame);
document.getElementById("btn-overlay-reset").addEventListener("click", resetGame);

// Initialiser l'affichage des compteurs
updateStats();
