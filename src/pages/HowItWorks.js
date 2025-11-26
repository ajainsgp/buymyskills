import React from "react";
import { Link } from "react-router-dom";

function HowItWorks() {
  return (
    <div>
      {/* Hero Section - Full Width, No Margins */}
      <div
        style={{
          padding: "4rem 2rem",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
        }}
      >
        <div className="container">
          <div className="text-center">
            <h1 className="display-4 font-weight-bold mb-3">How It Works</h1>
            <p className="lead" style={{ fontSize: "1.5rem", opacity: "0.9" }}>
              Transform your expertise into opportunities. Join thousands of
              professionals connecting globally.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: "2rem 0" }}>
        <div className="row">
          <div className="col-lg-8 mx-auto">
            {/* Introduction */}
            <div className="card shadow mb-4">
              <div className="card-body p-3">
                <h2
                  className="card-title text-center mb-3"
                  style={{ color: "#042C76" }}
                >
                  🚀 Offer Your Expertise to the World
                </h2>
                <p className="card-text lead text-center mb-3">
                  <strong>Buy My Skills</strong> is your gateway to connecting
                  with clients worldwide. Whether you&apos;re a developer,
                  designer, consultant, or expert in any field, our platform
                  makes it simple to showcase your skills and find meaningful
                  work.
                </p>
                <div className="text-center">
                  <Link
                    to="/register"
                    className="btn btn-primary btn-lg px-4 py-2"
                  >
                    <i className="fa fa-user-plus mr-2"></i>
                    Join as a Seller Today
                  </Link>
                </div>
              </div>
            </div>

            {/* Steps to Get Started */}
            <div className="card shadow mb-4">
              <div className="card-header bg-primary text-white">
                <h3 className="mb-0">
                  <i className="fa fa-road mr-2"></i>3 Simple Steps to Get
                  Started
                </h3>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 text-center mb-4">
                    <div
                      style={{
                        fontSize: "3rem",
                        color: "#28a745",
                        marginBottom: "1rem",
                      }}
                    >
                      📝
                    </div>
                    <h4 className="mb-3">1. Create Your Profile</h4>
                    <p>
                      Sign up and create a compelling profile showcasing your
                      skills, experience, and what makes you unique. Add your
                      photo and detailed description to stand out.
                    </p>
                  </div>
                  <div className="col-md-4 text-center mb-4">
                    <div
                      style={{
                        fontSize: "3rem",
                        color: "#ffc107",
                        marginBottom: "1rem",
                      }}
                    >
                      🎯
                    </div>
                    <h4 className="mb-3">2. Set Your Availability</h4>
                    <p>
                      Choose your preferred work style (remote, on-site, or
                      hybrid) and specify when you&apos;re available. Set your
                      rates and project preferences to attract the right
                      clients.
                    </p>
                  </div>
                  <div className="col-md-4 text-center mb-4">
                    <div
                      style={{
                        fontSize: "3rem",
                        color: "#17a2b8",
                        marginBottom: "1rem",
                      }}
                    >
                      🤝
                    </div>
                    <h4 className="mb-3">3. Connect & Collaborate</h4>
                    <p>
                      Get discovered by clients browsing our platform. Respond
                      to inquiries, discuss project details, and start working
                      on exciting opportunities that match your expertise.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Why Choose Us */}
            <div className="card shadow mb-4">
              <div className="card-header bg-success text-white">
                <h3 className="mb-0">
                  <i className="fa fa-star mr-2"></i>
                  Why Choose Buy My Skills?
                </h3>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-start">
                      <div
                        style={{
                          fontSize: "2rem",
                          marginRight: "1rem",
                          color: "#28a745",
                        }}
                      >
                        🌍
                      </div>
                      <div>
                        <h5>Global Reach</h5>
                        <p>
                          Connect with clients from around the world. No
                          geographical boundaries limit your opportunities.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-start">
                      <div
                        style={{
                          fontSize: "2rem",
                          marginRight: "1rem",
                          color: "#007bff",
                        }}
                      >
                        💼
                      </div>
                      <div>
                        <h5>Flexible Work</h5>
                        <p>
                          Set your own schedule and work preferences. Choose
                          projects that fit your lifestyle and expertise.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-start">
                      <div
                        style={{
                          fontSize: "2rem",
                          marginRight: "1rem",
                          color: "#ffc107",
                        }}
                      >
                        🔒
                      </div>
                      <div>
                        <h5>Secure Platform</h5>
                        <p>
                          Your data is protected with industry-standard
                          security. Safe and reliable transactions.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-start">
                      <div
                        style={{
                          fontSize: "2rem",
                          marginRight: "1rem",
                          color: "#dc3545",
                        }}
                      >
                        💰
                      </div>
                      <div>
                        <h5>Fair Compensation</h5>
                        <p>
                          Set competitive rates for your services. Get paid for
                          the value you provide to clients.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Stories */}
            <div className="card shadow mb-4">
              <div className="card-header bg-info text-white">
                <h3 className="mb-0">
                  <i className="fa fa-trophy mr-2"></i>
                  Success Stories
                </h3>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 text-center mb-3">
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                      👨‍💻
                    </div>
                    <h6>Sarah - Software Developer</h6>
                    <p className="small">
                      &quot;Found 3 major projects in my first month. The
                      platform platform platform platform made it easy to
                      showcase my React expertise.&quot;
                    </p>
                  </div>
                  <div className="col-md-4 text-center mb-3">
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                      🎨
                    </div>
                    <h6>Mike - UI/UX Designer</h6>
                    <p className="small">
                      &quot;Connected with international clients. The profile
                      system helped me stand out from the competition.&quot;
                    </p>
                  </div>
                  <div className="col-md-4 text-center mb-3">
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                      📊
                    </div>
                    <h6>Anna - Data Analyst</h6>
                    <p className="small">
                      &quot;Perfect for consultants! Found steady work analyzing
                      data for businesses across different industries.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div
              className="card shadow mb-4"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
              }}
            >
              <div className="card-body text-center p-5">
                <h3 className="mb-3">Ready to Start Your Journey?</h3>
                <p className="lead mb-4">
                  Join thousands of professionals who are already earning
                  through their expertise. Your next big opportunity is just a
                  profile away!
                </p>
                <div className="d-flex justify-content-center gap-3">
                  <Link to="/register" className="btn btn-light btn-lg px-4">
                    <i className="fa fa-user-plus mr-2"></i>
                    Create Seller Account
                  </Link>
                  <Link
                    to="/browse"
                    className="btn btn-outline-light btn-lg px-4"
                  >
                    <i className="fa fa-search mr-2"></i>
                    Browse Opportunities
                  </Link>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mb-4">
              <div className="card-header bg-warning">
                <h3 className="mb-0 text-dark">
                  <i className="fa fa-question-circle mr-2"></i>
                  Frequently Asked Questions
                </h3>
              </div>
              <div className="card-body">
                <div className="accordion" id="faqAccordion">
                  <div className="card">
                    <div className="card-header" id="faq1">
                      <h5 className="mb-0">
                        <button
                          className="btn btn-link text-left w-100"
                          type="button"
                          data-toggle="collapse"
                          data-target="#collapse1"
                        >
                          How much does it cost to join?
                        </button>
                      </h5>
                    </div>
                    <div
                      id="collapse1"
                      className="collapse show"
                      data-parent="#faqAccordion"
                    >
                      <div className="card-body">
                        Joining Buy My Skills is completely free! You only pay
                        when you successfully complete projects.
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header" id="faq2">
                      <h5 className="mb-0">
                        <button
                          className="btn btn-link text-left w-100 collapsed"
                          type="button"
                          data-toggle="collapse"
                          data-target="#collapse2"
                        >
                          What types of skills are in demand?
                        </button>
                      </h5>
                    </div>
                    <div
                      id="collapse2"
                      className="collapse"
                      data-parent="#faqAccordion"
                    >
                      <div className="card-body">
                        From software development and design to consulting,
                        writing, and specialized services - our platform
                        supports a wide range of expertise areas.
                      </div>
                    </div>
                  </div>
                  {/* <div className="card">
                    <div className="card-header" id="faq3">
                      <h5 className="mb-0">
                        <button
                          className="btn btn-link text-left w-100 collapsed"
                          type="button"
                          data-toggle="collapse"
                          data-target="#collapse3"
                        >
                          How do I get paid?
                        </button>
                      </h5>
                    </div>
                    <div
                      id="collapse3"
                      className="collapse"
                      data-parent="#faqAccordion"
                    >
                      <div className="card-body">
                        Payments are processed securely through our platform.
                        You set your rates and get paid directly for completed
                        work.
                      </div>
                    </div>
                  </div> */}
                  {/* <div className="card">
                    <div className="card-header" id="faq4">
                      <h5 className="mb-0">
                        <button
                          className="btn btn-link text-left w-100 collapsed"
                          type="button"
                          data-toggle="collapse"
                          data-target="#collapse4"
                        >
                          Is my data safe?
                        </button>
                      </h5>
                    </div>
                    <div
                      id="collapse4"
                      className="collapse"
                      data-parent="#faqAccordion"
                    >
                      <div className="card-body">
                        Yes, we use industry-standard security measures to
                        protect your personal information and transaction data.
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HowItWorks;
