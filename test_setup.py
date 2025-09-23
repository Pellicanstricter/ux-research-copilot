import os
from config import CONFIG

def test_configuration():
    print("Testing configuration...")
    print(f"OpenAI API Key present: {'Yes' if CONFIG.openai_api_key else 'No'}")
    print(f"Redis Host: {CONFIG.redis_host}")
    print(f"Redis Port: {CONFIG.redis_port}")
    
    # Test Redis connection
    try:
        import redis
        r = redis.Redis(host=CONFIG.redis_host, port=CONFIG.redis_port)
        r.ping()
        print("Redis connection: ✅ Success")
    except Exception as e:
        print(f"Redis connection: ❌ Failed - {e}")
    
    # Test OpenAI
    if CONFIG.openai_api_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=CONFIG.openai_api_key)
            # Test with a simple completion
            print("OpenAI connection: ✅ Success")
        except Exception as e:
            print(f"OpenAI connection: ❌ Failed - {e}")

if __name__ == "__main__":
    test_configuration()