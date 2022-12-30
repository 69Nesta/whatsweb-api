
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    port: process.env.PORT_MAIL,
    host: process.env.HOST_MAIL,
    auth: {
        user: process.env.USER_AUTH_MAIL,
        pass: process.env.PASS_AUTH_MAIL,
    },
    secure: process.env.SECURE_MAIL
});


exports.sendmail = async (email, key) => {
    var mailOptions = {
        from: `Whatsweb - Confirmation compte<${process.env.USER_AUTH_MAIL}>`,
        to: `${email}`,
        subject: 'Confirmation compte',
        html: `
      <!DOCTYPE html><html><head> <title>Confirmation compte - WhatsWeb</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" type="text/css" href="https://whatsweb.fr/mailcss/main.css"><link rel="stylesheet" type="text/css" href="https://whatsweb.fr/mailcss/display.css"></head> <body><div class="basicCss" style="display: none;"><div class="limiter"><div class="container"><div class="wrap"><div class="image_center" style="max-height: 200px"><img class="image" src="https://whatsweb.fr/img/logo-dark.svg"/></div><span class="title">Confirmation de compte WhatsWeb</span><span class="txt1">Le lien permettra de vous amener sur une page ou vous pouvez confirmer votre compte</span> <div style="width: 100%"><div class="center"><div class="container-btn"><a href="https://beta.whatsweb.fr/auth/confirmation?email=${email}&key=${key}" style="text-decoration: none; font-family: 'Poppins-Regular'; font-weight: bold;" target="_BLANK"><button class="btn" type="submit" name="home" id="home" style="text-decoration: none; font-family: 'Poppins-Regular'; font-weight: bold;">Confirmer le compte</button></a></div></div></div><span class="txt1">Ce n’est pas vous qui avez demandé la confirmation ?<br> Il vous suffit d’ignorer cet email, ou vous pouvez <a href="https://beta.whatsweb.fr/close?email=${email}&key=${key}">fermer le compte</a> !</span> </div></div></div></div>   
      <div class="displayNone" style="display: unset;"><table align="center" border="0" cellpadding="0" cellspacing="0" style="width:100%;min-width:100%" width="100%">  <tbody><tr><td border="0" cellpadding="0" cellspacing="0" height="1" style="line-height:1px;min-width:375px;width:100%">&nbsp;</td></tr>  <tr> <td align="center">   <table border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px" width="600"> <tbody><tr> <td align="center" style="padding-top:9px"> <table border="0" cellpadding="0" cellspacing="0" width="100%"> <tbody><tr> <td align="center" style="padding-left:30px;padding-right:30px">  <a href="https://whatsweb.fr" target="_blank"> <img src="https://whatsweb.fr/logo-dark.svg" style="display:block;border:0px;max-width:230px" width="200" > </a></td></tr> <tr> <td height="21" style="height:21px;min-height:21px;line-height:21px">&nbsp;</td> </tr> <tr> <td align="center" style="padding:0 30px"> <table border="0" cellpadding="0" cellspacing="0" width="100%"> <tbody><tr> <td align="center"> <h1 style="Margin:0;margin:0;font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:38px;font-weight:700;letter-spacing:0;color:#4c4c4c;text-align:center"> Confirmation de compte WhatsWeb </h1> </td> </tr> <tr> <td align="center" style="padding-top:11px"> <p style="Margin:0;margin:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;font-weight:400;letter-spacing:0;color:#999999;text-align:center"> Le lien permettra de vous amener sur une page ou vous pouvez confirmer votre compte. </p> </td> </tr> <tr> <td height="27" style="height:27px;line-height:27px">&nbsp;</td> </tr> </tbody></table> </td> </tr> </tbody></table> </td> </tr> </tbody></table>   
      <table border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px" width="600"> <tbody><tr> <td align="center"> <table border="0" cellpadding="0" cellspacing="0" width="100%"><tbody><tr><td align="center" style="padding-left:4px;padding-right:4px"> <div><table border="0" cellpadding="0" cellspacing="0" style="width:240px;border-spacing:0;border-collapse:collapse" width="240"><tbody><tr><td align="center" height="43" style="border-collapse:collapse;background-color:#3fb939;border-radius:50px;white-space:nowrap; padding-right: 10px; padding-left: 10px;"> <a href="https://beta.whatsweb.fr/auth/confirmation?email=${email}&key=${key}" style="display:inline-block;width:100%;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:19px;letter-spacing:0.8px;text-transform:uppercase;color:#ffffff;text-align:center;text-decoration:none;background-color:#3fb939;border-radius:50px;border-top:12px solid #3fb939;border-bottom:12px solid #3fb939" target="_blank"> &nbsp;&nbsp;Confirmer le compte&nbsp;&nbsp; </a> </td> </tr> </tbody></table></div> </td> </tr><tr><td align="center" style="padding-top:26px"> <span class="txt1" style="font-family: Arial,Helvetica,sans-serif;font-size: 15px;line-height: 1.5;color: #999999;text-align: center;width: 100%;">Ce n’est pas vous qui avez demandé la confirmation ?<br>Il vous suffit d’ignorer cet email, ou vous pouvez <a class="txt2" href="https://beta.whatsweb.fr/close?email=${email}&key=${key}" style="font-family: Arial,Helvetica,sans-serif;font-size: 15px; line-height: 1.5; color: #666666; text-align: center; width: 100%; transition: all 0.4s; -webkit-transition: all 0.4s; -o-transition: all 0.4s; -moz-transition: all 0.4s;">fermer le compte</a> !</span></td></tr><tr><td height="60" style="height:60px;min-height:60px;line-height:60px;font-size:1px;border-bottom:2px solid #f2f2f2">&nbsp;</td></tr></tbody></table> </td></tr></tbody></table></td></tr></tbody></table></div></body>`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {

        }
    });
}

