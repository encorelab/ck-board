export const requestLoggerMiddleware =
  ({ logger }) =>
  (req, res, next) => {
    logger('RECV <<<', req.method, req.url, req.hostname);
    res.send = resDotSendInterceptor(res, res.send);
    res.on('finish', () => {
      logger('SEND >>>', res.contentBody);
    });
    next();
  };
