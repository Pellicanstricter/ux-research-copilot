# main.py - FastAPI Application
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from typing import List as TypingList
import tempfile
import os
import logging
from pathlib import Path
from datetime import datetime
import redis

from config import CONFIG
from agents import UXResearchOrchestrator
from models import ProcessingStatus

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="UX Research Copilot API", 
    version="1.0.0",
    description="AI-powered multi-agent system for UX research synthesis"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/process-files")
async def process_files(
    background_tasks: BackgroundTasks,
    files: TypingList[UploadFile] = File(...)
):
    """Process uploaded research files"""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    # Validate OpenAI API key
    if not CONFIG.openai_api_key:
        raise HTTPException(
            status_code=500, 
            detail="OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file"
        )
    
    # Save uploaded files temporarily
    temp_paths = []
    try:
        for file in files:
            if not file.filename:
                continue
                
            # Validate file type
            allowed_extensions = {'.pdf', '.docx', '.doc', '.txt', '.csv'}
            file_extension = Path(file.filename).suffix.lower()
            
            if file_extension not in allowed_extensions:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Unsupported file type: {file_extension}. Supported: {', '.join(allowed_extensions)}"
                )
            
            # Save to temporary location
            with tempfile.NamedTemporaryFile(
                delete=False, 
                suffix=file_extension,
                prefix="ux_research_"
            ) as temp_file:
                content = await file.read()
                temp_file.write(content)
                temp_paths.append(temp_file.name)
        
        # Generate session ID directly
        import hashlib
        from datetime import datetime

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        random_suffix = hashlib.md5(str(datetime.now()).encode()).hexdigest()[:8]
        session_id = f"ux_research_{timestamp}_{random_suffix}"

        background_tasks.add_task(
            process_files_background,
            temp_paths,
            session_id
        )
        
        return JSONResponse({
            "session_id": session_id,
            "status": "processing",
            "message": f"Processing {len(temp_paths)} files",
            "files_uploaded": len(temp_paths)
        })
        
    except Exception as e:
        # Cleanup temp files on error
        for path in temp_paths:
            try:
                os.unlink(path)
            except:
                pass
        raise HTTPException(status_code=500, detail=str(e))

async def process_files_background(file_paths: TypingList[str], session_id: str):
    """Background task for file processing"""
    import redis
    
    # Initialize Redis connection
    redis_client = None
    try:
        redis_client = redis.Redis(
            host=CONFIG.redis_host,
            port=CONFIG.redis_port,
            password=CONFIG.redis_password if CONFIG.redis_password else None,
            decode_responses=True
        )
        redis_client.ping()
    except:
        logger.warning("Redis connection failed - continuing without session persistence")
    
    try:
        # Update status to processing
        if redis_client:
            redis_client.hmset(f"session:{session_id}", {
                'status': 'processing',
                'updated_at': datetime.now().isoformat()
            })
        
        # Process files
        orchestrator = UXResearchOrchestrator(CONFIG)
        results = await orchestrator.process_research_files_with_session(file_paths, session_id)
        
        # Update status to completed with results summary
        if redis_client:
            redis_client.hmset(f"session:{session_id}", {
                'status': 'completed',
                'updated_at': datetime.now().isoformat(),
                'insights_count': results.get('results', {}).get('insights_count', 0),
                'themes_count': results.get('results', {}).get('themes_count', 0),
                'personas_count': results.get('results', {}).get('personas_count', 0)
            })
        
        logger.info(f"Successfully processed session {session_id}")
        
    except Exception as e:
        logger.error(f"Background processing failed for session {session_id}: {str(e)}")
        
        # Update status to failed
        if redis_client:
            redis_client.hmset(f"session:{session_id}", {
                'status': 'failed',
                'updated_at': datetime.now().isoformat(),
                'error_message': str(e)
            })
        
    finally:
        # Cleanup temporary files
        for path in file_paths:
            try:
                os.unlink(path)
            except:
                pass
@app.get("/api/v1/session/{session_id}/results")
async def get_session_results(session_id: str):
    """Get processing results for a completed session"""
    import redis
    import json
    
    try:
        redis_client = redis.Redis(
            host=CONFIG.redis_host,
            port=CONFIG.redis_port,
            password=CONFIG.redis_password if CONFIG.redis_password else None,
            decode_responses=True
        )
        
        session_data = redis_client.hgetall(f"session:{session_id}")
        
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        status = session_data.get('status')
        if status != 'completed':
            raise HTTPException(
                status_code=400, 
                detail=f"Session not completed. Current status: {status}"
            )
        
        # Add debugging
        output_dir = Path(f"outputs/{session_id}")
        logger.info(f"Looking for results in: {output_dir.absolute()}")
        logger.info(f"Directory exists: {output_dir.exists()}")
        
        if output_dir.exists():
            files = list(output_dir.glob("*"))
            logger.info(f"Files found: {files}")
        
        if not output_dir.exists():
            logger.error(f"Output directory not found: {output_dir}")
            raise HTTPException(status_code=404, detail="Results not found")
        
        results = {}
        
        # Load JSON report
        json_path = output_dir / "research_synthesis.json"
        if json_path.exists():
            with open(json_path, 'r', encoding='utf-8') as f:
                results["full_report"] = json.load(f)
        else:
            logger.error(f"JSON report not found: {json_path}")
            # Create a minimal report from session data
            results["full_report"] = {
                "session_id": session_id,
                "summary": {
                    "total_insights": int(session_data.get('insights_count', 0)),
                    "themes_identified": int(session_data.get('themes_count', 0)),
                    "personas_created": int(session_data.get('personas_count', 0))
                },
                "status": "partial_results",
                "message": "Some results may be missing due to processing issues"
            }
        
        return JSONResponse(results)
        
    except redis.ConnectionError:
        raise HTTPException(
            status_code=500, 
            detail="Redis connection failed. Please ensure Redis is running."
        )
    except Exception as e:
        logger.error(f"Error getting results for {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/session/{session_id}/status")
