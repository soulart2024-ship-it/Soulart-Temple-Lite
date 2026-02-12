import os
import json
import requests
from io import BytesIO
from flask import Flask, request, jsonify, send_from_directory, make_response, render_template_string, session, redirect
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import current_user
from datetime import datetime, date, timedelta
from werkzeug.middleware.proxy_fix import ProxyFix
from openai import OpenAI
import stripe

from models import Base, JournalEntry, User, OAuth, GuestUsage, GuestTotalUsage, BookingRequest, DiscoverySession, OracleReading, TIER_FREE, TIER_BASIC, TIER_PREMIUM
from replit_auth import make_replit_blueprint, require_login, init_login_manager
from stripe_client import get_stripe_client, get_stripe_publishable_key, get_stripe_credentials

AI_INTEGRATIONS_OPENAI_API_KEY = os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY")
AI_INTEGRATIONS_OPENAI_BASE_URL = os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL")

openai_client = None
if AI_INTEGRATIONS_OPENAI_API_KEY and AI_INTEGRATIONS_OPENAI_BASE_URL:
    openai_client = OpenAI(
        api_key=AI_INTEGRATIONS_OPENAI_API_KEY,
        base_url=AI_INTEGRATIONS_OPENAI_BASE_URL
    )

SOULART_GUIDE_SYSTEM_PROMPT = """You are the SoulArt Guide, a gentle and compassionate AI companion within SoulArt Temple - a spiritual wellness application focused on emotional healing and self-therapy.

Your core purpose is to:
1. Provide gentle, trauma-aware reflections on what users share
2. Offer 1-3 thoughtful journal prompts to encourage self-inquiry
3. Suggest simple grounding exercises when appropriate (breath work, doodling, colour focus)

IMPORTANT GUIDELINES:
- Be warm, supportive, and nurturing in your tone
- Focus on self-inquiry and helping users remember their own sovereignty
- Never give medical, psychological, or crisis advice
- Never make predictions or tell users who they are
- Always remind users that their inner wisdom is the greatest guide
- Keep responses concise but meaningful (2-4 short paragraphs maximum)
- Use gentle, spiritual language aligned with emotional healing themes
- Reference concepts like trapped emotions, energy, chakras, and frequency when relevant

RESPONSE FORMAT:
Always structure your response with:
1. A brief, empathetic reflection on what the user shared
2. 1-3 journal prompts they can explore
3. An optional grounding suggestion if it feels appropriate

Remember: You are a supportive mirror, not an authority. Help users connect with their own inner knowing."""

db = SQLAlchemy(model_class=Base)

app = Flask(__name__, static_folder='.')
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
CORS(app)

app.secret_key = os.environ.get("SESSION_SECRET") or os.environ.get("FLASK_SECRET_KEY") or "soulart-temple-secret-key"
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False  # Set to True if using HTTPS only
app.config["SESSION_COOKIE_HTTPONLY"] = True

db.init_app(app)

init_login_manager(app, db, User)

app.register_blueprint(make_replit_blueprint(db, User, OAuth), url_prefix="/auth")

DEMO_ACCESS_TOKEN = os.environ.get("DEMO_ACCESS_TOKEN", "")

@app.before_request
def make_session_permanent():
    session.permanent = True

@app.after_request
def add_cache_control_headers(response):
    if request.path.endswith(('.html', '.css', '.js')):
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
    return response

