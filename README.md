# UX Research Copilot

> AI-powered multi-agent system for automating UX research synthesis

Automate the extraction of insights and themes from interview transcripts and research documents using GPT-3.5-turbo.

## What This Does

- Processes interview transcripts, surveys, and research documents (PDF, DOCX, TXT)
- Extracts key insights, quotes, and themes using GPT-3.5-turbo
- Groups related insights into thematic clusters with priority scoring
- Generates executive summaries and detailed reports
- Provides real-time processing status and session management

## Quick Start

### Prerequisites
- Python 3.8+ 
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- Redis (for session management)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd ux-research-copilot
```

### 2. Create Virtual Environment
```bash
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Mac/Linux)  
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment
Create a `.env` file:
```env
OPENAI_API_KEY=your_actual_api_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
DEBUG=True
```

### 5. Install and Start Redis
```bash
# Mac (with Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# Windows - Download from https://redis.io/download
```

### 6. Run the Application
```bash
# Terminal 1: Start Redis (if not auto-started)
redis-server

# Terminal 2: Start API
uvicorn main:app --reload --port 8001

# Terminal 3: Start Frontend  
streamlit run streamlit_app.py
```

Open http://localhost:8501 in your browser.

## Required Files

### requirements.txt
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
streamlit==1.28.1
langchain==0.0.350
langchain-openai==0.0.2
openai==1.3.7
sentence-transformers==2.2.2
pydantic==2.5.0
redis==5.0.1
python-docx==0.8.11
PyPDF2==3.0.1
python-multipart==0.0.6
python-dotenv==1.0.0
```

### Core Files Structure
```
ux-research-copilot/
├── main.py              # FastAPI backend
├── agents.py            # Multi-agent processing system
├── models.py            # Data models
├── config.py            # Configuration
├── streamlit_app.py     # Frontend interface
├── requirements.txt     # Dependencies
├── .env                 # Environment variables
└── outputs/             # Generated reports
```

### models.py
```python
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class ProcessingStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class InsightData(BaseModel):
    quote: str = Field(description="Exact quote from transcript")
    speaker: Optional[str] = Field(description="Speaker identifier if available")
    theme: str = Field(description="Primary theme category")
    sentiment: str = Field(description="Positive, Negative, or Neutral")
    confidence: float = Field(description="Confidence score 0-1")
    context: str = Field(description="Surrounding context")
    timestamp: Optional[str] = Field(description="Timestamp if available")

class ThemeCluster(BaseModel):
    theme_name: str = Field(description="Theme name")
    insights: List[InsightData] = Field(description="Related insights")
    frequency: int = Field(description="Number of mentions")
    priority: str = Field(description="High, Medium, or Low")
    summary: str = Field(description="Theme summary")
```

### config.py
```python
import os
from dotenv import load_dotenv
from dataclasses import dataclass

load_dotenv()

@dataclass
class AgentConfig:
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    redis_host: str = os.getenv("REDIS_HOST", "localhost")
    redis_port: int = int(os.getenv("REDIS_PORT", "6379"))
    embedding_model: str = "all-MiniLM-L6-v2"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    max_tokens: int = 2000
    temperature: float = 0.1
    debug: bool = os.getenv("DEBUG", "False").lower() == "true"

CONFIG = AgentConfig()
```

## How to Use

### 1. Upload Research Files
- Upload interview transcripts (PDF, DOCX, TXT)
- Multiple files can be processed together
- Supported formats: PDF, Microsoft Word documents, plain text

### 2. Start Processing
- Click "Start Processing" in the Streamlit interface
- Monitor real-time progress updates
- Processing typically takes 2-5 minutes depending on file size

### 3. View Results
- **Results Tab**: View themes, insights, and key quotes
- **Session Status**: Monitor processing progress
- **Download Reports**: Get structured deliverables

### 4. Download Outputs
- Executive Summary (markdown)
- Detailed Insights Report (markdown)
- Full JSON Report (structured data)

## Architecture

### Multi-Agent System
The system uses four specialized agents that process data sequentially:

1. **DocumentIngestor** - Processes files and creates manageable text chunks
2. **InsightAnalyzer** - Uses GPT-3.5-turbo to extract quotes, themes, and sentiment
3. **ThemeSynthesizer** - Groups related insights and generates thematic summaries
4. **OutputFormatter** - Creates structured reports and deliverables

### Tech Stack
- **Backend**: FastAPI with async processing
- **Frontend**: Streamlit for user interface
- **AI**: OpenAI GPT-3.5-turbo via LangChain
- **Storage**: Redis for session management, local files for outputs
- **Processing**: Multi-agent architecture with error handling

## API Endpoints

- `POST /api/v1/process-files` - Upload and process research files
- `GET /api/v1/session/{session_id}/status` - Check processing status
- `GET /api/v1/session/{session_id}/results` - Retrieve completed analysis
- `GET /api/v1/session/{session_id}/download/{report_type}` - Download specific reports
- `GET /api/v1/health` - System health check

## Troubleshooting

### Common Issues

**"Cannot connect to API"**
```bash
# Ensure API is running on correct port
uvicorn main:app --reload --port 8001
```

**"Redis connection failed"**
```bash
# Start Redis server
redis-server

