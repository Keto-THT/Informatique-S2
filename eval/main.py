from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlmodel import SQLModel, create_engine, Field, Session, select, UniqueConstraint
from datetime import datetime
from typing import Optional

from broadcaster import broadcaster
from fastapi import WebSocket, WebSocketDisconnect
import json


# création des models
class Utilisateur(SQLModel, table=True):  # table User
    id: Optional[int] = Field(default=None, primary_key=True)
    name: Optional[str] = Field(unique=True)

class Subscription(SQLModel, table=True): # table d'abonnement user -> room pour identifier qui est dans la room
    __table_args__ = (UniqueConstraint("user_id", "room_id"),)
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="utilisateur.id")
    room_id: int = Field(foreign_key="room.id")

class Room(SQLModel, table=True):
    # table de room de discussion avec un nom unique
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    created_by: Optional[int] = Field(default=None, foreign_key="utilisateur.id")

class Message(SQLModel, table=True):
    # table de message avec les infos d'envoi et de lecture
    id: Optional[int] = Field(default=None, primary_key=True)
    send_by: int = Field(foreign_key="utilisateur.id")
    send_to_user: Optional[int] = Field(default=None, foreign_key="utilisateur.id")
    send_to_room: Optional[int] = Field(default=None, foreign_key="room.id")
    content: str
    send_on: datetime = Field(default_factory=datetime.now)
    message_read: bool = Field(default=False)

