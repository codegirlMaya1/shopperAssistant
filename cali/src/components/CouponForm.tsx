
import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const CouponForm: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [subscribed, setSubscribed] = useState(true);

  useEffect(() => {
    if (name.trim() && email.trim()) {
      setSubscribed(true);
      setLoading(true);
      setTimeout(() => {
        setSubmitted(true);
        setLoading(false);
        setShowSuccess(true);
        onComplete();
      }, 2500);
    }
  }, [name, email]);

  if (submitted && showSuccess) {
    return (
      <div className="alert alert-success text-center mt-4">
        <h4>🎉 First-time user coupon applied!</h4>
        <p>You saved 20% on your total. Thank you for registering!</p>
      </div>
    );
  }

  return (
    <div className="card mt-4 shadow-sm">
      <div className="card-body">
        <h4 className="card-title">🎁 Welcome Coupon</h4>
        <p className="card-text">
          To proceed, please register for shipping and correspondence purposes.
          Don’t worry — I’ll help you fill out the form and ensure you get a discount!
        </p>
        <p><strong>Just enter your first name and email — I’ll do the rest.</strong></p>

        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="First Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <input
            type="email"
            className="form-control"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Newsletter Subscription</label>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              checked={subscribed}
              onChange={() => setSubscribed(true)}
            />
            <label className="form-check-label">Will subscribe to email newsletter</label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              checked={!subscribed}
              onChange={() => setSubscribed(false)}
            />
            <label className="form-check-label">Will not subscribe to email newsletter</label>
          </div>
        </div>

        <button
          className="btn btn-primary w-100"
          style={{ transition: "0.3s", boxShadow: "0 0 10px rgba(0,0,0,0.2)" }}
          disabled={loading || !name || !email}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default CouponForm;
