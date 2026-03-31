from pathlib import Path

import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# -----------------
# CORS setup (it's black magic - keep as-is)
# -----------------
origins = [
    "*"  # allow all origins for simplicity (not recommended for production)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],  # allow all HTTP methods
    allow_headers=["*"],  # allow all headers
)

# -----------------
# CSV data
# -----------------
# spot the data folder
data = Path(__file__).parent.absolute() / 'data'

# load the CSV data into pandas dataframes
associations_df = pd.read_csv(data / 'associations_etudiantes.csv')
evenements_df = pd.read_csv(data / 'evenements_associations.csv')

# -----------------
## your code (route handlers) goes here
# -----------------


@app.get("/api/alive") #vérifier si le serveur est actif
def alive():
    return {"message": "Alive"}

@app.get("/api/associations") #liste de
def associations():
    return associations_df["id"].tolist()

@app.get("/api/association/{id}")
def association(id: int):
    ids = associations_df[associations_df["id"] == id]
    if ids.empty:
        raise HTTPException(status_code=404, detail="Association not found")
    return ids.iloc[0].to_dict()

@app.get("/api/evenements")
def evenements():
    return evenements_df["id"].tolist()

@app.get("/api/evenement/{id}")
def evenement(id: int):
    events = evenements_df[evenements_df["id"] == id]
    if events.empty:
        raise HTTPException(status_code=404, detail="Event not found")
    return events.iloc[0].to_dict()

@app.get("/api/association/{id}/evenements")
def association_evenements(id: int):
    rows = evenements_df[evenements_df["association_id"] == id]
    return rows.to_dict(orient="records")

@app.get("/api/associations/type/{type}")
def associations_by_type(type: str):
    rows = associations_df[associations_df["type"] == type]
    return rows.to_dict(orient="records")
