document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function send_email() {

  fetch('emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
    .then(response => response.json())
    .then(result => {
      console.log(result);

      if (result.error) {
        alert(result.error);
      } else {
        load_mailbox('sent');
      }
    });

  // Prevent default form submission
  return false;
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  const emailsView = document.querySelector('#emails-view');

  // Show the mailbox and hide other views
  emailsView.style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  emailsView.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  const emailsList = document.createElement('div');
  emailsView.appendChild(emailsList);
  emailsList.textContent = 'Loading...';

  // Load the mailbox emails
  fetch(`emails/${mailbox}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Could not load ${mailbox}.`);
      }
      return response.json();
    })
    .then(emails => {
      emailsList.innerHTML = '';

      if (emails.length === 0) {
        emailsList.textContent = 'No emails.';
        return;
      }

      emails.forEach(email => {
        const emailBox = document.createElement('div');
        emailBox.className = 'email-box';
        emailBox.style.border = '1px solid #999';
        emailBox.style.padding = '10px';
        emailBox.style.marginBottom = '10px';
        emailBox.style.backgroundColor = email.read ? '#e6e6e6' : 'white';
        emailBox.style.cursor = 'pointer';
        emailBox.addEventListener('click', () => view_email(email.id, mailbox));

        const sender = document.createElement('strong');
        sender.textContent = email.sender;

        const subject = document.createElement('span');
        subject.textContent = ` ${email.subject}`;

        const timestamp = document.createElement('span');
        timestamp.textContent = email.timestamp;
        timestamp.style.float = 'right';

        emailBox.appendChild(sender);
        emailBox.appendChild(subject);
        emailBox.appendChild(timestamp);
        emailsList.appendChild(emailBox);
      });
    })
    .catch(error => {
      emailsList.textContent = error.message;
    });
}

function view_email(email_id, mailbox) {

  const emailView = document.querySelector('#email-view');

  // Show the email and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  emailView.style.display = 'block';
  emailView.textContent = 'Loading...';

  fetch(`emails/${email_id}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Could not load email.');
      }
      return response.json();
    })
    .then(email => {
      emailView.innerHTML = '';

      const sender = document.createElement('p');
      sender.innerHTML = '<strong>From:</strong> ';
      sender.append(email.sender);

      const recipients = document.createElement('p');
      recipients.innerHTML = '<strong>To:</strong> ';
      recipients.append(email.recipients.join(', '));

      const subject = document.createElement('p');
      subject.innerHTML = '<strong>Subject:</strong> ';
      subject.append(email.subject);

      const timestamp = document.createElement('p');
      timestamp.innerHTML = '<strong>Timestamp:</strong> ';
      timestamp.append(email.timestamp);

      const body = document.createElement('div');
      body.style.whiteSpace = 'pre-wrap';
      body.style.marginTop = '20px';
      body.textContent = email.body;

      emailView.appendChild(sender);
      emailView.appendChild(recipients);
      emailView.appendChild(subject);
      emailView.appendChild(timestamp);
      emailView.appendChild(document.createElement('hr'));
      emailView.appendChild(body);

      const replyButton = document.createElement('button');
      replyButton.className = 'btn btn-sm btn-outline-primary mt-3 mr-2';
      replyButton.textContent = 'Reply';
      replyButton.addEventListener('click', () => reply_email(email));
      emailView.appendChild(replyButton);

      if (mailbox !== 'sent') {
        const archiveButton = document.createElement('button');
        archiveButton.className = 'btn btn-sm btn-outline-primary mt-3';
        archiveButton.textContent = mailbox === 'archive' ? 'Unarchive' : 'Archive';
        archiveButton.addEventListener('click', () => {
          fetch(`emails/${email_id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: mailbox !== 'archive'
            })
          })
            .then(() => load_mailbox('inbox'));
        });

        emailView.appendChild(archiveButton);
      }

      if (!email.read) {
        fetch(`emails/${email_id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        });
      }
    })
    .catch(error => {
      emailView.textContent = error.message;
    });
}

function reply_email(email) {

  compose_email();

  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-subject').value = email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`;
  document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
}
