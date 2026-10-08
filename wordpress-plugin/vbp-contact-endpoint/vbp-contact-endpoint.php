<?php
/**
 * Plugin Name: VBP Contact Form REST API Endpoint
 * Plugin URI: https://www.visi-bangun.com/
 * Description: Dedicated WordPress REST API endpoint (/wp-json/vbp/v1/contact) for PT. Visi Bangun Perkasa Astro frontend. Handles validation, sanitization, rate limiting, and email dispatch via wp_mail() / WP Mail SMTP.
 * Version: 1.0.0
 * Author: PT. Visi Bangun Perkasa
 * Author URI: https://www.visi-bangun.com/
 * License: GPL-2.0+
 */

if (!defined('ABSPATH')) {
    exit; // Prevent direct access
}

class VBP_Contact_Endpoint {

    const NAMESPACE = 'vbp/v1';
    const ROUTE = '/contact';

    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
        add_action('init', array($this, 'handle_cors_preflight'));
        add_filter('rest_pre_serve_request', array($this, 'add_cors_headers'), 10, 4);
    }

    /**
     * Allowed origins for CORS.
     */
    private function get_allowed_origins() {
        $origins = array(
            'https://www.visi-bangun.com',
            'https://visi-bangun.com',
            'http://localhost:4321',
            'http://localhost:3000',
            'http://127.0.0.1:4321',
            'http://127.0.0.1:3000'
        );

        return apply_filters('vbp_contact_allowed_origins', $origins);
    }

    /**
     * Handle CORS preflight OPTIONS request early.
     */
    public function handle_cors_preflight() {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS' && isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/wp-json/vbp/v1/contact') !== false) {
            $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
            if ($this->is_origin_allowed($origin)) {
                header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
                header('Access-Control-Allow-Methods: POST, OPTIONS');
                header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
                header('Access-Control-Max-Age: 86400');
                status_header(200);
                exit;
            }
        }
    }

    /**
     * Check if given origin is in the allowed list.
     */
    private function is_origin_allowed($origin) {
        if (empty($origin)) {
            return false;
        }
        $allowed = $this->get_allowed_origins();
        return in_array(rtrim($origin, '/'), $allowed, true);
    }

    /**
     * Add CORS headers to REST API responses.
     */
    public function add_cors_headers($served, $result, $request, $server) {
        $route = $request->get_route();
        if (strpos($route, '/vbp/v1/contact') !== false) {
            $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
            if ($this->is_origin_allowed($origin)) {
                header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
                header('Access-Control-Allow-Methods: POST, OPTIONS');
                header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
            }
        }
        return $served;
    }

    /**
     * Register REST API routes.
     */
    public function register_routes() {
        register_rest_route(self::NAMESPACE, self::ROUTE, array(
            'methods'             => WP_REST_Server::CREATABLE, // POST
            'callback'            => array($this, 'handle_submission'),
            'permission_callback' => '__return_true', // Public endpoint
            'args'                => array(
                'name' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'email' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_email',
                ),
                'phone' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'company' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'service' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'subject' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'message' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_textarea_field',
                ),
                'honeypot' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                '_honey' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
            ),
        ));
    }

    /**
     * Get client IP address supporting Cloudflare headers.
     */
    private function get_client_ip() {
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            return sanitize_text_field($_SERVER['HTTP_CF_CONNECTING_IP']);
        }
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return sanitize_text_field(trim($parts[0]));
        }
        return isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field($_SERVER['REMOTE_ADDR']) : '0.0.0.0';
    }

    /**
     * Handle contact form submission.
     */
    public function handle_submission(WP_REST_Request $request) {
        $params = $request->get_params();

        // 1. Anti-spam Honeypot Check
        $honeypot = !empty($params['honeypot']) ? trim($params['honeypot']) : '';
        $honey    = !empty($params['_honey']) ? trim($params['_honey']) : '';
        if (!empty($honeypot) || !empty($honey)) {
            // Silently discard spam submission while simulating success
            return new WP_REST_Response(array(
                'success' => true,
                'message' => 'Your message has been sent successfully.',
            ), 200);
        }

        // 2. Rate Limiting Check (Max 5 submissions per 10 minutes per IP)
        $ip = $this->get_client_ip();
        $transient_key = 'vbp_contact_rate_' . md5($ip);
        $attempts = (int) get_transient($transient_key);

        if ($attempts >= 5) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Too many requests. Please wait a few minutes before submitting again.',
            ), 429);
        }

        // 3. Validation & Length Limits
        $name    = isset($params['name']) ? trim(sanitize_text_field($params['name'])) : '';
        $email   = isset($params['email']) ? trim(sanitize_email($params['email'])) : '';
        $phone   = isset($params['phone']) ? trim(sanitize_text_field($params['phone'])) : '';
        $company = isset($params['company']) ? trim(sanitize_text_field($params['company'])) : '-';
        $service = !empty($params['service']) ? trim(sanitize_text_field($params['service'])) : (!empty($params['subject']) ? trim(sanitize_text_field($params['subject'])) : 'General Inquiry');
        $message = isset($params['message']) ? trim(sanitize_textarea_field($params['message'])) : '';

        if (empty($name) || mb_strlen($name) < 2 || mb_strlen($name) > 100) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Please provide a valid name (2-100 characters).',
            ), 400);
        }

        if (empty($email) || !is_email($email) || mb_strlen($email) > 120) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Please provide a valid email address.',
            ), 400);
        }

        if (empty($phone) || mb_strlen($phone) < 5 || mb_strlen($phone) > 30) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Please provide a valid contact phone number.',
            ), 400);
        }

        if (empty($message) || mb_strlen($message) < 5 || mb_strlen($message) > 4000) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Please provide a detailed requirement description (min. 5 characters).',
            ), 400);
        }

        // Update rate limiting counter (expires in 600s = 10 mins)
        set_transient($transient_key, $attempts + 1, 600);

        // 4. Construct Email
        $recipient_email = apply_filters('vbp_contact_recipient', 'sales@visi-bangun.com');
        $email_subject   = sprintf('[Website Inquiry] %s - %s (%s)', $service, $name, $company !== '-' ? $company : 'Individual');

        // Headers
        $headers = array(
            'Content-Type: text/html; charset=UTF-8',
            sprintf('Reply-To: %s <%s>', $name, $email),
        );

        // Clean HTML Body
        $html_body = $this->build_email_html($name, $email, $phone, $company, $service, $message, $ip);

        // 5. Send via wp_mail() (leveraging WordPress SMTP configuration)
        $sent = wp_mail($recipient_email, $email_subject, $html_body, $headers);

        if (!$sent) {
            error_log('[VBP Contact] wp_mail failed to deliver message to ' . $recipient_email);
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Unable to send your message at this time. Please contact us directly via email or WhatsApp.',
            ), 500);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Your message has been sent successfully. Our team will review your inquiry and contact you shortly.',
        ), 200);
    }

    /**
     * Build branded HTML email body.
     */
    private function build_email_html($name, $email, $phone, $company, $service, $message, $ip) {
        $date = current_time('d F Y, H:i:s T');
        $name_esc    = esc_html($name);
        $email_esc   = esc_html($email);
        $phone_esc   = esc_html($phone);
        $company_esc = esc_html($company);
        $service_esc = esc_html($service);
        $message_esc = nl2br(esc_html($message));
        $date_esc    = esc_html($date);
        $ip_esc      = esc_html($ip);

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f8fb; margin: 0; padding: 24px; color: #102143; }
  .email-container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #dce5ef; box-shadow: 0 4px 14px rgba(7,26,52,0.06); }
  .email-header { background: #071a34; color: #ffffff; padding: 24px 30px; text-align: left; border-bottom: 3px solid #f6b936; }
  .email-header h2 { margin: 0 0 6px 0; font-size: 20px; font-weight: 800; letter-spacing: 0.02em; }
  .email-header p { margin: 0; font-size: 13px; color: #f6b936; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
  .email-body { padding: 30px; }
  .table-data { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .table-data td { padding: 12px 14px; border-bottom: 1px solid #eef3f8; font-size: 14px; vertical-align: top; }
  .table-data td.label { width: 140px; font-weight: 700; color: #071a34; background: #fafbfc; }
  .table-data td.value { color: #334155; }
  .message-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; font-size: 14px; line-height: 1.7; color: #1e293b; margin-top: 10px; }
  .email-footer { background: #051427; padding: 16px 30px; font-size: 12px; color: rgba(255,255,255,0.65); text-align: center; }
</style>
</head>
<body>
<div class="email-container">
  <div class="email-header">
    <p>PT. Visi Bangun Perkasa</p>
    <h2>New Website Inquiry</h2>
  </div>
  <div class="email-body">
    <table class="table-data">
      <tr>
        <td class="label">Name</td>
        <td class="value"><strong>{$name_esc}</strong></td>
      </tr>
      <tr>
        <td class="label">Company</td>
        <td class="value">{$company_esc}</td>
      </tr>
      <tr>
        <td class="label">Email</td>
        <td class="value"><a href="mailto:{$email_esc}">{$email_esc}</a></td>
      </tr>
      <tr>
        <td class="label">Phone / WA</td>
        <td class="value"><a href="https://wa.me/{$phone_esc}">{$phone_esc}</a></td>
      </tr>
      <tr>
        <td class="label">Service</td>
        <td class="value"><span style="background:#fef4dd;color:#975a16;padding:3px 8px;border-radius:4px;font-weight:700;font-size:12px;">{$service_esc}</span></td>
      </tr>
      <tr>
        <td class="label">Submission Date</td>
        <td class="value">{$date_esc} (IP: {$ip_esc})</td>
      </tr>
    </table>

    <div style="font-weight: 700; font-size: 13px; color: #071a34; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Project Requirement:</div>
    <div class="message-box">{$message_esc}</div>
  </div>
  <div class="email-footer">
    &copy; PT. Visi Bangun Perkasa &bull; Automated Inquiry Notification
  </div>
</div>
</body>
</html>
HTML;
    }
}

// Initialize endpoint
new VBP_Contact_Endpoint();
