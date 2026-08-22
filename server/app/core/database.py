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
    local_store_path: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
        "data",
        "bone_health_store.json"
    )

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

    async def close_database_connection(self):
        if self.client:
            self.client.close()
            print("[DATABASE] MongoDB connection closed.")

    def get_local_data(self) -> Dict[str, List[Any]]:
        if os.path.exists(self.local_store_path):
            try:
                with open(self.local_store_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {"cases": [], "biomarkers": []}

    def save_local_data(self, data: Dict[str, List[Any]]):
        os.makedirs(os.path.dirname(self.local_store_path), exist_ok=True)
        with open(self.local_store_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

db_manager = DatabaseManager()

async def get_database() -> Optional[AsyncIOMotorDatabase]:
    return db_manager.db
