from playwright.async_api import async_playwright

async def analyze_website(url: str):
    """
    Lance un navigateur + charge la page et capture les métriques
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await context.new_page()
        
        metrics = {
            "total_size": 0,
            "request_count": 0,
            "resources": {}
        }
        page.on("response", lambda response: _collect_metrics(response, metrics))

        try:
            # timeout car certaines pages peuvent continuer à charger indéfiniment
            await page.goto(url, wait_until="networkidle", timeout=30000)
        except Exception as e:
            if "Timeout" in str(e):
                print(f"Timeout sur {url} : arrêt forcé de l'attente réseau. Analyse en cours...")
            else:
                await browser.close()
                return {"error": f"Erreur fatale : {str(e)}"}
        # même après le timeout on peut récupérer les métriques déjà collectées
        try:
            dom_count = await page.evaluate("document.getElementsByTagName('*').length")
        except:
            dom_count = 0 # fallback si la page est mal chargée
        await browser.close()

        return {
            "url": url,
            "size_kb": round(metrics["total_size"] / 1024, 2),
            "request_count": metrics["request_count"],
            "dom_elements": dom_count
        }

def _collect_metrics(response, metrics):
    """helper pour agréger les données réseau"""
    try:
        size = int(response.headers.get('content-length', 0))
        metrics["total_size"] += size
        metrics["request_count"] += 1
    except:
        pass