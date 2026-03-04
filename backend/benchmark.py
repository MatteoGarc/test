import asyncio
import json
import statistics
from analyzer import analyze_website

# liste de sites (IL FAUT EN AJOUTER PLUS POUR UN CALIBRAGE FIABLE)
URLS_TO_TEST = [
    "https://www.google.com", "https://www.wikipedia.org", "https://www.amazon.fr",
    "https://www.lemonde.fr", "https://www.github.com", "https://stackoverflow.com",
    "https://www.python.org", "https://www.gov.uk", "https://www.nytimes.com"
]

async def run_benchmark():
    results = {
        "sizes": [],
        "requests": [],
        "dom": []
    }
    
    print(f"démarrage du benchmark sur {len(URLS_TO_TEST)} sites...")
    for url in URLS_TO_TEST:
        print(f"analyse de {url}...")
        try:
            data = await analyze_website(url)
            if "error" not in data:
                results["sizes"].append(data["size_kb"])
                results["requests"].append(data["request_count"])
                results["dom"].append(data["dom_elements"])
        except Exception as e:
            print(f"Erreur sur {url}: {e}")
    # calcul des seuils (10% meilleurs et 10% pires)
    # P10 = objectif d'excellence (note A/100)
    # P90 = seuil critique (note E/0)
    print("\n---RÉSULTATS---")
    
    # si on a assez de données
    if results["sizes"]:
        def get_stats(data):
            quantiles = statistics.quantiles(data, n=10) # déciles
            return int(quantiles[0]), int(quantiles[8]) # 1er décile (10%) et 9ème décile (90%)
        s_best,s_worst = get_stats(results["sizes"])
        r_best,r_worst = get_stats(results["requests"])
        d_best,d_worst = get_stats(results["dom"])

        config = {
            "SIZE": {"min": s_best, "max": s_worst},   #ex: min=500Ko max=4000Ko
            "REQ":  {"min": r_best, "max": r_worst},    #ex: min=20 req max=150 req
            "DOM":  {"min": d_best, "max": d_worst}     #ex: min=400 elements max=2500
        }     
        print(json.dumps(config,indent=4))
        with open("scoring_config.json", "w") as f:
            json.dump(config, f)
            print("\nconfig save dans 'scoring_config.json'")

if __name__ == "__main__":
    asyncio.run(run_benchmark())