/* eslint-disable prettier/prettier */
import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import landingPageData from "../data/landingPageData.json";

function LandingPage() {
  const navigate = useNavigate();

  // Handle card click to navigate to browse page with category filter
  const handleCardClick = (categoryName) => {
    navigate(`/browse?category=${encodeURIComponent(categoryName)}`);
  };

  // Render section header (title and subtitle)
  const renderSectionHeader = (sectionTitle, sectionText) => (
    <div className="text-center mb-3">
      <h2 className="display-5 font-weight-bold">{sectionTitle}</h2>
      <p className="lead text-muted">{sectionText}</p>
    </div>
  );

  // Render feature cards (Why Choose Us section)
  const renderFeatureCard = (cardData, cardKey) => (
    <div key={cardKey} className="col-md-4 mb-4">
      <div className="card h-100 border-0 shadow-sm features-card cursor-no-pointer">
        <div className="card-body text-center">
          <i className={`${cardData.icon} text-primary mb-1`}></i>
          <h5 className="card-title h6">{cardData.cardTitle}</h5>
          <p className="card-text small">{cardData.cardText}</p>
        </div>
      </div>
    </div>
  );

  // Render category cards (Explore by Category section)
  const renderCategoryCard = (cardData, cardKey) => (
    <div key={cardKey} className="col-md-3 mb-4">
      <div
        className="card border-0 shadow-sm text-center p-1 category-tile clickable-card"
        onClick={() => handleCardClick(cardData.cardTitle)}
        style={{ cursor: 'pointer' }}
      >
        <i className={`${cardData.icon} text-primary mb-2`}></i>
        <h5 className="card-title mb-0">{cardData.cardTitle}</h5>
        <small className="text-muted">{cardData.cardText}</small>
      </div>
    </div>
  );

  // Render skill cards (Popular Skills section)
  const renderSkillCard = (cardData, cardKey) => (
    <div key={cardKey} className="col-md-4 mb-4">
      <div
        className="card border-0 shadow-sm section-card clickable-card"
        onClick={() => handleCardClick(cardData.cardTitle)}
        style={{ cursor: 'pointer' }}
      >
        <div className="card-body text-center py-3">
          <i className={`${cardData.icon} text-primary mb-2`}></i>
          <h5 className="card-title">{cardData.cardTitle}</h5>
        </div>
      </div>
    </div>
  );

  // Render section with cards
  const renderSectionWithCards = (sectionData, cardRenderer, sectionClass = "") => (
    <section className={`py-3 ${sectionClass}`}>
      <div className="container">
        {renderSectionHeader(sectionData.sectionTitle, sectionData.sectionText)}
        <div className="row">
          {Object.entries(sectionData.cards).map(([cardKey, cardData]) =>
            cardRenderer(cardData, cardKey)
          )}
        </div>
      </div>
    </section>
  );

  const { sections, stats } = landingPageData.landingPage;

  return (
    <div className="landing-page landing-fullscreen">
      {/* Hero Section */}
      <section className="hero-section bg-gradient-primary text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 font-weight-bold mb-4">
                Find the perfect skills for your business
              </h1>
              <p className="lead mb-4">
                Connect with talented professionals and discover amazing skills.
                Find the perfect match for your projects or offer your expertise
                to the world.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3">
                <a href="/register" className="btn btn-light btn-lg">
                  Get Started
                </a>
                <a href="/login" className="btn btn-outline-light btn-lg">
                  Sign In
                </a>
              </div>
            </div>
            <div className="col-lg-6 landing-page-img-padding-top">
              <img
                src="/hero-marketplace-CWH2jcok.jpg"
                alt="Skilled professionals collaborating"
                className="img-fluid rounded-2xl shadow-2xl"
                data-first-enter-image="true"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {renderSectionWithCards(sections.features, renderFeatureCard, "features-section")}

      {/* Explore by Category Section */}
      {renderSectionWithCards(sections.categories, renderCategoryCard, "explore-category-section bg-light")}

      {/* Popular Skills Section */}
      {renderSectionWithCards(sections.skills, renderSkillCard, "popular-skills-section")}

      {/* Stats Section */}
      <section className="stats-section bg-light py-3">
        <div className="container">
          <div className="row text-center">
            <div className="col-md-3">
              <h3 className="display-4 font-weight-bold text-primary">{stats.activeUsers}</h3>
              <p className="text-muted">Active Users</p>
            </div>
            <div className="col-md-3">
              <h3 className="display-4 font-weight-bold text-primary">{stats.skillsAvailable}</h3>
              <p className="text-muted">Skills Available</p>
            </div>
            <div className="col-md-3">
              <h3 className="display-4 font-weight-bold text-primary">{stats.categories}</h3>
              <p className="text-muted">Categories</p>
            </div>
            <div className="col-md-3">
              <h3 className="display-4 font-weight-bold text-primary">{stats.support}</h3>
              <p className="text-muted">Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section bg-primary text-white py-3">
        <div className="container text-center">
          <h2 className="display-5 font-weight-bold mb-3">
            Ready to Get Started?
          </h2>
          <p className="lead mb-4">
            Join thousands of users already connecting through our platform.
          </p>
          <a href="/register" className="btn btn-light btn-lg">
            Create Your Account
          </a>
        </div>
      </section>


    </div>
  );
}

export default LandingPage;
