from django.contrib import admin
from api.models import (
    Profile, User, Customer, LoyaltyProgram, LoyaltyTransaction,
    Campaign, CampaignInteraction, SupportTicket, TicketComment,
    CustomerInteraction
)

# ==================== User and Profile Admin ====================
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'is_active']
    list_filter = ['is_active', 'is_staff']
    search_fields = ['username', 'email']


class ProfileAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'user', 'verified']
    list_editable = ['verified']
    list_filter = ['verified']
    search_fields = ['full_name', 'user__email']


# ==================== Customer Admin ====================
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['email', 'first_name', 'last_name', 'company_name', 'billing_amount', 'lifetime_value']
    list_filter = ['company_name', 'date_of_purchase', 'created_at']
    search_fields = ['email', 'first_name', 'last_name', 'company_name']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Contact Information', {
            'fields': ('first_name', 'last_name', 'email', 'phone')
        }),
        ('Company Information', {
            'fields': ('company_name',),
        }),
        ('Address', {
            'fields': ('address', 'city', 'state', 'zipcode', 'country')
        }),
        ('Transaction Details', {
            'fields': ('date_of_purchase', 'billing_amount')
        }),
        ('Customer Details', {
            'fields': ('source', 'assigned_to')
        }),
        ('Metrics', {
            'fields': ('lifetime_value', 'total_purchases', 'last_contact')
        }),
        ('Additional Info', {
            'fields': ('notes', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# ==================== Loyalty Program Admin ====================
class LoyaltyTransactionInline(admin.TabularInline):
    model = LoyaltyTransaction
    extra = 0
    readonly_fields = ['transaction_date']


class LoyaltyProgramAdmin(admin.ModelAdmin):
    list_display = ['customer', 'tier', 'total_points', 'points_balance', 'enrollment_date']
    list_filter = ['tier', 'enrollment_date']
    search_fields = ['customer__email']
    inlines = [LoyaltyTransactionInline]
    readonly_fields = ['enrollment_date', 'last_points_earned', 'last_points_redeemed']


class LoyaltyTransactionAdmin(admin.ModelAdmin):
    list_display = ['loyalty_program', 'transaction_type', 'points', 'transaction_date']
    list_filter = ['transaction_type', 'transaction_date']
    search_fields = ['loyalty_program__customer__email', 'reference_id']
    readonly_fields = ['transaction_date']


# ==================== Campaign Admin ====================
class CampaignInteractionInline(admin.TabularInline):
    model = CampaignInteraction
    extra = 0
    readonly_fields = ['interaction_date']


class CampaignAdmin(admin.ModelAdmin):
    list_display = ['name', 'campaign_type', 'status', 'sent_count', 'open_rate', 'click_rate', 'created_at']
    list_filter = ['campaign_type', 'status', 'created_at']
    search_fields = ['name', 'subject_line']
    readonly_fields = ['sent_count', 'opened_count', 'clicked_count', 'conversion_count', 'created_at', 'open_rate', 'click_rate']
    filter_horizontal = ['customers']
    fieldsets = (
        ('Campaign Details', {
            'fields': ('name', 'description', 'campaign_type', 'status')
        }),
        ('Target Audience', {
            'fields': ('customers', 'target_tier', 'target_customer_type')
        }),
        ('Content', {
            'fields': ('subject_line', 'content', 'call_to_action')
        }),
        ('Incentives', {
            'fields': ('discount_amount', 'discount_percentage', 'loyalty_points_reward'),
            'classes': ('collapse',)
        }),
        ('Schedule', {
            'fields': ('scheduled_date', 'start_date', 'end_date', 'created_at')
        }),
        ('Analytics', {
            'fields': ('total_recipients', 'sent_count', 'opened_count', 'clicked_count', 'conversion_count', 'open_rate', 'click_rate'),
            'classes': ('collapse',)
        }),
        ('Author', {
            'fields': ('created_by',),
            'classes': ('collapse',)
        }),
    )


class CampaignInteractionAdmin(admin.ModelAdmin):
    list_display = ['campaign', 'customer', 'interaction_type', 'interaction_date']
    list_filter = ['interaction_type', 'interaction_date']
    search_fields = ['campaign__name', 'customer__email']
    readonly_fields = ['interaction_date']


# ==================== Support Ticket Admin ====================
class TicketCommentInline(admin.TabularInline):
    model = TicketComment
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['ticket_id', 'customer', 'subject', 'priority', 'status', 'assigned_to', 'created_at']
    list_filter = ['priority', 'status', 'category', 'created_at']
    search_fields = ['ticket_id', 'customer__email', 'subject']
    readonly_fields = ['ticket_id', 'created_at', 'updated_at']
    inlines = [TicketCommentInline]
    fieldsets = (
        ('Ticket Information', {
            'fields': ('ticket_id', 'customer', 'subject', 'description')
        }),
        ('Classification', {
            'fields': ('category', 'priority', 'status')
        }),
        ('Assignment & Dates', {
            'fields': ('assigned_to', 'created_at', 'updated_at', 'resolved_at')
        }),
        ('Resolution', {
            'fields': ('resolution_notes', 'customer_satisfaction'),
            'classes': ('collapse',)
        }),
    )


class TicketCommentAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'author', 'created_at', 'is_internal']
    list_filter = ['is_internal', 'created_at']
    search_fields = ['ticket__ticket_id', 'author__username']
    readonly_fields = ['created_at', 'updated_at']


# ==================== Customer Interaction Admin ====================
class CustomerInteractionAdmin(admin.ModelAdmin):
    list_display = ['customer', 'interaction_type', 'subject', 'user', 'interaction_date']
    list_filter = ['interaction_type', 'interaction_date', 'follow_up_required']
    search_fields = ['customer__email', 'subject']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Interaction Details', {
            'fields': ('customer', 'interaction_type', 'subject', 'description')
        }),
        ('User & Dates', {
            'fields': ('user', 'interaction_date', 'created_at')
        }),
        ('Follow-up', {
            'fields': ('follow_up_required', 'follow_up_date'),
            'classes': ('collapse',)
        }),
    )


# ==================== Register Models ====================
admin.site.register(User, UserAdmin)
admin.site.register(Profile, ProfileAdmin)
admin.site.register(Customer, CustomerAdmin)
admin.site.register(LoyaltyProgram, LoyaltyProgramAdmin)
admin.site.register(LoyaltyTransaction, LoyaltyTransactionAdmin)
admin.site.register(Campaign, CampaignAdmin)
admin.site.register(CampaignInteraction, CampaignInteractionAdmin)
admin.site.register(SupportTicket, SupportTicketAdmin)
admin.site.register(TicketComment, TicketCommentAdmin)
admin.site.register(CustomerInteraction, CustomerInteractionAdmin)