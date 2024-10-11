export const dbURI = () => {
  return `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_URL}.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
};
