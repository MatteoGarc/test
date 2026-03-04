from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import SessionLocal, init_db, ScanResult
from analyzer import analyze_website
from scoring import calculate_score

app = FastAPI(title="EcoScore API")

# Initialisation DB au démarrage
@app.on_event("startup")
def startup():
    init_db()

# Sert les fichiers statiques (Frontend)
app.mount("/static", StaticFiles(directory="static", html=True), name="static")

# Dependency DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UrlRequest(BaseModel):
    url: str

@app.post("/api/analyze")
async def analyze_endpoint(request: UrlRequest, db: Session = Depends(get_db)):
    # 1. Analyse
    raw_data = await analyze_website(request.url)
    if "error" in raw_data:
        raise HTTPException(status_code=400, detail=raw_data["error"])

    # 2. Calcul du score
    score_data = calculate_score(raw_data)

    # 3. Sauvegarde en base
    scan = ScanResult(
        url=request.url,
        score_letter=score_data["letter"],
        score_value=score_data["score"],
        page_size_kb=raw_data["size_kb"],
        request_count=raw_data["request_count"],
        dom_elements=raw_data["dom_elements"],
        details=score_data["details"]
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    return scan

@app.get("/api/history")
def get_history(db: Session = Depends(get_db)):
    # Récupère les 10 derniers scans
    return db.query(ScanResult).order_by(ScanResult.scan_date.desc()).limit(10).all()

# Route racine redirige vers l'index.html
@app.get("/")
def read_root():
    return {"message": "Aller sur /static/index.html pour l'interface"}