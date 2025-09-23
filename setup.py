# setup.py - Easy Setup Script
import os
import subprocess
import sys
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return False

def create_env_file():
    """Create .env file with template"""
    env_content = """# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Redis Configuration  
REDIS_HOST=localhost
REDIS_PORT=6379

# Application Configuration
DEBUG=True
LOG_LEVEL=INFO
"""
    
    env_path = Path(".env")
    if not env_path.exists():
        with open(env_path, 'w') as f:
            f.write(env_content)
        print("✅ Created .env file template")
        print("⚠️  Please edit .env file and add your OpenAI API key!")
    else:
        print("ℹ️  .env file already exists")

def create_sample_data():
    """Create sample data files"""
    sample_dir = Path("sample_data")
    sample_dir.mkdir(exist_ok=True)
    
    # Sample interview 1
    interview1_content = """Interviewer: Can you tell me about your experience using our mobile app?

User: Well, I've been using it for about 3 months now. Overall it's pretty good, but I have to say the navigation is sometimes confusing. Like, when I'm trying to find my order history, I expect it to be under "My Account" but it's actually under "Orders" which is separate.

Interviewer: That's interesting. Can you walk me through what you typically do when you open the app?

User: Sure. So I usually open it to check if my delivery is on time. But the tracking feature is buried - I have to go through like 3 different screens to find it. It should be right on the main page when I have an active order.

Interviewer: What would make the app more useful for you?

User: Honestly, just make things easier to find. And maybe send me notifications when my order status changes instead of me having to check manually all the time. I'm always worried I'll miss the delivery.

Interviewer: Any other feedback?

User: The app crashes sometimes when I'm trying to pay. It's really frustrating when you're in a hurry. And the search function doesn't work very well - I can never find what I'm looking for.
"""
    
    # Sample interview 2
    interview2_content = """Interviewer: How do you currently track your fitness goals?

Participant: I use a mix of apps, honestly. I have one for counting steps, another for workouts, and I write down my weight in a notebook. It's kind of a mess.

Interviewer: What frustrates you most about this process?

Participant: Having to switch between different apps all the time. And nothing talks to each other, so I can't see the big picture. Like, did my workout yesterday actually help me reach my weekly goal? I have no idea because the data is scattered everywhere.

Interviewer: If you could have one solution, what would it look like?

Participant: Something that just works together. All my fitness data in one place, and maybe it could tell me if I'm on track to meet my goals without me having to do math in my head. Simple charts or something visual would be great.

Participant: Also, I want to see my progress over time. Like, am I actually getting fitter? The current apps just show me today's data, but I want to see trends.

Interviewer: What about social features?

Participant: That would be nice! Maybe I could share my achievements with friends or join challenges. That would motivate me to keep going.
"""
    
    # Write sample files
    with open(sample_dir / "interview_1.txt", 'w') as f:
        f.write(interview1_content)
    
    with open(sample_dir / "interview_2.txt", 'w') as f:
        f.write(interview2_content)
    
    print("✅ Created sample interview files")

def main():
    """Main setup function"""
    print("🚀 UX Research Copilot Setup")
    print("=" * 40)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        sys.exit(1)
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    
    # Create virtual environment
    if not Path("venv").exists():
        if not run_command(f"{sys.executable} -m venv venv", "Creating virtual environment"):
            print("❌ Failed to create virtual environment")
            return
    else:
        print("ℹ️  Virtual environment already exists")
    
    # Determine activation command
    if os.name == 'nt':  # Windows
        activate_cmd = "venv\\Scripts\\activate"
        pip_cmd = "venv\\Scripts\\pip"
    else:  # Unix/MacOS
        activate_cmd = "source venv/bin/activate"
        pip_cmd = "venv/bin/pip"
    
    # Install requirements
    if not run_command(f"{pip_cmd} install --upgrade pip", "Upgrading pip"):
        print("⚠️  Failed to upgrade pip, continuing...")
    
    if not run_command(f"{pip_cmd} install -r requirements.txt", "Installing Python packages"):
        print("❌ Failed to install requirements")
        return
    
    # Create directories
    Path("outputs").mkdir(exist_ok=True)
    Path("tests").mkdir(exist_ok=True)
    print("✅ Created output directories")
    
    # Create configuration files
    create_env_file()
    create_sample_data()
    
    # Create test file
    test_content = """# test_setup.py - Test the setup
import os
import sys
sys.path.append('.')

from config import CONFIG

def test_configuration():
    print("🔧 Testing configuration...")
    print(f"OpenAI API Key configured: {'Yes' if CONFIG.openai_api_key else 'No'}")
    print(f"Redis Host: {CONFIG.redis_host}")
    print(f"Redis Port: {CONFIG.redis_port}")
    
    # Test Redis connection
    try:
        import redis
        r = redis.Redis(host=CONFIG.redis_host, port=CONFIG.redis_port, socket_connect_timeout=5)
        r.ping()
        print("✅ Redis connection: Success")
    except Exception as e:
        print(f"❌ Redis connection: Failed - {e}")
        print("💡 Make sure Redis is installed and running")
    
    # Test OpenAI (basic import)
    if CONFIG.openai_api_key and CONFIG.openai_api_key != "your_openai_api_key_here":
        try:
            from openai import OpenAI
            print("✅ OpenAI library: Available")
        except Exception as e:
            print(f"❌ OpenAI library: Failed - {e}")
    else:
        print("⚠️  OpenAI API key not configured")

if __name__ == "__main__":
    test_configuration()
"""
    
    with open("test_setup.py", 'w') as f:
        f.write(test_content)
    
    print("\n🎉 Setup completed!")
    print("\n📋 Next steps:")
    print("1. Edit .env file and add your OpenAI API key")
    print("2. Install and start Redis:")
    print("   - Windows: choco install redis-64")
    print("   - Mac: brew install redis && brew services start redis")
    print("   - Ubuntu: sudo apt install redis-server")
    print("3. Test your setup: python test_setup.py")
    print("4. Run the application:")
    print(f"   - Activate environment: {activate_cmd}")
    print("   - Start API: uvicorn main:app --reload")
    print("   - Start frontend: streamlit run streamlit_app.py")
    
    print("\n🔗 Useful links:")
    print("- Get OpenAI API key: https://platform.openai.com/api-keys")
    print("- API docs (after starting): http://localhost:8000/docs")
    print("- Frontend (after starting): http://localhost:8501")

if __name__ == "__main__":
    main()