/* eslint-disable prettier/prettier */
import React from "react";

function AboutUs() {
  return (
    <div className="about-us-fluid">
      {/* Hero Section */}
      <section className="hero-section bg-gradient-primary text-white py-5" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="about-us-fluid">
          <div className="text-center">
            <h1 className="display-4 font-weight-bold mb-4">
              About Buy My Skills
            </h1>
            <p className="lead mb-4">
              Connecting talent with opportunity worldwide
            </p>
          </div>
        </div>
      </section>

      {/* About Content Section */}
      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="text-center mb-5">
                <h2 className="display-5 font-weight-bold mb-4">Our Story</h2>
              </div>
              <div className="about-content">
                <p className="lead mb-4">
                  At Buy My Skills, we believe talent should have no boundaries. Our platform connects individuals with unique skills to businesses and people who need them. Whether you&#39;re a freelancer looking to showcase your expertise or an employer searching for the right talent, Buy My Skills makes it simple, transparent, and effective.
                </p>
                <p className="mb-4">
                  From technical services to creative arts, from business consulting to everyday tasks — every skill has value, and we&#39;re here to help you share it with the world.
                </p>
                <p className="mb-4">
                  Our mission is to empower individuals, support businesses, and build a community where skills become opportunities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}

export default AboutUs;
