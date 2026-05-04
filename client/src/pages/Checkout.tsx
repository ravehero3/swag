import { useState, useEffect } from "react";
import { useApp } from "../App.js";
import { useLocation } from "wouter";

function Checkout() {
  const { cart, user, clearCart } = useApp() as any;
  const [email, setEmail] = useState(user?.email || "");
  const [buyerLegalName, setBuyerLegalName] = useState("");
  const [buyerArtistName, setBuyerArtistName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [freeSuccess, setFreeSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"gopay" | "bank_transfer">("bank_transfer");
  const [bankInstructions, setBankInstructions] = useState<any>(null);
  const [, navigate] = useLocation();

  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");

  const total = cart.reduce((sum: number, item: any) => sum + Number(item.price), 0);
  const finalTotal = total * (1 - discount / 100);
  const isFreeOrder = finalTotal === 0;

  useEffect(() => {
    if (cart.length === 0 && !success && !freeSuccess && !bankInstructions) {
      navigate("/kosik");
    }
  }, [cart.length, success, freeSuccess, bankInstructions]);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/auth/profile-info", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          if (data.buyerLegalName) setBuyerLegalName(data.buyerLegalName);
          if (data.buyerArtistName) setBuyerArtistName(data.buyerArtistName);
          if (data.buyerAddress) setBuyerAddress(data.buyerAddress);
        }
      })
      .catch(() => {});
  }, [user]);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    try {
      const res = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setDiscount(data.discountPercent);
        setPromoError("");
      } else {
        setPromoError(data.error || "Neplatný kód");
        setDiscount(0);
      }
    } catch (err) {
      setPromoError("Chyba při ověřování kódu");
    }
  };

  const handleFreeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const items = cart.map((item: any) => ({
        productId: item.productId,
        productType: item.productType,
        title: item.title,
        price: 0,
      }));

      if (user) {
        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, items, total: 0, paymentMethod: "free" }),
        });
        if (!orderRes.ok) throw new Error("Chyba při vytváření objednávky");
        const order = await orderRes.json();

        const claimRes = await fetch(`/api/orders/${order.id}/claim-free`, {
          method: "POST",
          credentials: "include",
        });
        if (!claimRes.ok) {
          const claimData = await claimRes.json();
          throw new Error(claimData.error || "Chyba při zpracování");
        }
      } else {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, items }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Chyba při zpracování");
        }
      }

      clearCart();
      setFreeSuccess(true);
      setTimeout(() => navigate(user ? "/ucet" : "/"), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const items = cart.map((item: any) => ({
        productId: item.productId,
        productType: item.productType,
        title: item.title,
        price: item.price,
        licenseTypeId: item.licenseTypeId || null,
      }));

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          items,
          total: finalTotal,
          promoCode: discount > 0 ? promoCode : null,
          buyerLegalName,
          buyerArtistName,
          buyerAddress,
          paymentMethod,
        }),
      });

      if (!orderRes.ok) throw new Error("Chyba při vytváření objednávky");
      const order = await orderRes.json();

      if (paymentMethod === "bank_transfer") {
        const btRes = await fetch(`/api/orders/${order.id}/bank-transfer`, {
          method: "POST",
          credentials: "include",
        });
        if (!btRes.ok) {
          const btData = await btRes.json();
          throw new Error(btData.error || "Chyba při zahájení platby");
        }
        const btData = await btRes.json();
        clearCart();
        setBankInstructions(btData);
        return;
      }

      const payRes = await fetch(`/api/orders/${order.id}/pay`, {
        method: "POST",
        credentials: "include",
      });

      if (!payRes.ok) {
        const payData = await payRes.json();
        throw new Error(payData.error || "Chyba při zahájení platby");
      }

      const payData = await payRes.json();
      clearCart();

      if (payData.gw_url) {
        window.location.href = payData.gw_url;
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (freeSuccess) {
    return (
      <div className="fade-in" style={{
        minHeight: "calc(100vh - 42px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px"
      }}>
        <div style={{ maxWidth: "500px", width: "100%", textAlign: "center" }}>
          <h1 style={{ marginBottom: "24px" }}>Soubory jsou na cestě!</h1>
          <p style={{ color: "#666", marginBottom: "24px" }}>
            Na email <strong style={{ color: "#fff" }}>{email}</strong> jsme odeslali odkaz ke stažení.
            {user && " Najdete soubory také ve svém účtu."}
          </p>
          <p style={{ color: "#555", fontSize: "13px", marginBottom: "24px" }}>
            {user ? "Přesměrovávám na váš účet..." : "Přesměrovávám na hlavní stránku..."}
          </p>
          <button className="btn btn-bounce" onClick={() => navigate(user ? "/ucet" : "/")} style={{ borderRadius: "4px" }}>
            {user ? "Přejít na účet" : "Zpět na hlavní stránku"}
          </button>
        </div>
      </div>
    );
  }

  if (bankInstructions) {
    const bi = bankInstructions;
    const copyRow = (label: string, value: string, testId: string) => (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1a1a1a", gap: "12px" }}>
        <span style={{ fontSize: "12px", color: "#888" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span data-testid={testId} style={{ fontSize: "14px", color: "#fff", fontFamily: "monospace", fontWeight: 600 }}>{value}</span>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(value)}
            style={{ background: "none", border: "1px solid #2a2a2a", borderRadius: "3px", color: "#888", fontSize: "11px", padding: "3px 8px", cursor: "pointer" }}
            title="Kopírovat"
          >
            kopírovat
          </button>
        </div>
      </div>
    );
    return (
      <div className="fade-in" style={{
        minHeight: "calc(100vh - 42px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px"
      }}>
        <div style={{ maxWidth: "560px", width: "100%" }}>
          <h1 style={{ marginBottom: "8px", textAlign: "center" }}>Pokyny k platbě</h1>
          <p style={{ color: "#666", fontSize: "13px", textAlign: "center", marginBottom: "28px", lineHeight: 1.6 }}>
            Objednávka <strong style={{ color: "#fff" }}>#{bi.orderId}</strong> byla vytvořena.
            Pošlete prosím částku na náš účet pomocí bankovního převodu.
            Stejné pokyny jsme vám zaslali na <strong style={{ color: "#fff" }}>{email}</strong>.
          </p>

          <div style={{ border: "1px solid #2a2a2a", borderRadius: "4px", padding: "18px", marginBottom: "16px", background: "#0d0d0d" }}>
            <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Údaje k platbě</div>
            {copyRow("Číslo účtu", bi.accountNumber, "text-account-number")}
            {copyRow("Částka", `${bi.amount} ${bi.currency}`, "text-amount")}
            {copyRow("Variabilní symbol", bi.variableSymbol, "text-variable-symbol")}
            {copyRow("Zpráva pro příjemce", bi.messageForRecipient, "text-message")}
          </div>

          <div style={{ border: "1px solid #3a2a10", background: "rgba(245,158,11,0.06)", borderRadius: "4px", padding: "12px 14px", marginBottom: "20px" }}>
            <div style={{ fontSize: "12px", color: "#f5b150", lineHeight: 1.6 }}>
              <strong>Důležité:</strong> Bez správně vyplněného variabilního symbolu nebudeme schopni
              vaši platbu spárovat s objednávkou. Soubory a licenční smlouvu vám pošleme na email
              jakmile platba dorazí na účet (obvykle do 1–2 pracovních dnů).
            </div>
          </div>

          <p style={{ color: "#555", fontSize: "12px", textAlign: "center", marginBottom: "16px" }}>
            Stav objednávky můžete sledovat ve svém účtu.
          </p>

          <button
            className="btn btn-bounce"
            onClick={() => navigate("/ucet")}
            data-testid="button-go-to-account"
            style={{ width: "100%", borderRadius: "4px" }}
          >
            Přejít na účet
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fade-in" style={{
        minHeight: "calc(100vh - 42px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px"
      }}>
        <div style={{ maxWidth: "500px", width: "100%", textAlign: "center" }}>
          <h1 style={{ marginBottom: "24px" }}>Objednávka vytvořena!</h1>
          <p style={{ color: "#666", marginBottom: "24px" }}>
            Děkujeme za vaši objednávku. Na email {email} vám zašleme pokyny k platbě a po jejím přijetí odkaz ke stažení.
          </p>
          <button className="btn btn-bounce" onClick={() => navigate("/")} style={{ borderRadius: "4px" }}>
            Zpět na hlavní stránku
          </button>
        </div>
      </div>
    );
  }

  if (isFreeOrder) {
    return (
      <div className="fade-in" style={{
        minHeight: "calc(100vh - 42px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px"
      }}>
        <div style={{ maxWidth: "500px", width: "100%" }}>
          <h1 style={{ marginBottom: "8px", textAlign: "center" }}>Stažení zdarma</h1>
          <p style={{ color: "#555", fontSize: "13px", textAlign: "center", marginBottom: "28px" }}>
            Zadejte váš email a soubory vám zašleme okamžitě
          </p>

          <div style={{ marginBottom: "24px", padding: "16px", border: "1px solid #333", borderRadius: "4px" }}>
            <h3 style={{ marginBottom: "12px" }}>Shrnutí</h3>
            {cart.map((item: any) => (
              <div
                key={`${item.productType}-${item.productId}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid #222",
                }}
              >
                <span>{item.title}</span>
                <span style={{ color: "#24e053" }}>Zdarma</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", fontWeight: "bold" }}>
              <span>Celkem</span>
              <span style={{ color: "#24e053" }}>0 CZK</span>
            </div>
          </div>

          <form onSubmit={handleFreeSubmit}>
            {error && (
              <div style={{ color: "#ff4444", marginBottom: "16px", padding: "12px", border: "1px solid #ff4444", borderRadius: "4px" }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#999" }}>
                Email pro doručení *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vas@email.cz"
                data-testid="input-email-free"
                style={{ width: "100%", borderRadius: "4px" }}
              />
              <p style={{ fontSize: "12px", color: "#666", marginTop: "6px" }}>
                Na tento email zašleme odkaz ke stažení okamžitě po potvrzení
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-filled btn-bounce"
              disabled={loading}
              data-testid="button-claim-free"
              style={{ width: "100%", borderRadius: "4px" }}
            >
              {loading ? "Zpracování..." : "Získat zdarma"}
            </button>
            <p style={{ fontSize: "11px", color: "#555", textAlign: "center", marginTop: "12px", lineHeight: "1.5" }}>
              {user ? "Soubory budou okamžitě dostupné ve vašem účtu i na emailu." : "Odkaz ke stažení vám zašleme okamžitě na email."}
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{
      minHeight: "calc(100vh - 42px)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px"
    }}>
      <div style={{ maxWidth: "500px", width: "100%" }}>
        <h1 style={{ marginBottom: "24px", textAlign: "center" }}>Dokončení objednávky</h1>

        <div style={{ marginBottom: "24px", padding: "16px", border: "1px solid #333", borderRadius: "4px" }}>
          <h3 style={{ marginBottom: "12px" }}>Shrnutí objednávky</h3>
          {cart.map((item: any) => (
            <div
              key={`${item.productType}-${item.productId}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #222",
              }}
            >
              <span>{item.title}</span>
              <span>{item.price} CZK</span>
            </div>
          ))}
          {discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #222", color: "#888", fontSize: "13px" }}>
              <span>Mezisoučet</span>
              <span>{total} CZK</span>
            </div>
          )}
          {discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#24e053", fontSize: "13px" }}>
              <span>Sleva ({discount}%) – {promoCode.toUpperCase()}</span>
              <span>−{Math.round(total * discount / 100)} CZK</span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 0",
              fontWeight: "bold",
              borderTop: "1px solid #333",
              marginTop: "8px",
            }}
          >
            <span>Celkem</span>
            <span>{finalTotal} CZK</span>
          </div>
        </div>

        <div style={{ marginBottom: "24px", padding: "16px", border: "1px solid #333", borderRadius: "4px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", color: "#999" }}>Promo kód</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value); if (discount > 0) { setDiscount(0); setPromoError(""); } }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyPromoCode(); } }}
              placeholder="Zadejte kód"
              style={{ flex: 1, borderRadius: "4px" }}
              disabled={discount > 0}
            />
            {discount > 0 ? (
              <button type="button" className="btn" onClick={() => { setDiscount(0); setPromoCode(""); setPromoError(""); }} style={{ borderRadius: "4px", background: "#222", color: "#888" }}>Odebrat</button>
            ) : (
              <button type="button" className="btn" onClick={applyPromoCode} style={{ borderRadius: "4px" }}>Použít</button>
            )}
          </div>
          {promoError && <p style={{ color: "#ff4444", fontSize: "12px", marginTop: "4px" }}>{promoError}</p>}
          {discount > 0 && <p style={{ color: "#24e053", fontSize: "12px", marginTop: "4px" }}>Sleva {discount}% aplikována!</p>}
        </div>

        <div style={{ marginBottom: "24px", padding: "16px", border: "1px solid #333", borderRadius: "4px" }}>
          <h3 style={{ marginBottom: "12px", fontSize: "14px" }}>Způsob platby</h3>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "12px",
              border: paymentMethod === "bank_transfer" ? "1px solid #fff" : "1px solid #2a2a2a",
              borderRadius: "4px",
              cursor: "pointer",
              marginBottom: "8px",
              background: paymentMethod === "bank_transfer" ? "#161616" : "transparent",
            }}
            data-testid="option-bank-transfer"
          >
            <input
              type="radio"
              name="paymentMethod"
              value="bank_transfer"
              checked={paymentMethod === "bank_transfer"}
              onChange={() => setPaymentMethod("bank_transfer")}
              style={{ marginTop: "3px" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", color: "#fff", marginBottom: "2px" }}>Bankovní převod</div>
              <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.5 }}>
                Po dokončení obdržíte údaje k převodu (číslo účtu a variabilní symbol).
                Soubory a licenční smlouvu vám zašleme na email po přijetí platby (1–2 prac. dny).
              </div>
            </div>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "12px",
              border: "1px solid #2a2a2a",
              borderRadius: "4px",
              cursor: "not-allowed",
              opacity: 0.55,
              background: "transparent",
            }}
            data-testid="option-gopay"
            title="GoPay je momentálně mimo provoz"
          >
            <input
              type="radio"
              name="paymentMethod"
              value="gopay"
              checked={false}
              disabled
              readOnly
              style={{ marginTop: "3px" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", color: "#aaa", marginBottom: "2px" }}>
                GoPay – karta, Apple Pay, Google Pay, online převod
                <span style={{ marginLeft: "8px", fontSize: "11px", color: "#f5b150", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "3px", padding: "2px 6px", whiteSpace: "nowrap" }}>
                  čekáme na schválení
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#666", lineHeight: 1.5 }}>
                Okamžitá platba kartou nebo přes platební bránu. Zatím není k dispozici – aktivujeme po schválení od GoPay.
              </div>
            </div>
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ color: "#ff4444", marginBottom: "16px", padding: "12px", border: "1px solid #ff4444", borderRadius: "4px" }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#999" }}>
              Email pro doručení *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="vas@email.cz"
              data-testid="input-email"
              style={{ width: "100%", borderRadius: "4px" }}
            />
            <p style={{ fontSize: "12px", color: "#666", marginTop: "6px" }}>
              Na tento email vám zašleme odkaz ke stažení a kopii licenční smlouvy po zaplacení
            </p>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#999" }}>
              Právní jméno (celé jméno a příjmení) *
            </label>
            <input
              type="text"
              value={buyerLegalName}
              onChange={(e) => setBuyerLegalName(e.target.value)}
              required
              placeholder="Jan Novák"
              data-testid="input-legal-name"
              style={{ width: "100%", borderRadius: "4px" }}
            />
            <p style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              Vaše skutečné jméno pro licenční smlouvu
            </p>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#999" }}>
              Umělecké jméno *
            </label>
            <input
              type="text"
              value={buyerArtistName}
              onChange={(e) => setBuyerArtistName(e.target.value)}
              required
              placeholder="YourArtistName"
              data-testid="input-artist-name"
              style={{ width: "100%", borderRadius: "4px" }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#999" }}>
              Adresa trvalého bydliště *
            </label>
            <input
              type="text"
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              required
              placeholder="Ulice 123, Praha 1, 110 00"
              data-testid="input-address"
              style={{ width: "100%", borderRadius: "4px" }}
            />
            <p style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              Adresa pro licenční smlouvu
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-filled btn-bounce"
            disabled={loading}
            data-testid="button-submit-order"
            style={{ width: "100%", borderRadius: "4px" }}
          >
            {loading ? "Zpracování..." : `Zaplatit ${finalTotal} CZK`}
          </button>
          <p style={{ fontSize: "11px", color: "#555", textAlign: "center", marginTop: "12px", lineHeight: "1.5" }}>
            Dokončením objednávky souhlasíte s licenčními podmínkami VOODOO808.
            Kopii smlouvy s vašimi údaji obdržíte emailem.
          </p>
        </form>
      </div>
    </div>
  );
}

export default Checkout;
