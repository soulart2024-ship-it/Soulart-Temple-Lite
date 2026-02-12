import jwt
import os
import uuid
from functools import wraps
from urllib.parse import urlencode

from flask import g, session, redirect, request, render_template, url_for
from flask_dance.consumer import (
    OAuth2ConsumerBlueprint,
    oauth_authorized,
    oauth_error,
)
from flask_dance.consumer.storage import BaseStorage
from flask_login import LoginManager, login_user, logout_user, current_user
from oauthlib.oauth2.rfc6749.errors import InvalidGrantError
from sqlalchemy.exc import NoResultFound
from werkzeug.local import LocalProxy

login_manager = None

class UserSessionStorage(BaseStorage):

    def __init__(self, db, OAuth):
        self.db = db
        self.OAuth = OAuth

    def get(self, blueprint):
        try:
            token = self.db.session.query(self.OAuth).filter_by(
                user_id=current_user.get_id(),
                browser_session_key=g.browser_session_key,
                provider=blueprint.name,
            ).one().token
        except NoResultFound:
            token = None
        return token

    def set(self, blueprint, token):
        self.db.session.query(self.OAuth).filter_by(
            user_id=current_user.get_id(),
            browser_session_key=g.browser_session_key,
            provider=blueprint.name,
        ).delete()
        new_model = self.OAuth()
        new_model.user_id = current_user.get_id()
        new_model.browser_session_key = g.browser_session_key
        new_model.provider = blueprint.name
        new_model.token = token
        self.db.session.add(new_model)
        self.db.session.commit()

    def delete(self, blueprint):
        self.db.session.query(self.OAuth).filter_by(
            user_id=current_user.get_id(),
            browser_session_key=g.browser_session_key,
            provider=blueprint.name).delete()
        self.db.session.commit()


def make_replit_blueprint(db, User, OAuth):
    try:
        repl_id = os.environ['REPL_ID']
    except KeyError:
        raise SystemExit("the REPL_ID environment variable must be set")

    issuer_url = os.environ.get('ISSUER_URL', "https://replit.com/oidc")

    replit_bp = OAuth2ConsumerBlueprint(
        "replit_auth",
        __name__,
        client_id=repl_id,
        client_secret=None,
        base_url=issuer_url,
        authorization_url_params={
            "prompt": "login consent",
        },
        token_url=issuer_url + "/token",
        token_url_params={
            "auth": (),
            "include_client_id": True,
        },
        auto_refresh_url=issuer_url + "/token",
        auto_refresh_kwargs={
            "client_id": repl_id,
        },
        authorization_url=issuer_url + "/auth",
        use_pkce=True,
        code_challenge_method="S256",
        scope=["openid", "profile", "email", "offline_access"],
        storage=UserSessionStorage(db, OAuth),
    )

    @replit_bp.before_app_request
    def set_applocal_session():
        if '_browser_session_key' not in session:
            session['_browser_session_key'] = uuid.uuid4().hex
        session.modified = True
        g.browser_session_key = session['_browser_session_key']
        g.flask_dance_replit = replit_bp.session

    @replit_bp.route("/logout")
    def logout():
        del replit_bp.token
        logout_user()

        end_session_endpoint = issuer_url + "/session/end"
        encoded_params = urlencode({
            "client_id": repl_id,
            "post_logout_redirect_uri": request.url_root,
        })
        logout_url = f"{end_session_endpoint}?{encoded_params}"

        return redirect(logout_url)

    @replit_bp.route("/error")
    def error():
        return "<h1>Authentication Error</h1><p>There was an error during authentication. Please try again.</p>", 403

    def save_user(user_claims):
        user = User()
        user.id = user_claims['sub']
        user.email = user_claims.get('email')
        user.first_name = user_claims.get('first_name')
        user.last_name = user_claims.get('last_name')
        user.profile_image_url = user_claims.get('profile_image_url')
        merged_user = db.session.merge(user)
        db.session.commit()
        return merged_user

    @oauth_authorized.connect_via(replit_bp)
    def logged_in(blueprint, token):
        if not token:
            return redirect(url_for('replit_auth.error'))
        
        user_claims = jwt.decode(token['id_token'],
                                 options={"verify_signature": False})
        user = save_user(user_claims)
        login_user(user, remember=True)
        blueprint.token = token
        
        next_url = session.pop("next_url", None)
        if next_url and next_url != request.url:
            return redirect(next_url)
        return redirect('/journal.html')

    @oauth_error.connect_via(replit_bp)
    def handle_error(blueprint, error, error_description=None, error_uri=None):
        return redirect(url_for('replit_auth.error'))

    return replit_bp


def require_login(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            next_url = get_next_navigation_url(request)
            return redirect(f'/login.html?next={next_url}')
        
        return f(*args, **kwargs)

    return decorated_function


def get_next_navigation_url(request):
    is_navigation_url = request.headers.get(
        'Sec-Fetch-Mode') == 'navigate' and request.headers.get(
            'Sec-Fetch-Dest') == 'document'
    if is_navigation_url:
        return request.url
    return request.referrer or request.url


def init_login_manager(app, db, User):
    global login_manager
    login_manager = LoginManager(app)

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, str(user_id))

    return login_manager
