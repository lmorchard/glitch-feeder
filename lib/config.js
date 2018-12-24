module.exports = async (env) => {
  const {
    HOST = "localhost",
    PORT = 8001,
    PROJECT_DOMAIN,
  } = env;

  const USE_HTTPS = PROJECT_DOMAIN
    ? true
    : process.env.USE_HTTPS === "1";

  const SITE_PROTOCOL = USE_HTTPS
    ? "https"
    : "http";

  const SITE_DOMAIN = PROJECT_DOMAIN
    ? `${PROJECT_DOMAIN}.glitch.me`
    : `${HOST}:${PORT}`;

  const SITE_URL = `${SITE_PROTOCOL}://${SITE_DOMAIN}`;
  const API_BASE_PATH = "/api/v1";
  const API_BASE_URL = `${SITE_URL}${API_BASE_PATH}`;
  
  return {
    HOST,
    PORT,
    PROJECT_DOMAIN,
    USE_HTTPS,
    SITE_PROTOCOL,
    SITE_DOMAIN,
    SITE_URL,
    API_BASE_PATH,
    API_BASE_URL,
  };
};
