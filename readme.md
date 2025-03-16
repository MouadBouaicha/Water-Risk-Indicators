# Dashboard des Indicateurs de Risque Hydrique

Un tableau de bord interactif permettant d'explorer et de visualiser différents indicateurs de risque hydrique pour la France, l'Allemagne, l'Espagne et le Maroc. Cette application web offre une analyse détaillée des bassins versants avec des données annuelles, mensuelles et des projections futures.

## 📊 Démonstration

Une version interactive du dashboard est disponible sur Observable:
[Water Risk Indicators Dashboard sur Observable](https://observablehq.com/d/cbc00b3520fbaf01)



## 📁 Structure du projet

```
└── mouadbouaicha-water-risk-indicators/
    ├── index.html                  # Page HTML principale
    ├── map.js                      # Script principal pour la visualisation
    ├── style.css                   # Styles CSS pour le dashboard
    ├── limits/                     # Fichiers de délimitation des pays
    │   ├── gadm41_DEU_0.json       # Limites de l'Allemagne
    │   ├── gadm41_ESH_0.json       # Limites additionnelles
    │   ├── gadm41_ESP_0.json       # Limites de l'Espagne
    │   └── gadm41_MAR_0.json       # Limites du Maroc
    └── processed_data/             # Données traitées par pays
        ├── deu/                    # Allemagne
        │   ├── deu_annual.geojson  # Données annuelles
        │   ├── deu_future.geojson  # Projections futures
        │   └── deu_monthly.geojson # Données mensuelles
        ├── esp/                    # Espagne
        │   ├── esp_annual.geojson
        │   ├── esp_future.geojson
        │   └── esp_monthly.geojson
        ├── fra/                    # France
        │   ├── fra_annual.geojson
        │   ├── fra_future.geojson
        │   └── fra_monthly.geojson
        └── mar/                    # Maroc
            ├── mar_annual.geojson
            ├── mar_future.geojson
            └── mar_monthly.geojson
```

## 📊 Données

Les données utilisées dans ce projet sont issues de deux sources principales :

### Aqueduct 4.0
Base de données du World Resources Institute (WRI) fournissant des indicateurs de risque liés à l'eau à l'échelle mondiale, incluant :
- Stress hydrique (BWS)
- Épuisement hydrique (BWD)
- Variabilité interannuelle (IAV)
- Variabilité saisonnière (SEV)
- Risque de sécheresse (DRR)

### HydroBASINS
Partie du projet HydroSHEDS fournissant :
- Délimitations standardisées des bassins hydrographiques
- Polygones des bassins versants à différents niveaux de résolution
- Structure de codification hiérarchique des bassins (codes PFAF)

## 🔧 Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript
- **Visualisation** : D3.js (v7.8.5)
- **Observable** : Pour la version notebook interactive
- **Prétraitement des données** : Python (GeoPandas, Pandas, Shapely)

## 🚀 Installation et utilisation

### Méthode 1 : Installation locale

1. Clonez ce dépôt :
   ```bash
   git clone https://github.com/MouadBouaicha/Water-Risk-Indicators
   cd Water-Risk-Indicators
   ```

2. Lancez un serveur web local. Par exemple avec Python :
   ```bash
   # Python 3
   python -m http.server 8000
   ```

3. Ouvrez votre navigateur et accédez à `http://localhost:8000`

### Méthode 2 : Utilisation d'Observable

Visitez directement la version Observable du dashboard :
[https://observablehq.com/d/cbc00b3520fbaf01](https://observablehq.com/d/cbc00b3520fbaf01)

## 📋 Fonctionnalités

- **Visualisation interactive** des bassins versants par pays
- **Filtrage par indicateur** de risque hydrique (BWS, BWD, IAV, etc.)
- **Visualisation temporelle** :
  - Données annuelles
  - Données mensuelles avec sélecteur de mois
  - Projections futures avec choix de scénario et d'année
- **Zoom et exploration** détaillée des régions
- **Sélection de bassins** avec affichage d'informations détaillées
- **Génération de statistiques** par indicateur et par pays

## 📊 Types d'indicateurs disponibles

| Code | Nom | Description |
|------|-----|-------------|
| BWS | Stress Hydrique | Rapport entre les prélèvements d'eau et les ressources disponibles |
| BWD | Épuisement Hydrique | Rapport entre la consommation d'eau et les ressources disponibles |
| IAV | Variabilité Interannuelle | Variations dans l'approvisionnement en eau entre les années |
| SEV | Variabilité Saisonnière | Variations dans l'approvisionnement en eau entre les mois |
| DRR | Risque de Sécheresse | Évaluation du risque de conditions de sécheresse |
| GTD | Déclin des Nappes Phréatiques | Taux de déclin de la nappe phréatique |
| RFR | Risque d'Inondation | Risque d'inondation fluviale |

## 🧪 Méthodologie de génération des données

Le processus de traitement des données comprend les étapes suivantes :

1. **Extraction des limites géographiques des pays**
   - Utilisation des données de frontières administratives (GADM)
   - Filtrage pour les pays d'intérêt

2. **Fusion des données Aqueduct avec HydroBASINS**
   - Jointure spatiale entre indicateurs et polygones des bassins
   - Association des métriques aux géométries des bassins versants

3. **Prétraitement et nettoyage**
   - Filtrage des bassins problématiques (codes PFAF_ID: '231110', '231100', '216042')
   - Normalisation des indicateurs pour la comparaison entre bassins
   - Création d'attributs supplémentaires (noms de bassins format: B_XXXX_REG)

4. **Génération des données temporelles**
   - Dérivation des données mensuelles à partir des indicateurs annuels
   - Création de projections futures selon différents scénarios
   - Structuration cohérente des noms de colonnes

5. **Export au format GeoJSON**
   - Génération de fichiers par pays et par type de données
   - Optimisation pour l'utilisation web
   - Vérification de la topologie et correction des erreurs géométriques

## 🖥️ Interface web

L'interface du dashboard comprend plusieurs composants clés :

1. **Contrôles interactifs :**
   - Sélecteur de pays
   - Sélecteur d'indicateur
   - Sélecteur de type de données
   - Contrôles conditionnels (slider pour mois, scénario pour projections futures)

2. **Carte principale :**
   - Visualisation géographique des bassins versants
   - Coloration dynamique selon l'indicateur sélectionné
   - Interactions au survol et au clic
   - Contrôles de zoom et de pan

3. **Panneau d'informations :**
   - Affichage des détails du bassin sélectionné
   - Présentation des valeurs des indicateurs
   - Informations géographiques (superficie, région)

4. **Légende dynamique :**
   - Échelle de couleur adaptée à chaque indicateur
   - Valeurs de seuil pour l'interprétation des données

5. **Panneau de statistiques :**
   - Statistiques calculées dynamiquement pour les sélections actuelles
   - Valeurs minimales, maximales, moyennes et médianes

## 🛠️ Fonctionnement technique

### map.js

Le fichier `map.js` est le cœur du dashboard, il gère :

- L'initialisation de la carte D3.js
- Le chargement des données GeoJSON
- La gestion des interactions utilisateur
- Les fonctions de calcul et de mise à jour des visualisations

Principales fonctions :
- `loadInitialData()` : Charge les données GeoJSON du pays sélectionné
- `updateMap()` : Met à jour la carte en fonction des sélections
- `updateChartMultiple()` : Génère les graphiques pour les bassins sélectionnés
- `updateRadarChart()` : Crée un graphique radar pour les données annuelles
- `updateNetworkGraphMultiple()` : Visualise les relations entre bassins

### index.html

Structure HTML du dashboard avec :
- En-tête et contrôles de navigation
- Conteneurs pour les différentes visualisations
- Panneau d'information latéral
- Intégration des bibliothèques JavaScript

### style.css

Styles CSS pour :
- Mise en page responsive du dashboard
- Thème visuel et palette de couleurs
- Animations et transitions
- Adaptation pour différentes tailles d'écran

## 📈 Version Observable

La version Observable du dashboard offre des fonctionnalités supplémentaires :
- Réactivité améliorée grâce au système de cellules d'Observable
- Intégration plus facile dans d'autres notebooks
- Documentation interactive du code
- Possibilité d'explorer et de modifier le code en temps réel