async def get_session_status(session_id: str):
    """Get current status of a processing session"""
    import redis
    
    try:
        redis_client = redis.Redis(
            host=CONFIG.redis_host,
            port=CONFIG.redis_port,
            password=CONFIG.redis_password if CONFIG.redis_password else None,
            decode_responses=True
        )
        
        session_data = redis_client.hgetall(f"session:{session_id}")
        
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return JSONResponse(session_data)
        
    except redis.ConnectionError:
        raise HTTPException(
            status_code=500, 
            detail="Redis connection failed"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        # Load results from output files
        output_dir = Path(f"outputs/{session_id}")
        
        if not output_dir.exists():
            logger.error(f"Output directory not found: {output_dir}")
            raise HTTPException(status_code=404, detail="Results not found")
        
        results = {}
        
        # Load JSON report
        json_path = output_dir / "research_synthesis.json"
        if json_path.exists():
            with open(json_path, 'r', encoding='utf-8') as f:
                results["full_report"] = json.load(f)
        else:
            logger.error(f"JSON report not found: {json_path}")
            # Create a minimal report from session data
            results["full_report"] = {
                "session_id": session_id,
                "summary": {
                    "total_insights": int(session_data.get('insights_count', 0)),
                    "themes_identified": int(session_data.get('themes_count', 0)),
                    "personas_created": int(session_data.get('personas_count', 0))
                },
                "status": "partial_results",
                "message": "Some results may be missing due to processing issues"
            }
        
        return JSONResponse(results)
        
    except redis.ConnectionError:
        raise HTTPException(
            status_code=500, 
            detail="Redis connection failed. Please ensure Redis is running."
        )
    except Exception as e:
        logger.error(f"Error getting results for {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/session/{session_id}/save")
async def save_report(session_id: str, request: dict):
    """Save a report with a custom name"""
    try:
        redis_client = redis.Redis(
            host=CONFIG.redis_host,
            port=CONFIG.redis_port,
            password=CONFIG.redis_password if CONFIG.redis_password else None,
            decode_responses=True
        )

        report_name = request.get('report_name', 'Untitled Report')

        # Store the report name and metadata in Redis
        saved_report_key = f"saved_report:{session_id}"
        redis_client.hset(saved_report_key, mapping={
            'report_name': report_name,
            'session_id': session_id,
            'saved_at': datetime.now().isoformat(),
            'status': 'saved'
        })

        # Add to list of saved reports
        redis_client.sadd('saved_reports_list', session_id)

        logger.info(f"Report saved: {report_name} (Session: {session_id})")

        return {
            "status": "success",
            "message": "Report saved successfully",
            "report_name": report_name,
            "session_id": session_id
        }

    except Exception as e:
        logger.error(f"Error saving report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/saved-reports")
async def get_saved_reports():
    """Get list of all saved reports"""
    try:
        redis_client = redis.Redis(
            host=CONFIG.redis_host,
            port=CONFIG.redis_port,
            password=CONFIG.redis_password if CONFIG.redis_password else None,
            decode_responses=True
        )

        session_ids = redis_client.smembers('saved_reports_list')
        reports = []

        for session_id in session_ids:
            report_data = redis_client.hgetall(f"saved_report:{session_id}")
            if report_data:
                reports.append(report_data)

        # Sort by saved_at descending
        reports.sort(key=lambda x: x.get('saved_at', ''), reverse=True)

        return {"reports": reports}

    except Exception as e:
        logger.error(f"Error getting saved reports: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/session/{session_id}/download/{report_type}")
async def download_report(session_id: str, report_type: str):
    """Download specific report type"""
    output_dir = Path(f"outputs/{session_id}")
    
    file_mapping = {
        "json": "research_synthesis.json",
        "summary": "executive_summary.md",
        "insights": "detailed_insights.md",
        "personas": "persona_profiles.md"
    }
    
    if report_type not in file_mapping:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid report type. Available: {', '.join(file_mapping.keys())}"
        )
    
    file_path = output_dir / file_mapping[report_type]
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    
    return FileResponse(
        path=str(file_path),
        filename=f"{session_id}_{file_mapping[report_type]}",
        media_type="application/octet-stream"
    )

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    from datetime import datetime
    import redis
    
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {}
    }
    
    # Check Redis connection
    try:
        redis_client = redis.Redis(
            host=CONFIG.redis_host,
            port=CONFIG.redis_port,
            password=CONFIG.redis_password if CONFIG.redis_password else None,
            decode_responses=True
        )
        redis_client.ping()
        health_status["services"]["redis"] = "connected"
    except:
        health_status["services"]["redis"] = "disconnected"
        health_status["status"] = "unhealthy"
    
    # Check OpenAI API key
    health_status["services"]["openai"] = "configured" if CONFIG.openai_api_key else "missing_api_key"
    
    if not CONFIG.openai_api_key:
        health_status["status"] = "unhealthy"
    
    return health_status

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
