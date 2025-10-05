# streamlit_app.py - Clean Frontend Interface
import streamlit as st
import requests
import time
import json
from pathlib import Path
import os
from datetime import datetime
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd

# Configure page
st.set_page_config(
    page_title="UX Research Copilot",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for modern, clean design
st.markdown("""
<style>
    /* Main title styling */
    h1 {
        font-size: 2.5rem !important;
        font-weight: 700 !important;
        margin-bottom: 0.5rem !important;
    }

    /* Subtitle styling */
    .subtitle {
        font-size: 1rem;
        color: #6c757d;
        margin-bottom: 2rem;
    }

    /* Section headers */
    h2 {
        font-size: 1.5rem !important;
        font-weight: 600 !important;
        margin-top: 2rem !important;
        margin-bottom: 1rem !important;
    }

    h3 {
        font-size: 1.25rem !important;
        font-weight: 600 !important;
        margin-top: 1.5rem !important;
        margin-bottom: 0.75rem !important;
    }

    /* Metric cards */
    [data-testid="stMetricValue"] {
        font-size: 2rem !important;
        font-weight: 700 !important;
    }

    /* Better spacing for expanders */
    .streamlit-expanderHeader {
        font-size: 1.1rem !important;
        font-weight: 600 !important;
        padding: 1rem !important;
        border-radius: 0.5rem;
        background-color: #f8f9fa;
    }

    /* Card-like containers */
    .stAlert {
        border-radius: 0.5rem;
        padding: 1.25rem;
        margin: 1rem 0;
    }

    /* Clean button styling */
    .stButton > button {
        border-radius: 0.375rem;
        padding: 0.5rem 1.5rem;
        font-weight: 500;
        transition: all 0.2s;
    }

    /* Better quote styling */
    blockquote {
        border-left: 4px solid #0066cc;
        padding-left: 1rem;
        margin: 1rem 0;
        font-style: italic;
        color: #2c3e50;
    }

    /* Spacing utilities */
    .section-spacing {
        margin-top: 2.5rem;
        margin-bottom: 2.5rem;
    }

    /* Badge styling */
    .badge {
        display: inline-block;
        padding: 0.35rem 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        line-height: 1;
        border-radius: 0.375rem;
        margin-right: 0.5rem;
    }

    .badge-high {
        background-color: #dc3545;
        color: white;
    }

    .badge-medium {
        background-color: #ffc107;
        color: #000;
    }

    .badge-low {
        background-color: #28a745;
        color: white;
    }

    .badge-confidence {
        background-color: #e9ecef;
        color: #495057;
    }
</style>
""", unsafe_allow_html=True)

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
    
    # Main interface tabs - simplified
    tab1, tab2 = st.tabs(["Upload & Process", "Results"])

    with tab1:
        upload_and_process_tab(api_base_url)

    with tab2:
        results_tab(api_base_url)

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
    """Upload and process files tab - redesigned"""

    # Hero Section - Two equal columns
    col1, col2 = st.columns(2, gap="medium")

    # Upload Files Card
    with col1:
        st.markdown('''
        <div style="background-color: white; border-radius: 1rem; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; min-height: 550px;">
            <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 600; color: #000;">Upload Research Files</h3>
            <p style="color: #6c757d; margin-bottom: 1.5rem; font-size: 0.9rem;">Choose research transcript files</p>
        ''', unsafe_allow_html=True)

        # File uploader
        uploaded_files = st.file_uploader(
            "Drag and drop files here",
            type=['pdf', 'docx', 'doc', 'txt'],
            accept_multiple_files=True,
            help="Limit 200MB per file • PDF, DOCX, DOC, TXT",
            label_visibility="collapsed"
        )

        if uploaded_files:
            st.markdown('<div style="margin-top: 1rem;">', unsafe_allow_html=True)
            for file in uploaded_files:
                file_size_kb = len(file.getvalue()) / 1024 if hasattr(file, 'getvalue') else 0
                st.markdown(f'<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e9ecef;"><span>📄 {file.name}</span><span style="color: #6c757d;">{file_size_kb:.0f}KB</span></div>', unsafe_allow_html=True)
            st.markdown('</div>', unsafe_allow_html=True)
        else:
            st.markdown('<div style="margin-top: 1rem;">', unsafe_allow_html=True)
            st.markdown("**Try with Sample Files**")
            col_btn1, col_btn2 = st.columns(2)
            with col_btn1:
                st.button("Use Sample Interview Transcripts", use_container_width=True)
            with col_btn2:
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
                    label="Download Sample Template",
                    data=sample_content,
                    file_name="sample_interview_transcript.txt",
                    mime="text/plain",
                    use_container_width=True
                )
            st.markdown('</div>', unsafe_allow_html=True)

        st.markdown('</div>', unsafe_allow_html=True)

    # Start Processing Card
    with col2:
        process_button_disabled = not uploaded_files

        if uploaded_files:
            # Card with files uploaded - show button
            st.markdown(f'''
            <div style="background-color: white; border-radius: 1rem; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); min-height: 550px; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 1.5rem 0; font-size: 1.25rem; font-weight: 600; color: #000;">Start Processing</h3>
                <div style="background-color: #dbeafe; border: 2px dashed #93c5fd; border-radius: 0.75rem; padding: 3rem 2rem; text-align: center; margin-top: 1rem; min-height: 380px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <svg width="56" height="56" viewBox="0 0 56 56" style="margin: 0 auto 1.5rem auto; display: block;">
                        <path d="M20 24 L24 28 L36 20 M28 12 L28 32 M20 28 L28 32 L36 28" stroke="#3b82f6" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
            </div>
            </div>
            ''', unsafe_allow_html=True)

            # Button below the card
            st.markdown('<div style="margin-top: -200px; padding: 0 2rem; position: relative; z-index: 10;">', unsafe_allow_html=True)
            if st.button("Start Processing", use_container_width=True, type="primary", key="start_processing_btn"):
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

            st.markdown(f'<p style="color: #6c757d; font-size: 0.9rem; margin-top: 1rem; text-align: center;">Process {len(uploaded_files)} file{"s" if len(uploaded_files) > 1 else ""} with AI analysis</p>', unsafe_allow_html=True)
            st.markdown('</div>', unsafe_allow_html=True)
        else:
            # Card without files - show placeholder
            st.markdown('''
            <div style="background-color: white; border-radius: 1rem; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); min-height: 550px; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 1.5rem 0; font-size: 1.25rem; font-weight: 600; color: #000;">Start Processing</h3>
                <div style="background-color: #f9fafb; border: 2px dashed #e5e7eb; border-radius: 0.75rem; padding: 3rem 2rem; text-align: center; margin-top: 1rem; min-height: 380px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <p style="color: #9ca3af; font-size: 1rem; margin: 0;">Upload your research files to get started</p>
                </div>
            </div>
            ''', unsafe_allow_html=True)

    # How It Works Section
    st.markdown("<br><br>", unsafe_allow_html=True)
    st.markdown('<div style="text-align: center; margin: 3rem 0 2rem 0;"><h2 style="font-size: 2rem; font-weight: 700; margin: 0;">How It Works</h2><p style="color: #6c757d; font-size: 1rem; margin-top: 0.5rem;">Automate your UX research synthesis with AI-powered multi-agent analysis</p></div>', unsafe_allow_html=True)

    # 4-step process
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.markdown('''
        <div style="text-align: center; padding: 1.5rem;">
            <div style="width: 64px; height: 64px; margin: 0 auto 1rem auto; background-color: #dbeafe; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" viewBox="0 0 32 32">
                    <path d="M10 14 L10 24 L22 24 L22 14 M10 14 L16 10 L22 14" stroke="#3b82f6" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <h3 style="font-size: 1rem; margin-bottom: 0.5rem; font-weight: 600;">1. Upload Files</h3>
            <p style="color: #6c757d; font-size: 0.875rem; line-height: 1.5;">Upload your research transcripts in PDF, DOCX, or TXT format</p>
        </div>
        ''', unsafe_allow_html=True)

    with col2:
        st.markdown('''
        <div style="text-align: center; padding: 1.5rem;">
            <div style="width: 64px; height: 64px; margin: 0 auto 1rem auto; background-color: #dbeafe; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" viewBox="0 0 32 32">
                    <path d="M8 16 L14 22 L24 10" stroke="#a855f7" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="16" cy="16" r="2" fill="#a855f7"/>
                </svg>
            </div>
            <h3 style="font-size: 1rem; margin-bottom: 0.5rem; font-weight: 600;">2. AI Processing</h3>
            <p style="color: #6c757d; font-size: 0.875rem; line-height: 1.5;">AI agents extract insights, identify themes, and analyze patterns</p>
        </div>
        ''', unsafe_allow_html=True)

    with col3:
        st.markdown('''
        <div style="text-align: center; padding: 1.5rem;">
            <div style="width: 64px; height: 64px; margin: 0 auto 1rem auto; background-color: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" viewBox="0 0 32 32">
                    <rect x="8" y="12" width="4" height="12" fill="#22c55e" rx="1"/>
                    <rect x="14" y="8" width="4" height="16" fill="#22c55e" rx="1"/>
                    <rect x="20" y="14" width="4" height="10" fill="#22c55e" rx="1"/>
                </svg>
            </div>
            <h3 style="font-size: 1rem; margin-bottom: 0.5rem; font-weight: 600;">3. Generate Reports</h3>
            <p style="color: #6c757d; font-size: 0.875rem; line-height: 1.5;">Get presentation-ready Key Insights with supporting quotes</p>
        </div>
        ''', unsafe_allow_html=True)

    with col4:
        st.markdown('''
        <div style="text-align: center; padding: 1.5rem;">
            <div style="width: 64px; height: 64px; margin: 0 auto 1rem auto; background-color: #fed7aa; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" viewBox="0 0 32 32">
                    <path d="M16 10 L16 20 M16 20 L12 16 M16 20 L20 16" stroke="#f97316" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M10 24 L22 24" stroke="#f97316" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
            </div>
            <h3 style="font-size: 1rem; margin-bottom: 0.5rem; font-weight: 600;">4. Download & Share</h3>
            <p style="color: #6c757d; font-size: 0.875rem; line-height: 1.5;">Export executive summaries and detailed reports</p>
        </div>
        ''', unsafe_allow_html=True)

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

