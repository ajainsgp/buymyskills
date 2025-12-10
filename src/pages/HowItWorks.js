import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./HowItWorks.css";

function HowItWorks() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero Section - Same as About and Feedback pages */}
      <section className="hero-section bg-gradient-primary text-white py-5 how-it-works-hero">
        <div className="about-us-fluid">
          <div className="text-center">
            <h1 className="display-4 font-weight-bold mb-4">
              {t("howItWorks.title")}
            </h1>
            <p className="lead mb-4">{t("howItWorks.subtitle")}</p>
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
                  {t("howItWorks.offerTitle")}
                </h2>
                <p className="card-text lead text-center mb-3">
                  {t("howItWorks.offerDescription")}
                </p>
                <div className="row mt-4">
                  <div className="col-md-4 text-center mb-3">
                    <div className="feature-icon feature-icon-home">🏠</div>
                    <h4>{t("howItWorks.localFocus")}</h4>
                    <p className="medium">{t("howItWorks.localDescription")}</p>
                  </div>
                  <div className="col-md-4 text-center mb-3">
                    <div className="feature-icon feature-icon-flexible">🔄</div>
                    <h4>{t("howItWorks.regionalReach")}</h4>
                    <p className="medium">
                      {t("howItWorks.regionalDescription")}
                    </p>
                  </div>
                  <div className="col-md-4 text-center mb-3">
                    <div className="feature-icon feature-icon-security">🛡️</div>
                    <h4>{t("howItWorks.dataProtection")}</h4>
                    <p className="medium">{t("howItWorks.dataDescription")}</p>
                  </div>
                </div>
                <div className="text-center">
                  <Link
                    to="/register"
                    className="btn btn-primary btn-lg px-4 py-2"
                  >
                    <i className="fa fa-user-plus mr-2"></i>
                    {t("howItWorks.joinSeller")}
                  </Link>
                </div>
              </div>
            </div>

            {/* Steps to Get Started */}
            <div className="card shadow mb-4">
              <div className="card-header bg-primary text-white">
                <h3 className="mb-0">
                  <i className="fa fa-road mr-2"></i>
                  {t("howItWorks.stepsTitle")}
                </h3>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 text-center mb-4">
                    <div className="step-icon step-icon-1">📝</div>
                    <h4 className="mb-3">{t("howItWorks.step1Title")}</h4>
                    <p>{t("howItWorks.step1Description")}</p>
                  </div>
                  <div className="col-md-4 text-center mb-4">
                    <div className="step-icon step-icon-2">🎯</div>
                    <h4 className="mb-3">{t("howItWorks.step2Title")}</h4>
                    <p>{t("howItWorks.step2Description")}</p>
                  </div>
                  <div className="col-md-4 text-center mb-4">
                    <div className="step-icon step-icon-3">🤝</div>
                    <h4 className="mb-3">{t("howItWorks.step3Title")}</h4>
                    <p>{t("howItWorks.step3Description")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Why Choose Us */}
            <div className="card shadow mb-4">
              <div className="card-header bg-success text-white">
                <h3 className="mb-0">
                  <i className="fa fa-star mr-2"></i>
                  {t("howItWorks.whyChooseTitle")}
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
                        <h4>{t("howItWorks.globalReach")}</h4>
                        <p>{t("howItWorks.globalDescription")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-start">
                      <div className="why-choose-icon why-choose-icon-flexible">
                        💼
                      </div>
                      <div>
                        <h4>{t("howItWorks.flexibleWork")}</h4>
                        <p>{t("howItWorks.flexibleDescription")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-start">
                      <div className="why-choose-icon why-choose-icon-secure">
                        🔒
                      </div>
                      <div>
                        <h4>{t("howItWorks.securePlatform")}</h4>
                        <p>{t("howItWorks.secureDescription")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-start">
                      <div className="why-choose-icon why-choose-icon-compensation">
                        💰
                      </div>
                      <div>
                        <h4>{t("howItWorks.fairCompensation")}</h4>
                        <p>{t("howItWorks.fairDescription")}</p>
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
                  {t("howItWorks.successStories")}
                </h3>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 text-center mb-3">
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                      👨‍💻
                    </div>
                    <h5>{t("howItWorks.sarahTitle")}</h5>
                    <p className="medium">{t("howItWorks.sarahQuote")}</p>
                  </div>
                  <div className="col-md-4 text-center mb-3">
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                      🎨
                    </div>
                    <h5>{t("howItWorks.mikeTitle")}</h5>
                    <p className="medium">{t("howItWorks.mikeQuote")}</p>
                  </div>
                  <div className="col-md-4 text-center mb-3">
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                      📊
                    </div>
                    <h5>{t("howItWorks.annaTitle")}</h5>
                    <p className="medium">{t("howItWorks.annaQuote")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="card shadow mb-4 call-to-action-card">
              <div className="card-body text-center p-5">
                <h4 className="mb-3">{t("howItWorks.ctaTitle")}</h4>
                <p className="lead mb-4">{t("howItWorks.ctaDescription")}</p>
                <div className="d-flex justify-content-center gap-3">
                  <Link to="/register" className="btn btn-light btn-lg px-4">
                    <i className="fa fa-user-plus mr-2"></i>
                    {t("howItWorks.createAccount")}
                  </Link>
                  <Link
                    to="/browse"
                    className="btn btn-outline-light btn-lg px-4"
                  >
                    <i className="fa fa-search mr-2"></i>
                    {t("howItWorks.browseOpportunities")}
                  </Link>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mb-4">
              <div className="card-header bg-warning">
                <h3 className="mb-0 text-dark">
                  <i className="fa fa-question-circle mr-2"></i>
                  {t("howItWorks.faqTitle")}
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
                          {t("howItWorks.faq1Question")}
                        </button>
                      </h4>
                    </div>
                    <div
                      id="collapse1"
                      className="collapse show"
                      data-parent="#faqAccordion"
                    >
                      <div className="card-body">
                        {t("howItWorks.faq1Answer")}
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
                          {t("howItWorks.faq2Question")}
                        </button>
                      </h4>
                    </div>
                    <div
                      id="collapse2"
                      className="collapse"
                      data-parent="#faqAccordion"
                    >
                      <div className="card-body">
                        {t("howItWorks.faq2Answer")}
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
