import React from "react";
import { Link } from "react-router-dom";
import "./HowItWorks.css";

function HowItWorks() {
  return (
    <div>
      {/* Hero Section - Same as About and Feedback pages */}
      <section className="hero-section bg-gradient-primary text-white py-5 how-it-works-hero">
        <div className="about-us-fluid">
          <div className="text-center">
            <h1 className="display-4 font-weight-bold mb-4">How It Works</h1>
            <p className="lead mb-4">
              Transform your expertise into opportunities. Join thousands of
              professionals connecting globally.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="how-it-works-main">
        <div className="row">
          <div className="col-lg-8 mx-auto">
            {/* Introduction */}
            <div className="card shadow mb-4">
              <div className="text-center mb-5">
                <h2 className="display-5 font-weight-bold mb-4">
                  🚀 Offer Your Expertise to the World
                </h2>
                <p className="card-text lead text-center mb-3">
                  <strong>Buy My Skills</strong> connects your skills with your
                  local community, city, and country. Whether developer,
                  designer, consultant, or expert in any field, our intelligent
                  regional filtering system ensures you connect with relevant
                  opportunities while protecting your data privacy.
                </p>
                <div className="row mt-4">
                  <div className="col-md-4 text-center mb-3">
                    <div className="feature-icon feature-icon-home">🏠</div>
                    <h4>Local Community Focus</h4>
                    <p className="medium">
                      Connect with clients in your region for easier
                      collaboration and local opportunities.
                    </p>
                  </div>
                  <div className="col-md-4 text-center mb-3">
                    <div className="feature-icon feature-icon-flexible">🔄</div>
                    <h4>Flexible Regional Reach</h4>
                    <p className="medium">
                      Expand within your region while maintaining local
                      connections and cultural understanding.
                    </p>
                  </div>
                  <div className="col-md-4 text-center mb-3">
                    <div className="feature-icon feature-icon-security">🛡️</div>
                    <h4>Data Protection</h4>
                    <p className="medium">
                      Region-based filtering keeps your information secure
                      within trusted geographic boundaries.
                    </p>
                  </div>
                </div>
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
                    <div className="step-icon step-icon-1">📝</div>
                    <h4 className="mb-3">1. Create Your Profile</h4>
                    <p>
                      Sign up and create a compelling profile showcasing your
                      skills, experience, and what makes you unique. Add your
                      photo and detailed description to stand out.
                    </p>
                  </div>
                  <div className="col-md-4 text-center mb-4">
                    <div className="step-icon step-icon-2">🎯</div>
                    <h4 className="mb-3">2. Set Your Availability</h4>
                    <p>
                      Choose your preferred work style (remote, on-site, or
                      hybrid) and specify when you&apos;re available. Set your
                      rates and project preferences to attract the right
                      clients.
                    </p>
                  </div>
                  <div className="col-md-4 text-center mb-4">
                    <div className="step-icon step-icon-3">🤝</div>
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
                      <div className="why-choose-icon why-choose-icon-global">
                        🌍
                      </div>
                      <div>
                        <h4>Global Reach</h4>
                        <p>
                          Connect with clients from around the world. No
                          geographical boundaries limit your opportunities.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-start">
                      <div className="why-choose-icon why-choose-icon-flexible">
                        💼
                      </div>
                      <div>
                        <h4>Flexible Work</h4>
                        <p>
                          Set your own schedule and work preferences. Choose
                          projects that fit your lifestyle and expertise.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-start">
                      <div className="why-choose-icon why-choose-icon-secure">
                        🔒
                      </div>
                      <div>
                        <h4>Secure Platform</h4>
                        <p>
                          Your data is protected with industry-standard
                          security. Safe and reliable transactions.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-start">
                      <div className="why-choose-icon why-choose-icon-compensation">
                        💰
                      </div>
                      <div>
                        <h4>Fair Compensation</h4>
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
                    <h5>Sarah - Software Developer</h5>
                    <p className="medium">
                      &quot;Found 3 major projects in my first month. The
                      platform platform platform platform made it easy to
                      showcase my React expertise.&quot;
                    </p>
                  </div>
                  <div className="col-md-4 text-center mb-3">
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                      🎨
                    </div>
                    <h5>Mike - UI/UX Designer</h5>
                    <p className="medium">
                      &quot;Connected with international clients. The profile
                      system helped me stand out from the competition.&quot;
                    </p>
                  </div>
                  <div className="col-md-4 text-center mb-3">
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                      📊
                    </div>
                    <h5>Anna - Data Analyst</h5>
                    <p className="medium">
                      &quot;Perfect for consultants! Found steady work analyzing
                      data for businesses across different industries.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="card shadow mb-4 call-to-action-card">
              <div className="card-body text-center p-5">
                <h4 className="mb-3">Ready to Start Your Journey?</h4>
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
                      <h4 className="mb-0">
                        <button
                          className="btn btn-link text-left w-100"
                          type="button"
                          data-toggle="collapse"
                          data-target="#collapse1"
                        >
                          How much does it cost to join?
                        </button>
                      </h4>
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
                      <h4 className="mb-0">
                        <button
                          className="btn btn-link text-left w-100 collapsed"
                          type="button"
                          data-toggle="collapse"
                          data-target="#collapse2"
                        >
                          What types of skills are in demand?
                        </button>
                      </h4>
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