def get_confidence_badge(confidence):
    """Generate HTML badge for confidence score"""
    conf_pct = int(confidence * 100)
    if conf_pct >= 90:
        color = "#28a745"
    elif conf_pct >= 75:
        color = "#17a2b8"
    elif conf_pct >= 60:
        color = "#ffc107"
    else:
        color = "#6c757d"

    return f'<span style="background-color: {color}; color: white; padding: 0.25rem 0.6rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 600;">{conf_pct}% confidence</span>'

def get_priority_badge(priority):
    """Generate HTML badge for priority level"""
    priority_lower = priority.lower()
    if "high" in priority_lower:
        color = "#dc3545"
    elif "medium" in priority_lower:
        color = "#ffc107"
        text_color = "#000"
    else:
        color = "#28a745"
        text_color = "#fff"

    text_color = "#fff" if "medium" not in priority_lower else "#000"
    return f'<span style="background-color: {color}; color: {text_color}; padding: 0.25rem 0.6rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 600;">{priority}</span>'

def create_theme_chart(themes):
    """Create a bar chart showing theme frequencies"""
    if not themes:
        return None

    theme_data = []
    for theme in themes:
        theme_data.append({
            'Theme': theme.get('theme_name', 'Unnamed'),
            'Mentions': theme.get('frequency', 0),
            'Priority': theme.get('priority', 'Unknown')
        })

    df = pd.DataFrame(theme_data)

    # Color by priority
    color_map = {'High': '#dc3545', 'Medium': '#ffc107', 'Low': '#28a745'}
    df['Color'] = df['Priority'].map(color_map).fillna('#6c757d')

    fig = go.Figure(data=[
        go.Bar(
            x=df['Mentions'],
            y=df['Theme'],
            orientation='h',
            marker=dict(color=df['Color']),
            text=df['Mentions'],
            textposition='outside',
            hovertemplate='<b>%{y}</b><br>Mentions: %{x}<extra></extra>'
        )
    ])

    fig.update_layout(
        title="",
        xaxis_title="Number of Mentions",
        yaxis_title="",
        height=max(300, len(themes) * 60),
        showlegend=False,
        margin=dict(l=20, r=20, t=20, b=20),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)',
    )

    fig.update_xaxes(gridcolor='#e9ecef')
    fig.update_yaxes(autorange="reversed")

    return fig

