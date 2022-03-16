export const config = {
  app: {
    apiUri: process.env.REACT_APP_API_URI || 'http://localhost:4000',
    baseUri: process.env.REACT_APP_BASE_URI || 'http://localhost:4001',
    demo: process.env.REACT_APP_DEMO || false,
  }
}
