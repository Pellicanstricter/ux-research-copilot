import os
from dotenv import load_dotenv
from dataclasses import dataclass

load_dotenv()

@dataclass
class AgentConfig:
    """Configuration for the multi-agent system"""
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    redis_host: str = os.getenv("REDIS_HOST", "localhost")
    redis_port: int = int(os.getenv("REDIS_PORT", "6379"))
    embedding_model: str = "all-MiniLM-L6-v2"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    max_tokens: int = 2000
    temperature: float = 0.1
    debug: bool = os.getenv("DEBUG", "False").lower() == "true"

# Global configuration instance
CONFIG = AgentConfig()