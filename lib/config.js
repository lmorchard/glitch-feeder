module.exports = async (env) => {
  const {
    HOST,
    PORT,
    PROJECT_DOMAIN,
  } = env;

  const SITE_DOMAIN = `${PROJECT_DOMAIN}.glitch.me`;
  const SITE_URL = `https://${SITE_DOMAIN}`;
  const API_BASE_PATH = "/api/v1";
  const API_BASE_URL = `${SITE_URL}${API_BASE_PATH}`;
  
  return {
    HOST,
    PORT,
    PROJECT_DOMAIN,
    SITE_DOMAIN,
    SITE_URL,
    API_BASE_PATH,
    API_BASE_URL,
  };
};