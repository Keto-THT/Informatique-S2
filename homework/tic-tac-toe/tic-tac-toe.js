document.addEventListener("DOMContentLoaded", () => {
    initialCleanup();
    
    
    document.getElementById("reset").addEventListener("click", resetGrid);
    
    function createGrid() {
        const grid = document.getElementById("grid");
        for (let i = 0; i < 3; i++) {
        const row = document.createElement("div");
        row.classList.add("row");
        for (let j = 0; j < 3; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.row = i;
            cell.dataset.col = j;
            row.appendChild(cell);
        }
        grid.appendChild(row);
        }
    }


    function resetGrid() {
        const cells = document.querySelectorAll(".cell");
        cells.forEach((cell) => {
        cell.textContent = "";
        });
        }

    function checkWin(player) {
        const cells = document.querySelectorAll(".cell");
        const board = Array.from(cells).reduce((acc, cell) => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        if (!acc[row]) acc[row] = [];
        acc[row][col] = cell.textContent;
        return acc;
        }, []);
            
        // Check rows, columns, and diagonals
        for (let i = 0; i < 3; i++) {
        if (board[i].every((cell) => cell === player)) return true;
        if (board.every((row) => row[i] === player)) return true;
        }
        if (board[0][0] === player && board[1][1] === player && board[2][2] === player) return true;
        if (board[0][2] === player && board[1][1] === player && board[2][0] === player) return true;
        
        return false;
    }



    function initialCleanup() {
        const nodesToRemove = [];
        document.getElementById("grid").childNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            nodesToRemove.push(node);
        }
        });
        for (const node of nodesToRemove) {
        node.remove();
        }
    }
);
