import argparse
import json
import sys
import whisper

def main():
    parser = argparse.ArgumentParser(description='Convert speech to text')
    parser.add_argument('--audio', required=True, help='Path to audio file')
    parser.add_argument('--language', required=True, help='Language code')
    
    args = parser.parse_args()
    
    try:
        # Load Whisper model
        model = whisper.load_model("medium")
        
        # Process audio
        result = model.transcribe(
            args.audio,
            language=args.language
        )
        
        # Return JSON result
        print(json.dumps({"text": result["text"].strip()}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()