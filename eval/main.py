from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlmodel import SQLModel, create_engine
from sqlmodel import Field
from sqlmodel import Session 
from sqlmodel import select


from datetime import datetime 
from typing import Optional



#création des models 
## table utilisateur - id, numéro de téléphone 
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    phone_number: str = Field(unique=True)                             # ajouter des contraintes plus tard pour la longueur, l'ajout de +33 pour internationaliser, etc.

## table message pour envoyer/recevoir des messages - id, send_by, send_to, send_on, contenu, message_read 
class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    send_by: int = Field(foreign_key="user.id")
    send_to_user: int = Field(default=None, foreign_key="user.id")
    send_to_room: int = Field(default=None, foreign_key="room.id")
    content: str
    send_on: datetime = Field(default_factory=datetime.now)            # ajouter des contraintes pour que les datetime soient directement convertis
    message_read: bool = Field(default=False)

## table groupe pour faire des groupes de discussions - id, name 
class Room(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

#connexion à la base de données 
SQLITE_URL = "sqlite:///whatsapp_lowcost.db"
engine = create_engine(SQLITE_URL, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def create_room_generale(): # à améliorer : traiter le cas de si la room 'Générale' existe déjà
    with Session(engine) as session:
        room_generale = Room(name='Générale')
        session.add(room_generale)
        session.commit()
        print("Salle de discussion générale disponible !")
        


#APPLICATION FASTAPI
app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    create_room_generale()
    print("Base de données OK!")

#ROUTES HTTP

@app.get("/", response_class=HTMLResponse) #accueil de l'app 
def page_connexion(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


#l'utilisateur entre son numéro de téléphone pour se connecter ou créer un compte
@app.get("/connexion/{phone_number}")
def connexion(phone_number: str):
    with Session(engine) as session:
        # On cherche si l'utilisateur existe déjà en base
        utilisateur = session.exec(
            select(Utilisateur).where(Utilisateur.phone_number == phone_number)
        ).first()

        # Sinon, on le créer et on le sauvegarde en base
        if not utilisateur:
            utilisateur = Utilisateur(phone_number=phone_number)
            session.add(utilisateur)
            session.commit()
            session.refresh(utilisateur)  # pour récupérer l'id généré par SQLite
            print(f"Nouvel utilisateur créé : {phone_number} (id={utilisateur.id})")
        else:
            print(f"Utilisateur existant : {phone_number} (id={utilisateur.id})")
        room = session.exec(select(Groupe).where(Groupe.nom == "Général")).first()
        return RedirectResponse(url=f"/chat/{room.id}/{utilisateur.id}")


##page de chat pour une room et un utilisateur données:
##On afficher tous les messages de la room
##Et un formulaire pour envoyer un message (requête POST vers /send_message)

@app.get("/chat/{room_id}/{user_id}", response_class=HTMLResponse)
def page_chat(request: Request, room_id: int, user_id: int):
    with Session(engine) as session:
        # Infos utilisateur et room
        utilisateur = session.get(Utilisateur, user_id)
        room = session.get(Groupe, room_id)

        # Tous les messages de la room triés par date d'envoie
        messages = session.exec(
            select(Message)
            .where(Message.send_to_room == room_id)
            .order_by(Message.send_on)
        ).all()

        # Affichage de la page de chat
        return templates.TemplateResponse("chat.html", {
            "request": request,
            "utilisateur": utilisateur,
            "room": room,
            "messages": messages,
        })




