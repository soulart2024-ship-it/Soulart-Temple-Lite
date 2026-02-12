#!/usr/bin/env python3
"""
Seed script to create Stripe products and prices for SoulArt Temple membership tiers.
Run this script once to set up the subscription products in Stripe.

Usage: python seed_stripe_products.py
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from stripe_client import get_stripe_client, PRICING_TIERS

def create_products_and_prices():
    stripe = get_stripe_client()
    
    print("Creating SoulArt Temple subscription products in Stripe...")
    
    # Check if products already exist
    existing_products = stripe.Product.search(query="name~'SoulArt'")
    if existing_products.data:
        print(f"Found {len(existing_products.data)} existing SoulArt products:")
        for prod in existing_products.data:
            print(f"  - {prod.name} (ID: {prod.id})")
        
        response = input("\nDo you want to skip creating new products? (y/n): ")
        if response.lower() == 'y':
            print("Skipping product creation.")
            return
    
    created_items = []
    
    # Create Essential (Basic) product
    print("\nCreating Essential membership product...")
    essential_product = stripe.Product.create(
        name="SoulArt Essential Membership",
        description="Unlimited access to Quick Release Decoder, Sacred Journal, and Art Meditation (Doodle Studio). Everything except SoulArt AI Guide.",
        metadata={
            'tier': 'basic',
            'app': 'soulart_temple'
        }
    )
    print(f"  Created product: {essential_product.id}")
    
    # Create Essential monthly price
    essential_monthly_price = stripe.Price.create(
        product=essential_product.id,
        unit_amount=499,
        currency='gbp',
        recurring={'interval': 'month'},
        metadata={
            'tier': 'basic',
            'plan_type': 'monthly'
        }
    )
    print(f"  Created price: £4.99/month - {essential_monthly_price.id}")
    created_items.append(('Essential Monthly', essential_monthly_price.id))
    
    # Create Premium product
    print("\nCreating Premium membership product...")
    premium_product = stripe.Product.create(
        name="SoulArt Premium Membership",
        description="Full access to everything including SoulArt AI Guide, Quick Release Decoder, Sacred Journal, and Art Meditation.",
        metadata={
            'tier': 'premium',
            'app': 'soulart_temple'
        }
    )
    print(f"  Created product: {premium_product.id}")
    
    # Create Premium monthly price
    premium_monthly_price = stripe.Price.create(
        product=premium_product.id,
        unit_amount=699,
        currency='gbp',
        recurring={'interval': 'month'},
        metadata={
            'tier': 'premium',
            'plan_type': 'monthly'
        }
    )
    print(f"  Created price: £6.99/month - {premium_monthly_price.id}")
    created_items.append(('Premium Monthly', premium_monthly_price.id))
    
    # Create Premium 3-month price
    premium_3month_price = stripe.Price.create(
        product=premium_product.id,
        unit_amount=1375,
        currency='gbp',
        recurring={'interval': 'month', 'interval_count': 3},
        metadata={
            'tier': 'premium',
            'plan_type': '3month'
        }
    )
    print(f"  Created price: £13.75/3 months - {premium_3month_price.id}")
    created_items.append(('Premium 3-Month', premium_3month_price.id))
    
    # Create Premium 6-month price
    premium_6month_price = stripe.Price.create(
        product=premium_product.id,
        unit_amount=2500,
        currency='gbp',
        recurring={'interval': 'month', 'interval_count': 6},
        metadata={
            'tier': 'premium',
            'plan_type': '6month'
        }
    )
    print(f"  Created price: £25.00/6 months - {premium_6month_price.id}")
    created_items.append(('Premium 6-Month', premium_6month_price.id))
    
    # Create Premium annual price
    premium_annual_price = stripe.Price.create(
        product=premium_product.id,
        unit_amount=4799,
        currency='gbp',
        recurring={'interval': 'year'},
        metadata={
            'tier': 'premium',
            'plan_type': 'annual'
        }
    )
    print(f"  Created price: £47.99/year - {premium_annual_price.id}")
    created_items.append(('Premium Annual', premium_annual_price.id))
    
    print("\n" + "=" * 60)
    print("STRIPE PRODUCTS AND PRICES CREATED SUCCESSFULLY!")
    print("=" * 60)
    print("\nSave these Price IDs for your application:")
    print("-" * 60)
    for name, price_id in created_items:
        print(f"  {name}: {price_id}")
    print("-" * 60)
    print("\nThese IDs are stored in Stripe and will be fetched dynamically.")
    print("You can also find them in your Stripe Dashboard > Products.")


if __name__ == '__main__':
    try:
        create_products_and_prices()
    except Exception as e:
        print(f"\nError: {e}")
        print("\nMake sure Stripe is connected and you have valid credentials.")
        sys.exit(1)
