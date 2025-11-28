import React, { useState, useEffect } from "react";
import API_BASE from "../utils/apiBase";

function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

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
    loadMessages(user);
  }, []);

  const loadMessages = async (user) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/messages`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-current-user": JSON.stringify(user),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        setError("Failed to load messages");
      }
    } catch (err) {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId) => {
    if (!currentUser) return;

    try {
      await fetch(`${API_BASE}/api/messages/${messageId}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-current-user": JSON.stringify(currentUser),
        },
      });

      // Update local state to mark as read
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isRead: true } : msg,
        ),
      );

      // Notify other components that messages have been updated
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(new Event("message-updated"));
      }
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return;

    try {
      setSendingReply(true);

      const response = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-current-user": JSON.stringify(currentUser),
        },
        body: JSON.stringify({
          receiverId:
            selectedMessage.sender.id === currentUser.id
              ? selectedMessage.receiver.id
              : selectedMessage.sender.id,
          subject: `Re: ${selectedMessage.subject}`,
          content: replyContent.trim(),
        }),
      });

      if (response.ok) {
        alert("Reply sent successfully!");
        setReplyContent("");
        // Reload messages to show the new reply
        loadMessages(currentUser);
      } else {
        alert("Failed to send reply");
      }
    } catch (error) {
      console.error("Send reply error:", error);
      alert("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    setReplyContent("");

    // Mark as read if it's received and not read yet
    if (!message.isSentByMe && !message.isRead) {
      markAsRead(message.id);
    }
  };

  const sentMessages = messages.filter((msg) => msg.isSentByMe);
  const receivedMessages = messages.filter((msg) => !msg.isSentByMe);

  if (loading) {
    return (
      <div className="container-fluid" style={{ padding: "2rem" }}>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading your messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ padding: "2rem" }}>
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-0 text-gray-800">Messages</h1>
              <p className="text-muted">Communicate with other users</p>
            </div>
            <div>
              <span className="badge badge-info">
                Total Messages: {messages.length}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <div className="row">
            {/* Messages List */}
            <div className="col-md-5">
              <div className="card shadow">
                <div className="card-header">
                  <ul className="nav nav-tabs card-header-tabs">
                    <li className="nav-item">
                      <a
                        className="nav-link active"
                        href="#received"
                        data-toggle="tab"
                      >
                        Received ({receivedMessages.length})
                      </a>
                    </li>
                    <li className="nav-item">
                      <a className="nav-link" href="#sent" data-toggle="tab">
                        Sent ({sentMessages.length})
                      </a>
                    </li>
                  </ul>
                </div>
                <div
                  className="card-body"
                  style={{ maxHeight: "600px", overflowY: "auto" }}
                >
                  <div className="tab-content">
                    {/* Received Messages */}
                    <div className="tab-pane fade show active" id="received">
                      {receivedMessages.length === 0 ? (
                        <div className="text-center py-4">
                          <i className="fa fa-inbox fa-2x text-muted mb-2"></i>
                          <p className="text-muted">No received messages</p>
                        </div>
                      ) : (
                        receivedMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`message-item p-3 mb-2 border rounded cursor-pointer ${
                              selectedMessage?.id === message.id
                                ? "bg-light border-primary"
                                : ""
                            } ${!message.isRead ? "bg-info-light" : ""}`}
                            onClick={() => handleMessageClick(message)}
                            style={{ cursor: "pointer" }}
                          >
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center mb-1">
                                  <strong className="text-primary">
                                    {message.sender.name}
                                  </strong>
                                  {!message.isRead && (
                                    <span className="badge badge-danger ml-2">
                                      New
                                    </span>
                                  )}
                                </div>
                                <div className="font-weight-bold small text-truncate mb-1">
                                  {message.subject}
                                </div>
                                <div className="small text-muted text-truncate">
                                  {message.content.substring(0, 50)}...
                                </div>
                              </div>
                              <small className="text-muted ml-2">
                                {formatDate(message.createdAt)}
                              </small>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Sent Messages */}
                    <div className="tab-pane fade" id="sent">
                      {sentMessages.length === 0 ? (
                        <div className="text-center py-4">
                          <i className="fa fa-paper-plane fa-2x text-muted mb-2"></i>
                          <p className="text-muted">No sent messages</p>
                        </div>
                      ) : (
                        sentMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`message-item p-3 mb-2 border rounded cursor-pointer ${
                              selectedMessage?.id === message.id
                                ? "bg-light border-primary"
                                : ""
                            }`}
                            onClick={() => handleMessageClick(message)}
                            style={{ cursor: "pointer" }}
                          >
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center mb-1">
                                  <strong>To: {message.receiver.name}</strong>
                                </div>
                                <div className="font-weight-bold small text-truncate mb-1">
                                  {message.subject}
                                </div>
                                <div className="small text-muted text-truncate">
                                  {message.content.substring(0, 50)}...
                                </div>
                              </div>
                              <small className="text-muted ml-2">
                                {formatDate(message.createdAt)}
                              </small>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Detail */}
            <div className="col-md-7">
              {selectedMessage ? (
                <div className="card shadow">
                  <div className="card-header">
                    <h5 className="mb-0">{selectedMessage.subject}</h5>
                    <small className="text-muted">
                      {selectedMessage.isSentByMe ? "To" : "From"}:{" "}
                      {selectedMessage.isSentByMe
                        ? selectedMessage.receiver.name
                        : selectedMessage.sender.name}{" "}
                      • {formatDate(selectedMessage.createdAt)}
                    </small>
                  </div>
                  <div className="card-body">
                    <div className="message-content mb-4">
                      <p style={{ whiteSpace: "pre-wrap" }}>
                        {selectedMessage.content}
                      </p>
                    </div>

                    {/* Reply Section */}
                    <div className="border-top pt-3">
                      <h6>Reply</h6>
                      <div className="form-group">
                        <textarea
                          className="form-control"
                          rows="4"
                          placeholder="Type your reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                        ></textarea>
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={handleReply}
                        disabled={!replyContent.trim() || sendingReply}
                      >
                        {sendingReply ? "Sending..." : "Send Reply"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card shadow">
                  <div className="card-body text-center py-5">
                    <i className="fa fa-envelope-open fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">Select a message to view</h5>
                    <p className="text-muted">
                      Choose a message from the list to read its contents and
                      reply
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Messages;
