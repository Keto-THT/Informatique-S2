from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlmodel import SQLModel, create_engine, Field, Session, select
from datetime import datetime 
from typing import Optional

from broadcaster import broadcaster
from fastapi import WebSocket, WebSocketDisconnect
import json


# création des models 
## table utilisateur - id, numéro de téléphone 
class Utilisateur(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: Optional[str] = Field(unique=True)                             # ajouter des contraintes plus tard pour la longueur, les caractères autorisés, etc.
    #phone_number: str = Field(unique=True)                             # ajouter des contraintes plus tard pour la longueur, l'ajout de +33 pour internationaliser, etc.

## table groupe pour faire des groupes de discussions - id, name 
class Room(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

## table message pour envoyer/recevoir des messages - id, send_by, send_to, send_on, contenu, message_read 
class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    send_by: int = Field(foreign_key="utilisateur.id")
    send_to_user: Optional[int] = Field(default=None, foreign_key="utilisateur.id")  # Optional car message SOIT privé SOIT dans une room
    send_to_room: Optional[int] = Field(default=None, foreign_key="room.id")          # Optional car message SOIT privé SOIT dans une room
    content: str
    send_on: datetime = Field(default_factory=datetime.now)            # ajouter des contraintes pour que les datetime soient directement convertis
    message_read: bool = Field(default=False)

# connexion à la base de données 
SQLITE_URL = "sqlite:///whatsapp_lowcost.db"
engine = create_engine(SQLITE_URL, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def create_room_generale():
    with Session(engine) as session:
        # On vérifie si la room 'Générale' existe déjà avant de la créer
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

# ROUTES HTTP
@app.get("/", response_class=HTMLResponse) # accueil de l'app 
def page_connexion(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

# l'utilisateur entre son nom pour se connecter ou créer un compte
@app.get("/connexion/{name}")
def connexion(name: str):
    with Session(engine) as session:
        # On cherche si l'utilisateur existe déjà en base
        utilisateur = session.exec(
            select(Utilisateur).where(Utilisateur.name == name)
        ).first()
        # Sinon, on le crée et on le sauvegarde en base
        if not utilisateur:
            utilisateur = Utilisateur(name=name)
            session.add(utilisateur)
            session.commit()
            session.refresh(utilisateur)  # pour récupérer l'id généré par SQLite
            print(f"Nouvel utilisateur créé : {name} (id={utilisateur.id})")
        else:
            print(f"Utilisateur existant : {name} (id={utilisateur.id})")

        room = session.exec(select(Room).where(Room.name == "Générale")).first()
        return RedirectResponse(url=f"/chat/{room.id}/{utilisateur.id}")

## page de chat pour une room et un utilisateur donnés :
## On affiche tous les messages de la room
## Et un formulaire pour envoyer un message
@app.get("/chat/{room_id}/{user_id}", response_class=HTMLResponse)
def page_chat(request: Request, room_id: int, user_id: int):
    with Session(engine) as session:
        # Infos utilisateur et room
        utilisateur = session.get(Utilisateur, user_id)
        room = session.get(Room, room_id)
        # Tous les messages de la room triés par date d'envoi
        messages = session.exec(
            select(Message)
            .where(Message.send_to_room == room_id)
            .order_by(Message.send_on)
        ).all()
        # Affichage de la page de chat
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
# ENDPOINT WEBSOCKET
# ==============================================================

# L'URL contient room_id et user_id pour savoir qui parle et où
@app.websocket("/ws/{room_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: int, user_id: int):
    await websocket.accept()
    broadcaster.connect(room_id, websocket)

    try:
        
        while True: #on attend les messages entrants
            contenu = await websocket.receive_text() # On attend qu'un message texte arrive (bloquant jusqu'à réception)

            with Session(engine) as session: # on sauvegarde le message en base de données
                nouveau_message = Message(
                    send_by=user_id,
                    send_to_room=room_id,
                    content=contenu,
                    # send_on et message_read ont des valeurs par défaut
                )
                session.add(nouveau_message)
                session.commit()
                session.refresh(nouveau_message)  # pour récupérer l'id et send_on
                print(f"[WS] Message sauvegardé : {contenu[:30]} (room={room_id}, user={user_id})")

                donnees = json.dumps({
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