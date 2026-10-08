# VBP Contact Form WordPress REST API Plugin

This WordPress plugin registers the dedicated, secure endpoint for the Astro frontend contact form:

```
POST https://be-web.visi-bangun.com/wp-json/vbp/v1/contact
```

## Features
- **Server-side Validation:** Full sanitization and validation of name, email, phone, company, service/subject, and requirement message.
- **Security & Anti-Spam:** Honeypot field detection (`honeypot` / `_honey`) and rate limiting (max 5 requests per 10 minutes per IP).
- **CORS Configured:** Handles `OPTIONS` preflight and restricts allowed origins to `https://www.visi-bangun.com`, `https://visi-bangun.com`, and local development ports.
- **Native wp_mail():** Dispatches branded HTML notifications to `sales@visi-bangun.com` using the WordPress SMTP setup (e.g. WP Mail SMTP).

## Installation
### Method 1: Drop-in as MU-Plugin (Recommended)
Copy `vbp-contact-endpoint.php` into your WordPress installation's `wp-content/mu-plugins/` folder:
```
wp-content/mu-plugins/vbp-contact-endpoint.php
```
It will automatically activate with zero configuration needed.

### Method 2: Standard WordPress Plugin
Compress the `vbp-contact-endpoint` folder into a `.zip` file and upload via:
`WordPress Admin -> Plugins -> Add New -> Upload Plugin -> Activate`.