# connexion à la base de données
SQLITE_URL = "sqlite:///whatsapp_lowcost.db"
engine = create_engine(SQLITE_URL, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def create_room_generale():
    with Session(engine) as session:
        room = session.exec(select(Room).where(Room.name == "Générale")).first()
        if not room:
            session.add(Room(name="Générale"))
            session.commit()
            print("Salle de discussion générale disponible !")

# APPLICATION FASTAPI
app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    create_room_generale()
    print("Base de données OK!")

# ==============================================================
# ROUTES HTTP
# ==============================================================

@app.get("/", response_class=HTMLResponse)
def page_connexion(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

@app.get("/connexion/{name}")
# route de connexion qui crée un utilisateur s'il n'existe pas et le redirige vers le lobby
def connexion(name: str):
    with Session(engine) as session:
        utilisateur = session.exec(
            select(Utilisateur).where(Utilisateur.name == name)
        ).first()
        if not utilisateur:
            utilisateur = Utilisateur(name=name)
            session.add(utilisateur)
            session.commit()
            session.refresh(utilisateur)
            print(f"Nouvel utilisateur créé : {name} (id={utilisateur.id})")
        else:
            print(f"Utilisateur existant : {name} (id={utilisateur.id})")

        # Auto-abonnement à "Générale" si pas encore abonné
        room = session.exec(select(Room).where(Room.name == "Générale")).first()
        if room:
            existing_sub = session.exec(
                select(Subscription)
                .where(Subscription.user_id == utilisateur.id)
                .where(Subscription.room_id == room.id)
            ).first()
            if not existing_sub:
                session.add(Subscription(user_id=utilisateur.id, room_id=room.id))
                session.commit()

        return RedirectResponse(url=f"/lobby/{utilisateur.id}")

@app.get("/lobby/{user_id}", response_class=HTMLResponse)
def page_lobby(request: Request, user_id: int):
    with Session(engine) as session:
        utilisateur = session.get(Utilisateur, user_id)
        all_rooms = session.exec(select(Room)).all()
        subs = session.exec(
            select(Subscription).where(Subscription.user_id == user_id)
        ).all()
        subscribed_ids = {s.room_id for s in subs}
        rooms_data = [
            {"id": r.id, "name": r.name, "subscribed": r.id in subscribed_ids, "created_by": r.created_by}
            for r in all_rooms
        ]
    return templates.TemplateResponse(
        request=request,
        name="lobby.html",
        context={"utilisateur": utilisateur, "rooms": rooms_data}
    )

@app.get("/chat/{room_id}/{user_id}", response_class=HTMLResponse)
# page de chat d'une room avec les messages déjà envoyés et les infos de la room et de l'utilisateur
def page_chat(request: Request, room_id: int, user_id: int):
    with Session(engine) as session:
        utilisateur = session.get(Utilisateur, user_id)
        room = session.get(Room, room_id)
        messages = session.exec(
            select(Message)
            .where(Message.send_to_room == room_id)
            .order_by(Message.send_on)
        ).all()
        return templates.TemplateResponse(
            request=request,
            name="chat.html",
            context={
                "utilisateur": utilisateur,
                "room": room,
                "messages": messages,
            }
        )

# ==============================================================
# ROUTES ROOMS (API)
# ==============================================================

@app.post("/rooms/create/{name}/{user_id}")
def creer_room(name: str, user_id: int):
    with Session(engine) as session:
        existing = session.exec(select(Room).where(Room.name == name)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Room déjà existante")
        room = Room(name=name, created_by=user_id)
        session.add(room)
        session.commit()
        session.refresh(room)
        return {"id": room.id, "name": room.name}

@app.delete("/rooms/{room_id}/{user_id}")
def supprimer_room(room_id: int, user_id: int):
    with Session(engine) as session:
        room = session.get(Room, room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Room introuvable")
        if room.created_by is None:
            raise HTTPException(status_code=403, detail="Impossible de supprimer cette room")
        if room.created_by != user_id:
            raise HTTPException(status_code=403, detail="Seul le créateur peut supprimer cette room")
        # Suppression des abonnements liés à la room
        subs = session.exec(select(Subscription).where(Subscription.room_id == room_id)).all()
        for sub in subs:
            session.delete(sub)
        session.delete(room)
        session.commit()
        return {"detail": "Room supprimée"}

@app.post("/rooms/join/{room_id}/{user_id}")
def rejoindre_room(room_id: int, user_id: int):
    # route d'abonnement à une room qui vérifie que la room et l'utilisateur existent et que l'abonnement n'existe pas déjà avant de le créer
    with Session(engine) as session:
        room = session.get(Room, room_id)
        utilisateur = session.get(Utilisateur, user_id)
        if not room or not utilisateur:
            raise HTTPException(status_code=404, detail="Room ou utilisateur introuvable")
        existing = session.exec(
            select(Subscription)
            .where(Subscription.user_id == user_id)
            .where(Subscription.room_id == room_id)
        ).first() # vérification de l'existence de l'abonnement 
        if existing:
            return {"detail": "Déjà abonné"}
        session.add(Subscription(user_id=user_id, room_id=room_id))
        session.commit()
        return {"detail": "Abonné avec succès", "room_id": room_id}

@app.delete("/rooms/leave/{room_id}/{user_id}")
def quitter_room(room_id: int, user_id: int):
    # route de désabonnement d'une room qui vérifie que l'abonnement existe avant de le supprimer
    with Session(engine) as session:
        sub = session.exec(
            select(Subscription)
            .where(Subscription.user_id == user_id)
            .where(Subscription.room_id == room_id)
        ).first()
        if not sub:
            raise HTTPException(status_code=404, detail="Abonnement introuvable")
        session.delete(sub)
        session.commit()
        return {"detail": "Désabonné"}

@app.post("/rooms/{room_id}/read/{user_id}")
def marquer_messages_lus(room_id: int, user_id: int):
    # Marque comme lus tous les messages de la room non envoyés par user_id
    with Session(engine) as session:
        messages = session.exec(
            select(Message)
            .where(Message.send_to_room == room_id)
            .where(Message.send_by != user_id)
            .where(Message.message_read == False)  # noqa: E712
        ).all()
        for msg in messages:
            msg.message_read = True
            session.add(msg)
        session.commit()
        return {"detail": f"{len(messages)} messages marqués comme lus"}

@app.get("/rooms/{room_id}/online")
def utilisateurs_en_ligne(room_id: int):
    # route qui retourne la liste des utilisateurs en ligne dans une room en utilisant le broadcaster pour récupérer les connexions actives
    user_ids = broadcaster.get_online_user_ids(room_id)
    with Session(engine) as session:
        users = []
        for uid in user_ids:
            u = session.get(Utilisateur, uid)
            if u:
                users.append({"id": u.id, "name": u.name})
    return {"room_id": room_id, "online": users}

# ==============================================================
# ENDPOINT WEBSOCKET
# ==============================================================

@app.websocket("/ws/{room_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: int, user_id: int):
    await websocket.accept()
    broadcaster.connect(room_id, user_id, websocket)

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)

            if payload.get("type") == "read":
                # Accusé de lecture : on met à jour le message et on notifie l'expéditeur
                message_id = payload["message_id"]
                with Session(engine) as session:
                    msg = session.get(Message, message_id)
                    if msg and not msg.message_read:
                        msg.message_read = True
                        session.add(msg)
                        session.commit()
                        receipt = json.dumps({"type": "read_receipt", "message_id": message_id})
                        await broadcaster.send_to_user(room_id, msg.send_by, receipt)

            elif payload.get("type") == "message":
                contenu = payload["content"]
                with Session(engine) as session:
                    nouveau_message = Message(
                        send_by=user_id,
                        send_to_room=room_id,
                        content=contenu,
                    )
                    session.add(nouveau_message)
                    session.commit()
                    session.refresh(nouveau_message)
                    print(f"[WS] Message sauvegardé : {contenu[:30]} (room={room_id}, user={user_id})")

                    donnees = json.dumps({
                        "type": "message",
                        "id": nouveau_message.id,
                        "send_by": user_id,
                        "content": contenu,
                        "send_on": nouveau_message.send_on.isoformat(),
                        "message_read": nouveau_message.message_read,
                    })

                await broadcaster.broadcast(room_id, donnees)

    except WebSocketDisconnect:
        broadcaster.disconnect(room_id, websocket)
        print(f"[WS] Déconnexion → room {room_id}, user {user_id}")
