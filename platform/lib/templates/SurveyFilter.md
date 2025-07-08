```javascript
'use strict';

function survey(surveyBody, fixedQuestions, url, callback) {
  surveyBody.questions = surveyBody.questions.concat(fixedQuestions);
  surveyBody._url = url;

  const result = JSON.stringify(surveyBody);

  callback(null, result);
}

module.exports = {
  survey,
};
```