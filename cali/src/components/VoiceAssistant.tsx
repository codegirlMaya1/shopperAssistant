
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

export interface VoiceAssistantProps {
  transcript: string;
  setTranscript: React.Dispatch<React.SetStateAction<string>>;
  onVoiceResponse: (
    filters: {
      category?: string;
      price?: number;
      color?: string;
      transcript?: string;
      action?: string;
      product?: string;
    },
    matches: any[],
    rawText: string
  ) => void;
  greetingText?: string;
}

type BackendContext = {
  last_filters?: Record<string, any>;
  pending_slots?: string[];
};

type ParseResponse = {
  filters: {
    category?: string;
    price?: number;
    color?: string;
    transcript?: string;
    action?: string;
    product?: string;
  };
  matches: any[];
  clarify?: boolean;
  question?: string;
  pending_slots?: string[];
  context?: BackendContext;
};

const SILENCE_DEBOUNCE_MS = 1000;

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  transcript,
  setTranscript,
  onVoiceResponse,
  greetingText = "Hi, I'm Sandy, your personal shopping assistant. Say things like: a dress under 50 dollars, or men’s shirts under 25.",
}) => {
  const {
    transcript: liveTranscript,
    listening,
    browserSupportsSpeechRecognition,
    resetTranscript,
  } = useSpeechRecognition();

  const [initialized, setInitialized] = useState(false);
  const [needsEnableClick, setNeedsEnableClick] = useState(false);

  const greetingDoneRef = useRef(false);
  const speakingRef = useRef(false);
  const debounceTimer = useRef<number | null>(null);
  const lastHeardRef = useRef<number>(0);
  const contextRef = useRef<BackendContext>({ last_filters: {}, pending_slots: [] });

  const salesPrompts = [
    "This one might be perfect for you!",
    "How about this option?",
    "You might love this one!",
    "This could be just what you're looking for!",
    "A great choice for your style!",
    "This is one of our bestsellers!",
    "Customers love this one!",
    "This might be a great fit for you!",
    "A popular pick—want to add it to your cart?",
    "This is a favorite among our shoppers!"
  ];

  const speak = (text: string, onEnd?: () => void) => {
    try { SpeechRecognition.stopListening(); } catch {}
    speakingRef.current = true;
    try { window.speechSynthesis.cancel(); } catch {}

    const utter = new SpeechSynthesisUtterance(text);

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const female =
        voices.find(v => v.name.toLowerCase().includes("female")) ||
        voices.find(v => v.name.toLowerCase().includes("samantha")) ||
        voices.find(v => v.name.toLowerCase().includes("google uk english female")) ||
        voices[0];
      if (female) utter.voice = female;
    };

    const trySpeak = () => {
      try {
        window.speechSynthesis.speak(utter);
      } catch {
        setNeedsEnableClick(true);
      }
    };

    if (speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        pickVoice();
        trySpeak();
      };
    } else {
      pickVoice();
      trySpeak();
    }

    utter.onend = () => {
      speakingRef.current = false;
      SpeechRecognition.startListening({
        continuous: true,
        language: "en-US",
        interimResults: true,
      });
      onEnd?.();
    };
  };

  const enableVoice = () => {
    setNeedsEnableClick(false);
    if (!greetingDoneRef.current) {
      greetingDoneRef.current = true;
      speak(greetingText);
    }
  };

  useEffect(() => {
    if (!browserSupportsSpeechRecognition || initialized) return;

    const startMicAndGreet = async () => {
      try {
        await SpeechRecognition.startListening({
          continuous: true,
          language: "en-US",
          interimResults: true,
        });
        setInitialized(true);
        if (!greetingDoneRef.current) {
          greetingDoneRef.current = true;
          speak(greetingText);
        }
      } catch (err) {
        console.error("Mic start error:", err);
      }
    };

    startMicAndGreet();
  }, [browserSupportsSpeechRecognition, initialized, greetingText]);

  useEffect(() => {
    if (liveTranscript && liveTranscript !== transcript) {
      setTranscript(liveTranscript);
      lastHeardRef.current = Date.now();
    }

    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      const now = Date.now();
      if (!speakingRef.current && liveTranscript && now - lastHeardRef.current >= SILENCE_DEBOUNCE_MS) {
        void sendToBackend(liveTranscript.trim());
      }
    }, SILENCE_DEBOUNCE_MS) as unknown as number;
  }, [liveTranscript]);

  const sendToBackend = async (spoken: string) => {
    if (!spoken) return;
    try {
      const res = await axios.post<ParseResponse>(
        "http://localhost:5000/parse-voice",
        {
          text: spoken,
          context: contextRef.current,
        },
        { timeout: 15000 }
      );

      const { filters, matches, clarify, question, context } = res.data;

      if (context) contextRef.current = context;

      let responseText = "";
      if (matches.length > 0) {
        responseText = "Here’s what I found: ";
        matches.slice(0, 3).forEach((item) => {
          const prompt = salesPrompts[Math.floor(Math.random() * salesPrompts.length)];
          responseText += `${item.title} for $${item.price.toFixed(2)}. ${prompt} `;
        });
      } else {
        responseText = "Here’s what I found that might interest you. Let me know if you'd like to add any of these to your cart.";
      }

      speak(clarify && question ? question : responseText);
      onVoiceResponse(filters, matches, spoken);
      resetTranscript();
    } catch (err) {
      console.error("Backend parse error:", err);
      speak("Sorry, I didn’t catch that. Try asking for something like women’s dresses under 50 or men’s jackets.");
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <p>Your browser does not support speech recognition.</p>;
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <p>🎙️ Listening: {listening && !speakingRef.current ? "Yes" : "No"}</p>
      <p>🗣️ You said: {transcript || "Say a product, category, or price filter…"}</p>

      {needsEnableClick && (
        <button
          onClick={enableVoice}
          style={{
            marginTop: 8,
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            cursor: "pointer",
          }}
        >
          🔊 Enable voice
        </button>
      )}
    </div>
  );
};

export default VoiceAssistant;
