import secrets
import string
from .models import BotLicense


def generate_license_key():

    def generate_segment():
        """Generate a 4-character alphanumeric segment"""
        chars = string.ascii_uppercase + string.digits
        return ''.join(secrets.choice(chars) for _ in range(4))
    
    # Keep generating until we find a unique key
    max_attempts = 100
    for _ in range(max_attempts):
        # Generate the license key
        segment = generate_segment()
        license_key = f"TXCT-{segment}"
        
        # Check if this key already exists
        if not BotLicense.objects.filter(license_key=license_key).exists():
            return license_key
    
    raise ValueError("Unable to generate a unique license key after maximum attempts")