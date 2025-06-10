import os
import json
from sentence_transformers import SentenceTransformer
from propositions import proposition_splitter

DATA_FOLDER = "company_data"
SOURCE_DOCUMENT_FOLDER = os.path.join(os.getcwd(), "company")

def load_documents(folder_path):
    docs = []
    for filename in os.listdir(folder_path):
        if filename.endswith(".txt"):
            with open(os.path.join(folder_path, filename), 'r', encoding='utf-8') as f:
                docs.append(f.read())
    return docs

def main():
    documents = load_documents(SOURCE_DOCUMENT_FOLDER)
    all_chunks = []
    for doc in documents:
        chunks = proposition_splitter(doc)
        all_chunks.extend(chunks)

    model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')
    embeddings = model.encode(all_chunks).tolist()

    data = [{"id": f"chunk_{i}", "text": chunk, "embedding": emb} for i, (chunk, emb) in enumerate(zip(all_chunks, embeddings))]
    os.makedirs(DATA_FOLDER, exist_ok=True)
    with open(os.path.join(DATA_FOLDER, "company_data.json"), 'w') as f:
        json.dump(data, f)

    print(f"✅ Created company_data.json with {len(data)} propositions")

if __name__ == "__main__":
    main()