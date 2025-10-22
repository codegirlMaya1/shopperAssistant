import React, { useEffect, useState } from "react";
import axios from "axios";
import ProductList from "./components/ProductList";
import VoiceAssistant from "./components/VoiceAssistant";
import CouponForm from "./components/CouponForm";
import { Product } from "./types";
import "./App.css";
import { useNavigate } from "react-router-dom";

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<string>("");
  const [filters, setFilters] = useState<any>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const navigate = useNavigate();

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
        setCart((prev) => {
          const updated = prev.some((x) => x.id === fromAll.id) ? prev : [...prev, fromAll];
          if (updated.length === 1 && !couponApplied) {
            setShowCoupon(true);
          }
          return updated;
        });
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
      speak(`Here’s what I found: ${top}.`);
      setSelectedProduct(matches[0]); // ✅ Auto-read first product
    } else {
      speak(`Here’s what I found that might interest you. Let me know if you'd like to add any of these to your cart.`);
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    speak(`${product.title}, priced at $${product.price.toFixed(2)}. ${product.description}. Would you like to add this to your cart?`);
  };

  const handleProductDecision = (decision: "yes" | "no" | "checkout" | "continue") => {
    if (decision === "yes" && selectedProduct) {
      setCart((prev) => {
        const updated = prev.some((x) => x.id === selectedProduct.id) ? prev : [...prev, selectedProduct];
        if (updated.length === 1 && !couponApplied) {
          setShowCoupon(true);
        }
        return updated;
      });
      speak(`Added ${selectedProduct.title} to your cart.`);
    }

    if (decision === "checkout") {
      const summary = cart.map((item) => `${item.title} for $${item.price.toFixed(2)}`).join(", ");
      speak(`You have ${cart.length} items: ${summary}. Redirecting to checkout now.`);
      navigate("/destination"); // ✅ Redirect to checkout
    }

    setSelectedProduct(null);
  };

  const handleCouponComplete = () => {
    setCouponApplied(true);
    setShowCoupon(false);
    speak("Coupon applied! Your discount has been added.");
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const discountedTotal = couponApplied ? cartTotal * 0.8 : cartTotal;

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
        greetingText="Hi, I'm Samuel, your virtual shopper. Tell me what to find — like women’s dresses under 50 — and I’ll filter the store."
        selectedProduct={selectedProduct}
        onProductDecision={handleProductDecision}
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
      <ProductList products={filteredProducts} onProductClick={handleProductClick} />

      {showCoupon && !couponApplied && (
        <CouponForm onComplete={handleCouponComplete} />
      )}

      <h2 style={{ marginTop: 24 }}>🛒 Your Cart</h2>
      {cart.length === 0 ? (
        <p>No items yet. Try: “add backpack to cart”.</p>
      ) : (
        <>
          <ul>
            {cart.map((item) => (
              <li key={item.id}>
                {item.title} — ${item.price.toFixed(2)}
              </li>
            ))}
          </ul>
          <p style={{ fontWeight: "bold", marginTop: 8 }}>
            Total: ${discountedTotal.toFixed(2)} {couponApplied && <span>(20% discount applied)</span>}
          </p>
        </>
      )}
    </div>
  );
};

export default App;