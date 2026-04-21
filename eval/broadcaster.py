from fastapi import WebSocket


class Broadcaster:
    def __init__(self):
        # room_id → liste de (user_id, websocket)
        self.rooms: dict[int, list[tuple[int, WebSocket]]] = {}

    def connect(self, room_id: int, user_id: int, websocket: WebSocket):
        # ajoute la connexion du websocket à la room
        if room_id not in self.rooms:
            self.rooms[room_id] = []
        self.rooms[room_id].append((user_id, websocket))
        print(f"[Broadcaster] Connexion ajoutée → room {room_id} ({len(self.rooms[room_id])} connecté(s))")

    def disconnect(self, room_id: int, websocket: WebSocket):
        # retire la connexion du websocket de la room
        if room_id in self.rooms:
            self.rooms[room_id] = [
                (uid, ws) for uid, ws in self.rooms[room_id] if ws is not websocket
            ]
            print(f"[Broadcaster] Connexion retirée → room {room_id} ({len(self.rooms[room_id])} connecté(s))")

    def get_online_user_ids(self, room_id: int) -> list[int]:
        # retourne la liste des user_id connéctés dans la room
        return [uid for uid, _ in self.rooms.get(room_id, [])]

    async def broadcast(self, room_id: int, message: str):
        # envoie un message à tous les websockets connectés dans la room
        if room_id not in self.rooms:
            return
        for _, ws in self.rooms[room_id]:
            await ws.send_text(message)
        print(f"[Broadcaster] Message diffusé dans la room {room_id} : {message[:50]}")


broadcaster = Broadcaster()
