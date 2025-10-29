from django.contrib import admin
from .models import BotLicense, Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'version', 'created_at')

@admin.register(BotLicense)
class LicenseAdmin(admin.ModelAdmin):
    list_display = ('license_key', 'product', 'account_id', 'is_active', 'expires_at')
    list_filter = ('is_active', 'product')
    search_fields = ('license_key', 'account_id')
