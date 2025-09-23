# agents.py - Clean Working Version
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Tuple
import asyncio
import logging
from datetime import datetime
import json
import re
import hashlib
from pathlib import Path
import os

# External dependencies
try:
    import faiss
    import numpy as np
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("⚠️  Some optional dependencies missing - continuing without them")

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
import redis
import docx
import PyPDF2

from models import InsightData, ThemeCluster, PersonaData, ProcessingStatus
from config import AgentConfig

# Configure logging
logging.basicConfig(level=logging.INFO)

# Base Agent Interface
class BaseAgent(ABC):
    """Abstract base class for all agents in the system"""
    
    def __init__(self, config: AgentConfig, session_id: str):
        self.config = config
        self.session_id = session_id
        self.logger = logging.getLogger(f"{self.__class__.__name__}")
        
        try:
            self.redis_client = redis.Redis(
                host=config.redis_host, 
                port=config.redis_port, 
                decode_responses=True
            )
            # Test connection
            self.redis_client.ping()
        except redis.ConnectionError:
            self.logger.warning("Redis connection failed - running without session persistence")
            self.redis_client = None
        
    @abstractmethod
    async def process(self, input_data: Any) -> Any:
        """Process input data and return results"""
        pass
    
    def update_session_status(self, status: ProcessingStatus, **kwargs):
        """Update session status in Redis"""
        if not self.redis_client:
            return
            
        try:
            session_key = f"session:{self.session_id}"
            session_data = self.redis_client.hgetall(session_key)
            
            session_data.update({
                'status': status.value,
                'updated_at': datetime.now().isoformat(),
                **kwargs
            })
            
            self.redis_client.hset(session_key, mapping=session_data)
        except Exception as e:
            self.logger.warning(f"Failed to update session status: {e}")

