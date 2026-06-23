from fastapi import FastAPI, UploadFile, File, HTTPException
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel
from groq import Groq
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams,
    Distance,
    PointStruct
)
import os
import uuid
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
# =====================================================
# FastAPI App
# =====================================================

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
port = int(os.environ.get("PORT", 8000))

# =====================================================
# Embedding Model
# =====================================================

model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)

# =====================================================
# Qdrant
# =====================================================

qdrant_client = QdrantClient(
    path="./qdrant_data"
)

COLLECTION_NAME = "pdf_chunks"

collections = qdrant_client.get_collections().collections
collection_names = [c.name for c in collections]

if COLLECTION_NAME not in collection_names:
    qdrant_client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(
            size=384,
            distance=Distance.COSINE
        )
    )

# =====================================================
# Groq Client
# =====================================================
load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")

if not groq_api_key:
    raise ValueError(
        "GROQ_API_KEY environment variable not found."
    )

client_llm = Groq(
    api_key=groq_api_key
)

# =====================================================
# Request Model
# =====================================================

class QuestionRequest(BaseModel):
    question: str

# =====================================================
# Upload PDF Endpoint
# =====================================================

@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...)
):

    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed."
        )

    temp_path = f"temp_{uuid.uuid4()}.pdf"

    try:

        # Save PDF
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        # Read PDF
        reader = PdfReader(temp_path)

        full_text = ""

        for page in reader.pages:
            text = page.extract_text()

            if text:
                full_text += text + "\n"

        if not full_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No text found in PDF."
            )

        # Chunking
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

        chunks = splitter.split_text(
            full_text
        )

        # Embeddings
        embeddings = model.encode(
            chunks,
            convert_to_numpy=True
        )

        # Store in Qdrant
        points = []

        for chunk, embedding in zip(
            chunks,
            embeddings
        ):
            points.append(
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding.tolist(),
                    payload={
                        "text": chunk
                    }
                )
            )

        qdrant_client.upsert(
            collection_name=COLLECTION_NAME,
            points=points
        )

        return {
            "message": "PDF processed successfully",
            "chunks_created": len(chunks),
            "embeddings_created": len(embeddings),
            "vectors_stored": len(points)
        }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

# =====================================================
# Ask Endpoint
# =====================================================

@app.post("/ask")
async def ask(
    data: QuestionRequest
):

    query_embedding = model.encode(
        data.question,
        convert_to_numpy=True
    )

    results = qdrant_client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding.tolist(),
        limit=3
    ).points

    if not results:
        return {
            "question": data.question,
            "answer": "No document data found. Please upload a PDF first.",
            "chunks_used": 0
        }

    retrieved_chunks = []

    for result in results:

        text = result.payload.get("text")

        if text:
            retrieved_chunks.append(text)

    context = "\n\n".join(
        retrieved_chunks
    )

    prompt = f"""
You are a helpful PDF assistant.

Answer ONLY from the provided context.

If the answer is not present in the context, reply exactly:

I could not find that information in the uploaded document.

Context:
{context}

Question:
{data.question}
"""

    response = client_llm.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0
    )

    answer = response.choices[0].message.content

    return {
        "question": data.question,
        "answer": answer,
        "chunks_used": len(retrieved_chunks)
    }

# =====================================================
# Health Check
# =====================================================

@app.get("/")
async def root():
    return {
        "status": "running",
        "collection": COLLECTION_NAME
    }