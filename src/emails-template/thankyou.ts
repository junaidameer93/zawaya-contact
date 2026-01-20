export const thankyouTemplate = ({ interests }: { interests: string[] }) => {
  const ASSET_BASE_URL =
    'https://firebasestorage.googleapis.com/v0/b/soll-wallet.firebasestorage.app/o';

  const assets = {
    logo: `${ASSET_BASE_URL}/Logo%20(2).png?alt=media&token=d5b627d1-d7ac-487e-81f4-82a31b74dbbd`,
    signature: `${ASSET_BASE_URL}/signature.png?alt=media&token=060f4c15-d089-4649-a0fb-8ca3867188f8`,
    social_icon_linkedin: `${ASSET_BASE_URL}/social_icon_linkedin.png?alt=media&token=9d65e4c9-ec2c-4d61-a84c-221a86f1753c`,
    logo_footer: `${ASSET_BASE_URL}/logo_footer.png?alt=media&token=edaf4c43-cdf4-41a9-977d-d9a236b154ed`,
  };

  return `<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Thank You for Contacting Zawaya Dao</title>
  <style type="text/css">
    /* Mobile responsive styles */
    @media only screen and (max-width: 600px) {
      body {
        background-color: #ffffff !important;
      }
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .email-padding {
        padding: 30px 20px !important;
      }
      .outer-padding {
        padding: 0 !important;
      }
      .main-container {
        background-color: #ffffff !important;
      }
      .footer-column {
        width: 100% !important;
        display: block !important;
      }
      .footer-right {
        text-align: left !important;
        margin-top: 20px !important;
      }
      .logo-container {
        padding-bottom: 30px !important;
      }
      .header-logo-table {
        width: 120px !important;
      }
      .header-logo-table td {
        width: 120px !important;
      }
      .header-logo-img {
        width: 120px !important;
      }
      .content-text {
        font-size: 15px !important;
        line-height: 22px !important;
      }
      .heading-text {
        font-size: 18px !important;
      }
      .help-box {
        padding: 15px 18px !important;
      }
      img {
        max-width: 100% !important;
        height: auto !important;
      }
    }
  </style>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>

<body
  style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Preheader text -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    Thank you for contacting Zawaya Dao. We've received your inquiry and will get back to you shortly.
  </div>

  <!-- Main container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="main-container" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" class="outer-padding" style="padding: 40px 20px;">

        <!-- Email content wrapper -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="741"
          class="email-container"
          style="max-width: 741px; width: 100%; background-color: #ffffff; border-radius: 20px;">
          <tr>
            <td class="email-padding" style="padding: 48px 46px;">

              <!-- Content container -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">

                <!-- Logo -->
                <tr>
                  <td class="logo-container" style="padding-bottom: 50px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-right: 12px; vertical-align: middle;">
                          <!-- N Logo Icon using styled table -->
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="header-logo-table"
                            style="width: 150px; height: auto;">
                            <tr>
                              <td class="header-logo-table" style="width: 150px; text-align: center; vertical-align: middle;">
                                <img src='${assets.logo}' alt='img-header-logo' class="header-logo-img" style="width: 150px; max-width: 100%; height: auto;"/>

                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td
                          style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 500; color: #000000; line-height: 1.5; letter-spacing: -0.16px;">
                          <p style="margin: 0 0 5px 0;">Hello,</p>
                          <p style="margin: 0;">Thank you for contacting
                            <strong style="font-weight: 700;">Zawaya Dao.</strong>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Main message -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td class="content-text"
                          style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; color: #000000; line-height: 20px; letter-spacing: -0.16px;">
                          <p style="margin: 0 0 20px 0;">We've received your inquiry submitted through our website.</p>
                          <p style="margin: 0;">Our team is currently reviewing your requirements. One of our
                            specialists will get back to you shortly to discuss your needs, provide insights, or suggest
                            next steps.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Second paragraph -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td class="content-text"
                          style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; color: #000000; line-height: 20px; letter-spacing: -0.16px;">
                          <p style="margin: 0 0 20px 0;">If your request is time-sensitive or you would like to share
                            additional details, please feel free to reply to this email.</p>
                          <p style="margin: 0;">We look forward to working with you.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Best regards -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p
                      style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; color: #000000; line-height: 22px; letter-spacing: -0.16px; margin: 0;">
                      Best regards,<br/>
                      <span style="font-weight: 600;">Zawaya Dao Team</span>
                    </p>
                  </td>
                </tr>


                <!-- Visit Blogs Button -->
                <tr>
                  <td style="padding-bottom: 30px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color: #000000; border-radius: 7px; mso-padding-alt: 10px 13px;">
                          <a href="https://www.zawayadao.com/" target="_blank"
                            style="display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500; color: #ffffff; text-decoration: none; padding: 10px 13px; letter-spacing: -0.28px;">Visit
                            our site</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding-bottom: 30px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="height: 1px; background-color: #e5e5e5; font-size: 1px; line-height: 1px;">&nbsp;
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer info section -->
                <tr>
                  <td style="padding-bottom: 40px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td class="footer-column" valign="top" width="50%" style="width: 50%;">
                          <p
                            style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 500; color: #000000; line-height: 1.6; letter-spacing: -0.15px; margin: 0;">
                            Zawaya Dao<br/>
                            IT Consulting &amp; Software Development<br/>
                            office@nextsensesolution.com
                          </p>
                        </td>
                        <td class="footer-column footer-right" valign="top" width="50%" align="right" style="width: 50%; text-align: right;">
                          
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Have a questions box -->
                <tr>
                  <td style="padding-bottom: 30px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                      style="background-color: #f5f5f5; border: 1px solid #e5e5e5;">
                      <tr>
                        <td class="help-box" style="padding: 19px 23px;">
                          <p class="heading-text"
                            style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 600; color: #000000; line-height: 1.4; letter-spacing: -0.2px; margin: 0 0 5px 0;">
                            Have a questions?
                          </p>
                          <p
                            style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; color: #2f2f2f; line-height: 1.4; letter-spacing: -0.14px; margin: 0;">
                            We are here to help, learn more about Zawaya Dao solutions here or <a
                              href="https://www.zawayadao.com/contact-us" target="_blank"
                              style="color: #6b46ff; font-weight: 500; text-decoration: none;">contact us</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Help text -->
                <tr>
                  <td style="padding-bottom: 30px;">
                    <p
                      style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 400; color: #6f6f6f; line-height: 1.5; letter-spacing: -0.12px; margin: 0; text-align: center;">
                      Need Help? Visit our website or email us to learn more. For any inquiries or support, reach out to
                      us at office@nextsensesolution.com<br/>
                      If you wish to unsubscribe from our emails, click <a href="#"
                        style="color: #6f6f6f; text-decoration: underline;">Unsubscribe</a>.
                    </p>
                  </td>
                </tr>

                <!-- Bottom logo and address -->
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="padding-bottom: 15px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="padding-right: 8px; vertical-align: middle;">
                                <!-- N Logo Icon Small -->
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0"
                                  style="width: 80px; height: auto;">
                                  <tr>
                                    <td style="width: 80px; text-align: center; vertical-align: middle;">
                                      <img src='${assets.logo_footer}' alt='img-logo-footer' style="width: 80px; max-width: 100%; height: auto;">
                                    </td>
                                  </tr>
                                </table>
                              </td>

                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                        
                          <p
                            style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 400; color: #000000; line-height: 1.5; letter-spacing: -0.13px; margin: 0; text-align: center;">
                            © ${new Date().getFullYear()} Zawaya Dao
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>

</html>`;
};
