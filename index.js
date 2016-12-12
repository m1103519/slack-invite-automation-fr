var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config');

router.get('/', function(req, res) {
  res.setLocale(config.locale);
  res.render('index', { community: config.community,
                        tokenRequired: !!config.inviteToken });
});

router.post('/invite', function(req, res) {
  if (req.body.email && (!config.inviteToken || (!!config.inviteToken && req.body.token === config.inviteToken))) {
    request.post({
        url: 'https://'+ config.slackUrl + '/api/users.admin.invite',
        form: {
          email: req.body.email,
          token: config.slacktoken,
          set_active: true
        }
      }, function(err, httpResponse, body) {
        // body looks like:
        //   {"ok":true}
        //       or
        //   {"ok":false,"error":"already_invited"}
        if (err) { return res.send('Error:' + err); }
        body = JSON.parse(body);
        if (body.ok) {
          res.render('result', {
            community: config.community,
            message: 'Super! Vérifiez "'+ req.body.email +'" pour l\'invitation au salon Pixel Couture.'
          });
        } else {
          var error = body.error;
          if (error === 'already_invited' || error === 'already_in_team') {
            res.render('result', {
              community: config.community,
              message: 'Super! Vous avez déjà été invité.<br>' +
                       'Direction <a href="https://'+ config.slackUrl +'">'+ config.community +'</a>'
            });
            return;
          } else if (error === 'invalid_email') {
            error = 'L\'adresse mail que vous avez renseignez n\'est pas valide.';
          } else if (error === 'invalid_auth') {
            error = 'Quelque chose a mal tourné. Veuillez contacter un administrateur système.';
          }

          res.render('result', {
            community: config.community,
            message: 'Failed! ' + error,
            isFailed: true
          });
        }
      });
  } else {
    var errMsg = [];
    if (!req.body.email) {
      errMsg.push('Votre email est obligatoire');
    }

    if (!!config.inviteToken) {
      if (!req.body.token) {
        errMsg.push('Un token valide est obligatoire');
      }

      if (req.body.token && req.body.token !== config.inviteToken) {
        errMsg.push('Le token que vous avez renseigné n\'est pas valide');
      }
    }

    res.render('result', {
      community: config.community,
      message: 'Erreur! ' + errMsg.join(' and ') + '.',
      isFailed: true
    });
  }
});

module.exports = router;
