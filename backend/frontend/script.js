document.addEventListener("DOMContentLoaded", () => {

  function ok() {
    const resultsElt = document.getElementById("results");
    resultsElt.classList.add("ok");
    resultsElt.classList.remove("ko");
  }

  function ko() {
    const resultsElt = document.getElementById("results");
    resultsElt.classList.add("ko");
    resultsElt.classList.remove("ok");
  }

  function fetchData(endpoint) {
    const apiUrl = document.getElementById("apiUrl").value;
    if (!apiUrl) {
      alert("Veuillez entrer l'URL de l'API.");
      ko();
      return;
    }

    const fetchUrl = `${apiUrl}${endpoint}`
    console.log(`using URL ${fetchUrl}`)
    fetch(fetchUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Réponse réseau non ok.");
          ko();
        }
        return response.json();
      })
      .then((data) => {
        document.getElementById("results").textContent = JSON.stringify(
          data,
          null,
          2
        );
        ok();
      })
      .catch((error) => {
        console.error("Erreur de fetch:", error);
        ko();
      })
  }

  function fetchDataWithId(endpoint, idFieldId, suffix = "") {
    const apiUrl = document.getElementById("apiUrl").value;
    const itemId = document.getElementById(idFieldId).value;
    if (!apiUrl) {
      alert("Veuillez entrer l'URL de l'API.");
      ko();
      return;
    }
    if (!itemId) {
      alert("Veuillez entrer un ID.");
      ko();
      return;
    }

    const fetchUrl = `${apiUrl}${endpoint}${itemId}${suffix}`
    console.log(`using URL ${fetchUrl}`)
    fetch(fetchUrl)
      .then((response) => {
        if (! response.ok) {
          throw new Error(`Réponse réseau non ok: ${response.status}`);
          ko();
        }
        return response.json();
      })
      .then((data) => {
        document.getElementById("results").textContent = JSON.stringify(
          data,
          null,
          2
        );
        ok();
      })
      .catch((error) => {
        console.error("Erreur de fetch:", error);
        ko();
      })
  }

  function refreshAlive(event) {
    const apiUrl = document.getElementById("apiUrl").value;
    const aliveUrl = `${apiUrl}/api/alive`;
    console.log(`checking ${aliveUrl}`);
    const aliveStatusElement = document.getElementById("aliveStatus");
    const aliveArea = document.getElementById("alive");
    const isAlive = () => {
      aliveStatusElement.textContent = "✅";
      aliveArea.classList.add("ok");
      aliveArea.classList.remove("ko");
    };
    const isDead = () => {
      aliveStatusElement.textContent = "❌";
      aliveArea.classList.add("ko");
      aliveArea.classList.remove("ok");
    };
    aliveStatusElement.textContent = "⏳";
    fetch(aliveUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Réponse réseau non ok.");
          isDead();
        }
        return response.json();
      })
      .then((data) => {
        if (data.message === "Alive") {
          isAlive();
        } else {
          console.error("Erreur de fetch:", data);
          isDead();
        }
      })
      .catch((error) => {
        isDead();
      });
  }

  document.getElementById("apiUrl").addEventListener("change", refreshAlive);
  document.getElementById("check-connect").addEventListener("click", refreshAlive);
  document
    .getElementById("listAssoc")
    .addEventListener("click", () => fetchData("/api/associations"));
  document
    .getElementById("listEvent")
    .addEventListener("click", () => fetchData("/api/evenements"));
  document
    .getElementById("detailAssoc")
    .addEventListener("click", () => fetchDataWithId('/api/association/', 'itemId'));
  document
    .getElementById("detailEvent")
    .addEventListener("click", () => fetchDataWithId('/api/evenement/', 'itemId'));
  document
    .getElementById("assocEvents")
    .addEventListener("click", () => fetchDataWithId('/api/association/', 'itemId', '/evenements'));

  refreshAlive();
});