# Test Redis connection
redis-cli ping
# Should return: PONG
```

**"OpenAI API key not configured"**
- Verify your `.env` file contains a valid OpenAI API key
- Check the key has sufficient credits and permissions

**"Processing failed"**
- Check file formats are supported
- Ensure files aren't corrupted
- Verify file size is reasonable (<10MB per file)

### Debug Mode
Set `DEBUG=True` in your `.env` file for detailed logging.

## Sample Results

### Input
- 2 interview transcripts (mobile app usability study)

### Output
- **4 key themes** identified (Navigation Issues, Feature Requests, Performance Concerns, User Goals)
- **11 insights** extracted with confidence scores
- **Processing time**: 2.1 minutes
- **Reports generated**: Executive summary, detailed insights, JSON data

### Sample Insight
```json
{
  "quote": "I couldn't find the search function - it took me three tries to locate it",
  "theme": "Navigation Issues", 
  "sentiment": "Negative",
  "confidence": 0.92,
  "context": "User attempting to search for specific content"
}
```

## Use Cases

### Ideal For
- **UX Researchers** - Automate synthesis of user interviews
- **Product Teams** - Extract insights from user feedback sessions
- **Design Teams** - Process usability testing results
- **Consultants** - Analyze client research data efficiently

### Supported Content
- User interview transcripts
- Usability testing sessions
- Survey open-ended responses
- Focus group discussions
- Customer feedback forms

## Security & Privacy

- **Local Processing**: Files processed locally, only text sent to OpenAI API
- **Temporary Storage**: Uploaded files deleted after processing
- **Session Management**: Results expire after 24 hours in Redis
- **Environment Variables**: Sensitive data stored in environment files

## Customization

### Modify Analysis Prompts
Edit `agents.py` to customize how insights are extracted:

```python
# In InsightAnalyzer class, modify the prompt template
self.insight_prompt = PromptTemplate(
    template="""
    Focus on [your specific research areas]...
    Look for insights related to [your domain]...
    """
)
```

### Add Custom Output Formats
Extend the `OutputFormatter` class to generate additional report types.

### Integration Options
- Connect to Slack for notifications
- Export to Google Sheets or Airtable
- Integrate with existing research tools

## Performance Notes

- **Processing Speed**: ~2-5 minutes per session (varies by file size)
- **Concurrent Users**: Supports multiple simultaneous sessions
- **File Limits**: Up to 20 documents per session, 10MB per file
- **API Costs**: Approximately $0.50-2.00 per session depending on content volume

## Development

### Project Structure
The codebase follows a modular architecture where each agent has a specific responsibility, making it easy to modify or extend individual components.

### Adding Features
1. Create new agent classes inheriting from `BaseAgent`
2. Implement the required `process()` method
3. Add the agent to the orchestration pipeline
4. Update the frontend to display new outputs

### Testing
Verify your setup works correctly:
```bash
# Test Redis connection
redis-cli ping

# Test API endpoints
curl http://localhost:8001/api/v1/health

# Test with small sample file through the interface
```

## Contributing

Areas for improvement:
- Support for additional file formats (Excel, Google Docs)
- Advanced analytics and trend analysis
- Integration with popular research tools
- Enhanced UI/UX features
- Performance optimizations

## License

MIT License - Free for commercial and personal use.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify your environment configuration
3. Test with small sample files first
4. Review application logs for specific error messages

Built with Python, FastAPI, Streamlit, and OpenAI's GPT-3.5-turbo API.