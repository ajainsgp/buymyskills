import React, { useEffect, useState } from "react";
import "./UserProfileCard.css";
import API_BASE from "../utils/apiBase";

function UserProfile({ userProfiles, showSensitive = false }) {
  //const [flips, setFlips] = useState(Array(userProfiles.length).fill(false));

  /* const flipCard = (index) => {
    const newFlips = [...flips];
    newFlips[index] = !newFlips[index];
    setFlips(newFlips);
  }; */
  const [photos, setPhotos] = useState({});
  useEffect(() => {
    let cancelled = false;
    async function loadPhotos() {
      try {
        const entries = await Promise.all(
          (userProfiles || []).map(async (p) => {
            if (!p || !p.id) return [null, null];
            try {
              const res = await fetch(`${API_BASE}/api/users/${p.id}/photo`);
              if (!res.ok) return [p.id, null];
              const data = await res.json().catch(() => ({}));
              if (data && data.contentType && data.base64) {
                return [p.id, `data:${data.contentType};base64,${data.base64}`];
              }
              return [p.id, null];
            } catch {
              return [p.id, null];
            }
          }),
        );
        if (!cancelled) {
          const map = {};
          for (const [id, url] of entries) {
            if (id) map[id] = url;
          }
          setPhotos(map);
        }
      } catch {
        // ignore
      }
    }
    loadPhotos();
    return () => {
      cancelled = true;
    };
  }, [userProfiles]);
  console.log("userProfiles:", userProfiles);
  return userProfiles.map((profile, index) => {
    console.log("profile:", profile);
    return (
      <div key={index} id="page-content">
        <div className="card">
          <div className="">
            <div className="user-card-full">
              <div className="row m-l-0 m-r-0">
                <div className="col-sm-4 bg-c-lite-green user-profile">
                  <div className="card-block text-center text-white">
                    <div className="m-b-25">
                      <img
                        src={
                          photos[profile.id] ||
                          "https://img.icons8.com/bubbles/100/000000/user.png"
                        }
                        className="img-radius"
                        alt="User-Profile-Image"
                      />
                    </div>
                    <h6 className="f-w-600">{profile.name}</h6>
                    <p>Web Designer</p>
                    <i className=" mdi mdi-square-edit-outline feather icon-edit m-t-10 f-16"></i>
                  </div>
                </div>
                <div className="col-sm-8">
                  <div className="card-block">
                    <h6 className="m-b-20 p-b-5 b-b-default f-w-600">
                      Information
                    </h6>
                    <div className="row">
                      <div className="col-sm-6">
                        <p className="m-b-10 f-w-600">Email</p>
                        <h6 className="text-muted f-w-400">
                          {showSensitive ? profile.emailId : "Login to view"}
                        </h6>
                      </div>
                      <div className="col-sm-6">
                        <p className="m-b-10 f-w-600">Phone</p>
                        <h6 className="text-muted f-w-400">
                          {showSensitive
                            ? profile.mobile || "N/A"
                            : "Login to view"}
                        </h6>
                      </div>
                    </div>
                    <h6 className="m-b-20 m-t-40 p-b-5 b-b-default f-w-600">
                      Projects
                    </h6>
                    <div className="row">
                      <div className="col-sm-6">
                        <p className="m-b-10 f-w-600">Recent</p>
                        <h6 className="text-muted f-w-400">Sam Disuja</h6>
                      </div>
                      <div className="col-sm-6">
                        <p className="m-b-10 f-w-600">Most Viewed</p>
                        <h6 className="text-muted f-w-400">Dinoter husainm</h6>
                      </div>
                    </div>
                    <ul className="social-link list-unstyled m-t-40 m-b-10">
                      <li>
                        <a
                          href="#!"
                          data-toggle="tooltip"
                          data-placement="bottom"
                          title=""
                          data-original-title="facebook"
                          data-abc="true"
                        >
                          <i
                            className="mdi mdi-facebook feather icon-facebook facebook"
                            aria-hidden="true"
                          ></i>
                        </a>
                      </li>
                      <li>
                        <a
                          href="#!"
                          data-toggle="tooltip"
                          data-placement="bottom"
                          title=""
                          data-original-title="twitter"
                          data-abc="true"
                        >
                          <i
                            className="mdi mdi-twitter feather icon-twitter twitter"
                            aria-hidden="true"
                          ></i>
                        </a>
                      </li>
                      <li>
                        <a
                          href="#!"
                          data-toggle="tooltip"
                          data-placement="bottom"
                          title=""
                          data-original-title="instagram"
                          data-abc="true"
                        >
                          <i
                            className="mdi mdi-instagram feather icon-instagram instagram"
                            aria-hidden="true"
                          ></i>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });
}

export default UserProfile;
