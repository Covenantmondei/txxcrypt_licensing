from django.db import models
from django.utils import timezone




class Product(models.Model):
    # product_id = models.CharField(max_length=25, unique=True)
    name = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(null=True, blank=True)
    version = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

class BotLicense(models.Model):
    license_key = models.CharField(max_length=9, unique=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    account_id = models.CharField(max_length=25)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(auto_now=True)

    def expired(self):
        return self.expires_at and self.expires_at < timezone.now()

    def __str__(self):
        return f"License {self.license_key} for Product {self.product.name}"