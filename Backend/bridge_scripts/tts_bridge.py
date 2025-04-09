import argparse
import json
import sys
from gtts import gTTS

def main():
    parser = argparse.ArgumentParser(description='Convert text to speech')
    parser.add_argument('--text', required=True, help='Text to convert')
    parser.add_argument('--output', required=True, help='Output audio file path')
    parser.add_argument('--language', required=True, help='Language code')
    
    args = parser.parse_args()
    
    # Language mapping
    language_map = {
        'English': 'en',
        'Tamil': 'ta',
        'Hindi': 'hi'
    }
    
    gtts_language = language_map.get(args.language, 'en')
    
    try:
        # Clean text (remove markdown symbols)
        clean_text = args.text.replace('*', '').replace('_', '').replace('#', '')
        
        # Generate TTS
        tts = gTTS(text=clean_text, lang=gtts_language)
        tts.save(args.output)
        
        # Success
        print(json.dumps({"status": "success"}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()