# Agent 1: Document Ingestor
class DocumentIngestor(BaseAgent):
    """Processes and chunks transcript files with metadata extraction"""
    
    def __init__(self, config: AgentConfig, session_id: str):
        super().__init__(config, session_id)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=config.chunk_size,
            chunk_overlap=config.chunk_overlap,
            length_function=len
        )
    
    async def process(self, file_paths: List[str]) -> List[Document]:
        """Process multiple files and return chunked documents"""
        self.update_session_status(ProcessingStatus.PROCESSING)
        
        try:
            all_documents = []
            
            for file_path in file_paths:
                documents = await self._process_single_file(file_path)
                all_documents.extend(documents)
            
            self.logger.info(f"Processed {len(file_paths)} files into {len(all_documents)} chunks")
            return all_documents
            
        except Exception as e:
            self.logger.error(f"Error processing files: {str(e)}")
            self.update_session_status(ProcessingStatus.FAILED, error_message=str(e))
            raise
    
    async def _process_single_file(self, file_path: str) -> List[Document]:
        """Process a single file based on its type"""
        path = Path(file_path)
        
        try:
            if path.suffix.lower() == '.pdf':
                text = self._extract_from_pdf(file_path)
            elif path.suffix.lower() in ['.docx', '.doc']:
                text = self._extract_from_docx(file_path)
            elif path.suffix.lower() == '.txt':
                text = self._extract_from_txt(file_path)
            else:
                raise ValueError(f"Unsupported file type: {path.suffix}")
            
            # Clean and preprocess text
            text = self._preprocess_text(text)
            
            # Create base document with metadata
            base_doc = Document(
                page_content=text,
                metadata={
                    "source": str(path),
                    "filename": path.name,
                    "file_type": path.suffix,
                    "processed_at": datetime.now().isoformat(),
                    "session_id": self.session_id
                }
            )
            
            # Split into chunks
            chunks = self.text_splitter.split_documents([base_doc])
            
            # Add chunk-specific metadata
            for i, chunk in enumerate(chunks):
                chunk.metadata.update({
                    "chunk_id": i,
                    "total_chunks": len(chunks),
                    "chunk_hash": hashlib.md5(chunk.page_content.encode()).hexdigest()
                })
            
            return chunks
            
        except Exception as e:
            self.logger.error(f"Error processing {file_path}: {str(e)}")
            return []
    
    def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            self.logger.error(f"Error extracting PDF {file_path}: {e}")
            raise
        return text
    
    def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        except Exception as e:
            self.logger.error(f"Error extracting DOCX {file_path}: {e}")
            raise
        return text
    
    def _extract_from_txt(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except Exception as e:
            self.logger.error(f"Error extracting TXT {file_path}: {e}")
            raise
    
    def _preprocess_text(self, text: str) -> str:
        """Clean and preprocess text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s.,!?;:\-\'"()]', '', text)
        
        # Normalize speaker patterns
        text = re.sub(r'^([A-Za-z0-9\s]+):\s*', r'\1: ', text, flags=re.MULTILINE)
        
        return text.strip()

# Agent 2: Insight Analyzer
class InsightAnalyzer(BaseAgent):
    """Extracts key quotes and identifies themes using NLP"""
    
    def __init__(self, config: AgentConfig, session_id: str):
        super().__init__(config, session_id)
        
        if not config.openai_api_key:
            raise ValueError("OpenAI API key is required for InsightAnalyzer")
            
        self.llm = ChatOpenAI(
            api_key=config.openai_api_key,
            model="gpt-3.5-turbo",
            temperature=config.temperature,
            max_tokens=config.max_tokens
        )
        self.parser = JsonOutputParser(pydantic_object=InsightData)
        self._setup_prompts()
    
    def _setup_prompts(self):
        """Setup prompts for insight extraction"""
        self.insight_prompt = PromptTemplate(
            input_variables=["text_chunk"],
            template="""
            As an expert UX researcher, analyze the following transcript chunk and extract key insights.
            
            Transcript:
            {text_chunk}
            
            Extract insights focusing on:
            1. User pain points and frustrations
            2. User goals and motivations  
            3. Behavioral patterns
            4. Feature requests or suggestions
            5. Emotional reactions
            
            For each insight, provide:
            - Exact quote from the transcript
            - Speaker (if identifiable)
            - Theme category (e.g., "Navigation Issues", "Feature Request", "User Goal")
            - Sentiment (Positive, Negative, or Neutral)
            - Confidence score (0-1)
            - Context (brief description)
            - Timestamp (if available)
            
            Return a JSON list of insights. If no significant insights are found, return an empty list.
            
            {format_instructions}
            """
        ).partial(format_instructions=self.parser.get_format_instructions())

    async def process(self, documents: List[Document]) -> List[InsightData]:
        """Process documents and extract insights"""
        try:
            all_insights = []
            
            for doc in documents:
                chunk_insights = await self._analyze_chunk(doc.page_content)
                all_insights.extend(chunk_insights)
            
            # Remove duplicates
            unique_insights = self._deduplicate_insights(all_insights)
            
            self.logger.info(f"Extracted {len(unique_insights)} unique insights from {len(documents)} chunks")
            
            return unique_insights
            
        except Exception as e:
            self.logger.error(f"Error analyzing insights: {str(e)}")
            raise

    async def _analyze_chunk(self, chunk: str) -> List[InsightData]:
        """Analyze a single chunk and extract insights"""
        try:
            # Create the prompt for this chunk
            formatted_prompt = self.insight_prompt.format(text_chunk=chunk)
            
            # Make the API call
            response = await self.llm.ainvoke(formatted_prompt)
            
            # Parse the response
            try:
                insights_data = self.parser.parse(response.content)
                if isinstance(insights_data, list):
                    return [InsightData(**insight) for insight in insights_data]
                else:
                    return [InsightData(**insights_data)]
            except:
                # Fallback to simple parsing if JSON parsing fails
                return self._parse_insights_fallback(response.content)
            
        except Exception as e:
            self.logger.error(f"Error analyzing chunk: {str(e)}")
            return []

    def _parse_insights_fallback(self, response_text: str) -> List[InsightData]:
        """Fallback parsing when JSON parsing fails"""
        insights = []
        lines = response_text.strip().split('\n')
        
        current_insight = {}
        for line in lines:
            line = line.strip()
            if line.startswith('Quote:'):
                current_insight['quote'] = line.replace('Quote:', '').strip()
            elif line.startswith('Theme:'):
                current_insight['theme'] = line.replace('Theme:', '').strip()
            elif line.startswith('Sentiment:'):
                current_insight['sentiment'] = line.replace('Sentiment:', '').strip()
            elif line.startswith('Confidence:'):
                try:
                    current_insight['confidence'] = float(line.replace('Confidence:', '').strip())
                except:
                    current_insight['confidence'] = 0.5
            elif line.startswith('Context:'):
                current_insight['context'] = line.replace('Context:', '').strip()
                # Complete insight, add to list
                if 'quote' in current_insight and 'theme' in current_insight:
                    insight_data = InsightData(
                        quote=current_insight.get('quote', ''),
                        theme=current_insight.get('theme', 'General'),
                        sentiment=current_insight.get('sentiment', 'Neutral'),
                        confidence=current_insight.get('confidence', 0.5),
                        context=current_insight.get('context', ''),
                        speaker=current_insight.get('speaker'),
                        timestamp=current_insight.get('timestamp')
                    )
                    insights.append(insight_data)
                current_insight = {}
        
        return insights# Agent 2: Insight Analyzer
class InsightAnalyzer(BaseAgent):
    """Extracts key quotes and identifies themes using NLP"""
    
    def __init__(self, config: AgentConfig, session_id: str):
        super().__init__(config, session_id)
        
        if not config.openai_api_key:
            raise ValueError("OpenAI API key is required for InsightAnalyzer")
            
        self.llm = ChatOpenAI(
            api_key=config.openai_api_key,
            model="gpt-3.5-turbo",
            temperature=config.temperature,
            max_tokens=config.max_tokens
        )
        self.parser = JsonOutputParser(pydantic_object=InsightData)
        self._setup_prompts()
    
    def _setup_prompts(self):
        """Setup prompts for insight extraction"""
        self.insight_prompt = PromptTemplate(
            input_variables=["text_chunk"],
            template="""
            As an expert UX researcher, analyze the following transcript chunk and extract key insights.
            
            Transcript:
            {text_chunk}
            
            Extract insights focusing on:
            1. User pain points and frustrations
            2. User goals and motivations  
            3. Behavioral patterns
            4. Feature requests or suggestions
            5. Emotional reactions
            
            For each insight, provide:
            - Exact quote from the transcript
            - Speaker (if identifiable)
            - Theme category (e.g., "Navigation Issues", "Feature Request", "User Goal")
            - Sentiment (Positive, Negative, or Neutral)
            - Confidence score (0-1)
            - Context (brief description)
            - Timestamp (if available)
            
            Return a JSON list of insights. If no significant insights are found, return an empty list.
            
            {format_instructions}
            """
        ).partial(format_instructions=self.parser.get_format_instructions())

    async def process(self, documents: List[Document]) -> List[InsightData]:
        """Process documents and extract insights"""
        try:
            all_insights = []
            
            for doc in documents:
                chunk_insights = await self._analyze_chunk(doc.page_content)
                all_insights.extend(chunk_insights)
            
            # Remove duplicates
            unique_insights = self._deduplicate_insights(all_insights)
            
            self.logger.info(f"Extracted {len(unique_insights)} unique insights from {len(documents)} chunks")
            
            return unique_insights
            
        except Exception as e:
            self.logger.error(f"Error analyzing insights: {str(e)}")
            raise

    async def _analyze_chunk(self, chunk: str) -> List[InsightData]:
        """Analyze a single chunk and extract insights"""
        try:
            # Create the prompt for this chunk
            formatted_prompt = self.insight_prompt.format(text_chunk=chunk)
            
            # Make the API call
            response = await self.llm.ainvoke(formatted_prompt)
            
            # Parse the response
            try:
                insights_data = self.parser.parse(response.content)
                if isinstance(insights_data, list):
                    return [InsightData(**insight) for insight in insights_data]
                else:
                    return [InsightData(**insights_data)]
            except Exception as e:
                # Log the parsing error and the actual response
                self.logger.error(f"JSON parsing failed: {str(e)}")
                self.logger.error(f"Raw response content: {response.content[:500]}...")
                
                # Fallback to simple parsing if JSON parsing fails
                fallback_results = self._parse_insights_fallback(response.content)
                self.logger.info(f"Fallback parser returned {len(fallback_results)} insights")
                return fallback_results
            
        except Exception as e:
            self.logger.error(f"Error analyzing chunk: {str(e)}")
            return []

    def _parse_insights_fallback(self, response_text: str) -> List[InsightData]:
        """Fallback parsing when JSON parsing fails"""
        insights = []
        lines = response_text.strip().split('\n')
        
        current_insight = {}
        for line in lines:
            line = line.strip()
            if line.startswith('Quote:'):
                current_insight['quote'] = line.replace('Quote:', '').strip()
            elif line.startswith('Theme:'):
                current_insight['theme'] = line.replace('Theme:', '').strip()
            elif line.startswith('Sentiment:'):
                current_insight['sentiment'] = line.replace('Sentiment:', '').strip()
            elif line.startswith('Confidence:'):
                try:
                    current_insight['confidence'] = float(line.replace('Confidence:', '').strip())
                except:
                    current_insight['confidence'] = 0.5
            elif line.startswith('Context:'):
                current_insight['context'] = line.replace('Context:', '').strip()
                # Complete insight, add to list
                if 'quote' in current_insight and 'theme' in current_insight:
                    insight_data = InsightData(
                        quote=current_insight.get('quote', ''),
                        theme=current_insight.get('theme', 'General'),
                        sentiment=current_insight.get('sentiment', 'Neutral'),
                        confidence=current_insight.get('confidence', 0.5),
                        context=current_insight.get('context', ''),
                        speaker=current_insight.get('speaker'),
                        timestamp=current_insight.get('timestamp')
                    )
                    insights.append(insight_data)
                current_insight = {}
        
        return insights

    def _deduplicate_insights(self, insights: List[InsightData]) -> List[InsightData]:
        """Remove duplicate insights based on quote similarity"""
        unique_insights = []
        seen_quotes = set()
        
        for insight in insights:
            # Simple deduplication based on quote content
            quote_key = insight.quote.lower().strip()[:50]  # First 50 chars, normalized
            if quote_key not in seen_quotes:
                seen_quotes.add(quote_key)
                unique_insights.append(insight)
        
        return unique_insights
    
async def process(self, documents: List[Document]) -> List[InsightData]:
    """Process documents and extract insights"""
    try:
        all_insights = []
        
        for doc in documents:
            chunk_insights = await self._analyze_chunk(doc.page_content)
            all_insights.extend(chunk_insights)
        
        # Remove duplicates
        unique_insights = self._deduplicate_insights(all_insights)
        
        self.logger.info(f"Extracted {len(unique_insights)} unique insights from {len(documents)} chunks")
        self.update_session_status(
            ProcessingStatus.PROCESSING, 
            insights_extracted=len(unique_insights)
        )
        
        return unique_insights
        
    except Exception as e:
        self.logger.error(f"Error analyzing insights: {str(e)}")
        raise

async def _analyze_chunk(self, chunk: str) -> List[InsightData]:
    """Analyze a single chunk and extract insights"""
    try:
        # Create the prompt for this chunk
        formatted_prompt = self.insight_prompt.format(chunk=chunk)
        
        # Make the API call
        response = await self.llm.ainvoke(formatted_prompt)
        
        # Parse the response - expecting a list of insights
        insights_text = response.content
        
        # Basic parsing - you may need to adjust this based on your prompt format
        insights = []
        lines = insights_text.strip().split('\n')
        
        current_insight = {}
        for line in lines:
            line = line.strip()
            if line.startswith('Quote:'):
                current_insight['quote'] = line.replace('Quote:', '').strip()
            elif line.startswith('Theme:'):
                current_insight['theme'] = line.replace('Theme:', '').strip()
            elif line.startswith('Sentiment:'):
                current_insight['sentiment'] = line.replace('Sentiment:', '').strip()
            elif line.startswith('Confidence:'):
                try:
                    current_insight['confidence'] = float(line.replace('Confidence:', '').strip())
                except:
                    current_insight['confidence'] = 0.5
            elif line.startswith('Context:'):
                current_insight['context'] = line.replace('Context:', '').strip()
                # Complete insight, add to list
                if 'quote' in current_insight and 'theme' in current_insight:
                    insight_data = InsightData(
                        quote=current_insight.get('quote', ''),
                        theme=current_insight.get('theme', 'General'),
                        sentiment=current_insight.get('sentiment', 'Neutral'),
                        confidence=current_insight.get('confidence', 0.5),
                        context=current_insight.get('context', ''),
                        speaker=current_insight.get('speaker'),
                        timestamp=current_insight.get('timestamp')
                    )
                    insights.append(insight_data)
                current_insight = {}
        
        return insights
        
    except Exception as e:
        self.logger.error(f"Error analyzing chunk: {str(e)}")
        return []

def _deduplicate_insights(self, insights: List[InsightData]) -> List[InsightData]:
    """Remove duplicate insights based on quote similarity"""
    unique_insights = []
    seen_quotes = set()
    
    for insight in insights:
        # Simple deduplication based on quote content
        quote_key = insight.quote.lower().strip()[:50]  # First 50 chars, normalized
        if quote_key not in seen_quotes:
            seen_quotes.add(quote_key)
            unique_insights.append(insight)
    
    return unique_insights
    
async def _analyze_chunk(self, document: Document) -> List[InsightData]:
    """Analyze a single document chunk"""
    try:
        # Create a simple prompt without complex parsing
        simple_prompt = f"""
Extract insights from this user research text. Return valid JSON only:

{document.page_content}

Format as JSON array:
[{{"quote": "exact quote", "speaker": "User", "theme": "Theme Name", "sentiment": "Positive", "confidence": 0.8, "context": "brief description"}}]
"""
        
        response = await self.llm.ainvoke([{"role": "user", "content": simple_prompt}])
        
        # Parse JSON response
        import json
        content = response.content.strip()
        if content.startswith('```'):
            content = content.split('```')[1].replace('json', '').strip()
        
        data = json.loads(content)
        
        insights = []
        for item in data:
            insight = InsightData(
                quote=item.get('quote', ''),
                speaker=item.get('speaker'),
                theme=item.get('theme', 'General'),
                sentiment=item.get('sentiment', 'Neutral'),
                confidence=float(item.get('confidence', 0.5)),
                context=item.get('context', ''),
                timestamp=None
            )
            insights.append(insight)
        
        return insights
        
    except Exception as e:
        self.logger.error(f"Error in _analyze_chunk: {e}")
        return []

# Agent 3: Theme Synthesizer
class ThemeSynthesizer(BaseAgent):
    """Groups insights and generates personas/summaries"""
    
    def __init__(self, config: AgentConfig, session_id: str):
        super().__init__(config, session_id)
        
        if not config.openai_api_key:
            raise ValueError("OpenAI API key is required for ThemeSynthesizer")
            
        self.llm = ChatOpenAI(
            api_key=config.openai_api_key,
            model="gpt-3.5-turbo",
            temperature=config.temperature
        )
        
        try:
            self.embedding_model = SentenceTransformer(config.embedding_model)
        except Exception as e:
            self.logger.warning(f"Failed to load embedding model: {e}")
            self.embedding_model = None
            
        self._setup_prompts()
    
    def _setup_prompts(self):
        """Setup prompts for theme synthesis"""
        self.theme_prompt = PromptTemplate(
            input_variables=["insights"],
            template="""
            As a senior UX researcher, analyze these related insights and create a comprehensive theme summary.
            
            Insights:
            {insights}
            
            Create a theme that includes:
            1. A clear, descriptive theme name
            2. Priority level (High/Medium/Low) based on frequency and impact
            3. A comprehensive summary of the theme
            
            Return your analysis as a JSON object with the structure:
            {{
                "theme_name": "Clear Theme Name",
                "priority": "High/Medium/Low",
                "summary": "Detailed summary of the theme and its implications"
            }}
            """
        )
        
        self.persona_prompt = PromptTemplate(
            input_variables=["insights", "themes"],
            template="""
            Based on the following insights and themes, create 2-3 distinct user personas.
            
            Insights (first 20):
            {insights}
            
            Themes:
            {themes}
            
            For each persona, provide:
            1. A realistic name
            2. Demographics (age, occupation, tech comfort level)
            3. Primary goals related to the product/service
            4. Key pain points and frustrations
            5. Behavioral patterns
            6. Representative quotes from the research
            
            Return as a JSON list of personas.
            """
        )
    
    async def process(self, insights: List[InsightData]) -> List[ThemeCluster]:
        """Process insights to generate themes only"""
        try:
            # Cluster insights by theme similarity
            theme_clusters = await self._cluster_insights(insights)
            
            self.update_session_status(
                ProcessingStatus.PROCESSING,
                themes_identified=len(theme_clusters)
            )
            
            return theme_clusters
            
        except Exception as e:
            self.logger.error(f"Error synthesizing themes: {str(e)}")
            raise
    
    async def _cluster_insights(self, insights: List[InsightData]) -> List[ThemeCluster]:
        """Cluster insights by theme similarity"""
        if not insights:
            return []
        
        # Group insights by theme name
        theme_groups = {}
        for insight in insights:
            theme_name = insight.theme
            if theme_name not in theme_groups:
                theme_groups[theme_name] = []
            theme_groups[theme_name].append(insight)
        
        # Create theme clusters
        theme_clusters = []
        for theme_name, theme_insights in theme_groups.items():
            if len(theme_insights) >= 1:
                cluster = await self._create_theme_cluster(theme_name, theme_insights)
                theme_clusters.append(cluster)
        
        # Sort by frequency and priority
        theme_clusters.sort(key=lambda x: (x.priority == "High", x.frequency), reverse=True)
        
        return theme_clusters
    
    async def _create_theme_cluster(self, theme_name: str, insights: List[InsightData]) -> ThemeCluster:
        """Create a comprehensive theme cluster"""
        insights_text = "\n".join([
            f"- \"{insight.quote}\" (Sentiment: {insight.sentiment}, Confidence: {insight.confidence})"
            for insight in insights
        ])
        
        try:
            chain = self.theme_prompt | self.llm
            result = await chain.ainvoke({"insights": insights_text})
            
            # Parse the JSON response
            theme_data = json.loads(result.content)
            
            # Determine priority based on frequency and sentiment
            negative_count = sum(1 for insight in insights if insight.sentiment == "Negative")
            frequency = len(insights)
            
            if frequency >= 5 or (negative_count >= 2 and frequency >= 3):
                priority = "High"
            elif frequency >= 3:
                priority = "Medium"
            else:
                priority = "Low"
            
            return ThemeCluster(
                theme_name=theme_data.get("theme_name", theme_name),
                insights=insights,
                frequency=frequency,
                priority=priority,
                summary=theme_data.get("summary", f"Theme based on {frequency} insights")
            )
            
        except Exception as e:
            self.logger.warning(f"Error creating theme cluster: {str(e)}")
            # Fallback to basic cluster
            return ThemeCluster(
                theme_name=theme_name,
                insights=insights,
                frequency=len(insights),
                priority="Medium",
                summary=f"Theme identified from {len(insights)} user insights"
            )
    

# Agent 4: Output Formatter
class OutputFormatter(BaseAgent):
    """Creates structured deliverables for stakeholders"""
    
    def __init__(self, config: AgentConfig, session_id: str):
        super().__init__(config, session_id)
        self.output_dir = Path(f"outputs/{session_id}")
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    async def process(self, insights: List[InsightData], themes: List[ThemeCluster], 
                     personas: List[PersonaData]) -> Dict[str, str]:
        """Generate formatted outputs"""
        try:
            outputs = {}
            
            # Generate JSON report
            json_path = await self._create_json_report(insights, themes, personas)
            outputs["json_report"] = str(json_path)
            
            # Generate executive summary
            summary_path = await self._create_executive_summary(themes, personas)
            outputs["executive_summary"] = str(summary_path)
            
            # Generate detailed insights report
            insights_path = await self._create_insights_report(insights, themes)
            outputs["insights_report"] = str(insights_path)
            
            # Generate persona profiles
            personas_path = await self._create_persona_profiles(personas)
            outputs["persona_profiles"] = str(personas_path)
            
            self.update_session_status(ProcessingStatus.COMPLETED)
            
            return outputs
            
        except Exception as e:
            self.logger.error(f"Error formatting outputs: {str(e)}")
            self.update_session_status(ProcessingStatus.FAILED, error_message=str(e))
            raise
    
    async def _create_json_report(self, insights: List[InsightData], themes: List[ThemeCluster], 
                                 personas: List[PersonaData]) -> Path:
        """Create comprehensive JSON report"""
        report = {
            "session_id": self.session_id,
            "generated_at": datetime.now().isoformat(),
            "summary": {
                "total_insights": len(insights),
                "themes_identified": len(themes),
                "personas_created": len(personas)
            },
            "insights": [insight.dict() for insight in insights],
            "themes": [
                {
                    "theme_name": theme.theme_name,
                    "frequency": theme.frequency,
                    "priority": theme.priority,
                    "summary": theme.summary,
                    "insights": [insight.dict() for insight in theme.insights]
                }
                for theme in themes
            ],
            "personas": [persona.dict() for persona in personas]
        }
        
        json_path = self.output_dir / "research_synthesis.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        return json_path
    
    async def _create_executive_summary(self, themes: List[ThemeCluster], 
                                      personas: List[PersonaData]) -> Path:
        """Create executive summary document"""
        summary_content = f"""# UX Research Synthesis - Executive Summary

**Session ID:** {self.session_id}
**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M")}

## Key Findings

### Top Themes ({len(themes)} identified)
"""
        
        for theme in themes[:5]:  # Top 5 themes
            summary_content += f"""
#### {theme.theme_name} ({theme.priority} Priority)
- **Frequency:** {theme.frequency} mentions
- **Summary:** {theme.summary}
"""
        
        summary_content += f"""
### User Personas ({len(personas)} created)
"""
        
        for persona in personas:
            summary_content += f"""
#### {persona.name}
- **Demographics:** {persona.demographics}
- **Top Goals:** {', '.join(persona.goals[:3])}
- **Main Pain Points:** {', '.join(persona.pain_points[:3])}
"""
        
        summary_content += """
## Recommendations

1. **Immediate Actions:** Address high-priority themes with multiple negative sentiments
2. **Design Focus:** Consider persona needs in upcoming design decisions
3. **Further Research:** Investigate themes with medium priority for deeper understanding

---

*This summary was automatically generated by the UX Research Copilot system.*
"""
        
        summary_path = self.output_dir / "executive_summary.md"
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(summary_content)
        
        return summary_path
    
    async def _create_insights_report(self, insights: List[InsightData], 
                                    themes: List[ThemeCluster]) -> Path:
        """Create detailed insights report"""
        report_content = f"""# Detailed Insights Report

**Session ID:** {self.session_id}
**Total Insights:** {len(insights)}
**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M")}

## Insights by Theme
"""
        
        for theme in themes:
            report_content += f"""
### {theme.theme_name} ({theme.frequency} insights)
**Priority:** {theme.priority}
**Summary:** {theme.summary}

**Key Quotes:**
"""
            for insight in theme.insights:
                report_content += f"""
- "{insight.quote}"
  - **Sentiment:** {insight.sentiment}
  - **Confidence:** {insight.confidence:.2f}
  - **Context:** {insight.context}
"""
        
        insights_path = self.output_dir / "detailed_insights.md"
        with open(insights_path, 'w', encoding='utf-8') as f:
            f.write(report_content)
        
        return insights_path
    
    async def _create_persona_profiles(self, personas: List[PersonaData]) -> Path:
        """Create detailed persona profiles"""
        profiles_content = f"""# User Persona Profiles

**Session ID:** {self.session_id}
**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M")}

"""
        
        for i, persona in enumerate(personas, 1):
            profiles_content += f"""
## Persona {i}: {persona.name}

**Demographics:** {persona.demographics}

### Goals
"""
            for goal in persona.goals:
                profiles_content += f"- {goal}\n"
            
            profiles_content += """
### Pain Points
"""
            for pain_point in persona.pain_points:
                profiles_content += f"- {pain_point}\n"
            
            profiles_content += """
### Behaviors
"""
            for behavior in persona.behaviors:
                profiles_content += f"- {behavior}\n"
            
            profiles_content += """
### Representative Quotes
"""
            for quote in persona.quotes:
                profiles_content += f'- "{quote}"\n'
            
            profiles_content += "\n---\n"
        
        personas_path = self.output_dir / "persona_profiles.md"
        with open(personas_path, 'w', encoding='utf-8') as f:
            f.write(profiles_content)
        
        return personas_path

# Multi-Agent Orchestrator
class UXResearchOrchestrator:
    """Main orchestrator that coordinates all agents"""
    
    def __init__(self, config: AgentConfig):
        self.config = config
        self.logger = logging.getLogger("UXResearchOrchestrator")
    
    async def process_research_files_with_session(self, file_paths: List[str], session_id: str) -> Dict[str, Any]:
        """Complete research processing workflow"""
        
        # Initialize Redis client
        redis_client = None
        try:
            redis_client = redis.Redis(
                host=self.config.redis_host,
                port=self.config.redis_port,
                decode_responses=True
            )
            redis_client.ping()
            self.logger.info("Redis connection established")
        except:
            self.logger.warning("Redis not available - continuing without session persistence")
        
        try:
            # Initialize session
            if redis_client:
                redis_client.hmset(f"session:{session_id}", {
                    'session_id': session_id,
                    'status': 'processing',
                    'current_phase': 'initialization',
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat(),
                    'file_count': len(file_paths),
                    'insights_extracted': 0,
                    'themes_identified': 0,
                    'personas_created': 0
                })
            
            self.logger.info(f"Starting processing for session {session_id}")
            
            # Phase 1: Document Ingestion
            self.logger.info("Phase 1: Document Ingestion")
            if redis_client:
                redis_client.hset(f"session:{session_id}", 'current_phase', 'document_ingestion')
            
            ingestor = DocumentIngestor(self.config, session_id)
            documents = await ingestor.process(file_paths)
            
            if not documents:
                raise ValueError("No documents were successfully processed")
            
            self.logger.info(f"Phase 1 complete: {len(documents)} documents processed")
            
            # Phase 2: Insight Analysis
            self.logger.info("Phase 2: Insight Analysis")
            if redis_client:
                redis_client.hset(f"session:{session_id}", 'current_phase', 'insight_analysis')
            
            analyzer = InsightAnalyzer(self.config, session_id)
            insights = await analyzer.process(documents)
            
            # Update Redis with insights count
            if redis_client:
                redis_client.hmset(f"session:{session_id}", {
                    'insights_extracted': len(insights),
                    'updated_at': datetime.now().isoformat()
                })
            
            self.logger.info(f"Phase 2 complete: {len(insights)} insights extracted")
            
            if not insights:
                self.logger.warning("No insights extracted - creating minimal results")
                insights = [InsightData(
                    quote="No significant insights found in the provided documents",
                    speaker=None,
                    theme="Analysis Result",
                    sentiment="Neutral",
                    confidence=1.0,
                    context="System message",
                    timestamp=None
                )]
            
            # Phase 3: Theme Synthesis
            self.logger.info("Phase 3: Theme Synthesis")
            if redis_client:
                redis_client.hset(f"session:{session_id}", 'current_phase', 'theme_synthesis')

            synthesizer = ThemeSynthesizer(self.config, session_id)
            themes = await synthesizer.process(insights)

            # Update Redis with themes count only
            if redis_client:
                redis_client.hmset(f"session:{session_id}", {
                'themes_identified': len(themes),
                'updated_at': datetime.now().isoformat()
                })

            self.logger.info(f"Phase 3 complete: {len(themes)} themes")
            
            # Phase 4: Output Formatting
            self.logger.info("Phase 4: Output Formatting")
            if redis_client:
                redis_client.hset(f"session:{session_id}", 'current_phase', 'output_formatting')
            
            formatter = OutputFormatter(self.config, session_id)
            outputs = await formatter.process(insights, themes, [])
            
            self.logger.info(f"Phase 4 complete: {len(outputs)} output files created")
            
            # Verify files were created
            for output_type, file_path in outputs.items():
                if os.path.exists(file_path):
                    file_size = os.path.getsize(file_path)
                    self.logger.info(f"✓ {output_type}: {file_path} ({file_size} bytes)")
                else:
                    self.logger.error(f"✗ {output_type}: {file_path} - FILE NOT FOUND")
            
            # Mark as completed
            if redis_client:
                redis_client.hmset(f"session:{session_id}", {
                    'status': 'completed',
                    'current_phase': 'completed',
                    'updated_at': datetime.now().isoformat()
                })
            
            # Create comprehensive results
            results = {
                "session_id": session_id,
                "status": "completed",
                "results": {
                    "insights_count": len(insights),
                    "themes_count": len(themes),
                    "personas_count": 0
                },
                "outputs": outputs,
                "insights": [insight.dict() for insight in insights],
                "themes": [
                    {
                        "theme_name": theme.theme_name,
                        "frequency": theme.frequency,
                        "priority": theme.priority,
                        "summary": theme.summary,
                        "insights": [insight.dict() for insight in theme.insights]
                    }
                    for theme in themes
                ],
                "personas": []
            }
            
            self.logger.info(f"Processing completed successfully for session {session_id}")
            return results
            
        except Exception as e:
            self.logger.error(f"Error in orchestration: {str(e)}")
            
            # Mark as failed in Redis
            if redis_client:
                redis_client.hmset(f"session:{session_id}", {
                    'status': 'failed',
                    'error_message': str(e),
                    'updated_at': datetime.now().isoformat()
                })
            
            raise

# Example usage and testing functions
async def test_orchestrator():
    """Test function for the orchestrator"""
    from config import CONFIG
    
    # Example file paths - replace with actual paths
    sample_files = [
        "sample_data/interview_1.txt",
        "sample_data/interview_2.txt"
    ]
    
    try:
        orchestrator = UXResearchOrchestrator(CONFIG)
        results = await orchestrator.process_research_files(sample_files)
        
        print(f"✅ Processing completed!")
        print(f"📊 Session ID: {results['session_id']}")
        print(f"⏱️ Processing time: {results['processing_time']:.2f} seconds")
        print(f"🔍 Insights extracted: {results['results']['insights_count']}")
        print(f"🎯 Themes identified: {results['results']['themes_count']}")
        print(f"👥 Personas created: {results['results']['personas_count']}")
        
        return results
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


if __name__ == "__main__":
    """
    Run this file directly to test the agents
    Usage: python agents.py
    """
    import asyncio
    
    print("🧪 Testing UX Research Copilot Agents...")
    
    # Check if configuration is valid
    from config import CONFIG
    
    if not CONFIG.openai_api_key or CONFIG.openai_api_key == "your_openai_api_key_here":
        print("❌ Please configure your OpenAI API key in the .env file")
        exit(1)
    
    # Run the test
    asyncio.run(test_orchestrator())