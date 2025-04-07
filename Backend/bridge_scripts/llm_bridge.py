import argparse
import json
import sys
import os
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.prompts import PromptTemplate
from langchain_together import Together
from langchain.memory import ConversationBufferWindowMemory
from langchain.chains import ConversationalRetrievalChain
from deep_translator import GoogleTranslator

# Mode-specific prompt templates
PROMPT_TEMPLATES = {
    'AttorneyGPT': """<s>[INST]This is a chat template for a legal assistant specializing in Indian law. Provide accurate and concise information based on the user's questions about Indian legal matters. Focus on the Indian Penal Code and related statutes. If the user greets you respond professionally and shortly explain how you can assist with legal queries(only when greeted).
CONTEXT: {context}
CHAT HISTORY: {chat_history}
QUESTION: {question}
ANSWER:</s>[INST]
""",
    
    'Draft Generation': """<s>[INST]You are a legal document drafting assistant. Help create well-structured legal documents following Indian legal standards and formats. Provide clear guidelines and templates. Focus on proper legal language and formatting as per Indian law requirements.
CONTEXT: {context}
CHAT HISTORY: {chat_history}
DOCUMENT REQUEST: {question}
DRAFT GUIDANCE:</s>[INST]
""",
    
    'Legal Research': """<s>[INST]You are a specialized legal research assistant for Indian law. Provide detailed analysis of legal sections, case laws, and interpretations. Focus on thorough examination of legal principles and precedents from Indian courts.
CONTEXT: {context}
CHAT HISTORY: {chat_history}
RESEARCH QUERY: {question}
ANALYSIS:</s>[INST]
""",

    'Virtual Courts': """<s>[INST]You are now acting as an Indian court judge. Evaluate the attorney's arguments and provide constructive feedback based on Indian law. Consider legal precedents and proper court procedure.
CONTEXT: {context}
CHAT HISTORY: {chat_history}
ATTORNEY'S SUBMISSION: {question}
JUDGE'S RESPONSE:</s>[INST]
"""
}

# Global variables to store persistent objects
memories = {
    'AttorneyGPT': ConversationBufferWindowMemory(k=2, memory_key="chat_history", return_messages=True),
    'Draft Generation': ConversationBufferWindowMemory(k=2, memory_key="chat_history", return_messages=True),
    'Legal Research': ConversationBufferWindowMemory(k=2, memory_key="chat_history", return_messages=True),
    'Virtual Courts': ConversationBufferWindowMemory(k=2, memory_key="chat_history", return_messages=True)
}

def translate_text(text, source_lang, target_lang):
    if source_lang == target_lang:
        return text
    
    # Split text into smaller chunks to handle long responses
    max_chunk_length = 4500
    text_chunks = [text[i:i + max_chunk_length] for i in range(0, len(text), max_chunk_length)]
    
    translated_chunks = []
    for chunk in text_chunks:
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        translated_chunk = translator.translate(chunk)
        translated_chunks.append(translated_chunk)
    
    return ' '.join(translated_chunks)

def main():
    parser = argparse.ArgumentParser(description='Process LLM queries')
    parser.add_argument('--text', required=True, help='Input text query')
    parser.add_argument('--mode', required=True, help='Mode of operation')
    parser.add_argument('--language', required=True, help='Language code')
    
    args = parser.parse_args()
    
    try:
        # Initialize embeddings
        embeddings = HuggingFaceEmbeddings(
            model_name="nomic-ai/nomic-embed-text-v1",
            model_kwargs={
                "trust_remote_code": True,
                "revision": "289f532e14dbbbd5a04753fa58739e9ba766f3c7"
            }
        )
        
        # Load vector database
        db = FAISS.load_local("ipc_vector_db", embeddings, allow_dangerous_deserialization=True)
        db_retriever = db.as_retriever(search_type="similarity", search_kwargs={"k": 4})
        
        # Initialize LLM
        TOGETHER_AI_API = "af6d291680456a40acdba015d775e263448acfe97d3e994c665148a4ebe1a45f"
        llm = Together(
            model="mistralai/Mistral-7B-Instruct-v0.2",
            temperature=0.5,
            max_tokens=1024,
            together_api_key=TOGETHER_AI_API
        )
        
        # Create prompt
        prompt = PromptTemplate(
            template=PROMPT_TEMPLATES[args.mode],
            input_variables=['context', 'question', 'chat_history']
        )
        
        # Create chain
        qa_chain = ConversationalRetrievalChain.from_llm(
            llm=llm,
            memory=memories[args.mode],
            retriever=db_retriever,
            combine_docs_chain_kwargs={'prompt': prompt}
        )
        
        # Check if we need to translate
        input_text = args.text
        if args.language != 'en':
            input_text = translate_text(args.text, args.language, 'en')
        
        # Get response
        response = qa_chain.run(input_text)
        
        # Translate response if needed
        if args.language != 'en':
            response = translate_text(response, 'en', args.language)
        
        # Return JSON result
        result = {
            "text": response
        }
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()