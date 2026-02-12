from datetime import datetime, date
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, Boolean, Date
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase, relationship
from flask_login import UserMixin
from flask_dance.consumer.storage.sqla import OAuthConsumerMixin
from werkzeug.security import generate_password_hash, check_password_hash
from typing import Optional
import uuid

class Base(DeclarativeBase):
    pass

# Membership tiers:
# 'free' - signed up but no paid subscription (doodle, journal, education access)
# 'basic' - £4.99/month (everything except AI Guide)
# 'premium' - £6.99/month (everything including AI Guide)
TIER_FREE = 'free'
TIER_BASIC = 'basic'
TIER_PREMIUM = 'premium'

class User(UserMixin, Base):
    __tablename__ = 'users'
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    first_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    profile_image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        if self.password_hash:
            return check_password_hash(self.password_hash, password)
        return False
    
    # Legacy field - kept for compatibility
    is_member: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    membership_started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # New tiered membership fields
    subscription_tier: Mapped[str] = mapped_column(String(20), default='free', nullable=False)
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    subscription_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Usage tracking - decoder is now TOTAL uses, not daily
    decoder_total_uses: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Guide tracking remains daily for premium users
    guide_messages_today: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    guide_last_message_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # Legacy fields - kept for migration compatibility
    decoder_uses_today: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    decoder_last_use_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    journal_entries = relationship('JournalEntry', back_populates='user', cascade='all, delete-orphan')
    
    def reset_daily_limits_if_needed(self):
        today = date.today()
        if self.guide_last_message_date != today:
            self.guide_messages_today = 0
            self.guide_last_message_date = today
    
    def has_active_subscription(self):
        """Check if user has an active paid subscription"""
        if self.subscription_tier in [TIER_BASIC, TIER_PREMIUM]:
            if self.subscription_expires_at is None:
                return True
            return self.subscription_expires_at > datetime.utcnow()
        return False
    
    def can_use_guide(self):
        """Only premium tier (£6.99/month) can use AI Guide"""
        if self.subscription_tier == TIER_PREMIUM and self.has_active_subscription():
            return True, 999
        # No access for non-premium users
        return False, 0
    
    def can_use_decoder(self):
        """Decoder access based on tier:
        - Guest (not logged in): 3 total uses tracked by session
        - Free member: limited decoder access
        - Basic/Premium: unlimited decoder access
        """
        if self.subscription_tier in [TIER_BASIC, TIER_PREMIUM] and self.has_active_subscription():
            return True, 999
        # Free members and guests have limited total uses
        limit = 3
        remaining = max(0, limit - self.decoder_total_uses)
        return remaining > 0, remaining
    
    def can_use_journal(self):
        """Journal access for all signed-up members (free tier and above)"""
        return True
    
    def can_use_doodle(self):
        """Doodle access for all signed-up members (free tier and above)"""
        return True
    
    def increment_guide_usage(self):
        self.reset_daily_limits_if_needed()
        self.guide_messages_today += 1
    
    def increment_decoder_usage(self):
        """Increment total decoder uses (not daily anymore)"""
        self.decoder_total_uses += 1
    
    def get_tier_display_name(self):
        """Get human-readable tier name"""
        tier_names = {
            TIER_FREE: 'Free Member',
            TIER_BASIC: 'Essential Member (£4.99/month)',
            TIER_PREMIUM: 'Premium Member (£6.99/month)'
        }
        return tier_names.get(self.subscription_tier, 'Guest')
    
    def get_stats(self):
        return {
            'journal_entries_count': len(self.journal_entries) if self.journal_entries else 0,
            'is_member': self.has_active_subscription(),
            'subscription_tier': self.subscription_tier,
            'tier_display_name': self.get_tier_display_name(),
            'membership_started_at': self.membership_started_at.isoformat() if self.membership_started_at else None,
            'subscription_expires_at': self.subscription_expires_at.isoformat() if self.subscription_expires_at else None
        }

class OAuth(OAuthConsumerMixin, Base):
    __tablename__ = 'oauth'
    
    user_id: Mapped[str] = mapped_column(String, ForeignKey(User.id))
    browser_session_key: Mapped[str] = mapped_column(String, nullable=False)
    user = relationship(User)
    
    __table_args__ = (UniqueConstraint(
        'user_id',
        'browser_session_key',
        'provider',
        name='uq_user_browser_session_key_provider',
    ),)

class JournalEntry(Base):
    __tablename__ = 'journal_entries'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey('users.id'), nullable=False)
    affirmation: Mapped[str] = mapped_column(Text, nullable=False)
    general_reflection: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    feelings: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    emotions_released: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    what_came_up: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    next_steps: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    emotion_selected: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    frequency_tag: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    vibration_word: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    prompt_used: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    doodle_image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship('User', back_populates='journal_entries')
    
    def to_dict(self):
        return {
            'id': self.id,
            'affirmation': self.affirmation,
            'general_reflection': self.general_reflection,
            'feelings': self.feelings,
            'emotions_released': self.emotions_released,
            'what_came_up': self.what_came_up,
            'next_steps': self.next_steps,
            'emotion_selected': self.emotion_selected,
            'frequency_tag': self.frequency_tag,
            'vibration_word': self.vibration_word,
            'prompt_used': self.prompt_used,
            'doodle_image': self.doodle_image,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class GuestUsage(Base):
    __tablename__ = 'guest_usage'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    usage_date: Mapped[date] = mapped_column(Date, nullable=False)
    guide_messages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    decoder_uses: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Total decoder uses for this guest (persisted across all sessions)
    decoder_total_uses: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    __table_args__ = (UniqueConstraint(
        'session_id',
        'usage_date',
        name='uq_session_date',
    ),)


class GuestTotalUsage(Base):
    """Track total usage for guests across all time (not daily)"""
    __tablename__ = 'guest_total_usage'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    decoder_total_uses: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class BookingRequest(Base):
    __tablename__ = 'booking_requests'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    session_type: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    preferred_day: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    preferred_time: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default='pending', nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'session_type': self.session_type,
            'message': self.message,
            'preferred_day': self.preferred_day,
            'preferred_time': self.preferred_time,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class OracleReading(Base):
    """Save oracle card readings for users"""
    __tablename__ = 'oracle_readings'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey('users.id'), nullable=False)
    cards_drawn: Mapped[str] = mapped_column(Text, nullable=False)  # JSON array of card titles
    card_messages: Mapped[str] = mapped_column(Text, nullable=False)  # JSON array of messages
    reflection: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship('User', backref='oracle_readings')
    
    def to_dict(self):
        import json
        return {
            'id': self.id,
            'cards_drawn': json.loads(self.cards_drawn) if self.cards_drawn else [],
            'card_messages': json.loads(self.card_messages) if self.card_messages else [],
            'reflection': self.reflection,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class DiscoverySession(Base):
    """Track user discovery sessions for shadow emotion category exploration"""
    __tablename__ = 'discovery_sessions'
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey('users.id'), nullable=True)
    session_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    
    blessing_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category_counts: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    layers_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    session_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    total_categories: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_shadow_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    triggered_tool: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    user = relationship('User', backref='discovery_sessions')
    
    def to_dict(self):
        import json
        return {
            'id': self.id,
            'user_id': self.user_id,
            'blessing_text': self.blessing_text,
            'category_counts': json.loads(self.category_counts) if self.category_counts else {},
            'layers_data': json.loads(self.layers_data) if self.layers_data else [],
            'session_notes': self.session_notes,
            'total_categories': self.total_categories,
            'total_shadow_count': self.total_shadow_count,
            'triggered_tool': self.triggered_tool,
            'is_completed': self.is_completed,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
