/* eslint-disable prettier/prettier */
import React from "react";
import { useTranslation } from "react-i18next";

function AboutUs() {
  const { t } = useTranslation();

  return (
    <div className="about-us-fluid">
      {/* Hero Section */}
      <section className="hero-section bg-gradient-primary text-white py-5" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="about-us-fluid">
          <div className="text-center">
            <h1 className="display-4 font-weight-bold mb-4">
              {t("about.title")}
            </h1>
            <p className="lead mb-4">{t("about.subtitle")}</p>
          </div>
        </div>
      </section>

      {/* About Content Section */}
      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="text-center mb-5">
                <h2 className="display-5 font-weight-bold mb-4">{t("about.storyTitle")}</h2>
              </div>
              <div className="about-content">
                <p className="lead mb-4">
                  {t("about.story1")}
                </p>
                <p className="lead mb-4">
                  {t("about.story2")}
                </p>
                <p className="lead mb-4">
                  {t("about.story3")}
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
