from fastapi import FastAPI 
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
    send_to_user: int = Field(foreign_key="user.id")
    send_to_room: int = Field(foreign_key="room.id")
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

#vérification utilisation de FastAPI
app = FastAPI()

@app.get("/")
def root():
    return("message: Serveur OK!")

app = FastAPI()


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    print("Base de données OK!")


@app.get("/")
def racine():
    return {"message": "Serveur OK!"}
