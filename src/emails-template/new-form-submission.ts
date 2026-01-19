export const newFormSubmissionTemplate = ({
  firstName,
  lastName,
  email,
  interests,
  budget,
  message,
  newsletterSubscribed,
  submissionId,
  attachments,
}: {
  firstName: string;
  lastName: string;
  email: string;
  interests: string[];
  budget: string;
  message: string;
  newsletterSubscribed: boolean;
  submissionId: string;
  attachments: string[];
}) => `  <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #4CAF50;">New Form Submission Received</h2>
            
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Contact Information</h3>
              <p><strong>Name:</strong> ${firstName} ${lastName}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            </div>

            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Submission Details</h3>
              <p><strong>Interests:</strong> ${interests.join(', ')}</p>
              <p><strong>Budget:</strong> ${budget}</p>
              <p><strong>Newsletter Subscribed:</strong> ${newsletterSubscribed ? 'Yes' : 'No'}</p>
            </div>

            ${
              message
                ? `
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Message</h3>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
            `
                : ''
            }

            ${
              attachments && attachments.length > 0
                ? `
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Attachments</h3>
              <ul>
                ${attachments.map((attachment) => `<li>${attachment}</li>`).join('')}
              </ul>
            </div>
            `
                : ''
            }

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="font-size: 12px; color: #666;">
                <strong>Submission ID:</strong> ${submissionId}<br>
                <strong>Timestamp:</strong> ${new Date().toLocaleString()}
              </p>
            </div>
          </body>
        </html>`;