@app.route('/demo/<token>')
def activate_demo_mode(token):
    if DEMO_ACCESS_TOKEN and token == DEMO_ACCESS_TOKEN:
        session['demo_mode'] = True
        session['demo_activated'] = datetime.utcnow().isoformat()
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Demo Mode Activated - SoulArt Temple</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #F5F3EE; color: #1F1F2E; 
                       display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                .container { text-align: center; padding: 40px; background: white; border-radius: 16px; 
                             box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 500px; }
                h1 { color: #C8963E; margin-bottom: 20px; }
                p { color: #666; line-height: 1.6; }
                .btn { display: inline-block; background: #C8963E; color: white; padding: 15px 30px; 
                       border-radius: 8px; text-decoration: none; margin-top: 20px; font-weight: 600; }
                .btn:hover { background: #B8862E; }
                .note { font-size: 0.9em; color: #888; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Demo Mode Activated</h1>
                <p>You now have full Premium access to explore all SoulArt Temple features.</p>
                <p>This includes unlimited Quick Release sessions and the SoulArt AI Guide.</p>
                <a href="/members-dashboard.html" class="btn">Start Exploring</a>
                <p class="note">Demo access is valid for this browser session only.</p>
            </div>
        </body>
        </html>
        """
    else:
        return "Invalid demo token", 403

with app.app_context():
    db.create_all()

@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': {
                'id': current_user.id,
                'email': current_user.email,
                'first_name': current_user.first_name,
                'last_name': current_user.last_name,
                'name': f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email.split('@')[0],
                'profile_image_url': current_user.profile_image_url,
                'membership_tier': current_user.subscription_tier or 'free'
            }
        })
    
    is_demo = session.get('demo_mode', False)
    if is_demo:
        return jsonify({
            'authenticated': True,
            'user': {
                'id': 'demo',
                'email': 'demo@soulart.temple',
                'first_name': 'Demo',
                'last_name': 'User',
                'name': 'Demo User',
                'profile_image_url': None,
                'membership_tier': 'premium',
                'demo_mode': True
            }
        })
    
    return jsonify({'authenticated': False})

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        existing_user = db.session.query(User).filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'An account with this email already exists'}), 400
        
        import uuid
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({'message': 'Account created successfully', 'user_id': user.id}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        from flask_login import login_user
        
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        user = db.session.query(User).filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        login_user(user, remember=True)
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout_api():
    from flask_login import logout_user
    logout_user()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password_api():
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        # For security, always return success even if email doesn't exist
        # In production, this would send a password reset email
        return jsonify({
            'message': 'If an account exists with this email, you will receive reset instructions shortly.'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def index():
    return send_from_directory('.', 'home.html')

@app.route('/welcome.html')
def redirect_welcome():
    return redirect('/home.html', code=301)

@app.route('/videos/<filename>')
def serve_video(filename):
    return send_from_directory('videos', filename, mimetype='video/mp4')

# PWA files
@app.route('/manifest.json')
def serve_manifest():
    return send_from_directory('.', 'manifest.json', mimetype='application/manifest+json')

@app.route('/sw.js')
def serve_service_worker():
    response = send_from_directory('.', 'sw.js', mimetype='application/javascript')
    response.headers['Service-Worker-Allowed'] = '/'
    return response

@app.route('/icons/<filename>')
def serve_icon(filename):
    return send_from_directory('icons', filename)

# Protected premium tool pages - require authentication and correct subscription tier
def requires_premium(user):
    """Check if user has premium tier access"""
    return user.is_authenticated and user.subscription_tier == TIER_PREMIUM

@app.route('/tools/guide.html')
def serve_guide():
    if not current_user.is_authenticated:
        return redirect('/login.html?redirect=tools/guide.html')
    if not requires_premium(current_user):
        return redirect('/membership.html?upgrade=premium')
    return send_from_directory('tools', 'guide.html')

@app.route('/tools/playroom.html')
def serve_playroom():
    if not current_user.is_authenticated:
        return redirect('/login.html?redirect=tools/playroom.html')
    if not requires_premium(current_user):
        return redirect('/membership.html?upgrade=premium')
    return send_from_directory('tools', 'playroom.html')

@app.route('/tools/emotion-decoder.html')
def serve_emotion_decoder():
    if not current_user.is_authenticated:
        return redirect('/login.html?redirect=tools/emotion-decoder.html')
    if not requires_premium(current_user):
        return redirect('/membership.html?upgrade=premium')
    return send_from_directory('tools', 'emotion-decoder.html')

@app.route('/tools/allergy-decoder.html')
def serve_allergy_decoder():
    if not current_user.is_authenticated:
        return redirect('/login.html?redirect=tools/allergy-decoder.html')
    if not requires_premium(current_user):
        return redirect('/membership.html?upgrade=premium')
    return send_from_directory('tools', 'allergy-decoder.html')

@app.route('/tools/belief-decoder.html')
def serve_belief_decoder():
    if not current_user.is_authenticated:
        return redirect('/login.html?redirect=tools/belief-decoder.html')
    if not requires_premium(current_user):
        return redirect('/membership.html?upgrade=premium')
    return send_from_directory('tools', 'belief-decoder.html')

@app.route('/tools/games/<path:game_path>')
def serve_game(game_path):
    # Lotus breath is free access for all users
    if game_path == 'lotus-breath.html':
        return send_from_directory('tools/games', game_path)
    # Other games require premium
    if not current_user.is_authenticated:
        return redirect('/login.html?redirect=tools/games/' + game_path)
    if not requires_premium(current_user):
        return redirect('/membership.html?upgrade=premium')
    return send_from_directory('tools/games', game_path)

# Members dashboard requires login
@app.route('/members-dashboard.html')
def serve_dashboard():
    if not current_user.is_authenticated:
        return redirect('/login.html?redirect=members-dashboard.html')
    return send_from_directory('.', 'members-dashboard.html')

@app.route('/profile.html')
def serve_profile():
    if not current_user.is_authenticated:
        return redirect('/login.html?redirect=profile.html')
    return send_from_directory('.', 'profile.html')

# Free access tools - no login required
@app.route('/tools/journal.html')
def serve_journal():
    return send_from_directory('tools', 'journal.html')

@app.route('/static/markings.html')
def serve_markings():
    return send_from_directory('static', 'markings.html')

@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('.', path)

@app.route('/api/journal/entries', methods=['GET'])
@require_login
def get_entries():
    try:
        entries = db.session.query(JournalEntry).filter_by(user_id=current_user.id).order_by(JournalEntry.created_at.desc()).all()
        return jsonify([entry.to_dict() for entry in entries])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/journal/entries', methods=['POST'])
@require_login
def create_entry():
    try:
        data = request.json
        entry = JournalEntry(
            user_id=current_user.id,
            affirmation=data.get('affirmation', ''),
            general_reflection=data.get('general_reflection', ''),
            feelings=data.get('feelings', ''),
            emotions_released=data.get('emotions_released', ''),
            what_came_up=data.get('what_came_up', ''),
            next_steps=data.get('next_steps', ''),
            emotion_selected=data.get('emotion_selected', ''),
            frequency_tag=data.get('frequency_tag', ''),
            vibration_word=data.get('vibration_word', ''),
            prompt_used=data.get('prompt_used', '')
        )
        db.session.add(entry)
        db.session.commit()
        return jsonify(entry.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/journal/entries/<int:entry_id>', methods=['DELETE'])
@require_login
def delete_entry(entry_id):
    try:
        entry = db.session.get(JournalEntry, entry_id)
        if not entry or entry.user_id != current_user.id:
            return jsonify({'error': 'Entry not found'}), 404
        db.session.delete(entry)
        db.session.commit()
        return jsonify({'message': 'Entry deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/journal/save-doodle', methods=['POST'])
@require_login
def save_doodle():
    try:
        data = request.json
        image_data = data.get('image', '')
        note = data.get('note', '')
        
        if not image_data:
            return jsonify({'success': False, 'error': 'No image data provided'}), 400
        
        from datetime import datetime
        date_str = datetime.now().strftime('%A, %B %d, %Y')
        affirmation_text = f"Art Meditation - {date_str}"
        if note:
            affirmation_text = f"Art Meditation - {date_str}\n\n{note}"
        
        entry = JournalEntry(
            user_id=current_user.id,
            affirmation=affirmation_text,
            general_reflection=note if note else '',
            doodle_image=image_data
        )
        db.session.add(entry)
        db.session.commit()
        return jsonify({'success': True, 'entry_id': entry.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/markings/save', methods=['POST'])
@require_login
def save_markings():
    try:
        data = request.json
        image_data = data.get('image', '')
        
        if not image_data:
            return jsonify({'success': False, 'error': 'No image data provided'}), 400
        
        from datetime import datetime
        date_str = datetime.now().strftime('%A, %B %d, %Y')
        affirmation_text = f"Markings - {date_str}"
        
        entry = JournalEntry(
            user_id=current_user.id,
            affirmation=affirmation_text,
            general_reflection='Created in Markings meditation',
            doodle_image=image_data
        )
        db.session.add(entry)
        db.session.commit()
        return jsonify({'success': True, 'entry_id': entry.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

def generate_pdf_content(entry):
    from weasyprint import HTML
    
    html_template = '''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Journal Entry</title>
        <style>
            @page {
                size: A4;
                margin: 2cm;
            }
            body {
                font-family: 'Segoe UI', Arial, sans-serif;
                color: #1F1F2E;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 3px solid #C8963E;
                padding-bottom: 20px;
            }
            h1 {
                color: #C8963E;
                font-size: 28px;
            }
            .date {
                color: #666;
                font-style: italic;
            }
            .affirmation {
                background: linear-gradient(135deg, rgba(200, 150, 62, 0.15) 0%, rgba(200, 150, 62, 0.05) 100%);
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                border-left: 5px solid #C8963E;
            }
            .affirmation h3 {
                color: #C8963E;
                margin-top: 0;
            }
            .section {
                margin: 20px 0;
                padding: 15px;
                background: #fefdfb;
                border-radius: 8px;
            }
            .section h4 {
                color: #1F1F2E;
                margin-top: 0;
            }
            .tag {
                display: inline-block;
                padding: 5px 12px;
                background: #C8963E;
                color: white;
                border-radius: 15px;
                margin: 5px 5px 5px 0;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🌟 SoulArt Sacred Journal 🌟</h1>
            <p class="date">{{ date }}</p>
        </div>
        
        {% if affirmation %}
        <div class="affirmation">
            <h3>✨ Daily Affirmation</h3>
            <p>{{ affirmation }}</p>
        </div>
        {% endif %}
        
        {% if emotion_selected or frequency_tag or vibration_word %}
        <div style="margin: 20px 0;">
            {% if emotion_selected %}<span class="tag">Emotion: {{ emotion_selected }}</span>{% endif %}
            {% if frequency_tag %}<span class="tag">{{ frequency_tag }}</span>{% endif %}
            {% if vibration_word %}<span class="tag">{{ vibration_word }}</span>{% endif %}
        </div>
        {% endif %}
        
        {% if prompt_used %}
        <div class="section">
            <h4>💭 Journal Prompt</h4>
            <p><em>{{ prompt_used }}</em></p>
        </div>
        {% endif %}
        
        {% if general_reflection %}
        <div class="section" style="background: linear-gradient(135deg, rgba(107, 153, 184, 0.1) 0%, rgba(209, 227, 237, 0.05) 100%); border-left: 5px solid #6B99B8;">
            <h4>💫 Daily Reflection & Insights</h4>
            <p>{{ general_reflection }}</p>
        </div>
        {% endif %}
        
        {% if feelings %}
        <div class="section">
            <h4>💭 How I'm Feeling</h4>
            <p>{{ feelings }}</p>
        </div>
        {% endif %}
        
        {% if what_came_up %}
        <div class="section">
            <h4>🌊 What Came Up</h4>
            <p>{{ what_came_up }}</p>
        </div>
        {% endif %}
        
        {% if emotions_released %}
        <div class="section">
            <h4>🕊️ Emotions Released</h4>
            <p>{{ emotions_released }}</p>
        </div>
        {% endif %}
        
        {% if next_steps %}
        <div class="section">
            <h4>🌱 Next Steps</h4>
            <p>{{ next_steps }}</p>
        </div>
        {% endif %}
    </body>
    </html>
    '''
    
    html = render_template_string(html_template,
        date=entry.created_at.strftime('%B %d, %Y at %I:%M %p'),
        affirmation=entry.affirmation,
        general_reflection=entry.general_reflection,
        feelings=entry.feelings,
        emotions_released=entry.emotions_released,
        what_came_up=entry.what_came_up,
        next_steps=entry.next_steps,
        emotion_selected=entry.emotion_selected,
        frequency_tag=entry.frequency_tag,
        vibration_word=entry.vibration_word,
        prompt_used=entry.prompt_used
    )
    
    return HTML(string=html).write_pdf()

def get_google_drive_access_token():
    hostname = os.environ.get('REPLIT_CONNECTORS_HOSTNAME')
    x_replit_token = os.environ.get('REPL_IDENTITY')
    
    if x_replit_token:
        x_replit_token = 'repl ' + x_replit_token
    else:
        x_replit_token = os.environ.get('WEB_REPL_RENEWAL')
        if x_replit_token:
            x_replit_token = 'depl ' + x_replit_token
    
    if not x_replit_token or not hostname:
        raise Exception('Replit connection credentials not found')
    
    response = requests.get(
        f'https://{hostname}/api/v2/connection?include_secrets=true&connector_names=google-drive',
        headers={
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': x_replit_token
        }
    )
    
    data = response.json()
    items = data.get('items', [])
    
    if not items:
        raise Exception('Google Drive not connected')
    
    connection = items[0]
    access_token = connection.get('settings', {}).get('access_token')
    
    if not access_token:
        oauth_creds = connection.get('settings', {}).get('oauth', {}).get('credentials', {})
        access_token = oauth_creds.get('access_token')
    
    if not access_token:
        raise Exception('Google Drive access token not found')
    
    return access_token

@app.route('/api/journal/entries/<int:entry_id>/pdf', methods=['GET'])
@require_login
def download_pdf(entry_id):
    try:
        entry = db.session.get(JournalEntry, entry_id)
        if not entry or entry.user_id != current_user.id:
            return jsonify({'error': 'Entry not found'}), 404
        
        pdf = generate_pdf_content(entry)
        
        response = make_response(pdf)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=journal_entry_{entry_id}.pdf'
        
        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/journal/entries/<int:entry_id>/upload-to-drive', methods=['POST'])
@require_login
def upload_to_drive(entry_id):
    try:
        entry = db.session.get(JournalEntry, entry_id)
        if not entry or entry.user_id != current_user.id:
            return jsonify({'error': 'Entry not found'}), 404
        
        pdf_content = generate_pdf_content(entry)
        
        access_token = get_google_drive_access_token()
        
        filename = f"SoulArt_Journal_{entry.created_at.strftime('%Y%m%d_%H%M%S')}.pdf"
        
        metadata = {
            'name': filename,
            'mimeType': 'application/pdf'
        }
        
        files = {
            'data': ('metadata', json.dumps(metadata), 'application/json; charset=UTF-8'),
            'file': (filename, BytesIO(pdf_content), 'application/pdf')
        }
        
        response = requests.post(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            headers={'Authorization': f'Bearer {access_token}'},
            files=files
        )
        
        if response.status_code in [200, 201]:
            file_data = response.json()
            return jsonify({
                'success': True,
                'message': 'Journal entry uploaded to Google Drive successfully',
                'file_id': file_data.get('id'),
                'file_name': filename
            })
        else:
            return jsonify({
                'error': 'Failed to upload to Google Drive',
                'details': response.text
            }), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/journal/entries/<int:entry_id>/email', methods=['POST'])
@require_login
def email_pdf(entry_id):
    try:
        entry = db.session.get(JournalEntry, entry_id)
        if not entry or entry.user_id != current_user.id:
            return jsonify({'error': 'Entry not found'}), 404
        
        data = request.json
        email_address = data.get('email')
        
        if not email_address:
            return jsonify({'error': 'Email address is required'}), 400
        
        return jsonify({
            'success': True,
            'message': f'Please download the PDF and email it manually to {email_address}. Automated email sending requires additional setup.',
            'action': 'download_and_email_manually'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Discovery Session API endpoints
def get_or_create_guest_session_id():
    """Ensure guest has a unique session ID for data isolation"""
    import uuid
    guest_id = session.get('guest_discovery_id')
    if not guest_id:
        guest_id = str(uuid.uuid4())
        session['guest_discovery_id'] = guest_id
    return guest_id

@app.route('/api/discovery/sessions', methods=['POST'])
def create_discovery_session():
    try:
        data = request.json or {}
        is_demo = session.get('demo_mode', False)
        
        user_id = None
        guest_session_id = None
        
        if current_user.is_authenticated:
            user_id = current_user.id
        else:
            guest_session_id = get_or_create_guest_session_id()
        
        discovery = DiscoverySession(
            user_id=user_id,
            session_id=guest_session_id,
            blessing_text=data.get('blessing_text'),
            category_counts=json.dumps(data.get('category_counts', {})),
            layers_data=json.dumps(data.get('layers_data', [])),
            session_notes=data.get('session_notes'),
            total_categories=data.get('total_categories', 0),
            total_shadow_count=data.get('total_shadow_count', 0),
            triggered_tool=data.get('triggered_tool'),
            is_demo=is_demo,
            is_completed=data.get('is_completed', False)
        )
        
        if data.get('is_completed'):
            discovery.completed_at = datetime.utcnow()
        
        db.session.add(discovery)
        db.session.commit()
        
        return jsonify(discovery.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/discovery/sessions', methods=['GET'])
def get_discovery_sessions():
    try:
        if current_user.is_authenticated:
            sessions = db.session.query(DiscoverySession).filter_by(
                user_id=current_user.id
            ).order_by(DiscoverySession.started_at.desc()).limit(20).all()
        else:
            guest_session_id = session.get('guest_discovery_id')
            if guest_session_id:
                sessions = db.session.query(DiscoverySession).filter_by(
                    session_id=guest_session_id
                ).order_by(DiscoverySession.started_at.desc()).limit(5).all()
            else:
                sessions = []
        
        return jsonify([s.to_dict() for s in sessions])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/discovery/sessions/latest', methods=['GET'])
def get_latest_discovery_session():
    try:
        if current_user.is_authenticated:
            discovery = db.session.query(DiscoverySession).filter_by(
                user_id=current_user.id
            ).order_by(DiscoverySession.started_at.desc()).first()
        else:
            guest_session_id = session.get('guest_discovery_id')
            if guest_session_id:
                discovery = db.session.query(DiscoverySession).filter_by(
                    session_id=guest_session_id
                ).order_by(DiscoverySession.started_at.desc()).first()
            else:
                discovery = None
        
        if discovery:
            return jsonify(discovery.to_dict())
        return jsonify(None)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/discovery/sessions/<session_id>', methods=['PUT'])
def update_discovery_session(session_id):
    try:
        data = request.json or {}
        
        discovery = db.session.get(DiscoverySession, session_id)
        if not discovery:
            return jsonify({'error': 'Session not found'}), 404
        
        if current_user.is_authenticated:
            if discovery.user_id != current_user.id:
                return jsonify({'error': 'Unauthorized'}), 403
        else:
            guest_session_id = session.get('guest_discovery_id')
            if not guest_session_id or discovery.session_id != guest_session_id:
                return jsonify({'error': 'Unauthorized'}), 403
        
        if 'blessing_text' in data:
            discovery.blessing_text = data['blessing_text']
        if 'category_counts' in data:
            discovery.category_counts = json.dumps(data['category_counts'])
        if 'layers_data' in data:
            discovery.layers_data = json.dumps(data['layers_data'])
        if 'session_notes' in data:
            discovery.session_notes = data['session_notes']
        if 'total_categories' in data:
            discovery.total_categories = data['total_categories']
        if 'total_shadow_count' in data:
            discovery.total_shadow_count = data['total_shadow_count']
        if 'triggered_tool' in data:
            discovery.triggered_tool = data['triggered_tool']
        if 'is_completed' in data:
            discovery.is_completed = data['is_completed']
            if data['is_completed']:
                discovery.completed_at = datetime.utcnow()
        
        db.session.commit()
        return jsonify(discovery.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Oracle Reading API endpoints
@app.route('/api/oracle/readings', methods=['POST'])
@require_login
def save_oracle_reading():
    try:
        data = request.json or {}
        cards_drawn = data.get('cards_drawn', [])
        card_messages = data.get('card_messages', [])
        
        if not cards_drawn:
            return jsonify({'error': 'No cards provided'}), 400
        
        reading = OracleReading(
            user_id=current_user.id,
            cards_drawn=json.dumps(cards_drawn),
            card_messages=json.dumps(card_messages),
            reflection=data.get('reflection')
        )
        
        db.session.add(reading)
        db.session.commit()
        
        return jsonify(reading.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/oracle/readings', methods=['GET'])
@require_login
def get_oracle_readings():
    try:
        readings = db.session.query(OracleReading).filter_by(
            user_id=current_user.id
        ).order_by(OracleReading.created_at.desc()).limit(20).all()
        
        return jsonify([r.to_dict() for r in readings])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/oracle/readings/<int:reading_id>', methods=['PUT'])
@require_login
def update_oracle_reading(reading_id):
    try:
        data = request.json or {}
        reading = db.session.get(OracleReading, reading_id)
        
        if not reading or reading.user_id != current_user.id:
            return jsonify({'error': 'Reading not found'}), 404
        
        if 'reflection' in data:
            reading.reflection = data['reflection']
        
        db.session.commit()
        return jsonify(reading.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


def get_or_create_guest_usage(session_id):
    today = date.today()
    usage = db.session.query(GuestUsage).filter_by(
        session_id=session_id,
        usage_date=today
    ).first()
    
    if not usage:
        usage = GuestUsage(
            session_id=session_id,
            usage_date=today,
            guide_messages=0,
            decoder_uses=0
        )
        db.session.add(usage)
        db.session.commit()
    
    return usage


@app.route('/api/guide/usage', methods=['GET'])
def get_guide_usage():
    try:
        is_demo = session.get('demo_mode', False)
        
        if is_demo:
            return jsonify({
                'can_send': True,
                'remaining': 999,
                'is_member': True,
                'subscription_tier': 'premium',
                'requires_premium': True,
                'has_premium': True,
                'demo_mode': True
            })
        
        if current_user.is_authenticated:
            can_use, remaining = current_user.can_use_guide()
            has_active = current_user.has_active_subscription()
            is_premium = current_user.subscription_tier == TIER_PREMIUM and has_active
            return jsonify({
                'can_send': can_use,
                'remaining': remaining,
                'is_member': has_active,
                'subscription_tier': current_user.subscription_tier,
                'requires_premium': True,
                'has_premium': is_premium
            })
        else:
            return jsonify({
                'can_send': False,
                'remaining': 0,
                'is_member': False,
                'subscription_tier': 'guest',
                'requires_premium': True,
                'has_premium': False
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/guide/chat', methods=['POST'])
def guide_chat():
    try:
        data = request.json
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        if len(user_message) > 500:
            return jsonify({'error': 'Message too long'}), 400
        
        is_demo = session.get('demo_mode', False)
        
        if is_demo:
            pass
        elif current_user.is_authenticated:
            can_use, remaining = current_user.can_use_guide()
            if not can_use:
                return jsonify({
                    'error': 'SoulArt AI Guide is available exclusively for Premium members (£6.99/month).',
                    'upgrade_required': True,
                    'required_tier': 'premium'
                }), 403
            current_user.increment_guide_usage()
            db.session.commit()
        else:
            return jsonify({
                'error': 'Please sign in and upgrade to Premium (£6.99/month) to use the SoulArt AI Guide.',
                'upgrade_required': True,
                'required_tier': 'premium'
            }), 403
        
        if not openai_client:
            return jsonify({'error': 'AI Guide is not configured'}), 503
        
        # the newest OpenAI model is "gpt-5" which was released August 7, 2025.
        # do not change this unless explicitly requested by the user
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SOULART_GUIDE_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            max_tokens=800,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        
        lines = ai_response.split('\n')
        reflection = ""
        journal_prompts = []
        grounding_suggestion = ""
        
        current_section = "reflection"
        
        for line in lines:
            line_lower = line.lower().strip()
            
            if 'journal prompt' in line_lower or 'prompts' in line_lower:
                current_section = "prompts"
                continue
            elif 'grounding' in line_lower or 'suggestion' in line_lower:
                current_section = "grounding"
                continue
            
            line_clean = line.strip()
            if not line_clean:
                continue
            
            if current_section == "reflection":
                if reflection:
                    reflection += " " + line_clean
                else:
                    reflection = line_clean
            elif current_section == "prompts":
                if line_clean.startswith(('-', '•', '*', '1', '2', '3')):
                    prompt = line_clean.lstrip('-•*123456789. ')
                    if prompt:
                        journal_prompts.append(prompt)
            elif current_section == "grounding":
                if grounding_suggestion:
                    grounding_suggestion += " " + line_clean
                else:
                    grounding_suggestion = line_clean.lstrip('-•*')
        
        if not reflection:
            reflection = ai_response
        
        return jsonify({
            'reflection': reflection.strip(),
            'journal_prompts': journal_prompts[:3] if journal_prompts else [],
            'grounding_suggestion': grounding_suggestion.strip() if grounding_suggestion else None
        })
        
    except Exception as e:
        print(f"Guide chat error: {e}")
        return jsonify({'error': 'An error occurred processing your request'}), 500


@app.route('/api/profile', methods=['GET'])
@require_login
def get_profile():
    try:
        journal_count = db.session.query(JournalEntry).filter_by(user_id=current_user.id).count()
        
        return jsonify({
            'id': current_user.id,
            'email': current_user.email,
            'first_name': current_user.first_name,
            'last_name': current_user.last_name,
            'profile_image_url': current_user.profile_image_url,
            'is_member': current_user.is_member,
            'membership_started_at': current_user.membership_started_at.isoformat() if current_user.membership_started_at else None,
            'stats': {
                'journal_entries': journal_count,
                'journal_entries_count': journal_count
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/profile/image', methods=['POST'])
@require_login
def upload_profile_image():
    try:
        MAX_FILE_SIZE = 5 * 1024 * 1024
        
        if request.content_length and request.content_length > MAX_FILE_SIZE:
            return jsonify({'error': 'Image must be less than 5MB'}), 400
        
        if 'profile_image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        file = request.files['profile_image']
        if file.filename == '':
            return jsonify({'error': 'No image selected'}), 400
        
        file.seek(0, 2)
        file_size = file.tell()
        file.seek(0)
        if file_size > MAX_FILE_SIZE:
            return jsonify({'error': 'Image must be less than 5MB'}), 400
        
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
        if ext not in allowed_extensions:
            return jsonify({'error': 'Invalid file type. Allowed: png, jpg, jpeg, gif, webp'}), 400
        
        import uuid
        filename = f"profile_{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
        upload_dir = os.path.join('static', 'uploads', 'profiles')
        os.makedirs(upload_dir, exist_ok=True)
        
        filepath = os.path.join(upload_dir, filename)
        file.save(filepath)
        
        image_url = f'/static/uploads/profiles/{filename}'
        current_user.profile_image_url = image_url
        db.session.commit()
        
        return jsonify({'image_url': image_url, 'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/decoder/usage', methods=['GET'])
def get_decoder_usage():
    try:
        is_demo = session.get('demo_mode', False)
        
        if is_demo:
            return jsonify({
                'can_use': True,
                'remaining': 999,
                'is_member': True,
                'subscription_tier': 'premium',
                'is_total_limit': False,
                'demo_mode': True
            })
        
        if current_user.is_authenticated:
            can_use, remaining = current_user.can_use_decoder()
            return jsonify({
                'can_use': can_use,
                'remaining': remaining,
                'is_member': current_user.has_active_subscription(),
                'subscription_tier': current_user.subscription_tier,
                'is_total_limit': current_user.subscription_tier == TIER_FREE
            })
        else:
            session_id = session.get('guest_id')
            if not session_id:
                import uuid
                session_id = str(uuid.uuid4())
                session['guest_id'] = session_id
            
            usage = get_or_create_guest_total_usage(session_id)
            limit = 3
            remaining = max(0, limit - usage.decoder_total_uses)
            
            return jsonify({
                'can_use': remaining > 0,
                'remaining': remaining,
                'is_member': False,
                'subscription_tier': 'guest',
                'is_total_limit': True
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/decoder/track-use', methods=['POST'])
def track_decoder_use():
    try:
        if current_user.is_authenticated:
            can_use, remaining = current_user.can_use_decoder()
            if can_use:
                current_user.increment_decoder_usage()
                db.session.commit()
                _, new_remaining = current_user.can_use_decoder()
                return jsonify({
                    'success': True,
                    'remaining': new_remaining,
                    'is_total_limit': current_user.subscription_tier == TIER_FREE
                })
            else:
                return jsonify({
                    'error': 'Usage limit reached. Upgrade to continue using the decoder.',
                    'upgrade_required': True
                }), 429
        else:
            session_id = session.get('guest_id')
            if not session_id:
                import uuid
                session_id = str(uuid.uuid4())
                session['guest_id'] = session_id
            
            usage = get_or_create_guest_total_usage(session_id)
            limit = 3
            if usage.decoder_total_uses >= limit:
                return jsonify({
                    'error': 'Free uses exhausted. Sign up for a membership to continue.',
                    'upgrade_required': True
                }), 429
            usage.decoder_total_uses += 1
            db.session.commit()
            return jsonify({
                'success': True,
                'remaining': limit - usage.decoder_total_uses,
                'is_total_limit': True
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/booking', methods=['POST'])
def create_booking():
    try:
        data = request.json
        
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        session_type = data.get('session_type', '').strip()
        
        if not name or not email or not session_type:
            return jsonify({'error': 'Name, email, and session type are required'}), 400
        
        booking = BookingRequest(
            name=name,
            email=email,
            phone=data.get('phone', '').strip() or None,
            session_type=session_type,
            message=data.get('message', '').strip() or None,
            preferred_day=data.get('preferred_day', '').strip() or None,
            preferred_time=data.get('preferred_time', '').strip() or None
        )
        db.session.add(booking)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Your booking request has been received. I will be in touch soon!'
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/bookings', methods=['GET'])
@require_login
def get_bookings():
    try:
        bookings = db.session.query(BookingRequest).order_by(BookingRequest.created_at.desc()).all()
        return jsonify([b.to_dict() for b in bookings])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============== STRIPE SUBSCRIPTION ENDPOINTS ==============

@app.route('/api/stripe/config', methods=['GET'])
def get_stripe_config():
    """Get Stripe publishable key for frontend"""
    try:
        publishable_key = get_stripe_publishable_key()
        return jsonify({'publishableKey': publishable_key})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stripe/products', methods=['GET'])
def get_stripe_products():
    """Get available subscription products and prices"""
    try:
        stripe_client = get_stripe_client()
        
        products = stripe_client.Product.search(query="metadata['app']:'soulart_temple' AND active:'true'")
        
        result = []
        for product in products.data:
            prices = stripe_client.Price.list(product=product.id, active=True)
            
            product_data = {
                'id': product.id,
                'name': product.name,
                'description': product.description,
                'tier': product.metadata.get('tier', 'basic'),
                'prices': []
            }
            
            for price in prices.data:
                recurring = price.recurring or {}
                product_data['prices'].append({
                    'id': price.id,
                    'unit_amount': price.unit_amount,
                    'currency': price.currency,
                    'interval': recurring.get('interval', 'month'),
                    'interval_count': recurring.get('interval_count', 1),
                    'plan_type': price.metadata.get('plan_type', 'monthly')
                })
            
            result.append(product_data)
        
        return jsonify({'products': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stripe/create-checkout-session', methods=['POST'])
@require_login
def create_checkout_session():
    """Create a Stripe checkout session for subscription"""
    try:
        data = request.json
        price_id = data.get('price_id')
        
        if not price_id:
            return jsonify({'error': 'Price ID is required'}), 400
        
        stripe_client = get_stripe_client()
        
        customer_id = current_user.stripe_customer_id
        if not customer_id:
            customer = stripe_client.Customer.create(
                email=current_user.email,
                metadata={
                    'user_id': current_user.id,
                    'app': 'soulart_temple'
                }
            )
            current_user.stripe_customer_id = customer.id
            db.session.commit()
            customer_id = customer.id
        
        domains = os.environ.get('REPLIT_DOMAINS', '').split(',')
        base_url = f"https://{domains[0]}" if domains and domains[0] else 'http://localhost:5000'
        
        checkout_session = stripe_client.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            mode='subscription',
            line_items=[{
                'price': price_id,
                'quantity': 1
            }],
            success_url=f"{base_url}/membership.html?success=true&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{base_url}/membership.html?canceled=true",
            client_reference_id=current_user.id
        )
        
        return jsonify({'url': checkout_session.url})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stripe/customer-portal', methods=['POST'])
@require_login
def create_customer_portal():
    """Create a Stripe customer portal session for managing subscription"""
    try:
        if not current_user.stripe_customer_id:
            return jsonify({'error': 'No subscription found'}), 404
        
        stripe_client = get_stripe_client()
        
        domains = os.environ.get('REPLIT_DOMAINS', '').split(',')
        base_url = f"https://{domains[0]}" if domains and domains[0] else 'http://localhost:5000'
        
        portal_session = stripe_client.billing_portal.Session.create(
            customer=current_user.stripe_customer_id,
            return_url=f"{base_url}/profile.html"
        )
        
        return jsonify({'url': portal_session.url})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stripe/subscription', methods=['GET'])
@require_login
def get_subscription_status():
    """Get current user's subscription status"""
    try:
        return jsonify({
            'subscription_tier': current_user.subscription_tier,
            'tier_display_name': current_user.get_tier_display_name(),
            'has_active_subscription': current_user.has_active_subscription(),
            'stripe_subscription_id': current_user.stripe_subscription_id,
            'subscription_expires_at': current_user.subscription_expires_at.isoformat() if current_user.subscription_expires_at else None,
            'can_use_guide': current_user.can_use_guide()[0],
            'can_use_decoder': current_user.can_use_decoder()[0],
            'decoder_uses_remaining': current_user.can_use_decoder()[1]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stripe/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhook events"""
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    
    if not sig_header:
        return jsonify({'error': 'Missing signature'}), 400
    
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    try:
        stripe_client = get_stripe_client()
        
        if webhook_secret:
            event = stripe_client.webhooks.construct_event(
                payload, sig_header, webhook_secret
            )
            event_type = event.type
            event_data = event.data.object
        else:
            print("WARNING: STRIPE_WEBHOOK_SECRET not set - webhook signatures not verified")
            event = json.loads(payload)
            event_type = event.get('type', '')
            event_data = event.get('data', {}).get('object', {})
        
        print(f"Stripe webhook received: {event_type}")
        
        if event_type == 'checkout.session.completed':
            handle_checkout_completed(event_data)
        
        elif event_type == 'customer.subscription.created':
            handle_subscription_created(event_data)
        
        elif event_type == 'customer.subscription.updated':
            handle_subscription_updated(event_data)
        
        elif event_type == 'customer.subscription.deleted':
            handle_subscription_deleted(event_data)
        
        elif event_type == 'invoice.payment_succeeded':
            handle_payment_succeeded(event_data)
        
        elif event_type == 'invoice.payment_failed':
            handle_payment_failed(event_data)
        
        return jsonify({'received': True}), 200
    
    except Exception as e:
        print(f"Webhook error: {e}")
        return jsonify({'error': str(e)}), 400


def handle_checkout_completed(session_data):
    """Handle successful checkout completion"""
    user_id = session_data.get('client_reference_id')
    subscription_id = session_data.get('subscription')
    customer_id = session_data.get('customer')
    
    if not user_id:
        print("No user_id in checkout session")
        return
    
    user = db.session.get(User, user_id)
    if not user:
        print(f"User not found: {user_id}")
        return
    
    user.stripe_customer_id = customer_id
    user.stripe_subscription_id = subscription_id
    user.membership_started_at = datetime.utcnow()
    
    db.session.commit()
    print(f"Checkout completed for user {user_id}")


def handle_subscription_created(subscription_data):
    """Handle new subscription creation"""
    subscription_id = subscription_data.get('id')
    customer_id = subscription_data.get('customer')
    status = subscription_data.get('status')
    
    user = db.session.query(User).filter_by(stripe_customer_id=customer_id).first()
    if not user:
        print(f"User not found for customer: {customer_id}")
        return
    
    tier = determine_tier_from_subscription(subscription_data)
    
    user.stripe_subscription_id = subscription_id
    user.subscription_tier = tier
    user.is_member = True
    
    current_period_end = subscription_data.get('current_period_end')
    if current_period_end:
        user.subscription_expires_at = datetime.fromtimestamp(current_period_end)
    
    db.session.commit()
    print(f"Subscription created for user {user.id}: tier={tier}")


def handle_subscription_updated(subscription_data):
    """Handle subscription updates (renewals, plan changes)"""
    subscription_id = subscription_data.get('id')
    customer_id = subscription_data.get('customer')
    status = subscription_data.get('status')
    
    user = db.session.query(User).filter_by(stripe_customer_id=customer_id).first()
    if not user:
        print(f"User not found for customer: {customer_id}")
        return
    
    if status in ['active', 'trialing']:
        tier = determine_tier_from_subscription(subscription_data)
        user.subscription_tier = tier
        user.is_member = True
        
        current_period_end = subscription_data.get('current_period_end')
        if current_period_end:
            user.subscription_expires_at = datetime.fromtimestamp(current_period_end)
    
    elif status in ['past_due', 'unpaid']:
        pass
    
    elif status in ['canceled', 'incomplete_expired']:
        user.subscription_tier = TIER_FREE
        user.is_member = False
        user.stripe_subscription_id = None
    
    db.session.commit()
    print(f"Subscription updated for user {user.id}: status={status}")


def handle_subscription_deleted(subscription_data):
    """Handle subscription cancellation"""
    customer_id = subscription_data.get('customer')
    
    user = db.session.query(User).filter_by(stripe_customer_id=customer_id).first()
    if not user:
        print(f"User not found for customer: {customer_id}")
        return
    
    user.subscription_tier = TIER_FREE
    user.is_member = False
    user.stripe_subscription_id = None
    
    db.session.commit()
    print(f"Subscription deleted for user {user.id}")


def handle_payment_succeeded(invoice_data):
    """Handle successful payment (renewal)"""
    subscription_id = invoice_data.get('subscription')
    customer_id = invoice_data.get('customer')
    
    user = db.session.query(User).filter_by(stripe_customer_id=customer_id).first()
    if not user:
        return
    
    print(f"Payment succeeded for user {user.id}")


def handle_payment_failed(invoice_data):
    """Handle failed payment"""
    subscription_id = invoice_data.get('subscription')
    customer_id = invoice_data.get('customer')
    
    user = db.session.query(User).filter_by(stripe_customer_id=customer_id).first()
    if not user:
        return
    
    print(f"Payment failed for user {user.id}")


def determine_tier_from_subscription(subscription_data):
    """Determine the tier based on subscription product metadata"""
    items = subscription_data.get('items', {}).get('data', [])
    if not items:
        return TIER_BASIC
    
    price_data = items[0].get('price', {})
    product_id = price_data.get('product')
    
    try:
        stripe_client = get_stripe_client()
        product = stripe_client.Product.retrieve(product_id)
        tier = product.metadata.get('tier', 'basic')
        
        if tier == 'premium':
            return TIER_PREMIUM
        return TIER_BASIC
    except Exception as e:
        print(f"Error determining tier: {e}")
        return TIER_BASIC


def get_or_create_guest_total_usage(session_id):
    """Get or create guest total usage record (not daily)"""
    usage = db.session.query(GuestTotalUsage).filter_by(session_id=session_id).first()
    
    if not usage:
        usage = GuestTotalUsage(
            session_id=session_id,
            decoder_total_uses=0
        )
        db.session.add(usage)
        db.session.commit()
    
    return usage


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