exports.sendmailforgotpassword = async (email, key) => {
    var mailOptions = {
        from: `Whatsweb - Réinitialisation<${process.env.USER_AUTH_MAIL}>`,
        to: `${email}`,
        subject: 'Réinitialisation',
        html: `
  <!DOCTYPE html><html><head><title>Réinitialisation mot de passe - WhatsWeb</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" type="text/css" href="https://whatsweb.fr/mailcss/main.css"><link rel="stylesheet" type="text/css" href="https://whatsweb.fr/mailcss/display.css"></head><body>
        <div class="basicCss" style="display: none;"><div class="limiter"><div class="container"><div class="wrap"><div class="image_center" style="max-height: 200px"><img class="image" src="https://whatsweb.fr/img/logo-dark.svg"/></div><span class="title">Demande de réinitialisation du mot de passe</span><span class="txt1">Le lien permettra de vous amener sur une page ou vous pouvez réinitialiser votre mot de passe</span> <div style="width: 100%"><div class="center"><div class="container-btn"><a href="https://beta.
        beta.whatsweb.fr/reset?email=${email}&key=${key}" style="text-decoration: none; font-family: 'Poppins-Regular'; font-weight: bold;" target="_BLANK"><button class="btn" type="submit" name="home" id="home" style="text-decoration: none; font-family: 'Poppins-Regular'; font-weight: bold;">Réinitialiser le mot de passe</button></a></div></div></div><span class="txt1">Ce n’est pas vous qui avez demandé la réinitialisation ?<br> Il vous suffit d’ignorer cet email, ou vous pouvez <a href="beta.https://whatsweb.fr/close?email=${email}&key=${key}">fermer le compte</a> !</span> </div></div></div></div>
        <div class="displayNone" style="display: unset;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" style="width:100%;min-width:100%" width="100%">  
          <tbody>
            <tr>
              <td border="0" cellpadding="0" cellspacing="0" height="1" style="line-height:1px;min-width:375px;width:100%">&nbsp;</td>
            </tr>  
            <tr> 
              <td align="center">   
                <table border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px" width="600"> <tbody>
                  <tr> 
                    <td align="center" style="padding-top:9px"> 
                      <table border="0" cellpadding="0" cellspacing="0" width="100%"> 
                        <tbody>
                          <tr> 
                            <td align="center" style="padding-left:30px;padding-right:30px">  
                              <a href="https://whatsweb.fr" target="_blank"> 
                                <img src="https://whatsweb.fr/logo.png" style="display:block;border:0px;max-width:230px" width="200" > 
                              </a>  
                            </td>
                          </tr> 
                          <tr> 
                            <td height="21" style="height:21px;min-height:21px;line-height:21px">&nbsp;</td> 
                          </tr> 
                          <tr> 
                            <td align="center" style="padding:0 30px"> 
                              <table border="0" cellpadding="0" cellspacing="0" width="100%"> 
                                <tbody>
                                  <tr> 
                                    <td align="center"> 
                                      <h1 style="Margin:0;margin:0;font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:38px;font-weight:700;letter-spacing:0;color:#4c4c4c;text-align:center"> Demande de réinitialisation du mot de passe 
                                      </h1> 
                                    </td> 
                                  </tr> 
                                  <tr> 
                                    <td align="center" style="padding-top:11px"> 
                                      <p style="Margin:0;margin:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;font-weight:400;letter-spacing:0;color:#999999;text-align:center"> Le lien permettra de vous amener sur une page ou vous pouvez réinitialiser votre mot de passe.
                                      </p> 
                                    </td> 
                                  </tr> 
                                  <tr> 
                                    <td height="27" style="height:27px;line-height:27px">&nbsp;</td> 
                                  </tr> 
                                </tbody>
                              </table> 
                            </td> 
                          </tr> 
                        </tbody>
                      </table> 
                    </td> 
                  </tr> 
                </tbody>
              </table>   
              <table border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px" width="600"> 
                <tbody>
                  <tr> 
                    <td align="center"> 
                      <table border="0" cellpadding="0" cellspacing="0" width="100%"> 
                        <tbody>
                          <tr> 
                            <td align="center" style="padding-left:4px;padding-right:4px"> 
                              <div>  
                                <table border="0" cellpadding="0" cellspacing="0" style="width:240px;border-spacing:0;border-collapse:collapse" width="240">
                                  <tbody>
                                    <tr> 
                                      <td align="center" height="43" style="border-collapse:collapse;background-color:#3fb939;border-radius:50px;white-space:nowrap; padding-right: 10px; padding-left: 10px;"> 
                                        <a href="https://beta.whatsweb.fr/reset?email=${email}&key=${key}" style="display:inline-block;width:100%;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:19px;letter-spacing:0.8px;text-transform:uppercase;color:#ffffff;text-align:center;text-decoration:none;background-color:#3fb939;border-radius:50px;border-top:12px solid #3fb939;border-bottom:12px solid #3fb939" target="_blank"> &nbsp;&nbsp;Réinitialiser le mot de passe&nbsp;&nbsp; 
                                        </a> 
                                      </td> 
                                    </tr> 
                                  </tbody>
                                </table> 
                              </div> 
                            </td> 
                          </tr>
                          <tr> 
                            <td align="center" style="padding-top:26px"> 
                              <span class="txt1" style="font-family: Arial,Helvetica,sans-serif;font-size: 15px;line-height: 1.5;color: #999999;text-align: center;width: 100%;">
                                      Ce n’est pas vous qui avez demandé la réinitialisation ?<br> 
                                      Il vous suffit d’ignorer cet email, ou vous pouvez <a class="txt2" href="https://whatsweb.fr/close?email=${email}&key=${key}" style="font-family: Arial,Helvetica,sans-serif;font-size: 15px; line-height: 1.5; color: #666666; text-align: center; width: 100%; transition: all 0.4s; -webkit-transition: all 0.4s; -o-transition: all 0.4s; -moz-transition: all 0.4s;">fermer le compte</a> !
                                    </span> 
                            </td> 
                          </tr>  
                          <tr> 
                            <td height="60" style="height:60px;min-height:60px;line-height:60px;font-size:1px;border-bottom:2px solid #f2f2f2">&nbsp;
                            </td> 
                          </tr> 
                        </tbody>
                      </table> 
                    </td> 
                  </tr> 
                </tbody>
              </table>
            </td> 
          </tr> 
        </tbody>
      </table>  
        </div>
      </body>
      </html>`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            // console.log('Email sent: ' + info.response);
        }
    });
}

