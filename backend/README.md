# Documentation de l'API

## Informations Générales

* Toutes les réponses sont au format JSON.
* Les codes de réponse HTTP standards sont utilisés pour indiquer le succès ou l'échec d'une requête.
* Pour les endpoints nécessitant un id, assurez-vous que l'ID est valide et existe dans la base de données, et dans ce cas retourner une erreur *404 Not Found*.

## Vérifier si le serveur est actif

* Endpoint : `/api/alive`
* Méthode : GET
* Description : Vérifie si le serveur est en fonctionnement.
* Réponse :
  + 200 OK : { "message": "Alive" }

## Liste de toutes les associations

* Endpoint : `/api/associations`
* Méthode : GET
* Description : Retourne une liste de toutes les associations.
* Réponse :
  + 200 OK : Liste des ids des associations, par exemple : [1, 2, 3, 4]

## Détails d'une association

* Endpoint : `/api/association/<int:id>`
* Méthode : GET
* Description : Retourne les détails d'une association spécifique par son ID.
* Réponse :
  + 200 OK : Détails de l'association demandée, sous forme de dictionnaire.
  + 404 Not Found : { "error": "Association not found" }

## Liste de tous les événements

* Endpoint : `/api/evenements`
* Méthode : GET
* Description : Retourne une liste de tous les événements.
* Réponse :
  + 200 OK : Liste des ids des événements, par exemple : [20, 30, 40]

## Détails d'un événement

* Endpoint : `/api/evenement/<int:id>`
* Méthode : GET
* Description : Retourne les détails d'un événement spécifique par son ID.
* Réponse :
  + 200 OK : Détails de l'événement demandé, sous forme de dictionnaire.
  + 404 Not Found : { "error": "Event not found" }

## Liste des événements d'une association

* Endpoint : `/api/association/<int:id>/evenements`
* Méthode : GET
* Description : Retourne une liste des événements organisés par une association spécifique.
* Réponse :
  + 200 OK : Liste des événements de l'association demandée.

## Liste des associations par type

* Endpoint : `/api/associations/type/<type>`
* Méthode : GET
* Description : Retourne une liste des associations par type (BDE, BDS, BDA, etc.).
* Réponse :
  + 200 OK : Liste des associations filtrées par type.
* Note: cet endpoint n'est pas testé par le frontend pour le moment.
