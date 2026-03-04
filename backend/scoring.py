import json
import os

# chargement des seuils depuis le fichier json qui ont été généré par le benchmark
try:
    with open("scoring_config.json", "r") as f:
        THRESHOLDS = json.load(f)
except FileNotFoundError:
    THRESHOLDS = {
        "SIZE": {"min": 500, "max": 3000},
        "REQ":  {"min": 30,  "max": 150},
        "DOM":  {"min": 500, "max": 2000}
    }

def normalize_value(value, min_val, max_val):
    """
    Permet de transformer une valeur en note de 0 à 100
    Si value <= min_val -> 100
    Si value >= max_val -> 0
    """
    if value <= min_val: return 100
    if value >= max_val: return 0
    # plus c'est grand moins ça sera bon, d'où l'inversion (100 - ...)
    return 100 - ((value - min_val) / (max_val - min_val) * 100)

def calculate_score(data):
    if "error" in data:
        return None

    # 1 Poids, pondération à 50%
    size_score = normalize_value(
        data["size_kb"], 
        THRESHOLDS["SIZE"]["min"], 
        THRESHOLDS["SIZE"]["max"]
    )
    # 2 Requêtes, pondération à 30%
    req_score = normalize_value(
        data["request_count"], 
        THRESHOLDS["REQ"]["min"], 
        THRESHOLDS["REQ"]["max"]
    )
    # 3 DOM, pondération 20%
    dom_score = normalize_value(
        data["dom_elements"], 
        THRESHOLDS["DOM"]["min"], 
        THRESHOLDS["DOM"]["max"]
    )

    # Calcul du score final
    final_score = (size_score * 0.5) + (req_score * 0.3) + (dom_score * 0.2)
    final_score = round(final_score, 2)

    # Système d'attribution de la lettre
    if final_score >= 80: letter = "A"
    elif final_score >= 65: letter = "B"
    elif final_score >= 50: letter = "C"
    elif final_score >= 35: letter = "D"
    else: letter = "E"
    return {
        "letter": letter,
        "score": final_score,
        "details": {
            "size_score": round(size_score, 2),
            "req_score": round(req_score, 2),
            "dom_score": round(dom_score, 2)
        }
    }