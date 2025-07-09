```javascript

class FetchError extends Error {
  constructor(errorId, message) {
    super(message);
    this.errorId = errorId;
  }
}

FetchError.INVALID_URL = 'INVALID_URL';
FetchError.TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS';
FetchError.NO_SUCCESS_RESPONSE = 'NO_SUCCESS_RESPONSE';
FetchError.UNSUPPORTED_CONTENT_TYPE = 'UNSUPPORTED_CONTENT_TYPE';
FetchError.OTHER = 'OTHER';

module.exports = FetchError;
```