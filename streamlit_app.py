# streamlit_app.py - Clean Frontend Interface
import streamlit as st
import requests
import time
import json
from pathlib import Path
import os
from datetime import datetime

# Configure page
st.set_page_config(
    page_title="UX Research Copilot",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Constants
DEFAULT_API_URL = "http://localhost:8001"

@st.cache_data(show_spinner=False, ttl=5)
def get_json(url, timeout=10):
    """Helper to safely fetch JSON from an API endpoint with error handling."""
    try:
        r = requests.get(url, timeout=timeout)
        if r.ok:
            return r.json(), None
        return None, f"HTTP {r.status_code}"
    except requests.exceptions.ConnectionError:
        return None, "connection"
    except Exception as e:
        return None, str(e)

def main():
    """Main Streamlit application"""
    
    st.title("UX Research Copilot")
    st.markdown("**Automate your UX research synthesis with AI-powered multi-agent analysis**")
    
    # Sidebar for configuration
    with st.sidebar:
        st.header("Configuration")
        
        api_base_url = st.text_input(
            "API Base URL", 
            value=DEFAULT_API_URL,
            help="Base URL for the UX Research Copilot API"
        )
        
        # Test API connection
        if st.button("Test Connection"):
            test_api_connection(api_base_url)
        
        st.header("About")
        st.markdown("""
        This system uses multiple AI agents to:
        - Process research transcripts
        - Extract key insights  
        - Identify themes
        - Create reports
        
        **Supported file types:**
        - PDF (.pdf)
        - Word documents (.docx, .doc)
        - Text files (.txt)
        """)
        
        st.header("Quick Start")
        st.markdown("""
        1. Upload your research files
        2. Click "Start Processing"
        3. Wait for completion
        4. Download your reports!
        """)
    
    # Main interface tabs
    tab1, tab2, tab3, tab4 = st.tabs(["Upload & Process", "Results", "Session Status", "System Info"])
    
    with tab1:
        upload_and_process_tab(api_base_url)
    
    with tab2:
        results_tab(api_base_url)
    
    with tab3:
        session_status_tab(api_base_url)
        
    with tab4:
        system_info_tab(api_base_url)

def test_api_connection(api_base_url):
    """Test connection to the API"""
    try:
        response = requests.get(f"{api_base_url}/api/v1/health", timeout=5)
        
        if response.status_code == 200:
            health_data = response.json()
            st.success("API connection successful!")
            
            # Show service status
            services = health_data.get("services", {})
            for service, status in services.items():
                if status == "connected" or status == "configured":
                    st.success(f"{service.title()}: {status}")
                else:
                    st.error(f"{service.title()}: {status}")
        else:
            st.error(f"API returned status code: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        st.error("Cannot connect to API. Make sure it's running!")
    except Exception as e:
        st.error(f"Error: {str(e)}")

def upload_and_process_tab(api_base_url):
    """Upload and process files tab"""
    st.header("Upload Research Files")
    
    # File uploader
    uploaded_files = st.file_uploader(
        "Choose research transcript files",
        type=['pdf', 'docx', 'doc', 'txt'],
        accept_multiple_files=True,
        help="Upload interview transcripts, survey responses, or other research documents"
    )
    
    if uploaded_files:
        st.success(f"{len(uploaded_files)} files selected")
        
        # Show file details
        with st.expander("File Details"):
            for file in uploaded_files:
                file_size = len(file.getvalue()) if hasattr(file, 'getvalue') else 'Unknown'
                st.write(f"- **{file.name}** ({file_size:,} bytes)")
    
    # Sample files section
    if not uploaded_files:
        st.subheader("Try with Sample Files")
        col1, col2 = st.columns(2)
        with col1:
            if st.button("Use Sample Interview Transcripts"):
                st.info("Sample files would be loaded here in a full implementation")
                st.markdown("""
                **Sample files include:**
                - Mobile app usability interview
                - Fitness app user research session
                - E-commerce checkout flow feedback
                """)
        with col2:
            if st.button("Download Sample Template"):
                sample_content = """# UX Research Interview Transcript Template

**Participant:** [Name/ID]
**Date:** [YYYY-MM-DD]
**Duration:** [Minutes]
**Moderator:** [Name]

## Background Questions
Q: Tell me about your experience with [product/service]
A: [Response]

## Task 1: [Task Name]
[Describe the task]

**Observations:**
- [Key observation 1]
- [Key observation 2]

**Quotes:**
"[Direct quote from participant]"

## Post-Task Questions
Q: How did that feel?
A: [Response]

---
[Continue with additional tasks and questions]
"""
                st.download_button(
                    label="Download Sample Transcript",
                    data=sample_content,
                    file_name="sample_interview_transcript.txt",
                    mime="text/plain"
                )
    
    # Processing section
    st.subheader("Start Processing")
    
    if not uploaded_files:
        st.info("Please upload files first")
    
    process_button_disabled = not uploaded_files
    
    if st.button("Start Processing", disabled=process_button_disabled):
        if not uploaded_files:
            st.error("Please upload files first!")
            return
            
        with st.spinner("Uploading files and starting processing..."):
            try:
                # Prepare files for upload
                files = []
                for uploaded_file in uploaded_files:
                    files.append(
                        ('files', (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type))
                    )
                
                # Send to API
                response = requests.post(f"{api_base_url}/api/v1/process-files", files=files)
                
                if response.status_code == 200:
                    result = response.json()
                    st.session_state.current_session_id = result["session_id"]
                    
                    st.success("Processing started")
                    st.info(f"Session ID: `{result['session_id']}`")
                    st.info("Go to the **Results** tab to monitor progress.")
                    
                    # Auto-refresh after 3 seconds
                    time.sleep(3)
                    st.rerun()
                else:
                    error_detail = response.json().get("detail", "Unknown error")
                    st.error(f"Error: {error_detail}")
                    
            except requests.exceptions.ConnectionError:
                st.error("Cannot connect to API. Make sure it's running!")
            except Exception as e:
                st.error(f"Error: {str(e)}")

def results_tab(api_base_url):
    """Results display tab"""
    st.header("Processing Results")
    
    # Session selection
    st.subheader("Session Selection")
    
    # Manual session ID input
    manual_session = st.text_input(
        "Enter Session ID",
        placeholder="ux_research_20250920_124213_da7217cf",
        help="Enter the session ID you want to view results for"
    )
    
    # Determine which session to use
    session_id = None
    if manual_session:
        session_id = manual_session
        st.info(f"Using manual session: `{session_id}`")
    elif 'current_session_id' in st.session_state:
        session_id = st.session_state.current_session_id
        st.info(f"Current Session: `{session_id}`")
        
        # Add option to clear current session
        if st.button("Clear Current Session"):
            del st.session_state.current_session_id
            st.success("Session cleared. Enter a session ID manually above.")
            st.rerun()
    else:
        st.info("Upload and process files first, or enter a session ID manually")
        return
    
    # Test the session ID before proceeding
    try:
        test_response = requests.get(f"{api_base_url}/api/v1/session/{session_id}/status", timeout=5)
        if test_response.status_code == 404:
            st.error(f"Session `{session_id}` not found")
            st.write("**Troubleshooting steps:**")
            st.write("1. Check that the session ID is correct")
            st.write("2. Verify the backend processed this session")
            st.write("3. Check backend logs for the actual session ID")
            return
        elif test_response.status_code != 200:
            st.error(f"Error checking session: HTTP {test_response.status_code}")
            return
    except requests.exceptions.ConnectionError:
        st.error("Cannot connect to API. Make sure it's running!")
        return
    except Exception as e:
        st.error(f"Error: {str(e)}")
        return
    
    # Manual refresh button
    if st.button("🔄 Refresh Results"):
        st.rerun()
    
    try:
        # Get session status
        status_response = requests.get(f"{api_base_url}/api/v1/session/{session_id}/status")
        
        if status_response.status_code == 200:
            status_data = status_response.json()
            status = status_data.get('status', 'unknown')
            
            if status == 'completed':
                st.success("Processing completed!")
                
                # Get and display results
                results_response = requests.get(f"{api_base_url}/api/v1/session/{session_id}/results")
                if results_response.status_code == 200:
                    results = results_response.json()
                    display_results(results, api_base_url, session_id)
                else:
                    st.error(f"Failed to load results: HTTP {results_response.status_code}")
                    
            elif status == 'processing':
                st.info("Processing in progress...")
                
                # Show progress
                current_phase = status_data.get('current_phase', 'unknown')
                st.write(f"**Current Phase:** {current_phase.replace('_', ' ').title()}")
                
                progress_col1, progress_col2, progress_col3 = st.columns(3)
                
                with progress_col1:
                    st.metric("Files", status_data.get('file_count', 0))
                
                with progress_col2:
                    st.metric("Insights", status_data.get('insights_extracted', 0))
                
                with progress_col3:
                    st.metric("Themes", status_data.get('themes_identified', 0))
                
                # Auto-refresh every 5 seconds when processing
                time.sleep(5)
                st.rerun()
                
            elif status == 'failed':
                st.error(f"Processing failed: {status_data.get('error_message', 'Unknown error')}")
                
            else:
                st.warning(f"Unknown status: {status}")
                
        else:
            st.error(f"Failed to get session status: HTTP {status_response.status_code}")
            
    except requests.exceptions.ConnectionError:
        st.error("Cannot connect to API. Make sure it's running!")
    except Exception as e:
        st.error(f"Error: {str(e)}")

def extract_key_quotes(report, limit=12):
    """Collect top quotes from all themes/insights."""
    quotes = []
    for theme in report.get("themes", []):
        theme_name = theme.get("theme_name", "Unnamed Theme")
        for ins in theme.get("insights", []):
            q = ins.get("quote")
            if not q:
                continue
            quotes.append({
                "quote": q.strip(),
                "theme": theme_name,
                "sentiment": ins.get("sentiment", "Neutral"),
                "confidence": float(ins.get("confidence", 0.0)),
            })
    # sort by confidence desc, then truncate
    quotes.sort(key=lambda x: x["confidence"], reverse=True)
    # dedupe quotes while preserving order
    seen = set()
    deduped = []
    for q in quotes:
        key = q["quote"]
        if key in seen:
            continue
        seen.add(key)
        deduped.append(q)
        if len(deduped) >= limit:
            break
    return deduped

def display_results(results, api_base_url, session_id):
    """Display processing results"""
    if "full_report" not in results:
        st.error("No results data found")
        st.write(f"Available keys: {list(results.keys())}")
        return

    report = results["full_report"]

    # Summary metrics
    st.subheader("Processing Summary")
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric(
            "Total Insights",
            report.get("summary", {}).get("total_insights", 0),
            help="Number of key insights extracted from transcripts"
        )
    with col2:
        st.metric(
            "Themes Identified",
            report.get("summary", {}).get("themes_identified", 0),
            help="Number of thematic clusters discovered"
        )
    with col3:
        st.metric(
            "Files Processed",
            report.get("summary", {}).get("files_processed", 0),
            help="Total files successfully processed"
        )

    # Executive Summary
    st.subheader("Executive Summary")
    exec_summary = (
        report.get("executive_summary")
        or report.get("summary", {}).get("executive_summary")
        or report.get("summary", {}).get("high_level_summary")
    )
    if exec_summary:
        with st.expander("View executive summary", expanded=True):
            st.markdown(exec_summary)
    else:
        st.info("No executive summary available. You can still download the report below.")

    # Download section
    st.subheader("Download Reports")
    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("Executive Summary"):
            download_file(api_base_url, session_id, "summary")
    with col2:
        if st.button("Detailed Insights"):
            download_file(api_base_url, session_id, "insights")
    with col3:
        if st.button("JSON Report"):
            download_file(api_base_url, session_id, "json")

    # Themes & Top Insights
    st.subheader("Key Themes")
    themes = report.get("themes", [])
    if not themes:
        st.info("No themes identified")
    else:
        for theme in themes:
            name = theme.get('theme_name', 'Unnamed Theme')
            priority = theme.get('priority', 'Unknown')
            freq = theme.get('frequency', 0)

            with st.expander(f"{name} ({priority} Priority — {freq} mentions)"):
                # Summary
                if theme.get("summary"):
                    st.write("**Summary**")
                    st.write(theme["summary"])

                # Top insights
                insights = theme.get("insights", [])
                if insights:
                    st.write("**Top Insights**")
                    for ins in insights[:3]:  # show top 3 per theme
                        quote = ins.get('quote')
                        st.markdown(f"- {ins.get('title','Insight')}")
                        if quote:
                            st.caption(f'"{quote}"')
                        conf = ins.get('confidence')
                        if conf is not None:
                            st.caption(f"Confidence: {float(conf):.2f}")
                else:
                    st.caption("No insights found for this theme.")

    # Global Key Quotes
    st.subheader("Key Quotes")
    quote_filter = st.text_input("Filter quotes (search text, theme, or sentiment)", "")
    key_quotes = extract_key_quotes(report, limit=12)
    if not key_quotes:
        st.info("No quotes available yet.")
    else:
        for q in key_quotes:
            if quote_filter:
                blob = " ".join([
                    q["quote"].lower(),
                    q["theme"].lower(),
                    q["sentiment"].lower()
                ])
                if quote_filter.lower() not in blob:
                    continue
            st.markdown(f'> "{q["quote"]}"')
            st.caption(f"{q['theme']} • {q['sentiment']} • Confidence {q['confidence']:.2f}")

def download_file(api_base_url, session_id, report_type):
    """Download file from API"""
    try:
        response = requests.get(f"{api_base_url}/api/v1/session/{session_id}/download/{report_type}")
        
        if response.status_code == 200:
            # Create download link
            st.success(f"{report_type.capitalize()} report ready!")
            
            file_extension = "json" if report_type == "json" else "md"
            file_name = f"ux_research_{report_type}_{session_id}.{file_extension}"
            
            st.download_button(
                label=f"Download {report_type.capitalize()} Report",
                data=response.content,
                file_name=file_name,
                mime="application/octet-stream",
                key=f"download_{report_type}_{session_id}"
            )
        else:
            st.error(f"Failed to download {report_type} report")
            
    except Exception as e:
        st.error(f"Error downloading file: {str(e)}")

def session_status_tab(api_base_url):
    """Session management tab"""
    st.header("Session Management")
    
    # Current session info
    if 'current_session_id' in st.session_state:
        st.info(f"Current Session: `{st.session_state.current_session_id}`")
    
    # Manual session lookup
    st.subheader("Check Any Session")
    
    session_id_input = st.text_input(
        "Enter Session ID",
        value=st.session_state.get('current_session_id', ''),
        help="Enter a session ID to check its status"
    )
    
    if st.button("Check Status") and session_id_input:
        try:
            response = requests.get(f"{api_base_url}/api/v1/session/{session_id_input}/status")
            
            if response.status_code == 200:
                status_data = response.json()
                
                # Metrics
                col1, col2, col3, col4 = st.columns(4)
                
                with col1:
                    st.metric("Status", status_data.get('status', 'Unknown').title())
                
                with col2:
                    st.metric("Files", status_data.get('file_count', 0))
                
                with col3:
                    st.metric("Insights", status_data.get('insights_extracted', 0))
                
                with col4:
                    st.metric("Themes", status_data.get('themes_identified', 0))
                
                # Detailed status
                st.subheader("Session Details")
                
                # Format timestamps
                created_at = status_data.get('created_at', 'Unknown')
                updated_at = status_data.get('updated_at', 'Unknown')
                
                if created_at != 'Unknown':
                    try:
                        created_dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        created_at = created_dt.strftime("%Y-%m-%d %H:%M:%S UTC")
                    except:
                        pass
                
                if updated_at != 'Unknown':
                    try:
                        updated_dt = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
                        updated_at = updated_dt.strftime("%Y-%m-%d %H:%M:%S UTC")
                    except:
                        pass
                
                session_details = {
                    "Session ID": status_data.get('session_id', session_id_input),
                    "Status": status_data.get('status', 'Unknown'),
                    "Created": created_at,
                    "Last Updated": updated_at,
                    "Files Processed": status_data.get('file_count', 0),
                    "Insights Extracted": status_data.get('insights_extracted', 0),
                    "Themes Identified": status_data.get('themes_identified', 0),
                }
                
                if status_data.get('error_message'):
                    session_details["Error"] = status_data.get('error_message')
                
                for key, value in session_details.items():
                    st.write(f"**{key}:** {value}")
                
                # Raw data
                with st.expander("Raw Session Data"):
                    st.json(status_data)
                    
            else:
                st.error("Session not found or API error")
                
        except requests.exceptions.ConnectionError:
            st.error("Cannot connect to API. Make sure it's running!")
        except Exception as e:
            st.error(f"Error: {str(e)}")

def system_info_tab(api_base_url):
    """System information tab"""
    st.header("System Information")
    
    # API Health Check
    st.subheader("API Health")
    
    try:
        response = requests.get(f"{api_base_url}/api/v1/health", timeout=5)
        
        if response.status_code == 200:
            health_data = response.json()
            
            # Overall status
            overall_status = health_data.get("status", "unknown")
            if overall_status == "healthy":
                st.success("System is healthy")
            else:
                st.error("System has issues")
            
            # Service status
            st.subheader("Service Status")
            services = health_data.get("services", {})
            
            for service, status in services.items():
                col1, col2 = st.columns([1, 3])
                
                with col1:
                    st.write(f"**{service.title()}:**")
                
                with col2:
                    if status in ["connected", "configured"]:
                        st.success(f"{status}")
                    else:
                        st.error(f"{status}")
            
            # Timestamp
            timestamp = health_data.get("timestamp", "Unknown")
            st.caption(f"Last checked: {timestamp}")
            
        else:
            st.error(f"API health check failed (Status: {response.status_code})")
            
    except requests.exceptions.ConnectionError:
        st.error("Cannot connect to API. Please check if the API is running.")
    except Exception as e:
        st.error(f"Error checking API health: {str(e)}")
    
    # Configuration Info
    st.subheader("Configuration")
    
    config_info = {
        "API URL": api_base_url,
        "Frontend": "Streamlit",
        "Python Version": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}"
    }
    
    for key, value in config_info.items():
        st.write(f"**{key}:** {value}")
    
    # Troubleshooting
    st.subheader("Troubleshooting")
    
    with st.expander("Common Issues & Solutions"):
        st.markdown("""
        **API Connection Failed:**
        - Make sure the API is running: `uvicorn main:app --reload`
        - Check if the API URL is correct
        - Verify no firewall is blocking the connection
        
        **Redis Connection Failed:**
        - Start Redis server: `redis-server`
        - Check Redis is running on the correct port (6379)
        - Verify Redis configuration in .env file
        
        **OpenAI API Key Issues:**
        - Make sure OPENAI_API_KEY is set in your .env file
        - Verify the API key is valid and has credits
        - Check OpenAI API status
        
        **File Upload Issues:**
        - Ensure files are supported formats (PDF, DOCX, TXT)
        - Check file size limits
        - Verify files are not corrupted
        """)
    
    # Logs section
    st.subheader("Recent Activity")
    st.info("In a production system, this would show recent processing logs and activities")

if __name__ == "__main__":
    main()