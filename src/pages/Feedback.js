import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import API_BASE from "../utils/apiBase";
import "./Support.css";

function Feedback() {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const getCurrentUser = () => {
      try {
        const s = sessionStorage.getItem("currentUser");
        if (s) {
          return JSON.parse(s);
        }
        if (localStorage.getItem("rememberMe") === "true") {
          const l = localStorage.getItem("currentUser");
          if (l) {
            return JSON.parse(l);
          }
        }
      } catch {
        // ignore
      }
      return null;
    };

    const user = getCurrentUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setCurrentUser(user);
    loadConversations(user);
  }, []);

  useEffect(() => {
    // If user has conversations, automatically show the conversation view
    if (conversations.length > 0) {
      setShowConversation(true);
      setSelectedContactId("admin");
      loadMessages("admin");
    }
  }, [conversations]);

  const loadConversations = async (user) => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE}/api/feedback/conversations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-current-user": JSON.stringify(user),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else {
        setError(t("feedback.unableToLoad"));
        setConversations([]);
      }
    } catch (err) {
      setError(t("feedback.unableToConnect"));
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (contactId) => {
    if (!currentUser || !contactId) return;

    try {
      const response = await fetch(`${API_BASE}/api/feedback/messages`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-current-user": JSON.stringify(currentUser),
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter messages for this conversation
        let conversationMessages = [];

        if (isAdmin) {
          // For admin: show messages between admin and the selected user
          conversationMessages = (data.messages || [])
            .filter(
              (msg) =>
                (msg.sender.id === contactId && msg.receiver.id === "admin") ||
                (msg.sender.id === "admin" && msg.receiver.id === contactId) ||
                (msg.sender.id === contactId &&
                  msg.receiver.id === currentUser.id) ||
                (msg.sender.id === currentUser.id &&
                  msg.receiver.id === contactId),
            )
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else {
          // For regular users: show messages between user and admin
          conversationMessages = (data.messages || [])
            .filter(
              (msg) =>
                (msg.sender.id === contactId &&
                  msg.receiver.id === currentUser.id) ||
                (msg.sender.id === currentUser.id &&
                  msg.receiver.id === contactId) ||
                (msg.sender.id === contactId && msg.receiver.id === "admin") ||
                (msg.sender.id === "admin" && msg.receiver.id === contactId),
            )
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }

        setMessages(conversationMessages);

        // Mark unread messages as read
        const unreadMessages = conversationMessages.filter(
          (msg) => !msg.isSentByMe && !msg.isRead,
        );

        for (const msg of unreadMessages) {
          await markAsRead(msg.id);
        }
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const markAsRead = async (messageId) => {
    if (!currentUser) return;

    try {
      await fetch(`${API_BASE}/api/feedback/${messageId}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-current-user": JSON.stringify(currentUser),
        },
      });

      // Notify other components that feedback has been updated
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(new Event("feedback-updated"));
      }
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  const handleContactClick = (contactId) => {
    setSelectedContactId(contactId);
    loadMessages(contactId);
  };

  const handleSendMessage = async () => {
    if (!currentUser || !selectedContactId || !newMessage.trim()) return;

    try {
      setSendingMessage(true);
      const response = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-current-user": JSON.stringify(currentUser),
        },
        body: JSON.stringify({
          receiverId: selectedContactId,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage("");

        // If admin sent a message, mark all messages from this user as read
        if (isAdmin) {
          const userMessages = messages.filter(
            (msg) =>
              msg.sender.id === selectedContactId &&
              !msg.isSentByMe &&
              !msg.isRead,
          );
          for (const msg of userMessages) {
            await markAsRead(msg.id);
          }
        }

        // Reload conversations and messages
        await loadConversations(currentUser);
        await loadMessages(selectedContactId);

        // Notify other components that feedback has been updated
        if (typeof window !== "undefined" && window.dispatchEvent) {
          window.dispatchEvent(new Event("feedback-updated"));
        }
      } else {
        alert(t("feedback.failedToSend"));
      }
    } catch (error) {
      console.error("Send message error:", error);
      alert(t("feedback.failedToSend"));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendFeedbackClick = () => {
    setShowConversation(true);
    // Auto-select admin as the contact
    setSelectedContactId("admin");
    loadMessages("admin");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t("feedback.yesterday");
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `${t("feedback.yesterday")} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }
  };

  // Group messages by date for date separators
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach((msg) => {
      const date = new Date(msg.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  const isAdmin =
    currentUser &&
    (String(currentUser.roleType || "").toLowerCase() === "administrative" ||
      String(currentUser.roleType || "").toLowerCase() === "administrator");

  const selectedConversation = conversations.find(
    (conv) => conv.contactId === selectedContactId,
  );
  const groupedMessages = groupMessagesByDate(messages);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (loading && !showConversation) {
    return (
      <div className="container-fluid" style={{ padding: "2rem" }}>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">{t("feedback.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid feedback-container">
      <div className="row h-100">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h1 className="h3 mb-0 text-gray-800">Feedback</h1>
              <p className="text-muted mb-0">Share your feedback with us</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger error-alert" role="alert">
              {error}
            </div>
          )}

          {!showConversation ? (
            <div className="row">
              <div className="col-12">
                <div className="card shadow">
                  <div className="card-body text-center py-5">
                    <h4 className="mb-4">
                      We&apos;d love to hear your feedback!
                    </h4>
                    <p className="mb-4">
                      Your feedback helps us improve our platform and provide
                      better service to all users.
                    </p>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleSendFeedbackClick}
                    >
                      Send Feedback
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="row feedback-row">
              {/* Contacts Sidebar */}
              <div className="col-md-4 col-lg-3 contacts-sidebar">
                <div className="card shadow contacts-card">
                  <div className="card-header contacts-header">
                    <h6 className="mb-0">
                      <i className="fa fa-comments mr-2"></i>
                      {t("feedback.conversations")} ({conversations.length})
                    </h6>
                  </div>
                  <div className="card-body contacts-body">
                    {conversations.length === 0 ? (
                      <div className="empty-sidebar">
                        <i className="fa fa-comments empty-sidebar-icon"></i>
                        <p className="empty-sidebar-title">
                          {t("feedback.noConversationsYet")}
                        </p>
                        <small className="empty-sidebar-text">
                          {t("feedback.startChatting")}
                        </small>
                      </div>
                    ) : (
                      conversations.map((conversation) => (
                        <div
                          key={conversation.contactId}
                          className={`contact-item ${
                            selectedContactId === conversation.contactId
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            handleContactClick(conversation.contactId)
                          }
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center mb-1">
                                <strong className="contact-name">
                                  {conversation.contactName}
                                </strong>
                                {conversation.unreadCount > 0 && (
                                  <span className="badge badge-danger unread-badge">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                            <small className="contact-time">
                              {formatDate(conversation.lastMessageTime)}
                            </small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Chat Area */}
              <div className="col-md-8 col-lg-9 chat-area">
                {selectedContactId ? (
                  <div className="card shadow chat-card">
                    {/* Chat Header */}
                    <div className="card-header chat-header">
                      <h6 className="mb-0">
                        <i className="fa fa-user mr-2"></i>
                        {t("feedback.feedbackChatHistory")}
                      </h6>
                    </div>

                    {/* Messages Area */}
                    <div className="card-body chat-messages">
                      {Object.keys(groupedMessages).length === 0 ? (
                        <div className="empty-chat">
                          <i className="fa fa-comments empty-chat-icon"></i>
                          <p className="empty-chat-title">
                            {t("feedback.noMessagesYet")}
                          </p>
                          <small className="empty-chat-text">
                            {t("feedback.startConversation")}
                          </small>
                        </div>
                      ) : (
                        Object.entries(groupedMessages).map(
                          ([date, dateMessages]) => (
                            <div key={date}>
                              {/* Date Separator */}
                              <div className="date-separator">
                                <span className="date-badge">
                                  {new Date(date).toDateString() ===
                                  new Date().toDateString()
                                    ? t("feedback.today")
                                    : new Date(date).toDateString() ===
                                        new Date(
                                          Date.now() - 86400000,
                                        ).toDateString()
                                      ? t("feedback.yesterday")
                                      : new Date(date).toLocaleDateString()}
                                </span>
                              </div>

                              {/* Messages */}
                              {dateMessages.map((message) => (
                                <div
                                  key={message.id}
                                  className="message-container"
                                >
                                  {message.isSentByMe && (
                                    <div className="message-sender-label">
                                      <small>{t("feedback.you")}</small>
                                    </div>
                                  )}
                                  <div
                                    className={`message-bubble ${
                                      message.isSentByMe ? "sent" : "received"
                                    }`}
                                  >
                                    <div className="message-content">
                                      <div className="message-text">
                                        {message.content}
                                      </div>
                                      <div className="message-time">
                                        {formatMessageDate(message.createdAt)}
                                      </div>
                                      {isAdmin &&
                                        message.isSentByMe &&
                                        selectedContactId && (
                                          <div className="admin-reply-note">
                                            <small>
                                              <em>
                                                {t("feedback.repliedTo")}{" "}
                                                {selectedConversation?.contactName ||
                                                  "user"}
                                              </em>
                                            </small>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ),
                        )
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="message-input-area">
                      <div className="message-input-group">
                        <textarea
                          className="form-control message-textarea"
                          placeholder={t("feedback.typeMessage")}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          rows="2"
                        />
                        <button
                          className="btn message-send-btn"
                          type="button"
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sendingMessage}
                        >
                          {sendingMessage ? (
                            <i className="fa fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fa fa-paper-plane"></i>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card shadow h-100 d-flex align-items-center justify-content-center">
                    <div className="text-center">
                      <i className="fa fa-comments fa-4x text-muted mb-4"></i>
                      <h4 className="text-muted">
                        {t("feedback.selectConversation")}
                      </h4>
                      <p className="text-muted">
                        {t("feedback.chooseContact")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Feedback;
