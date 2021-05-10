var recipient = '';
var subject = '';
var textbody = '';
var bool = false;

document.addEventListener('DOMContentLoaded', function() {

	// Use buttons to toggle between views
	document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
	document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
	document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
	document.querySelector('#compose').addEventListener('click', () => compose_email(false));
	
	// By default, load the inbox
	load_mailbox('inbox');
});
  
function compose_email(bool) {

	// Show compose view and hide other views
	document.querySelector('#emails-view').style.display = 'none';
	document.querySelector('#compose-view').style.display = 'block';
	document.querySelector('#email-view').style.display = 'none';
	document.querySelector('#container').style.display = 'none';

	if (!bool) {
		recipient = '';
		subject = '';
		textbody = '';
	}
		
	// Clear out composition fields if bool is false or pre-fill the fields with recipient, subjectis, and textbody strings if bool is true (see lines 140-145 below)
	document.querySelector('#compose-recipients').value = recipient;
	document.querySelector('#compose-subject').value = subject;
	document.querySelector('#compose-body').value = textbody;

	// POST request to the /emails route
	document.querySelector('#compose-form').onsubmit = () => {
		fetch('/emails', {
			method: 'POST',
			body: JSON.stringify({
				recipients: document.querySelector('#compose-recipients').value,
				subject: document.querySelector('#compose-subject').value,
				body: document.querySelector('#compose-body').value
			})
		})
		.then(response => response.json())
		.then(result => {
			// Print result of POST request
			console.log(result);
			load_mailbox('sent');
		})
		.catch(error => console.log(error));
		return false;
	}
}

function load_mailbox(mailbox) {

	// Show the mailbox and hide other views
	document.querySelector('#emails-view').style.display = 'block';
	document.querySelector('#compose-view').style.display = 'none';
	document.querySelector('#email-view').style.display = 'none';
	document.querySelector('#container').style.display = 'block';

	// Show the mailbox name
	document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
	
	// Clear the container block
	document.querySelector('#container').innerHTML = '';
	
	// Request to server for the list of email in a mailbox
	fetch(`/emails/${mailbox}`)
	.then(response => response.json())
	.then(emails => {
		// Print emails
		console.log(emails);
		emails.forEach(email => show_email(email));
	})
	.catch(error => console.log(error));
}

// Add an email with given content to mailbox section (#emails-view)
function show_email(email) {

	const element = document.createElement('div');
	element.className = 'row mail';
	element.innerHTML = `<div class="col-md-auto px-1 font-weight-bold">${email['sender']}</div><div class="col-6 px-2">${email['subject']}</div><div class="col text-right px-1 text-secondary">${email['timestamp']}</div>`;
	email['read'] ? element.style.background = '#e5e7e9' : element.style.background = 'white';
	element.onclick = () => {
		const mbox = document.querySelector('#emails-view').innerText;
		if (mbox === 'Inbox') {
			read_status(email);
		}
		get_email(email, mbox);		
	};
	document.querySelector('#container').append(element);
}	

function get_email(email, mbox) {
	// Show the email and hide other views
	document.querySelector('#emails-view').style.display = 'none';
	document.querySelector('#compose-view').style.display = 'none';
	document.querySelector('#email-view').style.display = 'block';
	document.querySelector('#container').style.display = 'none';

	// Clear the email_view block
	let email_view = document.querySelector('#email-view');
	email_view.innerHTML = '';

	// Disclaimer: function fetch(`/emails/${email['id']}`) was not added as all the required information about each email in the given mailbox have been already received from the server). According to the specification, users shall be allowed to get access to a specific email from the respective mailbox (by click on email). Thus, separate GET request to `/emails/<int:email_id>}` would not be required, unless users would be allowed to reach this endpoint immediately through the URL (this option, however, wasn't mentioned in the specification).
	
	// Show email header, buttons and content
	const header = document.createElement('div');
	// header.className = 'emails';
	header.innerHTML = `<b>From:</b> ${email['sender']} <br> <b>To:</b> ${email['recipients']} <br> <b>Subject:</b> ${email['subject']} <br> <b>Timestamp:</b> ${email['timestamp']} <br>`;
	email_view.append(header);
	const btn_reply = document.createElement('button');		
	btn_reply.className = 'btn btn-sm btn-outline-warning mt-2';
	btn_reply.id = 'reply';
	btn_reply.innerHTML = 'Reply';
	email_view.append(btn_reply);

	if (mbox === "Inbox" || mbox === "Archive") {
		const btn_archive = document.createElement('button');		
		btn_archive.className = 'btn btn-sm btn-outline-warning mt-2 mx-2';
		btn_archive.id = "arch";
		email['archived'] === false ? btn_archive.innerHTML = 'Archive' : btn_archive.innerHTML = 'Unarchive';		
		email_view.append(btn_archive);
		document.querySelector('#arch').onclick = () => {
		 	archived_status(email);
		};
	}
	
	const hr = document.createElement('hr');
	email_view.append(hr);
	const text_body = document.createElement('div');
	text_body.id = "t-b";
	text_body.innerHTML = email['body'].replace(/\n/gm, '<br>').replace(/\t/gm, '&emsp;&emsp;');
	email_view.append(text_body);

	// pre-fill recipient, subject, and textbody fields and call compose_email
	document.querySelector('#reply').onclick = () => {
		recipient = `${email['sender']}`;
		email['subject'].startsWith('Re:') ? subject = `${email['subject']}` : subject = `Re: ${email['subject']}`;
		textbody = `\n \n ------------------------ \n "On ${email['timestamp']} ${email['sender']} wrote:" \n ${email['body'].replace(/^/gm, "\t")}`;
		compose_email(true);
	}
}

// Change archived flag for inbox email when the button (id="arch") is clicked
function archived_status(email) {
	let archived_flag;
	email['archived'] ? archived_flag = false : archived_flag = true;
	fetch(`/emails/${email['id']}`, {
		method: 'PUT',
		body: JSON.stringify({
			archived: archived_flag
		})
	})
	.then(() => load_mailbox('inbox'))
	.catch(error => console.log(error));
}

// Change read flag for inbox email when it is clicked
function read_status(email) {
	let read_flag;
	email['read'] ? read_flag = false : read_flag = true;
	fetch(`/emails/${email['id']}`, {
		method: 'PUT',
		body: JSON.stringify({
			read: read_flag
		})
	})
	.catch(error => console.log(error));
}
	