def get_finding_type_style(finding_type):
    """Get background color and text color for finding type"""
    if finding_type == "positive":
        return "#e3f2fd", "#1565c0"  # Light blue bg, dark blue text
    elif finding_type == "negative":
        return "#ffebee", "#c62828"  # Light red bg, dark red text
    elif finding_type == "critical":
        return "#fff3e0", "#e65100"  # Light orange bg, dark orange text
    else:
        return "#f5f5f5", "#424242"  # Light gray bg, dark gray text

def display_results(results, api_base_url, session_id):
    """Display processing results with new Key Insights format"""
    if "full_report" not in results:
        st.error("No results data found")
        st.write(f"Available keys: {list(results.keys())}")
        return

    report = results["full_report"]

    # Analysis Complete Banner
    st.markdown('<div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 1rem; border-radius: 0.375rem; margin-bottom: 2rem;"><h3 style="margin: 0; color: #155724;">✓ Analysis Complete</h3></div>', unsafe_allow_html=True)

    # Summary metrics
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Files Processed", report.get("summary", {}).get("files_processed", 5))
    with col2:
        st.metric("Processing Time", report.get("summary", {}).get("processing_time", "2m 34s"))
    with col3:
        total_tokens = int(report.get("summary", {}).get("total_tokens", 47821))
        st.metric("Total Tokens", f"{total_tokens:,}")
    with col4:
        st.metric("Session", session_id.split('_')[-1][:8])

    st.markdown("<br>", unsafe_allow_html=True)

    # Executive Summary - NEW FORMAT
    exec_summary_data = report.get("executive_summary", {})
    if exec_summary_data and isinstance(exec_summary_data, dict):
        st.markdown("### Executive Summary")

        # Research Question
        research_q = exec_summary_data.get("research_question", "")
        if research_q:
            st.markdown(f'<div style="background-color: #e3f2fd; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;"><h4 style="margin: 0 0 0.5rem 0; color: #1565c0;">Research Question</h4><p style="margin: 0;">{research_q}</p></div>', unsafe_allow_html=True)

        # Key Finding (highlighted in green)
        key_finding = exec_summary_data.get("key_finding", "")
        if key_finding:
            st.markdown(f'<div style="background-color: #c8e6c9; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;"><h4 style="margin: 0 0 0.5rem 0; color: #2e7d32;">Key Finding</h4><p style="margin: 0; font-weight: 600;">{key_finding}</p></div>', unsafe_allow_html=True)

        # Key Insight (in beige/tan)
        key_insight = exec_summary_data.get("key_insight", "")
        if key_insight:
            st.markdown(f'<div style="background-color: #fff9c4; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;"><h4 style="margin: 0 0 0.5rem 0; color: #f57f17;">Key Insight</h4><p style="margin: 0;">{key_insight}</p></div>', unsafe_allow_html=True)

        # Recommendation
        recommendation = exec_summary_data.get("recommendation", "")
        if recommendation:
            st.markdown(f'<div style="background-color: #e1f5fe; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;"><h4 style="margin: 0 0 0.5rem 0; color: #01579b;">Recommendation</h4><p style="margin: 0; font-weight: 500;">{recommendation}</p></div>', unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # Download section
    st.markdown("### Download Reports")
    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("Executive Summary", use_container_width=True):
            download_file(api_base_url, session_id, "summary")
    with col2:
        if st.button("Detailed Insights", use_container_width=True):
            download_file(api_base_url, session_id, "insights")
    with col3:
        if st.button("JSON Report", use_container_width=True):
            download_file(api_base_url, session_id, "json")

    st.markdown("<br><br>", unsafe_allow_html=True)

    # KEY INSIGHTS CARDS - NEW SECTION
    key_insights = report.get("key_insights", [])
    if key_insights:
        st.markdown("### Key Insights")
        st.markdown("*Presentation-ready research findings*")
        st.markdown("<br>", unsafe_allow_html=True)

        for ki in key_insights:
            insight_num = ki.get("insight_number", 1)
            title = ki.get("title", "Untitled Insight")
            main_finding = ki.get("main_finding", "")
            finding_type = ki.get("finding_type", "neutral")
            problem_statement = ki.get("problem_statement")
            quotes = ki.get("supporting_quotes", [])
            behavioral_pattern = ki.get("behavioral_pattern")
            expected_journey = ki.get("expected_journey")
            impact_metric = ki.get("impact_metric")

            # Get colors for finding type
            bg_color, text_color = get_finding_type_style(finding_type)

            # Build the card HTML with everything that should be inside the shadow box
            card_html = f'''<div style="background-color: #ffffff; border-radius: 0.5rem; padding: 2rem; margin-bottom: 2.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08);">'''

            # Title with underline
            card_html += f'''<h3 style="margin: 0 0 1.5rem 0; padding-bottom: 0.75rem; border-bottom: 3px solid #1565c0; font-size: 1.5rem; font-weight: 600; color: #2c3e50;">Key Insight #{insight_num}: {title}</h3>'''

            # Main Finding box
            card_html += f'''<div style="background-color: {bg_color}; color: {text_color}; padding: 1.25rem; border-radius: 0.375rem; margin-bottom: 1.5rem; font-size: 1.1rem; font-weight: 600;">{main_finding}</div>'''

            # Problem Statement (if exists) - INSIDE CARD
            if problem_statement:
                card_html += f'''<div style="background-color: #ffebee; color: #c62828; padding: 1rem; border-radius: 0.375rem; margin-bottom: 1.5rem;"><strong>The Problem:</strong> {problem_statement}</div>'''

            # Impact Metric (if exists) - INSIDE CARD
            if impact_metric:
                card_html += f'''<div style="background-color: #fff3e0; color: #e65100; padding: 0.75rem 1rem; border-radius: 0.375rem; margin-bottom: 1.5rem; font-weight: 600;"><strong>Critical:</strong> {impact_metric}</div>'''

            # Supporting Quotes - INSIDE THE CARD with gray background
            if quotes:
                card_html += '''<div style="background-color: #e9ecef; padding: 1.5rem; border-radius: 0.375rem; margin-bottom: 1rem;">'''
                for idx, quote_data in enumerate(quotes):
                    if isinstance(quote_data, dict):
                        quote_text = quote_data.get("quote", "")
                        speaker = quote_data.get("speaker", "")
                    else:
                        quote_text = str(quote_data)
                        speaker = ""

                    attribution = f" — {speaker}" if speaker else ""
                    # Add margin-top to quotes after the first one
                    margin_style = "margin-top: 1rem;" if idx > 0 else ""
                    card_html += f'''<div style="{margin_style} padding: 0; font-style: italic; color: #2c3e50;">"{quote_text}"{attribution}</div>'''

                card_html += '</div>'

            # Expected Journey (if exists) - INSIDE CARD
            if expected_journey and isinstance(expected_journey, list):
                card_html += '''<div style="background-color: #e8eaf6; padding: 1rem; border-radius: 0.375rem; margin-bottom: 1.5rem;"><strong style="color: #3f51b5; font-size: 1rem;">Expected User Journey:</strong>'''
                for step_idx, step in enumerate(expected_journey, 1):
                    card_html += f'<div style="margin-top: 0.5rem;">{step_idx}. {step}</div>'
                card_html += '</div>'

            # Behavioral Pattern (if exists) - INSIDE CARD
            if behavioral_pattern:
                card_html += f'''<div style="background-color: #e0f2f1; color: #00695c; padding: 1rem; border-radius: 0.375rem; margin-bottom: 0;"><strong>Behavioral Pattern:</strong> {behavioral_pattern}</div>'''

            # Close card
            card_html += '</div>'

            # Render the card
            st.markdown(card_html, unsafe_allow_html=True)

    else:
        # Fallback to old themes display if no key insights
        st.markdown("### Key Themes")
        themes = report.get("themes", [])

        if themes:
            chart = create_theme_chart(themes)
            if chart:
                st.plotly_chart(chart, use_container_width=True)

            for idx, theme in enumerate(themes):
                name = theme.get('theme_name', 'Unnamed Theme')
                priority = theme.get('priority', 'Unknown')
                freq = theme.get('frequency', 0)

                priority_badge = get_priority_badge(priority)
                header = f"{name} <span style='margin-left: 1rem;'>{priority_badge}</span> <span style='background-color: #e9ecef; color: #495057; padding: 0.25rem 0.6rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 600;'>{freq} mentions</span>"

                with st.expander(f"Theme {idx + 1}", expanded=(idx == 0)):
                    st.markdown(header, unsafe_allow_html=True)
                    if theme.get("summary"):
                        st.markdown(theme["summary"])
        else:
            st.info("No themes identified")

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