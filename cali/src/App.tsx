
import React, { useEffect, useState } from "react";
import axios from "axios";
import ProductList from "./components/ProductList";
import VoiceAssistant from "./components/VoiceAssistant";
import { Product } from "./types";
import "./App.css";

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<string>("");
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    axios.get<Product[]>("https://fakestoreapi.com/products", { timeout: 15000 })
      .then((res) => {
        setProducts(res.data);
        setFilteredProducts(res.data);
      })
      .catch((e) => console.error("Fetch products error:", e));
  }, []);

  const speak = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text);
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const female =
        voices.find((v) => v.name.toLowerCase().includes("female")) ||
        voices.find((v) => v.name.toLowerCase().includes("samantha")) ||
        voices.find((v) => v.name.toLowerCase().includes("google uk english female")) ||
        voices[0];
      if (female) utter.voice = female;
    };
    if (speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        pickVoice();
        window.speechSynthesis.speak(utter);
      };
    } else {
      pickVoice();
      window.speechSynthesis.speak(utter);
    }
  };

  const handleVoiceResponse = (
    filters: {
      category?: string;
      price?: number;
      color?: string;
      transcript?: string;
      action?: string;
      product?: string;
    },
    matches: Product[],
    rawText: string
  ) => {
    setFilters(filters);
    const act = (filters.action || "filter").toLowerCase();
    const kw = (filters.product || "").toLowerCase();

    if (act === "add_to_cart" && kw) {
      const fromAll = products.find((p) => p.title.toLowerCase().includes(kw)) || matches[0];
      if (fromAll) {
        setCart((prev) => (prev.some((x) => x.id === fromAll.id) ? prev : [...prev, fromAll]));
        speak(`Added ${fromAll.title} to your cart.`);
      } else {
        speak(`I couldn't find ${filters.product}.`);
      }
      setStatus(`Action: add_to_cart | Keyword: ${kw}`);
      return;
    }

    if (act === "remove_from_cart" && kw) {
      setCart((prev) => prev.filter((p) => !p.title.toLowerCase().includes(kw)));
      speak(`Removed ${filters.product} from your cart.`);
      setStatus(`Action: remove_from_cart | Keyword: ${kw}`);
      return;
    }

    setFilteredProducts(matches.length > 0 ? matches : products);
    setStatus(`Filtered ${matches.length} item(s) from FakeStore`);
    if (matches.length > 0) {
      const top = matches.slice(0, 3).map((p) => `${p.title} for $${p.price.toFixed(2)}`).join(", ");
      speak(`I found ${matches.length} items. Top results: ${top}.`);
    } else {
      speak(`Sorry, I couldn't find anything matching "${rawText}".`);
    }
  };

  return (
    <div className="App" style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Cali Fashion 🛍️</h1>
        <span style={{ opacity: 0.7 }}>— Voice-powered search & cart</span>
      </header>

      <VoiceAssistant
        transcript={transcript}
        setTranscript={setTranscript}
        onVoiceResponse={handleVoiceResponse}
        greetingText="Hi, I'm Sandy, your first greeter. Tell me what to find — like women’s dresses under 50 — and I’ll filter the store."
      />

      {status && <p style={{ opacity: 0.8, marginTop: -6 }}>✅ {status}</p>}

      {filters && (
        <div style={{ marginTop: 8, fontStyle: 'italic', color: '#555' }}>
          Active filters:
          {filters.category && ` Category: ${filters.category}.`}
          {filters.product && ` Product: ${filters.product}.`}
          {filters.price && ` Price ≤ $${filters.price}.`}
          {filters.color && ` Color: ${filters.color}.`}
        </div>
      )}

      <h2 style={{ marginTop: 8 }}>Products</h2>
      <ProductList products={filteredProducts} />

      <h2 style={{ marginTop: 24 }}>🛒 Your Cart</h2>
      {cart.length === 0 ? (
        <p>No items yet. Try: “add backpack to cart”.</p>
      ) : (
        <ul>
          {cart.map((item) => (
            <li key={item.id}>
              {item.title} — ${item.price.toFixed(2)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default App;
