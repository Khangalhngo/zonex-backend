const sqlInjectionCheck = (req, res, next) => {
  const sqlInjectionPattern = /(\%27)|(\')|(\-\-)|(\%23)|(#)|(\%2F\*)|(\/\*)|(\*\/)|(\%2F\%2A)|(\%2A\%2F)|(\%2D\%2D)|(\%23)|(\%3B)|(;)|(\%3C)|(\%3E)|(\%3D)|(=)|(\%2B)|(\+)|(\%2C)|(\,)|(\%2E)|(\.)|(\%2F)|(\/)|(\%5C)|(\\)|(\%5F)|(_)|(\%60)|(`)|(\%21)|(!)|(\%40)|(@)|(\%24)|($)|(\%25)|(%)|(\%5E)|(\^)|(\%26)|(&)|(\%28)|(\()|(\%29)|(\))|(\%7B)|({)|(\%7D)|(})|(\%7C)|(\|)|(\%3A)|(:)|(\%22)|(")|(\%3F)|(\?)|(\%3D)|(=)|(\%2B)|(\+)|(\%2C)|(\,)|(\%2E)|(\.)|(\%2F)|(\/)|(\%5C)|(\\)|(\%5F)|(_)|(\%60)|(`)|(\%21)|(!)|(\%40)|(@)|(\%24)|($)|(\%25)|(%)|(\%5E)|(\^)|(\%26)|(&)|(\%28)|(\()|(\%29)|(\))|(\%7B)|({)|(\%7D)|(})|(\%7C)|(\|)|(\%3A)|(:)|(\%22)|(")|(\%3F)|(\?)/i;

  const checkObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkObject(obj[key])) return true;
      } else if (typeof obj[key] === 'string') {
        if (sqlInjectionPattern.test(obj[key])) return true;
      }
    }
    return false;
  };

  // Check request body
  if (req.body && checkObject(req.body)) {
    return res.status(400).json({ error: 'Invalid characters detected in request' });
  }

  // Check request query parameters
  if (req.query && checkObject(req.query)) {
    return res.status(400).json({ error: 'Invalid characters detected in query parameters' });
  }

  // Check request params
  if (req.params && checkObject(req.params)) {
    return res.status(400).json({ error: 'Invalid characters detected in URL parameters' });
  }

  next();
};

module.exports = sqlInjectionCheck; 