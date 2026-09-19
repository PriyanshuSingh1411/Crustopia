"use client";
import { useState, useRef, useEffect } from "react";

const QUICK_ACTIONS = [
  { label: "🍕 View Menu", action: "menu" },
  { label: "📦 Track Order", action: "track" },
  { label: "🛒 Cart", action: "cart" },
  { label: "📞 Contact Support", action: "contact" },
];

const FAQ = [
  {
    question: "What are your delivery hours?",
    answer: "We deliver from 10:00 AM to 11:00 PM every day!",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Delivery typically takes 30-45 minutes depending on your location.",
  },
  {
    question: "Do you offer vegetarian options?",
    answer: "Yes! We have a wide variety of vegetarian pizzas and toppings.",
  },
  {
    question: "How can I track my order?",
    answer:
      "You can track your order in the 'My Orders' section of your account.",
  },
  {
    question: "Do you offer contactless delivery?",
    answer:
      "Yes, we offer contactless delivery. Just add a note in your order!",
  },
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi there! 🍕 Welcome to Pizza App! How can I help you today?",
      sender: "bot",
      time: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: "user",
      time: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = getBotResponse(inputText);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: botResponse,
          sender: "bot",
          time: new Date(),
        },
      ]);
      setIsTyping(false);
    }, 1000);
  };

  const getBotResponse = (input) => {
    const lowerInput = input.toLowerCase();

    if (
      lowerInput.includes("menu") ||
      lowerInput.includes("pizza") ||
      lowerInput.includes("order")
    ) {
      return "Great choice! 🍕 You can browse our delicious pizza menu by clicking 'Menu' above, or I can recommend our popular Margherita and Pepperoni pizzas!";
    }
    if (
      lowerInput.includes("track") ||
      lowerInput.includes("delivery") ||
      lowerInput.includes("status")
    ) {
      return "To track your order, please visit the 'My Orders' section in your account. You'll see real-time updates on your delivery status!";
    }
    if (
      lowerInput.includes("price") ||
      lowerInput.includes("cost") ||
      lowerInput.includes("cheap")
    ) {
      return "Our pizzas start at just ₹299! We also have great combo deals and discounts. Check out our menu for current offers! 🎉";
    }
    if (lowerInput.includes("vegetarian") || lowerInput.includes("veg")) {
      return "Yes, we have amazing vegetarian options! Try our Veggie Supreme, Paneer Makhani, and Fresh Garden pizzas!";
    }
    if (
      lowerInput.includes("hello") ||
      lowerInput.includes("hi") ||
      lowerInput.includes("hey")
    ) {
      return "Hello! 👋 How can I help you with your pizza cravings today?";
    }
    if (lowerInput.includes("thank")) {
      return "You're welcome! 😊 Enjoy your pizza! If you have more questions, feel free to ask!";
    }

    return (
      "I understand you're asking about: '" +
      input +
      "'. For detailed help, you can browse our menu or contact our support team. We're here to help! 🍕"
    );
  };

  const handleQuickAction = (action) => {
    const actionMessages = {
      menu: "Great! Visit our Menu page to explore our delicious pizza options! 🍕",
      track:
        "You can track your order in the My Orders section. Enter your order ID for real-time updates! 📦",
      cart: "Click on the Cart icon in the navigation to view and manage your items! 🛒",
      contact:
        "You can reach our support team at support@pizzaapp.com or call us at +91 9876543210! 📞",
    };

    const userMessage = {
      id: Date.now(),
      text: QUICK_ACTIONS.find((a) => a.action === action)?.label || action,
      sender: "user",
      time: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: actionMessages[action],
          sender: "bot",
          time: new Date(),
        },
      ]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={getChatToggleButton(isOpen)}
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {isOpen && (
        <div style={getChatWindow()}>
          <div style={getChatHeader()}>
            <div style={getHeaderContent()}>
              <span style={getBotAvatar()}>🤖</span>
              <div>
                <h3 style={getHeaderTitle()}>Pizza Assistant</h3>
                <p style={getHeaderSubtitle()}>Online • Always ready to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={getMinimizeButton()}
            >
              −
            </button>
          </div>

          <div style={getMessagesContainer()}>
            {messages.map((msg) => (
              <div key={msg.id} style={getMessageWrapper(msg.sender)}>
                {msg.sender === "bot" && (
                  <span style={getMsgBotAvatar()}>🤖</span>
                )}
                <div style={getMessageBubble(msg.sender)}>
                  <p style={getMessageText()}>{msg.text}</p>
                  <span style={getMessageTime()}>
                    {msg.time.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={getMessageWrapper("bot")}>
                <span style={getMsgBotAvatar()}>🤖</span>
                <div style={getTypingIndicator()}>
                  <span style={getTypingDot()}>•</span>
                  <span style={getTypingDot()}>•</span>
                  <span style={getTypingDot()}>•</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={getQuickActionsContainer()}>
            <p style={getQuickActionsLabel()}>Quick Help:</p>
            <div style={getQuickActionsGrid()}>
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.action}
                  onClick={() => handleQuickAction(action.action)}
                  style={getQuickActionButton()}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div style={getInputContainer()}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              style={getInputField()}
            />
            <button onClick={handleSend} style={getSendButton()}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function getChatToggleButton(isOpen) {
  return {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    cursor: "pointer",
    fontSize: "26px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 25px rgba(102, 126, 234, 0.5)",
    zIndex: 9999,
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  };
}

function getChatWindow() {
  return {
    position: "fixed",
    bottom: "100px",
    right: "24px",
    width: "380px",
    maxWidth: "calc(100vw - 48px)",
    height: "520px",
    maxHeight: "calc(100vh - 120px)",
    background: "#fff",
    borderRadius: "24px",
    boxShadow: "0 15px 50px rgba(0,0,0,0.2)",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };
}

function getChatHeader() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
  };
}

function getHeaderContent() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };
}

function getBotAvatar() {
  return {
    fontSize: "32px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "50%",
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

function getHeaderTitle() {
  return {
    margin: 0,
    fontSize: "16px",
    fontWeight: "700",
  };
}

function getHeaderSubtitle() {
  return {
    margin: 0,
    fontSize: "12px",
    opacity: 0.9,
  };
}

function getMinimizeButton() {
  return {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    color: "#fff",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

function getMessagesContainer() {
  return {
    flex: 1,
    padding: "16px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    background: "#f8fafc",
  };
}

function getMessageWrapper(sender) {
  return {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
    flexDirection: sender === "user" ? "row-reverse" : "row",
  };
}

function getMsgBotAvatar() {
  return {
    fontSize: "24px",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

function getMessageBubble(sender) {
  return {
    maxWidth: "75%",
    padding: "12px 16px",
    borderRadius:
      sender === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
    background:
      sender === "user"
        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        : "#fff",
    color: sender === "user" ? "#fff" : "#1e293b",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  };
}

function getMessageText() {
  return {
    margin: 0,
    fontSize: "14px",
    lineHeight: "1.5",
  };
}

function getMessageTime() {
  return {
    display: "block",
    fontSize: "10px",
    opacity: 0.7,
    marginTop: "4px",
    textAlign: "right",
  };
}

function getTypingIndicator() {
  return {
    display: "flex",
    gap: "4px",
    padding: "12px 16px",
    background: "#fff",
    borderRadius: "18px 18px 18px 4px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  };
}

function getTypingDot() {
  return {
    fontSize: "18px",
    color: "#667eea",
  };
}

function getQuickActionsContainer() {
  return {
    padding: "12px 16px",
    background: "#fff",
    borderTop: "1px solid #e2e8f0",
  };
}

function getQuickActionsLabel() {
  return {
    margin: "0 0 8px 0",
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
  };
}

function getQuickActionsGrid() {
  return {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  };
}

function getQuickActionButton() {
  return {
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "500",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    background: "#fff",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };
}

function getInputContainer() {
  return {
    display: "flex",
    gap: "10px",
    padding: "16px",
    background: "#fff",
    borderTop: "1px solid #e2e8f0",
  };
}

function getInputField() {
  return {
    flex: 1,
    padding: "12px 16px",
    border: "2px solid #e2e8f0",
    borderRadius: "24px",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s ease",
  };
}

function getSendButton() {
  return {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.2s ease",
  };
}
