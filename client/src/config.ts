export const config = {
  app: {
    apiUri: process.env.REACT_APP_API_URI || 'http://localhost:4912',
    baseUri: process.env.REACT_APP_BASE_URI || 'http://localhost:4005',
    demo: process.env.REACT_APP_DEMO || false,
  }
}
