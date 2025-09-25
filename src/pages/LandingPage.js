/* eslint-disable prettier/prettier */
import React from "react";
import "./LandingPage.css";

function LandingPage() {
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
      <section className="features-section py-3">
        <div className="container">
          <div className="text-center mb-3">
            <h2 className="display-5 font-weight-bold">Why Choose Us?</h2>
            <p className="lead text-muted">
              Discover the benefits of our platform
            </p>
          </div>
          <div className="row">
            <div className="col-md-4 mb-4">
              <div className="card h-100 border-0 shadow-sm features-card">
                <div className="card-body text-center py-2">
                  <i className="fas fa-users fa-2x text-primary mb-1"></i>
                  <h5 className="card-title h6">Connect with Experts</h5>
                  <p className="card-text small">
                    Find skilled professionals from various fields to help with your projects.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card h-100 border-0 shadow-sm features-card">
                <div className="card-body text-center py-2">
                  <i className="fas fa-search fa-2x text-primary mb-1"></i>
                  <h5 className="card-title h6">Easy Discovery</h5>
                  <p className="card-text small">
                    Use our advanced filters to find the perfect match for
                    your needs.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card h-100 border-0 shadow-sm features-card">
                <div className="card-body text-center py-2">
                  <i className="fas fa-shield-alt fa-2x text-primary mb-1"></i>
                  <h5 className="card-title h6">Secure Platform</h5>
                  <p className="card-text small">
                    Your data is protected with industry-standard security measures.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore by Category Section */}
      <section className="explore-category-section py-3 bg-light">
        <div className="container">
          <div className="text-center mb-3">
            <h2 className="display-5 font-weight-bold">Explore by Category</h2>
            <p className="lead text-muted">
              Find skills in the category that suits your needs
            </p>
          </div>
          <div className="row">
            <div className="col-md-3 mb-4">
              <div className="card border-0 shadow-sm text-center p-1 category-tile">
                <i className="fas fa-code fa-lg text-primary mb-1"></i>
                <h5 className="card-title mb-0">Development</h5>
                <small className="text-muted">245 skills</small>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="card border-0 shadow-sm text-center p-1 category-tile">
                <i className="fas fa-paint-brush fa-lg text-primary mb-1"></i>
                <h5 className="card-title mb-0">Design</h5>
                <small className="text-muted">189 skills</small>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="card border-0 shadow-sm text-center p-1 category-tile">
                <i className="fas fa-chart-line fa-lg text-primary mb-1"></i>
                <h5 className="card-title mb-0">Marketing</h5>
                <small className="text-muted">156 skills</small>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="card border-0 shadow-sm text-center p-1 category-tile">
                <i className="fas fa-language fa-lg text-primary mb-1"></i>
                <h5 className="card-title mb-0">Languages</h5>
                <small className="text-muted">134 skills</small>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="card border-0 shadow-sm text-center p-1 category-tile">
                <i className="fas fa-camera fa-lg text-primary mb-1"></i>
                <h5 className="card-title mb-0">Photography</h5>
                <small className="text-muted">98 skills</small>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="card border-0 shadow-sm text-center p-1 category-tile">
                <i className="fas fa-music fa-lg text-primary mb-1"></i>
                <h5 className="card-title mb-0">Music</h5>
                <small className="text-muted">87 skills</small>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="card border-0 shadow-sm text-center p-1 category-tile">
                <i className="fas fa-utensils fa-lg text-primary mb-1"></i>
                <h5 className="card-title mb-0">Cooking</h5>
                <small className="text-muted">76 skills</small>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="card border-0 shadow-sm text-center p-1 category-tile">
                <i className="fas fa-pen fa-lg text-primary mb-1"></i>
                <h5 className="card-title mb-0">Writing</h5>
                <small className="text-muted">112 skills</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Skills Section */}
      <section className="popular-skills-section py-3">
        <div className="container">
          <div className="text-center mb-3">
            <h2 className="display-5 font-weight-bold">Popular Skills</h2>
            <p className="lead text-muted">
              Discover the most sought-after skills on our platform
            </p>
          </div>
          <div className="row">
            <div className="col-md-4 mb-4">
              <div className="card border-0 shadow-sm section-card">
                <div className="card-body text-center py-3">
                  <i className="fab fa-react fa-2x text-primary mb-2"></i>
                  <h5 className="card-title">React Development</h5>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card border-0 shadow-sm section-card">
                <div className="card-body text-center py-3">
                  <i className="fab fa-python fa-2x text-primary mb-2"></i>
                  <h5 className="card-title">Python Programming</h5>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card border-0 shadow-sm section-card">
                <div className="card-body text-center py-3">
                  <i className="fas fa-camera fa-2x text-primary mb-2"></i>
                  <h5 className="card-title">Photography</h5>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section bg-light py-3">
        <div className="container">
          <div className="row text-center">
            <div className="col-md-3">
              <h3 className="display-4 font-weight-bold text-primary">1000+</h3>
              <p className="text-muted">Active Users</p>
            </div>
            <div className="col-md-3">
              <h3 className="display-4 font-weight-bold text-primary">500+</h3>
              <p className="text-muted">Skills Available</p>
            </div>
            <div className="col-md-3">
              <h3 className="display-4 font-weight-bold text-primary">50+</h3>
              <p className="text-muted">Categories</p>
            </div>
            <div className="col-md-3">
              <h3 className="display-4 font-weight-bold text-primary">24/7</h3>
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

      {/* Footer */}
      <footer className="bg-primary text-white py-4">
        <div className="container">
          <hr className="border-white" />
          <div className="row">
            <div className="col-md-6">
              <p>Connecting talent with opportunity.</p>
              <h5>BuyMySkills</h5>
            </div>
            <div className="col-md-6 text-md-right">
              <p>&copy; 2024 BuyMySkills. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
