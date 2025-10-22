
import React from "react";

const Destination: React.FC = () => {
  const receiptNumber = `CF-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24, textAlign: "center" }}>
      <h1>🎉 Thank You for Shopping with Cali Fashion!</h1>
      <p>Your order has been successfully placed.</p>
      <h2>🧾 Receipt</h2>
      <p>Receipt Number: <strong>{receiptNumber}</strong></p>
      <p>We’ve sent a confirmation to your email. You’re all set!</p>
      <p style={{ marginTop: 32 }}>We hope to see you again soon. Happy shopping! 🛍️</p>
    </div>
  );
};

export default Destination;
