import { Language } from '../types';

export class SpeechService {
  private static recognition: any = null;
  private static isListening: boolean = false;

  public static isRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }

  public static isSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public static startListening(
    lang: Language,
    onResult: (transcript: string) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): boolean {
    if (!this.isRecognitionSupported()) {
      onError('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return false;
    }

    try {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (this.recognition) {
        this.recognition.abort();
      }

      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = lang === 'te' ? 'te-IN' : 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onResult(transcript);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        onError(event.error || 'Speech input interrupted');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd();
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      this.isListening = false;
      onError(err?.message || 'Failed to start microphone');
      return false;
    }
  }

  public static stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
    this.isListening = false;
  }

  public static speak(text: string, lang: Language, onEnd?: () => void): void {
    if (!this.isSynthesisSupported()) return;

    window.speechSynthesis.cancel(); // Stop any ongoing speech

    // Clean text of markdown asterisks or code formatting for natural voice delivery
    const cleanText = text
      .replace(/[*#_`]/g, '')
      .replace(/\n+/g, '. ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === 'te' ? 'te-IN' : 'en-US';
    utterance.rate = 0.95; // Slightly slower, very natural for agricultural advisory
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (lang === 'te') {
      const teluguVoice = voices.find(v => v.lang.includes('te') || v.name.toLowerCase().includes('telugu'));
      if (teluguVoice) utterance.voice = teluguVoice;
    } else {
      const naturalVoice = voices.find(v => (v.lang.includes('en-IN') || v.lang.includes('en-US')) && !v.name.includes('Google'));
      if (naturalVoice) utterance.voice = naturalVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
  }

  public static stopSpeaking(): void {
    if (this.isSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}