exports.sendmailnewsignin = async (email, key, lieux, ip, appareil, date) => {
    var mailOptions = {
        from: `WhatsWeb - Nouvelle connexion à votre compte<${process.env.USER_AUTH_MAIL}>`,
        to: `${email}`,
        subject: 'Nouvelle connexion à votre compte',
        html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" style="font-family:arial, 'helvetica neue', helvetica, sans-serif"> 
         <head> 
          <meta charset="UTF-8"> 
          <meta content="width=device-width, initial-scale=1" name="viewport"> 
          <meta name="x-apple-disable-message-reformatting"> 
          <meta http-equiv="X-UA-Compatible" content="IE=edge"> 
          <meta content="telephone=no" name="format-detection"> 
          <title>WhatsWeb - Nouvelle connexion à votre compte</title>
          <link href="https://fonts.googleapis.com/css?family=Roboto:400,400i,700,700i" rel="stylesheet"><!--<![endif]--> 
          <style type="text/css">
        #outlook a {
            padding:0;
        }
        .es-button {
            mso-style-priority:100!important;
            text-decoration:none!important;
        }
        a[x-apple-data-detectors] {
            color:inherit!important;
            text-decoration:none!important;
            font-size:inherit!important;
            font-family:inherit!important;
            font-weight:inherit!important;
            line-height:inherit!important;
        }
        .es-desk-hidden {
            display:none;
            float:left;
            overflow:hidden;
            width:0;
            max-height:0;
            line-height:0;
            mso-hide:all;
        }
        [data-ogsb] .es-button {
            border-width:0!important;
            padding:10px 20px 10px 20px!important;
        }
        @media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120% } h1 { font-size:30px!important; text-align:left } h2 { font-size:24px!important; text-align:left } h3 { font-size:20px!important; text-align:left } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important; text-align:left } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:24px!important; text-align:left } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important; text-align:left } .es-menu td a { font-size:14px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:13px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:14px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:inline-block!important } a.es-button, button.es-button { font-size:18px!important; display:inline-block!important } .es-adaptive table, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0!important } .es-m-p0r { padding-right:0!important } .es-m-p0l { padding-left:0!important } .es-m-p0t { padding-top:0!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-m-p5 { padding:5px!important } .es-m-p5t { padding-top:5px!important } .es-m-p5b { padding-bottom:5px!important } .es-m-p5r { padding-right:5px!important } .es-m-p5l { padding-left:5px!important } .es-m-p10 { padding:10px!important } .es-m-p10t { padding-top:10px!important } .es-m-p10b { padding-bottom:10px!important } .es-m-p10r { padding-right:10px!important } .es-m-p10l { padding-left:10px!important } .es-m-p15 { padding:15px!important } .es-m-p15t { padding-top:15px!important } .es-m-p15b { padding-bottom:15px!important } .es-m-p15r { padding-right:15px!important } .es-m-p15l { padding-left:15px!important } .es-m-p20 { padding:20px!important } .es-m-p20t { padding-top:20px!important } .es-m-p20r { padding-right:20px!important } .es-m-p20l { padding-left:20px!important } .es-m-p25 { padding:25px!important } .es-m-p25t { padding-top:25px!important } .es-m-p25b { padding-bottom:25px!important } .es-m-p25r { padding-right:25px!important } .es-m-p25l { padding-left:25px!important } .es-m-p30 { padding:30px!important } .es-m-p30t { padding-top:30px!important } .es-m-p30b { padding-bottom:30px!important } .es-m-p30r { padding-right:30px!important } .es-m-p30l { padding-left:30px!important } .es-m-p35 { padding:35px!important } .es-m-p35t { padding-top:35px!important } .es-m-p35b { padding-bottom:35px!important } .es-m-p35r { padding-right:35px!important } .es-m-p35l { padding-left:35px!important } .es-m-p40 { padding:40px!important } .es-m-p40t { padding-top:40px!important } .es-m-p40b { padding-bottom:40px!important } .es-m-p40r { padding-right:40px!important } .es-m-p40l { padding-left:40px!important } }
        </style> 
         </head> 
         <body style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"> 
          <div class="es-wrapper-color" style="background-color:#F6F6F6"><!--[if gte mso 9]>
                    <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                        <v:fill type="tile" color="#f6f6f6"></v:fill>
                    </v:background>
                <![endif]--> 
           <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top"> 
             <tr> 
              <td valign="top" style="padding:0;Margin:0"> 
               <table cellpadding="0" cellspacing="0" class="es-header" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top"> 
                 <tr> 
                  <td align="center" style="padding:0;Margin:0"> 
                   <table bgcolor="#ffffff" class="es-header-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> 
                     <tr> 
                      <td align="left" style="Margin:0;padding-bottom:20px;padding-left:20px;padding-right:20px;padding-top:25px"> 
                       <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> 
                         <tr> 
                          <td align="center" valign="top" style="padding:0;Margin:0;width:560px"> 
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> 
                             <tr> 
                              <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="https://beta.whatsweb.fr/img/logo-dark.svg" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" height="91"></td> 
                             </tr> 
                           </table></td> 
                         </tr> 
                       </table></td> 
                     </tr> 
                   </table></td> 
                 </tr> 
               </table> 
               <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> 
                 <tr> 
                  <td align="center" style="padding:0;Margin:0"> 
                   <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> 
                     <tr> 
                      <td align="left" style="Margin:0;padding-top:20px;padding-left:20px;padding-right:20px;padding-bottom:40px"> 
                       <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> 
                         <tr> 
                          <td align="center" valign="top" style="padding:0;Margin:0;width:560px"> 
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> 
                             <tr> 
                              <td align="left" style="padding:0;Margin:0;padding-bottom:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:-apple-system, blinkmacsystemfont, 'segoe ui', roboto, helvetica, arial, sans-serif, 'apple color emoji', 'segoe ui emoji', 'segoe ui symbol';line-height:24px;color:#333333;font-size:16px">Bonjour,</p></td> 
                             </tr> 
                             <tr> 
                              <td align="left" style="padding:0;Margin:0;padding-bottom:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#333333;font-size:16px">Nous avons remarqué une connexion à votre compte WhatsWeb :<br><span style="color:#15c"><strong><a target="_blank" href="mailto:${email}" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1155cc;font-size:16px">${email}</a></strong></span></p></td> 
                             </tr> 
                             <tr> 
                              <td align="left" style="padding:0;Margin:0;padding-bottom:30px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:23px;color:#333333;font-size:15px"><strong>Lieu:</strong>&nbsp;Près de ${lieux}</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:23px;color:#333333;font-size:15px"><strong>Appareil:</strong>&nbsp;${appareil}<br><strong>IP:</strong>&nbsp;${ip}<br><strong>Heure:</strong>&nbsp;${date}</p></td> 
                             </tr> 
                             <tr> 
                              <td align="left" style="padding:0;Margin:0;padding-bottom:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#333333;font-size:16px">Si vous vous êtes connecté récemment, détendez-vous et chattez bien&nbsp;! Mais si vous ne reconnaissez pas cette connexion, nous vous recommandons de changer immédiatement votre <strong><a target="_blank" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1155cc;font-size:16px" href="https://whatsweb.fr/reset?email=${email}&key=${key}">mot de passe</a></strong>.&nbsp;</p></td> 
                             </tr> 
                             <tr> 
                              <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#333333;font-size:16px">Sincèrement,<br>Votre équipe WhatsWeb</p></td> 
                             </tr> 
                           </table></td> 
                         </tr> 
                       </table></td> 
                     </tr> 
                   </table></td> 
                 </tr> 
               </table></td> 
             </tr> 
           </table> 
          </div>  
         </body>
        </html>`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            // console.log('Email sent: ' + info.response);
        }
    });
}
