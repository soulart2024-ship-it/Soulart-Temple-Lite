import os
import requests
import stripe

_connection_settings = None

def get_stripe_credentials():
    """Fetch Stripe credentials from Replit connection API"""
    global _connection_settings
    
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
    
    is_production = os.environ.get('REPLIT_DEPLOYMENT') == '1'
    target_environment = 'production' if is_production else 'development'
    
    response = requests.get(
        f'https://{hostname}/api/v2/connection',
        params={
            'include_secrets': 'true',
            'connector_names': 'stripe',
            'environment': target_environment
        },
        headers={
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': x_replit_token
        }
    )
    
    data = response.json()
    items = data.get('items', [])
    
    if not items:
        raise Exception(f'Stripe {target_environment} connection not found')
    
    _connection_settings = items[0]
    settings = _connection_settings.get('settings', {})
    
    publishable_key = settings.get('publishable')
    secret_key = settings.get('secret')
    
    if not publishable_key or not secret_key:
        raise Exception(f'Stripe {target_environment} keys not found')
    
    return {
        'publishable_key': publishable_key,
        'secret_key': secret_key
    }


def get_stripe_client():
    """Get a configured Stripe client"""
    credentials = get_stripe_credentials()
    stripe.api_key = credentials['secret_key']
    return stripe


def get_stripe_publishable_key():
    """Get the publishable key for frontend use"""
    credentials = get_stripe_credentials()
    return credentials['publishable_key']


def get_stripe_secret_key():
    """Get the secret key for backend use"""
    credentials = get_stripe_credentials()
    return credentials['secret_key']


PRICING_TIERS = {
    'basic_monthly': {
        'name': 'Essential Monthly',
        'price': 499,
        'currency': 'gbp',
        'interval': 'month',
        'interval_count': 1,
        'tier': 'basic',
        'description': 'Unlimited Decoder, Journal & Doodle access'
    },
    'premium_monthly': {
        'name': 'Premium Monthly',
        'price': 699,
        'currency': 'gbp',
        'interval': 'month',
        'interval_count': 1,
        'tier': 'premium',
        'description': 'Full access including SoulArt AI Guide'
    },
    'premium_3month': {
        'name': 'Premium 3-Month',
        'price': 1375,
        'currency': 'gbp',
        'interval': 'month',
        'interval_count': 3,
        'tier': 'premium',
        'description': 'Save 34% - Full access for 3 months'
    },
    'premium_6month': {
        'name': 'Premium 6-Month',
        'price': 2500,
        'currency': 'gbp',
        'interval': 'month',
        'interval_count': 6,
        'tier': 'premium',
        'description': 'Save 40% - Full access for 6 months'
    },
    'premium_annual': {
        'name': 'Premium Annual',
        'price': 4799,
        'currency': 'gbp',
        'interval': 'year',
        'interval_count': 1,
        'tier': 'premium',
        'description': 'Best value - Save 43% - Full access for 12 months'
    }
}
