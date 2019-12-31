import React, { useState, useEffect } from 'react';
import cookies from 'next-cookies';

import styles from './styles';
import loader from '../../static/comunidades-tech-loader.gif';
import { api, setHeader } from '../../utils/axios';
import Card from '../../components/Card';

export default function Dashboard({ credentials }) {
  const [loading, setLoading] = useState(true);
  const [myCommunities, setMyCommunities] = useState([]);
  const [pendingCommunities, setPendingCommunities] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);

  useEffect(() => {
    const fetchMyCommunities = async () => {
      setHeader(credentials);
      const { data } = await api.get(`/community/owner`);
      setMyCommunities(data);
    };
    const fetchPendingCommunities = async () => {
      setHeader(credentials);
      const { data } = await api.get(`/community/status/awaitingPublication`);
      setPendingCommunities(data);
    };
    const fetchPendingInvitations = async () => {
      setHeader(credentials);
      const { data } = await api.get(`/user/invitations`);
      setPendingInvites(data);
    };
    fetchMyCommunities();
    fetchPendingInvitations();
    credentials.isModerator && fetchPendingCommunities();
    setLoading(false);
  }, []);

  const sendResponse = async ({ accept, communityId }) => {
    setHeader(credentials);
    const { data } = await api.put(`/community/invitation`, {
      accept,
      communityId,
    });

    if (data.success) {
      setHeader(credentials);
      const { data } = await api.get(`/user/invitations`);
      setPendingInvites(data);
    }
  };

  const renderDashboard = () => {
    if (loading)
      return (
        <div className="container head">
          <img
            src={loader}
            style={{ maxWidth: '100px', display: 'block', margin: '30px auto' }}
          />
        </div>
      );
    return (
      <div className="container head">
        {pendingInvites.length > 0 && (
          <div className="columns">
            <div className="column">
              <h2 className="title is-size-6 is-uppercase has-text-centered-mobile">
                administração pendente
              </h2>
              <h4 className="is-size-6 has-text-centered-mobile">
                Você é um administrador dessa comunidade?
              </h4>

              <div className="columns is-multiline">
                {pendingInvites.map((invite) => (
                  <div className="invite-wrapper" id={invite._id}>
                    <div>
                      <img src={invite.logo} />
                      <p>{invite.name}</p>
                      <p>
                        {invite.location.state ? (
                          <span>
                            {invite.location.city}, {invite.location.state}
                          </span>
                        ) : (
                          <span>Remota</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() =>
                          sendResponse({
                            accept: true,
                            communityId: invite._id,
                          })
                        }
                      >
                        Sim
                      </button>
                      <button
                        onClick={() =>
                          sendResponse({
                            accept: false,
                            communityId: invite._id,
                          })
                        }
                      >
                        Não
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="columns">
          <div className="column">
            <h2 className="title is-size-6 is-uppercase has-text-centered-mobile">
              minhas comunidades
            </h2>
            <div className="columns is-multiline card-wrapper">
              {myCommunities.map((card) => (
                <div className="column is-one-quarter" key={card.id}>
                  <Card withOptions content={card} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="is-divider"></div>
        {pendingCommunities.length > 0 && (
          <div className="columns">
            <div className="column">
              <h2 className="title is-size-6 is-uppercase has-text-centered-mobile">
                comunidades pendentes
              </h2>
              <div className="columns is-multiline card-wrapper">
                {pendingCommunities.map((card) => (
                  <div className="column is-one-quarter" key={card.id}>
                    <Card withOptions content={card} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <style jsx>{styles}</style>
      </div>
    );
  };

  return renderDashboard();
}

Dashboard.getInitialProps = async (ctx) => {
  const credentials = cookies(ctx).ctech_credentials || {};
  if (!credentials.token) {
    ctx.res.writeHead(302, {
      Location: '/',
    });
    ctx.res.end();
  }
};
