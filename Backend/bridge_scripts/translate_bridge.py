import argparse
import json
import sys
from deep_translator import GoogleTranslator

def main():
    parser = argparse.ArgumentParser(description='Translate text')
    parser.add_argument('--text', required=True, help='Text to translate')
    parser.add_argument('--source', required=True, help='Source language code')
    parser.add_argument('--target', required=True, help='Target language code')
    
    args = parser.parse_args()
    
    try:
        if args.source == args.target:
            result = {"translatedText": args.text}
        else:
            # Split text into smaller chunks to handle long responses
            max_chunk_length = 4500
            text_chunks = [args.text[i:i + max_chunk_length] for i in range(0, len(args.text), max_chunk_length)]
            
            translated_chunks = []
            for chunk in text_chunks:
                translator = GoogleTranslator(source=args.source, target=args.target)
                translated_chunk = translator.translate(chunk)
                translated_chunks.append(translated_chunk)
            
            result = {"translatedText": ' '.join(translated_chunks)}
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()