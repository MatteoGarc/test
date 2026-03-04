import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Récupération de l'URL de connexion depuis docker-compose
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Modèle de la table 'scans'
class ScanResult(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, index=True)
    score_letter = Column(String)
    score_value = Column(Float)
    page_size_kb = Column(Float)
    request_count = Column(Integer)
    dom_elements = Column(Integer)
    scan_date = Column(DateTime, default=datetime.utcnow)
    details = Column(JSON)

# Création des tables
def init_db():
    Base.metadata.create_all(bind=engine)

