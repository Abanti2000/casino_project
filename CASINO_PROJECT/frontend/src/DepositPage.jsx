import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./DepositPage.css";

const paymentMethods = [
  { label: "Fast Deposit", icon: "/public/gift-icon.png" },
  { label: "Bank Transfer", icon: "/public/logo.png" },
  { label: "E-Wallet", icon: "/public/logo.png" },
  { label: "Telco", icon: "/public/logo.png" },
  { label: "Fpay Crypto", icon: "/public/logo.png" },
  { label: "UPI (Manual)", icon: "/public/logo.png" },
];

const depositChannels = [
  { label: "RapidPay", icon: "/public/logo.png" },
  { label: "PAYESSENCEPAY", icon: "/public/logo.png" },
  { label: "FPAY", icon: "/public/logo.png" },
  { label: "FPX-ALLIANCE", icon: "/public/logo.png" },
  { label: "FPX-AMBANK", icon: "/public/logo.png" },
  { label: "FPX-BSN", icon: "/public/logo.png" },
  { label: "FPX-CIMB", icon: "/public/logo.png" },
  { label: "FPX-DUITNOW", icon: "/public/logo.png" },
  { label: "FPX-HLB", icon: "/public/logo.png" },
];

const quickAmounts = [500, 1000, 8001, 5000, 8000, 10000];

const DepositPage = () => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState("Fast Deposit");
  const [selectedChannel, setSelectedChannel] = useState("RapidPay");
  const [amount, setAmount] = useState(0);
  const [selectedQuick, setSelectedQuick] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [userInfo, setUserInfo] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [upiDetails, setUpiDetails] = useState(null);

  const quotaMin = 30;
  const quotaMax = 50000;
  const processingFee = 0;
  const receivable = amount;

  // Set auth cookie on component mount if not already set
  useEffect(() => {
    const setCookieIfNeeded = () => {
      const cookies = document.cookie.split(";");
      const authCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("auth=")
      );
      if (!authCookie) {
        document.cookie = `auth=25ed5ee9181a63dc4ac14946a042e97f; path=/; SameSite=Lax`;
      }
    };
    setCookieIfNeeded();
  }, []);

  // Fetch user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      setLoadingUser(true);
      try {
        const response = await fetch(
          "http://localhost:8001/api/webapi/GetUserInfo",
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (!response.ok) {
          if (response.status === 404 || response.status === 401) {
            setUserInfo({ money_user: "0" });
            return;
          }
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        if (data.status) {
          setUserInfo(data.data);
        } else {
          throw new Error(data.message || "Failed to fetch user info");
        }
      } catch (err) {
        console.error("User info fetch error:", err);
        setUserInfo({ money_user: "0" });
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUserInfo();
  }, [navigate]);

  const handleSubmit = async () => {
    if (amount < quotaMin || amount > quotaMax) {
      alert(`Amount must be between MYR ${quotaMin} and MYR ${quotaMax}`);
      return;
    }
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      // Redirect to the payment URL with the amount parameter
      window.location.href = `http://localhost:8001/wallet/paynow/rspay?am=${amount}`;
    } catch (err) {
      console.error("Redirect error:", err);
      alert("Failed to process payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="deposit-page">
      {/* Top Bar */}
      <div className="deposit-header">
        <button className="back-arrow" onClick={() => navigate("/")}>
          ←
        </button>
        <div className="deposit-header-title-group">
         
          <span className="deposit-records">Deposit Records</span>
        </div>
      </div>

      {loadingUser ? (
        <div className="loading-container">
          <p>Loading user information...</p>
        </div>
      ) : (
        <div className="user-welcome">
          {userInfo?.money_user !== undefined && (
            <p>
              Current Balance: MYR{" "}
              {parseFloat(userInfo.money_user).toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="deposit-tabs">
        <span className="active">Deposit</span>
        <span onClick={() => navigate("/withdrawal")}>Withdrawal</span>
      </div>

      {/* Payment Method */}
      <div className="section-title">Payment Method</div>
      <div className="payment-methods">
        {paymentMethods.map((method) => (
          <div
            key={method.label}
            className={`method-card${
              selectedMethod === method.label ? " selected" : ""
            }`}
            onClick={() => setSelectedMethod(method.label)}
          >
            <img src={method.icon} alt={method.label} className="method-icon" />
            <span>{method.label}</span>
          </div>
        ))}
      </div>

      {/* Deposit Channel */}
      {selectedMethod !== "UPI (Manual)" && (
        <>
          <div className="section-title">Deposit Channel</div>
          <div className="deposit-channels">
            {depositChannels.map((channel) => (
              <div
                key={channel.label}
                className={`channel-card${
                  selectedChannel === channel.label ? " selected" : ""
                }`}
                onClick={() => setSelectedChannel(channel.label)}
              >
                <img
                  src={channel.icon}
                  alt={channel.label}
                  className="channel-icon"
                />
                <span>{channel.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Deposit Info */}
      <div className="deposit-info-section">
        <div className="deposit-quota-row">
          <span>Deposit Quota</span>
          <span className="quota-red">
            MYR {quotaMin.toFixed(2)} - MYR{" "}
            {quotaMax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="deposit-input-row">
          <span>MYR</span>
          <input
            type="number"
            className="deposit-amount-input"
            value={amount}
            min={quotaMin}
            max={quotaMax}
            placeholder="Enter amount"
            onChange={(e) => {
              const value = Number(e.target.value);
              setAmount(value);
              setSelectedQuick(null);
            }}
          />
        </div>

        <div className="deposit-fee-row">
          <span>Processing Fees</span>
          <span>MYR {processingFee.toFixed(2)}</span>
        </div>

        <div className="deposit-receivable-row">
          <span>Receivable Amount</span>
          <span className="quota-red">MYR {receivable.toFixed(2)}</span>
        </div>

        {/* Quick Amount Buttons */}
        <div className="quick-amounts-row">
          {quickAmounts.map((amt, idx) => (
            <button
              key={amt}
              className={`quick-amount-btn${
                selectedQuick === idx ? " selected" : ""
              }`}
              onClick={() => {
                setAmount(amt);
                setSelectedQuick(idx);
              }}
            >
              {amt.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Submit Button */}
        <button
          className="deposit-submit"
          onClick={handleSubmit}
          disabled={loading || !amount || amount < quotaMin || amount > quotaMax}
        >
          {loading ? "PROCESSING..." : "SUBMIT"}
        </button>
      </div>

      {/* Show UPI details */}
      {upiDetails && selectedMethod === "UPI (Manual)" && (
        <div className="upi-section">
          <h3>UPI Payment</h3>
          <p>
            <b>UPI ID:</b> {upiDetails.UpiId}
          </p>
          <p>
            <b>Amount:</b> {upiDetails.Amount}
          </p>
          {upiDetails.qrcode && (
            <img
              src={`data:image/png;base64,${upiDetails.qrcode}`}
              alt="UPI QR Code"
              className="upi-qr"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DepositPage;