from fastapi import WebSocket


class Broadcaster:
    def __init__(self):
        """
        Dictionnaire : room_id (int) → liste de WebSockets connectés
        Exemple : {1: [ws_keanu, ws_alice], 2: [ws_bob]}
        """
        self.rooms: dict[int, list[WebSocket]] = {}

    def connect(self, room_id: int, websocket: WebSocket):
        """Ajoute un WebSocket à la room donnée."""
        # Si la room n'existe pas encore dans le dictionnaire, on la crée
        if room_id not in self.rooms:
            self.rooms[room_id] = []
        # On ajoute la connexion de cet utilisateur à la room
        self.rooms[room_id].append(websocket)
        print(f"[Broadcaster] Connexion ajoutée → room {room_id} ({len(self.rooms[room_id])} connecté(s))")

    def disconnect(self, room_id: int, websocket: WebSocket):
        """Retire un WebSocket de la room quand l'utilisateur se déconnecte."""
        if room_id in self.rooms:
            self.rooms[room_id].remove(websocket)
            print(f"[Broadcaster] Connexion retirée → room {room_id} ({len(self.rooms[room_id])} connecté(s))")

    async def broadcast(self, room_id: int, message: str):
        """Envoie un message texte à tous les WebSockets connectés dans la room."""
        # Si personne n'est dans la room, rien à faire
        if room_id not in self.rooms:
            return

        # On parcourt tous les WebSockets de la room et on leur envoie le message
        for websocket in self.rooms[room_id]:
            await websocket.send_text(message)

        print(f"[Broadcaster] Message diffusé dans la room {room_id} : {message[:50]}")


broadcaster = Broadcaster()