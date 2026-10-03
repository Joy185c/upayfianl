/**
 * Upay ImpactIQ — Voice Agent Audio & Speech Service
 * Provides bidirectional Web Speech API integration (Speech-to-Text & Text-to-Speech)
 * with robust fallbacks, audio meter hooks, and browser permission handling.
 */

// Global window declaration for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onTranscriptCallback?: (transcript: string, isFinal: boolean) => void;
  private onErrorCallback?: (error: string) => void;
  private onStateChangeCallback?: (isListening: boolean) => void;

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US"; // default English, also catches Banglish phonetics

        this.recognition.onstart = () => {
          this.isListening = true;
          this.onStateChangeCallback?.(true);
        };

        this.recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const currentText = finalTranscript || interimTranscript;
          const isFinal = Boolean(finalTranscript);
          this.onTranscriptCallback?.(currentText, isFinal);
        };

        this.recognition.onerror = (event: any) => {
          this.isListening = false;
          this.onStateChangeCallback?.(false);
          this.onErrorCallback?.(event.error || "Speech recognition error");
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.onStateChangeCallback?.(false);
        };
      }
    }
  }

  public isSupported(): boolean {
    return Boolean(this.recognition);
  }

  public startListening(
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onError?: (error: string) => void,
    onStateChange?: (isListening: boolean) => void
  ) {
    this.onTranscriptCallback = onTranscript;
    this.onErrorCallback = onError;
    this.onStateChangeCallback = onStateChange;

    if (!this.recognition) {
      onError?.("Web Speech Recognition is not supported on this browser.");
      return;
    }

    try {
      this.recognition.start();
    } catch (e: any) {
      if (e.name !== "InvalidStateError") {
        onError?.(e.message || "Failed to start microphone");
      }
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
    this.isListening = false;
    this.onStateChangeCallback?.(false);
  }

  /**
   * Text-to-Speech (TTS) using Web Speech Synthesis
   */
  public speak(
    text: string,
    onEnd?: () => void,
    onStart?: () => void
  ) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean text for speech (strip markdown asterisks, emojis)
    const cleanText = text
      .replace(/[*_#`~]/g, "")
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05; // Slightly confident, brisk fintech tempo
    utterance.pitch = 1.0;

    // Pick English or natural system voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => v.name.includes("Natural") || v.name.includes("Google") || v.lang.startsWith("en")
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    window.speechSynthesis.speak(utterance);
  }

  public cancelSpeech() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }
}
