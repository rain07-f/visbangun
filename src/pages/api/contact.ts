import type { APIRoute } from 'astro';

export const prerender = false;

interface ContactRequestBody {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  service?: string;
  message?: string;
  honeypot?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Verify Content-Type & parse payload
    const contentType = request.headers.get('content-type') || '';
    let body: ContactRequestBody = {};

    if (contentType.includes('application/json')) {
      body = await request.json().catch(() => ({}));
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData().catch(() => null);
      if (formData) {
        body = {
          name: formData.get('name')?.toString(),
          company: formData.get('company')?.toString(),
          email: formData.get('email')?.toString(),
          phone: formData.get('phone')?.toString(),
          service: formData.get('service')?.toString(),
          message: formData.get('message')?.toString(),
          honeypot: formData.get('honeypot')?.toString(),
        };
      }
    }

    const { name, company, email, phone, service, message, honeypot } = body;

    // 2. Anti-spam honeypot check (silently accept for bots)
    if (honeypot && honeypot.trim().length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Your inquiry has been sent successfully.',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Validation
    const trimmedName = name?.trim() || '';
    const trimmedEmail = email?.trim() || '';
    const trimmedPhone = phone?.trim() || '';
    const trimmedService = service?.trim() || '';
    const trimmedMessage = message?.trim() || '';
    const trimmedCompany = company?.trim() || '';

    if (!trimmedName || trimmedName.length < 2) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Nama wajib diisi (minimal 2 karakter).',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Format alamat email tidak valid.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!trimmedPhone || trimmedPhone.length < 5) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Nomor telepon/WhatsApp wajib diisi.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!trimmedService) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Kategori layanan wajib dipilih.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!trimmedMessage || trimmedMessage.length < 5) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Deskripsi kebutuhan wajib diisi (minimal 5 karakter).',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Construct JetFormBuilder native multipart/form-data request
    const wpFormData = new FormData();
    wpFormData.append('k5VX4t', 'GFZqeND2Zf');
    wpFormData.append('method', 'ajax');
    wpFormData.append('_jet_engine_booking_form_id', '115');
    wpFormData.append('_jet_engine_refer', 'https://be-web.visi-bangun.com/wp-json/wp/v2/pages/9/');
    wpFormData.append('__queried_post_id', '9');
    wpFormData.append('_jfb_current_render_states[]', 'DEFAULT.STATE');

    // Field mapping
    wpFormData.append('name', trimmedName);
    wpFormData.append('company', trimmedCompany);
    wpFormData.append('email', trimmedEmail);
    wpFormData.append('phone', trimmedPhone);
    wpFormData.append('subject', trimmedService);
    wpFormData.append('message', trimmedMessage);

    // 5. Send server-side request to JetFormBuilder native router (do NOT expose WordPress URL to browser)
    const jfbEndpoint = 'https://be-web.visi-bangun.com/?k5VX4t=GFZqeND2Zf&method=ajax';

    const wpResponse = await fetch(jfbEndpoint, {
      method: 'POST',
      body: wpFormData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!wpResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Terjadi gangguan komunikasi dengan server backend. Silakan hubungi kami via WhatsApp atau email.',
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const jfbResult = await wpResponse.json().catch(() => null);

    // 6. Inspect JetFormBuilder response status
    if (jfbResult && (jfbResult.status === 'success' || jfbResult.is_success === true || jfbResult.status === 'reload')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Your inquiry has been sent successfully.',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Safe non-2xx error handling without exposing WordPress internals
    let safeErrorMessage = 'Gagal memproses formulir saat ini. Silakan coba kembali atau hubungi kami langsung.';
    if (jfbResult && jfbResult.status === 'captcha_failed') {
      safeErrorMessage = 'Sistem keamanan backend menolak formulir (Captcha validation failed). Silakan pastikan verifikasi form dinonaktifkan di WordPress.';
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: safeErrorMessage,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Terjadi kesalahan sistem saat memproses inquiry. Silakan hubungi kami via WhatsApp atau email.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

