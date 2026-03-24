document.addEventListener("DOMContentLoaded", () => {
  initialCleanup();

  const grid = document.getElementById("grid");
  const allCells = document.querySelectorAll("#grid div");

  function updateStats() {
    const totalSquares = document.querySelectorAll("#grid div").length;
    const clickedSquares = document.querySelectorAll("#grid div[style*='background-color: blue']").length;
    const blueSquares = document.querySelectorAll("#grid div[classList.contains*='hovered' or style*='background-color: blue]").length;
    const originalSquares = totalSquares - clickedSquares - blueSquares;

    document.getElementById("count-original").textContent = originalSquares;
    document.getElementById("count-clicked").textContent = clickedSquares;
    document.getElementById("count-blue").textContent = blueSquares;
    document.getElementById("count-total").textContent = totalSquares;
  }
 
  let original = 0, clicked = 0, blue = 0;

 

  document.getElementById("count-original").innerText = original;
  document.getElementById("count-clicked").innerText = clicked;
  document.getElementById("count-blue").innerText = blue;
  document.getElementById("count-total").innerText = allCells.length;
}
 //elt.classList.add/remove/contains/toggle 

  function addLine() {
    for (let i = 0; i < 10; i++) {
      const newbox = document.createElement("div");
      grid.appendChild(newbox);
      newbox.addEventListener("click", (event) => wasclicked(event.target));
      newbox.addEventListener("mouseover", (event) => washovered(event.target));
      newbox.addEventListener("mouseout", (event) => nolongerHovered(event.target));

      updateStats();
    }
  }

  document.getElementById("btn-add-line").addEventListener("click", addLine);

  function removeLine() {
    const allCells = grid.childNodes;
    if (allCells.length < 10) return; 

   
    const toRemove = [];
    for (let i = allCells.length - 1; i >= allCells.length - 10; i--) {
      toRemove.push(allCells[i]);
    }

    
    for (const node of toRemove) {
      node.remove();
    }

    updateStats(); // ← mise à jour après suppression
  }
  document.getElementById("btn-remove-line").addEventListener("click", removeLine);

  // colorer une case en bleu au clic
  // function wasclicked(element) {
  //   element.style.backgroundColor = "blue";
  //   updateStats();
  // }
  
  function wasclicked(element) {
    const currentColor = element.style.backgroundColor;
    if (currentColor === "blue") {
      element.style.backgroundColor = "lightcoral";
    } 
    else {
      element.style.backgroundColor = "blue";
    }
    updateStats();
  }
  

  // colorer une case en une couleur aléatoire au clic 
  // function wasclicked(element) {
  //   const randomColor = `rgb(${rand()}, ${rand()}, ${rand()})`;
  //   element.style.backgroundColor = randomColor;
  //   updateStats();

  // }

  function rand() {
    return Math.floor(Math.random() * 256);
  }

  function washovered(element) {
    element.classList.add("hovered");
  }

  function nolongerHovered(element) {
    element.classList.remove("hovered");
  }

  function addCallbackToAllCells() {
    for (const box of document.querySelectorAll("#grid div")) {
      box.addEventListener("click", (event) => wasclicked(event.target));
      box.addEventListener("mouseover", (event) => washovered(event.target));
      box.addEventListener("mouseout", (event) => nolongerHovered(event.target));
    }
  }

  addCallbackToAllCells();
  updateStats();

  

  // grid.addEventListener("mousedown", () => {
  //   isDragging = true;
  // });

  // grid.addEventListener("mouseup", () => {
  //   isDragging = false;
  // });
  let isDragging = false;
  grid.addEventListener("mousemove", (event) => {
    if (isDragging) {
      const target = event.target;
      if (target && target.tagName === "DIV") {
        wasclicked(target); // Simuler un clic sur la cellule survolée pendant le drag
      }
    }
  });

  


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
});

  