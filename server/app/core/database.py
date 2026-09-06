import os
import json
import time
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    is_connected: bool = False
    
    # In-memory resilient storage for fallback execution
    local_store_paths: List[str] = [
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "bone_health_store.json"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "bone_health_store.json"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "bone_health_store.json"),
    ]

    async def connect_to_database(self):
        """Establish async connection to MongoDB Cluster or fallback gracefully."""
        try:
            if settings.MONGODB_URI:
                self.client = AsyncIOMotorClient(
                    settings.MONGODB_URI,
                    serverSelectionTimeoutMS=2000
                )
                self.db = self.client[settings.DATABASE_NAME]
                # Test ping
                await self.client.admin.command('ping')
                self.is_connected = True
                print(f"[DATABASE] Connected to MongoDB database: {settings.DATABASE_NAME}")
            else:
                self.is_connected = False
        except Exception as e:
            print(f"[DATABASE] MongoDB connection unestablished ({e}). Utilizing resilient local repository layer.")
            self.is_connected = False

        # Seed demo admin account if no admin exists
        await self._seed_demo_admin()

    async def _seed_demo_admin(self):
        """Seed a demo admin account if no admin exists in the database."""
        import hashlib
        import secrets as _secrets

        def _hash_pw(password: str) -> str:
            salt = _secrets.token_hex(16)
            key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000).hex()
            return f"{salt}${key}"

        demo_admin = {
            "_id": "admin_demo_001",
            "firstName": "Admin",
            "lastName": "EndoBone",
            "email": "admin@endobone.ai",
            "password_hash": _hash_pw("Admin@2026!"),
            "role": "admin",
            "licenseNumber": "ADMIN-001",
            "institution": "EndoBone AI Platform",
            "created_at": "2026-01-01T00:00:00Z",
        }

        demo_doctor = {
            "_id": "doc_demo_001",
            "firstName": "Demo",
            "lastName": "Doctor",
            "email": "doctor.demo@gmail.com",
            "password_hash": _hash_pw("Doctor@2026!"),
            "role": "doctor",
            "licenseNumber": "DOC-DEMO-001",
            "institution": "EndoBone AI Demo Hospital",
            "created_at": "2026-01-01T00:00:00Z",
        }

        if self.is_connected and self.db is not None:
            existing_admin = await self.db.doctors.find_one({"role": "admin"})
            if not existing_admin:
                await self.db.doctors.insert_one(demo_admin)
                print("[DATABASE] ✓ Seeded demo admin account: admin@endobone.ai")
            existing_doc = await self.db.doctors.find_one({"_id": "doc_demo_001"})
            if not existing_doc:
                await self.db.doctors.insert_one(demo_doctor)
                print("[DATABASE] ✓ Seeded demo doctor account: doctor.demo@gmail.com")
        else:
            local = self.get_local_data()
            doctors = local.get("doctors", [])
            has_admin = any(d.get("role") == "admin" for d in doctors)
            if not has_admin:
                doctors.append(demo_admin)
                print("[DATABASE] ✓ Seeded demo admin account: admin@endobone.ai")
            has_demo_doc = any(d.get("_id") == "doc_demo_001" for d in doctors)
            if not has_demo_doc:
                doctors.append(demo_doctor)
                print("[DATABASE] ✓ Seeded demo doctor account: doctor.demo@gmail.com")
            local["doctors"] = doctors
            self.save_local_data(local)

    async def close_database_connection(self):
        if self.client:
            self.client.close()
            print("[DATABASE] MongoDB connection closed.")

    def get_local_data(self) -> Dict[str, List[Any]]:
        for p in self.local_store_paths:
            if os.path.exists(p):
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if data and (data.get("cases") or data.get("biomarkers")):
                            return data
                except Exception:
                    pass
        # Default built-in seed
        return {
            "cases": [
                {
                    "_id": "case_peb_8842_a",
                    "case_id": "PEB-8842-A",
                    "model_id": "01",
                    "patient_name": "Patient A (Eleanor Vance)",
                    "patient_age": 68,
                    "patient_gender": "Female",
                    "clinical_indication": "L4-L5 Discectomy & Fusion",
                    "mrn": "MRN-892834",
                    "procedure": "L4-L5 Discectomy & Fusion",
                    "status": "active",
                    "referral_date": "2024-08-10",
                    "scheduled_date": "2024-10-24",
                    "clinician": "Dr. James Morrison, MD",
                    "created_at": "2024-08-14T08:30:00Z",
                    "updated_at": "2024-08-14T08:30:00Z"
                },
                {
                    "_id": "case_peb_8841_b",
                    "case_id": "PEB-8841-B",
                    "model_id": "02",
                    "patient_name": "Patient B (Arthur Pendelton)",
                    "patient_age": 72,
                    "patient_gender": "Male",
                    "clinical_indication": "Proximal Femur ORIF",
                    "mrn": "MRN-892835",
                    "procedure": "Proximal Femur ORIF",
                    "status": "pending-review",
                    "referral_date": "2024-08-01",
                    "scheduled_date": "2024-09-15",
                    "clinician": "Dr. Sarah Chen, MD",
                    "created_at": "2024-08-12T09:15:00Z",
                    "updated_at": "2024-08-12T09:15:00Z"
                },
                {
                    "_id": "case_peb_8840_c",
                    "case_id": "PEB-8840-C",
                    "model_id": "03",
                    "patient_name": "Patient C (Clara Oswald)",
                    "patient_age": 65,
                    "patient_gender": "Female",
                    "clinical_indication": "Vertebroplasty L3",
                    "mrn": "MRN-892836",
                    "procedure": "Vertebroplasty L3",
                    "status": "completed",
                    "referral_date": "2024-07-25",
                    "scheduled_date": "2024-11-01",
                    "clinician": "Dr. Michael Zhang, MD",
                    "created_at": "2024-08-08T11:00:00Z",
                    "updated_at": "2024-08-08T11:00:00Z"
                },
                {
                    "_id": "case_peb_8839_d",
                    "case_id": "PEB-8839-D",
                    "model_id": "01",
                    "patient_name": "Patient D (David Miller)",
                    "patient_age": 75,
                    "patient_gender": "Male",
                    "clinical_indication": "T12-L1 Fusion",
                    "mrn": "MRN-892837",
                    "procedure": "T12-L1 Fusion",
                    "status": "active",
                    "referral_date": "2024-08-05",
                    "scheduled_date": "2024-10-10",
                    "clinician": "Dr. Patricia Kumar, MD",
                    "created_at": "2024-08-05T14:20:00Z",
                    "updated_at": "2024-08-05T14:20:00Z"
                }
            ],
            "biomarkers": [
                {
                    "_id": "bm_peb_8842_a",
                    "case_id": "PEB-8842-A",
                    "pth": 85.2,
                    "vitamin_d": 18.5,
                    "calcium": 8.2,
                    "phosphate": 3.1,
                    "alp": 85.0,
                    "tsh": 1.8,
                    "free_t4": 1.1,
                    "ctx": 450.0,
                    "updated_at": "2024-08-14T08:30:00Z"
                },
                {
                    "_id": "bm_peb_8841_b",
                    "case_id": "PEB-8841-B",
                    "pth": 72.5,
                    "vitamin_d": 22.3,
                    "calcium": 9.1,
                    "phosphate": 3.4,
                    "alp": 92.0,
                    "tsh": 2.1,
                    "free_t4": 1.3,
                    "ctx": 420.0,
                    "updated_at": "2024-08-12T09:15:00Z"
                },
                {
                    "_id": "bm_peb_8840_c",
                    "case_id": "PEB-8840-C",
                    "pth": 48.2,
                    "vitamin_d": 42.1,
                    "calcium": 9.4,
                    "phosphate": 3.3,
                    "alp": 78.0,
                    "tsh": 1.5,
                    "free_t4": 1.2,
                    "ctx": 250.0,
                    "updated_at": "2024-08-08T11:00:00Z"
                },
                {
                    "_id": "bm_peb_8839_d",
                    "case_id": "PEB-8839-D",
                    "pth": 62.0,
                    "vitamin_d": 28.5,
                    "calcium": 9.0,
                    "phosphate": 3.6,
                    "alp": 82.0,
                    "tsh": 1.9,
                    "free_t4": 1.0,
                    "ctx": 310.0,
                    "updated_at": "2024-08-05T14:20:00Z"
                }
            ]
        }

    def save_local_data(self, data: Dict[str, List[Any]]):
        target = self.local_store_paths[0]
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

db_manager = DatabaseManager()

async def get_database() -> Optional[AsyncIOMotorDatabase]:
    return db_manager.db
